import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dateLabel, shiftDate, today } from "@/lib/domain";

export type PeriodMode = "day" | "range";

export function PeriodFilter({
  from,
  to,
  mode,
  onChange,
}: {
  from: string;
  to: string;
  mode: PeriodMode;
  onChange: (from: string, to: string, mode: PeriodMode) => void;
}) {
  const day = (date: string) => onChange(date, date, "day");
  const current = today();
  return (
    <section className="period-filter" aria-label="Periode laporan">
      <div className="period-controls">
        <div className="period-tabs" role="group" aria-label="Mode periode">
          <button
            aria-pressed={mode === "day"}
            className={mode === "day" ? "selected" : ""}
            onClick={() => day(to)}
          >
            Harian
          </button>
          <button
            aria-pressed={mode === "range"}
            className={mode === "range" ? "selected" : ""}
            onClick={() => onChange(from, to, "range")}
          >
            Rentang tanggal
          </button>
        </div>
        {mode === "day" ? (
          <div className="day-picker">
            <Button
              variant="outline"
              size="icon"
              aria-label="Hari sebelumnya"
              onClick={() => day(shiftDate(from, -1))}
            >
              <ChevronLeft size={17} />
            </Button>
            <label>
              Tanggal laporan
              <input
                type="date"
                value={from}
                onChange={(e) => {
                  if (e.target.value) day(e.target.value);
                }}
              />
            </label>
            <Button
              variant="outline"
              size="icon"
              aria-label="Hari berikutnya"
              onClick={() => day(shiftDate(from, 1))}
            >
              <ChevronRight size={17} />
            </Button>
          </div>
        ) : (
          <div className="date-inputs">
            <label>
              Dari tanggal
              <input
                type="date"
                aria-label="Tanggal mulai"
                value={from}
                onChange={(e) => {
                  if (e.target.value) onChange(e.target.value, to, "range");
                }}
              />
            </label>
            <span aria-hidden="true">–</span>
            <label>
              Sampai tanggal
              <input
                type="date"
                aria-label="Tanggal akhir"
                value={to}
                onChange={(e) => {
                  if (e.target.value) onChange(from, e.target.value, "range");
                }}
              />
            </label>
          </div>
        )}
      </div>
      <div className="period-shortcuts">
        <div role="group" aria-label="Pilih periode cepat">
          <Button variant="ghost" size="sm" onClick={() => day(current)}>
            Hari ini
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => day(shiftDate(current, -1))}
          >
            Kemarin
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange(current.slice(0, 8) + "01", current, "range")
            }
          >
            Bulan ini
          </Button>
        </div>
        <p aria-live="polite">
          {from > to
            ? "Rentang tanggal tidak valid"
            : from === to
              ? `Hasil tanggal ${dateLabel(from)}`
              : `${dateLabel(from)} – ${dateLabel(to)}`}
        </p>
      </div>
    </section>
  );
}
