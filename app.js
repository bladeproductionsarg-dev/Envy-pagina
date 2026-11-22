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
document.querySelectorAll("[data-photo]").forEach((button) =>
  button.addEventListener("click", () => {
    const photo = document.querySelector("#product-photo");
    photo.src = "assets/" + button.dataset.photo;
    photo.alt = button.dataset.alt;
    document
      .querySelectorAll("[data-photo]")
      .forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
  }),
);
// Native controls also work when an embedded browser requires a second tap to play.
const guide = document.querySelector("#guide-video");
const ad = document.querySelector("#ad-video");
const adDialog = document.querySelector("#ad-dialog");
const adLink = document.querySelector("#watch-ad");
if (typeof adDialog.showModal === "function") {
  adLink.setAttribute("aria-haspopup", "dialog");
  adLink.addEventListener("click", (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    guide.pause();
    openDialog(adDialog);
    ad.currentTime = 0;
    ad.play().catch(() => {});
  });
}
document.querySelector("#ad-close").addEventListener("click", () => adDialog.close());
adDialog.addEventListener("close", () => ad.pause());

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
    const response = await fetch("/api/tienda", {cache:"no-store"});
    if (!response.ok) return;
    const shop = await response.json();
    const catalog = await import("./catalog.mjs");
    direct = true;
    priceFor = catalog.unitPrice;
    config.max = shop.stock;
    quantity = Math.min(quantity, shop.stock);
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
    document.querySelector("#cart .fine").textContent = "El precio por unidad se calcula según la cantidad. Elegí entrega y pago al continuar.";
    renderPacks();
    renderCart();
  } catch { /* La publicación externa sigue disponible en el alojamiento estático. */ }
}
if (location.protocol.startsWith("http")) enableDirectStore();
