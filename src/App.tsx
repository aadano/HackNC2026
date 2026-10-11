import { useEffect, useState } from "react";
import type { TrackedPromise, PromiseStatus } from "./types/promise";
import { SignIn } from "./components/SignIn";
import { useAuthUser } from "./services/auth";
import { completePromise as completeSavedPromise, watchPromises } from "./services/promises";
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
  //useState to allow React to remember information that can change while app runs.
  const [promises, setPromises] = useState<TrackedPromise[]>([]); // emptylist initially
  const [filter, setFilter] = useState<Filter>("all"); // initial selection
  const { user, loading } = useAuthUser(); // signed-in Firebase user, or null

  // Live list of the signed-in user's promises from Firestore; empty when signed out.
  useEffect(() => {
    if (!user) {
      setPromises([]);
      return;
    }
    return watchPromises(user.uid, setPromises);
  }, [user]);


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

  // Saves to Firestore; the live list above picks up the change.
  function completePromise(id: string) {
    if (!user) return;
    completeSavedPromise(user.uid, id).catch(console.error);
  }


  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">YOUR COMMITMENTS, IN ONE PLACE</p>
          <h1>Promise Tracker</h1>
          <p className="subtitle">Keep track of what people said they'd do.</p>
          {!loading && <SignIn user={user} />}
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

          {visiblePromises.length === 0 && (
            <p className="empty-state">
              {user
                ? "Nothing here yet. A little breathing room for your promises."
                : "Sign in to see your promises."}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
