// Solar AI Analytics — site scripts

const CONTACT_EMAIL = "hello@solarai.app";

// Page language drives number/date formats and the messages generated below.
const ES = document.documentElement.lang.startsWith("es");
const LOCALE = ES ? "es-AU" : "en-AU";
const T = ES
  ? {
      onTarget: "▲ en objetivo", belowTarget: "▼ bajo objetivo",
      enterInputs: "Introduce energía, capacidad DC e irradiación para calcular.",
      revenueGap: (aud, t) => `≈ AUD ${aud} de ingresos por debajo del objetivo de ${t}% en este periodo.`,
      atTarget: "La planta está en o por encima del PR objetivo en este periodo.",
      prOver100: "Un PR superior al 100% suele indicar un problema del sensor de irradiancia o de los datos: conviene revisarlo.",
      mailSubject: "Consulta — Solar AI Analytics",
      mailFields: ["Nombre", "Email", "Empresa", "Tamaño del portfolio"],
      mailOpened: "Tu aplicación de correo debería abrirse con el mensaje listo para enviar.",
    }
  : {
      onTarget: "▲ on target", belowTarget: "▼ below target",
      enterInputs: "Enter energy, DC capacity and irradiation to calculate.",
      revenueGap: (aud, t) => `≈ AUD ${aud} of revenue below the ${t}% target for this period.`,
      atTarget: "The plant is at or above the target PR for this period.",
      prOver100: "PR above 100% usually points to an irradiance sensor or data issue — worth checking.",
      mailSubject: "Enquiry — Solar AI Analytics",
      mailFields: ["Name", "Email", "Company", "Portfolio size"],
      mailOpened: "Your email app should open with the message ready to send.",
    };

document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Mobile nav ----------
const toggle = document.querySelector(".nav-toggle");
const links = document.getElementById("nav-links");
toggle.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});
links.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  })
);

// ---------- Demo dashboard (synthetic data) ----------
const fmt = (n, d = 1) => n.toLocaleString(LOCALE, { minimumFractionDigits: d, maximumFractionDigits: d });

function seededRandom(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function buildDemoData() {
  const rand = seededRandom(42);
  const capacityKwp = 100000; // 100 MWp fictional plant
  const days = [];
  const start = new Date(2026, 0, 1);
  for (let i = 0; i < 30; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const cloudy = rand() < 0.2;
    const irr = cloudy ? 3 + rand() * 3 : 7 + rand() * 1.8; // kWh/m² per day
    let pr = 0.83 + (rand() - 0.5) * 0.03;
    if (i >= 12 && i <= 15) pr -= 0.06; // simulated inverter fault
    if (cloudy) pr += 0.01;
    const energyMwh = (capacityKwp * irr * pr) / 1000;
    days.push({ date, irr, pr, energyMwh });
  }
  return { capacityKwp, days };
}

const TARGET_PR = 0.8;

function renderDemo() {
  const { capacityKwp, days } = buildDemoData();
  const totalE = days.reduce((s, d) => s + d.energyMwh, 0);
  const totalRef = days.reduce((s, d) => s + (capacityKwp * d.irr) / 1000, 0);
  const avgPr = totalE / totalRef;
  const below = days.filter((d) => d.pr < TARGET_PR).length;
  const lost = days.reduce((s, d) => s + Math.max(0, ((TARGET_PR - d.pr) * capacityKwp * d.irr) / 1000), 0);

  document.getElementById("kpi-pr").textContent = fmt(avgPr * 100) + "%";
  document.getElementById("kpi-below").textContent = below + " / " + days.length;
  document.getElementById("kpi-energy").textContent = fmt(totalE / 1000, 2) + " GWh";
  document.getElementById("kpi-lost").textContent = fmt(lost, 0) + " MWh";

  const tbody = document.querySelector("#pr-table tbody");
  tbody.innerHTML = days
    .map((d) => `<tr><td>${d.date.toLocaleDateString(LOCALE, { day: "2-digit", month: "short" })}</td><td>${fmt(d.irr, 2)}</td><td>${fmt(d.energyMwh, 0)}</td><td>${fmt(d.pr * 100)}%</td></tr>`)
    .join("");

  drawChart(days);
  window.addEventListener("resize", () => drawChart(days));
}

function drawChart(days) {
  const svg = document.getElementById("pr-chart");
  const tip = document.getElementById("chart-tip");
  const W = svg.clientWidth || 800;
  const H = 300;
  const m = { top: 12, right: 8, bottom: 26, left: 40 };
  const iw = W - m.left - m.right;
  const ih = H - m.top - m.bottom;
  const yMin = 0.6, yMax = 0.9;
  const y = (v) => m.top + ih - ((v - yMin) / (yMax - yMin)) * ih;
  const slot = iw / days.length;
  const bw = Math.max(3, slot - 2); // 2px gap between bars
  const ns = "http://www.w3.org/2000/svg";

  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = "";
  const el = (tag, attrs) => {
    const e = document.createElementNS(ns, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    svg.appendChild(e);
    return e;
  };

  for (let v = yMin; v <= yMax + 1e-9; v += 0.05) {
    el("line", { class: "grid-line", x1: m.left, x2: W - m.right, y1: y(v), y2: y(v) });
    el("text", { class: "axis-text", x: m.left - 6, y: y(v) + 4, "text-anchor": "end" }).textContent = Math.round(v * 100) + "%";
  }

  const labelEvery = W < 500 ? 7 : 5;
  const bars = days.map((d, i) => {
    const x = m.left + i * slot + (slot - bw) / 2;
    const top = y(Math.max(yMin, d.pr));
    const h = y(yMin) - top;
    const r = Math.min(4, bw / 2, h);
    // Rounded top, square base
    const path = `M${x},${y(yMin)} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${y(yMin)} Z`;
    const bar = el("path", { class: "bar", d: path });
    if (i % labelEvery === 0) {
      el("text", { class: "axis-text", x: x + bw / 2, y: H - 8, "text-anchor": "middle" }).textContent =
        d.date.toLocaleDateString(LOCALE, { day: "numeric", month: "short" });
    }
    return bar;
  });

  el("line", { class: "target", x1: m.left, x2: W - m.right, y1: y(TARGET_PR), y2: y(TARGET_PR) });

  days.forEach((d, i) => {
    const hit = el("rect", { class: "hit", x: m.left + i * slot, y: m.top, width: slot, height: ih });
    const show = () => {
      bars.forEach((b, j) => b.classList.toggle("dim", j !== i));
      const ok = d.pr >= TARGET_PR;
      tip.innerHTML = `<b>${d.date.toLocaleDateString(LOCALE, { weekday: "short", day: "numeric", month: "short" })}</b>
        PR ${fmt(d.pr * 100)}% <span class="${ok ? "status-good" : "status-bad"}">${ok ? T.onTarget : T.belowTarget}</span><br>
        ${fmt(d.energyMwh, 0)} MWh · ${fmt(d.irr, 2)} kWh/m²`;
      tip.hidden = false;
      const px = ((m.left + (i + 0.5) * slot) / W) * svg.clientWidth;
      const py = (y(Math.max(yMin, d.pr)) / H) * svg.clientHeight;
      tip.style.left = Math.min(Math.max(px, 90), svg.clientWidth - 90) + "px";
      tip.style.top = py + "px";
    };
    hit.addEventListener("mouseenter", show);
    hit.addEventListener("click", show);
  });
  svg.onmouseleave = () => {
    tip.hidden = true;
    bars.forEach((b) => b.classList.remove("dim"));
  };
}

renderDemo();

// ---------- PR calculator ----------
const $ = (id) => document.getElementById(id);
const num = (id) => parseFloat($(id).value);

function calculate() {
  const eMwh = num("c-energy");
  const capKwp = num("c-cap");
  const irr = num("c-irr");
  const temp = num("c-temp");
  const gamma = num("c-gamma") / 100;
  const target = num("c-target") / 100;
  const price = num("c-price");
  const out = ["r-pr", "r-prc", "r-yield", "r-gap"];

  if (!(eMwh >= 0) || !(capKwp > 0) || !(irr > 0)) {
    out.forEach((id) => ($(id).textContent = "–"));
    $("r-msg").textContent = T.enterInputs;
    return;
  }

  const refEnergyKwh = capKwp * irr; // P_STC × H_POA / (1 kW/m²)
  const pr = (eMwh * 1000) / refEnergyKwh;
  const specificYield = (eMwh * 1000) / capKwp;
  $("r-pr").textContent = fmt(pr * 100) + "%";
  $("r-yield").textContent = fmt(specificYield, 0) + " kWh/kWp";

  const ck = 1 + gamma * (temp - 25);
  $("r-prc").textContent = Number.isFinite(ck) && ck > 0 ? fmt((pr / ck) * 100) + "%" : "–";

  if (target > 0) {
    const gapMwh = ((target - pr) * refEnergyKwh) / 1000;
    $("r-gap").textContent = (gapMwh > 0 ? "−" : "+") + fmt(Math.abs(gapMwh), 0) + " MWh";
    if (gapMwh > 0 && price > 0) {
      $("r-msg").textContent = T.revenueGap(fmt(gapMwh * price, 0), fmt(target * 100));
    } else if (gapMwh <= 0) {
      $("r-msg").textContent = T.atTarget;
    } else {
      $("r-msg").textContent = "";
    }
  } else {
    $("r-gap").textContent = "–";
    $("r-msg").textContent = "";
  }
  if (pr > 1) $("r-msg").textContent = T.prOver100;
}

$("pr-form").addEventListener("input", calculate);
$("pr-form").addEventListener("submit", (e) => e.preventDefault());
calculate();

// ---------- Contact form (opens the visitor's email client) ----------
$("contact-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  if (!f.reportValidity()) return;
  const data = new FormData(f);
  const [n, em, co, sz] = T.mailFields;
  const body = `${n}: ${data.get("name")}\n${em}: ${data.get("email")}\n${co}: ${data.get("company")}\n${sz}: ${data.get("size")}\n\n${data.get("message")}`;
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(T.mailSubject)}&body=${encodeURIComponent(body)}`;
  $("contact-msg").textContent = T.mailOpened;
});
