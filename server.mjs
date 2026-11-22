import express from "express";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

import { tiers, unitPrice, deliveryZones } from "./catalog.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const env = process.env;
const mode = env.ENVY_MODE || "demo";
if (!["demo", "live"].includes(mode))
  throw Error("ENVY_MODE debe ser demo o live.");
const demo = mode === "demo";
const initialStock = 40;
const card = demo || Boolean(env.MP_ACCESS_TOKEN && env.MP_PUBLIC_KEY);
const cash = true;
if (!card && !cash)
  throw Error("Configurá un medio de pago para habilitar ventas.");
const dbPath = resolve(
  env.ENVY_DATA_DIR || resolve(homedir(), ".envy-store"),
  mode + ".sqlite",
);
mkdirSync(dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(`PRAGMA journal_mode=WAL;
  CREATE TABLE IF NOT EXISTS inventory (sku TEXT PRIMARY KEY, available INTEGER NOT NULL CHECK(available >= 0));
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, quantity INTEGER NOT NULL,
    price INTEGER NOT NULL, fee INTEGER NOT NULL, total INTEGER NOT NULL, delivery TEXT NOT NULL,
    name TEXT NOT NULL, phone TEXT NOT NULL, address TEXT NOT NULL, method TEXT NOT NULL,
    status TEXT NOT NULL, payment_id TEXT, checked INTEGER NOT NULL DEFAULT 0
  );`);
db.prepare("INSERT OR IGNORE INTO inventory VALUES ('a-tag', ?)").run(
  initialStock,
);
const getOrder = (id) => db.prepare("SELECT * FROM orders WHERE id=?").get(id);
const available = () =>
  db.prepare("SELECT available FROM inventory WHERE sku='a-tag'").get()
    .available;
function transaction(fn) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
if (process.argv[2] === "--acreditar" || process.argv[2] === "--cancelar") {
  const order = getOrder(process.argv[3] || "");
  if (!order || !["due", "awaiting_transfer"].includes(order.status))
    throw Error("Referencia o estado no válido.");
  transaction(() => {
    const cancelling = process.argv[2] === "--cancelar";
    const result = db
      .prepare("UPDATE orders SET status=? WHERE id=? AND status=?")
      .run(cancelling ? "cancelled" : "paid", order.id, order.status);
    if (result.changes !== 1)
      throw Error("El estado cambió. Revisá el pedido.");
    if (cancelling)
      db.prepare(
        "UPDATE inventory SET available=available+? WHERE sku='a-tag'",
      ).run(order.quantity);
  });
  db.close();
  process.exit(0);
}
if (process.argv[2] === "--pedidos") {
  console.table(
    db
      .prepare(
        "SELECT id,created,quantity,total,method,status,delivery,name,phone,address FROM orders ORDER BY created DESC",
      )
      .all(),
  );
  console.log("Unidades disponibles:", available());
  db.close();
  process.exit(0);
}
const app = express();
app.disable("x-powered-by");
app.use(
  "/api",
  (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (
      req.method === "POST" &&
      (!req.is("application/json") ||
        req.get("sec-fetch-site") === "cross-site")
    )
      return res.status(403).json({ error: "Solicitud no admitida." });
    next();
  },
  express.json({ limit: "12kb" }),
);
app.get("/api/tienda", (_req, res) =>
  res.json({
    demo,
    tiers,
    stock: available(),
    deliveryZones,
    card,
    cash,
    publicKey: !demo && card ? env.MP_PUBLIC_KEY : null,
  }),
);
const uuid =
  /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
function fail(message, status = 400) {
  throw Object.assign(Error(message), { status });
}
function textField(value, max, min = 2) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    fail("Revisá tus datos de contacto y entrega.");
  return value.trim();
}
function summary(order) {
  return {
    id: order.id,
    quantity: order.quantity,
    total: order.total,
    status: order.status,
    method: order.method,
    delivery: order.delivery,
    demo,
    alias:
      order.status === "awaiting_transfer" && !demo ? "felipillo.com.ar" : null,
  };
}
function updatePayment(id, payment) {
  const order = getOrder(id);
  if (
    order.status !== "pending" ||
    payment.external_reference !== id ||
    payment.currency_id !== "ARS" ||
    Number(payment.transaction_amount) !== order.total ||
    !payment.id
  )
    return;
  const status =
    payment.status === "approved"
      ? "paid"
      : ["rejected", "cancelled"].includes(payment.status)
        ? "rejected"
        : "pending";
  transaction(() => {
    db.prepare(
      "UPDATE orders SET status=?,payment_id=?,checked=? WHERE id=?",
    ).run(status, String(payment.id), Date.now(), id);
    if (status === "rejected")
      db.prepare(
        "UPDATE inventory SET available=available+? WHERE sku='a-tag'",
      ).run(order.quantity);
  });
}
async function provider(path, options = {}) {
  return fetch("https://api.mercadopago.com" + path, {
    ...options,
    signal: AbortSignal.timeout(12000),
    headers: {
      Authorization: "Bearer " + env.MP_ACCESS_TOKEN,
      ...options.headers,
    },
  });
}
// Reconsultar al proveedor también recupera respuestas perdidas y pagos pendientes tras un reinicio.
async function reconcile(order) {
  db.prepare("UPDATE orders SET checked=? WHERE id=?").run(
    Date.now(),
    order.id,
  );
  try {
    const response = await provider(
      order.payment_id
        ? "/v1/payments/" + encodeURIComponent(order.payment_id)
        : "/v1/payments/search?external_reference=" +
            encodeURIComponent(order.id),
    );
    if (!response.ok) return;
    const data = await response.json();
    const payment = order.payment_id
      ? data
      : data.results?.find((p) => p.external_reference === order.id);
    if (payment) updatePayment(order.id, payment);
  } catch {
    /* El pedido sigue pendiente hasta una respuesta verificable. */
  }
}
app.get("/api/pedidos/:id", async (req, res) => {
  const order = uuid.test(req.params.id) && getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Pedido no encontrado." });
  if (!demo && order.status === "pending" && Date.now() - order.checked > 30000)
    await reconcile(order);
  res.json(summary(getOrder(order.id)));
});
app.post("/api/pedidos", async (req, res) => {
  const b = req.body || {};
  if (typeof b.id !== "string" || !uuid.test(b.id))
    fail("Falta la referencia de compra.");
  const prior = getOrder(b.id);
  if (prior) return res.json(summary(prior));
  if (!Number.isInteger(b.quantity) || b.quantity < 1 || b.quantity > 1000000)
    fail("Elegí una cantidad válida.");
  if (!["pickup", "delivery"].includes(b.delivery))
    fail("Elegí una entrega disponible.");
  if (!(
    (cash && b.method === "cash") ||
    (card && b.method === "card") ||
    b.method === "transfer"
  ))
    fail("Elegí un medio de pago disponible.");
  const name = demo ? "Cliente de prueba" : textField(b.name, 100);
  const phone = demo ? "Prueba" : textField(b.phone, 24, 6);
  if (!demo && !/^[+()\d\s-]+$/.test(phone)) fail("Revisá el teléfono.");
  if (b.delivery === "delivery" && !deliveryZones.includes(b.zone))
    fail("Elegí una zona con entrega habilitada.");
  const address =
    b.delivery === "delivery"
      ? demo
        ? "Dirección de prueba"
        : textField(b.address, 240, 5) + ", " + b.zone
      : "";
  const fee = 0;
  const price = unitPrice(b.quantity);
  const total = b.quantity * price + fee;
  if (b.total !== total)
    fail("El precio cambió. Volvé a revisar el total.", 409);
  let payload;
  if (b.method === "card" && !demo) {
    const p = b.payment || {};
    if (
      !p.token ||
      typeof p.token !== "string" ||
      !p.payment_method_id ||
      !p.payer?.email ||
      !Number.isInteger(p.installments) ||
      p.installments < 1
    )
      fail("Revisá los datos de pago.");
    payload = {
      transaction_amount: total,
      token: p.token,
      installments: p.installments,
      payment_method_id: p.payment_method_id,
      description: "ENVY · A Tag con llavero",
      external_reference: b.id,
      payer: { email: p.payer.email, identification: p.payer.identification },
    };
    if (p.issuer_id) payload.issuer_id = p.issuer_id;
  }
  transaction(() => {
    if (
      !db
        .prepare(
          "UPDATE inventory SET available=available-? WHERE sku='a-tag' AND available>=?",
        )
        .run(b.quantity, b.quantity).changes
    )
      fail("La cantidad supera el stock disponible.", 409);
    const status =
      b.method === "cash"
        ? "due"
        : b.method === "transfer"
          ? "awaiting_transfer"
          : demo
            ? "paid"
            : "pending";
    db.prepare(
      "INSERT INTO orders (id,quantity,price,fee,total,delivery,name,phone,address,method,status,checked) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
    ).run(
      b.id,
      b.quantity,
      price,
      fee,
      total,
      b.delivery,
      name,
      phone,
      address,
      b.method,
      status,
      Date.now(),
    );
  });
  if (payload) {
    try {
      const response = await provider("/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": b.id,
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) updatePayment(b.id, await response.json());
      else if ([400, 401, 403, 422].includes(response.status)) {
        // La solicitud fue rechazada antes de crear el pago.
        transaction(() => {
          const changed = db
            .prepare(
              "UPDATE orders SET status='rejected' WHERE id=? AND status='pending'",
            )
            .run(b.id).changes;
          if (changed)
            db.prepare(
              "UPDATE inventory SET available=available+? WHERE sku='a-tag'",
            ).run(b.quantity);
        });
      }
    } catch {
      /* Una interrupción no confirma ni descarta el cobro. */
    }
  }
  res.status(201).json(summary(getOrder(b.id)));
});
app.use("/api", (_req, res) =>
  res.status(404).json({ error: "Recurso no encontrado." }),
);
app.use(express.static(resolve(root, "dist"), { dotfiles: "deny" }));
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res
    .status(status)
    .json({
      error:
        status < 500
          ? err.message
          : "No pudimos completar la operación. Consultá nuevamente tu pedido.",
    });
});
if (!demo && card) {
  (async () => {
    for (;;) {
      await delay(60000);
      const pending = db
        .prepare(
          "SELECT * FROM orders WHERE status='pending' AND checked<? ORDER BY checked LIMIT 12",
        )
        .all(Date.now() - 30000);
      for (const order of pending) await reconcile(order);
    }
  })();
}
const port = Number(env.PORT || 5177);
const listener = app.listen(port, env.HOST || "127.0.0.1", () =>
  console.log("ENVY · " + mode + " · puerto " + listener.address().port),
);
