// Commercial configuration: reference price only. Checkout remains on Mercado Libre.
const config = {
  price: 20000,
  max: 20,
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
function renderCart() {
  document.querySelector("#count").textContent = quantity;
  save(config.cartKey, String(quantity));
  document.querySelector("#cart-body").innerHTML = quantity
    ? `<div class="cart-line"><img src="assets/a-tag-kit.png" alt="A Tag con llavero"><div><h3>A Tag</h3><p>${money(config.price)} por unidad</p></div></div><div class="quantity"><button id="minus" aria-label="Quitar una unidad">−</button><span>${quantity} ${quantity === 1 ? "unidad" : "unidades"}</span><button id="plus" aria-label="Agregar una unidad" ${quantity >= config.max ? "disabled" : ""}>+</button></div><div class="total"><span>Total de referencia</span><strong>${money(quantity * config.price)}</strong></div>`
    : "<p>Tu selección está vacía. Elegí un A Tag para empezar.</p>";
  document.querySelector("#checkout").hidden = !quantity;
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
document.querySelector("#packs").innerHTML = [1, 2, 4]
  .map((units) => {
    const label = units === 1 ? "1 unidad" : units + " unidades";
    return `<article class="pack">
      <h3>${label}</h3>
      <div class="pack-price">${money(units * config.price)} <small>ARS</small></div>
      <p>Total de referencia</p>
      <button class="button secondary" data-add="${units}">Sumar ${label} al carrito</button>
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
