import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const GITHUB_REPO = "https://github.com/naavyas";

const EARTH = "#5a4339";
const COCOA = "#a1887f";

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

/* ══ 1. Hero — zoom into the middle "a" ═══════════════════════════════ */

function setZoomOrigin() {
  const zoom = $(".intro-zoom");
  const accent = $("#zoom-a");
  if (!zoom || !accent) return;

  const z = zoom.getBoundingClientRect();
  const a = accent.getBoundingClientRect();
  if (!z.width || !z.height) return;

  const ox = ((a.left + a.width / 2 - z.left) / z.width) * 100;
  const oy = ((a.top + a.height / 2 - z.top) / z.height) * 100;
  zoom.style.transformOrigin = `${ox}% ${oy}%`;
}

function zoomScale() {
  const accent = $("#zoom-a");
  if (!accent) return 40;
  const a = accent.getBoundingClientRect();
  const glyph = Math.min(a.width, a.height) || 40;
  const viewport = Math.max(
    document.documentElement.clientWidth,
    window.innerHeight
  );
  return gsap.utils.clamp(24, 80, (viewport / glyph) * 1.7);
}

function initHero() {
  const section = $(".chapter-intro");
  const zoom = $(".intro-zoom");
  const accent = $("#zoom-a");
  const backdrop = $(".stage-backdrop");
  const eyebrow = $(".eyebrow");
  if (!section || !zoom || !accent || !backdrop) return;

  const chars = $$(".intro-line .char").filter((c) => c !== accent);
  const words = $$(".intro-line .word:not(.name)");

  setZoomOrigin();
  window.addEventListener("resize", setZoomOrigin);

  if (reduceMotion) {
    ScrollTrigger.create({
      trigger: section,
      start: "bottom 85%",
      onEnter: () => {
        document.body.classList.add("is-dark");
        gsap.to(backdrop, { opacity: 0, duration: 0.5, ease: "none" });
      },
      onLeaveBack: () => {
        document.body.classList.remove("is-dark");
        gsap.to(backdrop, { opacity: 1, duration: 0.5, ease: "none" });
      },
    });
    return;
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "+=320%",
      scrub: 0.6,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefresh: setZoomOrigin,
      onUpdate: (self) =>
        document.body.classList.toggle("is-dark", self.progress > 0.7),
    },
  });

  tl.to(eyebrow, { opacity: 0, duration: 0.12, ease: "none" }, 0)
    .to(zoom, { scale: zoomScale, duration: 1.3, ease: "none" }, 0.05)
    .to(words, { opacity: 0, duration: 0.16, ease: "none" }, 0.06)
    .to(chars, { opacity: 0, duration: 0.24, stagger: 0.02, ease: "none" }, 0.1)
    .to(accent, { color: COCOA, duration: 0.22, ease: "none" }, 0.2)
    .to(accent, { color: EARTH, duration: 0.18, ease: "power2.in" }, 0.68)
    .to(backdrop, { opacity: 0, duration: 0.18, ease: "power2.in" }, 0.68)
    .to(zoom, { opacity: 0, duration: 0.15, ease: "none" }, 0.95)
    .to({}, { duration: 0.45 });
}

/* ══ 2 + 3. The thread — crayon scribble → node/edge network ═══════════ */

const SCRIBBLE = [
  [90, 470], [150, 330], [205, 205], [268, 118], [330, 150], [352, 268],
  [326, 392], [288, 486], [300, 540], [392, 506], [470, 420], [534, 308],
  [578, 196], [634, 120], [706, 148], [742, 262], [722, 382], [678, 470],
  [706, 528], [800, 494], [870, 412], [912, 306], [906, 214],
];

const NODES = [
  [110, 452], [232, 336], [196, 178], [352, 120], [430, 268], [318, 420],
  [412, 528], [556, 452], [520, 296], [648, 166], [762, 124], [812, 282],
  [700, 398], [886, 438],
];

const EXTRA_EDGES = [
  [0, 5], [1, 5], [2, 4], [3, 8], [4, 8], [5, 7],
  [7, 12], [8, 12], [9, 11], [10, 12], [11, 13],
];

const SAMPLES = 200;

function catmullRom(pts, seg = 18) {
  const p = [pts[0], ...pts, pts[pts.length - 1]];
  const out = [];
  for (let i = 1; i < p.length - 2; i++) {
    const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    for (let s = 0; s < seg; s++) {
      const t = s / seg;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 *
          (2 * p1[0] +
            (-p0[0] + p2[0]) * t +
            (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
            (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 *
          (2 * p1[1] +
            (-p0[1] + p2[1]) * t +
            (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
            (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function resample(pts, n) {
  const dist = [0];
  for (let i = 1; i < pts.length; i++) {
    dist.push(
      dist[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
    );
  }
  const total = dist[dist.length - 1] || 1;
  const out = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const target = (i / (n - 1)) * total;
    while (j < dist.length - 2 && dist[j + 1] < target) j++;
    const span = dist[j + 1] - dist[j] || 1;
    const t = (target - dist[j]) / span;
    out.push([
      pts[j][0] + (pts[j + 1][0] - pts[j][0]) * t,
      pts[j][1] + (pts[j + 1][1] - pts[j][1]) * t,
    ]);
  }
  return out;
}

function initThread() {
  const section = $(".chapter-thread");
  const svg = $(".thread-svg");
  const line = $(".thread-line");
  const edgeGroup = $(".thread-edges");
  const nodeGroup = $(".thread-nodes");
  const copies = $$(".thread-copy");
  const displace = $("#crayon feDisplacementMap");
  if (!section || !svg || !line) return;

  const NS = "http://www.w3.org/2000/svg";
  const from = resample(catmullRom(SCRIBBLE), SAMPLES);
  const walk = resample(NODES, SAMPLES);

  const setPoints = (t) => {
    let out = "";
    for (let i = 0; i < SAMPLES; i++) {
      out += `${(from[i][0] + (walk[i][0] - from[i][0]) * t).toFixed(1)},${(
        from[i][1] +
        (walk[i][1] - from[i][1]) * t
      ).toFixed(1)} `;
    }
    line.setAttribute("points", out.trim());
  };

  EXTRA_EDGES.forEach(([a, b]) => {
    const el = document.createElementNS(NS, "line");
    el.setAttribute("x1", NODES[a][0]);
    el.setAttribute("y1", NODES[a][1]);
    el.setAttribute("x2", NODES[b][0]);
    el.setAttribute("y2", NODES[b][1]);
    edgeGroup.appendChild(el);
  });

  const nodeEls = NODES.map(([x, y]) => {
    const el = document.createElementNS(NS, "circle");
    el.setAttribute("cx", x);
    el.setAttribute("cy", y);
    el.setAttribute("r", 9);
    nodeGroup.appendChild(el);
    return el;
  });

  line.setAttribute("pathLength", "1");
  line.style.strokeDasharray = "1 1";

  if (reduceMotion) {
    setPoints(1);
    line.style.strokeDashoffset = "0";
    line.style.strokeWidth = "3";
    if (displace) displace.setAttribute("scale", "0");
    gsap.set(edgeGroup.children, { opacity: 0.55 });
    gsap.set(nodeEls, { opacity: 1 });
    return;
  }

  setPoints(0);
  line.style.strokeDashoffset = "1";

  const state = { draw: 1, morph: 0 };

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.5,
    },
  });

  tl
    .to(
      state,
      {
        draw: 0,
        duration: 0.3,
        ease: "none",
        onUpdate: () => (line.style.strokeDashoffset = String(state.draw)),
      },
      0
    )
    .fromTo(
      copies[0],
      { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: 0.18, ease: "power2.out" },
      0.1
    )
    .to(copies[0], { opacity: 0, y: -22, duration: 0.12, ease: "none" }, 0.36)
    .to(
      state,
      {
        morph: 1,
        duration: 0.36,
        ease: "power1.inOut",
        onUpdate: () => setPoints(state.morph),
      },
      0.38
    )
    .to(line, { strokeWidth: 2.5, duration: 0.36, ease: "none" }, 0.38)
    .to(
      displace,
      { attr: { scale: 0 }, duration: 0.28, ease: "none" },
      0.38
    )
    .fromTo(
      copies[1],
      { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: 0.16, ease: "power2.out" },
      0.6
    )
    .to(edgeGroup.children, { opacity: 0.55, duration: 0.18, ease: "none" }, 0.66)
    .fromTo(
      nodeEls,
      { opacity: 0, scale: 0.2 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.16,
        stagger: 0.012,
        ease: "back.out(2)",
      },
      0.7
    )
    .to({}, { duration: 0.12 });
}

/* ══ Gallery stack — click / swipe / arrows to rotate ═════════════════ */

function initGalleryStack() {
  const root = $("#gallery-stack");
  if (!root) return;

  const cards = $$(".gallery-card", root);
  const hit = $(".gallery-hit", root);
  if (!cards.length || !hit) return;

  let order = cards.map((_, i) => i);
  let busy = false;

  const layout = () => {
    order.forEach((cardIndex, depth) => {
      const card = cards[cardIndex];
      const isFront = depth === 0;
      const offset = depth * 14;
      const scale = 1 - depth * 0.045;
      card.style.zIndex = String(cards.length - depth);
      card.style.opacity = depth > 3 ? "0" : String(1 - depth * 0.08);
      card.style.pointerEvents = isFront ? "auto" : "none";
      card.style.transform = `translate3d(${offset}px, ${offset}px, 0) scale(${scale})`;
    });
  };

  const advance = () => {
    if (busy || order.length < 2) return;
    busy = true;
    const frontIdx = order[0];
    const front = cards[frontIdx];

    if (reduceMotion) {
      order = [...order.slice(1), frontIdx];
      layout();
      busy = false;
      return;
    }

    front.style.transition = "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease";
    front.style.transform = "translate3d(-28%, -8%, 0) rotate(-8deg) scale(0.92)";
    front.style.opacity = "0";

    window.setTimeout(() => {
      order = [...order.slice(1), frontIdx];
      front.style.transition = "none";
      layout();
      // Force reflow so the next transition starts clean.
      void front.offsetWidth;
      front.style.transition = "";
      busy = false;
    }, 420);
  };

  layout();

  hit.addEventListener("click", (e) => {
    e.preventDefault();
    advance();
  });

  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
      e.preventDefault();
      advance();
    }
  });

  let touchX = null;
  root.addEventListener(
    "touchstart",
    (e) => {
      touchX = e.changedTouches[0]?.clientX ?? null;
    },
    { passive: true }
  );
  root.addEventListener(
    "touchend",
    (e) => {
      if (touchX == null) return;
      const dx = (e.changedTouches[0]?.clientX ?? touchX) - touchX;
      touchX = null;
      if (Math.abs(dx) > 40) advance();
    },
    { passive: true }
  );
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
initHero();
initThread();
initGalleryStack();
initVideo();

window.addEventListener("load", () => {
  setZoomOrigin();
  ScrollTrigger.refresh();
});

if (document.fonts?.ready) {
  document.fonts.ready.then(() => {
    setZoomOrigin();
    ScrollTrigger.refresh();
  });
}
