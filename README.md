# buahaha

**buahaha** adalah dashboard internal untuk membantu usaha penjualan buah mengelola kegiatan sehari-hari, mulai dari stok dan pesanan hingga pengiriman, pembayaran, dan laporan usaha.

Aplikasi ini dirancang untuk **Owner** dan **Admin Gudang**, dengan antarmuka berbahasa Indonesia yang dapat digunakan melalui desktop, tablet, maupun ponsel.

## Fitur

| Menu | Fungsi |
| --- | --- |
| Ringkasan | Melihat kondisi usaha, pesanan aktif, tagihan, dan stok yang perlu diisi. |
| Produk & Stok | Mengelola produk, harga, persediaan, serta pencatatan barang masuk, keluar, dan rusak. |
| Pelanggan | Menyimpan kontak, alamat, dan riwayat pesanan pelanggan. |
| Pesanan | Membuat pesanan dan memantau prosesnya sampai selesai. |
| Pengiriman | Mengatur jadwal, petugas, kendaraan, dan pesanan dalam satu perjalanan. |
| Pembayaran | Mencatat transfer, tunai, COD, verifikasi bukti, dan setoran petugas. |
| Pengeluaran | Mencatat pembelian buah, bensin, dan biaya operasional. |
| Retur | Mencatat pengembalian barang beserta bukti, kondisi, dan keputusan pengembalian uang. |
| Laporan | Melihat penjualan dan hasil usaha per hari atau rentang tanggal, serta mengekspor CSV. |

## Status pengembangan

buahaha saat ini berupa **prototipe interaktif**. Alur operasional sudah dapat dicoba, sementara data disimpan di browser menggunakan `localStorage`.

- Pilihan Owner dan Admin Gudang masih berupa simulasi peran; belum tersedia login pengguna.
- Data belum tersinkron antarperangkat atau antarbrowser.
- Penghapusan data browser akan menghapus transaksi lokal. Cadangan JSON dapat diunduh melalui Pengaturan demo; pemulihan melalui antarmuka belum tersedia.
- Hosting aplikasi tidak memindahkan data dari browser lokal ke server.

Data contoh bertanggal **30 September 2026**. Aktivitas mulai **1 Oktober 2026** dapat diisi dengan transaksi baru; stok dan riwayat September tetap tersedia.

## Teknologi

Next.js, React, TypeScript, Tailwind CSS, Zod, dan Lucide. Pengujian menggunakan Node.js Test Runner melalui `tsx` serta Playwright.

## Menjalankan di komputer

Siapkan Node.js 22.13+ atau Node.js 24 dan npm, lalu jalankan:

```bash
git clone https://github.com/RayyanFatih/buahaha.git
cd buahaha
npm install
npm run dev
```

Buka [localhost:3000](http://localhost:3000) di browser. Versi saat ini tidak memerlukan konfigurasi database atau environment variable.

Untuk menjalankan build produksi secara lokal:

```bash
npm run build
npm start
```

## Mencoba aplikasi

1. **Pelanggan → Tambah pelanggan.** Isi nama, WhatsApp, dan alamat. Detail pelanggan juga menyediakan edit dan riwayat transaksi.
2. **Pesanan → Buat pesanan.** Pilih pelanggan, buah, jumlah, harga, serta diskon bila diperlukan. Stok tersedia divalidasi dan langsung dicadangkan.
3. Buka nomor pesanan, pilih **Konfirmasi pesanan**, lalu **Siapkan pesanan**.
4. Pilih **Jadwalkan pengiriman**, isi petugas, kendaraan, rute, dan tanggal. Satu perjalanan dapat membawa beberapa pesanan siap kirim.
5. Di **Pengiriman**, pilih **Mulai perjalanan**, lalu **Tandai terkirim**. Kedua tindakan meminta konfirmasi. Stok keluar pada langkah pertama; pesanan selesai pada langkah kedua.
6. Di **Pembayaran**, catat transfer, tunai, atau COD. Transfer menunggu verifikasi dan wajib memiliki bukti sebelum diverifikasi. Untuk COD, catat penerimaan pelanggan kemudian **Catat setoran** petugas secara terpisah; setoran sebagian didukung.
7. Gunakan **Catat bensin** pada perjalanan atau modul **Pengeluaran**. Biaya melekat pada perjalanan, tidak digandakan per pesanan.
8. Buka **Laporan → Harian**, pilih **Tanggal laporan** atau gunakan tombol hari sebelumnya/berikutnya. **Hari ini** dan **Kemarin** memilih satu hari. Untuk membandingkan beberapa hari, pilih **Rentang tanggal** atau **Bulan ini**; tabel **Rincian per hari** menampilkan penjualan, HPP, biaya, dan hasil setelah biaya setiap tanggal. Klik tanggal untuk membuka hasil hari tersebut beserta pesanan sumbernya. **Ekspor CSV** berisi ringkasan dan rincian harian sesuai filter.
9. Refresh browser untuk memastikan perubahan tetap ada. **Pengaturan demo** menyediakan cadangan JSON dan reset dengan konfirmasi.

## Panduan transaksi

<details>
<summary>Aturan stok, perhitungan laporan, dan batas fitur</summary>

### Aturan perhitungan

- Pesanan baru mencadangkan stok; konfirmasi dan persiapan tidak mengurangi stok fisik. Pengiriman mengurangi stok fisik satu kali dan melepaskan cadangan.
- Pembatalan melepaskan cadangan. Sesudah pengiriman gunakan retur.
- Penjualan diakui ketika pesanan selesai, berdasarkan tanggal selesai. Status lunas tidak menentukan pengakuan penjualan.
- HPP memakai snapshot harga modal saat pesanan dibuat, **bukan FIFO atau rata-rata tertimbang**.
- Laba kotor = penjualan bersih − HPP. Hasil setelah biaya = laba kotor − bensin − biaya operasional lain − kerugian stok yang belum masuk HPP.
- Pembelian buah dicatat sebagai arus kas, tidak dikurangi lagi dari laba. Mutasi masuk dan pembayaran pembelian dicatat terpisah.
- Refund mengurangi penjualan pada tanggal persetujuan retur. Retur layak jual mengembalikan stok dan membalik HPP item; retur rusak tidak membalik HPP atau menambahkan kerugian yang sama lagi. Retur tanpa refund tidak mengurangi tagihan.
- Rentang tanggal inklusif. Tanggal penyelesaian dan persetujuan retur mengikuti Asia/Jakarta.

Data awal bertanggal **30 September 2026**, menghasilkan penjualan Rp4.100.000, HPP Rp2.980.000, bensin Rp175.000, biaya operasional Rp50.000, kerugian stok Rp44.000, dan hasil setelah biaya Rp851.000. Laporan 1 Oktober dan seterusnya kosong sampai transaksi baru dicatat. Saldo awal stok bukan pembelian kas fiktif.

Saat pembaruan ini pertama dibuka, tanggal transaksi lokal yang melewati 30 September disesuaikan sekali ke 30 September; nilai, stok, pelanggan, dan hubungan transaksi dipertahankan. Salinan asli tersedia melalui ikon **Pengaturan demo** di kanan atas → **Unduh data sebelum penyesuaian tanggal**. Transaksi baru setelah migrasi tetap menggunakan tanggal sebenarnya, termasuk setelah refresh. Reset demo juga menggunakan tanggal 30 September.

### Batas prototipe

- **Bukan sistem produksi.** Pergantian peran adalah simulasi; tidak ada autentikasi, otorisasi server, database, atau enkripsi data operasional.
- Data berada di `localStorage` dengan kunci `buahaha.demo.v1`. Penghapusan data browser menghapus transaksi. Cadangan JSON dapat diunduh, tetapi belum ada antarmuka impor/pemulihan. Penggunaan bersama lintas perangkat dan transaksi serentak lintas tab belum didukung secara aman.
- Bukti menerima JPG/PNG/WebP/MP4 hingga **750 KB per berkas**. Batas total mengikuti kuota browser; jika gagal menyimpan, transaksi tidak dianggap berhasil. Bukti bawaan berupa berkas teks yang jelas menyatakan simulasi. Tidak ada unggah server atau pemrosesan pembayaran nyata.
- Owner mengakses seluruh modul. Admin Gudang mengelola produk, stok, pelanggan, pesanan, pengiriman, dan retur tanpa refund. Keuangan dan keputusan retur dengan refund dibatasi ke Owner dalam simulasi. Ringkasan dan status pembayaran pesanan tetap dapat dilihat kedua peran.
- Pesanan yang sudah memiliki pembayaran atau perjalanan tidak dapat dibatalkan di demo; belum ada alur pembatalan dengan refund atau pembongkaran perjalanan. Pesanan tersimpan tidak dapat diedit/dihapus; koreksi transaksi belum tersedia. Keputusan retur bersifat final.
- Setoran COD menyimpan akumulasi per pembayaran, belum jurnal setoran bertanggal atau rekonsiliasi kas petugas yang lengkap. Refund dicatat sebagai keputusan demo, tanpa eksekusi transfer.
- Tidak ada pajak, konversi satuan, batch/kedaluwarsa, multi-gudang, biaya pembelian tertimbang, approval bertingkat, atau audit trail produksi. Kebijakan keuangan produksi perlu dikonfirmasi.
- Tidak ada website pelanggan, checkout publik, integrasi WhatsApp, pelacakan GPS, atau notifikasi eksternal.

</details>

## Pengujian

```bash
npm run lint
npm run typecheck
npm test
```

Untuk pengujian browser, siapkan Google Chrome dan jalankan server lokal di `http://127.0.0.1:3000`, lalu jalankan `npm run test:e2e` di terminal lain.

## Dokumentasi

- [Konteks produk](PRODUCT.md): kebutuhan dan cakupan buahaha.
- [Panduan desain](DESIGN.md): aturan tampilan dan komponen antarmuka.
