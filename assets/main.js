/* Fadli Darusalam — portfolio v2.6
   Clock, palette cycling, copy-email, and the data-rain panel.
   No dependencies. */

(function () {
  "use strict";

  const root = document.documentElement;

  /* declared early: applyPalette touches it before the canvas exists */
  let rain = null;

  /* ---------- clock, pinned to UTC+7 ---------- */
  const clockEl = document.getElementById("clock");
  const pad = (n) => String(n).padStart(2, "0");

  function tick() {
    if (!clockEl) return;
    const now = new Date();
    const wib = new Date(now.getTime() + (now.getTimezoneOffset() + 420) * 60000);
    clockEl.textContent = pad(wib.getHours()) + ":" + pad(wib.getMinutes()) + ":" + pad(wib.getSeconds());
  }
  tick();
  setInterval(tick, 1000);

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- palettes ---------- */
  const PALETTES = [
    { id: "forest", color: "#14231b" },
    { id: "ember",  color: "#6e2a12" },
    { id: "night",  color: "#18222e" },
    { id: "plum",   color: "#2a1726" },
    { id: "clay",   color: "#d9906f" },
    { id: "sage",   color: "#bcc9ac" },
    { id: "dusk",   color: "#aabfce" },
    { id: "cream",  color: "#eadfcb" }
  ];
  const KEY = "fd-palette";

  const palBtn = document.getElementById("palBtn");
  const palLabel = document.getElementById("palLabel");
  const metaTheme = document.querySelector('meta[name="theme-color"]');

  function applyPalette(id) {
    const found = PALETTES.find(function (p) { return p.id === id; }) || PALETTES[0];
    root.setAttribute("data-palette", found.id);
    if (palLabel) palLabel.textContent = found.id;
    if (metaTheme) metaTheme.setAttribute("content", found.color);
    if (rain) rain.recolor();
  }

  function currentIndex() {
    const id = root.getAttribute("data-palette");
    const i = PALETTES.findIndex(function (p) { return p.id === id; });
    return i < 0 ? 0 : i;
  }

  function nextPalette() {
    const next = PALETTES[(currentIndex() + 1) % PALETTES.length].id;
    applyPalette(next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
  }

  let stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  /* default lives on <html data-palette>, so changing it is a one-line edit */
  applyPalette(stored || root.getAttribute("data-palette") || "forest");

  if (palBtn) palBtn.addEventListener("click", nextPalette);

  document.addEventListener("keydown", function (ev) {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const tag = (ev.target && ev.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (ev.key === "p" || ev.key === "P") {
      ev.preventDefault();
      nextPalette();
    }
  });

  /* ---------- data rain ----------
     Columns of hex characters falling at different speeds, drawn
     as explicit trails so the panel stays transparent over the
     dot grid. Heads are bright, tails fade out. */
  rain = (function () {
    const cv = document.getElementById("rain");
    if (!cv || !cv.getContext) return { recolor: function () {} };

    const ctx = cv.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const CHARS = "0123456789abcdef:/.<>=@#$%&*[]{}";
    const COL_W = 15;
    const ROW_H = 15;
    const TRAIL = 9;

    let w = 0, h = 0, dpr = 1;
    let cols = [];
    let rgb = "240, 176, 143";
    let raf = null;

    function glyph() {
      return CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = '500 11px "JetBrains Mono", ui-monospace, monospace';
      ctx.textBaseline = "top";

      const n = Math.max(6, Math.floor(w / COL_W));
      const rowsDown = Math.ceil(h / ROW_H) + TRAIL + 2;

      cols = [];
      for (let i = 0; i < n; i++) {
        cols.push({
          x: 8 + i * COL_W,
          y: Math.random() * rowsDown - rowsDown,
          speed: 0.16 + Math.random() * 0.42,
          chars: new Array(rowsDown).fill(0).map(glyph)
        });
      }

      draw();
    }

    function draw() {
      if (!w || !h) return;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < cols.length; i++) {
        const c = cols[i];
        const head = Math.floor(c.y);

        for (let t = 0; t < TRAIL; t++) {
          const row = head - t;
          if (row < 0) continue;
          const y = row * ROW_H;
          if (y > h) continue;

          const ch = c.chars[((row % c.chars.length) + c.chars.length) % c.chars.length];
          const fade = Math.pow(1 - t / TRAIL, 1.6);
          const alpha = t === 0 ? 0.95 : 0.06 + fade * 0.5;

          ctx.fillStyle = "rgba(" + rgb + ", " + alpha.toFixed(3) + ")";
          ctx.fillText(ch, c.x, y);
        }
      }
    }

    function frame() {
      for (let i = 0; i < cols.length; i++) {
        const c = cols[i];
        c.y += c.speed;
        if (c.y - TRAIL > h / ROW_H) {
          c.y = -Math.random() * 12;
          c.speed = 0.16 + Math.random() * 0.42;
        }
        /* keep the head cell fresh */
        if (Math.random() < 0.25) {
          const k = Math.floor(Math.random() * c.chars.length);
          c.chars[k] = glyph();
        }
      }
      draw();
      raf = requestAnimationFrame(frame);
    }

    function recolor() {
      const val = getComputedStyle(root).getPropertyValue("--accent");
      const v = (val || "#f0b08f").trim().replace("#", "");
      const full = v.length === 3 ? v.split("").map(function (c) { return c + c; }).join("") : v;
      const n = parseInt(full, 16);
      rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(", ");
      if (reduce) draw();
    }

    function start() {
      if (reduce) { draw(); return; }
      if (!raf) raf = requestAnimationFrame(frame);
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });

    if ("IntersectionObserver" in window && !reduce) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) start(); else stop();
        });
      }, { threshold: 0.02 }).observe(cv);
    }

    if ("ResizeObserver" in window) {
      new ResizeObserver(build).observe(cv);
    } else {
      window.addEventListener("resize", build);
    }

    recolor();
    build();
    start();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { build(); });
    }

    return { recolor: recolor };
  })();

  /* ---------- handle: decode + bounce ----------
     The plate alternates between the two handles, and drifts around
     the panel the way a screensaver does: constant velocity,
     reversed whenever it reaches an edge. */
  (function handleTag() {
    const tag = document.getElementById("tag");
    const el = document.getElementById("handle");
    if (!tag || !el) return;

    const TEXT = [
      "b0ltzzz",
      "bolt11",
      "idor",
      "sqli",
      "xss",
      "ssrf",
      "rce",
      "lfi",
      "xxe",
      "csrf",
      "cors",
      "waf",
      "jwt",
      "oauth",
      "saml",
      "bac",
      "mitm",
      "recon",
      "fuzz",
      "bypass",
      "exploit",
      "payload",
      "shell",
      "privesc",
      "enum",
      "0day",
      "poc",
      "dns",
      "tls",
      "cve",
      "deeplink",
      "intent",
      "smali",
      "frida",
      "hook",
      "apk",
      "adb",
      "jadx",
      "webview",
      "keystore",
      "overlay",
      "tapjack",
      "clipboard",
      "pinning",
      "encrypt",
      "sandbox",
      "root"
    ];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const GLYPHS = "0123456789abcdef#$%&*<>[]{}";
    const PAD = 12;

    /* px per second — deliberately slow */
    const SPEED_X = 26;
    const SPEED_Y = 17;

    let raf = null;
    let lastTs = 0;

    /* shuffled deck: every word appears once per pass, never twice in a row */
    let queue = [];
    let lastShown = "";

    function reshuffle() {
      queue = TEXT.slice();
      for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const swap = queue[i];
        queue[i] = queue[j];
        queue[j] = swap;
      }
      if (queue.length > 1 && queue[0] === lastShown) {
        const swap = queue[0];
        queue[0] = queue[1];
        queue[1] = swap;
      }
    }

    function nextWord() {
      if (!queue.length) reshuffle();
      lastShown = queue.shift();
      return lastShown;
    }

    const box = { w: 0, h: 0, tw: 0, th: 0 };
    const pos = { x: PAD, y: PAD };
    const vel = { x: SPEED_X, y: SPEED_Y };

    function limits() {
      return {
        maxX: Math.max(PAD, box.w - box.tw - PAD),
        maxY: Math.max(PAD, box.h - box.th - PAD)
      };
    }

    function apply() {
      tag.style.transform = "translate3d(" + pos.x.toFixed(1) + "px, " + pos.y.toFixed(1) + "px, 0)";
    }

    function measure() {
      const panel = tag.parentElement.getBoundingClientRect();
      box.w = panel.width;
      box.h = panel.height;
      box.tw = tag.offsetWidth;
      box.th = tag.offsetHeight;

      const l = limits();
      pos.x = Math.min(Math.max(pos.x, PAD), l.maxX);
      pos.y = Math.min(Math.max(pos.y, PAD), l.maxY);
      apply();
    }

    function step(ts) {
      if (!lastTs) lastTs = ts;
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;

      const l = limits();

      pos.x += vel.x * dt;
      pos.y += vel.y * dt;

      if (pos.x <= PAD) {
        pos.x = PAD;
        vel.x = Math.abs(vel.x);
        vel.y = vel.y * (0.85 + Math.random() * 0.3);
      } else if (pos.x >= l.maxX) {
        pos.x = l.maxX;
        vel.x = -Math.abs(vel.x);
        vel.y = vel.y * (0.85 + Math.random() * 0.3);
      }

      if (pos.y <= PAD) {
        pos.y = PAD;
        vel.y = Math.abs(vel.y);
        vel.x = vel.x * (0.85 + Math.random() * 0.3);
      } else if (pos.y >= l.maxY) {
        pos.y = l.maxY;
        vel.y = -Math.abs(vel.y);
        vel.x = vel.x * (0.85 + Math.random() * 0.3);
      }

      apply();
      raf = requestAnimationFrame(step);
    }

    function start() {
      if (reduce) { apply(); return; }
      if (!raf) {
        lastTs = 0;
        raf = requestAnimationFrame(step);
      }
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    }

    function decodeTo(text, done) {
      /* long words get a smaller size so they always fit the panel */
      el.dataset.size = text.length > 16 ? "s" : text.length > 11 ? "m" : "l";

      let frame = 0;
      const id = setInterval(function () {
        frame++;
        let out = "";
        for (let i = 0; i < text.length; i++) {
          const settled = frame > i * 3 + 5;
          out += settled ? text.charAt(i) : GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
        }
        el.textContent = out;

        if (frame > text.length * 3 + 8) {
          clearInterval(id);
          el.textContent = text;
          measure();
          if (done) done();
        }
      }, 55);
    }

    function cycle() {
      decodeTo(nextWord(), function () {
        setTimeout(cycle, 1800);
      });
    }

    /* random starting direction */
    vel.x = (Math.random() < 0.5 ? -1 : 1) * SPEED_X;
    vel.y = (Math.random() < 0.5 ? -1 : 1) * SPEED_Y;

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });

    if ("IntersectionObserver" in window && !reduce) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) start(); else stop();
        });
      }, { threshold: 0.02 }).observe(tag);
    }

    window.addEventListener("resize", measure);

    if (reduce) {
      el.textContent = TEXT[0];
      measure();
      return;
    }

    measure();
    if (box.tw) {
      pos.x = PAD + Math.random() * Math.max(1, box.w - box.tw - PAD * 2);
      pos.y = PAD + Math.random() * Math.max(1, box.h - box.th - PAD * 2);
      apply();
    }

    start();
    setTimeout(cycle, 600);
  })();

  /* ---------- copy email ---------- */
  const copyBtn = document.getElementById("copyMail");
  if (copyBtn) {
    const original = copyBtn.textContent;
    copyBtn.addEventListener("click", async function () {
      const mail = copyBtn.dataset.mail || "";
      try {
        await navigator.clipboard.writeText(mail);
      } catch (e) {
        const ta = document.createElement("textarea");
        ta.value = mail;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      copyBtn.textContent = "[ copied ]";
      copyBtn.classList.add("is-done");
      setTimeout(function () {
        copyBtn.textContent = original;
        copyBtn.classList.remove("is-done");
      }, 2200);
    });
  }
})();
