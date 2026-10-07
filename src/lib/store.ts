"use client";

import { useSyncExternalStore } from "react";
import { Command, execute, Role, State } from "./domain";
import { DATA_KEY, emptyState, readStoredState } from "./storage-state";

const key = DATA_KEY;
type Snapshot = { state: State | null; error: string };
const server: Snapshot = { state: null, error: "" };
let snapshot: Snapshot = server;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
function readState() {
  return readStoredState(localStorage);
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
        "Data lokal tidak dapat dibaca. Unduh salinan sebelum memulai ulang, atau izinkan penyimpanan browser.",
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
      "Penyimpanan lokal penuh atau diblokir. Perubahan belum disimpan. Gunakan bukti lebih kecil atau izinkan penyimpanan browser.",
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
export const resetData = () => persist(emptyState());
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
