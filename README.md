# MP3 Playlist (Static Site)

Local-first, static MP3 playlist site that works on GitHub Pages.

## Structure

```
assets/
  audio/                # put your .mp3 files here
  images/
    favicon.svg
    placeholder-cover.svg
playlists/
  default.json          # editable playlist data
data/
  news.json             # dynamic news data (generated)
index.html
styles.css
app.js
.nojekyll               # ensures GitHub Pages serves files as-is
```

## Add your media

1. Copy your MP3s into `assets/audio/`.
2. Copy your cover images into `assets/images/` (optional). If a track has no cover, a placeholder is used.
3. Edit `playlists/default.json` to point to your local files, e.g.:

```json
{
  "name": "My Playlist",
  "tracks": [
    {
      "title": "Song Title",
      "artist": "Artist Name",
      "src": "assets/audio/my-song.mp3",
      "cover": "assets/images/my-cover.jpg"
    }
  ]
}
```

Tip: Keep paths relative and inside this repo so it works on GitHub Pages.

## Run locally

Because browsers block `file://` fetch, serve a tiny local web server:

```bash
python3 -m http.server 5173
```

Then open `http://localhost:5173/`.

### Populate Vietnamese news (optional)

This site can render headlines from public Vietnamese RSS feeds. Generate local data:

```bash
pip3 install feedparser
python3 scripts/fetch_news.py
```

This writes `data/news.json`, which the homepage will load.

## Deploy to GitHub Pages

1. Commit and push to a GitHub repo.
2. In the repo settings → Pages:
   - Source: Deploy from a branch
   - Branch: `main` / root (or `docs` if you prefer)
3. Wait a minute, then open your Pages URL.

Notes:
- The `.nojekyll` file avoids Jekyll processing.
- If your repo name is not the root domain, Pages serves at `/REPO-NAME/`. The relative asset paths in this project work as-is.

## Customize

- Change site title in `index.html`.
- Adjust theme colors in `styles.css` (supports light/dark toggle).
- You can create additional playlists in `playlists/` and update `app.js` to load a different JSON if desired.

