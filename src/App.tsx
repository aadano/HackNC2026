import { useState } from "react";
import type { TrackedPromise, PromiseStatus } from "./types/promise";
import "./App.css";

const samplePromises: TrackedPromise[] = [
  {
    id: "1",
    description: "Send the lecture notes",
    promisor: "Alex",
    deadline: new Date(Date.now() + 86400000).toISOString(),
    status: "pending",
    sourceText: "I'll send you the lecture notes tomorrow.",
    promisorPhone: null,
    spaceId: "sample",
    remindedAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    description: "Return the borrowed book",
    promisor: "Jamie",
    deadline: new Date(Date.now() - 86400000).toISOString(),
    status: "pending",
    sourceText: "I'll return your book by yesterday.",
    promisorPhone: null,
    spaceId: "sample",
    remindedAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    description: "Share the project slides",
    promisor: "You",
    deadline: null,
    status: "completed",
    sourceText: "I'll share the slides with everyone.",
    promisorPhone: null,
    spaceId: "sample",
    remindedAt: null,
    createdAt: new Date().toISOString(),
  },
];

type Filter = "all" | PromiseStatus | "overdue";

function isOverdue(promise: TrackedPromise): boolean {
  return (
    promise.status === "pending" &&
    promise.deadline !== null &&
    new Date(promise.deadline).getTime() < Date.now()
  );
}

function App() {
  const [promises, setPromises] = useState<TrackedPromise[]>(samplePromises);
  const [filter, setFilter] = useState<Filter>("all");

  const visiblePromises = promises.filter((promise) => {
    if (filter === "all") return true;
    if (filter === "overdue") return isOverdue(promise);
    return promise.status === filter;
  });

  function completePromise(id: string) {
    setPromises((current) =>
      current.map((promise) =>
        promise.id === id ? { ...promise, status: "completed" } : promise,
      ),
    );
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">YOUR COMMITMENTS, IN ONE PLACE</p>
          <h1>Promise Tracker</h1>
          <p className="subtitle">Keep track of what people said they'd do.</p>
        </div>
      </header>

      <section className="summary">
        <div className="summary-card">
          <span>Total promises</span>
          <strong>{promises.length}</strong>
        </div>
        <div className="summary-card">
          <span>Pending</span>
          <strong>
            {promises.filter((p) => p.status === "pending").length}
          </strong>
        </div>
        <div className="summary-card">
          <span>Overdue</span>
          <strong>{promises.filter(isOverdue).length}</strong>
        </div>
      </section>

      <section className="promise-section">
        <div className="section-heading">
          <h2>Commitments</h2>
          <label>
            <span className="sr-only">Filter promises</span>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as Filter)}
            >
              <option value="all">All promises</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
        </div>

        <div className="promise-list">
          {visiblePromises.map((promise) => (
            <article className="promise-card" key={promise.id}>
              <div className="promise-info">
                <h3>{promise.description}</h3>
                <p>Promised by {promise.promisor}</p>
                <p className="source">"{promise.sourceText}"</p>
              </div>

              <div className="promise-meta">
                <span
                  className={`status status-${isOverdue(promise) ? "overdue" : promise.status}`}
                >
                  {isOverdue(promise) ? "Overdue" : promise.status}
                </span>

                <span className="deadline">
                  {promise.deadline
                    ? new Date(promise.deadline).toLocaleDateString()
                    : "No deadline"}
                </span>

                {promise.status === "pending" && (
                  <button
                    className="complete-button"
                    onClick={() => completePromise(promise.id)}
                  >
                    Mark complete
                  </button>
                )}
              </div>
            </article>
          ))}

          {visiblePromises.length === 0 && (
            <p className="empty-state">
              Nothing here yet. A little breathing room for your promises.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
