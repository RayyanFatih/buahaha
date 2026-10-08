import { z } from "zod";

export const statuses = [
  "baru",
  "dikonfirmasi",
  "disiapkan",
  "dikirim",
  "selesai",
  "dibatalkan",
] as const;
export type Status = (typeof statuses)[number];
export type Role = "Owner" | "Admin Gudang";
export type Product = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  cost: number;
  price: number;
  stock: number;
  low: number;
  color: string;
};
export type Customer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  note: string;
};
export type Item = {
  productId: string;
  qty: number;
  price: number;
  cost: number;
};
export type Order = {
  id: string;
  customerId: string;
  date: string;
  completedAt?: string;
  items: Item[];
  discount: number;
  note: string;
  status: Status;
  paymentMethod?: "Transfer" | "COD";
};
export type Evidence = { name: string; data: string; type: string };
export type Payment = {
  id: string;
  orderId: string;
  date: string;
  amount: number;
  method: "Transfer" | "Tunai" | "COD";
  verified: boolean;
  deposited: number;
  proof?: Evidence;
};
export type Trip = {
  id: string;
  orderIds: string[];
  date: string;
  driver: string;
  vehicle: string;
  address: string;
  note: string;
  status: "Terjadwal" | "Dalam perjalanan" | "Terkirim";
};
export type Expense = {
  id: string;
  date: string;
  category: "Bensin" | "Pembelian buah" | "Operasional";
  amount: number;
  person: string;
  tripId: string;
  vehicle: string;
  note: string;
  proof?: Evidence;
};
export type Return = {
  id: string;
  orderId: string;
  productId: string;
  qty: number;
  reason: string;
  date: string;
  status: "Diajukan" | "Disetujui" | "Ditolak";
  condition: "Layak jual" | "Rusak";
  refund: number;
  proof: Evidence;
};
export type Movement = {
  id: string;
  date: string;
  productId: string;
  qty: number;
  type: "Masuk" | "Keluar" | "Rusak" | "Retur";
  note: string;
  loss: number;
};
export type State = {
  version: 1;
  products: Product[];
  customers: Customer[];
  orders: Order[];
  payments: Payment[];
  trips: Trip[];
  expenses: Expense[];
  returns: Return[];
  movements: Movement[];
};
const num = z.number().finite().nonnegative();
const id = z.string().min(1);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const evidence = z.object({
  name: id,
  data: z.string().startsWith("data:"),
  type: id,
});
export const stateSchema = z.object({
  version: z.literal(1),
  products: z.array(
    z.object({
      id,
      name: id,
      sku: id,
      unit: id,
      cost: num,
      price: num,
      stock: num,
      low: num,
      color: id,
    }),
  ),
  customers: z.array(
    z.object({ id, name: id, phone: id, address: id, note: z.string() }),
  ),
  orders: z.array(
    z.object({
      id,
      customerId: id,
      date,
      completedAt: date.optional(),
      items: z
        .array(
          z.object({
            productId: id,
            qty: num.positive(),
            price: num,
            cost: num,
          }),
        )
        .min(1),
      discount: num,
      note: z.string(),
      status: z.enum(statuses),
      paymentMethod: z.enum(["Transfer", "COD"]).optional(),
    }),
  ),
  payments: z.array(
    z.object({
      id,
      orderId: id,
      date,
      amount: num.positive(),
      method: z.enum(["Transfer", "Tunai", "COD"]),
      verified: z.boolean(),
      deposited: num,
      proof: evidence.optional(),
    }),
  ),
  trips: z.array(
    z.object({
      id,
      orderIds: z.array(id).min(1),
      date,
      driver: id,
      vehicle: id,
      address: id,
      note: z.string(),
      status: z.enum(["Terjadwal", "Dalam perjalanan", "Terkirim"]),
    }),
  ),
  expenses: z.array(
    z.object({
      id,
      date,
      category: z.enum(["Bensin", "Pembelian buah", "Operasional"]),
      amount: num.positive(),
      person: id,
      tripId: z.string(),
      vehicle: z.string(),
      note: z.string(),
      proof: evidence.optional(),
    }),
  ),
  returns: z.array(
    z.object({
      id,
      orderId: id,
      productId: id,
      qty: num.positive(),
      reason: id,
      date,
      status: z.enum(["Diajukan", "Disetujui", "Ditolak"]),
      condition: z.enum(["Layak jual", "Rusak"]),
      refund: num,
      proof: evidence,
    }),
  ),
  movements: z.array(
    z.object({
      id,
      date,
      productId: id,
      qty: num.positive(),
      type: z.enum(["Masuk", "Keluar", "Rusak", "Retur"]),
      note: z.string(),
      loss: num,
    }),
  ),
});
export const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
export const money = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
export const quantity = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n);
export const dateLabel = (d: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(d + "T12:00:00"));
export const total = (o: Order) =>
  o.items.reduce((a, i) => a + i.qty * i.price, 0) - o.discount;
export const paid = (s: State, orderId: string) =>
  s.payments
    .filter((p) => p.orderId === orderId && p.verified)
    .reduce((a, p) => a + p.amount, 0);
export const unrecordedAmount = (s: State, order: Order) =>
  Math.max(
    0,
    total(order) -
      s.payments
        .filter((p) => p.orderId === order.id)
        .reduce((n, p) => n + p.amount, 0),
  );
export const reserved = (s: State, productId: string) =>
  s.orders
    .filter((o) => ["baru", "dikonfirmasi", "disiapkan"].includes(o.status))
    .flatMap((o) => o.items)
    .filter((i) => i.productId === productId)
    .reduce((a, i) => a + i.qty, 0);
export const available = (s: State, p: Product) => p.stock - reserved(s, p.id);
export const paymentStatus = (s: State, o: Order) =>
  paid(s, o.id) >= total(o)
    ? "Lunas"
    : paid(s, o.id) > 0
      ? "Sebagian"
      : "Belum lunas";
function requireThat(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
export type Command =
  | { type: "delete"; collection: DeletableCollection; id: string }
  | { type: "customer"; value: Customer }
  | { type: "product"; value: Product }
  | {
      type: "stock";
      productId: string;
      qty: number;
      kind: "Masuk" | "Keluar" | "Rusak";
      note: string;
      date: string;
    }
  | { type: "order"; value: Order; initialPayment?: Payment }
  | { type: "status"; id: string; status: Status }
  | { type: "trip"; value: Trip }
  | { type: "tripStatus"; id: string }
  | { type: "payment"; value: Payment }
  | { type: "verify"; id: string }
  | { type: "proof"; id: string; proof: Evidence }
  | { type: "deposit"; id: string; amount: number }
  | { type: "expense"; value: Expense }
  | { type: "return"; value: Return }
  | { type: "returnDecision"; id: string; approve: boolean };

export type DeletableCollection = Exclude<keyof State, "version">;

function undoShipment(s: State, order: Order) {
  if (!["dikirim", "selesai"].includes(order.status)) return;
  const movements = s.movements.filter(
    (m) => m.type === "Keluar" && m.note === order.id,
  );
  requireThat(
    movements.length === order.items.length &&
      order.items.every((item) =>
        movements.some(
          (m) =>
            m.productId === item.productId &&
            m.qty === item.qty &&
            m.loss === 0,
        ),
      ),
    "Mutasi pengiriman tidak cocok dengan pesanan. Periksa riwayat stok sebelum menghapus.",
  );
  for (const item of order.items) {
    const product = s.products.find((p) => p.id === item.productId);
    requireThat(product, "Produk pesanan tidak ditemukan.");
    product.stock += item.qty;
  }
  s.movements = s.movements.filter((m) => !movements.includes(m));
}

function deleteRecord(s: State, collection: DeletableCollection, id: string) {
  requireThat(
    s[collection].some((row) => row.id === id),
    "Data sudah dihapus atau tidak ditemukan. Muat ulang daftar.",
  );
  if (collection === "customers") {
    requireThat(
      !s.orders.some((o) => o.customerId === id),
      "Pelanggan masih memiliki pesanan. Hapus pesanan terkait terlebih dahulu.",
    );
    s.customers = s.customers.filter((c) => c.id !== id);
  }
  if (collection === "products") {
    requireThat(
      !s.orders.some((o) => o.items.some((i) => i.productId === id)) &&
        !s.returns.some((r) => r.productId === id),
      "Produk masih digunakan dalam pesanan atau retur. Hapus transaksi terkait terlebih dahulu.",
    );
    requireThat(
      !s.movements.some((m) => m.productId === id) &&
        s.products.find((p) => p.id === id)!.stock === 0,
      "Produk masih memiliki stok atau mutasi. Hapus riwayat mutasi terkait terlebih dahulu sampai stok nol.",
    );
    s.products = s.products.filter((p) => p.id !== id);
  }
  if (collection === "orders") {
    requireThat(
      !s.payments.some((p) => p.orderId === id) &&
        !s.returns.some((r) => r.orderId === id),
      "Pesanan memiliki pembayaran atau retur. Hapus pembayaran dan retur terkait terlebih dahulu.",
    );
    requireThat(
      !s.trips.some((t) => t.orderIds.includes(id)),
      "Pesanan masih terhubung ke pengiriman. Hapus perjalanan terkait terlebih dahulu.",
    );
    undoShipment(
      s,
      s.orders.find((o) => o.id === id)!,
    );
    s.orders = s.orders.filter((o) => o.id !== id);
  }
  if (collection === "trips") {
    const trip = s.trips.find((t) => t.id === id)!;
    requireThat(
      !s.expenses.some((e) => e.tripId === id),
      "Perjalanan masih memiliki pengeluaran. Hapus pengeluaran terkait terlebih dahulu.",
    );
    requireThat(
      !s.payments.some((p) => trip.orderIds.includes(p.orderId)) &&
        !s.returns.some((r) => trip.orderIds.includes(r.orderId)),
      "Pesanan dalam perjalanan memiliki pembayaran atau retur. Hapus transaksi terkait terlebih dahulu.",
    );
    for (const orderId of trip.orderIds) {
      const order = s.orders.find((o) => o.id === orderId);
      requireThat(order, "Pesanan perjalanan tidak ditemukan.");
      undoShipment(s, order);
      order.status = "disiapkan";
      delete order.completedAt;
    }
    s.trips = s.trips.filter((t) => t.id !== id);
  }
  if (collection === "payments") {
    const payment = s.payments.find((p) => p.id === id)!;
    const remaining = s.payments
      .filter((p) => p.id !== id && p.orderId === payment.orderId && p.verified)
      .reduce((n, p) => n + p.amount, 0);
    const refunds = s.returns
      .filter((r) => r.orderId === payment.orderId && r.status !== "Ditolak")
      .reduce((n, r) => n + r.refund, 0);
    requireThat(
      refunds <= remaining,
      "Pembayaran mendukung refund retur. Hapus retur terkait terlebih dahulu.",
    );
    s.payments = s.payments.filter((p) => p.id !== id);
  }
  if (collection === "expenses")
    s.expenses = s.expenses.filter((e) => e.id !== id);
  if (collection === "returns") {
    const record = s.returns.find((r) => r.id === id)!;
    if (record.status === "Disetujui" && record.condition === "Layak jual") {
      const product = s.products.find((p) => p.id === record.productId);
      requireThat(
        product && available(s, product) >= record.qty,
        "Stok hasil retur sudah dipakai atau dicadangkan. Pulihkan stok tersedia sebelum menghapus retur.",
      );
      const movements = s.movements.filter(
        (m) => m.type === "Retur" && m.note === id,
      );
      requireThat(
        movements.length === 1 &&
          movements[0].productId === record.productId &&
          movements[0].qty === record.qty,
        "Mutasi retur tidak cocok. Periksa riwayat stok sebelum menghapus.",
      );
      product.stock -= record.qty;
      s.movements = s.movements.filter((m) => !movements.includes(m));
    }
    s.returns = s.returns.filter((r) => r.id !== id);
  }
  if (collection === "movements") {
    const movement = s.movements.find((m) => m.id === id)!;
    requireThat(
      !(
        movement.type === "Keluar" &&
        s.orders.some((o) => o.id === movement.note)
      ) &&
        !(
          movement.type === "Retur" &&
          s.returns.some((r) => r.id === movement.note)
        ),
      "Mutasi dibuat oleh pengiriman atau retur. Hapus transaksi sumbernya agar stok dihitung dengan benar.",
    );
    const product = s.products.find((p) => p.id === movement.productId);
    requireThat(product, "Produk mutasi tidak ditemukan.");
    const change = ["Masuk", "Retur"].includes(movement.type)
      ? -movement.qty
      : movement.qty;
    requireThat(
      available(s, product) + change >= 0,
      "Penghapusan akan membuat stok tersedia negatif. Hapus pesanan terkait atau pulihkan stok terlebih dahulu.",
    );
    product.stock += change;
    s.movements = s.movements.filter((m) => m.id !== id);
  }
}

function transition(s: State, order: Order, status: Status) {
  const steps = statuses.slice(0, 5);
  if (status === "dibatalkan") {
    requireThat(
      ["baru", "dikonfirmasi", "disiapkan"].includes(order.status),
      "Pesanan sudah dikirim. Gunakan alur retur.",
    );
    requireThat(
      !s.payments.some((p) => p.orderId === order.id),
      "Pesanan memiliki pembayaran. Pembatalan dengan pengembalian dana belum didukung prototipe.",
    );
    requireThat(
      !s.trips.some((t) => t.orderIds.includes(order.id)),
      "Pesanan sudah masuk perjalanan dan tidak dapat dibatalkan di prototipe.",
    );
  } else {
    requireThat(
      steps.indexOf(status) === steps.indexOf(order.status) + 1 &&
        order.status !== "dibatalkan",
      "Urutan status pesanan tidak valid.",
    );
    if (status === "dikirim") {
      requireThat(
        order.paymentMethod !== "Transfer" || paid(s, order.id) >= total(order),
        `Transfer ${order.id} harus lunas dan terverifikasi sebelum dikirim.`,
      );
      requireThat(
        s.trips.some((t) => t.orderIds.includes(order.id)),
        "Jadwalkan perjalanan pengiriman terlebih dahulu.",
      );
      order.items.forEach((i) => {
        const p = s.products.find((p) => p.id === i.productId)!;
        requireThat(p.stock >= i.qty, "Stok fisik tidak mencukupi.");
        p.stock -= i.qty;
        s.movements.push({
          id: uid("MUT"),
          date: today(),
          productId: p.id,
          qty: i.qty,
          type: "Keluar",
          note: order.id,
          loss: 0,
        });
      });
    }
    if (status === "selesai") order.completedAt = today();
  }
  order.status = status;
}
export function execute(
  state: State,
  command: Command,
  role: Role = "Owner",
): State {
  const finance = ["payment", "verify", "proof", "deposit", "expense"];
  requireThat(
    role === "Owner" || !finance.includes(command.type),
    "Tindakan keuangan hanya tersedia untuk Owner dalam simulasi ini.",
  );
  const s = structuredClone(state);
  const c = command;
  if (c.type === "delete") {
    requireThat(
      role === "Owner",
      "Penghapusan data hanya tersedia untuk Owner.",
    );
    deleteRecord(s, c.collection, c.id);
  }
  if (c.type === "customer") {
    requireThat(
      c.value.name.trim() &&
        c.value.address.trim() &&
        /^[+\d\s-]{8,18}$/.test(c.value.phone),
      "Lengkapi nama, alamat, dan nomor WhatsApp yang valid.",
    );
    const index = s.customers.findIndex((x) => x.id === c.value.id);
    if (index < 0) s.customers.push(c.value);
    else s.customers[index] = c.value;
  }
  if (c.type === "product") {
    requireThat(
      c.value.name.trim() && c.value.sku.trim(),
      "Nama dan SKU wajib diisi.",
    );
    requireThat(
      !s.products.some(
        (p) =>
          p.sku.toLowerCase() === c.value.sku.toLowerCase() &&
          p.id !== c.value.id,
      ),
      "SKU sudah digunakan.",
    );
    const old = s.products.find((p) => p.id === c.value.id);
    if (old) {
      requireThat(
        old.unit === c.value.unit,
        "Satuan produk yang tersimpan tidak dapat diubah.",
      );
      Object.assign(old, c.value, { stock: old.stock });
    } else s.products.push({ ...c.value, stock: 0 });
  }
  if (c.type === "stock") {
    const p = s.products.find((p) => p.id === c.productId);
    requireThat(
      p && c.qty > 0 && Number.isFinite(c.qty),
      "Produk dan jumlah stok harus valid.",
    );
    if (c.kind !== "Masuk")
      requireThat(
        available(s, p) >= c.qty,
        "Jumlah melebihi stok tersedia; stok cadangan dilindungi.",
      );
    p.stock += c.kind === "Masuk" ? c.qty : -c.qty;
    s.movements.push({
      id: uid("MUT"),
      date: c.date,
      productId: p.id,
      qty: c.qty,
      type: c.kind,
      note: c.note,
      loss: c.kind === "Rusak" ? p.cost * c.qty : 0,
    });
  }
  if (c.type === "order") {
    const o = c.value;
    requireThat(
      s.customers.some((x) => x.id === o.customerId),
      "Pilih pelanggan yang valid.",
    );
    requireThat(
      !s.orders.some((x) => x.id === o.id) && o.status === "baru",
      "Nomor atau status awal pesanan tidak valid.",
    );
    requireThat(
      o.items.length &&
        new Set(o.items.map((i) => i.productId)).size === o.items.length,
      "Pilih item berbeda untuk setiap baris.",
    );
    o.items.forEach((i) => {
      const p = s.products.find((p) => p.id === i.productId);
      requireThat(
        p && i.qty > 0 && i.qty <= available(s, p),
        "Jumlah pesanan melebihi stok tersedia.",
      );
      i.cost = p.cost;
    });
    requireThat(
      o.discount >= 0 && total(o) >= 0,
      "Diskon tidak boleh melebihi subtotal.",
    );
    s.orders.push(o);
    if (c.initialPayment) {
      requireThat(
        role === "Owner",
        "Pencatatan transfer hanya tersedia untuk Owner.",
      );
      requireThat(
        o.paymentMethod === "Transfer" &&
          c.initialPayment.method === "Transfer" &&
          c.initialPayment.orderId === o.id &&
          c.initialPayment.proof?.data,
        "Transfer awal harus terkait pesanan ini dan dilengkapi bukti.",
      );
      return execute(s, { type: "payment", value: c.initialPayment }, role);
    }
  }
  if (c.type === "status") {
    const o = s.orders.find((o) => o.id === c.id);
    requireThat(o, "Pesanan tidak ditemukan.");
    transition(s, o, c.status);
  }
  if (c.type === "trip") {
    requireThat(
      c.value.orderIds.length > 0 &&
        new Set(c.value.orderIds).size === c.value.orderIds.length,
      "Pilih minimal satu pesanan.",
    );
    c.value.orderIds.forEach((id) =>
      requireThat(
        s.orders.some((o) => o.id === id && o.status === "disiapkan") &&
          !s.trips.some((t) => t.orderIds.includes(id)),
        "Hanya pesanan disiapkan yang belum memiliki perjalanan dapat dipilih.",
      ),
    );
    s.trips.push(c.value);
  }
  if (c.type === "tripStatus") {
    const t = s.trips.find((t) => t.id === c.id);
    requireThat(t && t.status !== "Terkirim", "Perjalanan sudah selesai.");
    t.orderIds.forEach((id) => {
      const o = s.orders.find((o) => o.id === id)!;
      if (t.status === "Terjadwal")
        requireThat(
          o.paymentMethod !== "Transfer" || paid(s, o.id) >= total(o),
          `Transfer ${o.id} harus lunas dan terverifikasi sebelum dikirim.`,
        );
      const next = t.status === "Terjadwal" ? "dikirim" : "selesai";
      if (o.status !== next && o.status !== "selesai") transition(s, o, next);
    });
    t.status = t.status === "Terjadwal" ? "Dalam perjalanan" : "Terkirim";
  }
  if (c.type === "payment") {
    const p = c.value;
    const o = s.orders.find((o) => o.id === p.orderId);
    requireThat(o && o.status !== "dibatalkan", "Pilih pesanan aktif.");
    requireThat(
      !s.payments.some((record) => record.id === p.id),
      "Pembayaran ini sudah tercatat.",
    );
    requireThat(
      !o.paymentMethod || p.method === o.paymentMethod,
      "Metode pembayaran harus sesuai dengan pesanan.",
    );
    requireThat(
      o.paymentMethod !== "COD" || o.status === "selesai",
      "Catat penerimaan Cash/COD setelah barang diterima pelanggan.",
    );
    const recorded = s.payments
      .filter((x) => x.orderId === o.id)
      .reduce((a, x) => a + x.amount, 0);
    requireThat(
      p.amount > 0 && p.amount <= total(o) - recorded,
      "Pembayaran melebihi sisa tagihan, termasuk transfer menunggu verifikasi.",
    );
    p.verified = p.method !== "Transfer";
    p.deposited = 0;
    s.payments.push(p);
  }
  if (c.type === "verify") {
    const p = s.payments.find((p) => p.id === c.id);
    requireThat(
      p && p.method === "Transfer" && p.proof?.data,
      "Bukti transfer wajib diunggah sebelum verifikasi.",
    );
    p.verified = true;
  }
  if (c.type === "proof") {
    const p = s.payments.find((p) => p.id === c.id);
    requireThat(p && !p.verified, "Pembayaran sudah terverifikasi.");
    p.proof = c.proof;
  }
  if (c.type === "deposit") {
    const p = s.payments.find((p) => p.id === c.id);
    requireThat(
      p &&
        p.method === "COD" &&
        c.amount > 0 &&
        c.amount <= p.amount - p.deposited,
      "Nominal setoran melebihi COD yang belum disetor.",
    );
    p.deposited += c.amount;
  }
  if (c.type === "expense") {
    requireThat(
      !c.value.tripId || s.trips.some((t) => t.id === c.value.tripId),
      "Perjalanan tidak ditemukan.",
    );
    s.expenses.push(c.value);
  }
  if (c.type === "return") {
    const r = c.value;
    const o = s.orders.find((o) => o.id === r.orderId);
    const i = o?.items.find((i) => i.productId === r.productId);
    requireThat(
      o && i && o.status === "selesai",
      "Retur hanya untuk item dari pesanan selesai.",
    );
    const prior = s.returns
      .filter(
        (x) =>
          x.orderId === o.id &&
          x.productId === i.productId &&
          x.status !== "Ditolak",
      )
      .reduce((a, x) => a + x.qty, 0);
    requireThat(
      r.qty > 0 && r.qty + prior <= i.qty,
      "Jumlah retur melebihi jumlah yang masih dapat diretur.",
    );
    const proportion =
      total(o) / o.items.reduce((a, i) => a + i.qty * i.price, 0) || 0;
    const refunds = s.returns
      .filter((x) => x.orderId === o.id && x.status !== "Ditolak")
      .reduce((a, x) => a + x.refund, 0);
    requireThat(
      r.refund >= 0 &&
        r.refund <= r.qty * i.price * proportion &&
        r.refund + refunds <= paid(s, o.id),
      "Refund melebihi nilai item bersih atau pembayaran diterima.",
    );
    requireThat(
      r.proof?.data && r.reason.trim(),
      "Alasan dan bukti retur wajib diisi.",
    );
    r.status = "Diajukan";
    s.returns.push(r);
  }
  if (c.type === "returnDecision") {
    const r = s.returns.find((r) => r.id === c.id);
    requireThat(r && r.status === "Diajukan", "Retur sudah diputuskan.");
    requireThat(
      role === "Owner" || r.refund === 0,
      "Retur dengan refund membutuhkan Owner dalam simulasi ini.",
    );
    r.status = c.approve ? "Disetujui" : "Ditolak";
    r.date = today();
    if (c.approve && r.condition === "Layak jual") {
      s.products.find((p) => p.id === r.productId)!.stock += r.qty;
      s.movements.push({
        id: uid("MUT"),
        date: today(),
        productId: r.productId,
        qty: r.qty,
        type: "Retur",
        note: r.id,
        loss: 0,
      });
    }
  }
  return stateSchema.parse(s);
}

export function report(s: State, from: string, to: string) {
  const within = (d: string) => d >= from && d <= to;
  const orders = s.orders.filter(
    (o) => o.status === "selesai" && within(o.completedAt || o.date),
  );
  const returns = s.returns.filter(
    (r) => r.status === "Disetujui" && within(r.date),
  );
  const refunds = returns.reduce((a, r) => a + r.refund, 0);
  const recoveredCost = returns
    .filter((r) => r.condition === "Layak jual")
    .reduce(
      (a, r) =>
        a +
        r.qty *
          s.orders
            .find((o) => o.id === r.orderId)!
            .items.find((i) => i.productId === r.productId)!.cost,
      0,
    );
  const sales = orders.reduce((a, o) => a + total(o), 0) - refunds;
  const cogs =
    orders.flatMap((o) => o.items).reduce((a, i) => a + i.qty * i.cost, 0) -
    recoveredCost;
  const expenses = s.expenses.filter((e) => within(e.date));
  const fuel = expenses
    .filter((e) => e.category === "Bensin")
    .reduce((a, e) => a + e.amount, 0);
  const operating = expenses
    .filter((e) => e.category === "Operasional")
    .reduce((a, e) => a + e.amount, 0);
  const purchases = expenses
    .filter((e) => e.category === "Pembelian buah")
    .reduce((a, e) => a + e.amount, 0);
  const loss = s.movements
    .filter((m) => within(m.date))
    .reduce((a, m) => a + m.loss, 0);
  return {
    sales,
    cogs,
    gross: sales - cogs,
    fuel,
    operating,
    purchases,
    loss,
    refunds,
    net: sales - cogs - fuel - operating - loss,
    count: orders.length,
  };
}

/** Calendar-day navigation independent of the browser's local timezone. */
export function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().split("T")[0];
}

/** Dates with recognized business activity, not order creation or cash collection. */
export function reportByDay(s: State, from: string, to: string) {
  if (from > to) return [];
  const dates = new Set<string>([
    ...s.orders
      .filter((o) => o.status === "selesai")
      .map((o) => o.completedAt || o.date),
    ...s.returns.filter((r) => r.status === "Disetujui").map((r) => r.date),
    ...s.expenses.map((e) => e.date),
    ...s.movements.filter((m) => m.loss > 0).map((m) => m.date),
    ...(from === to ? [from] : []),
  ]);
  return [...dates]
    .filter((date) => date >= from && date <= to)
    .sort()
    .reverse()
    .map((date) => ({ date, ...report(s, date, date) }));
}
