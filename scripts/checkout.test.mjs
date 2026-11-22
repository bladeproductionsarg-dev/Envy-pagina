import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { unitPrice } from "../catalog.mjs";

test("Tramos comerciales acordados", () => {
  assert.deepEqual(
    [1, 5, 6, 14, 15, 40].map(unitPrice),
    [20000, 20000, 17500, 17500, 15000, 15000],
  );
});
test("Compra directa, reintentos, entrega y stock", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "envy-checkout-"));
  // El doble local verifica el importe enviado al procesador y nunca contacta a Mercado Pago.
  const stub = `globalThis.fetch=async (url,options)=>{
    if(url!=="https://api.mercadopago.com/v1/payments")throw Error("Unexpected request");
    const p=JSON.parse(options.body);
    if(options.headers["X-Idempotency-Key"]!==p.external_reference || p.transaction_amount!==105000)
      return new Response("",{status:400});
    return Response.json({id:123,currency_id:"ARS",transaction_amount:105000,external_reference:p.external_reference,
      status:p.token==="approved-test"?"approved":"rejected"});
  }; await import("./server.mjs");`;
  const child = spawn(process.execPath, ["--input-type=module", "-e", stub], {
    env: {
      ...process.env,
      ENVY_MODE: "live",
      ENVY_DATA_DIR: dir,
      PORT: "0",
      HOST: "127.0.0.1",
      MP_PUBLIC_KEY: "fake",
      MP_ACCESS_TOKEN: "fake",
    },
    stdio: ["ignore", "pipe", "inherit"],
  });
  t.after(async () => {
    const exit = once(child, "exit");
    child.kill();
    await exit;
    await rm(dir, { recursive: true, force: true });
  });
  const [ready] = await once(child.stdout, "data");
  const base = "http://127.0.0.1:" + String(ready).match(/puerto (\d+)/)[1];
  const stock = async () =>
    (await (await fetch(base + "/api/tienda")).json()).stock;
  const sample = {
    quantity: 6,
    total: 105000,
    name: "Prueba interna",
    phone: "1100000000",
    delivery: "pickup",
    method: "cash",
  };
  const submit = async (o) => {
    const r = await fetch(base + "/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(o),
    });
    return { status: r.status, data: await r.json() };
  };
  assert.equal(await stock(), 40);
  assert.equal(
    (await submit({ ...sample, id: randomUUID(), total: 1 })).status,
    409,
  );
  assert.equal(
    (
      await submit({
        ...sample,
        id: randomUUID(),
        delivery: "delivery",
        zone: "Otra zona",
        address: "Calle 123",
      })
    ).status,
    400,
  );
  const transfer = {
    ...sample,
    id: randomUUID(),
    method: "transfer",
    delivery: "delivery",
    zone: "Ciudad Autónoma de Buenos Aires",
    address: "Calle 123",
  };
  const replies = await Promise.all([submit(transfer), submit(transfer)]);
  for (const r of replies) {
    assert.equal(r.data.status, "awaiting_transfer");
    assert.equal(r.data.alias, "felipillo.com.ar");
  }
  assert.equal(await stock(), 34);
  const payment = {
    token: "rejected-test",
    payment_method_id: "visa",
    installments: 1,
    payer: { email: "demo@example.invalid" },
  };
  assert.equal(
    (await submit({ ...sample, id: randomUUID(), method: "card", payment }))
      .data.status,
    "rejected",
  );
  assert.equal(await stock(), 34);
  assert.equal(
    (
      await submit({
        ...sample,
        id: randomUUID(),
        method: "card",
        payment: { ...payment, token: "approved-test" },
      })
    ).data.status,
    "paid",
  );
  assert.equal(await stock(), 28);
  const orders = await Promise.all(
    [1, 2].map(() =>
      submit({ ...sample, id: randomUUID(), quantity: 20, total: 300000 }),
    ),
  );
  assert.deepEqual(orders.map((r) => r.status).sort(), [201, 409]);
  assert.equal(await stock(), 8);
  const result = await (
    await fetch(base + "/api/pedidos/" + transfer.id)
  ).json();
  assert.equal(result.total, 105000);
  assert.equal(result.phone, undefined);
  assert.equal(result.address, undefined);
});
