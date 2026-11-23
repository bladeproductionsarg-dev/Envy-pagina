// Sin servidor, la versión estática conserva la publicación de Mercado Libre.
const config = {
  price: 20000,
  max: 40,
  cartKey: "envy-static-cart-v1",
};
const money = (value) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
const unitPrice = document.querySelector("#unit-price");
if (unitPrice) unitPrice.textContent = money(config.price) + " ARS";
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
    ? `<div class="cart-line"><img src="assets/a-tag-carrito.webp" width="300" height="300" alt="A Tag con llavero"><div><h3>A Tag</h3><p>${money(priceFor(quantity))} por unidad</p></div></div><div class="quantity"><button id="minus" aria-label="Quitar una unidad">−</button><span>${quantity} ${quantity === 1 ? "unidad" : "unidades"}</span><button id="plus" aria-label="Agregar una unidad" ${quantity >= config.max ? "disabled" : ""}>+</button></div><div class="total"><span>${direct ? "Total del pedido" : "Total de referencia"}</span><strong>${money(quantity * priceFor(quantity))}</strong></div>`
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
 const packs = document.querySelector("#packs");
 if (!packs) return; // solo la tienda tiene paquetes
 packs.innerHTML = (direct ? [1, 6, 15] : [1, 2, 4])
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
// El <head> ya aplicó el tema antes de pintar; acá solo se sincroniza el botón y se guarda una elección explícita.
function showTheme(dark) {
  document.documentElement.classList.toggle("dark", dark);
  theme.setAttribute("aria-pressed", String(dark));
  theme.setAttribute("aria-label", dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
  theme.title = dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
}
showTheme(document.documentElement.classList.contains("dark"));
theme.addEventListener("click", () => {
  const dark = !document.documentElement.classList.contains("dark");
  showTheme(dark);
  save("envy-theme", dark ? "dark" : "light");
});
// Tutorial con voz: se reproduce solo cuando la persona lo elige.
const guide = document.querySelector("#guide-video");
if (guide) {
const guidePlay = document.querySelector(".guide .guide-play");
// Antes de empezar: portada limpia con un botón integrado. Al reproducir aparecen los
// controles del navegador (pausa, subtítulos, pantalla completa). Sin JS quedan los controles nativos.
if (guidePlay) {
  guide.controls = false;
  guidePlay.hidden = false;
  guidePlay.addEventListener("click", () => {
    guide.play().catch(() => { guide.controls = true; guidePlay.hidden = true; });
  });
}
guide.addEventListener("play", () => {
  guide.controls = true;
  if (guidePlay) guidePlay.hidden = true;
});
guide.addEventListener("ended", () => {
  if (guidePlay) guidePlay.hidden = false;
});
const chapters = document.querySelector(".chapters");
const chapterButtons = Array.from(chapters.querySelectorAll("button"));
chapters.hidden = false;
for (const button of chapterButtons) {
  button.addEventListener("click", () => {
    // Con preload="none" el video todavía no tiene datos: se espera a conocerlos para poder saltar.
    const start = Number(button.dataset.start);
    const seek = () => { guide.currentTime = start; guide.play().catch(() => {}); };
    if (guide.readyState >= 1) seek();
    else { guide.addEventListener("loadedmetadata", seek, { once: true }); guide.load(); }
    guide.focus({ preventScroll: true });
    // Que se vean juntos el video y los capítulos (en celular, los capítulos van debajo).
    const header = document.querySelector("header");
    document.documentElement.style.setProperty("--header-h", (header ? header.offsetHeight : 88) + "px");
    const v = guide.getBoundingClientRect();
    const c = chapters.getBoundingClientRect();
    const top = header ? header.offsetHeight : 0;
    const unionTop = Math.min(v.top, c.top);
    const unionBottom = Math.max(v.bottom, c.bottom);
    if (unionTop < top || unionBottom > innerHeight) {
      scrollTo({ top: scrollY + unionTop - top - 8, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
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

}
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
    document.body.classList.add("is-direct");
    // Primero el botón de la portada, sin esperar al catálogo.
    const primary = document.querySelector(".hero-buy .button");
    const checkout = document.querySelector("#checkout");
    for (const link of [primary, checkout].filter(Boolean)) {
      link.href = "checkout.html";
      link.removeAttribute("target");
      link.removeAttribute("data-event");
      link.textContent = "Comprar en ENVY";
    }
    const buyNote = document.querySelector(".hero-buy p");
    if (buyNote) buyNote.textContent = shop.stock
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
// --- Portada: el A Tag gira solo, por tiempo y en bucle (frente → perfil → reverso → frente).
// No depende del scroll ni lo bloquea. Se pausa fuera de pantalla, con la pestaña oculta o con el botón.
(function heroTag() {
  const visual = document.querySelector(".hero-visual");
  const world = document.querySelector(".tag-world");
  const canvas = document.querySelector(".tag-canvas");
  const toggle = document.querySelector(".tag-toggle");
  if (!visual || !world || !canvas?.getContext || !motionAllowed) return;
  const ctx = canvas.getContext("2d");

  // Ritmo del bucle (ms): pausa en el frente, giro, pausa en el reverso, vuelta.
  const HOLD_FRONT = 900, TURN = 2600, HOLD_BACK = 1100;
  const CYCLE = HOLD_FRONT + TURN + HOLD_BACK + TURN;
  function loopPosition(t) {
    t %= CYCLE;
    if (t < HOLD_FRONT) return 0;
    t -= HOLD_FRONT;
    if (t < TURN) return FRAME_LAST * easeInOut(t / TURN);
    t -= TURN;
    if (t < HOLD_BACK) return FRAME_LAST;
    t -= HOLD_BACK;
    return FRAME_LAST * (1 - easeInOut(t / TURN));
  }
  let allLoaded = false;
  let userPaused = false, onScreen = false;
  let clock = 0, last = null, raf = 0, drawn = -1;

  function draw(position, extra) {
    const key = Math.round(position * 20);
    if (key === drawn && !extra) return;
    drawn = extra ? -1 : key;
    drawFrame(ctx, position);
    if (extra) extra();
  }
  function frameAt(t) {
    // Hasta que llegan todos los cuadros, el A Tag espera quieto en el frente.
    draw(allLoaded ? loopPosition(t) : 0);
  }
  function tick(now) {
    if (last !== null) {
      const dt = Math.min(64, now - last);
      // sin todos los cuadros, el reloj del bucle no avanza más allá de la pausa en el frente
      if (allLoaded || clock < HOLD_FRONT - 1) clock += dt;
    }
    last = now;
    frameAt(clock);
    raf = requestAnimationFrame(tick);
  }
  function update() {
    const run = !userPaused && onScreen && !document.hidden;
    if (run && !raf) { last = null; raf = requestAnimationFrame(tick); }
    if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  // Los 53 cuadros se descargan recién cuando la sección del producto está por aparecer.
  let started = false;
  function start() {
    if (started) return;
    started = true;
    const first = [];
    for (let i = 0; i <= EDGE_FRAME; i++) first.push(loadFrame(i));
    Promise.all(first).then(() => {
      if (!frames[0].ok) return; // queda la imagen fija
      world.classList.add("is-live");
      frameAt(0);
      toggle.hidden = false;
      update();
      const rest = [];
      for (let i = EDGE_FRAME + 1; i <= FRAME_LAST; i++) rest.push(loadFrame(i));
      Promise.all(rest).then(() => {
        allLoaded = frames.every((f) => f?.ok);
      });
    });
  }
  if ("IntersectionObserver" in window) {
    const near = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { near.disconnect(); start(); }
    }, { rootMargin: "900px 0px" });
    near.observe(visual);
  } else {
    onScreen = true;
    start();
  }

  toggle.addEventListener("click", () => {
    userPaused = !userPaused;
    toggle.setAttribute("aria-pressed", String(userPaused));
    toggle.setAttribute("aria-label", userPaused ? "Reanudar el giro del A Tag" : "Pausar el giro del A Tag");
    update();
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      onScreen = entries.some((e) => e.isIntersecting);
      update();
    }).observe(visual);
  }
  document.addEventListener("visibilitychange", update);
})();

// --- Demo «Así de simple»: los pasos avanzan solos mientras se ve; si la persona toca uno, se detiene.
(function autoDemo() {
  const steps = Array.from(document.querySelectorAll(".steps [data-step]"));
  const box = document.querySelector(".steps");
  if (!steps.length || !box || !motionAllowed || !("IntersectionObserver" in window)) return;
  const STEP_MS = 3200;
  let timer = 0, auto = false, stopped = false, current = 0;
  for (const step of steps) {
    step.addEventListener("click", () => {
      current = Number(step.dataset.step);
      if (auto) return;
      stopped = true;
      clearInterval(timer);
      box.classList.remove("is-auto");
    });
  }
  function advance() {
    const next = steps[(current + 1) % steps.length];
    auto = true;
    next.click();
    auto = false;
    box.classList.remove("is-auto");
    void box.offsetWidth; // reinicia la barra de progreso
    box.classList.add("is-auto");
  }
  new IntersectionObserver((entries) => {
    const visible = entries.some((e) => e.isIntersecting);
    clearInterval(timer);
    box.classList.remove("is-auto");
    if (visible && !stopped) {
      box.classList.add("is-auto");
      timer = setInterval(advance, STEP_MS);
    }
  }, { threshold: 0.45 }).observe(document.querySelector(".demo-grid"));
})();

// --- Cierre «Mañana, tu hogar»: el emblema se dibuja al aparecer.
(function futureEmblem() {
  const future = document.querySelector(".future");
  const copy = future?.querySelector(".emblem--mark");
  if (!future || !copy) return;
  copy.querySelector(".emblem-glint")?.remove();
  if (!motionAllowed || !("IntersectionObserver" in window)) return;
  future.classList.add("will-draw");
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    future.classList.add("is-drawn");
  }, { threshold: 0.5 });
  io.observe(copy);
})();

// --- «Qué hacemos»: una área abierta a la vez; sin JavaScript quedan las tres abiertas.
(function areas() {
  const items = Array.from(document.querySelectorAll(".area"));
  if (!items.length) return;
  function set(item, open) {
    item.classList.toggle("is-open", open);
    item.querySelector("button").setAttribute("aria-expanded", String(open));
  }
  items.forEach((item, i) => {
    set(item, i === 0);
    item.querySelector("button").addEventListener("click", () => {
      items.forEach((other) => set(other, other === item));
    });
  });
})();

// --- Menú: en celular se abre con un botón; la página actual va marcada en el HTML (aria-current).
(function menu() {
  const header = document.querySelector("header");
  const button = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#menu");
  if (!header || !button || !nav) return;
  header.classList.add("has-menu");
  button.hidden = false;
  const label = button.querySelector(".menu-label");
  function set(open) {
    header.classList.toggle("menu-open", open);
    button.setAttribute("aria-expanded", String(open));
    label.textContent = open ? "Cerrar" : "Menú";
  }
  button.addEventListener("click", () => set(!header.classList.contains("menu-open")));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && header.classList.contains("menu-open")) { set(false); button.focus(); }
  });
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
  matchMedia("(min-width: 901px)").addEventListener("change", (e) => { if (e.matches) set(false); });
})();

// --- Anuncio de la tienda: portada limpia con botón; se reproduce con sonido solo si la persona lo elige.
(function adPlayer() {
  const video = document.querySelector("#ad-video");
  const play = document.querySelector(".ad-play");
  if (!video || !play) return;
  video.controls = false;
  play.hidden = false;
  play.addEventListener("click", () => {
    video.play().catch(() => { video.controls = true; play.hidden = true; });
  });
  video.addEventListener("play", () => { video.controls = true; play.hidden = true; });
  video.addEventListener("ended", () => { play.hidden = false; });
})();
