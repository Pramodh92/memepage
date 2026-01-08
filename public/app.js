// API Base URL
const API_URL = 'http://localhost:3000';

// State
let allMemes = [];
let currentFilter = 'all';
let currentUser = null;
let currentTab = 'home';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadGallery();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Upload form
    document.getElementById('uploadForm').addEventListener('submit', handleUpload);

    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Signup form
    document.getElementById('signupForm').addEventListener('submit', handleSignup);

    // Upload area click
    document.getElementById('uploadArea').addEventListener('click', () => {
        document.getElementById('memeFile').click();
    });

    // Edit upload area click
    document.getElementById('editUploadArea').addEventListener('click', () => {
        document.getElementById('editMemeFile').click();
    });

    // Edit form
    document.getElementById('editForm').addEventListener('submit', handleEdit);

    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Load Gallery
async function loadGallery() {
    try {
        const response = await fetch(`${API_URL}/memes/gallery`);
        const data = await response.json();

        if (data.success) {
            allMemes = data.memes;
            displayMemes(allMemes);
            updateStats();
        }
    } catch (error) {
        console.error('Error loading gallery:', error);
        showNotification('Failed to load memes', 'error');
    }
}

// Display Memes
function displayMemes(memes) {
    const gallery = document.getElementById('galleryGrid');

    if (memes.length === 0) {
        gallery.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-secondary);">
                <h2>No memes found</h2>
                <p>Be the first to upload a meme!</p>
            </div>
        `;
        return;
    }

    gallery.innerHTML = memes.map((meme, index) => `
        <div class="meme-card" style="animation-delay: ${index * 0.1}s">
            <img src="${meme.imageUrl}" alt="${meme.title}" class="meme-image">
            <div class="meme-content">
                <div class="meme-header">
                    <div>
                        <h3 class="meme-title" onclick="showEditModal(${meme.id})" style="cursor: pointer; color: var(--accent-color); transition: color 0.2s;" onmouseover="this.style.color='var(--primary-color)'" onmouseout="this.style.color='var(--accent-color)'">${meme.title}</h3>
                        <p class="meme-author">by ${meme.author}</p>
                    </div>
                    ${meme.featured ? '<span class="featured-badge">Featured</span>' : ''}
                </div>
                ${meme.tags && meme.tags.length > 0 ? `
                    <div class="tags-container">
                        ${meme.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                ${meme.description ? `
                    <button class="about-toggle" onclick="toggleDescription(${meme.id})" id="toggle-${meme.id}">
                        <span>About this Meme</span>
                        <span class="arrow">▼</span>
                    </button>
                    <div class="meme-description" id="desc-${meme.id}">
                        ${meme.description}
                    </div>
                ` : ''}
                <div class="meme-footer">
                    <button class="like-btn" onclick="likeMeme(${meme.id})">
                        ❤️ <span>${meme.likes}</span>
                    </button>
                    ${!meme.featured ? `<button class="feature-btn" onclick="featureMeme(${meme.id})">Feature</button>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Filter Memes
function filterMemes(filter) {
    currentFilter = filter;

    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    let filteredMemes = allMemes;

    if (filter === 'featured') {
        filteredMemes = allMemes.filter(meme => meme.featured);
    } else if (filter === 'popular') {
        filteredMemes = [...allMemes].sort((a, b) => b.likes - a.likes);
    }

    displayMemes(filteredMemes);
}

// Update Stats
function updateStats() {
    const totalLikes = allMemes.reduce((sum, meme) => sum + meme.likes, 0);
    document.getElementById('memeCount').textContent = allMemes.length;
    document.getElementById('totalLikes').textContent = totalLikes;
}

// Handle Upload
async function handleUpload(e) {
    e.preventDefault();

    const title = document.getElementById('memeTitle').value;
    const author = document.getElementById('memeAuthor').value;
    const description = document.getElementById('memeDescription').value;
    const tags = document.getElementById('memeTags').value;
    const fileInput = document.getElementById('memeFile');
    const file = fileInput.files[0];

    if (!file) {
        showNotification('Please select an image file', 'error');
        return;
    }

    // Create FormData to send file
    const formData = new FormData();
    formData.append('title', title);
    formData.append('author', author);
    formData.append('description', description);
    formData.append('tags', tags);
    formData.append('memeFile', file);

    try {
        const response = await fetch(`${API_URL}/memes/upload`, {
            method: 'POST',
            body: formData // Don't set Content-Type header, browser will set it with boundary
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Meme uploaded successfully! 🎉', 'success');
            closeUploadModal();
            loadGallery();
            document.getElementById('uploadForm').reset();
        } else {
            showNotification(data.message || 'Failed to upload meme', 'error');
        }
    } catch (error) {
        console.error('Error uploading meme:', error);
        showNotification('Failed to upload meme', 'error');
    }
}


// Handle Login
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            showNotification(`Welcome back, ${email}! 👋`, 'success');
            closeLoginModal();
            document.getElementById('loginForm').reset();
        }
    } catch (error) {
        console.error('Error logging in:', error);
        showNotification('Failed to login', 'error');
    }
}

// Handle Signup
async function handleSignup(e) {
    e.preventDefault();

    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;

    try {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            showNotification(`Account created! Welcome, ${username}! 🎉`, 'success');
            closeSignupModal();
            document.getElementById('signupForm').reset();
        }
    } catch (error) {
        console.error('Error signing up:', error);
        showNotification('Failed to create account', 'error');
    }
}

// Like Meme
async function likeMeme(memeId) {
    const meme = allMemes.find(m => m.id === memeId);
    if (meme) {
        meme.likes++;
        displayMemes(currentFilter === 'all' ? allMemes :
            currentFilter === 'featured' ? allMemes.filter(m => m.featured) :
                [...allMemes].sort((a, b) => b.likes - a.likes));
        updateStats();
        showNotification('Liked! ❤️', 'success');
    }
}

// Feature Meme
async function featureMeme(memeId) {
    try {
        const response = await fetch(`${API_URL}/admin/feature`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ memeId })
        });

        const data = await response.json();

        if (data.success) {
            const meme = allMemes.find(m => m.id === memeId);
            if (meme) {
                meme.featured = true;
                displayMemes(allMemes);
                showNotification('Meme featured! ⭐', 'success');
            }
        }
    } catch (error) {
        console.error('Error featuring meme:', error);
        showNotification('Failed to feature meme', 'error');
    }
}

// Modal Functions
function showUploadModal() {
    document.getElementById('uploadModal').classList.add('active');
}

function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('active');
}

function showLoginModal() {
    document.getElementById('loginModal').classList.add('active');
    document.getElementById('signupModal').classList.remove('active');
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('active');
}

function showSignupModal() {
    document.getElementById('signupModal').classList.add('active');
    document.getElementById('loginModal').classList.remove('active');
}

function closeSignupModal() {
    document.getElementById('signupModal').classList.remove('active');
}

function showEditModal(memeId) {
    const meme = allMemes.find(m => m.id === memeId);
    if (!meme) return;

    // Populate form with current meme data
    document.getElementById('editMemeId').value = meme.id;
    document.getElementById('editMemeTitle').value = meme.title;
    document.getElementById('editMemeAuthor').value = meme.author;
    document.getElementById('editMemeDescription').value = meme.description || '';
    document.getElementById('editMemeTags').value = meme.tags ? meme.tags.join(', ') : '';
    document.getElementById('currentImage').src = meme.imageUrl;

    // Clear file input
    document.getElementById('editMemeFile').value = '';

    // Show modal
    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
}

// Handle Edit
async function handleEdit(e) {
    e.preventDefault();

    const memeId = document.getElementById('editMemeId').value;
    const title = document.getElementById('editMemeTitle').value;
    const author = document.getElementById('editMemeAuthor').value;
    const description = document.getElementById('editMemeDescription').value;
    const tags = document.getElementById('editMemeTags').value;
    const fileInput = document.getElementById('editMemeFile');
    const file = fileInput.files[0];

    // Create FormData to send file
    const formData = new FormData();
    formData.append('title', title);
    formData.append('author', author);
    formData.append('description', description);
    formData.append('tags', tags);
    if (file) {
        formData.append('memeFile', file);
    }

    try {
        const response = await fetch(`${API_URL}/memes/update/${memeId}`, {
            method: 'PUT',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Meme updated successfully! ✨', 'success');
            closeEditModal();
            loadGallery();
            document.getElementById('editForm').reset();
        } else {
            showNotification(data.message || 'Failed to update meme', 'error');
        }
    } catch (error) {
        console.error('Error updating meme:', error);
        showNotification('Failed to update meme', 'error');
    }
}

// Notification System
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? '#ff4444' : 'var(--accent-color)'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        font-weight: 600;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification animations to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Tab Switching
function switchTab(tabName) {
    currentTab = tabName;

    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        // Check if this button matches the tab name
        const btnText = btn.querySelector('.tab-label').textContent.toLowerCase();
        if (btnText === tabName.toLowerCase()) {
            btn.classList.add('active');
        }
    });

    // Load content based on tab
    if (tabName === 'home') {
        loadGallery();
    } else if (tabName === 'gallery') {
        loadGallery();
    } else if (tabName === 'trending') {
        loadTrending();
    }
}

// Load Trending Memes
async function loadTrending() {
    try {
        const response = await fetch(`${API_URL}/memes/trending`);
        const data = await response.json();

        if (data.success) {
            allMemes = data.memes;
            displayMemes(allMemes);
            updateStats();
        }
    } catch (error) {
        console.error('Error loading trending:', error);
        showNotification('Failed to load trending memes', 'error');
    }
}

// Toggle Description
function toggleDescription(memeId) {
    const descElement = document.getElementById(`desc-${memeId}`);
    const toggleBtn = document.getElementById(`toggle-${memeId}`);

    if (descElement && toggleBtn) {
        descElement.classList.toggle('expanded');
        toggleBtn.classList.toggle('expanded');
    }
}
