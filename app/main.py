"""P2B centralized business portal. Run with one process for development;
PostgreSQL is recommended in production. Financial records are operational data,
not BLU accounting journals. """
import os, json, hashlib, hmac, secrets, time, uuid
from datetime import datetime, timedelta, timezone, date
from contextlib import asynccontextmanager
from typing import Any
from fastapi import FastAPI, Depends, HTTPException, Header, Request, Response
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, Column, String, Integer, Boolean, DateTime, ForeignKey, JSON, Text, select, func, UniqueConstraint
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import IntegrityError
import jwt

DEFAULT_SQLITE = 'sqlite:////tmp/p2b.db' if os.environ.get('VERCEL') else 'sqlite:///./p2b.db'
DB = os.environ.get('DATABASE_URL', DEFAULT_SQLITE)
if DB.startswith('postgres://'): DB = DB.replace('postgres://','postgresql+psycopg://',1)
if DB.startswith('postgresql://'): DB = DB.replace('postgresql://','postgresql+psycopg://',1)
SECRET = os.environ.get('APP_SECRET','a8f9c1b3e7d5420194857bca1938502847592837495827364510293847561029')
IS_PROD = os.environ.get('APP_ENV','development') == 'production'
if IS_PROD and len(SECRET)<32: raise RuntimeError('APP_SECRET wajib minimal 32 karakter pada production')
engine=create_engine(DB,pool_pre_ping=True,connect_args={'check_same_thread':False} if DB.startswith('sqlite:') else {})
SessionLocal=sessionmaker(engine,expire_on_commit=False)
Base=declarative_base()
UTC=lambda:datetime.now(timezone.utc)
ROLES={'kepala','sekretaris','manajer_operasional','manajer_keuangan','manajer_it','kepala_divisi','operator','viewer'}
MODULES={'pks','tagihan','tugas','laundry','rumah_reservasi','rumah_transaksi','rumah_stok','kantin','persewaan','kinerja_divisi','berita','kontak'}
DIVS={'komersial','klinik','uin_press','pendidikan','lph','halal_center','p2b'}
BASE_OPS={'pks','tagihan','tugas','laundry','rumah_reservasi','rumah_transaksi','rumah_stok','kantin','persewaan','kinerja_divisi'}
MODULE_DIV={ 'laundry':'komersial','rumah_reservasi':'komersial','rumah_transaksi':'komersial','rumah_stok':'komersial','kantin':'komersial','persewaan':'komersial'}

class User(Base):
 __tablename__='users'
 id=Column(String,primary_key=True,default=lambda:str(uuid.uuid4()))
 username=Column(String(100),unique=True,nullable=False,index=True)
 name=Column(String(200),nullable=False)
 hash=Column(String(300),nullable=False)
 role=Column(String(40),nullable=False)
 division=Column(String(40),nullable=False,default='p2b')
 active=Column(Boolean,nullable=False,default=True)
 created_at=Column(DateTime(timezone=True),default=UTC)

class Record(Base):
 __tablename__='records'
 id=Column(String,primary_key=True,default=lambda:str(uuid.uuid4()))
 module=Column(String(50),index=True,nullable=False)
 division=Column(String(50),index=True,nullable=False)
 data=Column(JSON,nullable=False)
 created_by=Column(String,ForeignKey('users.id'),nullable=False)
 updated_by=Column(String,ForeignKey('users.id'),nullable=False)
 created_at=Column(DateTime(timezone=True),default=UTC)
 updated_at=Column(DateTime(timezone=True),default=UTC,index=True)
 __table_args__=(UniqueConstraint('module','id',name='uq_record_module_id'),)

class Audit(Base):
 __tablename__='audit'
 id=Column(Integer,primary_key=True,autoincrement=True)
 actor=Column(String,nullable=False)
 action=Column(String,nullable=False)
 module=Column(String,nullable=False)
 record_id=Column(String,nullable=False)
 at=Column(DateTime(timezone=True),default=UTC)
 detail=Column(JSON,nullable=False,default=dict)

class Settings(Base):
 __tablename__='settings'
 key=Column(String,primary_key=True)
 value=Column(JSON,nullable=False)

def init_db():
 Base.metadata.create_all(engine)
 with SessionLocal() as db:
  if not db.scalar(select(func.count()).select_from(User)):
   uname=os.environ.get('BOOTSTRAP_ADMIN_USERNAME','kepala.p2b')
   password=os.environ.get('BOOTSTRAP_ADMIN_PASSWORD','AdminP2B#2026!UIN')
   if uname and len(password)>=12:
    db.add(User(username=uname,name='Administrator Awal P2B',hash=make_hash(password),role='kepala',division='p2b'))
    db.commit()

@asynccontextmanager
async def lifespan(app):
 init_db()
 yield

app=FastAPI(title='Portal P2B Terintegrasi',version='1.0.0',lifespan=lifespan,docs_url=None if IS_PROD else '/api/docs',redoc_url=None)
app.mount('/static',StaticFiles(directory=os.path.join(os.path.dirname(__file__),'static')),name='static')

_DB_READY=False
def dbget():
 global _DB_READY
 if not _DB_READY:
  init_db()
  _DB_READY=True
 with SessionLocal() as db: yield db

def make_hash(password:str)->str:
 salt=secrets.token_bytes(16)
 hashed=hashlib.pbkdf2_hmac('sha256',password.encode(),salt,310000)
 return f'pbkdf2_sha256$310000${salt.hex()}${hashed.hex()}'
def check_hash(password:str,stored:str)->bool:
 try:
  _,rounds,salt,digest=stored.split('$')
  result=hashlib.pbkdf2_hmac('sha256',password.encode(),bytes.fromhex(salt),int(rounds))
  return hmac.compare_digest(result,bytes.fromhex(digest))
 except Exception:return False

def auth(authorization: str|None=Header(None), db:Session=Depends(dbget))->User:
 if not authorization or not authorization.startswith('Bearer '):raise HTTPException(401,'Login diperlukan')
 try:
  payload=jwt.decode(authorization[7:],SECRET,algorithms=['HS256'],options={'require':['exp','sub']})
  user=db.get(User,payload['sub'])
  if not user or not user.active:raise ValueError('nonaktif')
  return user
 except Exception: raise HTTPException(401,'Sesi kedaluwarsa atau tidak valid')

def admin(user:User=Depends(auth)):
 if user.role!='kepala':raise HTTPException(403,'Hanya Kepala P2B')
 return user

def can(user:User,module:str,division:str,write=False):
 if user.role=='kepala':return True
 if user.role=='manajer_keuangan':return (module in BASE_OPS and (not write or module not in {'rumah_reservasi','rumah_stok'}))
 if user.role=='sekretaris':return module in {'pks','tugas','berita','kontak'} or (not write and module in BASE_OPS)
 if user.role=='manajer_operasional':return module in BASE_OPS or module=='berita'
 if user.role=='manajer_it':return module=='berita' or (not write and module in MODULES)
 if user.role=='kepala_divisi':return (division==user.division and module in BASE_OPS) or (not write and module=='berita')
 if user.role=='operator':return division==user.division and module in BASE_OPS
 if user.role=='viewer':return not write and division==user.division and module in BASE_OPS
 return False

def division_for(module:str,body:dict)->str:
 if module in MODULE_DIV:return MODULE_DIV[module]
 if module in {'pks','tagihan','tugas','kinerja_divisi'}:
  d=body.get('division','komersial')
  if d not in DIVS: raise HTTPException(422,'Divisi tidak valid')
  return d
 if module=='berita':return 'p2b'
 if module=='kontak':return 'p2b'
 raise HTTPException(404,'Modul tidak diketahui')

def validate(module,body):
 if not isinstance(body,dict):raise HTTPException(422,'Payload data harus objek')
 if len(json.dumps(body,ensure_ascii=False))>120000:raise HTTPException(413,'Data terlalu besar')
 if module in {'laundry','rumah_transaksi','kantin'}:
  val=body.get('amount',0)
  if not isinstance(val,(int,float)) or val<0 or val>1e13:raise HTTPException(422,'Nominal tidak valid')
 if module=='tagihan':
  val=body.get('amount',0)
  if not isinstance(val,(int,float)) or val<0 or val>1e13:raise HTTPException(422,'Nilai tagihan tidak valid')
  payments=body.get('payments',[])
  if not isinstance(payments,list) or any(not isinstance(p,dict) or not isinstance(p.get('amount'),(int,float)) or p['amount']<=0 for p in payments):raise HTTPException(422,'Pembayaran tidak valid')
 if module=='rumah_reservasi':
  if body.get('start','')>=body.get('end',''):raise HTTPException(422,'Tanggal selesai harus setelah mulai')
 if module=='persewaan':
  if body.get('start','')>=body.get('end',''):raise HTTPException(422,'Tanggal selesai harus setelah mulai')

def audit(db,user,action,module,rid,detail=None):db.add(Audit(actor=user.id,action=action,module=module,record_id=rid,detail=detail or {}))

class Credentials(BaseModel):
 username:str
 password:str
class NewUser(BaseModel):
 username:str=Field(min_length=3,max_length=100)
 name:str=Field(min_length=2,max_length=200)
 password:str=Field(min_length=12,max_length=128)
 role:str
 division:str='p2b'
class UpdateUser(BaseModel):
 name:str|None=None
 role:str|None=None
 division:str|None=None
 active:bool|None=None
 password:str|None=None
class RecordInput(BaseModel):
 data:dict[str,Any]
class ImportInput(BaseModel):
 module:str
 rows:list[dict[str,Any]]=Field(max_length=3000)

@app.get('/')
def home():return FileResponse(os.path.join(os.path.dirname(__file__),'static','index.html'))
@app.get('/api/health')
def health():return {'ok':True,'service':'p2b'}
@app.post('/api/login')
def login(creds:Credentials,response:Response,db:Session=Depends(dbget)):
 user=db.scalar(select(User).where(User.username==creds.username))
 if not user or not user.active or not check_hash(creds.password,user.hash):
  time.sleep(.3);raise HTTPException(401,'Username atau password salah')
 token=jwt.encode({'sub':user.id,'exp':UTC()+timedelta(hours=8)},SECRET,algorithm='HS256')
 response.headers['Cache-Control']='no-store'
 return {'access_token':token,'user':serialize_user(user)}

def serialize_user(u):return {'id':u.id,'username':u.username,'name':u.name,'role':u.role,'division':u.division,'active':u.active}
@app.get('/api/me')
def me(user:User=Depends(auth)):return serialize_user(user)
@app.get('/api/users')
def list_users(user:User=Depends(admin),db:Session=Depends(dbget)):
 return [serialize_user(u) for u in db.scalars(select(User).order_by(User.username))]
@app.post('/api/users')
def create_user(item:NewUser,user:User=Depends(admin),db:Session=Depends(dbget)):
 if item.role not in ROLES or item.division not in DIVS:raise HTTPException(422,'Peran/divisi tidak valid')
 u=User(username=item.username.strip(),name=item.name.strip(),hash=make_hash(item.password),role=item.role,division=item.division)
 db.add(u)
 try:db.commit()
 except IntegrityError:db.rollback();raise HTTPException(409,'Username telah digunakan')
 return serialize_user(u)
@app.patch('/api/users/{uid}')
def update_user(uid:str,item:UpdateUser,user:User=Depends(admin),db:Session=Depends(dbget)):
 u=db.get(User,uid)
 if not u:raise HTTPException(404,'Pengguna tidak ditemukan')
 for f in ('name','role','division','active'):
  v=getattr(item,f)
  if v is not None:
   if f=='role' and v not in ROLES or f=='division' and v not in DIVS:raise HTTPException(422,'Peran/divisi tidak valid')
   if u.id==user.id and f in {'role','active'} and (v!='kepala' if f=='role' else not v):raise HTTPException(422,'Tidak dapat menonaktifkan akses Kepala yang sedang login')
   setattr(u,f,v)
 if item.password:
  if len(item.password)<12:raise HTTPException(422,'Password minimal 12 karakter')
  u.hash=make_hash(item.password)
 db.commit();return serialize_user(u)

@app.get('/api/records/{module}')
def list_records(module:str,user:User=Depends(auth),db:Session=Depends(dbget)):
 if module not in MODULES:raise HTTPException(404,'Modul tidak ditemukan')
 rows=db.scalars(select(Record).where(Record.module==module).order_by(Record.updated_at.desc()).limit(6000)).all()
 return [{'id':r.id,'module':r.module,'division':r.division,'data':r.data,'updated_at':r.updated_at.isoformat() if r.updated_at else None} for r in rows if can(user,r.module,r.division)]

def overlap(db,module,body,except_id=None):
 # Restrict collisions on the same rentable asset for active reservations
 if module not in {'rumah_reservasi','persewaan'}:return
 if body.get('status') in {'Dibatalkan','Batal'}:return
 aid=body.get('assetId') if module=='rumah_reservasi' else body.get('asset')
 if not aid:return
 for row in db.scalars(select(Record).where(Record.module==module)).all():
  if row.id==except_id:continue
  d=row.data
  if d.get('status') in {'Dibatalkan','Batal'}:continue
  same=(d.get('assetId') if module=='rumah_reservasi' else d.get('asset'))==aid
  if same and body['start']<d.get('end','') and d.get('start','')<body['end']:
   raise HTTPException(409,'Fasilitas sudah terpesan untuk periode tersebut')

@app.post('/api/records/{module}')
def create_record(module:str,item:RecordInput,user:User=Depends(auth),db:Session=Depends(dbget)):
 if module not in MODULES:raise HTTPException(404,'Modul tidak ditemukan')
 division=division_for(module,item.data)
 if not can(user,module,division,True):raise HTTPException(403,'Tidak memiliki hak menulis modul/divisi ini')
 validate(module,item.data);overlap(db,module,item.data)
 r=Record(module=module,division=division,data=item.data,created_by=user.id,updated_by=user.id)
 db.add(r);db.flush();audit(db,user,'create',module,r.id);db.commit()
 return {'id':r.id}
@app.put('/api/records/{module}/{rid}')
def update_record(module:str,rid:str,item:RecordInput,user:User=Depends(auth),db:Session=Depends(dbget)):
 r=db.get(Record,rid)
 if not r or r.module!=module:raise HTTPException(404,'Data tidak ditemukan')
 division=division_for(module,item.data)
 if not can(user,module,r.division,True) or not can(user,module,division,True):raise HTTPException(403,'Hak akses tidak cukup')
 validate(module,item.data);overlap(db,module,item.data,rid)
 r.data=item.data;r.division=division;r.updated_by=user.id;r.updated_at=UTC();audit(db,user,'update',module,rid);db.commit()
 return {'id':rid}
@app.delete('/api/records/{module}/{rid}')
def delete_record(module:str,rid:str,user:User=Depends(auth),db:Session=Depends(dbget)):
 r=db.get(Record,rid)
 if not r or r.module!=module:raise HTTPException(404,'Data tidak ditemukan')
 if not can(user,module,r.division,True):raise HTTPException(403,'Tidak berwenang')
 # Financial deletion restricted to kepala or manager finance; others use cancellation instead
 if module in {'tagihan','laundry','rumah_transaksi','kantin'} and user.role not in {'kepala','manajer_keuangan'}:raise HTTPException(403,'Penghapusan catatan keuangan hanya untuk Kepala/Manajer Keuangan')
 db.delete(r);audit(db,user,'delete',module,rid);db.commit();return {'ok':True}
@app.post('/api/import')
def import_legacy(item:ImportInput,user:User=Depends(auth),db:Session=Depends(dbget)):
 if item.module not in MODULES:raise HTTPException(404,'Modul tidak ditemukan')
 added=0;skipped=0
 for body in item.rows:
  division=division_for(item.module,body)
  if not can(user,item.module,division,True):raise HTTPException(403,'Tidak berhak mengimpor divisi terkait')
  validate(item.module,body)
  # Deduplicate legacy source ID, when imported repeatedly.
  legacy=body.get('_legacy_id')
  if legacy:
   existing=db.scalars(select(Record).where(Record.module==item.module)).all()
   if any(r.data.get('_legacy_id')==legacy for r in existing):skipped+=1;continue
  try:overlap(db,item.module,body)
  except HTTPException:skipped+=1;continue
  r=Record(module=item.module,division=division,data=body,created_by=user.id,updated_by=user.id)
  db.add(r);db.flush();audit(db,user,'import',item.module,r.id,{'legacy_id':legacy});added+=1
 db.commit();return {'imported':added,'skipped':skipped}

@app.get('/api/dashboard')
def dashboard(user:User=Depends(auth),db:Session=Depends(dbget)):
 rows=[r for r in db.scalars(select(Record).where(Record.module.in_(BASE_OPS))).all() if can(user,r.module,r.division)]
 today=date.today().isoformat();out={'counts':{},'income':0,'expense':0,'receivables':0,'overdue':0,'contracts_due':[],'bills_due':[],'rooms_occupied':0,'rooms_booked':0,'laundry_by_site':{},'division_summary':{}}
 for r in rows:
  d=r.data;mod=r.module;out['counts'][mod]=out['counts'].get(mod,0)+1
  div=out['division_summary'].setdefault(r.division,{'records':0,'income':0,'expense':0,'receivables':0});div['records']+=1
  if mod in {'laundry','rumah_transaksi','kantin'}:
   amount=float(d.get('amount') or 0)
   direction=d.get('type','')
   if direction in {'income','Pendapatan','Masuk'}:out['income']+=amount;div['income']+=amount
   if direction in {'expense','Pengeluaran','Keluar'}:out['expense']+=amount;div['expense']+=amount
   if mod=='laundry':
    site=d.get('site','lainnya');x=out['laundry_by_site'].setdefault(site,{'income':0,'expense':0})
    if direction=='income':x['income']+=amount
    elif direction=='expense':x['expense']+=amount
  if mod=='tagihan':
   amount=float(d.get('amount') or 0)
   paid=sum(float(p.get('amount') or 0) for p in d.get('payments',[]) if isinstance(p,dict))
   due=max(0,amount-paid);out['receivables']+=due;div['receivables']+=due
   if due and d.get('due','')<today:out['overdue']+=due
   if due and d.get('due','')<= (date.today()+timedelta(days=30)).isoformat():out['bills_due'].append({'number':d.get('number'),'due':d.get('due'),'amount':due})
  if mod=='pks' and d.get('stage','active') not in {'draft','terminated'}:
   end=d.get('end','')
   if end and end<=(date.today()+timedelta(days=30)).isoformat():out['contracts_due'].append({'title':d.get('title'),'partner':d.get('partner'),'end':end})
  if mod=='rumah_reservasi' and d.get('start','')<=today<d.get('end',''):
   if d.get('status')=='Check-in':out['rooms_occupied']+=1
   if d.get('status')=='Dipesan':out['rooms_booked']+=1
 return out

@app.get('/api/public')
def public(db:Session=Depends(dbget)):
 news=db.scalars(select(Record).where(Record.module=='berita').order_by(Record.created_at.desc()).limit(20)).all()
 return {'news':[{'id':n.id,**n.data} for n in news if n.data.get('published',False)]}
@app.get('/api/audit')
def audit_log(user:User=Depends(admin),db:Session=Depends(dbget)):
 return [{'actor':x.actor,'action':x.action,'module':x.module,'record_id':x.record_id,'at':x.at.isoformat() if x.at else ''} for x in db.scalars(select(Audit).order_by(Audit.id.desc()).limit(200))]
