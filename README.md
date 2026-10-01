# buahaha

Prototipe dashboard internal penjualan dan distribusi buah untuk **Owner** dan **Admin Gudang**. Antarmuka berbahasa Indonesia, Rupiah, satu gudang, dan data contoh yang saling terhubung. Pelanggan memesan melalui WhatsApp/telepon, kemudian staf mencatatnya di dashboard.

## Menjalankan

Gunakan Node.js 22.13+ atau Node.js 24 LTS dan npm. Dari folder proyek:

```bash
npm install
npm run dev
```

Buka **http://localhost:3000**. Bila port tersebut dipakai, gunakan alamat yang dicetak Next.js. Gunakan origin yang sama setiap kali mencoba; `localhost` dan `127.0.0.1` memiliki penyimpanan browser yang berbeda.

Build dan jalankan versi produksi lokal:

```bash
npm run build
npm start
```

Font Geist diunduh saat kompilasi pertama melalui `next/font`. Instalasi dependensi dan build pertama memerlukan akses jaringan. Seluruh transaksi prototipe berjalan di browser; tidak memerlukan database atau kredensial.

## Alur mencoba

1. **Pelanggan → Tambah pelanggan.** Isi nama, WhatsApp, dan alamat. Detail pelanggan juga menyediakan edit dan riwayat transaksi.
2. **Pesanan → Buat pesanan.** Pilih pelanggan, buah, jumlah, harga, serta diskon bila diperlukan. Stok tersedia divalidasi dan langsung dicadangkan.
3. Buka nomor pesanan, pilih **Konfirmasi pesanan**, lalu **Siapkan pesanan**.
4. Pilih **Jadwalkan pengiriman**, isi petugas, kendaraan, rute, dan tanggal. Satu perjalanan dapat membawa beberapa pesanan siap kirim.
5. Di **Pengiriman**, pilih **Mulai perjalanan**, lalu **Tandai terkirim**. Kedua tindakan meminta konfirmasi. Stok keluar pada langkah pertama; pesanan selesai pada langkah kedua.
6. Di **Pembayaran**, catat transfer, tunai, atau COD. Transfer menunggu verifikasi dan wajib memiliki bukti sebelum diverifikasi. Untuk COD, catat penerimaan pelanggan kemudian **Catat setoran** petugas secara terpisah; setoran sebagian didukung.
7. Gunakan **Catat bensin** pada perjalanan atau modul **Pengeluaran**. Biaya melekat pada perjalanan, tidak digandakan per pesanan.
8. Buka **Laporan → Harian**, pilih **Tanggal laporan** atau gunakan tombol hari sebelumnya/berikutnya. **Hari ini** dan **Kemarin** memilih satu hari. Untuk membandingkan beberapa hari, pilih **Rentang tanggal** atau **Bulan ini**; tabel **Rincian per hari** menampilkan penjualan, HPP, biaya, dan hasil setelah biaya setiap tanggal. Klik tanggal untuk membuka hasil hari tersebut beserta pesanan sumbernya. **Ekspor CSV** berisi ringkasan dan rincian harian sesuai filter.
9. Refresh browser untuk memastikan perubahan tetap ada. **Pengaturan demo** menyediakan cadangan JSON dan reset dengan konfirmasi.

## Modul yang tersedia

| Modul         | Kemampuan prototipe                                                                                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ringkasan     | Metrik dari transaksi, filter periode, pesanan terkini, tindak lanjut, stok rendah, dan perjalanan aktif. Pesanan aktif/piutang menunjukkan semua tanggal dengan label yang eksplisit.  |
| Produk & Stok | Tambah/edit produk; SKU unik; harga dan satuan; mutasi masuk, keluar manual, rusak; fisik, cadangan, tersedia; pencarian dan filter stok rendah. Riwayat menampilkan 30 mutasi terbaru. |
| Pelanggan     | Tambah, edit, cari, alamat, catatan, dan riwayat pesanan.                                                                                                                               |
| Pesanan       | Multi-item, diskon, validasi stok, enam status, detail, pembayaran terpisah, pembatalan sebelum kirim sesuai batas di bawah.                                                            |
| Pengiriman    | Jadwal, petugas, kendaraan, alamat/rute, beberapa pesanan per perjalanan, mulai/selesai perjalanan, bensin terkait.                                                                     |
| Pembayaran    | Transfer/tunai/COD, pembayaran sebagian, bukti lokal, verifikasi, penerimaan dan setoran COD terpisah.                                                                                  |
| Pengeluaran   | Bensin, pembelian buah, biaya operasional, petugas, kendaraan/perjalanan opsional, bukti, filter tanggal.                                                                               |
| Retur         | Pengajuan per item dengan alasan dan bukti, batas jumlah, kondisi layak jual/rusak, refund, persetujuan/penolakan.                                                                      |
| Laporan       | Penjualan bersih, HPP, laba kotor, bensin, biaya lain, kerugian nonkas, hasil setelah biaya, CSV.                                                                                       |

Desktop, tablet, dan ponsel didukung. Tabel lebar dapat digeser dengan petunjuk saat isinya melampaui lebar panel. Form memakai label eksplisit, dialog native dengan fokus keyboard dan Escape, pesan kesalahan, serta notifikasi simpan.

## Aturan perhitungan demo

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

## Batas prototipe

- **Bukan sistem produksi.** Pergantian peran adalah simulasi; tidak ada autentikasi, otorisasi server, database, atau enkripsi data operasional.
- Data berada di `localStorage` dengan kunci `buahaha.demo.v1`. Penghapusan data browser menghapus transaksi. Cadangan JSON dapat diunduh, tetapi belum ada antarmuka impor/pemulihan. Penggunaan bersama lintas perangkat dan transaksi serentak lintas tab belum didukung secara aman.
- Bukti menerima JPG/PNG/WebP/MP4 hingga **750 KB per berkas**. Batas total mengikuti kuota browser; jika gagal menyimpan, transaksi tidak dianggap berhasil. Bukti bawaan berupa berkas teks yang jelas menyatakan simulasi. Tidak ada unggah server atau pemrosesan pembayaran nyata.
- Owner mengakses seluruh modul. Admin Gudang mengelola produk, stok, pelanggan, pesanan, pengiriman, dan retur tanpa refund. Keuangan dan keputusan retur dengan refund dibatasi ke Owner dalam simulasi. Ringkasan dan status pembayaran pesanan tetap dapat dilihat kedua peran.
- Pesanan yang sudah memiliki pembayaran atau perjalanan tidak dapat dibatalkan di demo; belum ada alur pembatalan dengan refund atau pembongkaran perjalanan. Pesanan tersimpan tidak dapat diedit/dihapus; koreksi transaksi belum tersedia. Keputusan retur bersifat final.
- Setoran COD menyimpan akumulasi per pembayaran, belum jurnal setoran bertanggal atau rekonsiliasi kas petugas yang lengkap. Refund dicatat sebagai keputusan demo, tanpa eksekusi transfer.
- Tidak ada pajak, konversi satuan, batch/kedaluwarsa, multi-gudang, biaya pembelian tertimbang, approval bertingkat, atau audit trail produksi. Kebijakan keuangan produksi perlu dikonfirmasi.
- Tidak ada website pelanggan, checkout publik, integrasi WhatsApp, pelacakan GPS, atau notifikasi eksternal.

## Struktur

- `src/components/dashboard.tsx`: shell dashboard, modul, formulir, dan panel detail.
- `src/components/ui/button.tsx`: tombol berpola shadcn/ui berbasis Radix Slot, CVA, dan token khusus buahaha.
- `src/lib/domain.ts`: tipe, validasi Zod, perintah transaksi, stok, pembayaran, retur, dan laporan murni.
- `src/lib/demo.ts`: data simulasi dan mutasi stok awal yang direkonsiliasi.
- `src/lib/store.ts`: akses data lokal, validasi, subscriber, ekspor, dan reset. Lapisan ini dapat diganti dengan adapter API.
- `src/app/globals.css`: token, layout, responsivitas, fokus, dan status.
- `PRODUCT.md`: konteks produk dan asumsi operasional.
- `DESIGN.md` dan `.impeccable/design.json`: sistem desain dari implementasi.

## Pemeriksaan

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Pengujian browser memakai Google Chrome yang sudah terpasang, Playwright, dan server di `http://127.0.0.1:3000`:

```bash
npm run dev -- --hostname 127.0.0.1
# Di terminal lain:
npm run test:e2e
```

Uji domain memeriksa rekonsiliasi stok demo, overbooking, pembatalan, pengiriman, pembayaran transfer, COD, retur, perhitungan laba, dan pembatasan peran simulasi. Uji browser mencakup alur utama, refresh, ekspor, bukti transfer, retur, reset, data rusak, serta navigasi/responsivitas 390px dan 820px. Bukti visual tersedia di `.impeccable/review/` untuk desktop 1440px, tablet 820px, ponsel 390px, formulir, dan laporan.

## Menuju backend

Tetapkan matriks izin dan kebijakan stok/akuntansi final; petakan entitas ke PostgreSQL/Supabase dan Prisma; pindahkan perintah ke transaksi server dengan penguncian stok serta idempotensi; gunakan Supabase Auth dan pemeriksaan izin server; pindahkan bukti ke Supabase Storage dengan batas akses; tambahkan jurnal pembayaran/setoran/refund, audit trail, backup dan migrasi. Jangan memindahkan pemeriksaan UI saja sebagai mekanisme keamanan.
