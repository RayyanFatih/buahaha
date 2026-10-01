"use client";

import { useSyncExternalStore } from "react";
import { demoState } from "./demo";
import { Command, execute, Role, State, stateSchema } from "./domain";
import { HISTORY_BACKUP_KEY, migrateHistory } from "./history-migration";

const key = "buahaha.demo.v1";
type Snapshot = { state: State | null; error: string };
const server: Snapshot = { state: null, error: "" };
let snapshot: Snapshot = server;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
function readState() {
  const raw = localStorage.getItem(key);
  const state = raw ? stateSchema.parse(JSON.parse(raw)) : demoState();
  return migrateHistory(state, raw, localStorage, key);
}
function load() {
  try {
    snapshot = {
      state: readState(),
      error: "",
    };
  } catch {
    snapshot = {
      state: null,
      error:
        "Data lokal tidak dapat dibaca. Unduh salinan sebelum mereset, atau izinkan penyimpanan browser.",
    };
  }
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (snapshot === server) {
    load();
    emit();
  }
  const sync = (event: StorageEvent) => {
    if (event.key === key) {
      load();
      emit();
    }
  };
  window.addEventListener("storage", sync);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", sync);
  };
}
export const useStore = () =>
  useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => server,
  );
function persist(state: State) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    throw new Error(
      "Penyimpanan lokal penuh atau diblokir. Perubahan belum disimpan. Gunakan bukti lebih kecil atau unduh cadangan dan reset demo.",
    );
  }
  snapshot = { state, error: "" };
  emit();
}
export function dispatch(c: Command, role: Role) {
  // Re-read before each transaction so another tab cannot silently overwrite a stale snapshot.
  const state = readState();
  if (!state) throw new Error("Data belum siap.");
  persist(execute(state, c, role));
}
export const resetDemo = () => persist(demoState());
export function download(
  name: string,
  content: string,
  type = "text/plain;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const backup = () =>
  download(
    "buahaha-cadangan.json",
    localStorage.getItem(key) || JSON.stringify(snapshot.state),
    "application/json",
  );

export const hasHistoryBackup = () =>
  Boolean(localStorage.getItem(HISTORY_BACKUP_KEY));
export function backupHistory() {
  const raw = localStorage.getItem(HISTORY_BACKUP_KEY);
  if (raw)
    download(
      "buahaha-sebelum-penyesuaian-tanggal.json",
      raw,
      "application/json",
    );
}
