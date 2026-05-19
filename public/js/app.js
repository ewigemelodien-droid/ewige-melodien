// Global State
let currentUser = null;
let token = localStorage.getItem('token');
let currentTrack = null;
let isPlaying = false;
let audio = new Audio();
let playlist = [];
let currentIndex = 0;
let stripeCard = null;
let stripeInstance = null;

// API Base URL
const API = '/api';

// Init
 document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadMusic();
    setupEventListeners();
    setupNavigation();

    // Setup Stripe if key exists (will be loaded from env via backend in production)
    if (typeof Stripe !== 'undefined') {
        stripeInstance = Stripe('pk_test_placeholder'); // Will be updated from backend
    }
});

// Auth Check
async function checkAuth() {
    if (token) {
        try {
            const res = await fetch(`${API}/auth/me`, {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const user = await res.json();
                currentUser = user;
                updateUI();
            } else {
                logout();
            }
        } catch (err) {
            console.log('Auth check failed');
        }
    }
}

// Load Music
async function loadMusic() {
    try {
        const res = await fetch(`${API}/music`);
        const music = await res.json();
        playlist = music;
        renderMusic(music.slice(0, 6), 'featuredMusic');
        renderMusic(music, 'allMusic');
        renderShop(music.filter(m => !m.is_free));
    } catch (err) {
        console.error('Fehler beim Laden:', err);
    }
}

function renderMusic(music, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = music.map((track, idx) => `
        <div class="music-card" style="animation-delay: ${idx * 0.1}s">
            <div class="music-cover" onclick="playTrack(${track.id})">
                <img src="${track.cover || '/images/default-cover.jpg'}" alt="${track.title}" onerror="this.src='/images/default-cover.jpg'">
                <div class="play-overlay">
                    <i class="fas fa-play"></i>
                </div>
            </div>
            <div class="music-title">${track.title}</div>
            <div class="music-artist">${track.artist}</div>
            <div class="music-meta">
                <span class="badge-${track.is_free ? 'free' : 'paid'}">
                    ${track.is_free ? 'Kostenlos' : track.price + ' €'}
                </span>
                <span style="color: var(--text-muted); font-size: 0.85rem">
                    <i class="fas fa-clock"></i> ${track.duration}
                </span>
            </div>
            ${!track.is_free ? `<button class="btn-primary" style="margin-top: 10px; width: 100%; padding: 8px; font-size: 0.9rem;" onclick="event.stopPropagation(); buyTrack(${track.id})">Kaufen</button>` : ''}
            ${track.is_free && token ? `<button class="btn-outline" style="margin-top: 8px; width: 100%; padding: 6px; font-size: 0.85rem;" onclick="event.stopPropagation(); addToPlaylistPrompt(${track.id})"><i class="fas fa-plus"></i> Playlist</button>` : ''}
        </div>
    `).join('');
}

function renderShop(music) {
    const container = document.getElementById('shopMusic');
    if (!container) return;

    container.innerHTML = music.map((track, idx) => `
        <div class="music-card" style="animation-delay: ${idx * 0.1}s">
            <div class="music-cover">
                <img src="${track.cover || '/images/default-cover.jpg'}" alt="${track.title}" onerror="this.src='/images/default-cover.jpg'">
            </div>
            <div class="music-title">${track.title}</div>
            <div class="music-artist">${track.artist}</div>
            <div class="music-meta">
                <span class="music-price">${track.price} €</span>
                <span style="color: var(--text-muted); font-size: 0.85rem">${track.duration}</span>
            </div>
            <button class="btn-primary" style="margin-top: 10px; width: 100%;" onclick="buyTrack(${track.id})">
                <i class="fas fa-shopping-cart"></i> Kaufen & Downloaden
            </button>
        </div>
    `).join('');
}

// Player Functions
function playTrack(id) {
    const track = playlist.find(t => t.id === id);
    if (!track) return;

    currentTrack = track;
    currentIndex = playlist.findIndex(t => t.id === id);

    document.getElementById('playerTitle').textContent = track.title;
    document.getElementById('playerArtist').textContent = track.artist;
    document.getElementById('playerCover').src = track.cover || '/images/default-cover.jpg';
    document.getElementById('duration').textContent = track.duration;

    // In production, use actual file path
    // For demo, we'll just simulate playing
    if (track.file_path && !track.file_path.includes('placeholder')) {
        audio.src = track.file_path;
        audio.play().catch(e => console.log('Audio play failed:', e));
    } else {
        // Simulate progress for demo
        simulatePlayback();
    }

    isPlaying = true;
    updatePlayButton();

    // Add to recently played
    let recent = JSON.parse(localStorage.getItem('recent') || '[]');
    recent = [track, ...recent.filter(t => t.id !== track.id)].slice(0, 10);
    localStorage.setItem('recent', JSON.stringify(recent));
}

function simulatePlayback() {
    // Simulate audio progress when no real file
    let progress = 0;
    if (window.simulateInterval) clearInterval(window.simulateInterval);

    window.simulateInterval = setInterval(() => {
        if (!isPlaying) return;
        progress += 0.5;
        if (progress > 100) {
            progress = 0;
            nextTrack();
        }
        document.getElementById('progressFill').style.width = progress + '%';

        // Update time display (simulate)
        const totalSeconds = parseDuration(currentTrack?.duration || '3:00');
        const currentSeconds = Math.floor((progress / 100) * totalSeconds);
        document.getElementById('currentTime').textContent = formatTime(currentSeconds);
    }, 1000);
}

function parseDuration(dur) {
    const parts = dur.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function togglePlay() {
    if (!currentTrack) return;
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
    } else {
        if (audio.src) {
            audio.play().catch(e => console.log('Play failed:', e));
        }
        isPlaying = true;
    }
    updatePlayButton();
}

function updatePlayButton() {
    const btn = document.getElementById('playBtn');
    btn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
}

function nextTrack() {
    if (currentIndex < playlist.length - 1) {
        playTrack(playlist[currentIndex + 1].id);
    }
}

function prevTrack() {
    if (currentIndex > 0) {
        playTrack(playlist[currentIndex - 1].id);
    }
}

// Audio Events
audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const percent = (audio.currentTime / audio.duration) * 100;
    document.getElementById('progressFill').style.width = percent + '%';

    const mins = Math.floor(audio.currentTime / 60);
    const secs = Math.floor(audio.currentTime % 60);
    document.getElementById('currentTime').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
});

audio.addEventListener('ended', () => {
    nextTrack();
});

// Event Listeners
function setupEventListeners() {
    document.getElementById('playBtn').addEventListener('click', togglePlay);
    document.getElementById('nextBtn').addEventListener('click', nextTrack);
    document.getElementById('prevBtn').addEventListener('click', prevTrack);

    document.getElementById('loginBtn').addEventListener('click', () => openModal('login'));
    document.getElementById('registerBtn').addEventListener('click', () => openModal('register'));
    document.getElementById('logoutBtn').addEventListener('click', logout);

    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);

    // Progress bar click
    document.getElementById('progressBar').addEventListener('click', (e) => {
        if (!audio.duration && !currentTrack) return;
        const rect = e.target.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;

        if (audio.duration) {
            audio.currentTime = percent * audio.duration;
        }
    });

    // Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filterMusic(e.target.dataset.filter);
        });
    });
}

function setupNavigation() {
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.closest('a').dataset.page;
            navigateTo(page);

            document.querySelectorAll('.nav-menu a').forEach(l => l.classList.remove('active'));
            e.target.closest('a').classList.add('active');
        });
    });
}

function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');
    window.scrollTo(0, 0);
}

// Auth Handlers
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (data.token) {
            token = data.token;
            localStorage.setItem('token', token);
            currentUser = data.user;
            updateUI();
            closeModal();
            showNotification('Erfolgreich angemeldet!', 'success');
            loadMusic(); // Reload to show playlist buttons
        } else {
            showNotification(data.msg || 'Fehler bei der Anmeldung', 'error');
        }
    } catch (err) {
        showNotification('Serverfehler', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    try {
        const res = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();
        if (data.token) {
            token = data.token;
            localStorage.setItem('token', token);
            currentUser = data.user;
            updateUI();
            closeModal();
            showNotification('Registrierung erfolgreich!', 'success');
        } else {
            showNotification(data.msg || 'Fehler bei der Registrierung', 'error');
        }
    } catch (err) {
        showNotification('Serverfehler', 'error');
    }
}

function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    updateUI();
    showNotification('Abgemeldet', 'info');
    loadMusic();
}

function updateUI() {
    if (token && currentUser) {
        document.getElementById('loginBtn').classList.add('hidden');
        document.getElementById('registerBtn').classList.add('hidden');
        document.getElementById('userMenu').classList.remove('hidden');
        document.getElementById('userName').textContent = currentUser.name || currentUser.email;
    } else {
        document.getElementById('loginBtn').classList.remove('hidden');
        document.getElementById('registerBtn').classList.remove('hidden');
        document.getElementById('userMenu').classList.add('hidden');
    }
}

// Modal Functions
function openModal(type) {
    document.getElementById('authModal').classList.add('active');
    switchAuth(type);
}

function closeModal() {
    document.getElementById('authModal').classList.remove('active');
}

function switchAuth(type) {
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(t => t.classList.remove('active'));

    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        tabs[0].classList.add('active');
    }

    if (type === 'login') {
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('registerForm').classList.add('hidden');
    } else {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.remove('hidden');
    }
}

// Payment Functions
let currentBuyTrack = null;

function buyTrack(id) {
    if (!token) {
        showNotification('Bitte melden Sie sich an, um zu kaufen', 'info');
        openModal('login');
        return;
    }
    currentBuyTrack = playlist.find(t => t.id === id);
    if (!currentBuyTrack) return;

    document.getElementById('paymentTrackInfo').innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
            <img src="${currentBuyTrack.cover || '/images/default-cover.jpg'}" style="width: 80px; height: 80px; border-radius: 12px; object-fit: cover;">
            <div>
                <h3 style="margin-bottom: 4px;">${currentBuyTrack.title}</h3>
                <p style="color: var(--text-secondary);">${currentBuyTrack.artist}</p>
                <div class="music-price" style="font-size: 1.5rem; margin-top: 8px;">${currentBuyTrack.price} €</div>
            </div>
        </div>
    `;
    document.getElementById('paymentModal').classList.add('active');

    // Reset stripe card
    document.getElementById('stripeCardElement').classList.add('hidden');
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
    currentBuyTrack = null;
}

async function payWithStripe() {
    if (!currentBuyTrack) return;

    try {
        const res = await fetch(`${API}/payment/stripe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ music_id: currentBuyTrack.id })
        });

        const data = await res.json();
        if (data.clientSecret) {
            // Show card element
            document.getElementById('stripeCardElement').classList.remove('hidden');

            // Initialize card element
            const elements = stripeInstance.elements();
            const cardElement = elements.create('card', {
                style: {
                    base: {
                        color: '#ffffff',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '16px',
                        '::placeholder': { color: '#64748b' }
                    }
                }
            });
            cardElement.mount('#card-element');
            stripeCard = { cardElement, clientSecret: data.clientSecret };

            cardElement.on('change', (event) => {
                const errorDiv = document.getElementById('card-errors');
                errorDiv.textContent = event.error ? event.error.message : '';
            });
        } else {
            showNotification(data.msg || 'Stripe Fehler', 'error');
        }
    } catch (err) {
        console.error(err);
        showNotification('Stripe Fehler', 'error');
    }
}

async function confirmStripePayment() {
    if (!stripeCard || !currentBuyTrack) return;

    try {
        const { error, paymentIntent } = await stripeInstance.confirmCardPayment(
            stripeCard.clientSecret,
            { payment_method: { card: stripeCard.cardElement } }
        );

        if (error) {
            showNotification('Zahlungsfehler: ' + error.message, 'error');
        } else {
            confirmPurchase('stripe', paymentIntent.id, currentBuyTrack.price);
        }
    } catch (err) {
        showNotification('Zahlungsfehler', 'error');
    }
}

function payWithPayPal() {
    if (!currentBuyTrack) return;
    showNotification('PayPal Integration - Bitte im Backend konfigurieren', 'info');
    // PayPal popup implementation would go here
}

async function confirmPurchase(method, transactionId, amount) {
    try {
        const res = await fetch(`${API}/payment/confirm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({
                music_id: currentBuyTrack.id,
                payment_method: method,
                transaction_id: transactionId,
                amount: amount
            })
        });

        const data = await res.json();
        if (data.success) {
            showNotification(data.message, 'success');
            closePaymentModal();
            if (data.downloadUrl) {
                window.open(data.downloadUrl, '_blank');
            }
        } else {
            showNotification(data.msg || 'Fehler', 'error');
        }
    } catch (err) {
        showNotification('Fehler bei der Bestätigung', 'error');
    }
}

// Playlist Functions
async function togglePlaylistModal() {
    if (!token) {
        showNotification('Bitte anmelden', 'info');
        openModal('login');
        return;
    }

    const modal = document.getElementById('playlistModal');
    if (modal.classList.contains('active')) {
        modal.classList.remove('active');
    } else {
        modal.classList.add('active');
        await loadPlaylists();
    }
}

function closePlaylistModal() {
    document.getElementById('playlistModal').classList.remove('active');
}

async function loadPlaylists() {
    try {
        const res = await fetch(`${API}/playlist`, {
            headers: { 'x-auth-token': token }
        });
        const playlists = await res.json();

        const container = document.getElementById('playlistList');
        if (playlists.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Keine Playlists vorhanden</p>';
        } else {
            container.innerHTML = playlists.map(p => `
                <div class="playlist-item">
                    <span><i class="fas fa-list-music" style="margin-right: 8px;"></i>${p.name}</span>
                    <button class="control-btn" onclick="viewPlaylist(${p.id})"><i class="fas fa-eye"></i></button>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error(err);
    }
}

async function createPlaylist() {
    const name = document.getElementById('newPlaylistName').value;
    if (!name) return;

    try {
        const res = await fetch(`${API}/playlist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ name })
        });

        if (res.ok) {
            showNotification('Playlist erstellt!', 'success');
            document.getElementById('newPlaylistName').value = '';
            await loadPlaylists();
        }
    } catch (err) {
        showNotification('Fehler', 'error');
    }
}

async function addToPlaylistPrompt(musicId) {
    if (!token) {
        openModal('login');
        return;
    }

    try {
        const res = await fetch(`${API}/playlist`, {
            headers: { 'x-auth-token': token }
        });
        const playlists = await res.json();

        if (playlists.length === 0) {
            showNotification('Erstellen Sie zuerst eine Playlist', 'info');
            togglePlaylistModal();
            return;
        }

        // For simplicity, add to first playlist or show selection
        const playlistId = playlists[0].id;
        const addRes = await fetch(`${API}/playlist/${playlistId}/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify({ music_id: musicId })
        });

        if (addRes.ok) {
            showNotification('Zur Playlist hinzugefügt!', 'success');
        }
    } catch (err) {
        showNotification('Fehler', 'error');
    }
}

// Filter
function filterMusic(category) {
    fetch(`${API}/music`).then(r => r.json()).then(music => {
        let filtered = music;
        if (category === 'free') filtered = music.filter(m => m.is_free);
        else if (category !== 'all') filtered = music.filter(m => m.category === category);
        renderMusic(filtered, 'allMusic');
    });
}

// Donate
function selectAmount(btn) {
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// Notification
function showNotification(message, type = 'info') {
    const div = document.createElement('div');
    div.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        z-index: 3000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--accent)'};
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;
    div.textContent = message;
    document.body.appendChild(div);

    setTimeout(() => {
        div.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

// Close modals on outside click
window.onclick = (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
};

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
