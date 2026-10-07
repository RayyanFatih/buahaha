import assert from "node:assert/strict";
import test from "node:test";
import { demoState as historicalDemo, DEMO_DATE } from "../src/lib/demo";
import {
  migrateHistory,
  HISTORY_BACKUP_KEY,
  HISTORY_MIGRATION_KEY,
} from "../src/lib/history-migration";
import {
  available,
  execute,
  paid,
  report,
  reportByDay,
  shiftDate,
  reserved,
  stateSchema,
  today,
  type Order,
  type State,
} from "../src/lib/domain";

const date = today();

// Existing command scenarios simulate all activity on one current working day.
function demoState(): State {
  const state = historicalDemo();
  for (const rows of [
    state.orders,
    state.payments,
    state.trips,
    state.expenses,
    state.returns,
    state.movements,
  ]) {
    rows.forEach((row) => {
      row.date = date;
    });
  }
  state.orders.forEach((order) => {
    if (order.completedAt) order.completedAt = date;
  });
  return state;
}

test("demo history ends in September and October starts with zero results", () => {
  const state = historicalDemo();
  for (const rows of [
    state.orders,
    state.payments,
    state.trips,
    state.expenses,
    state.returns,
    state.movements,
  ]) {
    assert.ok(rows.every((row) => row.date <= DEMO_DATE));
  }
  assert.equal(report(state, DEMO_DATE, DEMO_DATE).net, 851000);
  assert.equal(report(state, "2026-10-01", "2026-10-31").net, 0);
  assert.equal(report(state, "2026-10-01", "2026-10-31").sales, 0);
});

test("saved history migrates once with original backup; new October entries survive reload", () => {
  const state = demoState();
  state.orders[0].date = "2026-10-01";
  state.orders[0].completedAt = "2026-10-02";
  state.expenses[0].date = "2026-09-20";
  const raw = JSON.stringify(state);
  const data = new Map<string, string>([["state", raw]]);
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
  const migrated = migrateHistory(state, raw, storage, "state");
  assert.equal(migrated.orders[0].completedAt, DEMO_DATE);
  assert.equal(migrated.expenses[0].date, "2026-09-20");
  assert.deepEqual(migrated.products, state.products);
  assert.equal(storage.getItem(HISTORY_BACKUP_KEY), raw);
  assert.equal(storage.getItem(HISTORY_MIGRATION_KEY), "done");
  migrated.expenses.push({
    ...migrated.expenses[0],
    id: "new-october",
    date: "2026-10-01",
    amount: 25000,
  });
  const reloaded = migrateHistory(
    migrated,
    JSON.stringify(migrated),
    storage,
    "state",
  );
  assert.equal(report(reloaded, "2026-10-01", "2026-10-01").net, -25000);
  assert.equal(storage.getItem(HISTORY_BACKUP_KEY), raw);
});

test("daily results use completion and expense dates, include cost-only days, and reconcile to the range", () => {
  const s = demoState();
  s.orders[0].date = "2026-09-01";
  s.orders[0].completedAt = "2026-09-10";
  s.orders[1].completedAt = "2026-09-11";
  s.expenses[0].date = "2026-09-10";
  s.expenses[1].date = "2026-09-11";
  s.expenses[2].date = "2026-09-12";
  s.movements.forEach((m) => {
    m.date = "2026-09-12";
  });
  s.returns[0] = {
    ...s.returns[0],
    status: "Disetujui",
    condition: "Layak jual",
    date: "2026-09-12",
  };
  const rows = reportByDay(s, "2026-09-10", "2026-09-12");
  assert.deepEqual(
    rows.map((r) => r.date),
    ["2026-09-12", "2026-09-11", "2026-09-10"],
  );
  assert.equal(rows[2].sales, 2150000);
  assert.equal(rows[2].net, 510000);
  assert.equal(rows[1].net, 435000);
  assert.equal(rows[0].count, 0);
  assert.equal(rows[0].sales, -50000);
  assert.equal(rows[0].cogs, -36000);
  assert.equal(rows[0].net, -108000);
  const range = report(s, "2026-09-10", "2026-09-12");
  for (const key of [
    "sales",
    "cogs",
    "gross",
    "fuel",
    "operating",
    "purchases",
    "loss",
    "refunds",
    "net",
    "count",
  ] as const) {
    assert.equal(
      rows.reduce((sum, r) => sum + r[key], 0),
      range[key],
      key,
    );
  }
  assert.equal(reportByDay(s, "2026-09-01", "2026-09-01")[0].sales, 0);
  assert.equal(reportByDay(s, "2026-09-09", "2026-09-09")[0].net, 0);
  assert.deepEqual(reportByDay(s, "2026-09-12", "2026-09-10"), []);
});

test("daily navigation crosses month/year boundaries without timezone drift", () => {
  assert.equal(shiftDate("2026-10-01", -1), "2026-09-30");
  assert.equal(shiftDate("2026-12-31", 1), "2027-01-01");
  assert.equal(shiftDate("2024-03-01", -1), "2024-02-29");
});
const order = (qty = 5): Order => ({
  id: "PSN-TEST",
  customerId: "c1",
  date,
  items: [{ productId: "p1", qty, price: 25000, cost: 18000 }],
  discount: 0,
  note: "Uji",
  status: "baru",
});
function ship(s: State, id: string) {
  s = execute(s, { type: "status", id, status: "dikonfirmasi" });
  s = execute(s, { type: "status", id, status: "disiapkan" });
  s = execute(s, {
    type: "trip",
    value: {
      id: "trip-test",
      date,
      driver: "Petugas",
      vehicle: "B 1234 XX",
      address: "Jakarta",
      note: "",
      orderIds: [id],
      status: "Terjadwal",
    },
  });
  return execute(s, { type: "tripStatus", id: "trip-test" });
}
test("seed is valid, opening movements reconcile physical stock, baseline report is reproducible", () => {
  const s = stateSchema.parse(demoState());
  s.products.forEach((p) => {
    const movements = s.movements
      .filter((m) => m.productId === p.id)
      .reduce(
        (n, m) => n + (["Masuk", "Retur"].includes(m.type) ? m.qty : -m.qty),
        0,
      );
    assert.equal(p.stock, movements);
    assert.ok(available(s, p) >= 0);
  });
  const r = report(s, date, date);
  assert.equal(r.sales, 4100000);
  assert.equal(r.cogs, 2980000);
  assert.equal(r.fuel, 175000);
  assert.equal(r.net, 851000);
  assert.equal(report(s, "2000-01-01", "2000-01-02").sales, 0);
});
test("overbooking fails atomically; cancellation releases reservations exactly once", () => {
  const initial = demoState();
  const p = initial.products[0];
  assert.throws(
    () => execute(initial, { type: "order", value: order(166) }),
    /stok tersedia/,
  );
  const s = execute(initial, { type: "order", value: order(5) });
  assert.equal(available(s, p), available(initial, p) - 5);
  assert.equal(s.products[0].stock, p.stock);
  const cancelled = execute(s, {
    type: "status",
    id: "PSN-TEST",
    status: "dibatalkan",
  });
  assert.equal(available(cancelled, p), available(initial, p));
  assert.throws(() =>
    execute(cancelled, {
      type: "status",
      id: "PSN-TEST",
      status: "dibatalkan",
    }),
  );
  assert.equal(initial.orders.length, 6);
});
test("shipping consumes physical stock once; completion recognizes sales independently of payment", () => {
  const initial = demoState();
  const added = execute(initial, { type: "order", value: order() });
  const s = ship(added, "PSN-TEST");
  assert.equal(s.products[0].stock, initial.products[0].stock - 5);
  assert.equal(reserved(s, "p1"), reserved(initial, "p1"));
  assert.throws(() =>
    execute(s, { type: "status", id: "PSN-TEST", status: "dibatalkan" }),
  );
  assert.equal(report(s, date, date).sales, 4100000);
  const completed = execute(s, { type: "tripStatus", id: "trip-test" });
  assert.equal(report(completed, date, date).sales, 4225000);
  assert.equal(paid(completed, "PSN-TEST"), 0);
  assert.throws(() =>
    execute(completed, { type: "tripStatus", id: "trip-test" }),
  );
});
test("transfer requires proof; pending amounts prevent duplicate overpayment", () => {
  let s = execute(demoState(), {
    type: "payment",
    value: {
      id: "test-payment",
      orderId: "PSN-1005",
      date,
      amount: 500000,
      method: "Transfer",
      verified: true,
      deposited: 0,
    },
  });
  assert.equal(paid(s, "PSN-1005"), 0);
  assert.throws(
    () => execute(s, { type: "verify", id: "test-payment" }),
    /Bukti/,
  );
  assert.throws(
    () =>
      execute(s, {
        type: "payment",
        value: {
          id: "test-payment2",
          orderId: "PSN-1005",
          date,
          amount: 1,
          method: "Tunai",
          verified: true,
          deposited: 0,
        },
      }),
    /melebihi/,
  );
  s = execute(s, {
    type: "proof",
    id: "test-payment",
    proof: s.payments[0].proof!,
  });
  s = execute(s, { type: "verify", id: "test-payment" });
  assert.equal(paid(s, "PSN-1005"), 500000);
});
test("COD collection and deposit are separate and deposits cannot exceed collection", () => {
  const initial = demoState();
  const s = execute(initial, {
    type: "deposit",
    id: "BYR-002",
    amount: 200000,
  });
  assert.equal(s.payments[1].deposited, 1700000);
  assert.equal(paid(s, "PSN-1002"), paid(initial, "PSN-1002"));
  assert.equal(report(s, date, date).net, report(initial, date, date).net);
  assert.throws(
    () => execute(s, { type: "deposit", id: "BYR-002", amount: 250001 }),
    /melebihi/,
  );
});
test("damaged return never restores stock or deducts COGS twice", () => {
  const initial = demoState();
  const s = execute(initial, {
    type: "returnDecision",
    id: "RTR-001",
    approve: true,
  });
  assert.equal(s.products[0].stock, initial.products[0].stock);
  const r = report(s, date, date);
  assert.equal(r.cogs, 2980000);
  assert.equal(r.sales, 4050000);
  assert.equal(r.net, 801000);
  assert.throws(() =>
    execute(s, { type: "returnDecision", id: "RTR-001", approve: true }),
  );
});
test("resellable return restores only approved quantity and reverses original snapshot cost", () => {
  const initial = demoState();
  let s = execute(initial, {
    type: "return",
    value: {
      ...initial.returns[0],
      id: "R2",
      qty: 3,
      condition: "Layak jual",
      refund: 75000,
    },
  });
  assert.equal(s.products[0].stock, initial.products[0].stock);
  s = execute(s, { type: "returnDecision", id: "R2", approve: true });
  assert.equal(s.products[0].stock, initial.products[0].stock + 3);
  assert.equal(report(s, date, date).cogs, 2980000 - 54000);
  assert.throws(
    () =>
      execute(s, {
        type: "return",
        value: { ...initial.returns[0], id: "R3", qty: 46, refund: 0 },
      }),
    /Jumlah retur/,
  );
});
test("purchase expenses do not duplicate COGS; fuel is counted once for a multi-order trip", () => {
  const initial = demoState();
  let s = execute(initial, {
    type: "expense",
    value: {
      id: "e-test",
      date,
      amount: 1000000,
      category: "Pembelian buah",
      person: "Owner",
      tripId: "",
      vehicle: "",
      note: "Pembelian",
    },
  });
  assert.equal(report(s, date, date).net, report(initial, date, date).net);
  assert.equal(report(s, date, date).purchases, 1000000);
  s = execute(s, {
    type: "expense",
    value: {
      id: "fuel-test",
      date,
      amount: 50000,
      category: "Bensin",
      person: "Dedi",
      tripId: "JLN-001",
      vehicle: "",
      note: "Bensin",
    },
  });
  assert.equal(report(s, date, date).fuel, 225000);
});
test("reserved stock cannot be damaged out and simulated warehouse role cannot modify finances", () => {
  const s = demoState();
  assert.throws(
    () =>
      execute(s, {
        type: "stock",
        productId: "p1",
        qty: 170,
        kind: "Rusak",
        date,
        note: "",
      }),
    /cadangan/,
  );
  assert.throws(
    () =>
      execute(s, { type: "deposit", id: "BYR-002", amount: 1 }, "Admin Gudang"),
    /Owner/,
  );
  assert.throws(
    () =>
      execute(
        s,
        { type: "returnDecision", id: "RTR-001", approve: true },
        "Admin Gudang",
      ),
    /Owner/,
  );
});

test("deletion protects references, automatic stock movements, and Owner permissions atomically", () => {
  const s = demoState();
  const snapshot = structuredClone(s);
  for (const [collection, id] of [
    ["customers", "c1"],
    ["products", "p1"],
    ["orders", "PSN-1001"],
    ["trips", "JLN-001"],
    ["movements", "MUT-K0"],
  ] as const) {
    assert.throws(() => execute(s, { type: "delete", collection, id }));
    assert.deepEqual(s, snapshot);
  }
  for (const collection of [
    "customers",
    "products",
    "orders",
    "trips",
    "payments",
    "expenses",
    "returns",
    "movements",
  ] as const) {
    assert.throws(
      () =>
        execute(
          s,
          { type: "delete", collection, id: s[collection][0].id },
          "Admin Gudang",
        ),
      /Owner/,
    );
  }
});

test("deleting expenses and payments recalculates balances and protects refund funding", () => {
  const s = demoState();
  const withoutExpense = execute(s, {
    type: "delete",
    collection: "expenses",
    id: "BIA-001",
  });
  assert.equal(
    report(withoutExpense, date, date).net,
    report(s, date, date).net + 100000,
  );
  assert.throws(
    () => execute(s, { type: "delete", collection: "payments", id: "BYR-001" }),
    /refund/,
  );
  const withoutReturn = execute(s, {
    type: "delete",
    collection: "returns",
    id: "RTR-001",
  });
  const withoutPayment = execute(withoutReturn, {
    type: "delete",
    collection: "payments",
    id: "BYR-001",
  });
  assert.equal(paid(withoutPayment, "PSN-1001"), 0);
  assert.equal(
    report(withoutPayment, date, date).sales,
    report(withoutReturn, date, date).sales,
  );
  assert.throws(
    () =>
      execute(withoutPayment, {
        type: "delete",
        collection: "payments",
        id: "BYR-001",
      }),
    /tidak ditemukan/,
  );
});

test("deleting an approved resellable return reverses stock, refund, COGS and its movement", () => {
  const s = demoState();
  s.returns[0].condition = "Layak jual";
  const approved = execute(s, {
    type: "returnDecision",
    id: "RTR-001",
    approve: true,
  });
  const deleted = execute(approved, {
    type: "delete",
    collection: "returns",
    id: "RTR-001",
  });
  assert.equal(deleted.products[0].stock, s.products[0].stock);
  assert.deepEqual(report(deleted, date, date), report(s, date, date));
  assert.ok(!deleted.movements.some((m) => m.note === "RTR-001"));
  const used = structuredClone(approved);
  used.products[0].stock = reserved(used, "p1");
  assert.throws(
    () =>
      execute(used, { type: "delete", collection: "returns", id: "RTR-001" }),
    /sudah dipakai/,
  );
  assert.equal(used.returns[0].status, "Disetujui");
});

test("deleting shipment restores physical stock, prepared orders and removes recognized sales", () => {
  let s = demoState();
  for (const id of s.returns.map((r) => r.id))
    s = execute(s, { type: "delete", collection: "returns", id });
  for (const id of s.payments.map((p) => p.id))
    s = execute(s, { type: "delete", collection: "payments", id });
  for (const id of s.expenses.map((e) => e.id))
    s = execute(s, { type: "delete", collection: "expenses", id });
  const before = structuredClone(s);
  s = execute(s, { type: "delete", collection: "trips", id: "JLN-001" });
  assert.equal(s.products[0].stock, before.products[0].stock + 50);
  assert.equal(s.products[1].stock, before.products[1].stock + 50);
  assert.equal(s.orders[0].status, "disiapkan");
  assert.equal(s.orders[0].completedAt, undefined);
  assert.equal(report(s, date, date).sales, 0);
  assert.ok(!s.movements.some((m) => m.note === "PSN-1001"));
  assert.equal(
    available(s, s.products[0]),
    available(before, before.products[0]),
  );
});

test("every demo record can be deleted in dependency order, leaving valid empty data", () => {
  let s = demoState();
  for (const collection of [
    "returns",
    "payments",
    "expenses",
    "trips",
    "orders",
  ] as const) {
    for (const id of s[collection].map((row) => row.id))
      s = execute(s, { type: "delete", collection, id });
  }
  // Undo stock losses before removing opening stock.
  for (const id of s.movements.toReversed().map((row) => row.id))
    s = execute(s, { type: "delete", collection: "movements", id });
  for (const collection of ["products", "customers"] as const) {
    for (const id of s[collection].map((row) => row.id))
      s = execute(s, { type: "delete", collection, id });
  }
  stateSchema.parse(s);
  assert.ok(
    Object.entries(s)
      .filter(([key]) => key !== "version")
      .every(([, rows]) => Array.isArray(rows) && rows.length === 0),
  );
  assert.equal(report(s, date, date).net, 0);
});
