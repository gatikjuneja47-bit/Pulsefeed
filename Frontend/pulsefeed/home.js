/* ================= PULSE FEED main page =================
   Connected to POSTFEED News Aggregator API:
   https://news-aggregator-backend-n8jb.onrender.com
*/
const $ = id => document.getElementById(id);
const CFG = PULSEFEED_CONFIG;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const ICONS = {
  general:'<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  world:'<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  technology:'<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>',
  business:'<path d="M3 3v18h18"/><path d="M8 17v-5M13 17V8M18 17v-9"/>',
  culture:'<circle cx="13.5" cy="6.5" r=".6"/><circle cx="17.5" cy="10.5" r=".6"/><circle cx="8.5" cy="7.5" r=".6"/><circle cx="6.5" cy="12.5" r=".6"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1a1.6 1.6 0 0 1 1.7-1.7H16c3 0 5.5-2.5 5.5-5.5C21.5 6 17.5 2 12 2z"/>',
  science:'<circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2-2 0-7.4-4.5-11.9C11.2 3.8 5.8 1.8 3.8 3.8s0 7.4 4.5 11.9c4.5 4.5 9.9 6.5 11.9 4.5Z"/><path d="M15.7 15.7c4.5-4.5 6.5-9.9 4.5-11.9s-7.4 0-11.9 4.5c-4.5 4.5-6.5 9.9-4.5 11.9s7.4 0 11.9-4.5Z"/>',
  health:'<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/><path d="M3.2 12h6.3l.5-1 2 4.5 2-7 1.5 3.5h5.3"/>',
  sports:'<circle cx="12" cy="12" r="10"/><path d="M5 5c4 3 10 3 14 0M5 19c4-3 10-3 14 0M12 2v20"/>',
  politics:'<path d="M3 21h18M5 21V10l7-5 7 5v11M9 21V14h6v7M10 10h4"/>',
  opinion:'<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  bookmark:'<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  close:'<path d="M18 6 6 18M6 6l12 12"/>'
};

const svg = k => {
  const icon = ICONS[k] || ICONS[String(k).toLowerCase()] || ICONS.general || '';
  return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + icon + '</svg>';
};

let CATEGORIES = [
  {id:'General', name:'General', icon:'general'},
  {id:'Technology', name:'Technology', icon:'technology'},
  {id:'Business & Finance', name:'Business & Finance', icon:'business'},
  {id:'Science & Health', name:'Science & Health', icon:'science'},
  {id:'Sports', name:'Sports', icon:'sports'},
  {id:'Politics', name:'Politics', icon:'politics'}
];
let NAV = ['home', 'General', 'Technology', 'Business & Finance', 'Science & Health', 'Sports', 'Politics'];

const label = id => {
  if(!id || id === 'home') return 'Home';
  const found = CATEGORIES.find(c => c.id.toLowerCase() === String(id).toLowerCase());
  return found ? found.name : id;
};

/* Fallback placeholder photo when article has no remote image or fails to load */
function placeholderImage(seed){
  return 'https://picsum.photos/seed/pulsefeed-' + encodeURIComponent(seed) + '/640/420';
}

/* ---------- turn any backend article into the shape this page uses ---------- */
function ago(t){
  if(!t) return '';
  const time = new Date(t).getTime();
  if(isNaN(time)) return '';
  const m = Math.max(1, Math.round((Date.now() - time) / 6e4));
  if(m < 60) return m + 'm ago';
  const h = Math.round(m / 60);
  return h < 24 ? h + 'h ago' : Math.round(h / 24) + 'd ago';
}

function article(raw, i){
  raw = raw || {};
  const rel = raw.reliability;
  const score = (rel && typeof rel === 'object') ? rel.score : (rel ?? raw.score);
  let summary = raw.summary ?? raw.description ?? raw.excerpt ?? '';
  if(summary === 'No description available.') summary = '';

  const a = {
    id: String(raw.id ?? raw._id ?? raw.slug ?? ('item-' + i)),
    category: String(raw.category ?? raw.section ?? ''),
    source: raw.source ?? '',
    title: raw.title ?? raw.headline ?? 'Untitled Story',
    summary: summary,
    image: raw.image ?? raw.image_url ?? raw.imageUrl ?? raw.urlToImage ?? '',
    url: raw.url ?? raw.link ?? '#',
    time: raw.timeAgo ?? ago(raw.publishedAt ?? raw.date ?? raw.createdAt),
    score: (score === undefined || score === null || isNaN(Number(score))) ? null : Math.max(0, Math.min(100, Number(score))),
    note: (rel && rel.note) || (raw.source ? `Source: ${raw.source} • Reliability Score` : CFG.RELIABILITY_NOTE),
    headline: raw.imageHeadline ?? raw.captionTitle,
    dek: raw.imageDek ?? raw.caption
  };
  if(!a.image && CFG.PLACEHOLDER_IMAGES) a.image = placeholderImage(a.id);
  return a;
}

const asList = d => Array.isArray(d) ? d : (d && (d.articles || d.latest || d.items || d.results || d.data)) || [];
const pick = (d, ...keys) => { for(const k of keys){ if(d && d[k] !== undefined) return d[k]; } };

/* ---------- talking to the backend ---------- */
async function getJSON(path, params){
  const base = CFG.API_BASE_URL ? CFG.API_BASE_URL.replace(/\/$/, '') : '';
  const url = new URL(base + path, location.href);
  Object.entries(params || {}).forEach(([k, v]) => {
    if(v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, v);
    }
  });
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), CFG.TIMEOUT_MS);
  try{
    const res = await fetch(url.toString(), {
      headers: Object.assign({ Accept: 'application/json' }, CFG.HEADERS),
      signal: ctl.signal
    });
    if(!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally { clearTimeout(timer); }
}

async function loadCategories(){
  if(CFG.API_BASE_URL && CFG.ENDPOINTS.categories){
    try{
      const rawCats = await getJSON(CFG.ENDPOINTS.categories);
      if(Array.isArray(rawCats) && rawCats.length){
        const dynamicCats = [];
        rawCats.forEach(c => {
          if(c && c.toLowerCase() !== 'all'){
            const low = c.toLowerCase();
            const iconKey = low.includes('tech') ? 'technology'
              : (low.includes('business') || low.includes('finance')) ? 'business'
              : (low.includes('health') || low.includes('science')) ? 'science'
              : low.includes('sport') ? 'sports'
              : low.includes('politic') ? 'politics'
              : 'general';
            dynamicCats.push({ id: c, name: c, icon: iconKey });
          }
        });
        if(dynamicCats.length){
          CATEGORIES = dynamicCats;
          NAV = ['home', ...dynamicCats.map(c => c.id)];
        }
      }
    } catch(e){
      console.warn('Could not load dynamic categories, using defaults.', e);
    }
  }
}

async function loadHome(){
  if(CFG.API_BASE_URL){
    try{
      const data = await getJSON(CFG.ENDPOINTS.news || CFG.ENDPOINTS.home);
      const list = asList(data);
      if(list && list.length){
        const items = [...list];
        // Select an article with an image for top story
        const topIdx = items.findIndex(it => it && (it.image_url || it.image || it.imageUrl));
        const topStory = topIdx >= 0 ? items.splice(topIdx, 1)[0] : items.shift();

        // 8 articles for latest, 4 for briefing, 5 top-reliable for most read
        const latest = items.slice(0, 8);
        const briefing = items.slice(8, 12);
        const remaining = items.slice(12);
        const pool = remaining.length >= 5 ? remaining : items;
        const mostRead = [...pool].sort((a, b) => (b.reliability || 0) - (a.reliability || 0)).slice(0, 5);

        return { topStory, latest, briefing, mostRead };
      }
    } catch(e){
      console.warn('Backend not reachable, showing sample news.', e);
    }
  }
  return SAMPLE_HOME;
}

async function loadList(params){
  if(CFG.API_BASE_URL){
    try{
      const query = {};
      if(params.category && params.category !== 'home' && params.category !== 'All'){
        query.category = params.category;
      }
      if(params.search || params.q){
        query.search = params.search || params.q;
      }
      if(params.source){
        query.source = params.source;
      }
      const data = await getJSON(CFG.ENDPOINTS.news, query);
      return asList(data);
    } catch(e){
      console.warn('Backend not reachable, showing sample news.', e);
    }
  }
  const q = (params.search || params.q || '').toLowerCase();
  return (SAMPLE_HOME.news || []).filter(n => {
    if(q) return (n.title + ' ' + (n.summary || n.description || '')).toLowerCase().includes(q);
    if(params.category && params.category !== 'home' && params.category !== 'All') {
      return String(n.category).toLowerCase() === params.category.toLowerCase();
    }
    return true;
  });
}

/* ---------- bookmarks and the saved-stories drawer ---------- */
const reg = new Map();
let marks = {};

function bmBtn(a){
  reg.set(String(a.id), a);
  const on = !!marks[a.id];
  return `<button class="bm" type="button" data-id="${esc(a.id)}" aria-pressed="${on}" aria-label="${on ? 'Remove bookmark' : 'Bookmark this story'}" title="Bookmark">${svg('bookmark')}</button>`;
}

function loadMarks(){
  try{ marks = JSON.parse(localStorage.getItem('pf_bookmarks')) || {}; }catch(e){ marks = {}; }
  syncMarks();
}

function toggleMark(id){
  const a = reg.get(id) || marks[id];
  if(!a) return;
  if(marks[id]) delete marks[id];
  else marks[id] = { id: a.id, category: a.category, source: a.source || '', title: a.title, summary: a.summary, image: a.image, url: a.url, savedAt: Date.now() };
  try{ localStorage.setItem('pf_bookmarks', JSON.stringify(marks)); }catch(e){}
  syncMarks();
}

function syncMarks(){
  document.querySelectorAll('.bm').forEach(b => {
    const on = !!marks[b.dataset.id];
    b.setAttribute('aria-pressed', on);
    b.setAttribute('aria-label', on ? 'Remove bookmark' : 'Bookmark this story');
  });
  const n = Object.keys(marks).length;
  $('markCount').textContent = n;
  $('markCount').hidden = n === 0;
  $('savedCount').textContent = n;
  renderSaved();
}

function renderSaved(){
  const items = Object.values(marks).sort((a, b) => b.savedAt - a.savedAt);
  $('savedList').innerHTML = items.length ? items.map(a => {
    const sourceText = a.source ? ` • ${esc(a.source)}` : '';
    return `
    <article class="saved">
      <a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer" tabindex="-1">${img(a, '')}</a>
      <div>
        ${a.category ? `<span class="cat-label">${esc(label(a.category))}${sourceText}</span>` : ''}
        <h3><a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.title)}</a></h3>
        <span class="ago">Saved ${esc(ago(a.savedAt))}</span>
      </div>
      <button class="bm" type="button" data-id="${esc(a.id)}" aria-pressed="true" aria-label="Remove bookmark" title="Remove bookmark">${svg('bookmark')}</button>
    </article>`;
  }).join('') : '<p class="empty">No saved stories yet. Tap the bookmark on any story to keep it here.</p>';
}

function setDrawer(open){
  document.body.classList.toggle('drawer-open', open);
  $('drawerToggle').setAttribute('aria-expanded', open);
  (open ? $('drawerClose') : $('drawerToggle')).focus();
}

function bindBookmarks(){
  $('drawerIcon').innerHTML = svg('menu');
  $('drawerClose').innerHTML = svg('close');
  $('drawerToggle').addEventListener('click', () => setDrawer(!document.body.classList.contains('drawer-open')));
  $('drawerClose').addEventListener('click', () => setDrawer(false));
  $('backdrop').addEventListener('click', () => setDrawer(false));
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && document.body.classList.contains('drawer-open')) setDrawer(false); });
  document.addEventListener('click', e => { const b = e.target.closest('.bm'); if(b){ e.preventDefault(); toggleMark(b.dataset.id); } });
}

/* ---------- drawing the page ---------- */
const img = (a, cls) => `<img class="photo ${cls}" src="${esc(a.image || placeholderImage(a.id))}" alt="${esc(a.title)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${placeholderImage(a.id)}'">`;

function renderHero(t){
  if(!t) return;
  const sourceBadge = t.source ? ` • ${esc(t.source)}` : '';
  const headline = t.headline || t.title;
  const dek = t.dek || t.summary || '';
  $('hero').innerHTML = `
    <div class="top-panel">
      <span class="kicker">Top story${sourceBadge}</span>
      <h2><a href="${esc(t.url)}" target="_blank" rel="noopener noreferrer">${esc(t.title)}</a></h2>
      <p>${esc(t.summary)}</p>
      <div class="panel-actions">
        <a class="readmore" href="${esc(t.url)}" target="_blank" rel="noopener noreferrer">Read story ${svg('arrow')}</a>
        ${bmBtn(t)}
      </div>
    </div>
    <figure class="top-photo">
      <a href="${esc(t.url)}" target="_blank" rel="noopener noreferrer">${img(t, '')}</a>
      <figcaption>
        <h3><a href="${esc(t.url)}" target="_blank" rel="noopener noreferrer">${esc(headline)}</a></h3>
        <p>${esc(dek)}</p>
      </figcaption>
    </figure>`;
}

function renderLatest(items, heading){
  $('latestH').textContent = heading;
  $('latest').innerHTML = items.length ? items.map(a => {
    const sourceText = a.source ? ` • ${esc(a.source)}` : '';
    return `
    <article class="art">
      <a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer" tabindex="-1">${img(a, 'thumb')}</a>
      <div>
        <div class="art-head"><span class="cat-label">${esc(label(a.category))}${sourceText}</span>${bmBtn(a)}</div>
        <h3><a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.title)}</a></h3>
        <p>${esc(a.summary)}</p>
      </div>
      ${a.score === null ? '' : `<div class="rel"><span class="rel-label">${esc(CFG.RELIABILITY_LABEL)}</span>
        <div class="rel-row"><div class="bar"><i style="width:${a.score}%"></i></div><b>${a.score}/100</b></div>
        <small>${esc(a.note)}</small></div>`}
    </article>`;
  }).join('') : '<p class="empty">No articles found.</p>';
}

function renderBriefing(items){
  $('briefing').innerHTML = items.map(a => {
    const sourceText = a.source ? ` • ${esc(a.source)}` : '';
    return `
    <article class="brief">
      <a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer" tabindex="-1">${img(a, '')}</a>
      <div><div class="art-head"><span class="cat-label">${esc(label(a.category))}${sourceText}</span>${bmBtn(a)}</div>
        <h3><a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.title)}</a></h3>
        <span class="ago">${esc(a.time || a.source || 'Recent')}</span></div>
    </article>`;
  }).join('');
}

function renderMostRead(items){
  $('mostRead').innerHTML = items.map((a, i) =>
    `<li><a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer"><b>${i + 1}</b><span>${esc(a.title)}</span>${svg('chevron')}</a>${bmBtn(a)}</li>`
  ).join('');
}

function renderCats(){
  $('catList').innerHTML = CATEGORIES.map(c =>
    `<li><button type="button" data-cat="${esc(c.id)}" aria-current="false">${svg(c.icon || c.id)}${esc(c.name)}${svg('chevron')}</button></li>`
  ).join('');
}

function renderNav(){
  $('mainNav').innerHTML = NAV.map(id =>
    `<a href="#" data-nav="${esc(id)}" aria-current="${id === 'home' ? 'page' : 'false'}">${id === 'home' ? 'Home' : esc(label(id))}</a>`
  ).join('');
}

function mark(id){
  document.querySelectorAll('#mainNav [data-nav]').forEach(a => a.setAttribute('aria-current', a.dataset.nav === id ? 'page' : 'false'));
  document.querySelectorAll('#catList [data-cat]').forEach(b => b.setAttribute('aria-current', b.dataset.cat === id));
}

/* ---------- actions ---------- */
let home = null;

async function showView(id){
  mark(id);
  if(!id || id === 'home' || id === 'All'){
    if(home && home.latest) renderLatest(home.latest, 'Latest articles');
    return;
  }
  $('latest').innerHTML = '<p class="empty">Loading…</p>';
  try {
    const rawItems = await loadList({ category: id });
    const items = rawItems.map(article);
    renderLatest(items, label(id));
  } catch(e) {
    $('latest').innerHTML = '<p class="empty">Could not load articles. Please try again.</p>';
  }
}

async function doSearch(q){
  mark('');
  $('latest').innerHTML = '<p class="empty">Searching…</p>';
  try {
    const rawItems = await loadList({ search: q, q });
    const items = rawItems.map(article);
    renderLatest(items, 'Results for “' + q + '” (' + items.length + ')');
  } catch(e) {
    $('latest').innerHTML = '<p class="empty">Search failed. Please try again.</p>';
  }
}

async function init(){
  $('today').textContent = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  $('searchBtn').innerHTML = svg('search');
  document.body.classList.toggle('vintage', !!CFG.VINTAGE_PHOTOS);

  /* top links */
  $('subscribe').href = CFG.LINKS.subscribe;
  $('signIn').href = CFG.LINKS.signIn;
  let session = null;
  try{ session = JSON.parse(localStorage.getItem('pf_session')); }catch(e){}
  if(session){
    $('signIn').textContent = 'Sign out';
    $('signIn').title = 'Signed in as ' + session.name;
    $('signIn').href = '#';
    $('signIn').addEventListener('click', e => {
      e.preventDefault();
      try{ localStorage.removeItem('pf_session'); }catch(x){}
      location.reload();
    });
  }

  // Load backend categories dynamically
  await loadCategories();
  renderCats();
  renderNav();
  bindBookmarks();
  loadMarks();

  $('mainNav').addEventListener('click', e => {
    const a = e.target.closest('[data-nav]');
    if(a){ e.preventDefault(); showView(a.dataset.nav); }
  });
  $('catList').addEventListener('click', e => {
    const b = e.target.closest('[data-cat]');
    if(b) showView(b.dataset.cat);
  });
  $('searchForm').addEventListener('submit', e => {
    e.preventDefault();
    const q = $('searchInput').value.trim();
    if(q) doSearch(q);
    else showView('home');
  });
  $('searchInput').addEventListener('search', e => {
    if(!e.target.value.trim()) showView('home');
  });

  const d = await loadHome();
  home = {
    top: article(pick(d, 'topStory', 'top_story', 'featured'), 'top'),
    latest: asList(pick(d, 'latest', 'articles')).map(article),
    briefing: asList(pick(d, 'briefing')).map(article),
    mostRead: asList(pick(d, 'mostRead', 'most_read')).map(article)
  };
  renderHero(home.top);
  renderLatest(home.latest, 'Latest articles');
  renderBriefing(home.briefing);
  renderMostRead(home.mostRead);
}

init();
