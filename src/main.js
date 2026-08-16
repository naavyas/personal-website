import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Update this to your real data-art repo URL */
const GITHUB_REPO = "https://github.com/naavyasethi";

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

document.querySelectorAll("#github-link, #github-work, #github-contact").forEach((el) => {
  el.setAttribute("href", GITHUB_REPO);
});

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setZoomOrigin() {
  const zoom = document.querySelector(".intro-zoom");
  const accent = document.querySelector("#zoom-a");
  if (!zoom || !accent) return;

  const z = zoom.getBoundingClientRect();
  const a = accent.getBoundingClientRect();
  const ox = ((a.left + a.width / 2 - z.left) / z.width) * 100;
  const oy = ((a.top + a.height / 2 - z.top) / z.height) * 100;
  zoom.style.transformOrigin = `${ox}% ${oy}%`;
}

function initIntro() {
  const section = document.querySelector(".chapter-intro");
  const zoom = document.querySelector(".intro-zoom");
  const accent = document.querySelector("#zoom-a");
  const chars = gsap.utils.toArray(".intro-line .char");
  const otherChars = chars.filter((c) => c !== accent);
  const helloWords = gsap.utils.toArray('.intro-line .word:not(.name)');
  const reveal = document.querySelector(".intro-reveal");
  const eyebrow = document.querySelector(".eyebrow");

  if (!section || !zoom || !accent) return;

  setZoomOrigin();
  window.addEventListener("resize", setZoomOrigin);

  if (reduceMotion) {
    gsap.set(accent, { color: "#14b8a6" });
    gsap.set(reveal, { opacity: 1 });
    gsap.set(zoom, { opacity: 0 });
    return;
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "+=300%",
      scrub: 0.65,
      pin: true,
      anticipatePin: 1,
      onRefresh: setZoomOrigin,
    },
  });

  tl.to(eyebrow, { opacity: 0, duration: 0.3 }, 0)
    .to(
      zoom,
      {
        scale: 18,
        duration: 1.5,
        ease: "none",
      },
      0.1
    )
    .to(helloWords, { opacity: 0, duration: 0.35 }, 0.15)
    .to(
      otherChars,
      {
        opacity: 0,
        duration: 0.5,
        stagger: 0.015,
      },
      0.2
    )
    .to(
      accent,
      {
        color: "#14b8a6",
        duration: 0.55,
      },
      0.3
    )
    .to(
      accent,
      {
        textShadow: "0 0 60px rgba(20,184,166,0.65)",
        duration: 0.4,
      },
      0.55
    )
    .to(zoom, { opacity: 0, duration: 0.35 }, 1.05)
    .fromTo(
      reveal,
      { opacity: 0, y: 36 },
      { opacity: 1, y: 0, duration: 0.5 },
      1.15
    )
    .to({}, { duration: 0.4 });
}

function initBridge() {
  const lead = document.querySelector(".bridge-lead");
  const sub = document.querySelector(".bridge-sub");
  const link = document.querySelector(".chapter-bridge .text-link");
  if (!lead || reduceMotion) return;

  gsap.from([lead, sub, link], {
    y: 48,
    opacity: 0,
    duration: 1,
    stagger: 0.12,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".chapter-bridge",
      start: "top 70%",
      toggleActions: "play none none reverse",
    },
  });
}

function initGallery() {
  const section = document.querySelector(".chapter-gallery");
  const pin = document.querySelector(".gallery-pin");
  const slides = gsap.utils.toArray(".gallery-slide");
  const bar = document.querySelector(".gallery-progress-bar");
  const video = section?.querySelector("video");

  if (!section || !pin || slides.length === 0) return;

  if (reduceMotion) {
    slides.forEach((s, i) => s.classList.toggle("is-active", i === 0));
    return;
  }

  slides.forEach((slide, i) => {
    gsap.set(slide, {
      opacity: i === 0 ? 1 : 0,
      visibility: i === 0 ? "visible" : "hidden",
      scale: i === 0 ? 1 : 1.08,
    });
    slide.classList.toggle("is-active", i === 0);
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => `+=${slides.length * 125}%`,
      scrub: 0.6,
      pin: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        if (bar) bar.style.width = `${self.progress * 100}%`;
        if (!video) return;
        if (self.progress > 0.78) {
          if (video.paused) video.play().catch(() => {});
        } else if (!video.paused) {
          video.pause();
        }
      },
    },
  });

  slides.forEach((slide, i) => {
    if (i === 0) return;
    const prev = slides[i - 1];
    const at = (i - 1) * 0.95 + 0.15;

    tl.to(
      prev,
      {
        opacity: 0,
        scale: 1.12,
        duration: 0.9,
        ease: "none",
        onStart: () => prev.classList.remove("is-active"),
        onReverseComplete: () => prev.classList.add("is-active"),
      },
      at
    ).fromTo(
      slide,
      { opacity: 0, scale: 1.06, visibility: "visible" },
      {
        opacity: 1,
        scale: 1,
        duration: 0.9,
        ease: "none",
        onStart: () => slide.classList.add("is-active"),
        onReverseComplete: () => {
          slide.classList.remove("is-active");
          gsap.set(slide, { visibility: "hidden" });
        },
      },
      at
    );
  });

  tl.to({}, { duration: 0.5 });
}

function initClose() {
  if (reduceMotion) return;
  const line = document.querySelector(".close-line");
  const sub = document.querySelector(".close-sub");
  const btn = document.querySelector(".chapter-close .btn");
  if (!line) return;

  gsap.from([line, sub, btn], {
    y: 56,
    opacity: 0,
    duration: 1.05,
    stagger: 0.14,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".chapter-close",
      start: "top 65%",
      toggleActions: "play none none reverse",
    },
  });
}

function initAbout() {
  if (reduceMotion) return;
  gsap.from(".about-copy > *, .about-aside > *", {
    y: 36,
    opacity: 0,
    duration: 0.9,
    stagger: 0.08,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".chapter-about",
      start: "top 75%",
      toggleActions: "play none none reverse",
    },
  });
}

initIntro();
initBridge();
initGallery();
initClose();
initAbout();

window.addEventListener("load", () => {
  setZoomOrigin();
  ScrollTrigger.refresh();
});
