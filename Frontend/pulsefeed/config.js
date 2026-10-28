/* ===================== PULSE FEED settings =====================
   Connected to POSTFEED News Aggregator API:
   https://news-aggregator-backend-n8jb.onrender.com
*/
const PULSEFEED_CONFIG = {
  API_BASE_URL: "https://news-aggregator-backend-n8jb.onrender.com",
  ENDPOINTS: {
    home: "/api/v1/news",
    news: "/api/v1/news",
    search: "/api/v1/news",
    categories: "/api/v1/categories"
  },
  HEADERS: {},                       // extra request headers if needed
  TIMEOUT_MS: 15000,                 // 15s timeout to allow for Render spin-up
  PLACEHOLDER_IMAGES: true,          // true: show fallback photo when an article has no image
  VINTAGE_PHOTOS: false,             // false: vibrant full-color images; true: b&w newspaper look
  RELIABILITY_LABEL: "Reliability Score",
  RELIABILITY_NOTE: "Verified source reliability score",
  LINKS: { signIn: "index.html", subscribe: "#" }
};
