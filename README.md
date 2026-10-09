# One-Click AI Reader

The extension analyzes an explicit question selection instead of reading an entire page. Click **Select Question** (or press **Ctrl+Shift+S**), drag around the question, review/edit the locally extracted text, then press **Ask AI**. Readable DOM text is preferred; images, canvas, diagrams, and unreadable text use a cropped-region vision fallback.

No page content is collected in the background and no selected content is sent before the user presses **Ask AI**.

Chrome Extension Manifest V3 yang menganalisis area soal pilihan pengguna melalui OpenAI. Ekstensi memprioritaskan teks terpilih dan DOM; screenshot vision hanya dipakai sebagai fallback jika teks tidak terbaca atau halaman menolak content script.

## Fitur

- Popup **Select Question** dan tombol floating draggable
- Pemilihan area soal dengan drag, teks terseleksi, atau elemen yang sedang fokus
- Ekstraksi teks dari area terpilih dengan saran area soal otomatis
- OpenAI Responses API dengan provider interface yang mudah diperluas
- Screenshot + model vision fallback (opsional), termasuk capture tab terlihat untuk PDF viewer/halaman terbatas
- Dukungan iframe (semua frame) dan `file://`
- Shortcut `Ctrl+Shift+S` (`Command+Shift+S` di macOS)
- Klik kanan **Select Question Area** pada selection atau halaman
- Copy, regenerate, clear, dan history lokal (maksimal 25 hasil)
- Bahasa, custom prompt, panjang konteks, dan model dapat diatur
- API connection test, loading state, dan pesan error
- Kode error yang jelas (halaman terbatas, akses file dinonaktifkan, capture gagal)
- Tidak ada pembacaan/pengiriman halaman tanpa tindakan eksplisit pengguna

## Menjalankan

Persyaratan: Node.js 20+ dan Chrome/Chromium modern.

```bash
npm install
npm run build
```

Lalu buka `chrome://extensions`:

1. Aktifkan **Developer mode**.
2. Klik **Load unpacked**.
3. Pilih folder `dist` hasil build.
4. Buka ikon extension → Settings, masukkan OpenAI API key dan model.
5. Buka halaman yang ingin dianalisis lalu klik **Select Question**. Untuk `file://`, aktifkan **Allow access to file URLs** pada detail extension.

`npm run dev` menjalankan Vite untuk mem-preview file UI, tetapi pengujian API Chrome dan content script tetap harus dilakukan melalui extension yang di-load dari `dist`.

## Konfigurasi OpenAI

Default model adalah `gpt-4.1-mini`. API key dimasukkan lewat halaman Settings dan disimpan di `chrome.storage.local`; key tidak ada di source code atau hasil build. `.env.example` hanya dokumentasi untuk development dan tidak otomatis dibundel.

> Catatan keamanan: extension yang memanggil API secara langsung tidak dapat sepenuhnya menyembunyikan key dari pengguna lokal yang menguasai browser. Untuk deployment organisasi/produksi, isi **Custom endpoint** dengan backend/proxy Anda yang mengautentikasi pengguna dan menyimpan key server-side. Endpoint harus kompatibel dengan OpenAI Responses API dan domainnya perlu ditambahkan ke `host_permissions` di manifest.

Data halaman hanya dikirim setelah pengguna meninjau dan menekan **Ask AI**. Pada fallback tab terlihat (halaman yang memblokir content script), screenshot viewport dikirim ke model vision saat **Select Question** ditekan. Fallback hanya aktif jika opsi screenshot diaktifkan.

## Struktur

```text
manifest.json
src/
  ai/          provider, prompt, dan implementasi OpenAI
  background/  orchestration, shortcut, context menu
  content/     page reader dan floating panel
  popup/       one-click popup UI
  options/     settings UI
  utils/       extraction dan storage
scripts/       build script
assets/
```

## Menambah provider

Turunkan class baru dari `AIProvider` di `src/ai/provider.js`, implementasikan `analyze()` dan `test()`, lalu daftarkan di `src/ai/index.js`. Manifest saat ini memakai `host_permissions: <all_urls>` agar content script dapat berjalan di semua frame; sempitkan jika tidak memerlukan dukungan iframe/halaman lokal.

## Dukungan halaman dan fallback

- HTTP/HTTPS, SPA, halaman lokal `file://` (setelah izin file diaktifkan), dan frame yang dapat diakses memakai content script di semua frame.
- Teks yang sedang dipilih diprioritaskan, lalu elemen aktif/DOM area, lalu screenshot vision.
- PDF viewer dan halaman yang menolak content script memakai capture viewport jika browser mengizinkannya.
- Halaman internal Chrome/Edge dan store tidak pernah dibypass. Jika capture juga ditolak, extension menampilkan alasan pembatasan browser.
- Screenshot fallback membaca area viewport saat ini, bukan full-page scrolling capture.
- Aplikasi berbasis canvas/WebGL tanpa DOM akan bergantung pada model vision.
- Default shortcut dapat bentrok dengan shortcut Chrome/OS dan dapat diubah di `chrome://extensions/shortcuts`.
