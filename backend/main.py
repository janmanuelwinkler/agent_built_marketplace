from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form, status
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey, func
from sqlalchemy.orm import sessionmaker, Session, relationship, declarative_base
from datetime import datetime, timedelta, timezone
from typing import List, Optional
import os
import uuid
from PIL import Image
from passlib.context import CryptContext
from passlib.hash import bcrypt
import jwt
from jwt.exceptions import InvalidTokenError

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./marketplace.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = "marketplace-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    vorname = Column(String)
    nachname = Column(String)
    geburtsdatum = Column(String)  # Format: DD.MM.YYYY
    strasse = Column(String)
    hausnummer = Column(String)
    postleitzahl = Column(String)
    ort = Column(String)
    land = Column(String)
    telefon = Column(String)
    datenschutz_zugestimmt = Column(Boolean, default=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False
    )
    
    items = relationship("Item", back_populates="owner")
    bids = relationship("Bid", back_populates="bidder")

class Item(Base):
    __tablename__ = "items"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    category = Column(String)
    starting_price = Column(Float)
    current_price = Column(Float)
    image_url = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False
    )
    ends_at = Column(DateTime)
    is_active = Column(Boolean, default=True)
    
    owner = relationship("User", back_populates="items")
    bids = relationship("Bid", back_populates="item")

class Bid(Base):
    __tablename__ = "bids"
    
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    item_id = Column(Integer, ForeignKey("items.id"))
    bidder_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False
    )
    
    item = relationship("Item", back_populates="bids")
    bidder = relationship("User", back_populates="bids")

# Create tables
Base.metadata.create_all(bind=engine)

# FastAPI app
app = FastAPI(title="Marketplace API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
os.makedirs("static", exist_ok=True)
os.makedirs("uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Utility functions for password hashing and JWT
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def authenticate_user(db: Session, username: str, password: str):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Routes
@app.get("/")
def read_root():
    return {"message": "Marketplace API"}

@app.post("/users/")
def create_user(
    username: str = Form(...), 
    email: str = Form(...),
    password: str = Form(...),
    vorname: str = Form(...),
    nachname: str = Form(...),
    geburtsdatum: str = Form(...),
    strasse: str = Form(...),
    hausnummer: str = Form(...),
    postleitzahl: str = Form(...),
    ort: str = Form(...),
    land: str = Form(...),
    telefon: str = Form(...),
    datenschutz_zugestimmt: str = Form(...),
    db: Session = Depends(get_db)
):
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Benutzername existiert bereits")
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="E-Mail-Adresse existiert bereits")
    
    # Check if privacy consent is given
    consent_value = datenschutz_zugestimmt.lower() in ['true', '1', 'yes', 'on']
    if not consent_value:
        raise HTTPException(status_code=400, detail="Datenschutz-Zustimmung ist erforderlich")
    
    # Hash the password
    hashed_password = get_password_hash(password)
    
    db_user = User(
        username=username, 
        email=email,
        password_hash=hashed_password,
        vorname=vorname,
        nachname=nachname,
        geburtsdatum=geburtsdatum,
        strasse=strasse,
        hausnummer=hausnummer,
        postleitzahl=postleitzahl,
        ort=ort,
        land=land,
        telefon=telefon,
        datenschutz_zugestimmt=consent_value
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Return user without password hash
    return {
        "id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "vorname": db_user.vorname,
        "nachname": db_user.nachname,
        "geburtsdatum": db_user.geburtsdatum,
        "adresse": {
            "strasse": db_user.strasse,
            "hausnummer": db_user.hausnummer,
            "postleitzahl": db_user.postleitzahl,
            "ort": db_user.ort,
            "land": db_user.land
        },
        "telefon": db_user.telefon,
        "datenschutz_zugestimmt": db_user.datenschutz_zugestimmt,
        "created_at": db_user.created_at
    }

@app.post("/login/")
def login(
    username: str = Form(...), 
    password: str = Form(...), 
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falscher Benutzername oder Passwort",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "vorname": user.vorname,
            "nachname": user.nachname,
            "geburtsdatum": user.geburtsdatum,
            "adresse": {
                "strasse": user.strasse,
                "hausnummer": user.hausnummer,
                "postleitzahl": user.postleitzahl,
                "ort": user.ort,
                "land": user.land
            },
            "telefon": user.telefon,
            "datenschutz_zugestimmt": user.datenschutz_zugestimmt
        }
    }

@app.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/items/")
async def create_item(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    starting_price: float = Form(...),
    owner_id: int = Form(...),
    duration_hours: int = Form(24),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Save uploaded image
    if not file or file.size == 0:
        raise HTTPException(status_code=400, detail="No valid image file provided")
    
    # Read file content
    file_content = await file.read()
    if not file_content:
        raise HTTPException(status_code=400, detail="Image file is empty")
    
    image_filename = f"{uuid.uuid4()}.jpg"
    image_path = f"uploads/{image_filename}"
    
    with open(image_path, "wb") as buffer:
        buffer.write(file_content)
    
    # Resize image
    try:
        with Image.open(image_path) as img:
            # Convert RGBA to RGB if necessary
            if img.mode in ("RGBA", "LA", "P"):
                img = img.convert("RGB")
            img.thumbnail((800, 600))
            img.save(image_path, "JPEG")
    except Exception as e:
        # Clean up invalid file
        if os.path.exists(image_path):
            os.remove(image_path)
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
    
    # Create item
    ends_at = datetime.utcnow() + timedelta(hours=duration_hours)
    db_item = Item(
        title=title,
        description=description,
        category=category,
        starting_price=starting_price,
        current_price=starting_price,
        image_url=f"/uploads/{image_filename}",
        owner_id=owner_id,
        ends_at=ends_at
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.get("/items/")
def get_items(skip: int = 0, limit: int = 20, category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Item).filter(Item.is_active == True)
    if category:
        query = query.filter(Item.category == category)
    items = query.offset(skip).limit(limit).all()
    return items

@app.get("/items/{item_id}")
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@app.post("/bids/")
def create_bid(
    item_id: int = Form(...),
    bidder_id: int = Form(...),
    amount: float = Form(...),
    db: Session = Depends(get_db)
):
    # Get item
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check if bid is higher than current price
    if amount <= item.current_price:
        raise HTTPException(status_code=400, detail="Bid must be higher than current price")
    
    # Check if auction is still active
    if datetime.utcnow() > item.ends_at:
        raise HTTPException(status_code=400, detail="Auction has ended")
    
    # Create bid
    db_bid = Bid(item_id=item_id, bidder_id=bidder_id, amount=amount)
    db.add(db_bid)
    
    # Update item current price
    item.current_price = amount
    db.commit()
    db.refresh(db_bid)
    
    return db_bid

@app.get("/items/{item_id}/bids")
def get_item_bids(item_id: int, db: Session = Depends(get_db)):
    bids = db.query(Bid).filter(Bid.item_id == item_id).order_by(Bid.created_at.desc()).all()
    return bids

@app.get("/categories/")
def get_categories():
    return [
        "Electronics",
        "Furniture",
        "Clothing",
        "Books",
        "Sports",
        "Toys",
        "Home & Garden",
        "Other"
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)