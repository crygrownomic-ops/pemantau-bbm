# FleetOps 360

**Sistem kendali BBM, biaya jalan, dan kualitas operasional armada — multi-tenant SaaS.**

> Dokumen ini untuk penggunaan internal. Jangan dipublikasikan ke internet publik tanpa persetujuan pemilik data. Aplikasi menyimpan data operasional perusahaan, data akun, dan kredensial akses.

---

## 1. Ringkasan

FleetOps 360 adalah aplikasi web untuk memverifikasi konsumsi bahan bakar armada terhadap odometer dan baseline kendaraan. Laporan yang dikirim driver langsung dihitung di server, ditandai bila ada anomali, lalu diverifikasi oleh admin. Semua perubahan data tercatat dalam audit trail.

Sejak versi SaaS, satu instalasi dapat melayani banyak perusahaan (tenant):

- Pendaftaran mandiri perusahaan baru dengan masa uji coba 14 hari.
- Setiap perusahaan memiliki kode unik yang dipakai saat login.
- Data setiap tenant terisolasi dalam database JSON sendiri.
- Konsol Platform Owner untuk mengelola tenant, paket, invoice, dan audit platform.
- Penagihan manual: invoice + transfer bank, tanpa payment gateway berbayar.
- PWA: dapat dipasang di perangkat dan memiliki shell offline.
- Laporan bulanan siap cetak dalam format PDF dan CSV.

Aplikasi berjalan sepenuhnya di infrastruktur sendiri:

- Tidak memakai API pihak ketiga berbayar.
- Tidak memakai layanan autentikasi atau database cloud.
- Data disimpan sebagai file JSON di server.
- Login, hash password, sesi, PDF, dan export berjalan lokal.

---

## 2. Fitur

### Portal admin (per tenant)

- **Dashboard kualitas BBM** — skor kualitas agregat, tren biaya, ringkasan per armada, dan panel anomali.
- **Uang jalan & klaim** — verifikasi klaim tol/parkir/retribusi, pencatatan uang jalan, dan bukti nota.
- **Scorecard driver** — evaluasi efisiensi, kepatuhan inspeksi, dan integritas transaksi.
- **Analytics & TCO** — biaya per kilometer, matriks biaya armada, tren bulanan, dan performa driver.
- **Servis & legalitas** — riwayat servis, interval perawatan, serta pemantauan KIR/STNK.
- **Master data** — driver, armada, tarif BBM, pengguna, pengaturan perusahaan, dan audit trail.
- **Laporan bulanan** — rekap BBM, servis, klaim, inspeksi, dan performa driver; unduh PDF/CSV atau cetak.
- **Export** — unduh laporan CSV dan cadangan database JSON.

### Portal driver

- Laporan pengisian BBM dengan KM awal otomatis dari odometer terakhir.
- Perhitungan jarak, KM/L, estimasi biaya, dan proyeksi kualitas sebelum kirim.
- Penanda pengisian eceran/darurat yang otomatis masuk audit admin.
- Unggah foto struk sebagai bukti transaksi.
- Checklist inspeksi siap jalan.
- Klaim biaya jalan dengan foto nota.
- Riwayat pengiriman terakhir dan ringkasan bulan berjalan.

### Konsol Platform Owner

- Ringkasan tenant aktif, masa uji coba, invoice belum dibayar, dan nilai langganan.
- Daftar tenant dengan pemakaian armada/driver/akun dibandingkan batas paket.
- Membuat, mengubah, menangguhkan, mengaktifkan, dan menghapus tenant.
- Membuat invoice manual, menandai lunas, atau membatalkan invoice.
- Katalog paket dan jejak audit platform.
- Menandai invoice lunas akan mengaktifkan paket tenant dan memperpanjang `active_until` satu bulan.

### PWA & offline

- `manifest.webmanifest` dengan ikon 192/512 dan maskable.
- Service worker hanya didaftarkan pada build produksi.
- Navigasi memakai network-first dengan fallback ke `/offline`.
- Aset statis memakai stale-while-revalidate; endpoint `/api/` tidak pernah di-cache.
- Halaman offline menampilkan status koneksi dan tombol coba lagi.

### Peran

| Peran | Akses |
| --- | --- |
| `owner` | Konsol platform: tenant, paket, invoice, audit platform. Tidak memiliki `tenantId`. |
| `admin` | Seluruh dashboard tenant, verifikasi, master data, pengguna, pengaturan, audit trail, dan reset data contoh. |
| `driver` | Portal driver, laporan BBM, inspeksi, dan klaim miliknya sendiri. |

Admin dapat membuka portal driver dalam mode pratinjau dan memilih driver yang ingin ditampilkan.

---

## 3. Teknologi

- Next.js 16 (App Router, Route Handlers, `proxy.ts`)
- React 19
- TypeScript
- Tailwind CSS v4
- Node.js runtime untuk API
- Penyimpanan: Postgres (`pg`) untuk Vercel/serverless, atau file JSON untuk lokal/VPS
- `node:crypto` untuk HMAC sesi, hash scrypt, dan ID acak
- `pdf-lib` untuk pembuatan PDF laporan di server
- Web App Manifest + Service Worker untuk PWA

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

| Peran | Perusahaan | Username | Password |
| --- | --- | --- | --- |
| Admin tenant | `demo` | `admin` | `admin123` |
| Driver tenant | `demo` | `driver` | `driver123` |
| Platform Owner | — | `owner` | `owner123` |

- Kode perusahaan bawaan adalah `demo` (tenant hasil migrasi data lama).
- Driver default terhubung ke nama **Ahmad Supardi** pada data contoh. Jika `DRIVER_NAME` diubah, pastikan nama tersebut ada di master driver.
- Platform Owner masuk melalui `/platform/login`.
- Perusahaan baru dapat mendaftar melalui `/register` dan langsung mendapat masa uji coba 14 hari.

> Ganti seluruh kredensial dan `SESSION_SECRET` sebelum dipakai di server produksi.

---

## 5. Konfigurasi lingkungan

Salin `.env.example` menjadi `.env.local`, lalu sesuaikan.

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `SESSION_SECRET` | Produksi | Kunci HMAC untuk cookie sesi. Gunakan string acak minimal 32 karakter. |
| `PLATFORM_USERNAME` | Tidak | Username Platform Owner. Default `owner`. |
| `PLATFORM_NAME` | Tidak | Nama tampilan Platform Owner. Default `Platform Owner`. |
| `PLATFORM_PASSWORD` | Lokal | Password polos Platform Owner. Default `owner123`. |
| `PLATFORM_PASSWORD_HASH` | Produksi | Hash scrypt Platform Owner. Jika diisi, menggantikan `PLATFORM_PASSWORD`. |
| `ADMIN_USERNAME` | Tidak | Default `admin`. Hanya berlaku untuk tenant bawaan `demo`. |
| `ADMIN_NAME` | Tidak | Nama tampilan administrator tenant bawaan. |
| `ADMIN_PASSWORD` | Lokal | Password polos admin tenant bawaan. |
| `ADMIN_PASSWORD_HASH` | Produksi | Hash scrypt. Jika diisi, menggantikan `ADMIN_PASSWORD`. |
| `DRIVER_USERNAME` | Tidak | Default `driver`. Hanya berlaku untuk tenant bawaan. |
| `DRIVER_NAME` | Tidak | Harus sama dengan nama di master driver. Default `Ahmad Supardi`. |
| `DRIVER_PASSWORD` | Lokal | Password polos driver tenant bawaan. |
| `DRIVER_PASSWORD_HASH` | Produksi | Hash scrypt untuk akun driver tenant bawaan. |
| `OPERATOR_USERNAME` | Opsional | Akun tambahan peran admin pada tenant bawaan. |
| `OPERATOR_NAME` | Opsional | Nama tampilan operator. |
| `OPERATOR_PASSWORD` / `OPERATOR_PASSWORD_HASH` | Opsional | Kredensial operator. |
| `DATABASE_URL` | Vercel | Connection string Postgres (Supabase/Neon/Vercel Postgres). **Wajib** di hosting serverless. |
| `PG_POOL_MAX` | Opsional | Jumlah koneksi per instance. Default `4`. |
| `FLEETOPS_DATA_DIR` | Opsional | Direktori database JSON. Default `./data`. Hanya dipakai bila `DATABASE_URL` kosong. |

Catatan penting:

- Variabel `ADMIN_*`, `DRIVER_*`, dan `OPERATOR_*` **hanya** berlaku untuk tenant bawaan hasil migrasi (`demo`).
- Tenant baru selalu memakai akun yang tersimpan di database tenant dengan hash scrypt.
- Akun dan password tenant dapat dikelola dari **Admin → Pengguna**.
- Jika `DATABASE_URL` diisi, aplikasi memakai Postgres dan mengabaikan `FLEETOPS_DATA_DIR`.
- Variabel alternatif yang juga dibaca: `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `SUPABASE_DB_URL`.
- `PGSSLMODE=disable` dapat dipakai untuk Postgres lokal tanpa SSL.

### Membuat hash password

```bash
npm run hash-password -- "password-yang-kuat"
```

Tempelkan hasil `scrypt$...` ke `ADMIN_PASSWORD_HASH`, `DRIVER_PASSWORD_HASH`, atau `PLATFORM_PASSWORD_HASH`, lalu hapus variabel password polos yang sesuai.

### Membuat SESSION_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 6. Penyimpanan data & multi-tenancy

Aplikasi punya dua backend penyimpanan yang dipilih otomatis:

- **Postgres** bila `DATABASE_URL` (atau `POSTGRES_URL`) diisi. Dipakai untuk Vercel/serverless dan aman untuk banyak instance.
- **File JSON** bila `DATABASE_URL` kosong. Dipakai untuk pengembangan lokal atau VPS dengan disk persisten.

### Mode Postgres

Satu tabel menyimpan seluruh dokumen:

```sql
create table if not exists fleetops_documents (
  scope text primary key,        -- 'platform' atau 'tenant:<id>'
  doc jsonb not null,            -- isi database
  updated_at timestamptz not null default now()
);
```

- Tabel dibuat otomatis saat pertama kali dipakai (tidak perlu migrasi manual).
- Setiap perubahan memakai transaksi + `select ... for update`, sehingga aman ketika beberapa instance Vercel menulis bersamaan.
- Perintah `npm run db:check` memverifikasi koneksi dan menampilkan dokumen yang ada.

### Mode file JSON

```text
data/
  platform.json          registri tenant, invoice, dan audit platform
  tenants/
    demo.json            database tenant bawaan (hasil migrasi)
    <tenant-id>.json     database tenant lain
  fleetops.json          data lama (sumber migrasi, tidak dipakai lagi setelah bootstrap)
```

- Lokasi default: `data/`. Dapat dipindahkan dengan `FLEETOPS_DATA_DIR` (disarankan path absolut di produksi).
- Saat pertama kali dijalankan, `data/platform.json` dibuat. Jika `data/fleetops.json` ada, isinya dimigrasikan menjadi tenant `demo` dengan paket `enterprise` dan ditandai `bootstrap`.
- Setiap tenant memiliki lock penulisan sendiri sehingga perubahan antar-tenant tidak saling menimpa.
- Penulisan dilakukan secara atomik (tulis file sementara lalu rename).
- Jika file tenant rusak, file tersebut dicadangkan dengan akhiran `.corrupt-<timestamp>.bak` lalu database dibuat ulang.
- Folder `data/` sudah diabaikan oleh Git.

### Kedua mode

- Reset data contoh mempertahankan akun pengguna dan identitas perusahaan tenant.
- Audit trail tenant menyimpan maksimal 500 entri terakhir.
- Data setiap tenant terisolasi dalam dokumennya sendiri.

### Backup

- **Postgres**: gunakan fitur backup penyedia (Supabase/Neon) atau `pg_dump`.
- **File JSON**: buka **Admin → Sistem & Audit → Unduh cadangan JSON**, lalu cadangkan juga `data/platform.json` dan seluruh isi `data/tenants/`.

### Reset data contoh

**Admin → Sistem & Audit → Kembalikan data contoh** akan mengganti seluruh data operasional tenant dengan data awal. Akun pengguna dan identitas perusahaan dipertahankan. Lakukan backup terlebih dahulu.

---

## 7. Paket & penagihan manual

| Paket | Harga / bulan | Armada | Driver | Akun |
| --- | --- | --- | --- | --- |
| Trial | Gratis (14 hari) | 5 | 5 | 3 |
| Starter | Rp 299.000 | 10 | 10 | 5 |
| Growth | Rp 699.000 | 40 | 40 | 20 |
| Enterprise | Rp 1.499.000 | 250 | 250 | 100 |

- Batas armada dan driver ditegakkan saat membuat data melalui API.
- Batas akun ditegakkan saat admin menambah pengguna.
- Status tenant: `TRIAL`, `ACTIVE`, `SUSPENDED`, `EXPIRED`.
- Masa trial/aktif yang lewat otomatis dianggap `EXPIRED` tanpa proses latar belakang.
- Invoice memiliki status `UNPAID`, `PAID`, atau `VOID`.
- Menandai invoice `PAID` akan mengaktifkan paket tenant dan memperpanjang `active_until` satu bulan.
- Pembayaran dilakukan via transfer bank; Platform Owner menandai lunas secara manual setelah dana diterima.
- Tidak ada payment gateway, webhook, atau layanan pihak ketiga.

---

## 8. Laporan bulanan & PDF

- Halaman: **Admin → Laporan Bulanan** (`/admin/reports`).
- Periode dipilih per bulan dan tahun; data dihitung dari transaksi BBM, servis, inspeksi, dan klaim pada periode tersebut.
- Ringkasan mencakup total biaya, BBM, servis, klaim, jarak, efisiensi, anomali, kepatuhan inspeksi, dan penggunaan anggaran.
- Rapor driver memakai komposisi skor: 50 efisiensi + 30 kepatuhan inspeksi + 20 integritas transaksi.
- **Unduh PDF** menghasilkan dokumen A4 landscape dengan header, KPI, tabel armada, tabel driver, catatan otomatis, dan nomor halaman.
- **CSV** menghasilkan data tabular untuk diolah lebih lanjut.
- **Cetak** memakai tampilan print-friendly; sidebar, header, tombol, dan elemen `.no-print` disembunyikan.
- PDF dibuat di server dengan `pdf-lib` dan font standar Helvetica/Courier. Karakter non-ASCII disanitasi otomatis agar tidak gagal render.

Endpoint: `GET /api/reports/monthly?year=YYYY&month=MM&format=json|csv|pdf` (khusus admin tenant).

---

## 9. PWA & mode offline

- Manifest: `app/manifest.ts` → `/manifest.webmanifest`.
- Service worker: `public/sw.js`, didaftarkan oleh `components/pwa/PwaProvider.tsx` hanya pada produksi.
- Strategi cache:
  - `/api/` tidak pernah di-cache.
  - Navigasi: network-first, fallback ke `/offline`.
  - Aset statis: stale-while-revalidate.
- Halaman `/offline` menampilkan status koneksi dan tombol coba lagi.
- Untuk menguji PWA, jalankan build produksi (`npm run build && npm run start`) dan akses melalui `localhost` atau HTTPS.

---

## 10. Skrip

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan server pengembangan. |
| `npm run build` | Build produksi. |
| `npm run start` | Menjalankan hasil build. |
| `npm run lint` | Pemeriksaan ESLint. |
| `npm run typecheck` | Pemeriksaan TypeScript tanpa emit. |
| `npm run db:check` | Cek koneksi Postgres dan siapkan tabel dokumen. |
| `npm run hash-password -- "..."` | Membuat hash scrypt. |

---

## 11. Struktur utama

```text
app/
  api/
    auth/            login, logout, sesi, pendaftaran tenant
    platform/        login, data, tenant, invoice (khusus owner)
    fleet/           baca dan CRUD koleksi data tenant
    settings/        pengaturan perusahaan
    users/           pengelolaan akun tenant
    reports/monthly/ laporan bulanan JSON/CSV/PDF
    admin/reset/     reset data contoh
  admin/             dashboard, master data, laporan bulanan
  driver/            portal driver
  login/             halaman masuk tenant
  register/          pendaftaran perusahaan baru
  platform/          konsol Platform Owner
  offline/           halaman offline PWA
  manifest.ts        manifest PWA
components/
  admin/             modul dashboard admin
  driver/            portal driver dan modal
  platform/          konsol platform
  providers/         FleetProvider (data, CRUD, toast)
  pwa/               pendaftaran service worker
  ui/                komponen dasar (Modal, Icon, Chart, dll.)
lib/
  auth.ts            sesi server
  auth-session.ts    HMAC, scrypt, rate limit
  client-store.ts    helper fetch ke API internal
  fuel.ts            perhitungan kualitas BBM
  plans.ts           katalog paket dan status tenant
  reports.ts         agregasi laporan bulanan
  server/
    db.ts            koneksi Postgres dan skema tabel dokumen
    storage.ts       adapter penyimpanan (Postgres atau file JSON)
    store.ts         penyimpanan tenant, audit, filter per peran
    platform-store.ts registri tenant, invoice, audit platform
    report-pdf.ts    generator PDF laporan
  seed.ts            data contoh
public/
  sw.js              service worker
  icons/             ikon PWA
scripts/
  db-check.mjs       verifikasi koneksi Postgres
  hash-password.mjs  pembuat hash scrypt
proxy.ts             proteksi route admin/driver/platform
```

---

## 12. Logika perhitungan

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

## 13. Keamanan

- Login memakai kode perusahaan + username + password; password disimpan sebagai hash scrypt.
- Cookie sesi `fleetops_session` bersifat `HttpOnly` dan `SameSite=Lax`. Atribut `Secure` aktif otomatis pada HTTPS (termasuk di belakang reverse proxy dengan `X-Forwarded-Proto: https`) dan dimatikan untuk `localhost` agar pratinjau produksi di mesin lokal tetap dapat login.
- Token sesi ditandatangani HMAC-SHA256 dan memiliki masa berlaku sesuai pengaturan **Durasi sesi (jam)** di menu Sistem & Audit (default 8 jam, rentang 1–72 jam).
- Sesi tenant wajib memiliki `tenantId`; sesi `owner` tidak memiliki tenant dan hanya dapat mengakses konsol platform.
- Percobaan login dan pendaftaran dibatasi per alamat IP.
- Permintaan mutasi memeriksa same-origin.
- Peran diperiksa di server pada layout dan setiap Route Handler.
- Driver hanya dapat membaca data miliknya dan membuat laporan/inspeksi/klaim.
- Admin tidak dapat menghapus atau menonaktifkan akunnya sendiri, dan tenant non-bootstrap harus selalu memiliki minimal satu admin aktif.
- Batas paket ditegakkan di server, bukan hanya di tampilan.
- Header keamanan dasar dipasang melalui `next.config.ts`.
- Aplikasi menonaktifkan indeks mesin pencari melalui metadata.
- Dependency produksi bebas advisory (`npm audit --omit=dev`). Sisa peringatan hanya berasal dari paket pengembangan ESLint dan tidak ikut ter-deploy.

Untuk produksi:

1. Gunakan HTTPS.
2. Ganti `SESSION_SECRET`, kredensial Platform Owner, dan seluruh kredensial bawaan.
3. Gunakan `PLATFORM_PASSWORD_HASH`, `ADMIN_PASSWORD_HASH`, dan `DRIVER_PASSWORD_HASH`.
4. Pastikan direktori data persisten dan hanya dapat diakses proses aplikasi.
5. Batasi akses jaringan ke VPN/jaringan kantor bila memungkinkan.
6. Backup `data/platform.json` dan `data/tenants/` secara berkala.
7. Jangan menaruh kredensial asli di repository.

---

## 14. Deployment

### Vercel + Postgres (serverless)

Vercel tidak menyediakan filesystem permanen, jadi aplikasi **wajib** memakai Postgres.

1. Buat database Postgres gratis, misalnya **Supabase** atau **Neon**.
2. Salin connection string (gunakan host pooling: Supabase port `6543`, Neon host `-pooler`).
3. Di Vercel → Project → **Settings → Environment Variables**, tambahkan:
   - `DATABASE_URL`
   - `SESSION_SECRET` (acak, minimal 32 karakter)
   - `PLATFORM_PASSWORD_HASH`, `ADMIN_PASSWORD_HASH`, `DRIVER_PASSWORD_HASH`
4. Deploy ulang. Tabel `fleetops_documents` dibuat otomatis pada permintaan pertama.
5. Verifikasi dari lokal: isi `DATABASE_URL` di `.env.local`, lalu jalankan `npm run db:check`.
6. Login dengan tenant bawaan `demo` atau daftar perusahaan baru di `/register`.

Catatan Vercel:

- Jangan set `FLEETOPS_DATA_DIR`; variabel itu hanya untuk mode file.
- Gunakan connection pooler agar tidak kehabisan koneksi. Default `PG_POOL_MAX=4` per instance.
- Data tetap ada setelah redeploy/cold start karena tersimpan di Postgres.
- PWA memerlukan HTTPS; Vercel sudah menyediakannya.

### VPS / server kantor (file JSON)

- Jalankan `npm run build` lalu `npm run start` di belakang reverse proxy HTTPS.
- Biarkan `DATABASE_URL` kosong dan atur `FLEETOPS_DATA_DIR` ke path absolut, misalnya `/var/lib/fleetops`.
- Pastikan direktori data hanya dapat diakses proses aplikasi dan ikut di-backup.
- **Jangan** menaruh `data/` di dalam folder publik.
- PWA memerlukan HTTPS (atau `localhost`) agar service worker dapat didaftarkan.

### VPS dengan Postgres

- Isi `DATABASE_URL`; `FLEETOPS_DATA_DIR` diabaikan.
- Cocok bila ingin data terpusat dan tidak bergantung pada file server.

---

## 15. Troubleshooting

**Di Vercel semua modul gagal dimuat / login 500**

- Gejalanya biasanya `EROFS: read-only file system` atau pesan `DATABASE_URL belum dikonfigurasi` pada log function.
- Vercel tidak bisa menyimpan file JSON. Set `DATABASE_URL` ke Postgres (Supabase/Neon) lalu deploy ulang.
- Jalankan `npm run db:check` dengan `DATABASE_URL` yang sama untuk memastikan koneksi berhasil.
- Jika memakai Supabase, gunakan connection pooler port `6543`; jika Neon, gunakan host `-pooler`.

**`npm run db:check` gagal konek**

- Periksa password/URL, dan pastikan `?sslmode=require` atau biarkan deteksi SSL otomatis.
- Untuk Postgres lokal tanpa SSL, set `PGSSLMODE=disable`.
- Jika provider membatasi koneksi, turunkan `PG_POOL_MAX`.

**Login gagal padahal kredensial benar**

- Pastikan `.env.local` terbaca dan server dijalankan ulang setelah mengubah env.
- Pastikan kode perusahaan diisi untuk akun tenant non-bawaan.
- Jika memakai `*_PASSWORD_HASH`, pastikan formatnya `scrypt$<salt>$<key>`.
- Hapus `*_PASSWORD` bila memakai hash agar tidak membingungkan.

**Kode perusahaan tidak ditemukan**

- Periksa ejaan kode (huruf kecil, angka, tanda hubung).
- Platform Owner dapat melihat kode perusahaan pada **Konsol Platform → Tenant**.

**Tenant tidak bisa login**

- Status tenant mungkin `SUSPENDED` atau `EXPIRED`. Platform Owner dapat mengaktifkan kembali atau menandai invoice lunas untuk memperpanjang masa aktif.

**Data kembali ke contoh setelah restart**

- Mode file JSON: direktori data tidak persisten. Set `FLEETOPS_DATA_DIR` ke volume permanen.
- Mode Postgres: pastikan `DATABASE_URL` menunjuk database yang sama dan tidak memakai database sementara.

**Data lama tidak muncul setelah upgrade SaaS**

- Pastikan `data/fleetops.json` ada saat pertama kali `data/platform.json` dibuat. Jika registri sudah terbentuk sebelum migrasi, salin data lama secara manual atau pulihkan backup lalu hapus `data/platform.json` sebelum menjalankan ulang.

**Driver tidak melihat data miliknya**

- Pastikan `DRIVER_NAME` atau `driver_name` pada akun pengguna sama dengan nama pada master driver (termasuk ejaan dan spasi).

**Laporan BBM ditolak**

- KM akhir harus lebih besar dari odometer terakhir armada.
- Liter harus lebih dari 0.
- Armada dan jenis BBM harus ada di master data.

**Ukuran foto struk ditolak**

- Maksimal sekitar 2 MB. Kompres foto sebelum diunggah.

**PWA tidak muncul sebagai aplikasi**

- Pastikan diakses via HTTPS atau `localhost`, dan jalankan build produksi. Service worker tidak didaftarkan pada mode pengembangan.

**PDF gagal diunduh**

- Pastikan sesi admin masih aktif. Coba muat ulang halaman laporan lalu unduh kembali.

---

## 16. Catatan biaya

Tidak ada biaya API dalam pembuatan dan operasional dasar aplikasi ini:

- Endpoint `/api/*` adalah Route Handler internal Next.js.
- PDF dibuat lokal dengan `pdf-lib`.
- Tidak ada OpenAI, Google Maps, Firebase, WhatsApp Business API, payment gateway, atau layanan berlangganan lain.
- WhatsApp reminder memakai tautan `wa.me` yang dikirim manual.
- Penagihan pelanggan dilakukan manual melalui invoice dan transfer bank.
- Biaya hanya muncul bila memilih hosting/domain, atau bila nanti menambahkan integrasi pihak ketiga secara sadar.

---

## 17. Lisensi

Penggunaan internal. Tidak untuk didistribusikan ulang tanpa izin.
