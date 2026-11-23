import { unitPrice, tiers } from "./catalog.mjs";

const $ = (selector) => document.querySelector(selector);
const form = $("#details");
const guide = $("#review-panel");
const qty = $("#units");
const money = (value) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
const cartKey = "envy-static-cart-v1";
const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
};
// El tema lo decide el script del <head> (azul noche salvo elección explícita de modo claro).
let shop,
  order,
  brick,
  sdk,
  activeId,
  busy = false,
  revision = 0;
const methodLabels = {
  cash: "Pagás al retirar o recibir.",
  transfer: "Pagás por transferencia a Mercado Pago.",
  card: "Pagás con tarjeta dentro de ENVY.",
};
async function api(path, options) {
  const response = await fetch(path, { cache: "no-store", ...options });
  let result;
  try {
    result = await response.json();
  } catch {
    throw Error("La tienda no pudo responder. Volvé a intentar.");
  }
  if (!response.ok)
    throw Object.assign(
      Error(result.error || "No se pudo consultar el pedido."),
      { status: response.status },
    );
  return result;
}
function showAmount() {
  const count = Number(qty.value);
  const valid = Number.isInteger(count) && count > 0 && count <= shop.stock;
  const price = unitPrice(count);
  $("#unit").textContent = valid ? money(price) : "—";
  $("#amount").textContent = valid ? money(count * price) : "—";
  $("#fee-label").textContent =
    form.elements.delivery.value === "delivery"
      ? "Entrega a domicilio"
      : "Retiro";
  $("#available").textContent =
    shop.stock + " unidades disponibles" + (shop.demo ? " en la prueba" : "");
  $("#review").disabled = !valid;
  $("#less").disabled = qty.disabled || count <= 1;
  $("#more").disabled = qty.disabled || count >= shop.stock;
  [...document.querySelectorAll(".rates div")].forEach((line, i) =>
    line.classList.toggle("active", valid && tiers[i].price === price),
  );
}
function deliveryFields() {
  const needed = form.elements.delivery.value === "delivery";
  $("#shipping-fields").hidden = !needed;
  form.elements.address.required = needed;
  form.elements.address.disabled = !needed;
  form.elements.zone.disabled = !needed;
  showAmount();
}
qty.addEventListener("input", showAmount);
$("#less").onclick = () => {
  qty.stepDown();
  showAmount();
};
$("#more").onclick = () => {
  qty.stepUp();
  showAmount();
};
form.addEventListener("change", deliveryFields);
function error(text) {
  $("#error").textContent = text;
}
function editOrder() {
  revision++;
  if (brick) {
    brick.unmount();
    brick = null;
  }
  guide.hidden = true;
  form.hidden = false;
  qty.disabled = false;
  $("#edit").disabled = false;
  showAmount();
  error("");
}
$("#edit").onclick = editOrder;
function loadSDK() {
  if (!sdk)
    sdk = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.onload = resolve;
      script.onerror = () => {
        script.remove();
        sdk = null;
        reject(
          Error(
            "No se pudo cargar el formulario de tarjetas. Volvé a intentar.",
          ),
        );
      };
      document.head.append(script);
    });
  return sdk;
}
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  error("");
  if (!qty.reportValidity() || !shop.stock) return;
  const values = Object.fromEntries(new FormData(form));
  if (!shop.demo && !/^[+()\d\s-]{6,24}$/.test(values.phone)) {
    error("Revisá el teléfono de contacto.");
    return;
  }
  const count = Number(qty.value);
  order = { ...values, quantity: count, total: count * unitPrice(count) };
  form.hidden = true;
  guide.hidden = false;
  qty.disabled = true;
  showAmount();
  $("#review-copy").textContent =
    count + " × A Tag con llavero · " + money(order.total) + " ARS";
  $("#review-contact").textContent =
    order.name +
    " · " +
    order.phone +
    " · " +
    (order.delivery === "pickup"
      ? "Retiro en Santos Lugares"
      : order.address + ", " + order.zone);
  $("#review-method").textContent = methodLabels[order.method];
  $("#confirm").hidden = order.method === "card" && !shop.demo;
  $("#confirm").disabled = false;
  $("#confirm").textContent = shop.demo
    ? "Confirmar pedido de prueba"
    : "Confirmar pedido";
  $("#review-title").focus();
  const version = ++revision;
  if (!$("#confirm").hidden) return;
  try {
    await loadSDK();
    if (version !== revision) return;
    const client = new window.MercadoPago(shop.publicKey, { locale: "es-AR" });
    const controller = await client
      .bricks()
      .create("cardPayment", "card-brick", {
        initialization: { amount: order.total },
        callbacks: {
          onReady: () => {},
          onError: () =>
            error("Revisá los datos en el formulario de Mercado Pago."),
          onSubmit: (payment) => sendOrder(payment),
        },
      });
    if (version !== revision) controller.unmount();
    else brick = controller;
  } catch (e) {
    if (version === revision) error(e.message);
  }
});
function receipt(result) {
  $("#purchase").hidden = true;
  $("#unavailable").hidden = true;
  $("#receipt").hidden = false;
  const content = {
    due: [
      "Pedido recibido",
      "ENVY te contactará para coordinar la entrega. Pagás cuando recibís el producto.",
    ],
    awaiting_transfer: [
      "Pedido pendiente de transferencia",
      "Transferí el total al alias indicado. ENVY confirmará el pago tras verificar la acreditación.",
    ],
    paid: [
      "Pago confirmado",
      "Tu pedido quedó registrado. ENVY te contactará para coordinar la entrega.",
    ],
    pending: [
      "Pago en verificación",
      "Conservá el número de pedido. Podés consultar el estado desde esta página.",
    ],
    rejected: [
      "Pago rechazado",
      "Podés iniciar otra compra y elegir otro medio de pago.",
    ],
    cancelled: ["Pedido cancelado", "Este pedido está cancelado."],
  }[result.status];
  $("#result-title").textContent =
    content[0] + (result.demo ? " · Prueba" : "");
  $("#result-copy").textContent = result.demo
    ? "Simulación guardada. No se realiza una entrega ni se cobra dinero."
    : content[1];
  $("#reference").textContent = result.id;
  $("#result-total").textContent =
    "Total del pedido: " + money(result.total) + " ARS";
  $("#transfer-info").hidden = !result.alias;
  $("#alias").textContent = result.alias || "";
  $("#refresh").hidden = !["pending", "awaiting_transfer", "due"].includes(
    result.status,
  );
  $("#another").hidden = result.status === "pending";
  $("#result-title").focus();
}
async function lookup() {
  const result = await api("/api/pedidos/" + activeId);
  receipt(result);
}
$("#refresh").onclick = async () => {
  try {
    await lookup();
  } catch {
    $("#result-copy").textContent =
      "No pudimos actualizar el estado. Volvé a intentar.";
  }
};
$("#copy-alias").onclick = async () => {
  try {
    await navigator.clipboard.writeText($("#alias").textContent);
    $("#copy-alias").textContent = "Alias copiado";
  } catch {
    $("#copy-alias").textContent = "Seleccioná el alias para copiarlo";
  }
};
$("#another").onclick = () => location.replace("checkout.html");
async function sendOrder(payment) {
  if (busy) return;
  busy = true;
  $("#edit").disabled = true;
  $("#confirm").disabled = true;
  error("");
  activeId ||= crypto.randomUUID();
  history.replaceState(null, "", "#pedido=" + activeId);
  try {
    const result = await api("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...order, id: activeId, payment }),
    });
    if (!["rejected", "cancelled"].includes(result.status))
      storage.set(cartKey, "0");
    receipt(result);
  } catch (e) {
    if (e.status && e.status < 500) {
      history.replaceState(null, "", location.pathname);
      activeId = null;
      try {
        shop = await api("/api/tienda");
        qty.max = shop.stock;
      } catch {}
      editOrder();
      error(e.message);
    } else {
      // Mismo identificador en cada reintento, aun si se perdió la respuesta.
      try {
        await lookup();
      } catch {
        error("La respuesta se interrumpió. Reintentá con este mismo pedido.");
        $("#confirm").disabled = false;
      }
    }
    if (payment) throw e;
  } finally {
    busy = false;
  }
}
$("#confirm").onclick = () => sendOrder();
try {
  shop = await api("/api/tienda");
  $("#mode-note").hidden = !shop.demo;
  qty.max = shop.stock;
  const requested = Number(
    new URLSearchParams(location.search).get("unidades") ||
      storage.get(cartKey),
  );
  qty.value = shop.stock
    ? Math.min(
        shop.stock,
        Math.max(1, Number.isInteger(requested) ? requested : 1),
      )
    : 0;
  form.querySelector('[value="card"]').disabled = !shop.card;
  if (!shop.card)
    $("#card-note").textContent =
      "Próximamente. Hoy podés transferir o pagar al recibir.";
  for (const zone of shop.deliveryZones)
    form.elements.zone.add(new Option(zone, zone));
  if (shop.demo) {
    form.elements.name.value = "Cliente de prueba";
    form.elements.phone.value = "1100000000";
    form.elements.address.value = "Dirección de ejemplo 123";
  }
  $("#purchase").hidden = false;
  deliveryFields();
  const previous = new URLSearchParams(location.hash.slice(1)).get("pedido");
  if (previous && /^[a-f0-9-]{36}$/i.test(previous)) {
    activeId = previous;
    try {
      await lookup();
    } catch (e) {
      if (e.status !== 404) throw e;
    }
  }
} catch {
  $("#purchase").hidden = true;
  $("#unavailable").hidden = false;
} finally {
  $("#loading").hidden = true;
}
