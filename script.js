const initialChannels = [];

// State Management
let channels = [];
let tempAvatarUrl = null;
let tempChannelId = null;
let isAdmin = false;

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCsNYPaCJmdg6l6rGzDLFzmTJpLhLTThCY",
  authDomain: "back2back-2a6da.firebaseapp.com",
  databaseURL: "https://back2back-2a6da-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "back2back-2a6da",
  storageBucket: "back2back-2a6da.firebasestorage.app",
  messagingSenderId: "119217029270",
  appId: "1:119217029270:web:95c81bc02227a6f7ebc2b7",
  measurementId: "G-NWNYHFK27E"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Initialize App
function initApp() {
    // Listen to Firebase Realtime Database
    db.ref('channels').on('value', (snapshot) => {
        const data = snapshot.val();
        channels = data || [];
        
        renderUserView();
        renderAdminTable();
    });

    // Initialize Lucide icons
    lucide.createIcons();

    // Setup Event Listeners
    setupEventListeners();
}

// Save to Firebase
function saveChannels() {
    db.ref('channels').set(channels);
}

// Helper for Role Badges
const getRoleBadgeHTML = (role) => {
    if (!role) return '';
    let style = '';
    switch(role) {
        case 'OG': style = 'background: linear-gradient(135deg, #F3C300, #b58d00); color: #000; box-shadow: 0 0 10px rgba(243, 195, 0, 0.4); border: 1px solid #ffe670;'; break;
        case 'The CB': style = 'background: linear-gradient(135deg, #8A2BE2, #5a119e); color: #fff; box-shadow: 0 0 10px rgba(138, 43, 226, 0.4); border: 1px solid #ba75ff;'; break;
        case 'Member': style = 'background: linear-gradient(135deg, #00B4DB, #0083B0); color: #fff; border: 1px solid #5ce1ff;'; break;
        case 'Hang around': style = 'background: linear-gradient(135deg, #7F8C8D, #4d5656); color: #fff; border: 1px solid #a8baba;'; break;
        default: style = 'background: #333; color: #fff;';
    }
    return `<span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px; ${style}">${role}</span>`;
};

// Render User View
function renderUserView(filterQuery = '') {
    const list = document.getElementById('channel-list');
    list.innerHTML = '';

    let filtered = channels.filter(c => 
        c.name.toLowerCase().includes(filterQuery.toLowerCase())
    );

    // Sorting by Role Priority
    const rolePriority = {
        "OG": 1,
        "The CB": 2,
        "Member": 3,
        "Hang around": 4
    };

    filtered.sort((a, b) => {
        const priorityA = rolePriority[a.role] || 99;
        const priorityB = rolePriority[b.role] || 99;
        return priorityA - priorityB;
    });

    if(filtered.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 4rem 1rem; color: var(--text-muted); background: var(--bg-card); border: 1px dashed var(--border-glass); border-radius: 16px; animation: fadeIn 0.4s ease;">
                <i data-lucide="radio" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5; color: var(--neon-primary);"></i>
                <p style="font-size: 1.2rem; font-weight: 600; color: #fff;">Belum Ada Channel</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">Daftar kreator favorit akan muncul di sini setelah ditambahkan.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    filtered.forEach(channel => {
        const card = document.createElement('div');
        card.className = 'channel-card';
        
        const badgeHTML = channel.isLive 
            ? `<div class="status-badge live"><span class="dot"></span> Live</div>`
            : `<div class="status-badge offline"><span class="dot"></span> Offline</div>`;

        card.innerHTML = `
            <div class="card-left">
                <img src="${channel.avatar}" alt="${channel.name}" class="avatar">
                <div class="channel-info">
                    ${getRoleBadgeHTML(channel.role)}
                    <h3 class="channel-name">${channel.name}</h3>
                    <p class="channel-handle">${channel.handle}</p>
                </div>
            </div>
            <div class="card-right">
                ${badgeHTML}
                <a href="${channel.wiki && channel.wiki.slug ? '/wiki/' + channel.wiki.slug : '#'}" class="btn btn-secondary" style="white-space: nowrap;" ${!(channel.wiki && channel.wiki.slug) ? 'onclick="alert(\'Wiki untuk karakter ini belum tersedia.\'); return false;"' : ''}>
                    <i data-lucide="book-open" style="width: 16px; height: 16px; fill: currentColor;"></i>
                    Wiki
                </a>
                <a href="${channel.youtubeUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="white-space: nowrap;">
                    <i data-lucide="play" style="width: 16px; height: 16px; fill: currentColor;"></i>
                    Tonton
                </a>
            </div>
        `;
        list.appendChild(card);
    });

    // Re-initialize icons for newly added HTML
    lucide.createIcons();
}

// Render Admin Table
function renderAdminTable() {
    const tbody = document.getElementById('admin-table-body');
    tbody.innerHTML = '';

    if(channels.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Belum ada channel.</td></tr>';
        return;
    }

    // Sort Admin Table by Role as well for consistency
    const rolePriority = { "OG": 1, "The CB": 2, "Member": 3, "Hang around": 4 };
    let sortedAdminChannels = [...channels].sort((a, b) => {
        return (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99);
    });

    sortedAdminChannels.forEach(channel => {
        const tr = document.createElement('tr');
        
        const badgeHTML = channel.isLive 
            ? `<span style="color: var(--neon-red); font-weight: 600;">LIVE</span>`
            : `<span style="color: var(--text-muted);">OFFLINE</span>`;

        tr.innerHTML = `
            <td>
                <div class="admin-channel-info">
                    <img src="${channel.avatar}" alt="${channel.name}">
                    <div>
                        ${getRoleBadgeHTML(channel.role)}
                        <div style="font-weight: 600; color: #fff; margin-top: 2px;">${channel.name}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">${channel.handle}</div>
                    </div>
                </div>
            </td>
            <td>${badgeHTML}</td>
            <td>
                <button class="btn btn-secondary edit-wiki-btn" data-id="${channel.id}" title="Edit Wiki" style="padding: 0.5rem; background: rgba(255,255,255,0.1); margin-right: 0.5rem;">
                    <i data-lucide="book-open" style="width: 16px; height: 16px;"></i>
                </button>
                <button class="btn btn-danger delete-btn" data-id="${channel.id}" title="Hapus" style="padding: 0.5rem;">
                    <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Attach delete events
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            deleteChannel(id);
        });
    });

    // Attach edit wiki events
    document.querySelectorAll('.edit-wiki-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            openWikiModal(id);
        });
    });

    lucide.createIcons();
}

// Delete Channel
function deleteChannel(id) {
    if(confirm('Apakah Anda yakin ingin menghapus channel ini?')) {
        channels = channels.filter(c => c.id !== id);
        saveChannels();
        renderAdminTable();
        renderUserView();
    }
}

// Add Channel
async function addChannel(e) {
    e.preventDefault();
    
    const urlInput = document.getElementById('c-url');
    const roleInput = document.getElementById('c-role');
    const url = urlInput.value.trim();
    const role = roleInput.value;
    const submitBtn = document.getElementById('submit-channel-btn');
    const statusText = document.getElementById('fetch-status');

    if(!url || !role) {
        alert("URL dan Pangkat (Role) wajib diisi!");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader" class="spin"></i> Mencari data...';
    statusText.style.display = 'block';
    statusText.textContent = 'Memindai profil YouTube...';
    statusText.style.color = 'var(--text-muted)';
    lucide.createIcons();

    try {
        const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        
        if(json.status === 'success' && json.data) {
            const data = json.data;
            const name = data.title || 'Channel Baru';
            
            // Extract handle
            let handleMatch = url.match(/@([\w.-]+)/);
            let handleText = handleMatch ? `@${handleMatch[1]}` : 'Channel YouTube';
            
            // Extract Channel ID
            let channelId = null;
            if(data.url && data.url.includes('/channel/UC')) {
                const match = data.url.match(/channel\/(UC[\w-]+)/);
                if(match) channelId = match[1];
            }

            const newChannel = {
                id: Date.now().toString(),
                name,
                handle: `${handleText} - ... Subscribers`,
                youtubeUrl: url,
                channelId: channelId,
                isLive: false,
                role: role,
                avatar: (data.image && data.image.url) ? data.image.url : `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=b6e3f4`,
                thumbnail: ''
            };

            channels.push(newChannel);
            saveChannels();
            
            statusText.textContent = 'Berhasil ditambahkan!';
            statusText.style.color = '#10b981';
            
            // Reset Form & Update UI
            urlInput.value = '';
            roleInput.value = '';
            renderAdminTable();
            renderUserView();

            // Auto trigger API check to get subs & live status
            if (channelId) {
                checkLiveStatusAll(false);
            }
        } else {
            throw new Error('Data tidak ditemukan');
        }
    } catch(err) {
        console.error(err);
        statusText.textContent = 'Gagal otomatis menarik data. Pastikan URL benar.';
        statusText.style.color = 'var(--neon-red)';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="plus"></i> Tambah Channel';
        lucide.createIcons();
        setTimeout(() => {
            statusText.style.display = 'none';
        }, 3000);
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Navigation
    const adminToggleBtn = document.getElementById('admin-toggle-btn');
    const backToUserBtn = document.getElementById('back-to-user-btn');
    const userView = document.getElementById('user-view');
    const adminView = document.getElementById('admin-view');

    adminToggleBtn.addEventListener('click', () => {
        const pw = prompt('Masukkan Password Admin:');
        if (pw === 'girdamill123') {
            isAdmin = true;
            userView.classList.remove('active');
            adminView.classList.add('active');
        } else if (pw !== null) {
            alert('Password salah!');
        }
    });

    backToUserBtn.addEventListener('click', () => {
        adminView.classList.remove('active');
        userView.classList.add('active');
    });

    // Search
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        renderUserView(e.target.value);
    });

    // Add Form Submit
    const addForm = document.getElementById('add-channel-form');
    addForm.addEventListener('submit', addChannel);

    // Check Live Status Button
    const checkLiveBtn = document.getElementById('check-live-btn');
    checkLiveBtn.addEventListener('click', () => {
        checkLiveStatusAll(true);
    });

    // Edit Wiki Form Submit
    const editWikiForm = document.getElementById('edit-wiki-form');
    editWikiForm.addEventListener('submit', handleWikiSubmit);

    // Close Wiki Modal
    const closeWikiBtn = document.getElementById('close-wiki-modal');
    closeWikiBtn.addEventListener('click', () => {
        document.getElementById('wiki-modal').classList.remove('active');
    });

    // Dropzone logic
    setupDropzone();
}

function setupDropzone() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('w-file-input');
    const removeBtn = document.getElementById('remove-img-btn');

    // Click to select
    dropzone.addEventListener('click', (e) => {
        if(e.target === removeBtn || removeBtn.contains(e.target)) return;
        fileInput.click();
    });

    // Drag events
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if(e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleImageFile(e.dataTransfer.files[0]);
        }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if(e.target.files && e.target.files.length > 0) {
            handleImageFile(e.target.files[0]);
        }
    });

    // Remove image
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetDropzone();
    });
}

function handleImageFile(file) {
    if(!file.type.match('image.*')) {
        alert('Tolong masukkan file berupa gambar!');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // Kompresi dengan Canvas
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 500;
            const MAX_HEIGHT = 500;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to base64 webp
            const dataUrl = canvas.toDataURL('image/webp', 0.85);
            setDropzonePreview(dataUrl);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function setDropzonePreview(imageUrl) {
    document.getElementById('w-image').value = imageUrl;
    document.getElementById('w-image-preview').src = imageUrl;
    document.getElementById('w-image-preview').style.display = 'block';
    document.getElementById('dropzone-content').style.display = 'none';
    document.getElementById('remove-img-btn').style.display = 'flex';
}

function resetDropzone() {
    document.getElementById('w-image').value = '';
    document.getElementById('w-image-preview').src = '';
    document.getElementById('w-image-preview').style.display = 'none';
    document.getElementById('dropzone-content').style.display = 'block';
    document.getElementById('remove-img-btn').style.display = 'none';
    document.getElementById('w-file-input').value = '';
}

// Wiki Modal Handlers
function openWikiModal(id) {
    const channel = channels.find(c => c.id === id);
    if(!channel) return;

    document.getElementById('w-id').value = id;
    
    if(channel.wiki) {
        document.getElementById('w-slug').value = channel.wiki.slug || '';
        document.getElementById('w-fullname').value = channel.wiki.fullName || '';
        document.getElementById('w-affiliation').value = channel.wiki.affiliation || '';
        document.getElementById('w-bio').value = channel.wiki.bio || '';
        document.getElementById('w-trivia').value = channel.wiki.trivia || '';
        
        if (channel.wiki.imageUrl) {
            setDropzonePreview(channel.wiki.imageUrl);
        } else {
            resetDropzone();
        }
    } else {
        // Auto-generate slug suggestion
        const suggestedSlug = channel.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        document.getElementById('w-slug').value = suggestedSlug;
        document.getElementById('w-fullname').value = '';
        document.getElementById('w-affiliation').value = '';
        document.getElementById('w-bio').value = '';
        document.getElementById('w-trivia').value = '';
        resetDropzone();
    }

    document.getElementById('wiki-modal').classList.add('active');
}

function handleWikiSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('w-id').value;
    const channelIndex = channels.findIndex(c => c.id === id);
    if(channelIndex === -1) return;

    let slug = document.getElementById('w-slug').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    
    // Check slug uniqueness
    const isDuplicate = channels.some(c => c.id !== id && c.wiki && c.wiki.slug === slug);
    if(isDuplicate) {
        alert("URL Slug ini sudah digunakan oleh channel lain! Silakan gunakan slug berbeda.");
        return;
    }

    channels[channelIndex].wiki = {
        slug: slug,
        fullName: document.getElementById('w-fullname').value.trim(),
        imageUrl: document.getElementById('w-image').value.trim(),
        affiliation: document.getElementById('w-affiliation').value.trim(),
        bio: document.getElementById('w-bio').value.trim(),
        trivia: document.getElementById('w-trivia').value.trim()
    };

    saveChannels();
    document.getElementById('wiki-modal').classList.remove('active');
    renderUserView();
    alert("Data Wiki berhasil disimpan!");
}

// Helper to format numbers (e.g. 1500 -> 1.5K)
function formatSubscribers(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Function to check live status using Backend Server
async function checkLiveStatusAll(manual = false) {
    if (!isAdmin && !manual) return;

    const statusText = document.getElementById('live-check-status');
    const checkLiveBtn = document.getElementById('check-live-btn');
    
    if(statusText) {
        statusText.textContent = 'Memerintah server Vercel untuk mengecek... Mohon tunggu.';
        statusText.style.color = 'var(--neon-primary)';
    }
    if(checkLiveBtn) checkLiveBtn.disabled = true;

    try {
        // Panggil endpoint backend kita dengan secret key
        const res = await fetch('/api/cron?secret=girdamill123');
        const data = await res.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        if(statusText) {
            statusText.textContent = `Server merespon: ${data.message} (${data.live} dari ${data.checked} channel sedang live)`;
            statusText.style.color = '#10b981';
        }
    } catch (err) {
        console.error("Gagal memanggil server backend:", err);
        if(statusText) {
            statusText.textContent = 'Gagal memanggil server. ' + err.message;
            statusText.style.color = 'var(--neon-red)';
        }
    } finally {
        if(checkLiveBtn) checkLiveBtn.disabled = false;
        
        if(manual && statusText) {
            setTimeout(() => {
                if(statusText.textContent.includes('merespon')) {
                    statusText.textContent = '';
                }
            }, 5000);
        }
    }
}

// Run app on DOM loaded
document.addEventListener('DOMContentLoaded', initApp);
