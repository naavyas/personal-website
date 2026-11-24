import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const GITHUB_REPO = "https://github.com/naavyas";

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ── Chrome ─────────────────────────────────────────────────────────── */

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

$$("#github-work, #github-contact").forEach((el) =>
  el.setAttribute("href", GITHUB_REPO)
);

/* ── Generic scroll-in reveals ──────────────────────────────────────── */

function initReveals() {
  const targets = $$(".reveal");
  if (reduceMotion) {
    targets.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
  );

  targets.forEach((el) => io.observe(el));
}

/* ══ Shared canvas helpers ════════════════════════════════════════════ */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sizeCanvas(cv, ctx) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = cv.clientWidth;
  const h = cv.clientHeight;
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [w, h];
}

const cssVar = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/* ══ 1. Cover — "Hi, I am" typewriter ═════════════════════════════════ */

function initTypewriter() {
  const cover = $("#cover");
  const typed = $(".hello-small .typed");
  const hello = $("#hello");
  if (!cover || !typed || !hello) return;

  const txt = $(".txt", typed);
  const caret = document.createElement("span");
  caret.className = "caret";
  const TEXT = "Hi, I am";
  let run = 0;

  async function play() {
    const id = ++run;
    txt.textContent = "";
    typed.append(caret);
    if (reduceMotion) {
      txt.textContent = TEXT;
      return;
    }
    await sleep(450);
    for (const ch of TEXT) {
      if (id !== run) return;
      txt.textContent += ch;
      await sleep(85 + Math.random() * 80);
    }
  }

  // Retype every time the cover scrolls back into view.
  let leftCover = false;
  new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.intersectionRatio < 0.25) leftCover = true;
        else if (e.intersectionRatio >= 0.6 && leftCover) {
          leftCover = false;
          play();
        }
      }),
    { threshold: [0, 0.25, 0.6] }
  ).observe(cover);

  hello.addEventListener("click", play);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(play);

  const prompt = $(".scroll-prompt a");
  prompt?.addEventListener("click", (e) => {
    e.preventDefault();
    $("#story")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });

  // Header text goes light over the dark sections, dark over the light ones.
  const lightSections = $$(".cover, .experience, .beat-gallery");
  const onScroll = () => {
    const overLight = lightSections.some((el) => {
      const r = el.getBoundingClientRect();
      return r.top < 40 && r.bottom > 40;
    });
    document.body.classList.toggle("is-dark", !overLight);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ══ 1. Cover — cursor-reactive dot grid ══════════════════════════════ */

function createDotField() {
  const cover = $("#cover");
  const canvas = $(".cover-field");
  if (!cover || !canvas) return null;

  const ctx = canvas.getContext("2d");
  const DOT = cssVar("--dot") || "#c9cdce";
  const DOT_DARK = cssVar("--dot-dark") || "#8b9194";
  const GAP = 14;
  const BASE_R = 1.05;
  const REACH = 150;
  let W = 0;
  let H = 0;
  let grid = []; // [homeX, homeY, offX, offY, r]
  let visible = true;

  let px = -9999, py = -9999, tx = -9999, ty = -9999;
  let presence = 0, targetPresence = 0;

  cover.addEventListener(
    "pointermove",
    (e) => {
      const rc = cover.getBoundingClientRect();
      tx = e.clientX - rc.left;
      ty = e.clientY - rc.top;
      if (px < -999) {
        px = tx;
        py = ty;
      }
      targetPresence = 1;
    },
    { passive: true }
  );
  cover.addEventListener("pointerleave", () => (targetPresence = 0));
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(cover);

  function resize() {
    [W, H] = sizeCanvas(canvas, ctx);
    grid = [];
    const cols = Math.ceil(W / GAP) + 1;
    const rows = Math.ceil(H / GAP) + 1;
    const ox = (W - (cols - 1) * GAP) / 2;
    const oy = (H - (rows - 1) * GAP) / 2;
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++)
        grid.push([ox + i * GAP, oy + j * GAP, 0, 0, BASE_R]);
  }

  function draw(t) {
    if (!visible) return;
    px += (tx - px) * 0.18;
    py += (ty - py) * 0.18;
    presence += (targetPresence - presence) * 0.08;

    ctx.clearRect(0, 0, W, H);
    const light = new Path2D();
    const dark = new Path2D();
    const R2 = REACH * REACH;

    for (const d of grid) {
      const hx = d[0];
      const hy = d[1];
      let goX = 0, goY = 0, goR = BASE_R;

      if (presence > 0.01) {
        const dx = hx - px;
        const dy = hy - py;
        const dd = dx * dx + dy * dy;
        if (dd < R2) {
          const dist = Math.sqrt(dd) || 1;
          const f = 1 - dist / REACH;
          const near = f * f * presence;
          goX = (dx / dist) * near * 22;
          goY = (dy / dist) * near * 22;
          goR = BASE_R + near * 2.6;
        }
      }
      if (!reduceMotion) {
        goX += Math.sin(t * 0.6 + hy * 0.02) * 0.6;
        goY += Math.cos(t * 0.5 + hx * 0.02) * 0.6;
      }
      d[2] += (goX - d[2]) * 0.14;
      d[3] += (goY - d[3]) * 0.14;
      d[4] += (goR - d[4]) * 0.14;

      const x = hx + d[2];
      const y = hy + d[3];
      const r = d[4];
      const p = r > BASE_R + 1.1 ? dark : light;
      p.moveTo(x + r, y);
      p.arc(x, y, r, 0, Math.PI * 2);
    }
    ctx.fillStyle = DOT;
    ctx.fill(light);
    ctx.fillStyle = DOT_DARK;
    ctx.fill(dark);
  }

  return { resize, draw };
}

/* ══ 2. Story — dots become bars, lines, then a network ═══════════════ */

function createStory() {
  const story = $("#story");
  const canvas = $(".story-dots");
  if (!story || !canvas) return null;

  const ctx = canvas.getContext("2d");
  const copyEls = $$("[data-copy]", story);
  const C = { cream: "#f8f5f2", sand: "#d7ccc8", taupe: "#bcaaa4", rose: "#c9a99a" };
  let W = 0;
  let H = 0;
  let visible = false;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(story);

  const N = 48;
  const R = rng(7);
  const scatter = Array.from({ length: N }, () => [0.04 + R() * 0.92, 0.04 + R() * 0.92]);
  const scatterR = Array.from({ length: N }, () => 2 + R() * 3.5);

  const bars = [];
  [6, 9, 7, 11, 6, 9].forEach((n, col) => {
    for (let k = 0; k < n; k++) bars.push([0.12 + col * 0.152, 0.95 - k * 0.078]);
  });

  const line = Array.from({ length: N }, (_, i) => {
    const u = i / (N - 1);
    return [
      0.04 + u * 0.92,
      0.6 - Math.sin(u * Math.PI * 1.7 + 0.2) * 0.22 - u * 0.25 + (R() - 0.5) * 0.03,
    ];
  });

  const centres = [[0.2, 0.42], [0.46, 0.8], [0.8, 0.58], [0.6, 0.2]];
  const cluster = Array.from({ length: N }, (_, i) => i % 4);
  const net = Array.from({ length: N }, (_, i) => {
    const [cx, cy] = centres[cluster[i]];
    if (i < 4) return [cx, cy];
    const a = R() * Math.PI * 2;
    const d = 0.05 + Math.sqrt(R()) * 0.13;
    return [cx + Math.cos(a) * d, cy + Math.sin(a) * d * 1.2];
  });
  const netEdges = [];
  for (let i = 0; i < N; i++) {
    const near = [];
    for (let j = 0; j < N; j++) {
      if (i === j || cluster[i] !== cluster[j]) continue;
      near.push([Math.hypot(net[i][0] - net[j][0], net[i][1] - net[j][1]), j]);
    }
    near
      .sort((a, b) => a[0] - b[0])
      .slice(0, 2)
      .forEach(([, j]) => netEdges.push([i, j]));
    if (i >= 4) netEdges.push([i, cluster[i]]);
  }
  [[0, 3], [3, 2], [2, 1], [1, 0], [0, 2], [5, 14], [10, 23]].forEach((e) =>
    netEdges.push(e)
  );
  const degree = new Array(N).fill(0);
  netEdges.forEach(([a, b]) => {
    degree[a]++;
    degree[b]++;
  });
  const netR = degree.map((d) => 2.5 + Math.min(9, d * 0.7));
  const clusterTint = [C.cream, C.rose, C.sand, C.taupe];

  const layouts = [scatter, bars, line, net];
  const radii = [scatterR, new Array(N).fill(5), new Array(N).fill(3.5), netR];
  // scroll progress → stage 0..3, with holds between morphs
  const keys = [[0, 0], [0.1, 0], [0.28, 1], [0.38, 1], [0.56, 2], [0.66, 2], [0.86, 3], [1, 3]];

  const stageAt = (p) => {
    for (let i = 0; i < keys.length - 1; i++) {
      const [p0, s0] = keys[i];
      const [p1, s1] = keys[i + 1];
      if (p <= p1) return s0 + (s1 - s0) * easeInOut(clamp((p - p0) / (p1 - p0), 0, 1));
    }
    return 3;
  };

  const progress = () => {
    if (reduceMotion) return 1;
    const rc = story.getBoundingClientRect();
    return clamp(-rc.top / (rc.height - window.innerHeight), 0, 1);
  };

  let lastCopy = -1;

  function draw(t, force = false) {
    if (!visible && !force) return;
    const s = stageAt(progress());
    const a = Math.min(2, Math.floor(s));
    const f = s - a;
    const w = (i) => Math.max(0, 1 - Math.abs(s - i));

    const copy = s < 1.5 ? 0 : 1;
    if (copy !== lastCopy) {
      copyEls.forEach((el, i) => el.classList.toggle("on", i === copy));
      lastCopy = copy;
    }

    const bw = Math.min(W * 0.84, 980);
    const bh = Math.min(H * 0.5, 520);
    const bx = (W - bw) / 2;
    const by = H * 0.22;
    const P = (pt) => [bx + pt[0] * bw, by + pt[1] * bh];

    const pos = [];
    const rad = [];
    const wob = reduceMotion ? 0 : w(0);
    for (let i = 0; i < N; i++) {
      const p0 = P(layouts[a][i]);
      const p1 = P(layouts[a + 1][i]);
      pos.push([
        lerp(p0[0], p1[0], f) + Math.sin(t * 0.9 + i) * 6 * wob,
        lerp(p0[1], p1[1], f) + Math.cos(t * 0.7 + i * 1.3) * 6 * wob,
      ]);
      rad.push(lerp(radii[a][i], radii[a + 1][i], f));
    }

    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = "round";

    if (w(1) > 0) {
      ctx.globalAlpha = w(1) * 0.5;
      ctx.strokeStyle = C.sand;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx + bw * 0.06, by + bh * 0.98);
      ctx.lineTo(bx + bw * 0.94, by + bh * 0.98);
      ctx.stroke();
    }
    if (w(2) > 0) {
      ctx.globalAlpha = w(2) * 0.7;
      ctx.strokeStyle = C.sand;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      pos.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    }
    if (w(3) > 0) {
      ctx.globalAlpha = w(3) * 0.4;
      ctx.strokeStyle = C.taupe;
      ctx.lineWidth = 1;
      ctx.beginPath();
      netEdges.forEach(([i, j]) => {
        ctx.moveTo(pos[i][0], pos[i][1]);
        ctx.lineTo(pos[j][0], pos[j][1]);
      });
      ctx.stroke();
    }
    for (let i = 0; i < N; i++) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.cream;
      ctx.beginPath();
      ctx.arc(pos[i][0], pos[i][1], rad[i], 0, Math.PI * 2);
      ctx.fill();
      if (w(3) > 0) {
        ctx.globalAlpha = w(3);
        ctx.fillStyle = clusterTint[cluster[i]];
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function resize() {
    [W, H] = sizeCanvas(canvas, ctx);
    draw(0, true);
  }

  return { resize, draw };
}

function initCanvases() {
  const field = createDotField();
  const story = createStory();
  const resize = () => {
    field?.resize();
    story?.resize();
  };
  window.addEventListener("resize", resize);
  resize();

  if (reduceMotion) {
    field?.draw(0);
    window.addEventListener("scroll", () => story?.draw(0, true), { passive: true });
    return;
  }

  const t0 = performance.now();
  const frame = (now) => {
    const t = (now - t0) / 1000;
    if (!document.hidden) {
      field?.draw(t);
      story?.draw(t);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/* ══ 3. Experience folders — one open at a time ═══════════════════════ */

function initFolders() {
  const folders = $$(".folder");
  folders.forEach((folder) => {
    const btn = $(".folder-toggle", folder);
    btn?.addEventListener("click", () => {
      const willOpen = !folder.classList.contains("open");
      folders.forEach((f) => {
        f.classList.remove("open");
        $(".folder-toggle", f)?.setAttribute("aria-expanded", "false");
      });
      if (willOpen) {
        folder.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
}

/* ══ Graph index — hover or click a name to show its graph ═══════════ */

function initGraphIndex() {
  const root = $("#beat-graphs");
  if (!root) return;

  const imgs = $$(".graph-frame img", root);
  const items = $$(".graph-item", root);
  const name = $(".graph-name", root);
  const group = $(".graph-group-name", root);

  const show = (i) => {
    imgs.forEach((el, k) => el.classList.toggle("on", k === i));
    items.forEach((b, k) => {
      b.classList.toggle("on", k === i);
      b.setAttribute("aria-pressed", String(k === i));
    });
    name.textContent = items[i].lastChild.textContent.trim();
    group.textContent = $(".graph-group-label", items[i].closest(".graph-group")).textContent;
  };

  items.forEach((b) => {
    const i = Number(b.dataset.index);
    b.addEventListener("click", () => show(i));
    b.addEventListener("mouseenter", () => show(i));
    b.addEventListener("focus", () => show(i));
  });

  // Warm the cache once the section is near, so swaps are instant.
  new IntersectionObserver(
    ([e], io) => {
      if (!e.isIntersecting) return;
      imgs.forEach((el) => (el.loading = "eager"));
      io.disconnect();
    },
    { rootMargin: "400px 0px" }
  ).observe(root);
}

/* ══ Beat C — lazy video + scale on scroll ════════════════════════════ */

function initVideo() {
  const video = $(".beat-video-el");
  const frame = $(".video-frame");
  const beat = $(".beat-video");
  if (!video || !frame || !beat) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!video.src && video.dataset.src) {
            video.src = video.dataset.src;
            video.load();
          }
          video.play().catch(() => {});
        } else if (!video.paused) {
          video.pause();
        }
      });
    },
    { rootMargin: "300px 0px", threshold: 0.15 }
  );
  io.observe(video);

  if (reduceMotion) return;

  gsap.fromTo(
    frame,
    { width: () => frame.parentElement.clientWidth * 0.72 },
    {
      width: () => document.documentElement.clientWidth,
      ease: "none",
      scrollTrigger: {
        trigger: beat,
        start: "top 90%",
        end: "top 20%",
        scrub: 0.5,
        invalidateOnRefresh: true,
      },
    }
  );
}

/* ── Boot ───────────────────────────────────────────────────────────── */

initReveals();
initTypewriter();
initCanvases();
initFolders();
initGraphIndex();
initVideo();

window.addEventListener("load", () => ScrollTrigger.refresh());
document.fonts?.ready?.then(() => ScrollTrigger.refresh());
