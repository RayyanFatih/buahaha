"use client";
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Download,
  Fuel,
  LayoutDashboard,
  Leaf,
  Menu,
  Package,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBasket,
  Truck,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PeriodFilter, type PeriodMode } from "@/components/period-filter";
import {
  available,
  Command,
  DeletableCollection,
  Customer,
  dateLabel,
  Evidence,
  Item,
  money,
  Order,
  paid,
  paymentStatus,
  Product,
  quantity,
  report,
  reportByDay,
  reserved,
  Role,
  State,
  statuses,
  today,
  total,
  uid,
} from "@/lib/domain";
import { backup, dispatch, download, resetData, useStore } from "@/lib/store";

const navigation = [
  { label: "Ringkasan", icon: LayoutDashboard },
  { label: "Pesanan", icon: ShoppingBasket },
  { label: "Produk & Stok", icon: Package },
  { label: "Pelanggan", icon: Users },
  { label: "Pengiriman", icon: Truck },
  { label: "Pembayaran", icon: Wallet },
  { label: "Pengeluaran", icon: ReceiptText },
  { label: "Retur", icon: RotateCcw },
  { label: "Laporan", icon: ClipboardList },
];
type Panel = { type: string; id?: string } | null;
const titles: Record<string, string> = {
  customer: "Tambah pelanggan",
  product: "Tambah produk",
  stock: "Catat mutasi stok",
  order: "Buat pesanan",
  detail: "Edit pesanan",
  movement: "Edit mutasi stok",
  trip: "Jadwalkan pengiriman",
  payment: "Catat pembayaran",
  expense: "Catat pengeluaran",
  return: "Ajukan retur",
  proof: "Unggah bukti transfer",
  deposit: "Catat setoran COD",
};
const descriptions: Record<string, string> = {
  Ringkasan: "Semua yang perlu Anda pantau, dalam satu tempat.",
  Pesanan: "Dari pesanan masuk hingga buah sampai ke pelanggan.",
  "Produk & Stok": "Stok yang akurat, operasional yang lebih tenang.",
  Pelanggan: "Kenali pelanggan dan setiap transaksi mereka.",
  Pengiriman: "Atur perjalanan. Pastikan setiap pesanan sampai.",
  Pembayaran: "Pantau tagihan, verifikasi transfer, dan setoran COD.",
  Pengeluaran: "Setiap biaya tercatat, setiap perjalanan terukur.",
  Retur: "Periksa kondisi buah dan selesaikan pengembalian.",
  Laporan: "Pahami hasil usaha dari transaksi yang tercatat.",
};
function Badge({ children }: { children: ReactNode }) {
  const label = String(children);
  return (
    <span
      className={`badge ${["selesai", "Lunas", "Terkirim", "Disetujui", "Terverifikasi", "Tersedia"].includes(label) ? "success" : ["dibatalkan", "Ditolak", "Rusak", "Stok rendah"].includes(label) ? "danger" : ["baru", "Belum lunas", "Menunggu", "Diajukan", "Terjadwal", "Sebagian"].includes(label) ? "warning" : "neutral"}`}
    >
      <span />
      {label}
    </span>
  );
}
function Empty({ text = "Belum ada data yang sesuai." }: { text?: string }) {
  return (
    <div className="empty">
      <Package size={30} strokeWidth={1.4} />
      <strong>{text}</strong>
      <p>Ubah pencarian atau tambahkan data baru untuk memulai.</p>
    </div>
  );
}
function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {Children.map(children, (child) =>
        isValidElement(child) &&
        typeof child.type === "string" &&
        ["input", "select", "textarea"].includes(child.type)
          ? cloneElement(child as ReactElement<Record<string, unknown>>, {
              id,
              "aria-describedby": hint ? `${id}-hint` : undefined,
            })
          : child,
      )}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}
function Table({
  headings,
  children,
}: {
  headings: string[];
  children: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      setOverflow(element.scrollWidth > element.clientWidth + 1),
    );
    observer.observe(element);
    const table = element.querySelector("table");
    if (table) observer.observe(table);
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <div className={`table-scroll-hint ${overflow ? "is-visible" : ""}`}>
        <ArrowRight size={13} />
        Geser untuk melihat semua kolom
      </div>
      <div
        ref={scrollRef}
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Tabel data, geser untuk melihat semua kolom"
      >
        <table>
          <thead>
            <tr>
              {headings.map((h, n) => (
                <th key={n}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {Children.toArray(children).length === 0 && <Empty />}
    </>
  );
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      className="drawer"
      aria-label={title}
      ref={ref}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="drawer-inner">
        <header>
          <h2>{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            aria-label="Tutup panel"
          >
            <X size={20} />
          </Button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
function ProductMark({ p }: { p: Product }) {
  return (
    <span className={`product-mark ${p.color}`}>
      <Leaf size={20} strokeWidth={1.7} />
    </span>
  );
}
function ProofLink({ proof }: { proof: Evidence }) {
  return (
    <a className="text-link" href={proof.data} download={proof.name}>
      Bukti <Download size={12} />
    </a>
  );
}

export default function Dashboard() {
  const { state: s, error: storageError } = useStore();
  const [section, setSection] = useState("Ringkasan");
  const [role, setRole] = useState<Role>("Owner");
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Semua");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [periodMode, setPeriodMode] = useState<PeriodMode>("day");
  const changePeriod = (start: string, end: string, mode: PeriodMode) => {
    setFrom(start);
    setTo(end);
    setPeriodMode(mode);
  };
  const [panel, setPanel] = useState<Panel>(null);
  const [toast, setToast] = useState("");
  const [actionError, setActionError] = useState("");
  const [confirmation, setConfirmation] = useState<{
    title: string;
    action: () => void;
    destructive?: boolean;
  } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  const go = (value: string) => {
    setSection(value);
    setSearch("");
    setFilter("Semua");
    setMenu(false);
  };
  const open = (type: string, id?: string) => {
    setActionError("");
    setPanel({ type, id });
  };
  const act = (c: Command, message = "Perubahan berhasil disimpan.") => {
    try {
      dispatch(c, role);
      setToast(message);
      setActionError("");
      return true;
    } catch (e) {
      setActionError((e as Error).message);
      return false;
    }
  };
  if (!s)
    return (
      <main className="boot">
        <Leaf size={40} />
        <h1>buahaha</h1>
        <p role={storageError ? "alert" : "status"}>
          {storageError || "Menyiapkan ruang kerja Anda…"}
        </p>
        {storageError && (
          <>
            <Button variant="outline" onClick={backup}>
              Unduh data lokal
            </Button>
            <Button
              onClick={() => {
                if (
                  window.confirm(
                    "Hapus data lokal yang tidak dapat dibaca dan mulai dengan data kosong?",
                  )
                ) {
                  try {
                    resetData();
                  } catch (e) {
                    window.alert((e as Error).message);
                  }
                }
              }}
            >
              Mulai dengan data kosong
            </Button>
          </>
        )}
      </main>
    );
  const owner = role === "Owner";
  const deleteEffects: Record<DeletableCollection, string> = {
    products:
      "Produk hanya dapat dihapus setelah transaksi terkait dan mutasinya dihapus serta stoknya nol.",
    customers:
      "Pelanggan hanya dapat dihapus setelah semua pesanannya dihapus.",
    orders:
      "Cadangan stok dilepas. Pembayaran, retur, dan pengiriman terkait harus dihapus terlebih dahulu.",
    trips:
      "Semua pesanan dalam perjalanan ini kembali berstatus disiapkan. Stok yang sudah dikirim dikembalikan dan penjualan selesai dikeluarkan dari laporan. Hapus biaya, pembayaran, dan retur terkait terlebih dahulu.",
    payments:
      "Pembayaran beserta catatan setoran COD dihapus; sisa tagihan dihitung ulang. Tindakan ini tidak mengembalikan uang secara nyata.",
    expenses:
      "Biaya ini dikeluarkan dari laporan. Penghapusan pembelian buah tidak mengubah stok fisik.",
    returns:
      "Refund dan pengaruhnya pada laporan dibatalkan. Untuk retur layak jual yang disetujui, stok hasil retur juga dikurangi kembali.",
    movements:
      "Pengaruh mutasi pada stok dan kerugian dibalik. Mutasi dari pengiriman atau retur harus dihapus melalui transaksi sumbernya.",
  };
  const deleteButton = (
    collection: DeletableCollection,
    id: string,
    label = id,
  ) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="delete-action"
      disabled={!owner}
      title={owner ? `Hapus ${label}` : "Penghapusan hanya untuk Owner"}
      aria-label={`Hapus ${label}`}
      onClick={() =>
        setConfirmation({
          title: `Hapus ${label}? ${deleteEffects[collection]} Data yang dihapus tidak dapat dipulihkan melalui aplikasi.`,
          destructive: true,
          action: () => {
            const deleted = act(
              { type: "delete", collection, id },
              `${label} berhasil dihapus.`,
            );
            if (deleted && panel?.id === id) setPanel(null);
          },
        })
      }
    >
      <Trash2 size={15} aria-hidden="true" /> Hapus
    </Button>
  );
  const summary = report(s, from, to);
  const daily = reportByDay(s, from, to);
  const completedOrders = s.orders.filter(
    (o) =>
      o.status === "selesai" &&
      (o.completedAt || o.date) >= from &&
      (o.completedAt || o.date) <= to,
  );
  const customer = (id: string) => s.customers.find((c) => c.id === id)!;
  const product = (id: string) => s.products.find((p) => p.id === id)!;
  const match = (...values: string[]) =>
    values.join(" ").toLowerCase().includes(search.toLowerCase());
  const matchesTrip = (trip: (typeof s.trips)[number]) =>
    match(
      trip.id,
      trip.driver,
      trip.vehicle,
      trip.address,
      ...trip.orderIds.flatMap((id) => {
        const order = s.orders.find((o) => o.id === id);
        const person = order && customer(order.customerId);
        return [id, person?.name || "", person?.address || ""];
      }),
    );
  const low = s.products.filter((p) => available(s, p) <= p.low);
  const active = s.orders.filter(
    (o) => !["selesai", "dibatalkan"].includes(o.status),
  );
  const pending = s.payments.filter((p) => !p.verified);
  const unpaid = s.orders
    .filter((o) => o.status !== "dibatalkan")
    .reduce((a, o) => a + Math.max(0, total(o) - paid(s, o.id)), 0);
  const cod = s.payments
    .filter((p) => p.method === "COD")
    .reduce((a, p) => a + p.amount - p.deposited, 0);
  const orders = s.orders
    .filter(
      (o) =>
        match(o.id, customer(o.customerId).name) &&
        (filter === "Semua" || o.status === filter),
    )
    .toReversed();
  const primary: Record<string, [string, string]> = {
    Ringkasan: ["Buat pesanan", "order"],
    Pesanan: ["Buat pesanan", "order"],
    "Produk & Stok": ["Tambah produk", "product"],
    Pelanggan: ["Tambah pelanggan", "customer"],
    Pengiriman: ["Jadwalkan pengiriman", "trip"],
    Pembayaran: ["Catat pembayaran", "payment"],
    Pengeluaran: ["Catat pengeluaran", "expense"],
    Retur: ["Ajukan retur", "return"],
  };
  const orderRows = (list: Order[]) =>
    list.map((o) => (
      <tr key={o.id}>
        <td>
          <button className="text-link" onClick={() => open("detail", o.id)}>
            {o.id}
            <ArrowUpRight size={13} />
          </button>
          <small>{dateLabel(o.date)}</small>
        </td>
        <td>
          <strong>{customer(o.customerId).name}</strong>
          <small>{o.items.length} jenis buah</small>
        </td>
        <td>
          <Badge>{o.status}</Badge>
        </td>
        <td className="numeric">{money(total(o))}</td>
        <td>
          <Badge>{paymentStatus(s, o)}</Badge>
        </td>
        <td>
          <div className="row-actions">
            <Button
              variant="outline"
              size="sm"
              aria-label={`Edit ${o.id}`}
              onClick={() => open("detail", o.id)}
            >
              Edit
            </Button>
          </div>
        </td>
      </tr>
    ));
  function exportReport() {
    const lines = [
      ["Laporan buahaha (simulasi)", `${from} s.d. ${to}`],
      ["Komponen", "Rupiah"],
      ["Penjualan bersih", summary.sales],
      ["Harga pokok penjualan", summary.cogs],
      ["Laba kotor", summary.gross],
      ["Bensin", summary.fuel],
      ["Biaya operasional lain", summary.operating],
      ["Kerugian stok nonkas", summary.loss],
      ["Hasil setelah biaya", summary.net],
      ["Pembelian stok (arus kas saja)", summary.purchases],
      [],
      [
        "Rincian hasil harian",
        "Tanggal pengakuan, bukan tanggal pesanan dibuat",
      ],
      [
        "Tanggal",
        "Pesanan selesai",
        "Penjualan bersih",
        "HPP",
        "Laba kotor",
        "Bensin",
        "Operasional",
        "Kerugian stok",
        "Hasil setelah biaya",
        "Pembelian stok (kas)",
        "Refund",
      ],
      ...daily.map((day) => [
        day.date,
        day.count,
        day.sales,
        day.cogs,
        day.gross,
        day.fuel,
        day.operating,
        day.loss,
        day.net,
        day.purchases,
        day.refunds,
      ]),
    ];
    download(
      `buahaha-laporan-${from}-${to}.csv`,
      "\uFEFF" +
        lines
          .map((row) =>
            row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","),
          )
          .join("\r\n"),
      "text/csv;charset=utf-8",
    );
    setToast("Laporan sesuai filter berhasil diekspor.");
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Lewati navigasi
      </a>
      {menu && (
        <button
          className="nav-scrim"
          aria-label="Tutup menu"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${menu ? "is-open" : ""}`}>
        <a
          className="brand"
          href="#ringkasan"
          onClick={(e) => {
            e.preventDefault();
            go("Ringkasan");
          }}
        >
          <span className="brand-mark">
            <Leaf size={25} />
          </span>
          buahaha<span className="brand-dot">.</span>
        </a>
        <div className="workspace">
          <span className="workspace-avatar">b.</span>
          <div>
            <strong>Gudang Utama</strong>
            <small>Operasional buah</small>
          </div>
          <ChevronDown size={14} />
        </div>
        <p className="nav-caption">RUANG KERJA</p>
        <nav aria-label="Navigasi utama">
          {navigation
            .filter(
              (n) =>
                owner ||
                !["Pembayaran", "Pengeluaran", "Laporan"].includes(n.label),
            )
            .map(({ label, icon: Icon }) => (
              <button
                key={label}
                className={section === label ? "nav-item active" : "nav-item"}
                aria-label={label}
                aria-current={section === label ? "page" : undefined}
                onClick={() => go(label)}
              >
                <Icon size={19} strokeWidth={1.65} />
                <span>{label}</span>
                {label === "Pesanan" && <b>{active.length}</b>}
              </button>
            ))}
        </nav>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="breadcrumb">
            <Button
              className="mobile-menu"
              variant="ghost"
              size="icon"
              onClick={() => setMenu(true)}
              aria-label="Buka menu"
            >
              <Menu size={21} />
            </Button>
            <span>Ruang kerja</span>
            <ChevronRight size={14} />
            <strong>{section}</strong>
          </div>
          <div className="topbar-right">
            <label className="role-picker">
              <span className="avatar">{owner ? "OW" : "AG"}</span>
              <span>
                <small>Simulasi peran</small>
                <select
                  aria-label="Simulasi peran"
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value as Role);
                    go("Ringkasan");
                    setPanel(null);
                  }}
                >
                  {["Owner", "Admin Gudang"].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </span>
            </label>
          </div>
        </header>
        <main id="main" className="content">
          <div className="page-heading">
            <div>
              <h1>{section === "Ringkasan" ? "Ringkasan usaha" : section}</h1>
              <p>{descriptions[section]}</p>
            </div>
            {primary[section] && (
              <Button onClick={() => open(primary[section][1])}>
                <Plus size={17} />
                {primary[section][0]}
              </Button>
            )}
            {section === "Laporan" && (
              <Button disabled={from > to} onClick={exportReport}>
                <Download size={17} />
                Ekspor CSV
              </Button>
            )}
          </div>
          {actionError && !panel && (
            <div className="error-banner" role="alert">
              <CircleAlert size={18} />
              {actionError}
              <button
                aria-label="Tutup pesan"
                onClick={() => setActionError("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {["Ringkasan", "Laporan", "Pengeluaran"].includes(section) && (
            <PeriodFilter
              from={from}
              to={to}
              mode={periodMode}
              onChange={changePeriod}
            />
          )}
          {from > to &&
            ["Ringkasan", "Laporan", "Pengeluaran"].includes(section) && (
              <p role="alert" className="error-banner">
                Tanggal mulai harus sebelum atau sama dengan tanggal akhir.
              </p>
            )}
          {section === "Ringkasan" && (
            <>
              <div className="metrics">
                <div className="metric">
                  <span>
                    Penjualan bersih <Banknote size={17} />
                  </span>
                  <strong>{money(summary.sales)}</strong>
                  <small>
                    <span className="metric-dot" />
                    {summary.count} pesanan selesai · periode dipilih
                  </small>
                </div>
                <div className="metric">
                  <span>
                    Pesanan aktif <ShoppingBasket size={17} />
                  </span>
                  <strong>
                    {active.length}
                    <em>pesanan</em>
                  </strong>
                  <small>Perlu diproses · seluruh tanggal</small>
                </div>
                <div className="metric">
                  <span>
                    Tagihan belum lunas <Wallet size={17} />
                  </span>
                  <strong>{money(unpaid)}</strong>
                  <small>Termasuk transfer menunggu verifikasi</small>
                </div>
                <div className="metric">
                  <span>
                    Pengeluaran bensin <Fuel size={17} />
                  </span>
                  <strong>{money(summary.fuel)}</strong>
                  <small>Biaya perjalanan · periode dipilih</small>
                </div>
              </div>
              <div
                className="period-result"
                aria-label="Hasil usaha periode terpilih"
              >
                <div>
                  <span>
                    {from === to
                      ? "Hasil harian setelah biaya"
                      : "Hasil periode setelah biaya"}
                  </span>
                  <strong>{money(summary.net)}</strong>
                </div>
                <p>
                  Penjualan pesanan selesai dikurangi modal, bensin, biaya
                  operasional, dan kerugian stok.
                </p>
                {owner && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => go("Laporan")}
                  >
                    Lihat rincian <ArrowRight size={15} />
                  </Button>
                )}
              </div>
              <div className="overview-grid">
                <section className="panel orders-panel">
                  <div className="section-heading">
                    <div>
                      <h2>Pesanan terkini</h2>
                      <p>Terhubung dari gudang sampai pelanggan.</p>
                    </div>
                    <button className="text-link" onClick={() => go("Pesanan")}>
                      Lihat semua <ArrowRight size={15} />
                    </button>
                  </div>
                  <Table
                    headings={[
                      "Pesanan",
                      "Pelanggan",
                      "Status",
                      "Total",
                      "Pembayaran",
                      "",
                    ]}
                  >
                    {orderRows(s.orders.toReversed().slice(0, 6))}
                  </Table>
                </section>
                <section className="attention">
                  <div className="section-heading">
                    <h2>Perlu perhatian</h2>
                    <span className="count-pill">
                      {low.length +
                        pending.length +
                        s.returns.filter((r) => r.status === "Diajukan").length}
                    </span>
                  </div>
                  <p className="attention-intro">
                    Selesaikan yang penting lebih dulu.
                  </p>
                  <button
                    className="attention-row"
                    onClick={() => {
                      go("Produk & Stok");
                      setFilter("Stok rendah");
                    }}
                  >
                    <span className="attention-icon amber">
                      <Package size={20} />
                    </span>
                    <span>
                      <strong>{low.length} produk stok rendah</strong>
                      <small>Periksa dan tambah stok tersedia</small>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                  {owner && (
                    <>
                      <button
                        className="attention-row"
                        onClick={() => {
                          go("Pembayaran");
                          setFilter("Menunggu");
                        }}
                      >
                        <span className="attention-icon mint">
                          <ShieldCheck size={20} />
                        </span>
                        <span>
                          <strong>
                            {pending.length} transfer perlu verifikasi
                          </strong>
                          <small>Pastikan bukti sudah sesuai</small>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                      <button
                        className="attention-row"
                        onClick={() => {
                          go("Pembayaran");
                          setFilter("COD");
                        }}
                      >
                        <span className="attention-icon beige">
                          <Wallet size={20} />
                        </span>
                        <span>
                          <strong>{money(cod)} COD belum disetor</strong>
                          <small>Cocokkan uang dari petugas</small>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}
                  <button className="attention-row" onClick={() => go("Retur")}>
                    <span className="attention-icon rose">
                      <RotateCcw size={20} />
                    </span>
                    <span>
                      <strong>
                        {
                          s.returns.filter((r) => r.status === "Diajukan")
                            .length
                        }{" "}
                        pengajuan retur
                      </strong>
                      <small>Periksa kondisi dan bukti buah</small>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                  <div className="attention-foot">
                    <ShieldCheck size={16} />
                    <span>Stok cadangan terlindungi dari pesanan ganda.</span>
                  </div>
                </section>
              </div>
              <div className="bottom-grid">
                <section className="panel">
                  <div className="section-heading">
                    <div>
                      <h2>Persediaan yang perlu diisi</h2>
                      <p>Stok tersedia setelah cadangan pesanan.</p>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => go("Produk & Stok")}
                    >
                      Kelola stok <ArrowRight size={15} />
                    </button>
                  </div>
                  <div className="stock-preview">
                    {low.map((p) => (
                      <div className="stock-preview-item" key={p.id}>
                        <ProductMark p={p} />
                        <div>
                          <strong>{p.name}</strong>
                          <small>
                            Batas minimum {p.low} {p.unit}
                          </small>
                        </div>
                        <b>
                          {quantity(available(s, p))}
                          <small>{p.unit} tersedia</small>
                        </b>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => open("stock", p.id)}
                        >
                          <Plus size={14} />
                          Isi stok
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="dispatch-note">
                  <Truck size={27} strokeWidth={1.5} />
                  <h2>Perjalanan aktif</h2>
                  <p>
                    {s.trips.filter((t) => t.status !== "Terkirim").length}{" "}
                    perjalanan aktif. Gabungkan beberapa pesanan dalam satu rute
                    dan catat bensin satu kali.
                  </p>
                  <button onClick={() => go("Pengiriman")}>
                    Buka pengiriman <ArrowRight size={17} />
                  </button>
                </section>
              </div>
            </>
          )}
          {!["Ringkasan", "Laporan"].includes(section) && (
            <div className="list-toolbar">
              <div className="search-box">
                <Search size={17} />
                <input
                  aria-label={`Cari ${section.toLowerCase()}`}
                  placeholder={`Cari ${section === "Produk & Stok" ? "nama buah atau SKU" : section.toLowerCase()}…`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    aria-label="Hapus pencarian"
                    onClick={() => setSearch("")}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {section === "Pesanan" && (
                <select
                  aria-label="Filter status pesanan"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {["Semua", ...statuses].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              )}
              {section === "Produk & Stok" && (
                <select
                  aria-label="Filter stok"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option>Semua</option>
                  <option>Stok rendah</option>
                </select>
              )}
              {section === "Pembayaran" && (
                <select
                  aria-label="Filter pembayaran"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {["Semua", "Menunggu", "Transfer", "Tunai", "COD"].map(
                    (x) => (
                      <option key={x}>{x}</option>
                    ),
                  )}
                </select>
              )}
            </div>
          )}
          {section === "Pesanan" && (
            <section className="panel orders-list">
              {orders.length ? (
                <Table
                  headings={[
                    "Pesanan",
                    "Pelanggan",
                    "Status",
                    "Total",
                    "Pembayaran",
                    "Tindakan",
                  ]}
                >
                  {orderRows(orders)}
                </Table>
              ) : (
                <Empty />
              )}
              <div className="table-footer">
                {orders.length} pesanan · Stok dicadangkan sejak pesanan dibuat.
              </div>
            </section>
          )}
          {section === "Produk & Stok" && (
            <>
              <section className="panel">
                <Table
                  headings={[
                    "Produk",
                    "Harga jual / modal",
                    "Fisik",
                    "Cadangan",
                    "Tersedia",
                    "Status",
                    "Tindakan",
                  ]}
                >
                  {s.products
                    .filter(
                      (p) =>
                        match(p.name, p.sku) &&
                        (filter !== "Stok rendah" || available(s, p) <= p.low),
                    )
                    .map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div className="product-cell">
                            <ProductMark p={p} />
                            <div>
                              <strong>{p.name}</strong>
                              <small>
                                {p.sku} · per {p.unit}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          {money(p.price)}
                          <small>Modal {money(p.cost)}</small>
                        </td>
                        <td className="numeric">
                          {quantity(p.stock)} {p.unit}
                        </td>
                        <td className="numeric">
                          {quantity(reserved(s, p.id))} {p.unit}
                        </td>
                        <td className="numeric">
                          <strong>
                            {quantity(available(s, p))} {p.unit}
                          </strong>
                        </td>
                        <td>
                          <Badge>
                            {available(s, p) <= p.low
                              ? "Stok rendah"
                              : "Tersedia"}
                          </Badge>
                        </td>
                        <td>
                          <div className="row-actions">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => open("stock", p.id)}
                            >
                              Mutasi
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => open("product", p.id)}
                            >
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </Table>
              </section>
              <section className="panel spaced">
                <div className="section-heading">
                  <div>
                    <h2>Riwayat mutasi</h2>
                    <p>Barang masuk, keluar, rusak, dan retur layak jual.</p>
                  </div>
                </div>
                <Table
                  headings={[
                    "Tanggal",
                    "Produk",
                    "Jenis",
                    "Jumlah",
                    "Keterangan",
                    "Tindakan",
                  ]}
                >
                  {s.movements
                    .toReversed()
                    .filter((m) => match(product(m.productId).name, m.note))
                    .slice(0, 30)
                    .map((m) => (
                      <tr key={m.id}>
                        <td>{dateLabel(m.date)}</td>
                        <td>{product(m.productId).name}</td>
                        <td>
                          <Badge>{m.type}</Badge>
                        </td>
                        <td className="numeric">
                          {quantity(m.qty)} {product(m.productId).unit}
                        </td>
                        <td>{m.note || "—"}</td>
                        <td>
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label={`Edit ${m.id}`}
                            onClick={() => open("movement", m.id)}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                </Table>
                <div className="table-footer">
                  Menampilkan maksimal 30 mutasi terbaru.
                </div>
              </section>
            </>
          )}
          {section === "Pelanggan" && (
            <section className="panel">
              <Table
                headings={[
                  "Pelanggan",
                  "WhatsApp",
                  "Alamat",
                  "Transaksi",
                  "Tindakan",
                ]}
              >
                {s.customers
                  .filter((c) => match(c.name, c.phone, c.address))
                  .map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="customer-cell">
                          <span className="customer-avatar">
                            {c.name
                              .split(" ")
                              .slice(0, 2)
                              .map((s) => s[0])
                              .join("")}
                          </span>
                          <div>
                            <strong>{c.name}</strong>
                            <small>{c.note || "Belum ada catatan"}</small>
                          </div>
                        </div>
                      </td>
                      <td>{c.phone}</td>
                      <td className="wrap-cell">{c.address}</td>
                      <td>
                        {s.orders.filter((o) => o.customerId === c.id).length}{" "}
                        pesanan
                      </td>
                      <td>
                        <div className="row-actions">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => open("customer", c.id)}
                          >
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </Table>
            </section>
          )}
          {section === "Pengiriman" && (
            <div className="trip-list">
              {s.trips
                .toReversed()
                .filter(matchesTrip)
                .map((t) => (
                  <section className="panel trip" key={t.id}>
                    <div className="trip-heading">
                      <div className="trip-icon">
                        <Truck size={23} />
                      </div>
                      <div>
                        <h2>{t.id}</h2>
                        <p>
                          {dateLabel(t.date)} · {t.vehicle}
                        </p>
                      </div>
                      <Badge>{t.status}</Badge>
                    </div>
                    <div className="trip-body">
                      <div>
                        <span>Petugas</span>
                        <strong>{t.driver}</strong>
                      </div>
                      <div>
                        <span>Tujuan / rute</span>
                        <strong>{t.address}</strong>
                      </div>
                      <div>
                        <span>Bensin perjalanan</span>
                        <strong>
                          {money(
                            s.expenses
                              .filter(
                                (e) =>
                                  e.tripId === t.id && e.category === "Bensin",
                              )
                              .reduce((a, e) => a + e.amount, 0),
                          )}
                        </strong>
                      </div>
                    </div>
                    <div className="trip-orders">
                      {t.orderIds.map((id) => (
                        <button
                          key={id}
                          className="text-link"
                          onClick={() => open("detail", id)}
                        >
                          {id} <ArrowUpRight size={12} />
                        </button>
                      ))}
                    </div>
                    {t.note && <p className="trip-note">{t.note}</p>}
                    <footer>
                      {deleteButton("trips", t.id)}
                      {owner && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => open("expense", t.id)}
                        >
                          <Fuel size={15} />
                          Catat bensin
                        </Button>
                      )}
                      {t.status !== "Terkirim" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            setConfirmation({
                              title:
                                t.status === "Terjadwal"
                                  ? "Mulai perjalanan dan keluarkan stok semua pesanan terkait?"
                                  : "Tandai perjalanan terkirim dan selesaikan pesanan terkait?",
                              action: () => {
                                act({ type: "tripStatus", id: t.id });
                              },
                            })
                          }
                        >
                          {t.status === "Terjadwal"
                            ? "Mulai perjalanan"
                            : "Tandai terkirim"}
                          <ArrowRight size={15} />
                        </Button>
                      )}
                    </footer>
                  </section>
                ))}
              {!s.trips.some(matchesTrip) && <Empty />}
            </div>
          )}
          {section === "Pembayaran" && (
            <>
              <div className="finance-strip">
                <span>
                  Tagihan belum lunas <strong>{money(unpaid)}</strong>
                </span>
                <span>
                  COD belum disetor <strong>{money(cod)}</strong>
                </span>
                <span>
                  Menunggu verifikasi <strong>{pending.length} transfer</strong>
                </span>
              </div>
              <section className="panel transaction-table payments-table">
                <Table
                  headings={[
                    "Pembayaran",
                    "Pesanan / pelanggan",
                    "Metode",
                    "Nominal",
                    "Status",
                    "Bukti / tindakan",
                  ]}
                >
                  {s.payments
                    .toReversed()
                    .filter(
                      (p) =>
                        match(
                          p.id,
                          p.orderId,
                          customer(
                            s.orders.find((o) => o.id === p.orderId)!
                              .customerId,
                          ).name,
                        ) &&
                        (filter === "Semua" ||
                          (filter === "Menunggu"
                            ? !p.verified
                            : p.method === filter)),
                    )
                    .map((p) => (
                      <tr key={p.id}>
                        <td>
                          <strong>{p.id}</strong>
                          <small>{dateLabel(p.date)}</small>
                        </td>
                        <td>
                          <button
                            className="text-link"
                            onClick={() => open("detail", p.orderId)}
                          >
                            {p.orderId}
                          </button>
                          <small>
                            {
                              customer(
                                s.orders.find((o) => o.id === p.orderId)!
                                  .customerId,
                              ).name
                            }
                          </small>
                        </td>
                        <td>{p.method}</td>
                        <td className="numeric">
                          {money(p.amount)}
                          {p.method === "COD" && (
                            <small>Disetor {money(p.deposited)}</small>
                          )}
                        </td>
                        <td>
                          <Badge>
                            {p.verified ? "Terverifikasi" : "Menunggu"}
                          </Badge>
                        </td>
                        <td>
                          <div className="row-actions">
                            {p.proof && <ProofLink proof={p.proof} />}
                            {deleteButton("payments", p.id)}
                            {!p.verified && (
                              <>
                                {!p.proof && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => open("proof", p.id)}
                                  >
                                    Unggah bukti
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    act(
                                      { type: "verify", id: p.id },
                                      "Transfer terverifikasi.",
                                    )
                                  }
                                >
                                  Verifikasi
                                </Button>
                              </>
                            )}
                            {p.method === "COD" && p.deposited < p.amount && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => open("deposit", p.id)}
                              >
                                Catat setoran
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </Table>
              </section>
            </>
          )}
          {section === "Pengeluaran" && (
            <>
              <div className="finance-strip">
                <span>
                  Bensin periode ini<strong>{money(summary.fuel)}</strong>
                </span>
                <span>
                  Biaya operasional lain
                  <strong>{money(summary.operating)}</strong>
                </span>
                <span>
                  Pembelian stok (kas)
                  <strong>{money(summary.purchases)}</strong>
                </span>
              </div>
              <section className="panel transaction-table expenses-table">
                <Table
                  headings={[
                    "Tanggal",
                    "Kategori",
                    "Petugas",
                    "Keterangan / perjalanan",
                    "Nominal",
                    "Bukti / tindakan",
                  ]}
                >
                  {s.expenses
                    .toReversed()
                    .filter(
                      (e) =>
                        e.date >= from &&
                        e.date <= to &&
                        match(e.category, e.person, e.note, e.tripId),
                    )
                    .map((e) => (
                      <tr key={e.id}>
                        <td>{dateLabel(e.date)}</td>
                        <td>
                          <span className="expense-kind">
                            {e.category === "Bensin" ? (
                              <Fuel size={15} />
                            ) : (
                              <ReceiptText size={15} />
                            )}
                            {e.category}
                          </span>
                        </td>
                        <td>{e.person}</td>
                        <td>
                          <strong>{e.note || "—"}</strong>
                          <small>
                            {e.tripId || "Tanpa perjalanan"}
                            {e.vehicle && ` · ${e.vehicle}`}
                          </small>
                        </td>
                        <td className="numeric">{money(e.amount)}</td>
                        <td>
                          <div className="row-actions">
                            {e.proof && <ProofLink proof={e.proof} />}
                            {deleteButton("expenses", e.id)}
                          </div>
                        </td>
                      </tr>
                    ))}
                </Table>
                <div className="table-footer">
                  Kerugian barang nonkas dicatat melalui mutasi stok rusak,
                  bukan pengeluaran kas.
                </div>
              </section>
            </>
          )}
          {section === "Retur" && (
            <section className="panel transaction-table returns-table">
              <Table
                headings={[
                  "Retur / pesanan",
                  "Item",
                  "Alasan / kondisi",
                  "Refund",
                  "Status",
                  "Tindakan",
                ]}
              >
                {s.returns
                  .toReversed()
                  .filter((r) =>
                    match(r.id, r.orderId, r.reason, product(r.productId).name),
                  )
                  .map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.id}</strong>
                        <button
                          className="text-link"
                          onClick={() => open("detail", r.orderId)}
                        >
                          {r.orderId}
                        </button>
                      </td>
                      <td>
                        <strong>{product(r.productId).name}</strong>
                        <small>
                          {quantity(r.qty)} {product(r.productId).unit}
                        </small>
                      </td>
                      <td className="wrap-cell">
                        {r.reason}
                        <small>
                          {r.condition} · <ProofLink proof={r.proof} />
                        </small>
                      </td>
                      <td className="numeric">{money(r.refund)}</td>
                      <td>
                        <Badge>{r.status}</Badge>
                      </td>
                      <td>
                        {r.status === "Diajukan" && (
                          <div className="row-actions">
                            <Button
                              size="sm"
                              disabled={!owner && r.refund > 0}
                              onClick={() =>
                                setConfirmation({
                                  title: `Setujui retur ${r.id}? ${r.condition === "Layak jual" ? "Stok layak jual akan bertambah." : "Barang rusak tidak kembali ke stok."} Refund ${money(r.refund)} dicatat.`,
                                  action: () => {
                                    act({
                                      type: "returnDecision",
                                      id: r.id,
                                      approve: true,
                                    });
                                  },
                                })
                              }
                            >
                              Setujui
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!owner && r.refund > 0}
                              onClick={() =>
                                setConfirmation({
                                  title: `Tolak pengajuan ${r.id}?`,
                                  action: () => {
                                    act({
                                      type: "returnDecision",
                                      id: r.id,
                                      approve: false,
                                    });
                                  },
                                })
                              }
                            >
                              Tolak
                            </Button>
                          </div>
                        )}
                        {!owner && r.status === "Diajukan" && r.refund > 0 && (
                          <small>Keputusan refund oleh Owner</small>
                        )}
                        {deleteButton("returns", r.id)}
                      </td>
                    </tr>
                  ))}
              </Table>
              <div className="table-footer">
                Persetujuan bersifat final di prototipe. Periksa bukti dan
                kondisi sebelum menyetujui.
              </div>
            </section>
          )}
          {section === "Laporan" && (
            <>
              <div className="report-layout">
                <section className="panel report-panel">
                  <div className="section-heading">
                    <div>
                      <h2>
                        {from === to
                          ? "Hasil usaha harian"
                          : "Laporan hasil usaha"}
                      </h2>
                      <p>
                        {from === to
                          ? dateLabel(from)
                          : `${dateLabel(from)} – ${dateLabel(to)}`}
                      </p>
                    </div>
                    <span className="report-stamp">SIMULASI</span>
                  </div>
                  <div className="report-lines">
                    {[
                      ["Penjualan bersih", summary.sales],
                      ["Harga pokok penjualan", summary.cogs],
                      ["Laba kotor", summary.gross],
                      ["Bensin", summary.fuel],
                      ["Biaya operasional lain", summary.operating],
                      ["Kerugian stok nonkas", summary.loss],
                      ["Hasil setelah biaya", summary.net],
                    ].map(([label, value], n) => (
                      <div
                        className={
                          n === 6
                            ? "report-total"
                            : n === 2
                              ? "report-subtotal"
                              : ""
                        }
                        key={label}
                      >
                        <span>{label}</span>
                        <strong>{money(Number(value))}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="report-foot">
                    <span>Pembelian stok · informasi arus kas</span>
                    <strong>{money(summary.purchases)}</strong>
                  </div>
                </section>
                <aside className="report-explanation">
                  <ClipboardList size={27} />
                  <h2>Angka yang bisa ditelusuri.</h2>
                  <p>
                    Penjualan diakui saat pesanan selesai, berdasarkan tanggal
                    selesai. Refund mengurangi penjualan pada tanggal
                    persetujuan retur.
                  </p>
                  <p>
                    Harga pokok memakai modal per item saat pesanan dibuat.
                    Retur layak jual membalik harga pokok; retur rusak tidak
                    mengurangi harga pokok lagi.
                  </p>
                  <p>
                    Pembelian stok tidak dipotong lagi dari laba. Bensin
                    dihitung sekali per catatan pengeluaran, meskipun perjalanan
                    membawa beberapa pesanan.
                  </p>
                  <p>
                    Tagihan belum lunas tetap dapat menjadi penjualan.
                    Penerimaan kas dan setoran COD bukan laba.
                  </p>
                  <div className="note-box">
                    Refund merupakan penyesuaian penjualan pada demo ini. Retur
                    tanpa refund tidak mengurangi nilai tagihan. Kebijakan
                    akuntansi produksi perlu ditetapkan sebelum integrasi
                    backend.
                  </div>
                </aside>
              </div>
              <section
                className="panel spaced daily-report"
                aria-label="Rincian hasil harian"
              >
                <div className="section-heading">
                  <div>
                    <h2>Rincian per hari</h2>
                    <p>
                      Klik tanggal untuk melihat hasil dan pesanan pada hari
                      tersebut.
                    </p>
                  </div>
                </div>
                <Table
                  headings={[
                    "Tanggal",
                    "Selesai",
                    "Penjualan bersih",
                    "Modal (HPP)",
                    "Bensin",
                    "Biaya lain & kerugian",
                    "Hasil setelah biaya",
                  ]}
                >
                  {daily.map((day) => (
                    <tr key={day.date}>
                      <td>
                        <button
                          className="text-link"
                          aria-label={`Lihat hasil ${dateLabel(day.date)}`}
                          onClick={() =>
                            changePeriod(day.date, day.date, "day")
                          }
                        >
                          {dateLabel(day.date)}
                          <ArrowUpRight size={13} />
                        </button>
                      </td>
                      <td className="numeric">{day.count}</td>
                      <td className="numeric">{money(day.sales)}</td>
                      <td className="numeric">{money(day.cogs)}</td>
                      <td className="numeric">{money(day.fuel)}</td>
                      <td className="numeric">
                        {money(day.operating + day.loss)}
                      </td>
                      <td className="numeric">
                        <strong>{money(day.net)}</strong>
                      </td>
                    </tr>
                  ))}
                </Table>
                <p className="table-footer">
                  Penjualan mengikuti tanggal pesanan selesai; biaya dan retur
                  mengikuti tanggal pencatatannya. Dalam rentang tanggal, hari
                  tanpa aktivitas tidak dicantumkan.
                </p>
              </section>
              <section
                className="panel spaced"
                aria-label="Pesanan sumber laporan"
              >
                <div className="section-heading">
                  <div>
                    <h2>Pesanan selesai dalam periode</h2>
                    <p>
                      Pesanan baru atau yang masih dikirim belum dihitung
                      sebagai penjualan.
                    </p>
                  </div>
                </div>
                {completedOrders.length ? (
                  <Table
                    headings={[
                      "Pesanan",
                      "Pelanggan",
                      "Tanggal selesai",
                      "Total pesanan",
                      "Pembayaran",
                    ]}
                  >
                    {completedOrders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <button
                            className="text-link"
                            onClick={() => open("detail", o.id)}
                          >
                            {o.id}
                            <ArrowUpRight size={13} />
                          </button>
                        </td>
                        <td>{customer(o.customerId).name}</td>
                        <td>{dateLabel(o.completedAt || o.date)}</td>
                        <td className="numeric">{money(total(o))}</td>
                        <td>
                          <Badge>{paymentStatus(s, o)}</Badge>
                        </td>
                      </tr>
                    ))}
                  </Table>
                ) : (
                  <div className="daily-empty">
                    <ClipboardList size={25} />
                    <strong>Belum ada pesanan selesai pada periode ini.</strong>
                    <p>
                      Pilih tanggal lain untuk melihat riwayat. Biaya atau retur
                      yang tercatat tetap masuk perhitungan hasil usaha.
                    </p>
                  </div>
                )}
              </section>
            </>
          )}
          <footer className="page-footer">
            <span>
              buahaha <span>·</span> Gudang Utama
            </span>
            <span>
              <span className="local-dot" />
              Tersimpan lokal di browser
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCheck size={19} />
          {toast}
          <button onClick={() => setToast("")} aria-label="Tutup notifikasi">
            <X size={16} />
          </button>
        </div>
      )}
      {panel && (
        <Modal
          key={`${panel.type}-${panel.id || "new"}`}
          title={
            panel.type === "customer" && panel.id
              ? "Edit pelanggan"
              : panel.type === "product" && panel.id
                ? "Edit produk"
                : titles[panel.type]
          }
          close={() => setPanel(null)}
        >
          {panel.type === "detail" ? (
            <OrderDetail
              s={s}
              id={panel.id!}
              owner={owner}
              act={act}
              open={open}
              cancel={(o) =>
                setConfirmation({
                  title: `Batalkan ${o.id}? Cadangan stok akan dilepaskan.`,
                  action: () => {
                    act({ type: "status", id: o.id, status: "dibatalkan" });
                  },
                })
              }
            />
          ) : panel.type === "movement" ? (
            <div className="form-body">
              {(() => {
                const movement = s.movements.find((m) => m.id === panel.id);
                if (!movement) return <p>Mutasi ini sudah dihapus.</p>;
                return (
                  <>
                    <h3>{movement.id}</h3>
                    <p>
                      {product(movement.productId).name} ·{" "}
                      {dateLabel(movement.date)}
                    </p>
                    <p>
                      {movement.type} · {quantity(movement.qty)}{" "}
                      {product(movement.productId).unit}
                    </p>
                    <p>{movement.note || "Tanpa keterangan"}</p>
                    <p className="muted">
                      Untuk mengoreksi mutasi manual, hapus catatan ini lalu
                      buat mutasi baru. Mutasi otomatis diperbarui melalui
                      pengiriman atau retur sumbernya.
                    </p>
                  </>
                );
              })()}
            </div>
          ) : (
            <Editor
              s={s}
              panel={panel}
              role={role}
              submit={(c) => {
                if (act(c)) setPanel(null);
              }}
            />
          )}
          {panel.id &&
            ["detail", "product", "customer", "movement"].includes(
              panel.type,
            ) && (
              <div className="panel-delete-actions">
                {panel.type === "detail" &&
                  s.orders.some((o) => o.id === panel.id) &&
                  deleteButton("orders", panel.id)}
                {panel.type === "product" &&
                  s.products.some((p) => p.id === panel.id) &&
                  deleteButton("products", panel.id, product(panel.id).name)}
                {panel.type === "customer" &&
                  s.customers.some((c) => c.id === panel.id) &&
                  deleteButton("customers", panel.id, customer(panel.id).name)}
                {panel.type === "movement" &&
                  s.movements.some((m) => m.id === panel.id) &&
                  deleteButton("movements", panel.id)}
              </div>
            )}
          {actionError && (
            <div className="form-error" role="alert">
              <CircleAlert size={17} />
              {actionError}
            </div>
          )}
        </Modal>
      )}
      {confirmation && (
        <Modal title="Konfirmasi tindakan" close={() => setConfirmation(null)}>
          <div className="form-body">
            <p>{confirmation.title}</p>
            <div className="form-actions">
              <Button variant="outline" onClick={() => setConfirmation(null)}>
                Kembali
              </Button>
              <Button
                variant={confirmation.destructive ? "destructive" : "default"}
                onClick={() => {
                  confirmation.action();
                  setConfirmation(null);
                }}
              >
                {confirmation.destructive ? "Ya, hapus" : "Ya, lanjutkan"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function OrderDetail({
  s,
  id,
  owner,
  act,
  open,
  cancel,
}: {
  s: State;
  id: string;
  owner: boolean;
  act: (c: Command, msg?: string) => boolean;
  open: (type: string, id?: string) => void;
  cancel: (o: Order) => void;
}) {
  const o = s.orders.find((o) => o.id === id)!;
  if (!o)
    return (
      <div className="form-body">
        <p role="status">
          Pesanan ini sudah dihapus. Tutup panel untuk kembali ke daftar.
        </p>
      </div>
    );
  const c = s.customers.find((c) => c.id === o.customerId)!;
  const trip = s.trips.find((t) => t.orderIds.includes(o.id));
  return (
    <div className="form-body">
      <div className="detail-title">
        <h3>{o.id}</h3>
        <Badge>{o.status}</Badge>
      </div>
      <p className="muted">
        {dateLabel(o.date)} · {c.name}
      </p>
      <div className="customer-detail">
        <strong>{c.name}</strong>
        <span>{c.phone}</span>
        <span>{c.address}</span>
      </div>
      <div className="status-track">
        {statuses.slice(0, 5).map((status, n) => (
          <div
            className={
              statuses.indexOf(o.status) >= n && o.status !== "dibatalkan"
                ? "done"
                : ""
            }
            key={status}
          >
            <span>
              {statuses.indexOf(o.status) > n && o.status !== "dibatalkan" ? (
                <Check size={12} />
              ) : (
                n + 1
              )}
            </span>
            <small>{status}</small>
          </div>
        ))}
      </div>
      <Table headings={["Buah", "Jumlah", "Subtotal"]}>
        {o.items.map((i) => (
          <tr key={i.productId}>
            <td>
              {s.products.find((p) => p.id === i.productId)!.name}
              <small>
                {money(i.price)} /{" "}
                {s.products.find((p) => p.id === i.productId)!.unit}
              </small>
            </td>
            <td>{quantity(i.qty)}</td>
            <td className="numeric">{money(i.qty * i.price)}</td>
          </tr>
        ))}
      </Table>
      <div className="order-totals">
        <span>
          Diskon <strong>{money(o.discount)}</strong>
        </span>
        <span>
          Total pesanan<strong>{money(total(o))}</strong>
        </span>
        <span>
          Pembayaran terverifikasi<strong>{money(paid(s, o.id))}</strong>
        </span>
        <span>
          Sisa tagihan
          <strong>{money(Math.max(0, total(o) - paid(s, o.id)))}</strong>
        </span>
      </div>
      {o.note && <p className="note-box">{o.note}</p>}
      <h3>Langkah berikutnya</h3>
      {["baru", "dikonfirmasi"].includes(o.status) && (
        <Button
          onClick={() =>
            act({
              type: "status",
              id: o.id,
              status: o.status === "baru" ? "dikonfirmasi" : "disiapkan",
            })
          }
        >
          {o.status === "baru" ? "Konfirmasi pesanan" : "Siapkan pesanan"}
          <ArrowRight size={16} />
        </Button>
      )}
      {o.status === "disiapkan" &&
        (trip ? (
          <p className="note-box">
            Terjadwal dalam {trip.id}. Mulai perjalanan dari modul Pengiriman.
          </p>
        ) : (
          <Button onClick={() => open("trip", o.id)}>
            <Truck size={16} />
            Jadwalkan pengiriman
          </Button>
        ))}
      {o.status === "dikirim" && (
        <p className="note-box">
          Dalam perjalanan {trip?.id}. Tandai terkirim melalui modul Pengiriman.
        </p>
      )}
      {owner && o.status !== "dibatalkan" && paid(s, o.id) < total(o) && (
        <Button variant="outline" onClick={() => open("payment", o.id)}>
          <Wallet size={16} />
          Catat pembayaran
        </Button>
      )}
      {o.status === "selesai" && (
        <Button variant="outline" onClick={() => open("return", o.id)}>
          Ajukan retur
        </Button>
      )}
      {["baru", "dikonfirmasi", "disiapkan"].includes(o.status) && (
        <Button variant="ghost" onClick={() => cancel(o)}>
          Batalkan pesanan
        </Button>
      )}
      <small className="muted">
        Stok dicadangkan saat dibuat, dikeluarkan saat dikirim. Pembayaran dan
        status pesanan dicatat terpisah.
      </small>
    </div>
  );
}

function Editor({
  s,
  panel,
  role,
  submit,
}: {
  s: State;
  panel: NonNullable<Panel>;
  role: Role;
  submit: (c: Command) => void;
}) {
  const existingCustomer =
    panel.type === "customer"
      ? s.customers.find((c) => c.id === panel.id)
      : undefined;
  const existingProduct =
    panel.type === "product"
      ? s.products.find((p) => p.id === panel.id)
      : undefined;
  const trip =
    panel.type === "expense"
      ? s.trips.find((t) => t.id === panel.id)
      : undefined;
  const [values, setValues] = useState<Record<string, string>>({
    date: today(),
    name: existingCustomer?.name || existingProduct?.name || "",
    phone: existingCustomer?.phone || "",
    address: existingCustomer?.address || "",
    note: existingCustomer?.note || "",
    sku: existingProduct?.sku || "",
    unit: existingProduct?.unit || "kg",
    cost: String(existingProduct?.cost || ""),
    price: String(existingProduct?.price || ""),
    low: String(existingProduct?.low ?? 10),
    productId:
      panel.type === "stock" ? panel.id || s.products[0]?.id || "" : "",
    kind: "Masuk",
    method: "Transfer",
    customerId: "",
    orderId: ["payment", "return"].includes(panel.type) ? panel.id || "" : "",
    category: "Bensin",
    person: trip?.driver || "",
    tripId: trip?.id || "",
    vehicle: trip?.vehicle || "",
    condition: "Rusak",
    refund: "0",
    discount: "0",
    qty: "",
    amount: "",
  });
  const [items, setItems] = useState<
    { productId: string; qty: string; price: string }[]
  >([
    {
      productId: s.products[0]?.id || "",
      qty: "1",
      price: String(s.products[0]?.price || 0),
    },
  ]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>(
    panel.type === "trip" && panel.id ? [panel.id] : [],
  );
  const [orderSearch, setOrderSearch] = useState("");
  const [proof, setProof] = useState<Evidence>();
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const set = (key: string, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));
  const input = (
    name: string,
    type = "text",
    required = true,
    extra: Record<string, string | number | boolean> = {},
  ) => (
    <input
      name={name}
      type={type}
      required={required}
      value={values[name] || ""}
      onChange={(e) => set(name, e.target.value)}
      {...(type === "number" ? { min: 0, step: "any" } : {})}
      {...extra}
    />
  );
  const selectedOrder = s.orders.find((o) => o.id === values.orderId);
  const selectedProduct = s.products.find((p) => p.id === values.productId);
  const eligibleTrips = s.orders.filter(
    (o) =>
      o.status === "disiapkan" &&
      !s.trips.some((t) => t.orderIds.includes(o.id)),
  );
  const matchingOrders = eligibleTrips.filter((o) => {
    const person = s.customers.find((c) => c.id === o.customerId)!;
    return [o.id, person.name, person.address]
      .join(" ")
      .toLowerCase()
      .includes(orderSearch.trim().toLowerCase());
  });
  async function upload(file?: File) {
    setProof(undefined);
    if (!file) return;
    if (
      !/^image\/(png|jpeg|webp)$|^video\/mp4$/.test(file.type) ||
      file.size > 750_000
    ) {
      setError(
        "Gunakan JPG, PNG, WebP, atau MP4 maksimal 750 KB untuk demo lokal.",
      );
      return;
    }
    setUploading(true);
    setError("");
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      setProof({ name: file.name, type: file.type, data });
    } catch {
      setError("Bukti tidak dapat dibaca. Coba pilih ulang berkas.");
    } finally {
      setUploading(false);
    }
  }
  const evidenceField = (
    <Field
      label={
        panel.type === "return" || panel.type === "proof"
          ? "Bukti foto / video (wajib)"
          : "Bukti (opsional)"
      }
      hint="JPG, PNG, WebP, MP4 · maksimal 750 KB. Hanya tersimpan di browser ini, bukan di server."
    >
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,video/mp4"
        required={panel.type === "return" || panel.type === "proof"}
        onChange={(e) => void upload(e.target.files?.[0])}
      />
      {proof && (
        <small className="upload-success">
          <Check size={13} />
          {proof.name}
        </small>
      )}
    </Field>
  );
  const orderSelect = (returnOnly = false) => (
    <Field label="Pesanan">
      <select
        required
        value={values.orderId}
        onChange={(e) => {
          set("orderId", e.target.value);
          set("productId", "");
        }}
      >
        <option value="">Pilih pesanan</option>
        {s.orders
          .filter((o) =>
            returnOnly ? o.status === "selesai" : o.status !== "dibatalkan",
          )
          .map((o) => (
            <option key={o.id} value={o.id}>
              {o.id} · {s.customers.find((c) => c.id === o.customerId)!.name}
            </option>
          ))}
      </select>
    </Field>
  );
  function save(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const v = values;
      const num = (key: string) => Number(v[key]);
      if (panel.type === "customer")
        submit({
          type: "customer",
          value: {
            id: panel.id || uid("PLG"),
            name: v.name.trim(),
            phone: v.phone.trim(),
            address: v.address.trim(),
            note: v.note,
          } as Customer,
        });
      if (panel.type === "product")
        submit({
          type: "product",
          value: {
            id: panel.id || uid("PRD"),
            name: v.name.trim(),
            sku: v.sku.trim(),
            unit: v.unit,
            cost: num("cost"),
            price: num("price"),
            low: num("low"),
            stock: existingProduct?.stock || 0,
            color: existingProduct?.color || "green",
          } as Product,
        });
      if (panel.type === "stock")
        submit({
          type: "stock",
          productId: v.productId,
          qty: num("qty"),
          kind: v.kind as "Masuk" | "Keluar" | "Rusak",
          note: v.note,
          date: v.date,
        });
      if (panel.type === "order")
        submit({
          type: "order",
          value: {
            id: `PSN-${Math.max(1000, ...s.orders.map((o) => Number(o.id.replace("PSN-", "")) || 0)) + 1}`,
            date: v.date,
            customerId: v.customerId,
            items: items.map((i) => ({
              productId: i.productId,
              qty: Number(i.qty),
              price: Number(i.price),
              cost: s.products.find((p) => p.id === i.productId)!.cost,
            })) as Item[],
            discount: num("discount"),
            note: v.note,
            status: "baru",
          },
        });
      if (panel.type === "trip")
        submit({
          type: "trip",
          value: {
            id: uid("JLN"),
            orderIds: selectedOrders,
            date: v.date,
            driver: v.person.trim(),
            vehicle: v.vehicle.trim(),
            address: v.address.trim(),
            note: v.note,
            status: "Terjadwal",
          },
        });
      if (panel.type === "payment")
        submit({
          type: "payment",
          value: {
            id: uid("BYR"),
            orderId: v.orderId,
            date: v.date,
            amount: num("amount"),
            method: v.method as "Transfer" | "Tunai" | "COD",
            verified: false,
            deposited: 0,
            proof,
          },
        });
      if (panel.type === "expense")
        submit({
          type: "expense",
          value: {
            id: uid("BIA"),
            date: v.date,
            category: v.category as "Bensin" | "Pembelian buah" | "Operasional",
            amount: num("amount"),
            person: v.person.trim(),
            tripId: v.tripId,
            vehicle: v.vehicle,
            note: v.note,
            proof,
          },
        });
      if (panel.type === "return") {
        if (!proof) throw new Error("Unggah bukti terlebih dahulu.");
        submit({
          type: "return",
          value: {
            id: uid("RTR"),
            date: v.date,
            orderId: v.orderId,
            productId: v.productId,
            qty: num("qty"),
            reason: v.note.trim(),
            proof,
            refund: num("refund"),
            condition: v.condition as "Rusak" | "Layak jual",
            status: "Diajukan",
          },
        });
      }
      if (panel.type === "proof") {
        if (!proof) throw new Error("Unggah bukti terlebih dahulu.");
        submit({ type: "proof", id: panel.id!, proof });
      }
      if (panel.type === "deposit")
        submit({ type: "deposit", id: panel.id!, amount: num("amount") });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <form onSubmit={save} className="form-body">
      {panel.type === "customer" && (
        <>
          <Field label="Nama pelanggan">{input("name")}</Field>
          <Field label="Nomor WhatsApp">
            {input("phone", "tel", true, { placeholder: "08xxxxxxxxxx" })}
          </Field>
          <Field label="Alamat pengiriman">
            <textarea
              required
              value={values.address}
              onChange={(e) => set("address", e.target.value)}
              rows={3}
            />
          </Field>
        </>
      )}
      {panel.type === "product" && (
        <>
          <Field label="Nama buah">{input("name")}</Field>
          <div className="form-grid">
            <Field label="SKU">{input("sku")}</Field>
            <Field label="Satuan">
              <select
                disabled={!!panel.id}
                value={values.unit}
                onChange={(e) => set("unit", e.target.value)}
              >
                {["kg", "buah", "dus"].map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </Field>
            <Field label="Harga beli / modal (Rp)">
              {input("cost", "number")}
            </Field>
            <Field label="Harga jual (Rp)">{input("price", "number")}</Field>
            <Field label="Batas stok rendah">{input("low", "number")}</Field>
          </div>
          <p className="note-box">
            Produk baru dimulai dengan stok nol. Tambahkan stok melalui tombol
            Mutasi setelah produk disimpan.
          </p>
        </>
      )}
      {panel.type === "stock" && (
        <>
          <Field label="Produk">
            <select
              value={values.productId}
              onChange={(e) => set("productId", e.target.value)}
            >
              {s.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.unit}
                </option>
              ))}
            </select>
          </Field>
          <p className="note-box">
            Stok tersedia:{" "}
            <strong>
              {selectedProduct ? quantity(available(s, selectedProduct)) : 0}{" "}
              {selectedProduct?.unit}
            </strong>
            . Cadangan pesanan tidak bisa dikeluarkan lewat mutasi manual.
          </p>
          <div className="form-grid">
            <Field label="Jenis mutasi">
              <select
                value={values.kind}
                onChange={(e) => set("kind", e.target.value)}
              >
                {["Masuk", "Keluar", "Rusak"].map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </Field>
            <Field label={`Jumlah (${selectedProduct?.unit || "satuan"})`}>
              {input("qty", "number", true, { min: 0.01 })}
            </Field>
          </div>
          <p className="muted">
            Barang masuk tidak otomatis mencatat pengeluaran kas. Catat
            pembelian pada modul Pengeluaran bila ada pembayaran.
          </p>
        </>
      )}
      {panel.type === "order" && (
        <>
          <Field label="Pelanggan">
            <select
              required
              value={values.customerId}
              onChange={(e) => set("customerId", e.target.value)}
            >
              <option value="">Pilih pelanggan</option>
              {s.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="form-section-heading">
            <h3>Item pesanan</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setItems([
                  ...items,
                  {
                    productId: s.products[0]?.id || "",
                    qty: "1",
                    price: String(s.products[0]?.price || 0),
                  },
                ])
              }
            >
              <Plus size={14} />
              Tambah item
            </Button>
          </div>
          {items.map((item, n) => {
            const p = s.products.find((p) => p.id === item.productId)!;
            if (!p)
              return (
                <p className="muted" key={n}>
                  Belum ada produk yang dapat dipesan. Tambahkan produk dan isi
                  stok melalui menu Produk &amp; Stok terlebih dahulu.
                </p>
              );
            const change = (key: string, value: string) =>
              setItems(
                items.map((i, index) =>
                  index === n
                    ? {
                        ...i,
                        [key]: value,
                        ...(key === "productId"
                          ? {
                              price: String(
                                s.products.find((p) => p.id === value)!.price,
                              ),
                            }
                          : {}),
                      }
                    : i,
                ),
              );
            return (
              <div className="order-item-editor" key={n}>
                <Field label={`Buah ${n + 1}`}>
                  <select
                    value={item.productId}
                    onChange={(e) => change("productId", e.target.value)}
                  >
                    {s.products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="form-grid">
                  <Field
                    label={`Jumlah (${p.unit})`}
                    hint={`${quantity(available(s, p))} ${p.unit} tersedia`}
                  >
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="any"
                      max={available(s, p)}
                      value={item.qty}
                      onChange={(e) => change("qty", e.target.value)}
                    />
                  </Field>
                  <Field label="Harga satuan (Rp)">
                    <input
                      required
                      type="number"
                      min="0"
                      value={item.price}
                      onChange={(e) => change("price", e.target.value)}
                    />
                  </Field>
                </div>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setItems(items.filter((_, index) => n !== index))
                    }
                  >
                    Hapus item {n + 1}
                  </Button>
                )}
              </div>
            );
          })}
          <Field label="Diskon pesanan (Rp)">
            {input("discount", "number")}
          </Field>
          <div className="form-total">
            Total pesanan
            <strong>
              {money(
                items.reduce((a, i) => a + Number(i.qty) * Number(i.price), 0) -
                  Number(values.discount),
              )}
            </strong>
          </div>
        </>
      )}
      {panel.type === "trip" && (
        <>
          <p className="muted">
            Pilih satu atau beberapa pesanan berstatus disiapkan yang belum
            dijadwalkan. Periksa pelanggan dan alamat sebelum menyimpan.
          </p>
          <details className="shipping-picker">
            <summary>
              <span>Pilih pesanan · {selectedOrders.length} dipilih</span>
              <ChevronDown size={18} aria-hidden="true" />
            </summary>
            <div className="shipping-picker-body">
              <Field label="Cari pesanan siap kirim">
                <input
                  type="search"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Nomor pesanan, pelanggan, atau alamat"
                />
              </Field>
              <fieldset className="order-choices">
                <legend>Pesanan siap dikirim</legend>
                {matchingOrders.map((o) => (
                  <label key={o.id}>
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(o.id)}
                      onChange={(e) =>
                        setSelectedOrders(
                          e.target.checked
                            ? [...selectedOrders, o.id]
                            : selectedOrders.filter((id) => id !== o.id),
                        )
                      }
                    />
                    <span>
                      <strong>
                        {o.id} ·{" "}
                        {s.customers.find((c) => c.id === o.customerId)!.name}
                      </strong>
                      <small>
                        {
                          s.customers.find((c) => c.id === o.customerId)!
                            .address
                        }
                      </small>
                      <small>
                        {dateLabel(o.date)} · {o.items.length} jenis buah ·{" "}
                        {money(total(o))}
                      </small>
                    </span>
                  </label>
                ))}
                {!eligibleTrips.length && (
                  <p className="muted">
                    Belum ada pesanan siap kirim. Ubah status pesanan menjadi
                    disiapkan terlebih dahulu.
                  </p>
                )}
                {eligibleTrips.length > 0 && !matchingOrders.length && (
                  <p className="muted">
                    Tidak ada pesanan yang cocok. Coba nomor, nama pelanggan,
                    atau alamat lain.
                  </p>
                )}
              </fieldset>
            </div>
          </details>
          <div className="shipping-selection" aria-label="Pesanan yang dipilih">
            <strong>{selectedOrders.length} pesanan dipilih</strong>
            {!selectedOrders.length && (
              <p className="muted">Belum ada pesanan dipilih.</p>
            )}
            {selectedOrders.map((id) => {
              const order = s.orders.find((o) => o.id === id)!;
              if (!order)
                return (
                  <div className="shipping-selected-order" key={id}>
                    <p>Pesanan {id} sudah dihapus.</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSelectedOrders(
                          selectedOrders.filter((value) => value !== id),
                        )
                      }
                    >
                      Hapus pilihan
                    </Button>
                  </div>
                );
              const person = s.customers.find(
                (c) => c.id === order.customerId,
              )!;
              return (
                <div className="shipping-selected-order" key={id}>
                  <div>
                    <strong>
                      {id} · {person.name}
                    </strong>
                    <small>{person.address}</small>
                    <small>
                      {order.items
                        .map(
                          (item) =>
                            `${s.products.find((p) => p.id === item.productId)?.name} (${quantity(item.qty)})`,
                        )
                        .join(", ")}
                    </small>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Hapus pilihan ${id}`}
                    onClick={() =>
                      setSelectedOrders(
                        selectedOrders.filter((value) => value !== id),
                      )
                    }
                  >
                    Hapus
                  </Button>
                </div>
              );
            })}
          </div>
          <Field label="Petugas pengiriman">{input("person")}</Field>
          <Field label="Kendaraan / nomor polisi">{input("vehicle")}</Field>
          <Field label="Alamat atau rangkuman rute">{input("address")}</Field>
        </>
      )}
      {panel.type === "payment" && (
        <>
          {orderSelect()}
          <div className="form-grid">
            <Field label="Metode pembayaran">
              <select
                value={values.method}
                onChange={(e) => set("method", e.target.value)}
              >
                {["Transfer", "Tunai", "COD"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>
            <Field label="Nominal diterima (Rp)">
              {input("amount", "number", true, { min: 1 })}
            </Field>
          </div>
          {selectedOrder && (
            <p className="note-box">
              Total {money(total(selectedOrder))}. Belum dicatat:{" "}
              {money(
                total(selectedOrder) -
                  s.payments
                    .filter((p) => p.orderId === selectedOrder.id)
                    .reduce((a, p) => a + p.amount, 0),
              )}{" "}
              (termasuk transfer menunggu sebagai sudah dicatat).
            </p>
          )}
          {values.method === "Transfer" && (
            <>
              {evidenceField}
              <p className="muted">
                Transfer disimpan sebagai menunggu. Verifikasi dilakukan
                terpisah setelah bukti diperiksa.
              </p>
            </>
          )}
          {values.method === "COD" && (
            <p className="note-box">
              Ini penerimaan dari pelanggan. Setoran petugas dicatat terpisah
              setelah uang diterima gudang.
            </p>
          )}
        </>
      )}
      {panel.type === "expense" && (
        <>
          <Field label="Kategori">
            <select
              value={values.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {["Bensin", "Pembelian buah", "Operasional"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <div className="form-grid">
            <Field label="Nominal (Rp)">
              {input("amount", "number", true, { min: 1 })}
            </Field>
            <Field label="Petugas">{input("person")}</Field>
          </div>
          <Field label="Perjalanan terkait (opsional)">
            <select
              value={values.tripId}
              onChange={(e) => {
                set("tripId", e.target.value);
                const t = s.trips.find((t) => t.id === e.target.value);
                if (t) {
                  set("vehicle", t.vehicle);
                  set("person", t.driver);
                }
              }}
            >
              <option value="">Tanpa perjalanan</option>
              {s.trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} · {t.driver}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Kendaraan (opsional)">
            {input("vehicle", "text", false)}
          </Field>
          {evidenceField}
          {values.category === "Pembelian buah" && (
            <p className="note-box">
              Catatan ini hanya pengeluaran kas. Penerimaan fisik dicatat lewat
              mutasi masuk. Pembelian tidak dikurangi lagi dari laba.
            </p>
          )}
        </>
      )}
      {panel.type === "return" && (
        <>
          {orderSelect(true)}
          <Field label="Item yang diretur">
            <select
              required
              value={values.productId}
              onChange={(e) => set("productId", e.target.value)}
            >
              <option value="">Pilih item</option>
              {selectedOrder?.items.map((i) => (
                <option key={i.productId} value={i.productId}>
                  {s.products.find((p) => p.id === i.productId)!.name} · dipesan{" "}
                  {i.qty}
                </option>
              ))}
            </select>
          </Field>
          <div className="form-grid">
            <Field label="Jumlah retur">
              {input("qty", "number", true, { min: 0.01 })}
            </Field>
            <Field label="Hasil pemeriksaan">
              <select
                value={values.condition}
                onChange={(e) => set("condition", e.target.value)}
              >
                <option>Rusak</option>
                <option>Layak jual</option>
              </select>
            </Field>
          </div>
          <Field label="Pengembalian uang (Rp)">
            {input("refund", "number")}
          </Field>
          {evidenceField}
          <p className="note-box">
            Barang baru masuk stok setelah retur disetujui dan dinyatakan layak
            jual.{" "}
            {role !== "Owner" && "Retur dengan refund diputuskan oleh Owner."}
          </p>
        </>
      )}
      {panel.type === "proof" && evidenceField}
      {panel.type === "deposit" && (
        <>
          <p className="note-box">
            COD belum disetor:{" "}
            {money(
              (s.payments.find((p) => p.id === panel.id)?.amount || 0) -
                (s.payments.find((p) => p.id === panel.id)?.deposited || 0),
            )}
          </p>
          <Field label="Nominal setoran diterima (Rp)">
            {input("amount", "number", true, { min: 1 })}
          </Field>
        </>
      )}
      {!["customer", "product", "proof", "deposit"].includes(panel.type) && (
        <Field label={panel.type === "trip" ? "Tanggal pengiriman" : "Tanggal"}>
          {input("date", "date")}
        </Field>
      )}
      {!["product", "proof", "deposit", "payment"].includes(panel.type) && (
        <Field
          label={
            panel.type === "return" ? "Alasan retur" : "Catatan (opsional)"
          }
        >
          <textarea
            rows={3}
            required={panel.type === "return"}
            value={values.note}
            onChange={(e) => set("note", e.target.value)}
          />
        </Field>
      )}
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <Button
          disabled={
            uploading ||
            (panel.type === "trip" && !selectedOrders.length) ||
            (panel.type === "order" &&
              (!s.products.length || !s.customers.length))
          }
          type="submit"
        >
          <Check size={16} />
          {uploading ? "Membaca bukti…" : "Simpan"}
        </Button>
      </div>
      {existingCustomer && (
        <section className="customer-history">
          <h3>Riwayat transaksi</h3>
          {s.orders
            .filter((o) => o.customerId === existingCustomer.id)
            .map((o) => (
              <div key={o.id}>
                <span>
                  {o.id}
                  <small>
                    {dateLabel(o.date)} · {o.status}
                  </small>
                </span>
                <strong>{money(total(o))}</strong>
              </div>
            ))}
          {!s.orders.some((o) => o.customerId === existingCustomer.id) && (
            <p className="muted">Belum ada transaksi.</p>
          )}
        </section>
      )}
    </form>
  );
}
