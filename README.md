# Marketplace - Secondhand Items Platform

A simple marketplace for buying and selling secondhand items like iPhones, furniture, and more. Built with FastAPI backend and vanilla JavaScript frontend.

## Features

- **User Registration**: Simple username/email registration
- **Item Listings**: Upload items with photos, descriptions, and categories
- **Bidding System**: Place bids on items with real-time price updates
- **Categories**: Electronics, Furniture, Clothing, Books, Sports, Toys, Home & Garden
- **Time-based Auctions**: Items have configurable auction durations
- **Image Upload**: Automatic image resizing and optimization

## Quick Start

### Using Docker (Recommended)

1. Clone the repository
2. Run with Docker Compose:
   ```bash
   docker-compose up --build
   ```
3. Open your browser to `http://localhost:8000/static/index.html`

### Manual Setup

1. Install Python dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Start the backend server:
   ```bash
   python main.py
   ```

3. Open `frontend/index.html` in your browser

## Usage

1. **Register**: Create a user account (remember your user ID)
2. **Browse Items**: View available items and their current bids
3. **Sell Items**: Upload items with photos and details
4. **Place Bids**: Bid on items you want to buy

## API Endpoints

- `GET /` - API status
- `POST /users/` - Register new user
- `GET /users/{user_id}` - Get user details
- `POST /items/` - Create new item listing
- `GET /items/` - List all items (with optional category filter)
- `GET /items/{item_id}` - Get item details
- `POST /bids/` - Place a bid
- `GET /items/{item_id}/bids` - Get item bids
- `GET /categories/` - Get available categories

## Project Structure

```
marketplace/
├── backend/
│   ├── main.py          # FastAPI application
│   └── requirements.txt # Python dependencies
├── frontend/
│   ├── index.html       # Main web interface
│   └── script.js        # Frontend JavaScript
├── static/              # Static files (copied from frontend)
├── uploads/             # User uploaded images
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose setup
└── README.md           # This file
```

## Technology Stack

- **Backend**: FastAPI, SQLAlchemy, SQLite
- **Frontend**: HTML, CSS (Bootstrap), JavaScript
- **Database**: SQLite (for simplicity)
- **Deployment**: Docker, Docker Compose
- **Image Processing**: Pillow (PIL)