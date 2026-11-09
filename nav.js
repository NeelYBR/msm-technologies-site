/*! MSM Technologies menu (tiny, no dependencies).
 * Loaded as a classic script at the top of <head>, so the ☰ menu and its sections work the
 * instant the page is visible, long before React finishes loading. This file is the ONE owner
 * of menu state: it lives on <html> (class "menu-open", attribute data-mm="<section id>"),
 * React only renders the markup and never toggles it, so nothing can double-toggle and a
 * React re-render can't lose the state. Event delegation on document, so it works for markup
 * rendered at any time. ES5 only (old in-app browsers / WebViews). */
(function () {
  var d = document, h = d.documentElement, w = window;
  if (w.msmNav) return;
  var hoverAt = 0, hoverTimer = 0;
  var mq = w.matchMedia ? w.matchMedia('(min-width: 1100px)') : null;
  function canHover() {
    return !!(w.matchMedia && w.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1100px)').matches);
  }
  function up(el, sel) {
    for (; el && el.nodeType === 1; el = el.parentNode) {
      var m = el.matches || el.msMatchesSelector || el.webkitMatchesSelector;
      if (m && m.call(el, sel)) return el;
    }
    return null;
  }
  function isOpen() { return /(^|\s)menu-open(\s|$)/.test(h.className); }
  function section() { return h.getAttribute('data-mm') || ''; }
  function sync() {
    var open = isOpen(), sec = section(), i, b, t = d.querySelectorAll('.nav-toggle');
    for (i = 0; i < t.length; i++) {
      // attributes only: changing text React rendered would force React to re-render the page
      t[i].setAttribute('aria-expanded', open ? 'true' : 'false');
      t[i].setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    }
    b = d.querySelectorAll('.mm-trigger[data-mm]');
    for (i = 0; i < b.length; i++) b[i].setAttribute('aria-expanded', b[i].getAttribute('data-mm') === sec ? 'true' : 'false');
  }
  function setOpen(o) {
    if (o) {
      // the panel fills the screen below the header, wherever the header is (banner shown or scrolled away)
      var hd = d.querySelector('.mm-header');
      if (hd && h.style && h.style.setProperty) h.style.setProperty('--nav-top', Math.max(0, Math.round(hd.getBoundingClientRect().bottom)) + 'px');
      if (!isOpen()) h.className = (h.className ? h.className + ' ' : '') + 'menu-open';
    }
    else h.className = h.className.replace(/(^|\s)menu-open(?=\s|$)/g, '').replace(/^\s+/, '');
  }
  function setSection(id) {
    if (id) h.setAttribute('data-mm', id); else h.removeAttribute('data-mm');
  }
  function close() { setOpen(false); setSection(''); sync(); }
  w.msmNav = { close: close, sync: sync };

  d.addEventListener('click', function (e) {
    var el = e.target, tog = up(el, '.nav-toggle');
    if (tog) {
      e.preventDefault(); // it is also a link to the sitemap, for browsers with JavaScript off
      var o = !isOpen();
      setSection(''); setOpen(o); sync();
      return;
    }
    var trig = up(el, '.mm-trigger[data-mm]');
    if (trig) {
      e.preventDefault();
      var id = trig.getAttribute('data-mm');
      // a mouse click straight after hover-open should not snap the panel shut
      if (section() === id && canHover() && Date.now() - hoverAt < 600) return;
      setSection(section() === id ? '' : id); sync();
      return;
    }
    if (!isOpen() && !section()) return;
    if (up(el, '#site-nav a, .mm-header a') || !up(el, '.mm-header')) close();
  }, false);

  d.addEventListener('keydown', function (e) {
    var k = e.key || e.keyCode;
    if ((k === ' ' || k === 'Spacebar' || k === 32) && up(e.target, 'a.nav-toggle')) {
      e.preventDefault(); e.target.click(); return;
    }
    if (k !== 'Escape' && k !== 'Esc' && k !== 27) return;
    var sec = section();
    if (sec) {
      setSection(''); sync();
      if (!isOpen()) { var b = d.getElementById('mm-btn-' + sec); if (b) b.focus(); }
    } else if (isOpen()) {
      close();
      var t = d.querySelector('.nav-toggle'); if (t) t.focus();
    }
  }, false);

  // Desktop: hover opens a mega panel (mouse only)
  d.addEventListener('mouseover', function (e) {
    if (!canHover()) return;
    var li = up(e.target, '.mm-item');
    var trig = li && li.querySelector('.mm-trigger[data-mm]');
    if (!trig) return;
    clearTimeout(hoverTimer);
    var id = trig.getAttribute('data-mm');
    if (section() !== id) { hoverAt = Date.now(); setSection(id); sync(); }
  }, false);
  d.addEventListener('mouseout', function (e) {
    if (!canHover() || !section()) return;
    var from = up(e.target, '.mm-item'), to = up(e.relatedTarget, '.mm-item');
    if (!from || from === to) return;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(function () { setSection(''); sync(); }, 180);
  }, false);

  if (mq) {
    if (mq.addEventListener) mq.addEventListener('change', close);
    else if (mq.addListener) mq.addListener(close);
  }
  w.addEventListener('popstate', close, false);
  // Back/forward cache: never come back to a page with the menu stuck open
  w.addEventListener('pageshow', function (e) { if (e.persisted) close(); }, false);
})();
