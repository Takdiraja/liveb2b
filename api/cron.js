export default async function handler(req, res) {
  // Pengamanan Endpoint: Hanya bisa diakses oleh Vercel Cron ATAU Admin (melalui tombol manual)
  const isVercelCron = req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`;
  const isManualAdmin = req.query.secret === 'girdamill123';

  if (!isVercelCron && !isManualAdmin) {
    return res.status(401).json({ error: 'Unauthorized access. Only Cron or Admin allowed.' });
  }

  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  const FIREBASE_DB_URL = "https://back2back-2a6da-default-rtdb.asia-southeast1.firebasedatabase.app";

  if (!YOUTUBE_API_KEY) {
    return res.status(500).json({ error: 'YOUTUBE_API_KEY belum diatur di Vercel Environment Variables.' });
  }

  try {
    // 1. Ambil data channel dari Firebase
    const fbRes = await fetch(`${FIREBASE_DB_URL}/channels.json`);
    const data = await fbRes.json();
    let channels = data || [];

    if (!channels || channels.length === 0) {
      return res.status(200).json({ message: 'Tidak ada channel untuk dicek.' });
    }

    let checkedCount = 0;
    let liveCount = 0;

    // 1.5. Otomatis mencari Channel ID asli jika User hanya memasukkan URL dengan @nama (Handle)
    for (let i = 0; i < channels.length; i++) {
        if (!channels[i].channelId && channels[i].youtubeUrl && channels[i].youtubeUrl.includes('@')) {
            const handleMatch = channels[i].youtubeUrl.match(/@([\w.-]+)/);
            if (handleMatch) {
                const handle = handleMatch[1];
                const idRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=@${handle}&key=${YOUTUBE_API_KEY}`);
                const idData = await idRes.json();
                if (idData.items && idData.items.length > 0) {
                    channels[i].channelId = idData.items[0].id;
                }
            }
        }
    }



    // 2. Cek Status Live tiap channel menggunakan HTML Scraping (100% GRATIS, TANPA KUOTA API)
    for (let i = 0; i < channels.length; i++) {
      let channel = channels[i];
      let scrapeUrl = '';

      // Tentukan URL untuk di-scrape (Bisa Handle @ atau Channel ID)
      if (channel.youtubeUrl && channel.youtubeUrl.includes('@')) {
          const handleMatch = channel.youtubeUrl.match(/@([\w.-]+)/);
          if (handleMatch) scrapeUrl = `https://www.youtube.com/@${handleMatch[1]}/live`;
      } else if (channel.channelId) {
          scrapeUrl = `https://www.youtube.com/channel/${channel.channelId}/live`;
      }

      if (!scrapeUrl) continue;

      try {
          // Menyamar sebagai browser Chrome biasa agar tidak diblokir YouTube
          const scrapeRes = await fetch(scrapeUrl, {
              headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                  'Accept-Language': 'en-US,en;q=0.9'
              }
          });
          const htmlText = await scrapeRes.text();
          
          checkedCount++;
          // YouTube menaruh flag "isLiveNow":true di source code jika sedang live
          if (htmlText.includes('"isLiveNow":true') || htmlText.includes('"isLive":true')) {
              channel.isLive = true;
              liveCount++;
          } else {
              channel.isLive = false;
          }
      } catch (err) {
          console.error("Gagal memeriksa:", channel.name, err);
      }
    }

    // 3. Simpan hasil perubahan (Live/Offline) kembali ke Firebase
    await fetch(`${FIREBASE_DB_URL}/channels.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(channels)
    });

    return res.status(200).json({ 
      message: 'Pengecekan berhasil! Sistem Anti-Limit berjalan.', 
      checked: checkedCount, 
      live: liveCount 
    });

  } catch (error) {
    console.error("Cron Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
