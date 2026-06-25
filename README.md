# Mon Cherie Photobooth

Mon Cherie is a browser-based Korean photobooth app with frame selection, a receipt-rip transition, camera capture, filters, sticker decoration, and downloadable photo strips.

## Features

- Choose a frame layout: 2 pics, 3 pics, 4 big, or 4 stacked
- Rip a receipt-style ticket to enter photo mode
- Take photos with countdown and camera switching
- Apply cute camera filters
- Decorate the finished strip with sticker sets
- Download the final photobooth strip as a PNG

## Run Locally

Because the app uses the camera, it works best from a local server:

```bash
python3 -m http.server 5173
```

Then open:

```text
http://127.0.0.1:5173/
```

You can also open `index.html` directly, but some browsers may limit camera access from local files.

## Files

- `index.html` - app structure and screens
- `styles.css` - visual design and responsive layout
- `app.js` - photobooth flow, camera capture, filters, stickers, and download
- `assets/` - sticker image assets

## GitHub Pages

This is a static site, so it can be hosted with GitHub Pages. Set the Pages source to the repository root, then open the generated Pages URL.

