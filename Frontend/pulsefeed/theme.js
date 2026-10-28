/* Dark / light mode: remembers the choice, otherwise follows the device setting.
   Load this file in <head> so the right theme is set before the page paints. */
(function(){
  var SUN = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>';
  var MOON = '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>';
  var saved = null;
  try{ saved = localStorage.getItem('pf_theme'); }catch(e){}
  var theme = saved || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);

  function paint(){
    var t = document.documentElement.getAttribute('data-theme');
    var btn = document.getElementById('themeToggle');
    if(!btn) return;
    btn.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (t === 'dark' ? SUN : MOON) + '</svg>';
    btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }

  document.addEventListener('DOMContentLoaded', function(){
    paint();
    var btn = document.getElementById('themeToggle');
    if(!btn) return;
    btn.addEventListener('click', function(){
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try{ localStorage.setItem('pf_theme', next); }catch(e){}
      paint();
    });
  });
})();
