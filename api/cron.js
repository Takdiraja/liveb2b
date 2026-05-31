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

    // 2. Cek jumlah Subscriber sekaligus (Lebih hemat kuota)
    const channelIds = channels.filter(c => c.channelId).map(c => c.channelId);
    if (channelIds.length > 0) {
      const idsParam = channelIds.join(',');
      const statsRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${idsParam}&key=${YOUTUBE_API_KEY}`);
      const statsData = await statsRes.json();
      
      if (statsData.items) {
        statsData.items.forEach(item => {
          const channel = channels.find(c => c.channelId === item.id);
          if (channel) {
            const subsCount = item.statistics.subscriberCount;
            // Format angka
            let formattedSubs = subsCount;
            if (subsCount >= 1000000) {
                formattedSubs = (subsCount / 1000000).toFixed(1) + 'M';
            } else if (subsCount >= 1000) {
                formattedSubs = (subsCount / 1000).toFixed(1) + 'K';
            } else {
                formattedSubs = subsCount.toString();
            }
            
            if (channel.handle && channel.handle.includes('Subscribers')) {
                channel.handle = channel.handle.replace(/- .*Subscribers/, `- ${formattedSubs} Subscribers`);
            }
          }
        });
      }
    }

    // 3. Cek Status Live tiap channel
    for (let i = 0; i < channels.length; i++) {
      let channel = channels[i];
      if (!channel.channelId) continue;

      const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel.channelId}&type=video&eventType=live&key=${YOUTUBE_API_KEY}`);
      const searchData = await searchRes.json();

      checkedCount++;
      if (searchData.items && searchData.items.length > 0) {
        channel.isLive = true;
        liveCount++;
      } else {
        channel.isLive = false;
      }
    }

    // 4. Simpan kembali data yang sudah terupdate ke Firebase
    await fetch(`${FIREBASE_DB_URL}/channels.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(channels)
    });

    return res.status(200).json({ 
        message: 'Pengecekan berhasil!', 
        checked: checkedCount, 
        live: liveCount 
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
