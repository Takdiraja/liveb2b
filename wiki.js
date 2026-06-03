// Firebase Configuration (Same as script.js)
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
    return `<span style="display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; ${style}">${role}</span>`;
};

// Initialize Wiki Page
async function initWiki() {
    lucide.createIcons();

    // Ambil slug dari URL path
    const pathParts = window.location.pathname.split('/');
    const slug = pathParts[pathParts.length - 1] || new URLSearchParams(window.location.search).get('id');

    if(!slug) {
        showError("URL tidak valid. Karakter tidak ditemukan.");
        return;
    }

    // Ambil data dari Firebase
    db.ref('channels').once('value', (snapshot) => {
        const channels = snapshot.val() || [];
        // Cari channel yang punya wiki slug yang cocok
        const channel = channels.find(c => c.wiki && c.wiki.slug === slug);
        
        if(channel) {
            renderWiki(channel);
        } else {
            showError(`Lore untuk "${slug}" belum dibuat atau karakter tidak ditemukan.`);
        }
    });
}

function renderWiki(channel) {
    document.title = `${channel.wiki.fullName || channel.name} - BACK2BACK Wiki`;
    
    // Header
    document.getElementById('w-bg').style.backgroundImage = `url('${channel.avatar}')`;
    document.getElementById('w-avatar').src = channel.avatar;
    document.getElementById('w-role').innerHTML = getRoleBadgeHTML(channel.role);
    document.getElementById('w-name').textContent = channel.wiki.fullName || channel.name;
    document.getElementById('w-channel').textContent = channel.handle;

    // Sidebar Info
    document.getElementById('w-affil').textContent = channel.wiki.affiliation || 'Tidak ada afiliasi';
    document.getElementById('w-role-text').textContent = channel.role || '-';
    
    // Status Badge
    const badgeHTML = channel.isLive 
        ? `<div class="status-badge live" style="display:inline-flex;"><span class="dot"></span> Live Streaming</div>`
        : `<div class="status-badge offline" style="display:inline-flex;"><span class="dot"></span> Offline</div>`;
    document.getElementById('w-status').innerHTML = badgeHTML;

    // YouTube Button
    document.getElementById('w-youtube-btn').href = channel.youtubeUrl;

    // Main Content
    if(channel.wiki.bio) {
        document.getElementById('w-bio-content').innerHTML = channel.wiki.bio.replace(/\n/g, '<br><br>');
    }
    
    if(channel.wiki.trivia) {
        document.getElementById('w-trivia-content').innerHTML = channel.wiki.trivia.replace(/\n/g, '<br>');
    }

    // Hide loader, show content
    document.getElementById('loading').style.display = 'none';
    document.getElementById('wiki-content').style.display = 'block';
    
    lucide.createIcons();
}

function showError(msg) {
    document.getElementById('loading').innerHTML = `
        <i data-lucide="alert-triangle" style="width: 64px; height: 64px; color: var(--neon-red); margin-bottom: 1rem;"></i>
        <h2 style="color: #fff; margin-bottom: 1rem;">Wiki Tidak Ditemukan</h2>
        <p style="color: var(--text-muted); margin-bottom: 2rem; text-align: center;">${msg}</p>
        <a href="/" class="btn btn-primary"><i data-lucide="home"></i> Kembali ke Beranda</a>
    `;
    lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', initWiki);
