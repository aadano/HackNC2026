import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { PromiseStatus, TrackedPromise } from "../src/types/promise.ts";

// Whole store lives in memory and is rewritten to one JSON file on every change.
const FILE = "data/promises.json";

let promises: TrackedPromise[] = existsSync(FILE)
  ? JSON.parse(readFileSync(FILE, "utf8"))
  : [];

function save() {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(promises, null, 2));
}

export function addPromise(p: TrackedPromise) {
  promises.push(p);
  save();
}

export function setStatus(id: string, status: PromiseStatus) {
  const p = promises.find((p) => p.id === id);
  if (!p) return;
  p.status = status;
  save();
}

export function markReminded(id: string) {
  const p = promises.find((p) => p.id === id);
  if (!p) return;
  p.remindedAt = new Date().toISOString();
  save();
}

export function pendingInSpace(spaceId: string): TrackedPromise[] {
  return promises.filter((p) => p.spaceId === spaceId && p.status === "pending");
}

export function dueForReminder(now: Date): TrackedPromise[] {
  return promises.filter(
    (p) =>
      p.status === "pending" &&
      p.deadline !== null &&
      p.remindedAt === null &&
      new Date(p.deadline) <= now,
  );
}
