# One-Click AI Reader

The extension analyzes an explicit question selection instead of reading an entire page. Click **Select Question** (or press **Ctrl+Shift+S**), drag around the question, review/edit the locally extracted text, then press **Ask AI**. Readable DOM text is preferred; images, canvas, diagrams, and unreadable text use a cropped-region vision fallback.

No page content is collected in the background and no selected content is sent before the user presses **Ask AI**.

Chrome Extension Manifest V3 yang membaca konten halaman aktif dan menjawabnya melalui OpenAI dalam satu klik. Ekstensi memprioritaskan teks terpilih dan DOM yang terlihat; screenshot vision hanya dipakai sebagai fallback jika halaman tidak memiliki teks yang dapat dibaca.

## Fitur

- Popup **Ask AI** dan tombol floating draggable
- Ekstraksi selected text, main/article, heading, tabel, list, dan teks terlihat
- OpenAI Responses API dengan provider interface yang mudah diperluas
- Screenshot + model vision fallback (opsional)
- Shortcut `Ctrl+Shift+A` (`Command+Shift+A` di macOS)
- Klik kanan **Ask AI about this** pada selection atau halaman
- Copy, regenerate, clear, dan history lokal (maksimal 25 hasil)
- Bahasa, custom prompt, panjang konteks, dan model dapat diatur
- API connection test, loading state, dan pesan error
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
5. Buka halaman web biasa (`http`/`https`) lalu klik **Ask AI**.

`npm run dev` menjalankan Vite untuk mem-preview file UI, tetapi pengujian API Chrome dan content script tetap harus dilakukan melalui extension yang di-load dari `dist`.

## Konfigurasi OpenAI

Default model adalah `gpt-4.1-mini`. API key dimasukkan lewat halaman Settings dan disimpan di `chrome.storage.local`; key tidak ada di source code atau hasil build. `.env.example` hanya dokumentasi untuk development dan tidak otomatis dibundel.

> Catatan keamanan: extension yang memanggil API secara langsung tidak dapat sepenuhnya menyembunyikan key dari pengguna lokal yang menguasai browser. Untuk deployment organisasi/produksi, isi **Custom endpoint** dengan backend/proxy Anda yang mengautentikasi pengguna dan menyimpan key server-side. Endpoint harus kompatibel dengan OpenAI Responses API dan domainnya perlu ditambahkan ke `host_permissions` di manifest.

Data halaman hanya dikirim saat pengguna menekan Ask AI, shortcut, atau menu klik-kanan. Screenshot hanya diambil saat ekstraksi DOM kosong dan fallback diaktifkan.

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

Turunkan class baru dari `AIProvider` di `src/ai/provider.js`, implementasikan `analyze()` dan `test()`, lalu daftarkan di `src/ai/index.js`. Tambahkan domain API yang benar secara sempit pada `host_permissions`.

## Batasan MVP

- Halaman internal Chrome, Chrome Web Store, dan beberapa PDF viewer tidak mengizinkan content script.
- Screenshot fallback membaca area viewport saat ini, bukan full-page scrolling capture.
- Aplikasi berbasis canvas/WebGL tanpa DOM akan bergantung pada model vision.
- Default shortcut dapat bentrok dengan shortcut Chrome/OS dan dapat diubah di `chrome://extensions/shortcuts`.
