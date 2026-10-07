---
name: buahaha
description: Meja kerja distribusi buah yang tenang, terbaca, dan langsung dapat ditindaklanjuti.
colors:
  primary: "#245c46"
  primary-hover: "#184c37"
  sidebar: "#183f32"
  background: "#f7f8f4"
  foreground: "#253b33"
  surface: "#ffffff"
  muted: "#66736c"
  border: "#e3e8e0"
  soft: "#edf2eb"
  danger: "#a8473c"
  danger-soft: "#fff0ec"
  nav-active: "#e5edce"
  nav-active-text: "#254434"
  attention: "#f0f3e9"
  success: "#416b35"
  success-soft: "#edf4e8"
  warning: "#896321"
  warning-soft: "#fcf3dc"
  status-danger: "#a05038"
  status-danger-soft: "#fbece5"
  status-neutral: "#4b7566"
  status-neutral-soft: "#eaf1ef"
  table-heading: "#596952"
  table-secondary: "#63715d"
  supporting: "#596b4e"
  focus: "#b28834"
typography:
  headline:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "29px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  data:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.5
  metric:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "27px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-1px"
  status:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  tag: "4px"
  control: "6px"
  navigation: "7px"
  inset: "8px"
  panel: "12px"
spacing:
  inline: "8px"
  compact: "12px"
  group: "16px"
  form: "20px"
  grid: "22px"
  drawer: "26px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "#3b5143"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  button-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    padding: "10px 11px"
  nav-active:
    backgroundColor: "{colors.nav-active}"
    textColor: "{colors.nav-active-text}"
    rounded: "{rounded.navigation}"
    padding: "11px 14px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
  badge-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    typography: "{typography.status}"
    rounded: "{rounded.tag}"
    padding: "4px 7px"
---

# Design System: buahaha

## Overview

**Creative North Star: "Meja kerja distribusi"**

buahaha adalah ruang kerja internal yang matang dan tenang. Bidang hijau hutan membingkai kanvas netral hangat; tabel, angka, dan tindakan menjadi pusat perhatian. Bahasa Indonesia yang lugas membantu staf menyelesaikan pekerjaan tanpa menerjemahkan istilah antarmuka.

Kepadatan mengikuti kebutuhan operasi: satu strip untuk metrik terkait, tabel untuk perbandingan, dan bidang tonal untuk pekerjaan yang perlu perhatian. Identitas datang dari warna, proporsi, dan ikon garis. Implementasi tidak memakai raster; ikon aplikasi adalah SVG buatan khusus.

**Key Characteristics:**

- Hijau hutan, kanvas gading, dan permukaan putih datar.
- Angka tabular dan status dengan label tertulis.
- Panel detail di sisi kanan mempertahankan konteks pekerjaan.

## Colors

Palet hangat dan rendah saturasi menjaga data tetap dominan; nilai normatif berada di frontmatter.

### Primary

- **Hijau kerja** (`primary`, `primary-hover`): tindakan utama dan tautan operasional.
- **Hijau hutan** (`sidebar`): navigasi tetap; pilihan aktif memakai hijau daun pucat (`nav-active`).

### Secondary

- **Mangga** (`warning`, `warning-soft`): status menunggu dan belum lunas.
- **Daun** (`success`, `success-soft`): status selesai atau terverifikasi.
- **Terakota** (`danger`, `status-danger` beserta bidang lembutnya): tindakan berisiko, penolakan, atau kerusakan.
- **Hijau abu** (`status-neutral`, `status-neutral-soft`): status proses lainnya.

### Neutral

- **Gading** (`background`), **putih** (`surface`), dan **abu hangat** (`border`): kanvas, tabel, dan pemisah.
- `foreground` untuk teks utama; `muted`, `supporting`, dan warna sekunder tabel mengikuti latar masing-masing.
- `soft` untuk interaksi ringan; `attention` untuk antrean tindak lanjut.

**The Status Tertulis Rule.** Warna status selalu ditemani nama status; titik warna hanya pendamping.

## Typography

**Body Font:** Geist dengan Arial dan sans-serif sebagai fallback. Judul memakai keluarga yang sama. Geist Mono tersedia melalui layout tetapi tidak menjadi gaya teks antarmuka yang dipakai.

Hierarki normatif ada di frontmatter: judul halaman, judul bagian, isi, data, label, metrik, dan status. Tabel memakai angka tabular; kolom numerik rata kanan. Sel data berukuran 13px, nama kuat di sel 12px, dan keterangan sel 11px. Keterangan operasional umumnya 11–12px; ukuran kecil yang masih tersisa pada penanda khusus bukan skala untuk diwariskan.

Judul halaman menjadi 26px pada lebar ≤900px dan 25px pada ≤700px. Nilai metrik menjadi 31px pada ≥1600px, 23px pada 901–1250px, 27px pada 701–900px, dan 22px pada ponsel. Judul bagian ponsel 15px. Tidak ada display hero.

**The Angka Sejajar Rule.** Pertahankan angka tabular pada tabel, metrik, dan laporan; jangan mengganti keterbacaan angka dengan dekorasi tipografis.

## Layout

Sidebar desktop tetap selebar 232px; area utama mengimbanginya dengan margin kiri. Konten terpusat memiliki lebar maksimum 1720px dan padding dasar 32px 34px 20px. Grid ringkasan desktop memakai `minmax(0, 2.6fr) minmax(300px, 1fr)` dengan jarak 22px. Strip metrik empat kolom dipisahkan garis, bukan empat kartu terpisah.

Bagian bawah sidebar dikosongkan dari keterangan demo dan slogan. Pengaturan demo tersedia melalui tombol ikon roda gigi berlabel aksesibel di kanan atas; informasi penyimpanan dan cadangan berada di panel pengaturan.

Tabel pada menu Pesanan memakai proporsi kolom tetap, nominal beserta judul Total rata kanan, dan tombol Edit pada kolom tindakan. Nama pelanggan panjang membungkus dalam kolomnya. Lebar minimum tabel 960px mempertahankan keterbacaan di tablet dan ponsel melalui gulir horizontal di dalam panel. Hapus pada Pesanan, Produk & Stok, Pelanggan, dan riwayat mutasi ditempatkan di bagian bawah panel edit, terpisah dari formulir dengan garis tipis.

Tabel Pembayaran, Pengeluaran, dan Retur mengikuti perataan yang sama: nominal dan judul rata kanan, status serta tindakan rata tengah, dan teks panjang membungkus dalam kolom. Nomor retur dan pesanan ditata dalam dua baris. Lebar minimum 1040px untuk Pembayaran/Retur dan 960px untuk Pengeluaran menjaga ruang tombol dan keterangan; gulir horizontal tetap di dalam panel.

| Batas viewport | Perubahan yang diterapkan                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| ≥1600px        | Padding konten 38px 44px; baris pesanan lebih lapang.                                                                                     |
| ≤1250px        | Sidebar 210px; konten 27px 24px; grid ringkasan dan perjalanan menjadi satu kolom.                                                        |
| ≤900px         | Sidebar 190px; konten 24px 20px; metrik dua kolom; laporan satu kolom.                                                                    |
| ≤700px         | Sidebar menjadi panel geser 232px; margin utama hilang; konten 25px 16px 15px; drawer selebar layar; judul dan tindakan dapat membungkus. |

Tabel tetap mempertahankan kolom dan menggulir horizontal di dalam wilayah yang dapat difokuskan. Instruksi geser hanya muncul ketika `scrollWidth` melebihi `clientWidth`, termasuk pada tablet. Jangan mengecilkan teks untuk menghilangkan overflow. Form memakai dua kolom saat pola bidangnya sesuai; input drawer pada ponsel berukuran 16px.

## Elevation & Depth

Kedalaman terutama berasal dari bidang tonal dan garis tipis. Panel tabel tidak memakai bayangan. Tab periode terpilih memiliki bayangan kecil (`0 1px 2px #1e3c2510`); toast memakai bayangan lembut (`0 8px 28px #152f2a22`). Drawer dibedakan oleh backdrop (`#18362666`) dan garis kiri, tanpa glassmorphism.

**The Bidang Datar Rule.** Gunakan garis dan perbedaan bidang untuk mengelompokkan informasi; simpan bayangan untuk pilihan tab dan feedback sementara yang sudah memiliki peran tersebut.

## Shapes

Sudut panel paling lembut, kontrol lebih rapat, dan badge hampir persegi; gunakan token radius sesuai peran. Lingkaran dipakai untuk avatar dan titik status. Garis batas umumnya 1px. Ikon garis Lucide dan SVG aplikasi mengikuti identitas sederhana, tanpa emoji atau ikon berupa karakter teks.

## Components

### Buttons

Tombol primer berisi hijau; outline putih bergaris; ghost transparan; destructive memakai terakota di bidang lembut. Ukuran dasar memakai teks 13px/500, tinggi minimum 39px, dan jarak ikon 8px. Ukuran kecil memakai teks 12px dengan padding 6px 10px; tingginya minimum 31px, menjadi 36px di ponsel. Tombol aksi form ponsel minimum 44px. Hover primer menggelap; outline dan ghost memakai `soft`. Destructive belum memiliki perubahan hover khusus. Disabled memakai opacity 0.5 dan kursor tidak aktif.

Fokus keyboard berupa outline mangga 3px dengan offset 3px. Transisi warna dan latar berlangsung 160ms. Jangan mengganti label aksi dengan ikon saja kecuali kontrol memang memiliki nama aksesibel.

### Chips

Badge adalah label status pasif: titik kecil, nama status, padding ringkas, dan sudut `tag`. Warna success, warning, danger, dan neutral mengikuti makna di atas. Badge bukan tombol filter.

### Cards / Containers

Panel putih memakai garis `border` dan sudut `panel`. Header dasar memakai padding 22px 21px 19px; tabel mengambil lebar penuh. Bidang perhatian menggunakan warna tonal dan baris aksi berpemisah. Panel “Perjalanan aktif” menampilkan informasi operasional dan tindakan terkait, tanpa slogan.

### Inputs / Fields

Bidang putih bergaris (`#d8e0d4`), label eksplisit di atas, bantuan di bawah. Input form berukuran 13px dengan tinggi minimum 42px. Pencarian memakai pembungkus bergaris yang mendapat outline hijau 2px saat fokus di dalamnya. Error memakai teks dan bidang terakota lembut, disertai pesan yang menjelaskan perbaikan.

### Navigation

Navigasi vertikal memakai ikon garis, label, dan latar aktif yang jelas. Teks desktop 13px, menjadi 12px pada ≤900px; tinggi item minimum 42px. Hover memberi bidang hijau lebih terang. Ponsel membuka panel dengan scrim; item terpilih tetap terbaca tanpa bergantung pada warna ikon.

### Filter periode

Gunakan kontrol mode Harian / Rentang tanggal, label tanggal yang tetap terlihat, serta tombol hari sebelumnya/berikutnya dengan nama aksesibel. Pilihan cepat Hari ini, Kemarin, dan Bulan ini diikuti keterangan tanggal aktif. Kontrol mewarisi warna, tombol, dan input sistem yang sama; pada ponsel tersusun vertikal. Rincian harian memakai tabel numerik yang sama, dengan tanggal sebagai tindakan untuk membuka hasil hari tersebut.

### Detail drawer

Panel kanan selebar 550px dengan batas maksimum lebar layar dan tinggi 100dvh. Header melekat; form menggunakan padding 26px dan jarak 20px, menjadi padding 20px di ponsel. Judul langsung menyatakan tugas tanpa eyebrow. Gerak masuk menggeser 20px selama 160ms memakai `cubic-bezier(0.16, 1, 0.3, 1)`; navigasi ponsel 200ms. `prefers-reduced-motion` meniadakan animasi dan transisi.

## Do's and Don'ts

### Do:

- **Do** pakai label status tertulis, angka tabular, dan tindakan dalam bahasa Indonesia yang langsung.
- **Do** pertahankan ukuran teks operasional akhir; tangani tabel lebar dengan scroll dan petunjuk bersyarat.
- **Do** gunakan permukaan datar, batas tipis, dan warna tonal sesuai fungsi.
- **Do** pertahankan fokus keyboard, label form, dan dukungan reduced-motion.

### Don't:

- **Don't** menambah hero pemasaran, slogan, eyebrow dekoratif, atau kartu identik untuk setiap informasi.
- **Don't** memakai glow, glassmorphism, bayangan berat, atau gradient ungu/biru tanpa dasar identitas.
- **Don't** menjadikan emoji sebagai ikon atau menambah foto buah tanpa kebutuhan pengenalan produk.
- **Don't** mengambil ukuran teks lama yang tertimpa override CSS sebagai token sistem.

Pilihan pesanan pada formulir pengiriman memakai dropdown yang dapat dibuka lewat keyboard, berisi pencarian nomor pesanan, pelanggan, atau alamat serta pilihan beberapa pesanan. Ringkasan pilihan tetap terlihat di luar dropdown untuk pemeriksaan sebelum menyimpan. Hanya pesanan disiapkan yang belum dijadwalkan tersedia untuk dipilih. Pencarian daftar pengiriman juga mencakup nomor pesanan dan pelanggan.

Label Data simulasi di topbar dihapus. Tombol Hapus menggunakan ikon tempat sampah dan teks merah, dikelompokkan bersama tindakan pada daftar. Konfirmasi menjelaskan dampak pada stok, tagihan, atau laporan dan memakai tombol Ya, hapus berwarna merah. Tombol penghapusan nonaktif untuk Admin Gudang; pesan dependensi menjelaskan transaksi yang harus diselesaikan terlebih dahulu. Laporan tetap merupakan hasil perhitungan data sumber, bukan catatan yang dihapus terpisah.
