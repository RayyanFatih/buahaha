import { type State, stateSchema } from "./domain";

export const DATA_KEY = "buahaha.data.v2";
export const LEGACY_KEYS = [
  "buahaha.demo.v1",
  "buahaha.history.september-2026.v1",
  "buahaha.history.before-september-2026.v1",
];
export const emptyState = (): State => ({
  version: 1,
  products: [],
  customers: [],
  orders: [],
  trips: [],
  payments: [],
  expenses: [],
  returns: [],
  movements: [],
});

export function readStoredState(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
): State {
  const raw = storage.getItem(DATA_KEY);
  const state =
    raw === null ? emptyState() : stateSchema.parse(JSON.parse(raw));
  // The new key is the migration marker. Never reset data entered after this upgrade.
  if (raw === null) storage.setItem(DATA_KEY, JSON.stringify(state));
  // Old tabs may still write the old key; it is never read by this version.
  for (const key of LEGACY_KEYS) storage.removeItem(key);
  return state;
}
