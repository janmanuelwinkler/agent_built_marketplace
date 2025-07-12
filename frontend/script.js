const API_BASE_URL = 'http://localhost:8000';

// Session management
let currentUser = null;
let accessToken = null;

// Load user session on page load
function loadUserSession() {
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('accessToken');
    
    if (savedUser && savedToken) {
        currentUser = JSON.parse(savedUser);
        accessToken = savedToken;
        updateUIForLoggedInUser();
    }
}

function updateUIForLoggedInUser() {
    if (currentUser) {
        document.getElementById('user-menu').style.display = 'block';
        document.getElementById('username-display').textContent = currentUser.username;
        
        // Hide login/register links
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.textContent === 'Anmelden' || link.textContent === 'Registrieren') {
                link.parentElement.style.display = 'none';
            }
        });
    } else {
        document.getElementById('user-menu').style.display = 'none';
        
        // Show login/register links
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.textContent === 'Anmelden' || link.textContent === 'Registrieren') {
                link.parentElement.style.display = 'block';
            }
        });
    }
}

function logout() {
    currentUser = null;
    accessToken = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
    updateUIForLoggedInUser();
    showWelcome();
}

// Navigation functions
function showWelcome() {
    document.getElementById('welcome-section').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('sell-form').style.display = 'none';
    document.getElementById('account-management').style.display = 'none';
    document.getElementById('items-section').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('welcome-section').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('sell-form').style.display = 'none';
    document.getElementById('account-management').style.display = 'none';
    document.getElementById('items-section').style.display = 'none';
}

function showLoginForm() {
    document.getElementById('welcome-section').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('sell-form').style.display = 'none';
    document.getElementById('account-management').style.display = 'none';
    document.getElementById('items-section').style.display = 'none';
}

function showSellForm() {
    document.getElementById('welcome-section').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('sell-form').style.display = 'block';
    document.getElementById('account-management').style.display = 'none';
    document.getElementById('items-section').style.display = 'none';
    
    // Auto-populate user ID if logged in
    if (currentUser) {
        document.getElementById('owner_id').value = currentUser.id;
        document.getElementById('owner-id-field').style.display = 'none';
    } else {
        document.getElementById('owner-id-field').style.display = 'block';
    }
}

function showItems() {
    document.getElementById('welcome-section').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('sell-form').style.display = 'none';
    document.getElementById('account-management').style.display = 'none';
    document.getElementById('items-section').style.display = 'block';
    loadItems();
}

function showAccountManagement() {
    console.log('showAccountManagement called');
    
    try {
        document.getElementById('welcome-section').style.display = 'none';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('sell-form').style.display = 'none';
        document.getElementById('items-section').style.display = 'none';
        
        const accountSection = document.getElementById('account-management');
        if (accountSection) {
            accountSection.style.display = 'block';
            console.log('Account management section shown');
            loadAccountData();
        } else {
            console.error('Account management section not found');
            alert('Kontoverwaltung ist nicht verfügbar');
        }
    } catch (error) {
        console.error('Error showing account management:', error);
        alert('Fehler beim Anzeigen der Kontoverwaltung: ' + error.message);
    }
}

// User registration
document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate password confirmation
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    if (password !== confirmPassword) {
        alert('Die Passwörter stimmen nicht überein. Bitte überprüfen Sie Ihre Eingabe.');
        return;
    }
    
    // Validate date format
    const geburtsdatum = document.getElementById('geburtsdatum').value;
    const datePattern = /^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$/;
    if (!datePattern.test(geburtsdatum)) {
        alert('Bitte geben Sie das Geburtsdatum im Format DD.MM.YYYY ein (z.B. 12.03.1990)');
        return;
    }
    
    // Validate phone format
    const telefon = document.getElementById('telefon').value;
    const phonePattern = /^\+41[0-9]{9}$/;
    if (!phonePattern.test(telefon)) {
        alert('Bitte geben Sie die Telefonnummer im Format +41791234567 ein');
        return;
    }
    
    const formData = new FormData();
    formData.append('username', document.getElementById('username').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('password', document.getElementById('password').value);
    formData.append('vorname', document.getElementById('vorname').value);
    formData.append('nachname', document.getElementById('nachname').value);
    formData.append('geburtsdatum', geburtsdatum);
    formData.append('strasse', document.getElementById('strasse').value);
    formData.append('hausnummer', document.getElementById('hausnummer').value);
    formData.append('postleitzahl', document.getElementById('postleitzahl').value);
    formData.append('ort', document.getElementById('ort').value);
    formData.append('land', document.getElementById('land').value);
    formData.append('telefon', telefon);
    formData.append('datenschutz_zugestimmt', document.getElementById('datenschutz_zugestimmt').checked.toString());
    
    // Debug: log form data
    console.log('Form data being sent:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const user = await response.json();
            alert(`Registrierung erfolgreich! Sie können sich jetzt mit Ihrem Benutzernamen und Passwort anmelden.`);
            document.getElementById('userForm').reset();
            showLoginForm();
        } else {
            try {
                const error = await response.json();
                console.log('Server error:', error);
                if (error.detail) {
                    if (Array.isArray(error.detail)) {
                        // Handle validation errors array
                        const errorMessages = error.detail.map(err => 
                            typeof err === 'string' ? err : err.msg || JSON.stringify(err)
                        ).join('\n');
                        alert(`Fehler:\n${errorMessages}`);
                    } else {
                        alert(`Fehler: ${error.detail}`);
                    }
                } else {
                    alert(`Fehler: ${JSON.stringify(error)}`);
                }
            } catch (parseError) {
                console.log('Could not parse error response:', parseError);
                alert(`Fehler: ${response.status} - ${response.statusText}`);
            }
        }
    } catch (error) {
        alert(`Netzwerkfehler: ${error.message}`);
    }
});

// User login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('username', document.getElementById('loginUsername').value);
    formData.append('password', document.getElementById('loginPassword').value);
    
    try {
        const response = await fetch(`${API_BASE_URL}/login/`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Save user session
            currentUser = data.user;
            accessToken = data.access_token;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('accessToken', accessToken);
            
            // Update UI
            updateUIForLoggedInUser();
            alert(`Willkommen zurück, ${currentUser.vorname}!`);
            document.getElementById('loginForm').reset();
            showWelcome();
        } else {
            try {
                const error = await response.json();
                alert(`Fehler: ${error.detail}`);
            } catch (parseError) {
                alert(`Fehler: ${response.status} - ${response.statusText}`);
            }
        }
    } catch (error) {
        alert(`Netzwerkfehler: ${error.message}`);
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
        
        // Auto-populate bidder ID if logged in
        if (currentUser) {
            document.getElementById('bidderUserId').value = currentUser.id;
            document.getElementById('bidder-id-field').style.display = 'none';
        } else {
            document.getElementById('bidder-id-field').style.display = 'block';
        }
        
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

// Account Management Functions
function loadAccountData() {
    console.log('loadAccountData called, currentUser:', currentUser);
    
    if (currentUser) {
        try {
            document.getElementById('editUsername').value = currentUser.username || '';
            document.getElementById('editEmail').value = currentUser.email || '';
            document.getElementById('editVorname').value = currentUser.vorname || '';
            document.getElementById('editNachname').value = currentUser.nachname || '';
            document.getElementById('editGeburtsdatum').value = currentUser.geburtsdatum || '';
            
            // Handle address fields safely
            if (currentUser.adresse) {
                document.getElementById('editStrasse').value = currentUser.adresse.strasse || '';
                document.getElementById('editHausnummer').value = currentUser.adresse.hausnummer || '';
                document.getElementById('editPostleitzahl').value = currentUser.adresse.postleitzahl || '';
                document.getElementById('editOrt').value = currentUser.adresse.ort || '';
                document.getElementById('editLand').value = currentUser.adresse.land || 'Schweiz';
            } else {
                // Fallback if address structure is different
                document.getElementById('editStrasse').value = currentUser.strasse || '';
                document.getElementById('editHausnummer').value = currentUser.hausnummer || '';
                document.getElementById('editPostleitzahl').value = currentUser.postleitzahl || '';
                document.getElementById('editOrt').value = currentUser.ort || '';
                document.getElementById('editLand').value = currentUser.land || 'Schweiz';
            }
            
            document.getElementById('editTelefon').value = currentUser.telefon || '';
            
            // Clear password fields
            document.getElementById('editPassword').value = '';
            document.getElementById('editConfirmPassword').value = '';
            
            console.log('Account data loaded successfully');
        } catch (error) {
            console.error('Error loading account data:', error);
            alert('Fehler beim Laden der Kontodaten: ' + error.message);
        }
    } else {
        console.warn('No current user found');
        alert('Kein Benutzer angemeldet');
    }
}

// Account form submission
document.getElementById('accountForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate password confirmation if password is being changed
    const newPassword = document.getElementById('editPassword').value;
    const confirmPassword = document.getElementById('editConfirmPassword').value;
    
    if (newPassword && newPassword !== confirmPassword) {
        alert('Die Passwörter stimmen nicht überein. Bitte überprüfen Sie Ihre Eingabe.');
        return;
    }
    
    // Validate date format
    const geburtsdatum = document.getElementById('editGeburtsdatum').value;
    const datePattern = /^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$/;
    if (!datePattern.test(geburtsdatum)) {
        alert('Bitte geben Sie das Geburtsdatum im Format DD.MM.YYYY ein (z.B. 12.03.1990)');
        return;
    }
    
    // Validate phone format
    const telefon = document.getElementById('editTelefon').value;
    const phonePattern = /^\+41[0-9]{9}$/;
    if (!phonePattern.test(telefon)) {
        alert('Bitte geben Sie die Telefonnummer im Format +41791234567 ein');
        return;
    }
    
    const formData = new FormData();
    formData.append('email', document.getElementById('editEmail').value);
    formData.append('vorname', document.getElementById('editVorname').value);
    formData.append('nachname', document.getElementById('editNachname').value);
    formData.append('geburtsdatum', geburtsdatum);
    formData.append('strasse', document.getElementById('editStrasse').value);
    formData.append('hausnummer', document.getElementById('editHausnummer').value);
    formData.append('postleitzahl', document.getElementById('editPostleitzahl').value);
    formData.append('ort', document.getElementById('editOrt').value);
    formData.append('land', document.getElementById('editLand').value);
    formData.append('telefon', telefon);
    
    // Only include password if it's being changed
    if (newPassword) {
        formData.append('password', newPassword);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            body: formData
        });
        
        if (response.ok) {
            const updatedUser = await response.json();
            
            // Update local session
            currentUser = updatedUser;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            alert('Ihre Änderungen wurden erfolgreich gespeichert!');
            showWelcome();
        } else {
            const error = await response.json();
            alert(`Fehler: ${error.detail}`);
        }
    } catch (error) {
        alert(`Netzwerkfehler: ${error.message}`);
    }
});

// Account deletion
function confirmDeleteAccount() {
    if (confirm('Sind Sie sicher, dass Sie Ihr Konto löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.\n\nHinweis: Falls Sie noch aktive Auktionen haben, bei denen Sie Höchstbietender sind, bleibt Ihr Konto bis zum Ende dieser Auktionen aktiv.')) {
        deleteAccount();
    }
}

async function deleteAccount() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            
            if (result.deleted) {
                alert('Ihr Konto wurde erfolgreich gelöscht.');
                logout();
            } else {
                alert('Ihr Konto kann derzeit nicht gelöscht werden, da Sie noch Höchstbietender bei aktiven Auktionen sind. Ihr Konto wird automatisch nach Ende dieser Auktionen gelöscht.');
                showWelcome();
            }
        } else {
            const error = await response.json();
            alert(`Fehler: ${error.detail}`);
        }
    } catch (error) {
        alert(`Netzwerkfehler: ${error.message}`);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadUserSession();
    showWelcome();
});