// Sin servidor, la versión estática conserva la publicación de Mercado Libre.
const config = {
  price: 20000,
  max: 40,
  cartKey: "envy-static-cart-v1",
  themeKey: "envy-static-theme-v1",
};
const money = (value) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
document.querySelector("#unit-price").textContent = money(config.price) + " ARS";
const read = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const save = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
};
let quantity = Number(read(config.cartKey)) || 0;
quantity = Number.isInteger(quantity)
  ? Math.min(config.max, Math.max(0, quantity))
  : 0;
const cart = document.querySelector("#cart");
let lastFocus;
function openDialog(dialog) {
  lastFocus = document.activeElement;
  dialog.showModal();
  document.body.style.overflow = "hidden";
}
document.querySelectorAll("dialog").forEach((dialog) =>
  dialog.addEventListener("close", () => {
    document.body.style.overflow = "";
    lastFocus?.focus();
  }),
);
let direct = false;
let priceFor = () => config.price;
function renderCart() {
  document.querySelector("#count").textContent = quantity;
  save(config.cartKey, String(quantity));
  document.querySelector("#cart-body").innerHTML = quantity
    ? `<div class="cart-line"><img src="assets/a-tag-kit.png" alt="A Tag con llavero"><div><h3>A Tag</h3><p>${money(priceFor(quantity))} por unidad</p></div></div><div class="quantity"><button id="minus" aria-label="Quitar una unidad">−</button><span>${quantity} ${quantity === 1 ? "unidad" : "unidades"}</span><button id="plus" aria-label="Agregar una unidad" ${quantity >= config.max ? "disabled" : ""}>+</button></div><div class="total"><span>${direct ? "Total del pedido" : "Total de referencia"}</span><strong>${money(quantity * priceFor(quantity))}</strong></div>`
    : "<p>Tu selección está vacía. Elegí un A Tag para empezar.</p>";
  const checkout = document.querySelector("#checkout");
  checkout.hidden = !quantity;
  if (direct) checkout.href = "checkout.html?unidades=" + quantity;
  document.querySelector("#minus")?.addEventListener("click", () => {
    quantity--;
    renderCart();
    (
      document.querySelector("#minus") || document.querySelector("#cart-close")
    ).focus();
  });
  document.querySelector("#plus")?.addEventListener("click", () => {
    quantity = Math.min(config.max, quantity + 1);
    renderCart();
    (quantity === config.max
      ? document.querySelector("#minus")
      : document.querySelector("#plus")
    ).focus();
  });
}
function renderPacks() {
 document.querySelector("#packs").innerHTML = (direct ? [1, 6, 15] : [1, 2, 4])
  .map((units) => {
    const label = units === 1 ? "1 unidad" : units + " unidades";
    return `<article class="pack">
      <h3>${label}</h3>
      <div class="pack-price">${money(units * priceFor(units))} <small>ARS</small></div>
      <p>${direct ? money(priceFor(units)) + " por unidad" : "Total de referencia"}</p>
      <button class="button secondary" data-add="${units}" ${direct && units>config.max ? "disabled" : ""}>Sumar ${label} al carrito</button>
    </article>`;
  })
  .join("");
document.querySelectorAll("[data-add]").forEach((button) =>
  button.addEventListener("click", () => {
    quantity = Math.min(config.max, quantity + Number(button.dataset.add));
    renderCart();
    openDialog(cart);
  }),
);
}
renderPacks();
document
  .querySelector("#cart-open")
  .addEventListener("click", () => openDialog(cart));
document
  .querySelector("#cart-close")
  .addEventListener("click", () => cart.close());
document
  .querySelector("#privacy-open")
  .addEventListener("click", () =>
    openDialog(document.querySelector("#privacy")),
  );
document
  .querySelector("#privacy-close")
  .addEventListener("click", () => document.querySelector("#privacy").close());
const theme = document.querySelector("#theme");
function setTheme(dark) {
  document.body.classList.toggle("dark", dark);
  theme.setAttribute("aria-pressed", String(dark));
  theme.title = dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
  save(config.themeKey, dark ? "dark" : "light");
}
setTheme(read(config.themeKey) === "dark");
theme.addEventListener("click", () =>
  setTheme(!document.body.classList.contains("dark")),
);
// Tutorial con voz: se reproduce solo cuando la persona lo elige.
const guide = document.querySelector("#guide-video");
const chapters = document.querySelector(".chapters");
const chapterButtons = Array.from(chapters.querySelectorAll("button"));
chapters.hidden = false;
for (const button of chapterButtons) {
  button.addEventListener("click", () => {
    guide.currentTime = Number(button.dataset.start);
    guide.play().catch(() => {});
    guide.focus({ preventScroll: true });
    guide.scrollIntoView({ block: "nearest" });
  });
}
guide.addEventListener("timeupdate", () => {
  const current = chapterButtons.filter((button) =>
    Number(button.dataset.start) <= guide.currentTime).pop();
  for (const button of chapterButtons) {
    if (button === current) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  }
});

const states = [
  "Tu A Tag, listo para conectar",
  "A Tag asociado a tu mochila · Demo",
  "Ubicación disponible · Demo",
];
document.querySelectorAll("[data-step]").forEach((button) =>
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-step]").forEach((item) => {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
    document.querySelector("#demo-state").textContent =
      states[Number(button.dataset.step)];
    document
      .querySelector(".radar")
      .classList.toggle("locating", button.dataset.step === "2");
  }),
);
// Progressive enhancement: content remains visible if JavaScript or this API is unavailable.
if (
  "IntersectionObserver" in window &&
  !matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  document.body.classList.add("motion-ready");
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.08 },
  );
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}
document.querySelector("#year").textContent = new Date().getFullYear();
renderCart();

async function enableDirectStore() {
  try {
    const shop = await (window.envyShop ||
      fetch("/api/tienda", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)));
    if (!shop) return;
    // Primero el botón de la portada, sin esperar al catálogo.
    const primary = document.querySelector(".hero-buy .button");
    const checkout = document.querySelector("#checkout");
    for (const link of [primary,checkout]) {
      link.href = "checkout.html";
      link.removeAttribute("target");
      link.removeAttribute("data-event");
      link.textContent = "Comprar en ENVY";
    }
    document.querySelector(".hero-buy p").textContent = shop.stock
      ? "Retirá en Santos Lugares o recibí tu A Tag sin cargo en CABA."
      : "A Tag agotado para venta directa.";
    const catalog = await import("./catalog.mjs");
    direct = true;
    priceFor = catalog.unitPrice;
    config.max = shop.stock;
    quantity = Math.min(quantity, shop.stock);
    document.querySelector("#cart .fine").textContent = "El precio por unidad se calcula según la cantidad. Elegí entrega y pago al continuar.";
    renderPacks();
    renderCart();
  } catch { /* La publicación externa sigue disponible en el alojamiento estático. */ }
}
if (location.protocol.startsWith("http") || window.envyShop) enableDirectStore();

// ===== Movimiento del A Tag =====
// Cuadros transparentes del giro real (assets/tag/giro-00 … giro-52): 00 es el frente en
// leve ángulo, 13 el canto y 52 el reverso. Se dibujan en canvas, sin video ni controles.
const motionAllowed = !matchMedia("(prefers-reduced-motion: reduce)").matches;
const FRAME_LAST = 52;
const EDGE_FRAME = 13;
const frames = [];
function loadFrame(i) {
  if (!frames[i]) {
    const image = new Image();
    image.decoding = "async";
    image.src = `assets/tag/giro-${String(i).padStart(2, "0")}.webp`;
    frames[i] = {
      image,
      ok: false,
      ready: (image.decode ? image.decode() : new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      })).then(() => (frames[i].ok = true), () => false),
    };
  }
  return frames[i].ready;
}
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const span = (p, from, to) => clamp((p - from) / (to - from));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const lerp = (a, b, t) => a + (b - a) * t;

// Dibuja una posición del giro; entre dos cuadros funde ambos para que el movimiento sea continuo.
function drawFrame(ctx, position) {
  const index = clamp(position, 0, FRAME_LAST);
  const a = Math.floor(index);
  const b = Math.min(FRAME_LAST, a + 1);
  const t = index - a;
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, 560, 560);
  const fa = frames[a];
  const fb = frames[b];
  if (fa?.ok) ctx.drawImage(fa.image, 0, 0, 560, 560);
  if (t > 0.02 && fb?.ok) {
    ctx.globalAlpha = t;
    ctx.drawImage(fb.image, 0, 0, 560, 560);
    ctx.globalAlpha = 1;
  }
  return Boolean(fa?.ok);
}
// Reflejo de luz que recorre solo la superficie del producto.
function sheen(ctx, at, strength = 0.7) {
  if (at <= 0 || at >= 1) return;
  const x = lerp(-160, 720, at);
  const band = ctx.createLinearGradient(x - 140, x - 260, x + 140, x + 260);
  band.addColorStop(0, "rgba(255,255,255,0)");
  band.addColorStop(0.5, `rgba(255,255,255,${strength})`);
  band.addColorStop(1, "rgba(255,255,255,0)");
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = band;
  ctx.fillRect(0, 0, 560, 560);
  ctx.globalCompositeOperation = "source-over";
}
// Revela el producto de arriba-izquierda hacia abajo-derecha, como si lo alcanzara el reflejo.
function reveal(ctx, at) {
  const x = lerp(-200, 760, at);
  const mask = ctx.createLinearGradient(x - 240, x - 240, x + 40, x + 40);
  mask.addColorStop(0, "rgba(0,0,0,1)");
  mask.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, 560, 560);
  ctx.globalCompositeOperation = "source-over";
}

// --- Portada: el reflejo del emblema revela el canto blanco y el A Tag gira hasta su mejor ángulo.
(function heroTag() {
  const world = document.querySelector(".tag-world");
  const canvas = document.querySelector(".tag-canvas");
  if (!world || !canvas || !motionAllowed || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const withIntro = document.documentElement.classList.contains("intro");
  const glint = document.querySelector(".emblem-glint");
  const cssStart = glint?.getAnimations?.()[0]?.startTime;
  const start = withIntro && typeof cssStart === "number" ? cssStart : performance.now();
  const revealAt = withIntro ? 1000 : 0;
  const revealFor = withIntro ? 460 : 260;
  const turnFor = 1250;
  const needed = [];
  for (let i = 0; i <= EDGE_FRAME; i++) needed.push(loadFrame(i));
  Promise.all(needed).then(() => {
    if (!frames[0].ok || !frames[EDGE_FRAME].ok) {
      world.querySelector(".tag-still").style.opacity = 1;
      return;
    }
    let shift = 0;
    const late = performance.now() - (start + revealAt);
    if (late > 0) shift = late; // si los cuadros llegaron tarde, la secuencia arranca cuando están listos
    world.classList.add("is-live");
    function tick(now) {
      const t = now - start - shift;
      const r = clamp((t - revealAt) / revealFor);
      const turn = clamp((t - revealAt - revealFor) / turnFor);
      drawFrame(ctx, lerp(EDGE_FRAME, 0, easeOut(turn)));
      if (r < 1) {
        reveal(ctx, easeOut(r));
        sheen(ctx, r, 0.85);
      }
      if (turn < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
})();

// --- Recorrido: el producto queda en su lugar y el scroll cambia la vista.
(function productTour() {
  const tour = document.querySelector(".tour");
  if (!tour || !motionAllowed) return;
  const canvas = tour.querySelector(".tour-canvas");
  const world = tour.querySelector(".tour-world");
  const key = tour.querySelector(".tour-key");
  const visual = tour.querySelector(".tour-visual");
  const sticky = tour.querySelector(".tour-sticky");
  const steps = Array.from(tour.querySelectorAll(".tour-step"));
  if (!canvas?.getContext) return;
  const ctx = canvas.getContext("2d");
  const header = document.querySelector("header");
  let started = false;

  function start() {
    if (started) return;
    started = true;
    const all = [];
    for (let i = 0; i <= FRAME_LAST; i++) all.push(loadFrame(i));
    loadFrame(0).then((ok) => {
      if (!ok) return;
      tour.classList.add("is-motion");
      measure();
      render();
    });
    Promise.all(all).then(render);
  }
  // Empieza a cargar cuando falta poco para llegar al recorrido.
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); start(); }
    }, { rootMargin: "120% 0px" });
    io.observe(tour);
  } else start();

  let W = 0, H = 0, headerH = 88;
  function measure() {
    headerH = header ? header.offsetHeight : 88;
    tour.style.setProperty("--header-h", headerH + "px");
    W = visual.clientWidth;
    H = visual.clientHeight;
  }
  // Encuadres en coordenadas del cuadro (560 × 560).
  const views = () => {
    const disc = Math.min(W, H) / 560;
    return {
      disc: { x: 280, y: 284, z: disc * 0.9 },
      detail: { x: 236, y: 214, z: disc * 1.18 },
      // disco + llavero completo: x 15–1329, y −681–560
      kit: { x: 672, y: -61, z: Math.min(W / 1314, H / 1241) * 0.92 },
    };
  };
  const mix = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t) });

  let pending = false;
  function render() {
    pending = false;
    if (!tour.classList.contains("is-motion")) return;
    const total = tour.offsetHeight - sticky.offsetHeight;
    const p = clamp((headerH - tour.getBoundingClientRect().top) / Math.max(1, total));
    const v = views();
    // Cuadro del giro: frente → reverso, detalle de las flechas, y vuelta al frente para el llavero.
    let frame = 0;
    if (p < 0.5) frame = lerp(0, FRAME_LAST, easeInOut(span(p, 0.2, 0.5)));
    else if (p < 0.62) frame = FRAME_LAST;
    else frame = lerp(FRAME_LAST, 0, easeInOut(span(p, 0.62, 0.74)));
    // Cámara
    let cam = v.disc;
    if (p >= 0.5 && p < 0.62) cam = mix(v.disc, v.detail, easeInOut(span(p, 0.5, 0.6)));
    else if (p >= 0.62 && p < 0.74) cam = mix(v.detail, v.disc, easeInOut(span(p, 0.62, 0.7)));
    else if (p >= 0.74) cam = mix(v.disc, v.kit, easeInOut(span(p, 0.74, 0.9)));
    world.style.transform = `translate(${W / 2 - cam.x * cam.z}px, ${H / 2 - cam.y * cam.z}px) scale(${cam.z})`;
    // Llavero: aparece alrededor del mismo disco y lo reemplaza.
    const k = span(p, 0.76, 0.9);
    key.style.opacity = k > 0 ? 1 : 0;
    key.style.setProperty("--reveal", (k * 140).toFixed(1) + "%");
    canvas.style.opacity = String(1 - span(p, 0.86, 0.92));
    if (drawFrame(ctx, frame) && p < 0.2) sheen(ctx, span(p, 0.03, 0.19), 0.55);
    // Texto del paso activo
    const active = p < 0.3 ? 0 : p < 0.7 ? 1 : 2;
    const bounds = [[0, 0.3], [0.3, 0.7], [0.7, 1]];
    steps.forEach((step, i) => {
      step.classList.toggle("is-active", i === active);
      step.style.setProperty("--fill", String(span(p, bounds[i][0], bounds[i][1])));
    });
  }
  const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(render); } };
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", () => { measure(); schedule(); });
})();
