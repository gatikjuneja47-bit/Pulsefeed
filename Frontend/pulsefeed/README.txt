PULSE FEED - frontend
=====================

BACKEND INTEGRATION:
  Backend URL: https://news-aggregator-backend-n8jb.onrender.com
  API Endpoints integrated:
    - GET /api/v1/news: Primary news stream, supporting:
        * category filter: ?category=Technology (or Sports, Politics, etc.)
        * keyword search: ?search=keyword
        * source filter: ?source=Jagran
    - GET /api/v1/categories: Dynamic category metadata
    - Fallback: Graceful fallback to sample-data.js if backend is cold/unreachable

HOW TO RUN
  Open the folder with a local server (for example the VS Code "Live Server" extension
  or `npx serve .` / `python3 -m http.server 8000`) and start at home.html or index.html.
  Google/Facebook login needs http://localhost or https://.

PAGES
  index.html   Login / register page (style.css, script.js, auth.js)
  home.html    Main newspaper-style page (home.css, home.js)

SETTINGS YOU EDIT
  config.js            Backend address (API_BASE_URL), endpoints, photo style.
  firebase-config.js   Firebase keys for Google login (and Facebook through Firebase)
  facebook-config.js   Facebook App ID for the direct Facebook login button

OTHER FILES
  theme.js             Dark / light mode toggle and system detection
  sample-data.js       Offline fallback news dataset
  api-sample/          Example JSON responses
