import { useState } from "react";
import type { TrackedPromise, PromiseStatus } from "./types/promise";
import { SignOutButton } from "./auth/SignOutButton";
import { useUserPromises } from "./hooks/useUserPromise";
import { PasteConversation } from "./components/PasteConverstation";
import "./App.css";

// defines the values the filter is allowed to have.
type Filter = "all" | PromiseStatus | "overdue";

// takes a promise and returns true if conditions met
function isOverdue(promise: TrackedPromise): boolean {
  return (
    promise.status === "pending" &&
    promise.deadline !== null &&
    new Date(promise.deadline).getTime() < Date.now()
  );
}

function App() {
  // Live, per-user data from Firestore. App only renders behind <AuthGate>, so a user always exists here.
  const { promises, loaded, error, addPromises, setStatus } = useUserPromises();
  const [filter, setFilter] = useState<Filter>("all"); // initial selection

  // creates new array matching the selected filter only
  const visiblePromises = promises.filter((promise) => {
    // filters each promise
    if (filter === "all") return true;
    if (filter === "overdue") return isOverdue(promise);
    return promise.status === filter; // only runs when filter is neither all nor overdue
  });

  // sort promises based on priority
  const sortedPromises = [...visiblePromises].sort((a, b) => {
    // Pending promises come before completed/cancelled ones
    const aPending = a.status === "pending";
    const bPending = b.status === "pending";

    if (aPending && !bPending) return -1;
    if (!aPending && bPending) return 1;

    // Promises without deadlines go after dated promises
    if (a.deadline === null && b.deadline !== null) return 1;
    if (a.deadline !== null && b.deadline === null) return -1;

    // Compare deadlines when both exist
    if (a.deadline !== null && b.deadline !== null) {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }

    return 0;
  });

  // Saves to Firestore; the live listener in the hook updates the screen.
  function completePromise(id: string) {
    setStatus(id, "completed");
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">YOUR COMMITMENTS, IN ONE PLACE</p>
          <h1>Promise Tracker</h1>
          <p className="subtitle">Keep track of what people said they'd do.</p>
          <SignOutButton />
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

        {error && <p role="alert">{error}</p>}

        <div className="promise-list">
          {sortedPromises.map((promise) => (
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

          {/* Only after the first Firestore response, so it doesn't flash while loading */}
          {loaded && visiblePromises.length === 0 && (
            <p className="empty-state">
              Nothing here yet. A little breathing room for your promises.
            </p>
          )}
        </div>
      </section>
      <PasteConversation onSave={addPromises} />
    </main>
  );
}

export default App;
