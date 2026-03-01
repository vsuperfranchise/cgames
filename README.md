# Daytona Playground

This directory contains the files for the **Octocat Playground** web application, which has been customized into a CGames store environment.

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
- `app.js` – JavaScript handling authentication, content saving, game uploads, download/play links, and PayPal checkout

## Notes

All persistent data is stored in the browser's `localStorage`. Only the hardcoded user `solomonubani1987@gmail.com` / `cgames` can log in and upload games. Uploaded games incur a fixed £11 checkout via PayPal link. When games are uploaded they appear in a list with a Download/Play link that allows the browser to download or open the executable.

A helper Python script (`daytona_conversion.py`) is included showing how the Daytona API could be used to create a sandbox and clone this repository. It demonstrates the snippet supplied in the user request.

When the user signs in a **Session Game ID** is generated and displayed at the top of the playground. This ID is prepended to any Game IDs created by saving content or uploading games, enabling tracking of changes tied to a specific login session.
