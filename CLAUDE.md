# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a marketplace web application for buying and selling secondhand items (electronics, furniture, etc.), similar to ricardo.ch. The project consists of:

- **Backend**: FastAPI (Python) with SQLAlchemy ORM and SQLite database
- **Frontend**: Vanilla HTML/CSS/JavaScript with Bootstrap styling
- **Deployment**: Docker containerization with docker-compose

## Common Development Commands

### Running the Application

**Using Docker (Recommended):**
```bash
docker-compose up --build
```
Access the application at: `http://localhost:8000/static/index.html`

**Manual Development:**
```bash
# Start backend server
cd backend
pip install -r requirements.txt
python main.py

# Frontend is served at /static/ route or open frontend/index.html directly
```

### Testing
```bash
# Backend API testing
curl http://localhost:8000/
curl http://localhost:8000/items/
curl http://localhost:8000/categories/

# Authentication endpoints
curl -X POST -F "username=testuser" -F "password=testpass" http://localhost:8000/login/
curl -X POST -F "username=testuser" -F "email=test@example.com" -F "password=testpass" -F "name=Test User" -F "address=123 Main St" -F "phone=555-1234" -F "age=25" http://localhost:8000/users/
```

### Database Management
- Database file: `marketplace.db` (SQLite)
- Tables are auto-created on first run via SQLAlchemy
- To reset database: delete `marketplace.db` file

## Architecture Overview

### Backend Structure (`backend/main.py`)
- **Models**: User, Item, Bid (SQLAlchemy ORM)
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **API Endpoints**: RESTful API with FastAPI
- **File Uploads**: Image handling with Pillow for resizing
- **Database**: SQLite with SQLAlchemy ORM

### Frontend Structure (`frontend/`)
- **index.html**: Single-page application with Bootstrap
- **script.js**: Vanilla JavaScript for API interactions
- **Static serving**: Backend serves frontend files at `/static/`

### Key Features Implementation
- **User Registration**: Complete user profiles with username, email, password, name, address, phone, age
- **Authentication**: Secure login system with JWT tokens and session management
- **Item Listings**: Multi-part form upload with image processing
- **Bidding System**: Real-time price updates, time-based auctions
- **Categories**: Predefined categories (Electronics, Furniture, etc.)
- **Session Management**: Persistent user sessions with localStorage

### Database Schema
- **users**: id, username, email, password_hash, name, address, phone, age, created_at
- **items**: id, title, description, category, starting_price, current_price, image_url, owner_id, created_at, ends_at, is_active
- **bids**: id, amount, item_id, bidder_id, created_at

## Important Notes

- User authentication uses JWT tokens with bcrypt password hashing for security
- Passwords are never stored in plain text
- User sessions persist in localStorage for seamless experience
- Images are stored in `uploads/` directory with automatic resizing
- Frontend uses Bootstrap CDN for styling
- CORS is enabled for development
- Database relationships are handled via SQLAlchemy foreign keys
- Auto-population of user IDs for logged-in users when selling/bidding

## API Endpoints

### Authentication
- `POST /users/` - Register new user (username, email, password, name, address, phone, age)
- `POST /login/` - Login user (username, password) - returns JWT token

### Items
- `GET /items/` - Get all items (optional category filter)
- `POST /items/` - Create new item listing
- `GET /items/{id}` - Get specific item details

### Bidding
- `POST /bids/` - Place bid on item
- `GET /items/{id}/bids` - Get all bids for an item

### Other
- `GET /categories/` - Get available categories
- `GET /users/{id}` - Get user details

## Deployment

The application is containerized with Docker:
- `Dockerfile`: Multi-stage build with Python 3.9
- `docker-compose.yml`: Single service with volume mounts
- Volumes: `./uploads` and `./marketplace.db` for data persistence

## Security Features

- **Password Hashing**: Uses bcrypt for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **Session Management**: Client-side token storage with automatic logout
- **Input Validation**: Form validation on both frontend and backend
- **CORS Configuration**: Properly configured for development environment