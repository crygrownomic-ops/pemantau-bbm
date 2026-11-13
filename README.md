# FleetOps 360

**Sistem internal kendali BBM, biaya jalan, dan kualitas operasional armada.**

> Dokumen ini untuk penggunaan internal perusahaan. Jangan dipublikasikan ke internet publik tanpa persetujuan pemilik data. Aplikasi menyimpan data operasional perusahaan dan kredensial akses.

---

## 1. Ringkasan

FleetOps 360 adalah aplikasi web internal untuk memverifikasi konsumsi bahan bakar armada terhadap odometer dan baseline kendaraan. Laporan yang dikirim driver langsung dihitung di server, ditandai bila ada anomali, lalu diverifikasi oleh admin. Semua perubahan data tercatat dalam audit trail.

Aplikasi berjalan sepenuhnya di infrastruktur sendiri:

- Tidak memakai API pihak ketiga berbayar.
- Tidak memakai layanan autentikasi atau database cloud.
- Data disimpan sebagai file JSON di server.
- Login, hash password, sesi, dan export berjalan lokal.

---

## 2. Fitur

### Portal admin

- **Dashboard kualitas BBM** — skor kualitas agregat, tren biaya, ringkasan per armada, dan panel anomali.
- **Uang jalan & klaim** — verifikasi klaim tol/parkir/retribusi, pencatatan uang jalan, dan bukti nota.
- **Scorecard driver** — evaluasi efisiensi, kepatuhan inspeksi, dan integritas transaksi.
- **Analytics & TCO** — biaya per kilometer, matriks biaya armada, tren bulanan, dan performa driver.
- **Servis & legalitas** — riwayat servis, interval perawatan, serta pemantauan KIR/STNK.
- **Master data** — driver, armada, tarif BBM, pengaturan perusahaan, dan audit trail.
- **Export** — unduh laporan CSV dan cadangan database JSON.

### Portal driver

- Laporan pengisian BBM dengan KM awal otomatis dari odometer terakhir.
- Perhitungan jarak, KM/L, estimasi biaya, dan proyeksi kualitas sebelum kirim.
- Penanda pengisian eceran/darurat yang otomatis masuk audit admin.
- Unggah foto struk sebagai bukti transaksi.
- Checklist inspeksi siap jalan.
- Klaim biaya jalan dengan foto nota.
- Riwayat pengiriman terakhir dan ringkasan bulan berjalan.

### Peran

| Peran | Akses |
| --- | --- |
| `admin` | Seluruh dashboard, verifikasi, master data, pengaturan, audit trail, dan reset data contoh. |
| `driver` | Portal driver, laporan BBM, inspeksi, dan klaim miliknya sendiri. |

Admin dapat membuka portal driver dalam mode pratinjau dan memilih driver yang ingin ditampilkan.

---

## 3. Teknologi

- Next.js 16 (App Router, Route Handlers, `proxy.ts`)
- React 19
- TypeScript
- Tailwind CSS v4
- Node.js runtime untuk API dan penyimpanan file
- `node:crypto` untuk HMAC sesi dan hash scrypt

Tidak ada dependency berbayar.

---

## 4. Menjalankan secara lokal

Prasyarat: Node.js 20 atau lebih baru.

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run dev
```

Buka `http://localhost:3000`.

### Kredensial pengembangan

Nilai default hanya untuk lokal/demo:

| Peran | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `admin123` |
| Driver | `driver` | `driver123` |

Driver default terhubung ke nama **Ahmad Supardi** pada data contoh. Jika `DRIVER_NAME` diubah, pastikan nama tersebut ada di master driver.

> Ganti seluruh kredensial dan `SESSION_SECRET` sebelum dipakai di server produksi.

---

## 5. Konfigurasi lingkungan

Salin `.env.example` menjadi `.env.local`, lalu sesuaikan.

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `SESSION_SECRET` | Produksi | Kunci HMAC untuk cookie sesi. Gunakan string acak minimal 32 karakter. |
| `ADMIN_USERNAME` | Tidak | Default `admin`. |
| `ADMIN_NAME` | Tidak | Nama tampilan administrator. |
| `ADMIN_PASSWORD` | Lokal | Password polos untuk pengembangan. |
| `ADMIN_PASSWORD_HASH` | Produksi | Hash scrypt. Jika diisi, menggantikan `ADMIN_PASSWORD`. |
| `DRIVER_USERNAME` | Tidak | Default `driver`. |
| `DRIVER_NAME` | Tidak | Harus sama dengan nama di master driver. Default `Ahmad Supardi`. |
| `DRIVER_PASSWORD` | Lokal | Password polos untuk pengembangan. |
| `DRIVER_PASSWORD_HASH` | Produksi | Hash scrypt untuk akun driver. |
| `OPERATOR_USERNAME` | Opsional | Akun tambahan dengan peran admin. |
| `OPERATOR_NAME` | Opsional | Nama tampilan operator. |
| `OPERATOR_PASSWORD` / `OPERATOR_PASSWORD_HASH` | Opsional | Kredensial operator. |
| `FLEETOPS_DATA_DIR` | Opsional | Direktori database JSON. Default `./data`. |

### Membuat hash password

```bash
npm run hash-password -- "password-yang-kuat"
```

Tempelkan hasil `scrypt$...` ke `ADMIN_PASSWORD_HASH` atau `DRIVER_PASSWORD_HASH`, lalu hapus variabel password polos yang sesuai.

### Membuat SESSION_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 6. Penyimpanan data

- Lokasi default: `data/fleetops.json`.
- Dapat dipindahkan dengan `FLEETOPS_DATA_DIR` (disarankan path absolut di produksi).
- File dibuat otomatis dari data contoh saat pertama kali dijalankan.
- Penulisan dilakukan secara atomik (tulis file sementara lalu rename).
- Perubahan dibatasi oleh lock agar tidak terjadi tumpang tindih.
- Audit trail menyimpan maksimal 500 entri terakhir.
- Folder `data/` sudah diabaikan oleh Git.

### Backup

1. Buka **Admin → Sistem & Audit**.
2. Klik **Unduh cadangan JSON**.
3. Simpan file di lokasi aman di luar server aplikasi.

### Reset data contoh

**Admin → Sistem & Audit → Kembalikan data contoh** akan mengganti seluruh data operasional dengan data awal. Lakukan backup terlebih dahulu.

---

## 7. Skrip

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan server pengembangan. |
| `npm run build` | Build produksi. |
| `npm run start` | Menjalankan hasil build. |
| `npm run lint` | Pemeriksaan ESLint. |
| `npm run typecheck` | Pemeriksaan TypeScript tanpa emit. |
| `npm run hash-password -- "..."` | Membuat hash scrypt. |

---

## 8. Struktur utama

```text
app/
  api/
    auth/            login, logout, sesi
    fleet/           baca dan CRUD koleksi data
    settings/        pengaturan perusahaan
    admin/reset/     reset data contoh
  admin/             dashboard dan master data
  driver/            portal driver
  login/             halaman masuk
  page.tsx           landing page internal
components/
  admin/             modul dashboard admin
  driver/            portal driver dan modal
  providers/         FleetProvider (data, CRUD, toast)
  ui/                komponen dasar (Modal, Icon, Chart, dll.)
lib/
  auth.ts            sesi server
  auth-session.ts    HMAC, scrypt, rate limit
  client-store.ts    helper fetch ke API internal
  fuel.ts            perhitungan kualitas BBM
  server/store.ts    penyimpanan JSON, audit, filter per peran
  seed.ts            data contoh
scripts/
  hash-password.mjs  pembuat hash scrypt
proxy.ts             proteksi route admin/driver
```

---

## 9. Logika perhitungan

### Kualitas per transaksi

1. Hitung efisiensi aktual: `jarak / liter` (atau pakai `km_per_liter` yang tersimpan).
2. Bandingkan dengan baseline armada: `skor = (aktual / baseline) × 100`.
3. Penalti:
   - `-20` untuk pengisian eceran/non-SPBU.
   - `-4` bila foto struk belum diunggah.
   - `-8` bila transaksi ditandai anomali.
4. Skor dibatasi 0–100.
5. Transaksi dianggap anomali bila ditandai `FLAGGED`, pengisian eceran, atau efisiensi di bawah 72% baseline.

### Biaya

- Total biaya transaksi = `liter × harga per liter`.
- TCO armada = biaya BBM + biaya servis + klaim yang disetujui.
- Biaya per kilometer = TCO / total jarak.

### Integritas data

- KM awal transaksi baru selalu diambil dari `last_km` armada di server.
- KM akhir harus lebih besar dari KM awal.
- Identitas driver pada transaksi diambil dari sesi, bukan dari input bebas.
- Perubahan status klaim dan transaksi mencatat admin serta waktu verifikasi.

---

## 10. Keamanan

- Login memakai username dan password; password disimpan sebagai hash scrypt.
- Cookie sesi `fleetops_session` bersifat `HttpOnly` dan `SameSite=Lax`. Atribut `Secure` aktif otomatis pada HTTPS (termasuk di belakang reverse proxy dengan `X-Forwarded-Proto: https`) dan dimatikan untuk `localhost` agar pratinjau produksi di mesin lokal tetap dapat login.
- Token sesi ditandatangani HMAC-SHA256 dan memiliki masa berlaku sesuai pengaturan **Durasi sesi (jam)** di menu Sistem & Audit (default 8 jam, rentang 1–72 jam).
- Percobaan login dibatasi 8 kali per 10 menit per alamat.
- Permintaan mutasi memeriksa same-origin.
- Peran diperiksa di server pada layout dan setiap Route Handler.
- Driver hanya dapat membaca data miliknya dan membuat laporan/inspeksi/klaim.
- Header keamanan dasar dipasang melalui `next.config.ts`.
- Aplikasi menonaktifkan indeks mesin pencari melalui metadata.
- Dependency produksi bebas advisory (`npm audit --omit=dev`). Sisa peringatan hanya berasal dari paket pengembangan ESLint dan tidak ikut ter-deploy.

Untuk produksi:

1. Gunakan HTTPS.
2. Ganti `SESSION_SECRET` dan seluruh kredensial.
3. Gunakan `ADMIN_PASSWORD_HASH` dan `DRIVER_PASSWORD_HASH`.
4. Pastikan direktori data persisten dan hanya dapat diakses proses aplikasi.
5. Batasi akses jaringan ke VPN/jaringan kantor bila memungkinkan.
6. Backup `data/fleetops.json` secara berkala.

---

## 11. Deployment

Aplikasi memerlukan Node.js runtime dan filesystem yang dapat ditulis.

- **VPS / server kantor**: jalankan `npm run build` lalu `npm run start` di belakang reverse proxy HTTPS.
- **Platform serverless**: pastikan direktori data berada pada volume persisten. Tanpa volume persisten, data JSON dapat hilang saat instance dibuat ulang.
- **Jangan** menaruh `data/` di dalam folder publik.
- Atur `FLEETOPS_DATA_DIR` ke path absolut, misalnya `/var/lib/fleetops`.

---

## 12. Troubleshooting

**Login gagal padahal kredensial benar**

- Pastikan `.env.local` terbaca dan server dijalankan ulang setelah mengubah env.
- Jika memakai `*_PASSWORD_HASH`, pastikan formatnya `scrypt$<salt>$<key>`.
- Hapus `*_PASSWORD` bila memakai hash agar tidak membingungkan.

**Data kembali ke contoh setelah restart**

- Kemungkinan direktori data tidak persisten. Set `FLEETOPS_DATA_DIR` ke volume permanen.

**Driver tidak melihat data miliknya**

- Pastikan `DRIVER_NAME` sama dengan nama pada master driver (termasuk ejaan dan spasi).

**Laporan BBM ditolak**

- KM akhir harus lebih besar dari odometer terakhir armada.
- Liter harus lebih dari 0.
- Armada dan jenis BBM harus ada di master data.

**Ukuran foto struk ditolak**

- Maksimal sekitar 1,5 MB. Kompres foto sebelum diunggah.

---

## 13. Catatan biaya

Tidak ada biaya API dalam pembuatan dan operasional dasar aplikasi ini:

- Endpoint `/api/*` adalah Route Handler internal Next.js.
- Tidak ada OpenAI, Google Maps, Firebase, WhatsApp Business API, atau layanan berlangganan lain.
- WhatsApp reminder memakai tautan `wa.me` yang dikirim manual.
- Biaya hanya muncul bila memilih hosting/domain, atau bila nanti menambahkan integrasi pihak ketiga secara sadar.

---

## 14. Lisensi

Penggunaan internal perusahaan. Tidak untuk didistribusikan ulang tanpa izin.
