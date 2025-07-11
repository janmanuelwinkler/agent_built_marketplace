from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import sessionmaker, Session, relationship, declarative_base
from datetime import datetime, timedelta
from typing import List, Optional
import os
import uuid
from PIL import Image

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./marketplace.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
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
    created_at = Column(DateTime, default=datetime.utcnow)
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
    created_at = Column(DateTime, default=datetime.utcnow)
    
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
def create_user(username: str = Form(...), email: str = Form(...), db: Session = Depends(get_db)):
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    db_user = User(username=username, email=email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

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