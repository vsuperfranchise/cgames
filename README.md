# Daytona Playground

This directory contains the files for the Daytona Playground web application.

## Usage

Open `index.html` in a browser. You can also start a simple HTTP server:

```sh
cd daytona-playground
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Files

- `index.html` – main page with login, editor, and store
- `styles.css` – styling for the playground
- `app.js` – JavaScript handling authentication, content saving, game uploads, and PayPal checkout

## Notes

All persistent data is stored in the browser's `localStorage`. Only the hardcoded user `solomonubani1987@gmail.com` / `cgames` can log in and upload games. Uploaded games incur a fixed £11 checkout via PayPal link.
