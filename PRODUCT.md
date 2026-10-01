# buahaha

<!-- impeccable:product-schema 1 -->

## Platform

web

## Sumber dan Status Konteks

Konteks dikonfirmasi melalui brief pengguna dan pesan klarifikasi. Nama resmi proyek adalah **buahaha** dan dipakai konsisten pada aplikasi serta dokumentasi.

Inisialisasi telah dilanjutkan ke prototipe interaktif code-first atas instruksi pengguna. Implementasi memakai data simulasi dengan penyimpanan lokal; bukan backend produksi. Keputusan visual dicatat di DESIGN.md, panduan fitur dan keterbatasan di README.md.

## Users

- **Owner:** memantau usaha, meninjau laporan, dan mengelola operasional serta keuangan.
- **Admin Gudang:** menjalankan pekerjaan gudang, pesanan, pengiriman, dan pemeriksaan retur.

Pengguna adalah staf internal yang tidak selalu teknis. Asumsi kewenangan sementara yang diizinkan brief: Owner memiliki akses penuh; Admin Gudang mengelola stok, pesanan, pengiriman, dan pemeriksaan retur. Rincian izin lainnya masih terbuka dan tidak boleh dianggap sudah disepakati.

## Product Purpose

Dashboard internal untuk usaha penjualan/distribusi buah: mengelola stok, pelanggan, pesanan, pengiriman, pembayaran, pengeluaran termasuk bensin, retur, dan laporan dalam data yang saling konsisten.

Keberhasilan tahap prototipe adalah pengguna dapat mencoba alur lengkap: tambah pelanggan → buat pesanan → proses pengiriman → catat pembayaran → catat bensin → lihat laporan. Prototipe dievaluasi sebelum pembangunan backend operasional.

## Operating Context

- Pelanggan memesan melalui WhatsApp atau telepon; admin mencatat pesanan di dashboard. Tidak ada integrasi WhatsApp yang dijanjikan.
- Website pelanggan dan checkout publik berada di luar cakupan tahap ini.
- Operasional dimulai dengan satu gudang dan sistem baru tanpa migrasi data lama.
- Pelanggan boleh berasal dari siapa saja, tanpa minimum pembelian.
- Desktop diprioritaskan, dengan penggunaan yang tetap nyaman di tablet dan ponsel.
- Bahasa antarmuka Indonesia, mata uang Rupiah, dan format tanggal Indonesia.

## Capabilities and Constraints

### Cakupan modul

| Modul                  | Kebutuhan                                                                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ringkasan              | Penjualan, pesanan aktif, pembayaran belum lunas, stok rendah, pengeluaran bensin, filter tanggal, transaksi terbaru, dan pekerjaan yang perlu ditindaklanjuti. Semua angka berasal dari data transaksi yang sama. |
| Produk dan stok        | Nama buah, SKU, satuan, harga beli/modal, harga jual, batas stok rendah; pencatatan barang masuk, keluar, dan rusak; stok fisik, cadangan, dan tersedia dibedakan.                                                 |
| Pelanggan              | Nama, nomor WhatsApp, alamat, catatan, riwayat transaksi; tambah, edit, dan pencarian.                                                                                                                             |
| Pesanan                | Nomor transaksi, tanggal, pelanggan, item, jumlah, harga, diskon opsional, total, catatan, validasi stok, dan perpindahan status.                                                                                  |
| Pengiriman             | Pesanan terkait, alamat, petugas, jadwal, status, dan catatan; satu perjalanan dapat membawa beberapa pesanan.                                                                                                     |
| Pembayaran dan setoran | Transfer, tunai, COD; tagihan, pembayaran diterima, sisa tagihan, bukti transfer, verifikasi, serta pencatatan penerimaan dan setoran COD secara terpisah.                                                         |
| Pengeluaran            | Pembelian buah, bensin, biaya operasional lain, dan pencatatan kerugian barang; pengeluaran kas dibedakan dari kerugian stok nonkas.                                                                               |
| Retur                  | Pesanan dan item terkait, jumlah, alasan, bukti foto/video, status pengajuan, keputusan admin, kondisi barang, serta pengembalian uang bila ada.                                                                   |
| Laporan                | Filter tanggal; penjualan, harga pokok penjualan, laba kotor, bensin, biaya operasional, kerugian barang, hasil setelah biaya; ekspor CSV mengikuti filter.                                                        |

### Aturan stok, pesanan, dan retur

- Jumlah pesanan tidak boleh melebihi stok tersedia.
- Satuan produk konsisten; dus dan kilogram tidak dijumlahkan menjadi satu total kuantitas.
- Status pesanan: baru, dikonfirmasi, disiapkan, dikirim, selesai, dibatalkan. Status pembayaran terpisah dari status pesanan.
- Waktu pencadangan dan pengeluaran stok harus ditentukan secara eksplisit sebelum implementasi logika. Pembatalan melepaskan cadangan tanpa menggandakan stok.
- Retur memerlukan bukti foto atau video dan persetujuan admin. Jumlah retur tidak boleh melebihi jumlah yang masih dapat diretur.
- Kondisi barang retur diperiksa. Barang rusak tidak otomatis kembali ke stok layak jual; kelayakan jual dan pengembalian uang dicatat terpisah.

### Aturan pembayaran dan biaya

- Transfer wajib memiliki bukti sebelum ditandai terverifikasi.
- COD membedakan uang yang diterima dari pelanggan dan uang yang sudah disetorkan.
- Bensin mencatat tanggal, petugas, nominal, kendaraan atau perjalanan terkait bila ada, catatan, dan bukti opsional.
- Total bensin mengikuti rentang tanggal. Bensin dapat dikaitkan dengan perjalanan pengiriman; biaya satu perjalanan tidak dihitung berulang ketika membawa beberapa pesanan.
- Pembelian stok merupakan pengeluaran kas; kerugian barang dapat bersifat nonkas. Keduanya tidak boleh disamakan.

### Aturan laporan

- Laba kotor = penjualan bersih − harga pokok barang yang terjual.
- Hasil setelah biaya = laba kotor − biaya operasional − kerugian yang belum diperhitungkan. Bensin termasuk biaya yang harus dihitung tepat satu kali.
- Pembelian stok tidak dikurangi lagi sebagai biaya apabila modal barang sudah masuk harga pokok penjualan.
- Penerimaan kas tidak disebut laba. Dampak biaya, retur, dan pengembalian uang tidak dicatat ganda.
- Asumsi perhitungan dijelaskan kepada pengguna; ringkasan dan laporan memakai sumber transaksi yang sama.

### Batas teknis prototipe

- Proyek sudah memakai Next.js, React, TypeScript, dan Tailwind CSS. Periksa package.json untuk versi yang berlaku dan baca panduan lokal Next.js sesuai AGENTS.md sebelum menulis kode.
- Target komponen dasar adalah shadcn/ui dengan penyesuaian; ikon konsisten, misalnya Lucide. Zod digunakan bila sesuai, Recharts hanya bila grafik membantu pekerjaan. Ini kebutuhan mendatang, bukan daftar dependensi yang sudah terpasang.
- Gunakan data simulasi realistis dan penyimpanan lokal yang bertahan setelah refresh, dengan reset data demo yang meminta konfirmasi.
- localStorage harus aman terhadap server rendering dan hydration. Pisahkan tipe data, logika bisnis, akses data, serta tampilan.
- Pergantian peran diberi label simulasi, bukan autentikasi sungguhan. Penyimpanan lokal bukan sistem produksi yang aman.
- Unggah bukti harus menjelaskan batas penyimpanan lokal dan tidak mengesankan file telah tersimpan di server.
- Backend atau kredensial bukan prasyarat prototipe. Target berikutnya adalah PostgreSQL melalui Supabase, Prisma, Supabase Auth, dan Supabase Storage; struktur dipersiapkan untuk integrasi tersebut.
- Navigasi dan tombol utama harus berfungsi; kemampuan yang belum tersedia diberi keterangan jujur.
- Saat implementasi kelak, jalankan lint, typecheck, build, dan pengujian logika stok, pembatalan, retur, COD, serta laporan. Periksa browser bila tersedia dan laporkan hanya pemeriksaan yang benar-benar dilakukan.

### Keputusan sementara untuk prototipe

- Ringkasan, Laporan, dan Pengeluaran dibuka dengan periode harian (hari ini). Pengguna dapat memilih tanggal tunggal, berpindah sehari, memilih kemarin, atau memakai rentang tanggal. Laporan menampilkan rincian hasil per hari dan pesanan yang selesai dalam periode. CSV mengikuti filter yang sama. Hari tanpa aktivitas tidak dicantumkan dalam tabel rentang tanggal; tanggal tunggal tanpa aktivitas tetap menampilkan nol.

- Stok dicadangkan sejak pesanan baru, dikeluarkan ketika perjalanan dimulai (status dikirim), dan penjualan diakui ketika perjalanan selesai (status pesanan selesai). Pembatalan sebelum pengiriman melepaskan cadangan; pembatalan pesanan yang sudah memiliki pembayaran atau perjalanan belum didukung.
- Harga pokok menggunakan snapshot modal produk pada saat pesanan dibuat. Ini bukan FIFO atau rata-rata tertimbang persediaan. Perubahan modal produk tidak mengubah transaksi lama.
- Refund retur disetujui mengurangi penjualan pada tanggal persetujuan. Retur layak jual mengembalikan stok dan membalik harga pokok terkait; retur rusak mempertahankan harga pokok tanpa menambah kerugian yang sama untuk kedua kali. Retur tanpa refund tidak mengurangi tagihan.
- Owner mengelola semua modul. Admin Gudang mengelola produk, stok, pelanggan, pesanan, pengiriman, dan retur tanpa refund; keputusan retur dengan refund serta perubahan pembayaran, setoran, dan pengeluaran hanya oleh Owner. Ringkasan dan status pembayaran pesanan tetap terlihat oleh kedua peran. Ini simulasi antarmuka, bukan kontrol keamanan produksi.
- Tanggal transaksi diisi pengguna; penyelesaian pengiriman dan persetujuan retur memakai tanggal berjalan Asia/Jakarta. Rentang laporan inklusif.
- Bukti lokal menerima JPG, PNG, WebP, atau MP4 maksimal 750 KB per berkas, tersimpan sebagai data URL di localStorage. Bukti bawaan berlabel simulasi, bukan dokumen nyata.

### Keputusan terbuka untuk produksi

- Matriks izin rinci per peran, termasuk pengelolaan pelanggan, verifikasi pembayaran, setoran COD, pengeluaran, laporan, dan pengembalian uang.
- Status yang memicu pencadangan/pengeluaran stok serta aturan pembatalan setelah barang keluar.
- Metode penentuan harga pokok, saat pengakuan penjualan, tanggal acuan laporan, dan perlakuan rinci retur/refund dalam laporan.
- Detail alur persetujuan retur dan pemeriksaan bukti pembayaran.
- Batas ukuran, format, dan mekanisme penyimpanan bukti foto/video secara lokal.

Keputusan tersebut tidak menghalangi inisialisasi. Pada tahap implementasi, keputusan kecil boleh ditentukan dengan penilaian pengembang dan asumsi penting harus dicatat; jangan menyajikan asumsi sebagai kebijakan usaha yang telah final.

## Brand Commitments

Nama produk: **buahaha**. Bahasa lugas dan mudah dipahami staf operasional. Komitmen visual berikut berasal langsung dari pengguna dan disimpan sebagai batasan untuk pekerjaan berikutnya, tanpa dikembangkan menjadi sistem desain saat init:

- Dashboard bisnis buah yang matang, rapi, dan beridentitas; netral hangat, teks gelap, hijau tua sebagai warna utama, aksen buah secukupnya.
- Tipografi mudah dibaca, hierarki jelas, dan angka tabel mudah dibandingkan.
- Sidebar ringkas, judul halaman jelas, tindakan utama mudah ditemukan, serta tabel dengan pencarian, filter, status, dan tindakan yang jelas.
- Foto buah hanya ketika membantu pengenalan produk; grafik harus punya kegunaan operasional.
- Hindari gradient ungu/biru tanpa alasan, glassmorphism, glow, bayangan berat, sudut berlebihan, kartu seragam untuk semua informasi, hero besar, slogan pemasaran, dekorasi mengganggu, animasi berlebihan, emoji sebagai ikon, dan tampilan shadcn/ui bawaan tanpa penyesuaian.

## Evidence on Hand

- Brief pengguna adalah sumber persyaratan; pesan terbaru mengoreksi nama produk dan membatasi pekerjaan saat ini pada inisialisasi.
- Titik masuk aplikasi berada di src/app/page.tsx; komponen prototipe di src/components/dashboard.tsx, logika transaksi di src/lib/domain.ts, data simulasi di src/lib/demo.ts, dan penyimpanan lokal di src/lib/store.ts.
- Aset public/ masih berupa aset starter. Belum ada logo khusus, foto buah, data transaksi asli, bukti transfer, atau bukti retur yang diberikan.
- Data demo mendatang harus diberi label simulasi, saling konsisten, dan mencakup stok rendah, transfer menunggu verifikasi, COD belum disetor, serta retur. Jangan membuat klaim pelanggan, transaksi nyata, atau hasil usaha dari data contoh.

## Product Principles

1. Utamakan penyelesaian pekerjaan operasional dari pesanan sampai laporan.
2. Pertahankan satu sumber transaksi yang konsisten untuk stok, pembayaran, biaya, dan angka ringkasan.
3. Bedakan kejadian fisik, status pesanan, penerimaan kas, setoran, dan laba secara jelas.
4. Cegah stok berlebih, penggandaan biaya, serta retur yang melebihi hak pengembalian.
5. Jelaskan simulasi, asumsi, dan keterbatasan sebelum pengguna mengandalkannya sebagai sistem operasional.

## Accessibility & Inclusion

Sediakan kondisi kosong, error, validasi form, konfirmasi tindakan berisiko, feedback setelah menyimpan, fokus keyboard yang terlihat, dan label form yang jelas. Status harus dapat dipahami tanpa mengandalkan warna saja. Prioritaskan keterbacaan, perbandingan angka, dan penggunaan lintas desktop, tablet, serta ponsel bagi staf yang tidak terlalu teknis.
