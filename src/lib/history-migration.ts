import { DEMO_DATE } from "./demo";
import { State } from "./domain";

export const HISTORY_MIGRATION_KEY = "buahaha.history.september-2026.v1";
export const HISTORY_BACKUP_KEY = "buahaha.history.before-september-2026.v1";

// Run once per browser. Transactions entered after this migration keep their dates.
export function migrateHistory(
  state: State,
  raw: string | null,
  storage: Pick<Storage, "getItem" | "setItem">,
  stateKey: string,
): State {
  if (storage.getItem(HISTORY_MIGRATION_KEY)) return state;
  const next = structuredClone(state);
  const cap = (date: string) => (date > DEMO_DATE ? DEMO_DATE : date);
  for (const rows of [
    next.orders,
    next.payments,
    next.trips,
    next.expenses,
    next.returns,
    next.movements,
  ]) {
    for (const row of rows) row.date = cap(row.date);
  }
  for (const order of next.orders) {
    if (order.completedAt) order.completedAt = cap(order.completedAt);
  }
  if (
    raw &&
    JSON.stringify(next) !== JSON.stringify(state) &&
    !storage.getItem(HISTORY_BACKUP_KEY)
  ) {
    // Save the original before changing any persisted dates; failure aborts migration.
    storage.setItem(HISTORY_BACKUP_KEY, raw);
  }
  storage.setItem(stateKey, JSON.stringify(next));
  storage.setItem(HISTORY_MIGRATION_KEY, "done");
  return next;
}
