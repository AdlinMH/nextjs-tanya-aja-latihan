# TanyaAja!

Aplikasi tanya jawab anonim. Satu deployment = satu pemilik.

- Pengunjung mengirim pertanyaan tanpa nama di halaman `/`.
- Pertanyaan baru bersifat privat.
- Pemilik login dengan PIN 4 angka (link **Login** di footer), menulis jawaban, lalu memublikasikannya.
- Tombol **Back** di mode kelola kembali ke tampilan pengunjung (masih login). Link **Kelola** di footer membuka mode kelola lagi tanpa PIN. URL tetap `/`.
- Hanya jawaban yang dipublikasikan yang tampil untuk pengunjung.
- Halaman **`/share-coding`**: pemateri berbagi kode, perintah terminal, instruksi, dan tautan per langkah praktik. Siswa membukanya tanpa PIN. Pemilik masuk lewat link **Masuk sebagai pemilik** (PIN dan sesi yang sama), lalu bisa **Tambah posting**, **Edit**, dan **Hapus**. Posting urut dari yang paling awal dibuat. Blok kode ditampilkan sebagai teks monospace untuk diblok dan disalin manual (tanpa tombol salin).

Teknologi: Next.js 16 (App Router, JavaScript), React 19, Tailwind CSS 4, shadcn/ui, Supabase PostgreSQL.

## Menjalankan di komputer

1. Jalankan `supabase/setup.sql` di Supabase: **SQL Editor > New query**, tempel isi file, lalu **Run**. Cukup sekali per project.
   Untuk `/share-coding`, jalankan juga `supabase/share-coding.sql` dengan cara yang sama (setelah `setup.sql`). File ini hanya menambah tabel `share_coding_posts` dan aman dijalankan ulang.
2. Salin `.env.example` menjadi `.env.local`, lalu isi nilainya (lihat tabel di bawah).
3. Pasang dependensi dan jalankan:

```bash
npm install
npm run dev
```

4. Buka http://localhost:3000.

| Variabel | Isi | Contoh |
|---|---|---|
| `GROUP_ID` | Pembeda kelompok. Huruf kecil, angka, tanda hubung. | `kelompok-01` |
| `OWNER_PIN` | PIN pemilik, tepat 4 angka. | `4827` |
| `SUPABASE_URL` | Project URL dari Supabase. | `https://abcd.supabase.co` |
| `SUPABASE_SECRET_KEY` | Secret key (`sb_secret_...`) dari **Project Settings > API Keys**. Legacy `service_role` key juga bisa. | — |

Semua variabel hanya dibaca server. Jangan memberi awalan `NEXT_PUBLIC_`.

## Deploy ke Vercel

1. Import repository ke Vercel.
2. Isi keempat variabel di **Settings > Environment Variables**.
3. Deploy. Setelah mengubah variabel, lakukan **Redeploy**.

## Pemeriksaan

```bash
npm run lint
npm run build
npm test                # aturan validasi, tanpa database
npm run test:supabase   # isolasi kelompok, butuh .env.local terisi
```

`test:supabase` membuat data uji di kelompok sementara `uji-a-…` dan `uji-b-…`, lalu menghapusnya. Jalankan di database uji, bukan database production.

## Cara kerja keamanan

- **Akses database hanya dari server.** Browser tidak pernah memegang key Supabase. Semua perubahan lewat Server Actions (`app/actions.js`).
- **RLS aktif tanpa policy** dan hak `anon`/`authenticated` dicabut. Publishable/anon key tidak bisa membaca atau mengubah data.
- **GROUP_ID dari environment server.** Setiap query di `lib/pertanyaan.js` memfilter `group_id`. Update dan hapus memeriksa `id` dan `group_id` sekaligus.
- **PIN dicek di server.** Setelah benar, server membuat sesi: cookie `HttpOnly`, `SameSite=Lax`, `Secure` di production, berlaku 8 jam. Cookie hanya berisi token acak. Database menyimpan hash token dan `group_id`. Logout menghapus sesi di database dan cookie.
- **Setiap aksi pemilik memeriksa sesi lagi** di server. Data privat hanya diambil dan dikirim ke browser jika sesi valid.
- **Batas percobaan disimpan di database** (tabel `rate_limits`), jadi tetap berlaku di Vercel:
  - Login PIN: 5 kali per 15 menit per IP, dan 20 kali per 15 menit untuk satu kelompok.
  - Kirim pertanyaan: 20 kali per 10 menit per IP, dan 300 kali per jam untuk satu kelompok.
  - Angka bisa diubah di `lib/aturan.js`. IP disimpan sebagai hash, bukan IP asli.
- **Request lintas situs ditolak.** Next.js hanya menerima Server Action lewat POST dan menolak jika `Origin` berbeda dari host.
- **Teks ditampilkan sebagai teks biasa.** Tidak ada HTML mentah.
- **Isi `/share-coding` disimpan sebagai JSON terstruktur (Tiptap), bukan HTML.** Server memeriksa judul, ukuran, dan struktur dokumen dengan daftar izin (`lib/dokumen.js`): paragraf, daftar, blok kode, baris baru, tebal, miring, kode, dan tautan `http://`/`https://`. Format lain ditolak. Tampilan publik membangun elemen React dari JSON itu (`components/share-coding/isi-posting.jsx`), jadi kode JSX tampil sebagai teks. Editor hanya dimuat untuk pemilik.

## Batasan model latihan (penting untuk pemateri)

- **Database bersama memakai satu secret key.** Secret key melewati RLS. Siapa pun yang memegang key itu bisa membaca dan mengubah data **semua kelompok**, termasuk pertanyaan privat. `GROUP_ID` hanya memisahkan data di dalam aplikasi, bukan pembatas bagi pemegang key.
- Karena itu, pada database bersama:
  - Pakai hanya data latihan yang tidak sensitif.
  - Sampaikan batasan ini kepada siswa sebelum membagikan key.
  - Setelah kelas selesai, buat key baru (rotate) atau hapus key bersama di **Project Settings > API Keys**.
- **Isolasi sungguhan = project Supabase per kelompok.** Kelompok membuat project sendiri, menjalankan `supabase/setup.sql` yang sama, lalu mengganti `SUPABASE_URL` dan `SUPABASE_SECRET_KEY` di `.env.local`/Vercel. Tidak perlu mengubah kode. `GROUP_ID` boleh tetap.
- Batas login per kelompok bisa dipakai orang lain untuk mengunci login pemilik sementara (15 menit). Siswa di jaringan sekolah yang sama juga berbagi IP. Ini dipilih supaya sederhana.
- Belum ada fitur ganti PIN dari aplikasi. Ganti `OWNER_PIN` di environment, lalu jalankan ulang/redeploy.

## Struktur

```
app/
  page.js          halaman utama (pengunjung atau mode pemilik)
  actions.js       Server Actions: kirim, login, logout, simpan, publikasi, hapus
  share-coding/
    page.js        halaman /share-coding (daftar publik + aksi pemilik)
    actions.js     Server Actions: tambah, ubah, hapus posting (cek sesi pemilik)
components/
  form-pertanyaan.jsx   form kirim pertanyaan
  daftar-publik.jsx     kartu jawaban publik
  tombol-login.jsx      link Login + modal PIN
  tampilan-pengunjung.jsx  form + daftar publik (dipakai pengunjung dan pemilik)
  mode-pemilik.jsx      pilih mode kelola atau tampilan pengunjung untuk pemilik
  panel-pemilik.jsx     mode kelola (tab Masuk/Publik, Keluar)
  kartu-pemilik.jsx     satu pertanyaan + editor jawaban
  share-coding/         isi-posting (tampilan JSON), editor-isi (Tiptap),
                        form-posting (dialog), aksi-pemilik, pesan-status
  ui/                   komponen shadcn/ui
lib/
  aturan.js        validasi dan batas (bisa dites tanpa database)
  konfigurasi.js   membaca environment server
  supabase.js      klien Supabase khusus server
  pertanyaan.js    semua query tabel questions (selalu memfilter group_id)
  share-coding.js  semua query tabel share_coding_posts (selalu memfilter group_id)
  dokumen.js       validasi judul dan dokumen posting (bisa dites tanpa database)
  sesi.js          sesi pemilik (cookie + tabel owner_sessions)
  rate-limit.js    batas percobaan (tabel rate_limits)
  riwayat.js       tombol Back/Forward untuk mode kelola (history.state)
supabase/setup.sql tabel, constraint, RLS, hak akses
supabase/share-coding.sql  migrasi tambahan tabel share_coding_posts
tests/             tes otomatis
```
