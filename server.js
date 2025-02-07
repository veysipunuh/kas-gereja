const express = require('express');
const fs = require('fs').promises;  // Gunakan fs.promises untuk async/await
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware untuk menangani JSON dan file statis
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Path file JSON
const jsonFilePath = path.join(__dirname, 'public', 'donasi.json');
const riwayatFilePath = path.join(__dirname, 'public', 'riwayat.json');

// API untuk mendapatkan data JSON donasi
app.get('/api/donasi', async (req, res) => {
  try {
    const data = await fs.readFile(jsonFilePath, 'utf8');
    const donasiData = JSON.parse(data);
    res.json(donasiData); // Kirim data JSON ke klien
  } catch (err) {
    console.error('Gagal membaca file:', err);
    return res.status(500).json({ error: 'Gagal membaca file donasi.json' });
  }
});
function parseCustomDate(waktu) {
    // Ambil bagian waktu dari string "Minggu, 17 November 2024 pukul 08.50.23"
    const waktuParts = waktu.split(' pukul ')[1];
    return new Date('2024-' + waktuParts); // Menyusun ulang string waktu menjadi format yang bisa diparse oleh JavaScript
  }
  
// API untuk memperbarui donasi
app.post('/api/donasi', async (req, res) => {
    const { nama, donasi, tanggal } = req.body;

    if (!nama || !donasi || donasi <= 0 || !tanggal) {
      return res.status(400).json({ message: 'Data tidak valid' });
    }
    
    try {
      // Baca file donasi.json untuk memverifikasi data anggota
      const data = await fs.readFile(jsonFilePath, 'utf8');
      let donasiData = JSON.parse(data);
      const anggota = donasiData.find(item => item.nama === nama);
    
      if (!anggota) {
        return res.status(404).json({ message: 'Nama tidak ditemukan' });
      }
    
      // Menambahkan donasi dan tanggal
      anggota.donasi += donasi;
      anggota.tanggalDonasi = tanggal;
    
      // Simpan kembali data ke donasi.json
      await fs.writeFile(jsonFilePath, JSON.stringify(donasiData, null, 2));
    
      // Simpan data ke riwayat.json
      const riwayatData = await fs.readFile(riwayatFilePath, 'utf8').catch(() => '[]'); // Jika file tidak ada, return array kosong
      let riwayat = JSON.parse(riwayatData);
    
      const newRiwayat = {
        nama,
        donasi,
        tanggal,
        waktu: new Date().toLocaleString('id-ID', { // Format waktu sesuai dengan lokal Indonesia
          weekday: 'long',  // Menampilkan hari (Senin, Selasa, dll)
          year: 'numeric',  // Tahun penuh
          month: 'long',    // Nama bulan (Januari, Februari, dll)
          day: 'numeric',   // Hari
          hour: 'numeric',  // Jam
          minute: 'numeric',// Menit
          second: 'numeric',// Detik
          hour12: false      // Format 24 jam
        })
      };
    
      // Menambahkan data ke bagian atas array
      riwayat.unshift(newRiwayat);
    
      // Urutkan riwayat berdasarkan waktu (terbaru di atas)
      riwayat.sort((a, b) => parseCustomDate(b.waktu) - parseCustomDate(a.waktu));
    
      // Simpan data ke riwayat.json
      await fs.writeFile(riwayatFilePath, JSON.stringify(riwayat, null, 2));
    
      res.json({ message: 'Donasi berhasil ditambahkan', data: anggota });
    } catch (err) {
      console.error('Gagal memperbarui data:', err);
      res.status(500).json({ message: 'Gagal memperbarui data' });
    }
    
});
app.post('/kurangi-donasi', async (req, res) => {
    const { nama, donasi, tanggal } = req.body;
  
    if (!nama || !donasi || donasi <= 0 || !tanggal) {
      return res.status(400).json({ message: 'Data tidak valid' });
    }
  
    try {
      // Baca data dari donasi.json
      const data = await fs.readFile(jsonFilePath, 'utf8');
      let donasiData = JSON.parse(data);
      const anggota = donasiData.find(item => item.nama === nama);
  
      if (!anggota) {
        return res.status(404).json({ message: 'Nama tidak ditemukan' });
      }
  
      // Mengurangi donasi
      if (anggota.donasi < donasi) {
        return res.status(400).json({ message: 'Jumlah donasi yang dikurangi melebihi saldo' });
      }
  
      anggota.donasi -= donasi;
  
      // Simpan kembali data ke donasi.json
      await fs.writeFile(jsonFilePath, JSON.stringify(donasiData, null, 2));
  
      // Simpan ke riwayat.json
      const riwayatData = await fs.readFile(riwayatFilePath, 'utf8').catch(() => '[]'); // Jika file tidak ada, return array kosong
      let riwayat = JSON.parse(riwayatData);
  
      const newRiwayat = {
        nama,
        donasi: -donasi,  // Menandakan pengurangan
        tanggal,
        waktu: new Date().toLocaleString('id-ID', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false
        })
      };
  
      riwayat.unshift(newRiwayat);  // Tambahkan pengurangan ke paling atas
      await fs.writeFile(riwayatFilePath, JSON.stringify(riwayat, null, 2));
  
      res.json({ message: 'Donasi berhasil dikurangi', data: anggota });
    } catch (err) {
      console.error('Gagal memperbarui data:', err);
      res.status(500).json({ message: 'Gagal memperbarui data' });
    }
  });
  
// Endpoint utama untuk melayani halaman tambah.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tambah.html'));
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});