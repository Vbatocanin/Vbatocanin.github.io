document.getElementById("year").textContent = new Date().getFullYear();
var sections = document.querySelectorAll("section");
var obs = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      AudioEngine.cosmic();
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.05 });
sections.forEach(function(s) { s.classList.add("animate"); obs.observe(s); });

function startBlackout() {
  var btn = document.getElementById("theme-toggle");
  // If already in light mode, sun was clicked — go back to dark
  if (document.documentElement.classList.contains("light")) {
    document.documentElement.classList.remove("light");
    btn.classList.remove("is-light");
    return;
  }
  // Trigger blackout
  document.documentElement.classList.add("blackout");
  var textEl = document.getElementById("blackout-text");
  var torchBtn = document.getElementById("torch-btn");
  torchBtn.classList.remove("visible");
  textEl.innerHTML = "";
  var msg = "oh no... the lights went out.\n\nit\'s dangerous to go alone.\ntake this.";
  var i = 0;
  var caret = document.createElement("span");
  caret.className = "caret";
  textEl.appendChild(caret);
  function typeChar() {
    if (i < msg.length) {
      var ch = msg[i];
      textEl.insertBefore(document.createTextNode(ch === "\n" ? "" : ch), caret);
      if (ch === "\n") { var br = document.createElement("br"); textEl.insertBefore(br, caret); }
      i++;
      setTimeout(typeChar, ch === "\n" ? 300 : 38);
    } else {
      caret.style.display = "none";
      setTimeout(function() { torchBtn.classList.add("visible"); }, 400);
    }
  }
  setTimeout(typeChar, 400);
}

function lightOn() {
  document.documentElement.classList.remove("blackout");
  document.documentElement.classList.add("light");
  document.getElementById("theme-toggle").classList.add("is-light");
  document.getElementById("blackout-text").innerHTML = "";
  document.getElementById("torch-btn").classList.remove("visible");
}

// ── URL param greeting ──
(function() {
  var params = new URLSearchParams(window.location.search);
  var from = params.get("from");
  var greetings = { linkedin: "hey, came from LinkedIn?", github: "hey, fellow dev 👾", twitter: "hey, came from Twitter?", cv: "hey, checking out the CV?" };
  if (from && greetings[from]) {
    var eyebrow = document.querySelector(".hero-eyebrow");
    if (eyebrow) { eyebrow.textContent = greetings[from]; }
  }
})();

// ── Type "bash" anywhere to reveal terminal ──
(function() {
  var typed = "";
  document.addEventListener("keypress", function(e) {
    if (document.activeElement.tagName === "INPUT") return;
    typed += e.key.toLowerCase();
    if (typed.length > 4) typed = typed.slice(-4);
    if (typed === "bash") {
      var wrap = document.getElementById("terminal-wrap");
      if (!wrap.classList.contains("open")) {
        wrap.classList.add("open");
        setTimeout(function() { document.getElementById("terminal-input").focus(); }, 200);
      }
      typed = "";
    }
  });
  function closeTerminal() {
    document.getElementById("terminal-wrap").classList.remove("open");
  }
  document.getElementById("terminal-close").addEventListener("click", closeTerminal);
  document.getElementById("terminal-wrap").addEventListener("click", function(e) {
    if (e.target === this) closeTerminal();
  });
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") closeTerminal();
  });
})();

// ── Konami code → duck explosion ──
(function() {
  var seq = [38,38,40,40,37,39,37,39,66,65];
  var pos = 0;
  document.addEventListener("keydown", function(e) {
    if (e.keyCode === seq[pos]) { pos++; } else { pos = 0; }
    if (pos === seq.length) {
      pos = 0;
      launchDucks();
    }
  });
})();

// ── Penguin click counter ──
(function() {
  var count = 0;
  var sgArm = document.querySelector(".sg-arm");
  var swordguin = document.querySelector(".swordguin");
  if (!swordguin) return;
  swordguin.style.cursor = "pointer";
  swordguin.addEventListener("click", function(e) {
    e.preventDefault(); e.stopPropagation();
    count++;
    var dur = Math.max(0.2, 1.4 - count * 0.1);
    if (sgArm) sgArm.style.animationDuration = dur + "s";
    if (count >= 10) {
      count = 0;
      swordguin.style.animation = "pg-victory 0.6s ease";
      var msg = document.createElement("div");
      msg.textContent = "prisoner's dilemma: solved 🏆";
      msg.style.cssText = "position:fixed;bottom:80px;right:28px;background:var(--bg-card);border:1px solid var(--accent);font-family:var(--font-mono);font-size:11px;color:var(--accent);padding:8px 14px;border-radius:8px;z-index:9990;pointer-events:none;";
      document.body.appendChild(msg);
      setTimeout(function() { msg.remove(); swordguin.style.animation = ""; if (sgArm) sgArm.style.animationDuration = "1.4s"; }, 2500);
    }
  });
})();

// ── Barbell shakes with scroll speed ──
(function() {
  var bb = document.querySelector(".barbell-svg");
  if (!bb) return;
  var lastY = 0, lastT = 0, shakeTimer;
  window.addEventListener("scroll", function() {
    var now = Date.now();
    var speed = Math.abs(window.scrollY - lastY) / Math.max(1, now - lastT);
    lastY = window.scrollY; lastT = now;
    var intensity = Math.min(speed * 4, 8);
    bb.style.filter = intensity > 1 ? "drop-shadow(0 0 " + intensity + "px var(--accent))" : "";
    bb.style.transform = intensity > 2 ? "rotate(" + (Math.random() * intensity - intensity/2) + "deg)" : "";
    clearTimeout(shakeTimer);
    shakeTimer = setTimeout(function() { bb.style.filter = ""; bb.style.transform = ""; }, 120);
  });
})();

// ── Cursor trail (neural net style) ──
(function() {
  var active = false;
  var dots = [];
  var MAX = 18;
  window.addEventListener("keydown", function(e) {
    if (e.key === "t" && e.ctrlKey) { active = !active; if (!active) { dots.forEach(function(d){d.remove();}); dots=[]; } }
  });
  document.addEventListener("mousemove", function(e) {
    if (!active) return;
    var dot = document.createElement("div");
    dot.className = "trail-dot";
    dot.style.left = (e.clientX - 2.5) + "px";
    dot.style.top = (e.clientY - 2.5) + "px";
    dot.style.opacity = "0.7";
    document.body.appendChild(dot);
    dots.push(dot);
    if (dots.length > MAX) { dots[0].remove(); dots.shift(); }
    setTimeout(function() { dot.style.opacity = "0"; }, 300);
  });
})();

// ── Duck float on click ──
(function() {
  var duck = document.querySelector(".duck");
  if (!duck) return;
  duck.addEventListener("click", function() {
    duck.classList.remove("float");
    void duck.offsetWidth; // reflow to restart animation
    duck.classList.add("float");
  });
  duck.addEventListener("animationend", function() { duck.classList.remove("float"); });
})();


// ── Rage click detector ──
(function() {
  var clicks = [], msg = document.getElementById("rage-msg");
  document.addEventListener("click", function(e) {
    var now = Date.now();
    clicks.push(now);
    clicks = clicks.filter(function(t){ return now - t < 1200; });
    if (clicks.length >= 6) {
      msg.style.left = (e.clientX + 12) + "px";
      msg.style.top = (e.clientY - 30) + "px";
      msg.style.opacity = "1";
      clicks = [];
      setTimeout(function() { msg.style.opacity = "0"; }, 2000);
    }
  });
})();

/* ═══════════════════════════════════════════════
   NEW JS-POWERED FEATURES
   ═══════════════════════════════════════════════ */

var isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

/* ── Custom Cursor ── */
(function() {
  if (isTouch) return;
  var dot = document.getElementById('cursor-dot');
  var ring = document.getElementById('cursor-ring');
  var mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', function(e) {
    mx = e.clientX; my = e.clientY;
    dot.classList.add('visible');
    ring.classList.add('visible');
    dot.style.transform = 'translate(' + (mx - 4) + 'px,' + (my - 4) + 'px)';
  });
  function animateRing() {
    rx += (mx - 18 - rx) * 0.12;
    ry += (my - 18 - ry) * 0.12;
    ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
    requestAnimationFrame(animateRing);
  }
  animateRing();
  var hovers = document.querySelectorAll('a, .tag, .stack-item, .project-row, button, input');
  hovers.forEach(function(el) {
    el.addEventListener('mouseenter', function() { ring.classList.add('hovering'); });
    el.addEventListener('mouseleave', function() { ring.classList.remove('hovering'); });
  });
})();

/* ── Scroll Progress Bar ── */
(function() {
  var bar = document.getElementById('scroll-progress');
  window.addEventListener('scroll', function() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
  }, { passive: true });
})();

/* ── Nav: scroll spy (active link) ── */
(function() {
  var navLinks = document.querySelectorAll('#nav-links a[data-section]');
  var mobileLinks = document.querySelectorAll('#mobile-menu a');
  var sectionEls = [];
  navLinks.forEach(function(a) {
    var el = document.getElementById(a.dataset.section);
    if (el) sectionEls.push({ id: a.dataset.section, el: el });
  });

  function updateActive() {
    var scrollY = window.scrollY + Math.max(120, window.innerHeight * 0.3);
    var current = '';
    sectionEls.forEach(function(s) {
      if (s.el.offsetTop <= scrollY) current = s.id;
    });
    // Near bottom of page: activate the last section
    if ((window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 80) {
      current = sectionEls[sectionEls.length - 1].id;
    }
    navLinks.forEach(function(a) {
      a.classList.toggle('active', a.dataset.section === current);
    });
    mobileLinks.forEach(function(a) {
      var href = a.getAttribute('href');
      a.classList.toggle('active', href === '#' + current);
    });
  }
  window.addEventListener('scroll', updateActive, { passive: true });
  updateActive();
})();

/* ── Nav: hide on scroll down, show on scroll up ── */
(function() {
  var nav = document.getElementById('main-nav');
  var lastY = 0, threshold = 60;
  window.addEventListener('scroll', function() {
    var y = window.scrollY;
    if (y > lastY && y > threshold) {
      nav.classList.add('nav-hidden');
    } else {
      nav.classList.remove('nav-hidden');
    }
    lastY = y;
  }, { passive: true });
})();

/* ── Mobile hamburger ── */
function closeMobileMenu() {
  document.getElementById('mobile-menu').classList.remove('open');
  document.getElementById('nav-hamburger').classList.remove('open');
  document.body.style.overflow = '';
}
(function() {
  var btn = document.getElementById('nav-hamburger');
  var menu = document.getElementById('mobile-menu');
  btn.addEventListener('click', function() {
    var isOpen = menu.classList.toggle('open');
    btn.classList.toggle('open');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
})();

/* ── Particle Constellation ── */
(function() {
  var canvas = document.getElementById('particle-canvas');
  var ctx = canvas.getContext('2d');
  var particles = [];
  var mouseX = -1000, mouseY = -1000;
  var COUNT = 110, CONNECT = 200, MOUSE_DIST = 240;

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('mousemove', function(e) { mouseX = e.clientX; mouseY = e.clientY; });

  for (var i = 0; i < COUNT; i++) {
    particles.push({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, r: Math.random() * 2.8 + 1.2 });
  }

  function getAccent() {
    return document.documentElement.classList.contains('light') ? '93,63,211' : '139,111,232';
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var rgb = getAccent();
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + rgb + ',0.55)'; ctx.fill();
      for (var j = i + 1; j < particles.length; j++) {
        var q = particles[j];
        var dx = p.x - q.x, dy = p.y - q.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT) {
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.22 * (1 - dist / CONNECT)) + ')';
          ctx.lineWidth = 1.2; ctx.stroke();
        }
      }
      var dmx = p.x - mouseX, dmy = p.y - mouseY, mDist = Math.sqrt(dmx * dmx + dmy * dmy);
      if (mDist < MOUSE_DIST) {
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouseX, mouseY);
        ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.45 * (1 - mDist / MOUSE_DIST)) + ')';
        ctx.lineWidth = 2; ctx.stroke();
        p.x += dmx * 0.003; p.y += dmy * 0.003;
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ── 3D Tilt on Project Cards ── */
(function() {
  if (isTouch) return;
  document.querySelectorAll('.project-row').forEach(function(card) {
    card.addEventListener('mousemove', function(e) {
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left, y = e.clientY - rect.top;
      var cx = rect.width / 2, cy = rect.height / 2;
      card.style.transform = 'perspective(600px) rotateX(' + ((cy - y) / cy * 3) + 'deg) rotateY(' + ((x - cx) / cx * 4) + 'deg)';
      card.classList.add('tilting');
    });
    card.addEventListener('mouseleave', function() { card.style.transform = ''; card.classList.remove('tilting'); });
  });
})();

/* ── Magnetic Nav Links ── */
(function() {
  if (isTouch) return;
  document.querySelectorAll('.nav-links a').forEach(function(link) {
    link.addEventListener('mousemove', function(e) {
      var rect = link.getBoundingClientRect();
      var dx = (e.clientX - (rect.left + rect.width / 2)) * 0.25;
      var dy = (e.clientY - (rect.top + rect.height / 2)) * 0.25;
      link.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    });
    link.addEventListener('mouseleave', function() { link.style.transform = ''; });
  });
})();

/* ── Text Scramble on Section Headers ── */
(function() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  var labels = document.querySelectorAll('.section-label');
  labels.forEach(function(l) { l.dataset.original = l.textContent; });

  var scrObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var label = entry.target.querySelector('.section-label');
      if (!label || label.dataset.scrambled) return;
      label.dataset.scrambled = '1';
      var target = label.dataset.original, length = target.length, iterations = 0, max = length * 3;
      var interval = setInterval(function() {
        var result = '';
        for (var i = 0; i < length; i++) {
          if (target[i] === ' ') { result += ' '; continue; }
          result += (i < iterations / 3) ? target[i] : chars[Math.floor(Math.random() * chars.length)];
        }
        label.textContent = result;
        if (++iterations > max) { clearInterval(interval); label.textContent = target; }
      }, 30);
      scrObs.unobserve(entry.target);
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.section-header').forEach(function(h) { scrObs.observe(h); });
})();

/* ── Click Spark Particles ── */
(function() {
  document.addEventListener('click', function(e) {
    for (var i = 0; i < 8; i++) {
      var spark = document.createElement('div');
      spark.className = 'spark';
      spark.style.left = e.clientX + 'px'; spark.style.top = e.clientY + 'px';
      document.body.appendChild(spark);
      var angle = (Math.PI * 2 / 8) * i + (Math.random() - 0.5) * 0.5;
      var v = 30 + Math.random() * 40;
      spark.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: 'translate(' + (Math.cos(angle)*v) + 'px,' + (Math.sin(angle)*v) + 'px) scale(0)', opacity: 0 }
      ], { duration: 500 + Math.random() * 300, easing: 'cubic-bezier(0,0.5,0.5,1)' })
      .onfinish = (function(s) { return function() { s.remove(); }; })(spark);
    }
  });
})();

/* ── Stack Grid Glow Follow ── */
(function() {
  if (isTouch) return;
  document.querySelectorAll('.stack-item').forEach(function(item) {
    item.addEventListener('mousemove', function(e) {
      var rect = item.getBoundingClientRect();
      item.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
      item.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
    });
  });
})();

/* ── Stack Items: slide-down reveal on scroll into view ── */
(function() {
  var items = document.querySelectorAll('.stack-item');
  items.forEach(function(el) { el.classList.add('stack-hidden'); });
  var stackObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var allItems = entry.target.querySelectorAll('.stack-item');
      allItems.forEach(function(el, i) {
        setTimeout(function() { el.classList.add('stack-visible'); }, i * 55);
      });
      stackObs.unobserve(entry.target);
    });
  }, { threshold: 0.1 });
  var stackGrid = document.querySelector('.stack-grid');
  if (stackGrid) stackObs.observe(stackGrid);
})();

/* ── Staggered Tag Reveals ── */
(function() {
  var tagObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var tags = entry.target.querySelectorAll('.tag, .tech-pill');
      tags.forEach(function(tag, i) {
        tag.style.opacity = '0'; tag.style.transform = 'translateY(8px)';
        setTimeout(function() {
          tag.style.transition = 'opacity 0.4s, transform 0.4s';
          tag.style.opacity = '1'; tag.style.transform = 'translateY(0)';
        }, i * 60);
      });
      if (entry.target.classList.contains('hero-tags')) AudioEngine.chime();
      tagObs.unobserve(entry.target);
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.hero-tags, .project-tech').forEach(function(el) { tagObs.observe(el); });
})();

/* ── Mobile tag tap-to-reveal panel ── */
(function() {
  if (!isTouch) return;
  var panel = document.getElementById('tag-def-panel');
  if (!panel) return;
  var activeTag = null;

  function closePanel() {
    panel.classList.remove('open');
    if (activeTag) { activeTag.classList.remove('tag-active'); activeTag = null; }
  }

  document.querySelectorAll('.tag[data-def]').forEach(function(tag) {
    tag.addEventListener('click', function(e) {
      e.stopPropagation();
      if (activeTag === tag) { closePanel(); return; }
      if (activeTag) activeTag.classList.remove('tag-active');
      activeTag = tag;
      tag.classList.add('tag-active');
      panel.textContent = tag.getAttribute('data-def');
      panel.classList.add('open');
    });
  });

  document.addEventListener('click', function(e) {
    if (activeTag && !e.target.closest('.tag[data-def]')) closePanel();
  });
})();

/* ── Hero Parallax ── */
(function() {
  if (isTouch) return;
  var name = document.querySelector('.hero-name');
  var desc = document.querySelector('.hero-desc');
  window.addEventListener('scroll', function() {
    var y = window.scrollY;
    if (y < 800) {
      name.style.transform = 'translateY(' + (y * 0.08) + 'px)';
      desc.style.transform = 'translateY(' + (y * 0.04) + 'px)';
    }
  }, { passive: true });
})();

/* ── Section Counter: counts up years / items when scrolled into view ── */
(function() {
  var counters = document.querySelectorAll('.section-counter');
  var cObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var target = parseInt(el.dataset.target, 10);
      var current = 0, step = Math.ceil(target / 30);
      var interval = setInterval(function() {
        current += step;
        if (current >= target) { current = target; clearInterval(interval); }
        el.textContent = el.dataset.prefix + current + el.dataset.suffix;
      }, 30);
      cObs.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(function(c) { cObs.observe(c); });
})();

/* ── Exp rows: draw-in from left on scroll ── */
(function() {
  var expObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      entry.target.style.transition = 'opacity 0.5s, transform 0.5s';
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateX(0)';
      expObs.unobserve(entry.target);
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.exp-row').forEach(function(row, i) {
    row.style.opacity = '0';
    row.style.transform = 'translateX(-20px)';
    row.style.transitionDelay = (i * 0.08) + 's';
    expObs.observe(row);
  });
})();

/* ── Contact links: slide in from right ── */
(function() {
  var cObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var links = entry.target.querySelectorAll('.contact-link');
      links.forEach(function(link, i) {
        setTimeout(function() {
          link.style.transition = 'opacity 0.4s, transform 0.4s';
          link.style.opacity = '1';
          link.style.transform = 'translateX(0)';
        }, i * 80);
      });
      cObs.unobserve(entry.target);
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.contact-links').forEach(function(el) {
    el.querySelectorAll('.contact-link').forEach(function(link) {
      link.style.opacity = '0';
      link.style.transform = 'translateX(20px)';
    });
    cObs.observe(el);
  });
})();

// ── Snake game in maze ──
var snakeGame = null;
(function() {
  var mazeEl = document.querySelector(".maze-gen");
  if (!mazeEl) return;
  mazeEl.style.cursor = "pointer";
  mazeEl.title = "click to play!";
  mazeEl.addEventListener("click", function(e) { e.preventDefault(); e.stopPropagation(); openSnake(); });
})();

function openSnake() {
  var modal = document.getElementById("snake-modal");
  modal.classList.add("open");
  var canvas = document.getElementById("snake-canvas");
  var ctx = canvas.getContext("2d");
  var CELL = isTouch ? 22 : 15, COLS = 10, ROWS = 10;
  canvas.width = CELL * COLS; canvas.height = CELL * ROWS;
  var snake = [{x:5,y:5}];
  var dir = {x:1,y:0}, nextDir = {x:1,y:0};
  var food = {x:2,y:2};
  var score = 0, running = true;
  function placeFood() { food = {x:Math.floor(Math.random()*COLS), y:Math.floor(Math.random()*ROWS)}; }
  function draw() {
    var bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#1A1A18";
    var acc = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#8B6FE8";
    ctx.fillStyle = bg; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = acc;
    snake.forEach(function(s) { ctx.fillRect(s.x*CELL+1, s.y*CELL+1, CELL-2, CELL-2); });
    ctx.fillStyle = "#f0a";
    ctx.beginPath(); ctx.arc(food.x*CELL+CELL/2, food.y*CELL+CELL/2, CELL/2-2, 0, Math.PI*2); ctx.fill();
  }
  function step() {
    if (!running) return;
    dir = nextDir;
    var head = {x: (snake[0].x+dir.x+COLS)%COLS, y: (snake[0].y+dir.y+ROWS)%ROWS};
    if (snake.some(function(s){return s.x===head.x&&s.y===head.y;})) { running=false; ctx.fillStyle="rgba(0,0,0,0.6)"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle="#fff"; ctx.font="14px monospace"; ctx.textAlign="center"; ctx.fillText("game over",canvas.width/2,canvas.height/2); return; }
    snake.unshift(head);
    if (head.x===food.x && head.y===food.y) { score++; document.getElementById("snake-score").textContent="score: "+score; placeFood(); } else { snake.pop(); }
    draw();
    setTimeout(step, 130);
  }
  document.addEventListener("keydown", snakeKey);
  function snakeKey(e) {
    var map = {ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0}};
    if (map[e.key] && !(map[e.key].x===-dir.x&&map[e.key].y===-dir.y)) { nextDir=map[e.key]; e.preventDefault(); }
  }

  // D-pad buttons
  function snakeMove(dx, dy) {
    var m = {x:dx, y:dy};
    if (!(m.x===-dir.x && m.y===-dir.y)) nextDir = m;
  }
  var dpadMap = { 'dpad-up':{x:0,y:-1}, 'dpad-down':{x:0,y:1}, 'dpad-left':{x:-1,y:0}, 'dpad-right':{x:1,y:0} };
  Object.keys(dpadMap).forEach(function(id) {
    var btn = document.getElementById(id);
    if (!btn) return;
    function onPress(e) { e.preventDefault(); btn.classList.add('pressed'); var m = dpadMap[id]; snakeMove(m.x, m.y); }
    function onRelease() { btn.classList.remove('pressed'); }
    btn.addEventListener('touchstart', onPress, { passive: false });
    btn.addEventListener('touchend', onRelease);
    btn.addEventListener('mousedown', onPress);
    btn.addEventListener('mouseup', onRelease);
  });

  // Swipe on canvas
  var touchStartX, touchStartY;
  function onCanvasTouchStart(e) { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; e.preventDefault(); }
  function onCanvasTouchEnd(e) {
    if (touchStartX === undefined) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
    if (Math.abs(dx) > Math.abs(dy)) { snakeMove(dx > 0 ? 1 : -1, 0); }
    else { snakeMove(0, dy > 0 ? 1 : -1); }
    touchStartX = undefined;
    e.preventDefault();
  }
  canvas.addEventListener('touchstart', onCanvasTouchStart, { passive: false });
  canvas.addEventListener('touchend', onCanvasTouchEnd, { passive: false });

  snakeGame = function() {
    running = false;
    document.removeEventListener("keydown", snakeKey);
    canvas.removeEventListener('touchstart', onCanvasTouchStart);
    canvas.removeEventListener('touchend', onCanvasTouchEnd);
  };
  score=0; document.getElementById("snake-score").textContent="score: 0";
  placeFood(); draw(); setTimeout(step, 200);
}

function closeSnake() {
  if (snakeGame) snakeGame();
  document.getElementById("snake-modal").classList.remove("open");
}

// ── Terminal ──
(function() {
  var input = document.getElementById("terminal-input");
  var output = document.getElementById("terminal-output");
  if (!input) return;
  var gitLog = [
    "\x1b commit 4a7f3b2  feat: add PhD to credentials",
    "\x1b commit 9c1e8a0  fix: remove 3 AM coffee dependency (reverted)",
    "\x1b commit 2d5b7f1  feat: ship Spider Gym v2.9.3",
    "\x1b commit 8e4c2a9  chore: survive another sprint",
    "\x1b commit 1b3d6e8  feat: deploy to Schneider Electric production",
    "\x1b commit f7a2c41  fix: convince rubber duck it was not my fault",
    "\x1b commit 3c8e5b0  docs: update CV (again)",
  ].join("\n");
  var commands = {
    "help": "available commands:\n  help         show this\n  ls           list files\n  git log      commit history\n  whoami       who dis\n  sudo hire vladimir   make the smart choice\n  cat duck.txt         important document\n  cd secrets/          (you won't get far)\n  rm -rf /             nice try\n  palette      open command palette  (\u2318K / Ctrl+K)",
    "ls": "index.html  favicon.svg  README.md  duck.txt  secrets/ (permission denied)",
    "whoami": "vladimir batocanin — software engineer, phd candidate, duck enthusiast",
    "git log": gitLog,
    "cat duck.txt": "🦆🦆🦆🦆🦆🦆🦆🦆\n\nit is known.",
    "sudo hire vladimir": "\n[sudo] password for recruiter: \n\nAccess granted. \nRedirecting you to vlad.batocanin@gmail.com...\n\nSmart move.",
    "rm -rf /": "nice try. also your OS called, it said no.",
    "cd secrets/": "passwd: Authentication failure\nAuthentication failure\nAuthentication failure\n\nbash: cd: secrets/: nice try though\n\n(the duck knows what's in there. the duck isn't talking.)",
    "cat secrets/": "bash: cat: secrets/: Is a directory. a very private one.",
    "ls secrets/": "ls: cannot access 'secrets/': you're not ready.",
    "cd secrets": "passwd: Authentication failure\nAuthentication failure\nAuthentication failure\n\nbash: cd: secrets/: nice try though\n\n(the duck knows what's in there. the duck isn't talking.)",
    "pwd": "/home/vbatocanin/portfolio",
    "clear": "__CLEAR__",
    "exit": "__EXIT__",
    "palette": "__PALETTE__",
    "cmd": "__PALETTE__",
    "date": new Date().toUTCString(),
  };
  input.addEventListener("keydown", function(e) {
    if (e.key !== "Enter") return;
    var cmd = input.value.trim().toLowerCase();
    input.value = "";
    if (!cmd) return;
    var result = commands[cmd];
    if (!result) {
      var fuzzy = Object.keys(commands).find(function(k){ return k.includes(cmd) || cmd.includes(k.split(" ")[0]); });
      result = fuzzy ? commands[fuzzy] : "command not found: " + cmd + "\ntry: help";
    }
    if (result === "__CLEAR__") { output.textContent = ""; return; }
    if (result === "__EXIT__") { document.getElementById("terminal-wrap").classList.remove("open"); return; }
    if (result === "__PALETTE__") { document.getElementById("terminal-wrap").classList.remove("open"); if (typeof openCmdPalette === "function") setTimeout(openCmdPalette, 150); return; }
    if (cmd === "sudo hire vladimir") {
      setTimeout(function(){ window.location.href = "mailto:vlad.batocanin@gmail.com"; }, 1800);
    }
    output.textContent = "> " + cmd + "\n" + result;
    output.scrollIntoView({behavior:"smooth", block:"nearest"});
  });
})();

/* ═══════════════════════════════════════════════
   AUDIO ENGINE
   Uses Web Audio API — no external files needed.
   AudioContext is created on first user gesture.
   ═══════════════════════════════════════════════ */
var AudioEngine = (function() {
  var ctx = null;
  var muted = false;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, freqEnd, dur, vol, type) {
    if (muted) return;
    try {
      var c = getCtx();
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, c.currentTime);
      if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, c.currentTime + dur);
      gain.gain.setValueAtTime(vol, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + dur + 0.01);
    } catch (e) {}
  }

  return {
    click:   function() { tone(700, 500, 0.05, 0.06, 'sine'); },
    tick:    function() { tone(1100, 900, 0.022, 0.035, 'square'); },
    blackout:function() {
      tone(280, 70, 0.45, 0.09, 'sine');
      setTimeout(function() { tone(90, 35, 0.5, 0.05, 'sine'); }, 260);
    },
    lightOn: function() { tone(280, 720, 0.18, 0.07, 'sine'); },
    quack:   function() {
      tone(560, 370, 0.09, 0.07, 'square');
      setTimeout(function() { tone(480, 300, 0.07, 0.05, 'square'); }, 110);
    },
    cmdOpen: function() { tone(480, 620, 0.08, 0.05, 'sine'); },
    cmdMove: function() { tone(380, 440, 0.04, 0.025, 'sine'); },
    cmdExec: function() { tone(580, 820, 0.08, 0.05, 'sine'); },
    nav:     function() { tone(440, 560, 0.06, 0.04, 'sine'); },
    cosmic:  function() {
      // Deep space drone — two layered low oscillators
      tone(55, 42, 1.6, 0.045, 'sine');
      setTimeout(function() { tone(82, 68, 1.2, 0.025, 'sine'); }, 120);
    },
    chime:   function() {
      // Crystalline twinkling — cascading high partials
      var freqs = [1320, 1760, 2200, 1540];
      freqs.forEach(function(f, i) {
        setTimeout(function() { tone(f, f * 0.92, 0.22, 0.018, 'sine'); }, i * 65);
      });
    },
    warp:    function() {
      // Space-warp sweep
      tone(110, 440, 0.25, 0.05, 'sawtooth');
      setTimeout(function() { tone(440, 880, 0.2, 0.03, 'sine'); }, 200);
      setTimeout(function() { tone(880, 220, 0.3, 0.02, 'sine'); }, 380);
    },
    isMuted: function() { return muted; },
    setMuted:function(v) { muted = v; }
  };
})();


/* ═══════════════════════════════════════════════
   LAUNCH DUCKS  (global — used by Konami + palette)
   ═══════════════════════════════════════════════ */
function launchDucks() {
  for (var i = 0; i < 18; i++) {
    (function(i) {
      setTimeout(function() {
        var d = document.createElement("div");
        d.className = "konami-duck";
        d.textContent = "🦆";
        d.style.left = (Math.random() * 90) + "vw";
        d.style.bottom = "-40px";
        d.style.animationDuration = (1.5 + Math.random() * 2) + "s";
        d.style.fontSize = (16 + Math.random() * 24) + "px";
        document.body.appendChild(d);
        if (i % 3 === 0) AudioEngine.quack();
        setTimeout(function() { d.remove(); }, 4000);
      }, i * 80);
    })(i);
  }
}


/* ═══════════════════════════════════════════════
   AUDIO INTEGRATION  (patches + new listeners)
   ═══════════════════════════════════════════════ */
(function() {
  // Wrap startBlackout / lightOn for audio
  var _startBlackout = startBlackout;
  startBlackout = function() {
    if (!document.documentElement.classList.contains('light')) AudioEngine.blackout();
    _startBlackout();
  };
  var _lightOn = lightOn;
  lightOn = function() { AudioEngine.lightOn(); AudioEngine.warp(); _lightOn(); };

  // Nav clicks
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(function(a) {
    a.addEventListener('click', function() { AudioEngine.nav(); });
  });

  // Terminal key ticks
  var ti = document.getElementById('terminal-input');
  if (ti) {
    ti.addEventListener('keydown', function(e) {
      if (e.key.length === 1 || e.key === 'Backspace') AudioEngine.tick();
    });
  }

  // Mute button
  var muteBtn = document.getElementById('mute-btn');
  if (muteBtn) {
    muteBtn.addEventListener('click', function() {
      var nowMuted = !AudioEngine.isMuted();
      AudioEngine.setMuted(nowMuted);
      document.getElementById('snd-on').style.display = nowMuted ? 'none' : '';
      document.getElementById('snd-off').style.display = nowMuted ? '' : 'none';
      if (!nowMuted) AudioEngine.click();
    });
  }
})();


/* ═══════════════════════════════════════════════
   BOOT SEQUENCE  (first visit only via sessionStorage)
   ═══════════════════════════════════════════════ */
(function() {
  if (sessionStorage.getItem('vb_booted')) {
    var bs = document.getElementById('boot-screen');
    if (bs) bs.style.display = 'none';
    return;
  }
  sessionStorage.setItem('vb_booted', '1');

  var screen = document.getElementById('boot-screen');
  if (!screen) return;

  var lines = [
    { ts: '0.001', text: 'BIOS: portfolio v2.0 initialized' },
    { ts: '0.087', text: 'loading personality modules',    ok: true },
    { ts: '0.213', text: 'mounting duck filesystem',       ok: true },
    { ts: '0.334', text: 'calibrating coffee dependency',  ok: true },
    { ts: '0.512', text: 'warming up NLP pipeline',        ok: true },
    { ts: '0.698', text: 'deploying to production',        ok: true },
    { ts: '0.821', text: 'WARNING: duck count exceeds recommended threshold', warn: true },
    { ts: '1.047', text: 'all systems nominal. welcome.',  dim: true },
  ];
  var gaps = [0, 190, 260, 220, 370, 390, 250, 470];
  var container = document.getElementById('boot-lines');
  var cumDelay = 0;

  lines.forEach(function(line, i) {
    cumDelay += gaps[i];
    (function(delay, l) {
      setTimeout(function() {
        var el = document.createElement('div');
        el.className = 'boot-line';
        var ts = '<span class="b-ts">[' + l.ts + ']</span>';
        var body = l.text;
        if (l.warn) body = '<span class="b-warn">' + body + '</span>';
        if (l.dim)  body = '<span class="b-dim">'  + body + '</span>';
        var ok = l.ok ? '<span class="b-ok">[  OK  ]</span>' : '';
        el.innerHTML = ts + body + ok;
        container.appendChild(el);
        requestAnimationFrame(function() {
          requestAnimationFrame(function() { el.classList.add('show'); });
        });
      }, delay);
    })(cumDelay, line);
  });

  function dismiss() {
    screen.classList.add('fade-out');
    setTimeout(function() { screen.style.display = 'none'; }, 700);
    document.removeEventListener('keydown', onKey);
    screen.removeEventListener('click', dismiss);
  }
  function onKey() { dismiss(); }

  setTimeout(dismiss, cumDelay + 700);
  document.addEventListener('keydown', onKey);
  screen.addEventListener('click', dismiss);
})();


/* ═══════════════════════════════════════════════
   COMMAND PALETTE  (⌘K / Ctrl+K)
   ═══════════════════════════════════════════════ */
function openCmdPalette() {
  var palette = document.getElementById('cmd-palette');
  if (!palette) return;
  palette.classList.add('open');
  var inp = document.getElementById('cmd-input');
  if (inp) { inp.value = ''; inp.focus(); }
  if (typeof window.renderPalette === 'function') window.renderPalette('');
  AudioEngine.cmdOpen();
}
function closeCmdPalette() {
  var palette = document.getElementById('cmd-palette');
  if (palette) palette.classList.remove('open');
}

(function() {
  var palette = document.getElementById('cmd-palette');
  var inp     = document.getElementById('cmd-input');
  var results = document.getElementById('cmd-results');
  if (!palette || !inp || !results) return;

  function scrollSec(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
  function openTerm() {
    var w = document.getElementById('terminal-wrap');
    if (!w) return;
    w.classList.add('open');
    setTimeout(function() { document.getElementById('terminal-input').focus(); }, 200);
  }
  function toggleSnd() {
    var nowMuted = !AudioEngine.isMuted();
    AudioEngine.setMuted(nowMuted);
    document.getElementById('snd-on').style.display  = nowMuted ? 'none' : '';
    document.getElementById('snd-off').style.display = nowMuted ? '' : 'none';
    if (!nowMuted) AudioEngine.click();
  }

  var CMDS = [
    { g: 'Navigate', ico: '→',  lbl: 'About',         hint: '',        fn: function() { scrollSec('about'); } },
    { g: 'Navigate', ico: '→',  lbl: 'Experience',     hint: '',        fn: function() { scrollSec('experience'); } },
    { g: 'Navigate', ico: '→',  lbl: 'Projects',       hint: '',        fn: function() { scrollSec('projects'); } },
    { g: 'Navigate', ico: '→',  lbl: 'Stack',          hint: '',        fn: function() { scrollSec('stack'); } },
    { g: 'Navigate', ico: '→',  lbl: 'Contact',        hint: '',        fn: function() { scrollSec('contact'); } },
    { g: 'Actions',  ico: '◐',  lbl: 'Toggle theme',   hint: '',        fn: function() { startBlackout(); } },
    { g: 'Actions',  ico: '>_', lbl: 'Open terminal',  hint: 'bash',    fn: function() { openTerm(); } },
    { g: 'Actions',  ico: '♪',  lbl: 'Toggle sound',   hint: '',        fn: function() { toggleSnd(); } },
    { g: 'Links',    ico: '↗',  lbl: 'GitHub',         hint: '',        fn: function() { window.open('https://github.com/Vbatocanin', '_blank'); } },
    { g: 'Links',    ico: '↗',  lbl: 'LinkedIn',       hint: '',        fn: function() { window.open('https://linkedin.com/in/vladimir-batocanin', '_blank'); } },
    { g: 'Links',    ico: '↗',  lbl: 'Email',          hint: '',        fn: function() { window.location.href = 'mailto:vlad.batocanin@gmail.com'; } },
    { g: 'Secrets',  ico: '🦆', lbl: 'Launch ducks',   hint: 'Konami',  fn: function() { launchDucks(); } },
    { g: 'Secrets',  ico: '🐍', lbl: 'Play snake',     hint: '',        fn: function() { openSnake(); } },
    { g: 'Secrets',  ico: '🧙', lbl: 'Paint the Town Crimson', hint: 'WebGL', fn: function() { if(typeof openCrimsonGame==='function') openCrimsonGame(); } },
  ];

  var sel = 0, visible = [];

  function fuzzy(hay, needle) {
    if (!needle) return true;
    var h = hay.toLowerCase(), n = needle.toLowerCase(), hi = 0;
    for (var ni = 0; ni < n.length; ni++) {
      hi = h.indexOf(n[ni], hi);
      if (hi === -1) return false;
      hi++;
    }
    return true;
  }

  function renderPaletteLocal(query) {
    visible = CMDS.filter(function(c) { return fuzzy(c.lbl + ' ' + c.g, query); });
    sel = 0;
    if (!visible.length) { results.innerHTML = '<div id="cmd-empty">no results</div>'; return; }
    var html = '', lastG = '';
    visible.forEach(function(cmd, i) {
      if (cmd.g !== lastG) { html += '<div class="cmd-group">' + cmd.g + '</div>'; lastG = cmd.g; }
      html += '<div class="cmd-item' + (i === 0 ? ' hi' : '') + '" data-i="' + i + '">' +
        '<span class="cmd-ico">' + cmd.ico + '</span>' +
        '<span class="cmd-lbl">' + cmd.lbl + '</span>' +
        (cmd.hint ? '<span class="cmd-hint-kbd">' + cmd.hint + '</span>' : '') +
        '</div>';
    });
    results.innerHTML = html;
    results.querySelectorAll('.cmd-item').forEach(function(el) {
      el.addEventListener('mouseenter', function() { sel = +el.dataset.i; highlight(); });
      el.addEventListener('click', function() { execute(+el.dataset.i); });
    });
  }
  // expose for openCmdPalette
  window.renderPalette = renderPaletteLocal;

  function highlight() {
    results.querySelectorAll('.cmd-item').forEach(function(el, i) { el.classList.toggle('hi', i === sel); });
    var active = results.querySelector('.cmd-item.hi');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  function execute(i) {
    var cmd = visible[i]; if (!cmd) return;
    AudioEngine.cmdExec();
    closeCmdPalette();
    setTimeout(function() { cmd.fn(); }, 60);
  }

  inp.addEventListener('input', function() { renderPaletteLocal(inp.value); });
  inp.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowDown')  { e.preventDefault(); sel = Math.min(sel + 1, visible.length - 1); highlight(); AudioEngine.cmdMove(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); highlight(); AudioEngine.cmdMove(); }
    else if (e.key === 'Enter')   { e.preventDefault(); execute(sel); }
    else if (e.key === 'Escape')  { closeCmdPalette(); }
  });

  document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      palette.classList.contains('open') ? closeCmdPalette() : openCmdPalette();
    }
  });

  palette.addEventListener('click', function(e) { if (e.target === palette) closeCmdPalette(); });
})();


/* ═══════════════════════════════════════════════
   MOBILE INTERACTIONS
   ═══════════════════════════════════════════════ */

/* ── Touch ripple on tap ── */
(function() {
  if (!isTouch) return;
  document.addEventListener('touchstart', function(e) {
    var t = e.touches[0];
    var rip = document.createElement('div');
    rip.className = 'touch-ripple';
    rip.style.left = t.clientX + 'px';
    rip.style.top = t.clientY + 'px';
    document.body.appendChild(rip);
    rip.addEventListener('animationend', function() { rip.remove(); });
  }, { passive: true });
})();

/* ── Mobile toast helper ── */
function showMobileToast(msg, duration) {
  var toast = document.getElementById('mobile-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'mobile-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(function() { toast.classList.remove('show'); }, duration || 2200);
}

/* ── Device shake → launch ducks ── */
(function() {
  if (!isTouch || !window.DeviceMotionEvent) return;
  var lastX = 0, lastY = 0, lastZ = 0, lastShake = 0;
  var hintShown = false;
  window.addEventListener('devicemotion', function(e) {
    var a = e.accelerationIncludingGravity;
    if (!a) return;
    var now = Date.now();
    var dx = Math.abs(a.x - lastX), dy = Math.abs(a.y - lastY), dz = Math.abs(a.z - lastZ);
    lastX = a.x; lastY = a.y; lastZ = a.z;
    if (dx + dy + dz > 38 && now - lastShake > 1800) {
      lastShake = now;
      launchDucks();
      AudioEngine.quack();
    }
    if (!hintShown && now > 3000) {
      hintShown = true;
      showMobileToast('shake for ducks 🦆');
    }
  }, { passive: true });
})();

/* ── Long-press on project cards ── */
(function() {
  if (!isTouch) return;
  document.querySelectorAll('.project-row').forEach(function(card) {
    var timer;
    card.addEventListener('touchstart', function() {
      timer = setTimeout(function() {
        card.classList.add('longpress-glow');
        AudioEngine.chime();
        setTimeout(function() { card.classList.remove('longpress-glow'); }, 900);
      }, 450);
    }, { passive: true });
    card.addEventListener('touchend', function() { clearTimeout(timer); });
    card.addEventListener('touchmove', function() { clearTimeout(timer); });
  });
})();

/* ── Gyroscope tilt on project cards ── */
(function() {
  if (!isTouch) return;
  var supported = false;
  var baseB = null, baseG = null;

  function applyTilt(beta, gamma) {
    if (baseB === null) { baseB = beta; baseG = gamma; return; }
    var rx = Math.max(-6, Math.min(6, (beta - baseB) * 0.18));
    var ry = Math.max(-8, Math.min(8, (gamma - baseG) * 0.22));
    document.querySelectorAll('.project-row').forEach(function(card) {
      card.style.transform = 'perspective(600px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
    });
  }

  function onOrientation(e) {
    if (!supported) { supported = true; }
    applyTilt(e.beta, e.gamma);
  }

  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS 13+ — request on first project card tap
    var requested = false;
    document.querySelectorAll('.project-row').forEach(function(card) {
      card.addEventListener('touchstart', function() {
        if (requested) return;
        requested = true;
        DeviceOrientationEvent.requestPermission().then(function(state) {
          if (state === 'granted') window.addEventListener('deviceorientation', onOrientation, { passive: true });
        }).catch(function() {});
      }, { passive: true });
    });
  } else {
    window.addEventListener('deviceorientation', onOrientation, { passive: true });
  }
})();

/* ── Double-tap hero to scroll to about ── */
(function() {
  if (!isTouch) return;
  var hero = document.querySelector('.hero');
  if (!hero) return;
  var lastTap = 0;
  hero.addEventListener('touchend', function() {
    var now = Date.now();
    if (now - lastTap < 320) {
      var about = document.getElementById('about');
      if (about) about.scrollIntoView({ behavior: 'smooth' });
      AudioEngine.nav();
    }
    lastTap = now;
  }, { passive: true });
})();

/* ── Swipe on exp-rows to reveal detail on mobile ── */
(function() {
  if (!isTouch) return;
  document.querySelectorAll('.exp-row').forEach(function(row) {
    var sx, sy;
    row.addEventListener('touchstart', function(e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    row.addEventListener('touchend', function(e) {
      if (sx === undefined) return;
      var dx = e.changedTouches[0].clientX - sx;
      var dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        row.style.transition = 'transform 0.18s, box-shadow 0.18s';
        row.style.transform = 'translateX(' + (dx > 0 ? 6 : -6) + 'px)';
        row.style.boxShadow = dx > 0
          ? '4px 0 0 0 var(--accent)' : '-4px 0 0 0 var(--accent)';
        setTimeout(function() {
          row.style.transform = '';
          row.style.boxShadow = '';
        }, 320);
        AudioEngine.tick();
      }
      sx = undefined;
    }, { passive: true });
  });
})();
