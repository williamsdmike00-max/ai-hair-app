// src/lib/proStatus.ts

const KEY = "stylegenie_pro_active";

export function getProStatus(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(KEY) === "true";
  } catch {
    return false;
  }
}

export function setProStatus(value: boolean) {
  try {
    if (typeof window === "undefined") return;
    if (value) {
      localStorage.setItem(KEY, "true");
    } else {
      localStorage.removeItem(KEY);
    }
  } catch (e) {
    console.error("Failed to update pro status", e);
  }
}
