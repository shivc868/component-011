import "./style.css";
import { gsap } from "gsap";

const images = [...document.querySelectorAll(".stack-image")];
const COUNT = images.length;
const CENTER_INDEX = 2;

const GAP = 30;
const STEP_DURATION = 2.5;
const EASE = "elastic.out(1, 0.75)";
const GESTURE_GAP = 100;
const MIN_STEP_INTERVAL = 140;

let stepSize = 0;
const state = { pos: 0 };
let target = 0;

const PROJECTS = [
  {
    title: "Common Ground",
    category: "Workplace culture",
    desc: "A workspace identity built around the rituals of a team that grew from four desks to forty.",
    url: "https://madeforaward.com/collections",
  },
  {
    title: "Daily Sync",
    category: "Product design",
    desc: "An interface system for standups that respect deep work — fewer meetings, sharper signals.",
    url: "https://madeforaward.com/collections",
  },
  {
    title: "Open Studio",
    category: "Brand identity",
    desc: "A living brand for a studio where clients sit at the same table as the team that builds for them.",
    url: "https://madeforaward.com/collections",
  },
  {
    title: "War Room",
    category: "Digital strategy",
    desc: "Campaign tooling for the sprints that matter — one room, one board, every decision visible.",
    url: "https://madeforaward.com/collections",
  },
  {
    title: "Third Space",
    category: "Spatial design",
    desc: "An office that behaves like a neighbourhood café — designed for the conversations in between.",
    url: "https://madeforaward.com/collections",
  },
];

const titleEl = document.querySelector('[data-meta="title"]');
const categoryEl = document.querySelector('[data-meta="category"]');
const numEl = document.querySelector('[data-meta="num"]');
const descEl = document.querySelector('[data-meta="desc"]');

const projectAt = (slot) => (((CENTER_INDEX + slot) % COUNT) + COUNT) % COUNT;

function setMetaText(i) {
  const p = PROJECTS[i];
  titleEl.textContent = p.title;
  categoryEl.textContent = p.category;
  numEl.textContent = String(i + 1).padStart(2, "0");
  descEl.textContent = p.desc;
}

const maskedEls = [titleEl, categoryEl, numEl];
let displayedSlot = 0;

function renderMeta() {
  const nearest = Math.round(state.pos);
  const d = state.pos - nearest;

  if (nearest !== displayedSlot) {
    displayedSlot = nearest;
    setMetaText(projectAt(nearest));
  }

  gsap.set(maskedEls, { yPercent: -d * 230 });
  gsap.set(descEl, {
    autoAlpha: 1 - Math.min(1, Math.abs(d) * 2),
    y: -d * 30,
  });
}

function measure() {
  stepSize = images[0].offsetHeight + GAP;
}

function wrapOffset(x) {
  let w = ((x % COUNT) + COUNT) % COUNT;
  if (w > COUNT / 2) w -= COUNT;
  return w;
}

function render() {
  images.forEach((el, i) => {
    const off = wrapOffset(i - CENTER_INDEX - state.pos);
    gsap.set(el, {
      xPercent: -50,
      yPercent: -50,
      y: off * stepSize,
      rotation: -8 * Math.cos(Math.PI * off),
      zIndex: 100 - Math.round(Math.abs(off) * 20),
    });
    el.classList.toggle("is-active", Math.abs(off) < 0.5);
  });

  renderMeta();
}

function goTo(t) {
  target = t;
  gsap.to(state, {
    pos: target,
    duration: STEP_DURATION,
    ease: EASE,
    overwrite: true,
    onUpdate: render,
  });
}

let lastStepTime = 0;

function step(dir) {
  const now = performance.now();
  if (now - lastStepTime < MIN_STEP_INTERVAL) return;
  lastStepTime = now;
  goTo(target + dir);
}

const RETRIGGER_RATIO = 1.4;
const RETRIGGER_MIN_DELTA = 50;
const RETRIGGER_COOLDOWN = 250;

let lastWheelTime = 0;
let lastAbsDelta = 0;
let lastDir = 0;

window.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const now = performance.now();
    const abs = Math.abs(e.deltaY);
    const dir = e.deltaY > 0 ? 1 : -1;
    const gap = now - lastWheelTime;
    lastWheelTime = now;

    if (abs < 4) return;

    const isNewGesture =
      gap > GESTURE_GAP ||
      (dir !== lastDir && lastDir !== 0 && abs >= 10) ||
      (abs > lastAbsDelta * RETRIGGER_RATIO &&
        abs >= RETRIGGER_MIN_DELTA &&
        now - lastStepTime > RETRIGGER_COOLDOWN);

    lastAbsDelta = abs;

    if (isNewGesture) {
      lastDir = dir;
      step(dir);
    }
  },
  { passive: false },
);

let touchStartY = null;

window.addEventListener(
  "touchstart",
  (e) => {
    touchStartY = e.touches[0].clientY;
  },
  { passive: true },
);

window.addEventListener("touchend", (e) => {
  if (touchStartY === null) return;
  const delta = touchStartY - e.changedTouches[0].clientY;
  if (Math.abs(delta) > 40) step(delta > 0 ? 1 : -1);
  touchStartY = null;
});

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") step(1);
  if (e.key === "ArrowUp") step(-1);
});

images.forEach((el, i) => {
  el.addEventListener("click", () => {
    const off = wrapOffset(i - CENTER_INDEX - state.pos);
    if (Math.abs(off) < 0.5) {
      window.open(PROJECTS[i].url, "_blank");
    } else {
      goTo(target + Math.round(off));
    }
  });
});

document.querySelector(".project-title").addEventListener("click", () => {
  window.open(PROJECTS[projectAt(displayedSlot)].url, "_blank");
});

window.addEventListener("resize", () => {
  measure();
  render();
});

measure();
setMetaText(projectAt(0));
render();
gsap.set(images, { autoAlpha: 1 });
