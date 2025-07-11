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
```

### Database Management
- Database file: `marketplace.db` (SQLite)
- Tables are auto-created on first run via SQLAlchemy
- To reset database: delete `marketplace.db` file

## Architecture Overview

### Backend Structure (`backend/main.py`)
- **Models**: User, Item, Bid (SQLAlchemy ORM)
- **API Endpoints**: RESTful API with FastAPI
- **File Uploads**: Image handling with Pillow for resizing
- **Database**: SQLite with SQLAlchemy ORM

### Frontend Structure (`frontend/`)
- **index.html**: Single-page application with Bootstrap
- **script.js**: Vanilla JavaScript for API interactions
- **Static serving**: Backend serves frontend files at `/static/`

### Key Features Implementation
- **User Registration**: Simple username/email system
- **Item Listings**: Multi-part form upload with image processing
- **Bidding System**: Real-time price updates, time-based auctions
- **Categories**: Predefined categories (Electronics, Furniture, etc.)

### Database Schema
- **users**: id, username, email, created_at
- **items**: id, title, description, category, starting_price, current_price, image_url, owner_id, created_at, ends_at, is_active
- **bids**: id, amount, item_id, bidder_id, created_at

## Important Notes

- User authentication is basic (user ID based) - suitable for POC
- Images are stored in `uploads/` directory with automatic resizing
- Frontend uses Bootstrap CDN for styling
- CORS is enabled for development
- Database relationships are handled via SQLAlchemy foreign keys

## Deployment

The application is containerized with Docker:
- `Dockerfile`: Multi-stage build with Python 3.9
- `docker-compose.yml`: Single service with volume mounts
- Volumes: `./uploads` and `./marketplace.db` for data persistence