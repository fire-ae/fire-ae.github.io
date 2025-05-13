import json
import os
from datetime import datetime
import feedparser # parses RSS feeds
from waybackpy import WaybackMachineSaveAPI # Currently ignored
from jinja2 import Environment, FileSystemLoader
import shutil
from email.utils import parsedate_to_datetime


# ---- Configuration ----
ARCHIVE_FILE = "fire_news_archive.json"
OUTPUT_HTML = "firealarms.html"
TEMPLATE_DIR = "templates"
KEYWORDS = ["yangın", "orman yangını", "alev", "kıvılcım", "duman", "tutuşma"]

RSS_FEEDS = [
    ("TRT Haber", "https://www.trthaber.com/sondakika.rss"),
    ("AA", "https://www.aa.com.tr/tr/rss/default?cat=guncel"),
    ("İHA", "https://www.iha.com.tr/rss/ana-sayfa"),
]

# Date parsing

def parse_date(date_str):
    try:
        dt = parsedate_to_datetime(date_str)
    except Exception:
        dt = datetime.utcnow()
    return dt.strftime("%Y-%m-%d, %A")  # Example: "2025-05-11, Sunday"

# ---- Load or Init Archive ----

def load_archive(filename):
    if not os.path.exists(filename):
        return {}
    try:
        with open(filename, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        backup_name = filename + ".bak"
        shutil.copyfile(filename, backup_name)
        print(f"[WARN] Corrupt archive detected. Backup saved to {backup_name}. Resetting archive.")
        return {}

def save_archive(data, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ---- Archive Link via Wayback Machine ----
def archive_url(url):
    try:
        save_api = WaybackMachineSaveAPI(url, user_agent="Mozilla/5.0")
        return save_api.save().archive_url
    except Exception as e:
        print(f"Archive error: {e}")

# ---- Filter Relevant News ----
def is_fire_related(title):
    title_lower = title.lower()
    return any(keyword in title_lower for keyword in KEYWORDS)

# ---- Parse and Update ----
def update_archive():
    archive = load_archive(ARCHIVE_FILE)
    today = datetime.utcnow().strftime("%Y-%m-%d")

    for source, feed_url in RSS_FEEDS:
        feed = feedparser.parse(feed_url)
        for entry in feed.entries:
            title = entry.title
            link = entry.link
            date_str = parse_date(entry.get("published", today))
            year = date_str  # use full date as key, not just the year

            if not is_fire_related(title):
                print("No fire-related news was parsed.")
                continue

            # Avoid duplicates
            existing = archive.get(year, [])
            if any(link == item["link"] for item in existing):
                print(f'The item - {item["title"]} - was already saved in the JavaScript Object Notation file.')
                continue

            print(f"[{source}] Archiving: {title}")
            #archived = archive_url(link)
            # i bombed the server with lots of trials, lets just do for a while without archiving there
            archived = link
            item = {
                "date": date_str,
                "title": title,
                "link": link,
                "archive_url": archived,
                "source": source,
            }

            archive.setdefault(year, []).append(item)

    save_archive(archive, ARCHIVE_FILE)
    return archive

# ---- Generate HTML ----
def render_html(archive):
    env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
    template = env.get_template("fire_template.html")
    html = template.render(archive=archive)

    with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
        f.write(html)

# ---- Main ----
if __name__ == "__main__":
    archive = update_archive()
    render_html(archive)
    print("✅ firealarms.html generated.")
