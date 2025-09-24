#!/usr/bin/env python3
import json, os, sys, time
from urllib.parse import urlparse

try:
    import feedparser
except Exception:
    print("This script requires feedparser. Install with: pip3 install feedparser", file=sys.stderr)
    sys.exit(1)

# A few Vietnamese public RSS feeds (headlines only)
FEEDS = [
    "https://vnexpress.net/rss/tin-moi-nhat.rss",
    "https://tuoitre.vn/rss/tin-moi-nhat.rss",
    "https://thanhnien.vn/rss/home.rss",
]

def fetch_all(max_items=15):
    items = []
    for url in FEEDS:
        d = feedparser.parse(url)
        for e in d.entries:
            title = getattr(e, 'title', '') or ''
            link = getattr(e, 'link', '') or ''
            summary = getattr(e, 'summary', '') or ''
            # Try to find image
            image = ''
            media = getattr(e, 'media_content', []) or []
            if media and isinstance(media, list):
                for m in media:
                    if isinstance(m, dict) and m.get('url'):
                        image = m['url']
                        break
            if not image:
                # Some feeds provide content with img
                content = getattr(e, 'content', []) or []
                if content and isinstance(content, list):
                    import re
                    html = content[0].get('value', '')
                    m = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', html, re.I)
                    if m:
                        image = m.group(1)

            if not title or not link:
                continue
            items.append({
                'title': title.strip(),
                'link': link.strip(),
                'summary': summary.strip(),
                'image': image.strip(),
                'source': urlparse(url).netloc,
            })
            if len(items) >= max_items:
                return items
    return items

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(root, 'data')
    os.makedirs(out_dir, exist_ok=True)
    items = fetch_all()
    data = {
        'source': 'rss',
        'updatedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'items': items,
    }
    out_file = os.path.join(out_dir, 'news.json')
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'Wrote {len(items)} items to {out_file}')

if __name__ == '__main__':
    main()


