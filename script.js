const initialChannels = [];

// State Management
let channels = [];
let tempAvatarUrl = null;
let tempChannelId = null;

// Obfuscated Default API Key
const _p1 = atob('QUl6YVN5'); 
const _p2 = 'Azy2XiRFEBZ1Jxmn';
const _p3 = atob('Q092bFhvdV8wX0xyZllzSTA=');
let ytApiKey = localStorage.getItem('ytApiKey') || (_p1 + _p2 + _p3);

// Initialize App
function initApp() {
    // Load from localStorage or use initial data
    const savedChannels = localStorage.getItem('ytDashboardChannels');
    if (savedChannels) {
        let loaded = JSON.parse(savedChannels);
        
        // Migration: Fix missing channelIds for existing mock data
        loaded = loaded.map(c => {
            const initial = initialChannels.find(ic => ic.name === c.name);
            if (initial && !c.channelId) c.channelId = initial.channelId;
            return c;
        });
        channels = loaded;
        saveChannels();
    } else {
        channels = [...initialChannels];
        saveChannels();
    }

    // Initialize Lucide icons
    lucide.createIcons();

    // Render initial views
    if (ytApiKey) {
        document.getElementById('api-key-input').value = ytApiKey;
        // Start real-time auto check every 3 minutes (180000ms)
        setInterval(checkLiveStatusAll, 180000);
        // Do an initial check after 2 seconds
        setTimeout(checkLiveStatusAll, 2000);
    }
    renderUserView();
    renderAdminTable();

    // Setup Event Listeners
    setupEventListeners();
}

// Save to localStorage
function saveChannels() {
    localStorage.setItem('ytDashboardChannels', JSON.stringify(channels));
}

// Render User View
function renderUserView(filterQuery = '') {
    const list = document.getElementById('channel-list');
    list.innerHTML = '';

    const filtered = channels.filter(c => 
        c.name.toLowerCase().includes(filterQuery.toLowerCase())
    );

    if(filtered.length === 0) {
        list.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Tidak ada channel yang ditemukan.</p>';
        return;
    }

    filtered.forEach(channel => {
        const card = document.createElement('div');
        card.className = 'channel-card';
        
        const badgeHTML = channel.isLive 
            ? `<div class="status-badge live"><span class="dot"></span> Live</div>`
            : `<div class="status-badge offline"><span class="dot"></span> Offline</div>`;

        card.innerHTML = `
            <div class="card-header">
                <img src="${channel.avatar}" alt="${channel.name}" class="avatar">
                <div class="channel-info">
                    <h3 class="channel-name">${channel.name}</h3>
                    <p class="channel-handle">${channel.handle}</p>
                </div>
                ${badgeHTML}
            </div>

            <a href="${channel.youtubeUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="white-space: nowrap;">
                <i data-lucide="play" style="width: 18px; height: 18px;"></i>
                Tonton
            </a>
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

    channels.forEach(channel => {
        const tr = document.createElement('tr');
        
        const badgeHTML = channel.isLive 
            ? `<span style="color: var(--neon-red); font-weight: 600;">LIVE</span>`
            : `<span style="color: var(--text-muted);">OFFLINE</span>`;

        tr.innerHTML = `
            <td>
                <div class="admin-channel-info">
                    <img src="${channel.avatar}" alt="${channel.name}">
                    <div>
                        <div style="font-weight: 600; color: #fff;">${channel.name}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">${channel.handle}</div>
                    </div>
                </div>
            </td>
            <td>${badgeHTML}</td>
            <td>
                <button class="btn btn-danger delete-btn" data-id="${channel.id}" title="Hapus">
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
    const url = urlInput.value.trim();
    const submitBtn = document.getElementById('submit-channel-btn');
    const statusText = document.getElementById('fetch-status');

    if(!url) return;

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
                avatar: (data.image && data.image.url) ? data.image.url : `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=b6e3f4`,
                thumbnail: ''
            };

            channels.push(newChannel);
            saveChannels();
            
            statusText.textContent = 'Berhasil ditambahkan!';
            statusText.style.color = '#10b981';
            
            // Reset Form & Update UI
            urlInput.value = '';
            renderAdminTable();
            renderUserView();

            // Auto trigger API check to get subs & live status
            if (ytApiKey && channelId) {
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

    // API Key Settings
    const saveApiBtn = document.getElementById('save-api-btn');
    saveApiBtn.addEventListener('click', () => {
        const key = document.getElementById('api-key-input').value.trim();
        localStorage.setItem('ytApiKey', key);
        ytApiKey = key;
        const statusText = document.getElementById('live-check-status');
        statusText.textContent = 'API Key berhasil disimpan!';
        statusText.style.color = '#10b981';
        setTimeout(() => statusText.textContent = '', 3000);
    });

    // Check Live Status Button
    const checkLiveBtn = document.getElementById('check-live-btn');
    checkLiveBtn.addEventListener('click', () => {
        if (!ytApiKey) {
            alert('Mohon masukkan dan simpan API Key terlebih dahulu!');
            return;
        }
        checkLiveStatusAll(true);
    });
}

// Helper to format numbers (e.g. 1500 -> 1.5K)
function formatSubscribers(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Function to check live status for all channels
async function checkLiveStatusAll(manual = false) {
    if (!ytApiKey) return;

    const statusText = document.getElementById('live-check-status');
    const checkLiveBtn = document.getElementById('check-live-btn');
    
    if(statusText) {
        statusText.textContent = 'Memeriksa status live & jumlah subscriber... Mohon tunggu.';
        statusText.style.color = 'var(--neon-primary)';
    }
    if(checkLiveBtn) checkLiveBtn.disabled = true;

    let checkedCount = 0;
    let liveCount = 0;
    
    // First: Fetch all subscriber counts in one batch call
    const channelIds = channels.filter(c => c.channelId).map(c => c.channelId);
    if (channelIds.length > 0) {
        try {
            // Can fetch up to 50 IDs at once
            const idsParam = channelIds.join(',');
            const statsRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${idsParam}&key=${ytApiKey}`);
            const statsData = await statsRes.json();
            
            if (statsData.items) {
                statsData.items.forEach(item => {
                    const channel = channels.find(c => c.channelId === item.id);
                    if (channel) {
                        const subsCount = item.statistics.subscriberCount;
                        const formattedSubs = formatSubscribers(subsCount);
                        // Update the handle string to replace "... Subscribers" with actual count
                        if (channel.handle.includes('Subscribers')) {
                            channel.handle = channel.handle.replace(/- .*Subscribers/, `- ${formattedSubs} Subscribers`);
                        }
                    }
                });
            }
        } catch (err) {
            console.error("Failed to fetch subscriber counts:", err);
        }
    }

    // Second: Check live status for each channel

    for (let i = 0; i < channels.length; i++) {
        let channel = channels[i];
        if (!channel.channelId) continue; // Skip if no ID

        try {
            // YouTube Data API search for active live broadcast
            const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel.channelId}&type=video&eventType=live&key=${ytApiKey}`);
            const data = await res.json();
            
            if (data.error) {
                console.error("API Error for " + channel.name + ":", data.error.message);
                continue;
            }

            checkedCount++;
            if (data.items && data.items.length > 0) {
                channel.isLive = true;
                liveCount++;
            } else {
                channel.isLive = false;
            }
        } catch (err) {
            console.error("Network Error for " + channel.name + ":", err);
        }
    }

    saveChannels();
    renderAdminTable();
    renderUserView();
    
    if(statusText) {
        statusText.textContent = `Selesai diperiksa. (${liveCount} dari ${checkedCount} channel sedang live)`;
        statusText.style.color = '#10b981';
    }
    if(checkLiveBtn) checkLiveBtn.disabled = false;
    
    if(manual && statusText) {
        setTimeout(() => {
            if(statusText.textContent.includes('Selesai')) {
                statusText.textContent = '';
            }
        }, 5000);
    }
}

// Run app on DOM loaded
document.addEventListener('DOMContentLoaded', initApp);
