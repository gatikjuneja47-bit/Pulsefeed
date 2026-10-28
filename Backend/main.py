import os
import time
import requests
import feedparser
from typing import List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

app = FastAPI(
    title="POSTFEED News Aggregator API",
    description="Unified backend service providing real-time aggregated news and reliability metrics for Flutter client.",
    version="1.0.0"
)

# Enable CORS (Allows Flutter web, mobile, and desktop clients to make cross-origin requests)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production to restrict domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CACHE_TTL = 600  # 10 Minutes Cache TTL
cached_news_data = []
last_fetch_time = 0.0

class Article(BaseModel):
    id: str
    title: str
    description: str
    url: str
    image_url: Optional[str] = None
    source: str
    category: str
    reliability: int

class NewsResponse(BaseModel):
    status: str
    total_results: int
    data: List[Article]

CATEGORY_KEYWORDS = {
    "Technology": ["tech", "ai", "software", "apple", "google", "microsoft", "cyber", "data", "app", "semiconductor", "quantum", "robot", "crypto", "digital"],
    "Business & Finance": ["stock", "market", "economy", "bank", "trade", "investment", "rupee", "dollar", "gdp", "profit", "business", "inflation", "tax"],
    "Science & Health": ["space", "nasa", "isro", "health", "cancer", "medical", "climate", "research", "vaccine", "biology", "physics", "doctor"],
    "Sports": ["cricket", "football", "ipl", "match", "tournament", "stadium", "score", "cup", "tennis", "olympics", "athlete", "nba"],
    "Politics": ["election", "minister", "government", "parliament", "policy", "court", "supreme court", "bjp", "congress", "president", "vote"]
}

def classify_article(title: str, description: str) -> str:
    """Categorize an article using keyword matching across title and description."""
    text = f"{title} {description}".lower()
    scores = {category: 0 for category in CATEGORY_KEYWORDS}
    
    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                scores[category] += 1
                
    best_category = max(scores, key=scores.get)
    return best_category if scores[best_category] > 0 else "General"

def calculate_reliability(source: str, has_image: bool, description: str) -> int:
    """Calculates an API Reliability Score (0-100%) based on source credibility and content richness."""
    score = 60  # Base score
    
    known_sources = ["reuters", "ap", "bbc", "bloomberg", "ndtv", "times of india", "the hindu", "gnews", "currentsapi"]
    if any(s in source.lower() for s in known_sources):
        score += 20
        
    if has_image:
        score += 10
    if len(description) > 100:
        score += 10
        
    return min(score, 98)

def fetch_newsdata_news() -> List[dict]:
    api_key = os.getenv("NEWS_DATA_API_KEY")
    if not api_key:
        return []
    url = "https://newsdata.io/api/1/latest"
    params = {"country": "in", "apikey": api_key}
    try:
        res = requests.get(url, params=params, timeout=8)
        if res.status_code == 200:
            articles = []
            for item in res.json().get("results", []):
                title = item.get("title") or "No Title"
                desc = item.get("description") or "No description available."
                src = (item.get("source_id") or "NewsData").capitalize()
                img = item.get("image_url")
                articles.append({
                    "id": str(hash(title)),
                    "title": title,
                    "description": desc,
                    "url": item.get("link", "#"),
                    "image_url": img,
                    "source": src,
                    "category": classify_article(title, desc),
                    "reliability": calculate_reliability(src, bool(img), desc)
                })
            return articles
    except Exception:
        pass
    return []

def fetch_gnews_news() -> List[dict]:
    api_key = os.getenv("GNEWS_API_KEY")
    if not api_key:
        return []
    url = "https://gnews.io/api/v4/search"
    params = {"q": "latest", "lang": "en", "country": "in", "apikey": api_key}
    try:
        res = requests.get(url, params=params, timeout=8)
        if res.status_code == 200:
            articles = []
            for item in res.json().get("articles", []):
                title = item.get("title") or "No Title"
                desc = item.get("description") or item.get("content") or "No description available."
                src = item.get("source", {}).get("name", "GNews")
                img = item.get("image")
                articles.append({
                    "id": str(hash(title)),
                    "title": title,
                    "description": desc,
                    "url": item.get("url", "#"),
                    "image_url": img,
                    "source": src,
                    "category": classify_article(title, desc),
                    "reliability": calculate_reliability(src, bool(img), desc)
                })
            return articles
    except Exception:
        pass
    return []

def fetch_currents_news() -> List[dict]:
    api_key = os.getenv("CURRENT_API_KEY")
    if not api_key:
        return []
    url = "https://api.currentsapi.services/v1/latest-news"
    params = {"apiKey": api_key, "language": "en"}
    try:
        res = requests.get(url, params=params, timeout=8)
        if res.status_code == 200:
            articles = []
            for item in res.json().get("news", []):
                title = item.get("title") or "No Title"
                desc = item.get("description") or "No description available."
                src = item.get("author") or "CurrentsAPI"
                img = item.get("image")
                if img == "None":
                    img = None
                articles.append({
                    "id": str(hash(title)),
                    "title": title,
                    "description": desc,
                    "url": item.get("url", "#"),
                    "image_url": img,
                    "source": src,
                    "category": classify_article(title, desc),
                    "reliability": calculate_reliability(src, bool(img), desc)
                })
            return articles
    except Exception:
        pass
    return []

def fetch_rss_news() -> List[dict]:
    rss_feeds = [
        ("https://feeds.feedburner.com/ndtvnews-top-stories", "NDTV News"),
        ("https://timesofindia.indiatimes.com/rssfeedstopstories.cms", "Times of India")
    ]
    articles = []
    for feed_url, source_name in rss_feeds:
        try:
            feed = feedparser.parse(feed_url)
            for entry in feed.entries[:15]:
                title = entry.get("title", "No Title")
                desc = entry.get("summary", "No description available.")
                link = entry.get("link", "#")
                articles.append({
                    "id": str(hash(title)),
                    "title": title,
                    "description": desc,
                    "url": link,
                    "image_url": None,
                    "source": source_name,
                    "category": classify_article(title, desc),
                    "reliability": calculate_reliability(source_name, False, desc)
                })
        except Exception:
            pass
    return articles

def aggregate_and_deduplicate() -> List[dict]:
    """Combines streams across all sources and removes duplicates."""
    global cached_news_data, last_fetch_time
    
    current_time = time.time()
    if cached_news_data and (current_time - last_fetch_time < CACHE_TTL):
        return cached_news_data

    raw_articles = []
    raw_articles.extend(fetch_newsdata_news())
    raw_articles.extend(fetch_gnews_news())
    raw_articles.extend(fetch_currents_news())
    raw_articles.extend(fetch_rss_news())

    unique_map = {}
    for article in raw_articles:
        clean_title = article["title"].strip().lower()
        if clean_title not in unique_map:
            unique_map[clean_title] = article

    cached_news_data = list(unique_map.values())
    last_fetch_time = current_time
    return cached_news_data


@app.get("/", tags=["Health Check"])
def root():
    return {"status": "ok", "message": "POSTFEED News Aggregator API is running"}

@app.get("/api/v1/news", response_model=NewsResponse, tags=["News Stream"])
def get_news(
    category: Optional[str] = Query(None, description="Filter by category (e.g., Technology, Sports)"),
    source: Optional[str] = Query(None, description="Filter by specific news source"),
    search: Optional[str] = Query(None, description="Search keyword in title or description")
):
    """Primary endpoint for fetching aggregated news for the Flutter client."""
    articles = aggregate_and_deduplicate()

    # Apply Category Filter
    if category and category.lower() != "all":
        articles = [a for a in articles if a["category"].lower() == category.lower()]

    # Apply Source Filter
    if source:
        articles = [a for a in articles if a["source"].lower() == source.lower()]

    # Apply Search Query Filter
    if search and search.strip():
        q = search.lower()
        articles = [a for a in articles if q in a["title"].lower() or q in a["description"].lower()]

    return {
        "status": "success",
        "total_results": len(articles),
        "data": articles
    }

@app.get("/api/v1/categories", tags=["Metadata"])
def get_categories():
    """Returns available categories for Flutter dynamic filter UI."""
    return ["All", "Technology", "Business & Finance", "Science & Health", "Sports", "Politics", "General"]