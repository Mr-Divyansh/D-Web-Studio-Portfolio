(function(){
  "use strict";
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav scroll state ---------- */
  var nav = document.getElementById('siteNav');
  function onScroll(){
    if (window.scrollY > 30) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile drawer ---------- */
  var hamburger = document.getElementById('hamburger');
  var drawer = document.getElementById('mobileDrawer');
  var backdrop = document.getElementById('mobileBackdrop');
  var closeBtn = document.getElementById('drawerClose');
  function openDrawer(){
    drawer.classList.add('open'); backdrop.classList.add('open');
    hamburger.classList.add('active'); hamburger.setAttribute('aria-expanded','true');
    drawer.setAttribute('aria-hidden','false'); document.body.classList.add('menu-open');
  }
  function closeDrawer(){
    drawer.classList.remove('open'); backdrop.classList.remove('open');
    hamburger.classList.remove('active'); hamburger.setAttribute('aria-expanded','false');
    drawer.setAttribute('aria-hidden','true'); document.body.classList.remove('menu-open');
  }
  hamburger.addEventListener('click', function(){ drawer.classList.contains('open') ? closeDrawer() : openDrawer(); });
  closeBtn.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeDrawer(); });
  drawer.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeDrawer); });

  /* ---------- reveal-on-scroll (with safety fallback) ---------- */
  if ('IntersectionObserver' in window){
    var revealObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){ entry.target.classList.add('in'); revealObserver.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.reveal').forEach(function(el){ revealObserver.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
  }
  // hero content should never wait on scroll to appear
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      document.querySelectorAll('.hero .reveal').forEach(function(el){ el.classList.add('in'); });
    });
  });

  /* ---------- code-window line-by-line reveal ---------- */
  var typeTarget = document.getElementById('typeTarget');
  if (typeTarget){
    var lines = [
      '<span class="c-kw">const</span> developer <span class="c-punc">=</span> {',
      '&nbsp;&nbsp;<span class="c-key">name</span><span class="c-punc">:</span> <span class="c-str">\'Divyansh\'</span>,',
      '&nbsp;&nbsp;<span class="c-key">role</span><span class="c-punc">:</span> <span class="c-str">\'Frontend Developer\'</span>,',
      '&nbsp;&nbsp;<span class="c-key">from</span><span class="c-punc">:</span> <span class="c-str">\'Himachal Pradesh, India\'</span>,',
      '&nbsp;&nbsp;<span class="c-key">passion</span><span class="c-punc">:</span> [<span class="c-str">\'Web Dev\'</span>, <span class="c-str">\'Minecraft Cinematics\'</span>],',
      '&nbsp;&nbsp;<span class="c-key">status</span><span class="c-punc">:</span> <span class="c-str">\'Available for work ✓\'</span>',
      '};'
    ];
    lines.forEach(function(html, i){
      var row = document.createElement('div');
      row.innerHTML = '<span class="ln">' + (i+1) + '</span>' + html;
      row.style.opacity = '0';
      row.style.transform = 'translateY(6px)';
      row.style.transition = 'opacity .4s ease, transform .4s ease';
      typeTarget.appendChild(row);
    });
    var cursor = document.createElement('span');
    cursor.className = 'code-cursor';
    typeTarget.appendChild(cursor);
    var rows = typeTarget.querySelectorAll('div');
    function playLines(){
      rows.forEach(function(row, i){
        setTimeout(function(){ row.style.opacity = '1'; row.style.transform = 'none'; }, reduceMotion ? 0 : i * 130 + 150);
      });
    }
    requestAnimationFrame(function(){ requestAnimationFrame(playLines); });
  }

  /* ---------- subtle tilt on the hero mockup card ---------- */
  var card = document.getElementById('mockupCard');
  if (card && !reduceMotion && window.matchMedia('(pointer:fine)').matches){
    var wrap = card.parentElement;
    wrap.addEventListener('mousemove', function(e){
      var r = wrap.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = 'perspective(1400px) rotateY(' + (-8 + px * -6) + 'deg) rotateX(' + (3 + py * -6) + 'deg)';
    });
    wrap.addEventListener('mouseleave', function(){
      card.style.transform = 'perspective(1400px) rotateY(-8deg) rotateX(3deg)';
    });
  }
})();
