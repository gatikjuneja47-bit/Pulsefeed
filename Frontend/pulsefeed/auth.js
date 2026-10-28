/* Login, register and social login (frontend demo, data kept in localStorage).
   Replace the social buttons with Firebase Auth when you add a backend. */
const store = {
  get(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};

async function hash(text){
  if(window.crypto && crypto.subtle){
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
  }
  return btoa(text); // fallback when SubtleCrypto is unavailable
}

function show(el, text, ok){
  el.textContent = text;
  el.className = 'message ' + (ok ? 'ok' : 'error');
}

function goHome(user){
  store.set('pf_session', user);
  window.location.href = 'home.html';
}

/* Already logged in? Go straight to the main page */
if(store.get('pf_session')) window.location.href = 'home.html';

/* Register */
document.getElementById('registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const msg = document.getElementById('registerMessage');
  const name = document.getElementById('regUser').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const pass = document.getElementById('regPass').value;
  const users = store.get('pf_users') || {};
  const key = name.toLowerCase();

  if(name.length < 3) return show(msg, 'Username must be at least 3 characters.', false);
  if(pass.length < 8) return show(msg, 'Password must be at least 8 characters.', false);
  if(users[key]) return show(msg, 'This username is already taken.', false);

  users[key] = { name, email, pass: await hash(pass) };
  store.set('pf_users', users);
  e.target.reset();
  show(msg, 'Account created. Taking you to login...', true);
  setTimeout(() => {
    container.classList.remove('active');
    show(document.getElementById('loginMessage'), 'Account created. Please log in.', true);
    msg.textContent = '';
  }, 1200);
});

/* Login */
document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const msg = document.getElementById('loginMessage');
  const key = document.getElementById('loginUser').value.trim().toLowerCase();
  const pass = document.getElementById('loginPass').value;
  const user = (store.get('pf_users') || {})[key];

  if(!user || user.pass !== await hash(pass)) return show(msg, 'Username or password is incorrect.', false);
  show(msg, 'Login successful...', true);
  goHome({ name: user.name, email: user.email });
});

/* ---------- Google and Facebook login (Firebase Authentication) ---------- */
const FIREBASE_READY = window.firebase && typeof firebaseConfig !== 'undefined'
  && firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('PASTE');
if(FIREBASE_READY && !firebase.apps.length) firebase.initializeApp(firebaseConfig);

function authError(err){
  const map = {
    'auth/popup-closed-by-user': 'Login window was closed. Try again.',
    'auth/popup-blocked': 'Your browser blocked the login popup. Allow popups and try again.',
    'auth/account-exists-with-different-credential': 'An account with this email already exists with another login method.',
    'auth/unauthorized-domain': 'This domain is not allowed. Add it in Firebase > Authentication > Settings > Authorized domains.',
    'auth/operation-not-allowed': 'This login method is not enabled in the Firebase console yet.',
    'auth/operation-not-supported-in-this-environment': 'Open the site through a local server (http://localhost), not as a file.',
    'auth/network-request-failed': 'Network error. Check your internet connection.'
  };
  return map[err.code] || 'Login failed: ' + (err.message || err.code);
}

/* ---------- Facebook login (Facebook SDK for JavaScript) ---------- */
const FB_APP_ID = (typeof FACEBOOK_APP_ID !== 'undefined' && FACEBOOK_APP_ID && !FACEBOOK_APP_ID.startsWith('PASTE')) ? FACEBOOK_APP_ID : null;

if(FB_APP_ID){
  // Load the SDK as soon as the page opens, so the login popup is not blocked later
  window.fbAsyncInit = function(){
    FB.init({ appId: FB_APP_ID, cookie: true, xfbml: false, version: 'v26.0' });
  };
  const sdk = document.createElement('script');
  sdk.src = 'https://connect.facebook.net/en_US/sdk.js';
  sdk.async = true;
  document.head.appendChild(sdk);
}

function facebookLogin(msg){
  if(location.protocol === 'file:') return show(msg, 'Open the site through a local server (http://localhost), not by double-clicking the file.', false);
  if(!window.FB || !FB.login) return show(msg, 'Facebook is still loading. Wait a moment and try again.', false);
  FB.login(res => {
    if(!res.authResponse) return show(msg, 'Facebook login was cancelled.', false);
    FB.api('/me', { fields: 'name,email,picture' }, me => {
      if(!me || me.error) return show(msg, 'Could not read your Facebook profile.', false);
      show(msg, 'Login successful...', true);
      goHome({ name: me.name, email: me.email, photo: me.picture && me.picture.data && me.picture.data.url, provider: 'Facebook' });
    });
  }, { scope: 'public_profile,email' });
}

document.querySelectorAll('.social-icons a').forEach(a => {
  a.addEventListener('click', async e => {
    e.preventDefault();
    const provider = a.dataset.provider;
    const msg = a.closest('form').querySelector('.message');
    if(provider === 'Facebook' && FB_APP_ID) return facebookLogin(msg);
    if(!FIREBASE_READY) return show(msg, 'Add your Firebase keys in firebase-config.js first.', false);
    if(location.protocol === 'file:') return show(msg, 'Open the site through a local server (http://localhost), not by double-clicking the file.', false);

    const p = provider === 'Google' ? new firebase.auth.GoogleAuthProvider() : new firebase.auth.FacebookAuthProvider();
    try{
      const { user } = await firebase.auth().signInWithPopup(p);   // login and signup are the same step
      show(msg, 'Login successful...', true);
      goHome({ name: user.displayName || user.email || provider + ' User', email: user.email, photo: user.photoURL, provider });
    }catch(err){
      show(msg, authError(err), false);
    }
  });
});
