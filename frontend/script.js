const API_BASE_URL = 'http://localhost:8000';

// Navigation functions
function showWelcome() {
    document.getElementById('welcome-section').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('sell-form').style.display = 'none';
    document.getElementById('items-section').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('welcome-section').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('sell-form').style.display = 'none';
    document.getElementById('items-section').style.display = 'none';
}

function showSellForm() {
    document.getElementById('welcome-section').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('sell-form').style.display = 'block';
    document.getElementById('items-section').style.display = 'none';
}

function showItems() {
    document.getElementById('welcome-section').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('sell-form').style.display = 'none';
    document.getElementById('items-section').style.display = 'block';
    loadItems();
}

// User registration
document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('username', document.getElementById('username').value);
    formData.append('email', document.getElementById('email').value);
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const user = await response.json();
            alert(`User registered successfully! Your user ID is: ${user.id}`);
            document.getElementById('userForm').reset();
            showWelcome();
        } else {
            try {
                const error = await response.json();
                alert(`Error: ${error.detail}`);
            } catch (parseError) {
                alert(`Error: ${response.status} - ${response.statusText}`);
            }
        }
    } catch (error) {
        alert(`Network error: ${error.message}`);
    }
});

// Item listing
document.getElementById('itemForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate image file
    const imageFile = document.getElementById('image').files[0];
    if (!imageFile) {
        alert('Please select an image file');
        return;
    }
    
    // Check if it's an image
    if (!imageFile.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
    }
    
    const formData = new FormData();
    formData.append('title', document.getElementById('title').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('category', document.getElementById('category').value);
    formData.append('starting_price', document.getElementById('starting_price').value);
    formData.append('owner_id', document.getElementById('owner_id').value);
    formData.append('duration_hours', document.getElementById('duration').value);
    formData.append('file', imageFile);
    
    try {
        const response = await fetch(`${API_BASE_URL}/items/`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            await response.json();
            alert('Item listed successfully!');
            document.getElementById('itemForm').reset();
            showItems();
        } else {
            const error = await response.json();
            alert(`Error: ${error.detail}`);
        }
    } catch (error) {
        alert(`Error listing item: ${error.message}`);
    }
});

// Load items
async function loadItems(category = '') {
    try {
        let url = `${API_BASE_URL}/items/`;
        if (category) {
            url += `?category=${category}`;
        }
        
        const response = await fetch(url);
        const items = await response.json();
        
        const itemsGrid = document.getElementById('items-grid');
        itemsGrid.innerHTML = '';
        
        items.forEach(item => {
            const timeRemaining = getTimeRemaining(item.ends_at);
            const itemCard = `
                <div class="col-md-4 mb-4">
                    <div class="card item-card" onclick="showItemDetail(${item.id})">
                        <img src="${API_BASE_URL}${item.image_url}" class="card-img-top" alt="${item.title}" style="height: 200px; object-fit: cover;">
                        <div class="card-body">
                            <h5 class="card-title">${item.title}</h5>
                            <p class="card-text">${item.description.substring(0, 100)}...</p>
                            <p class="card-text">
                                <small class="text-muted">Category: ${item.category}</small>
                            </p>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="current-price">$${item.current_price}</span>
                                <small class="time-remaining">${timeRemaining}</small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            itemsGrid.innerHTML += itemCard;
        });
    } catch (error) {
        alert('Error loading items');
    }
}

// Filter items by category
function filterItems() {
    const category = document.getElementById('category-filter').value;
    loadItems(category);
}

// Show item detail
async function showItemDetail(itemId) {
    try {
        const response = await fetch(`${API_BASE_URL}/items/${itemId}`);
        const item = await response.json();
        
        // Load item owner
        const ownerResponse = await fetch(`${API_BASE_URL}/users/${item.owner_id}`);
        const owner = await ownerResponse.json();
        
        // Load bids
        const bidsResponse = await fetch(`${API_BASE_URL}/items/${itemId}/bids`);
        const bids = await bidsResponse.json();
        
        // Populate modal
        document.getElementById('itemModalTitle').textContent = item.title;
        document.getElementById('itemModalImage').src = `${API_BASE_URL}${item.image_url}`;
        document.getElementById('itemModalCategory').textContent = item.category;
        document.getElementById('itemModalDescription').textContent = item.description;
        document.getElementById('itemModalStartingPrice').textContent = item.starting_price;
        document.getElementById('itemModalCurrentPrice').textContent = item.current_price;
        document.getElementById('itemModalOwner').textContent = owner.username;
        document.getElementById('itemModalTimeRemaining').textContent = getTimeRemaining(item.ends_at);
        
        // Set minimum bid amount
        document.getElementById('bidAmount').min = item.current_price + 0.01;
        document.getElementById('bidAmount').placeholder = `Minimum: $${(item.current_price + 0.01).toFixed(2)}`;
        
        // Store item ID for bidding
        document.getElementById('bidForm').setAttribute('data-item-id', itemId);
        
        // Display bids
        const bidsContainer = document.getElementById('itemBids');
        bidsContainer.innerHTML = '';
        
        if (bids.length === 0) {
            bidsContainer.innerHTML = '<p class="text-muted">No bids yet</p>';
        } else {
            bids.forEach(bid => {
                const bidElement = document.createElement('div');
                bidElement.className = 'card mb-2';
                bidElement.innerHTML = `
                    <div class="card-body p-2">
                        <div class="d-flex justify-content-between">
                            <span>$${bid.amount}</span>
                            <small class="text-muted">${new Date(bid.created_at).toLocaleString()}</small>
                        </div>
                    </div>
                `;
                bidsContainer.appendChild(bidElement);
            });
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('itemModal'));
        modal.show();
    } catch (error) {
        alert('Error loading item details');
    }
}

// Bidding
document.getElementById('bidForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const itemId = document.getElementById('bidForm').getAttribute('data-item-id');
    const formData = new FormData();
    formData.append('item_id', itemId);
    formData.append('bidder_id', document.getElementById('bidderUserId').value);
    formData.append('amount', document.getElementById('bidAmount').value);
    
    try {
        const response = await fetch(`${API_BASE_URL}/bids/`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            await response.json();
            alert('Bid placed successfully!');
            document.getElementById('bidForm').reset();
            
            // Refresh item details
            showItemDetail(itemId);
        } else {
            const error = await response.json();
            alert(`Error: ${error.detail}`);
        }
    } catch (error) {
        alert('Error placing bid');
    }
});

// Utility functions
function getTimeRemaining(endTime) {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) {
        return 'Auction ended';
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    showWelcome();
});