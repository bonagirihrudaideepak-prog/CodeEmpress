# JavaScript Closures in Depth — Mini Project

- **Title:** Tiny Observable Store
- **Goal:** Build a small closure-based store and wire it to a DOM counter.
- **Learning outcomes:** Objectives 1–5 from lesson.md (private state, closures, subscriptions).
- **Difficulty:** INTERMEDIATE
- **Estimated duration:** 45 minutes
- **Required skills:** Closures, arrays, event listeners, basic DOM.

## Requirements

1. `createStore(reducer, initialState)` returns an object with:
   - `getState()` — returns the current state.
   - `dispatch(action)` — runs the reducer and notifies subscribers.
   - `subscribe(listener)` — adds a listener, returns an unsubscribe function.
2. State and listeners are held in the closure and are **not** exposed.
3. A simple reducer `(state, action)` that handles `{ type: "INCREMENT" }` and
   `{ type: "DECREMENT" }`.

## Deliverables

- `store.js` (the store) and `index.html`/`app.js` that render the counter and
  two buttons (`+` / `-`) that call `dispatch`.
- A short README explaining how the closures keep state private.

## Stretch goals

- Add `{ type: "RESET" }` and a `getSnapshot()` that returns a frozen copy.
- Add an `onDestroy()` that removes all listeners.

## Evaluation rubric

| Criterion | Weight | Novice | Competent | Exemplary |
|---|---|---|---|---|
| Correctness | 40% | Store errors out | Handles INCREMENT/DECREMENT | Full reducer + error handling |
| Encapsulation | 25% | State is global | State in closure but exposed | State truly private + frozen snapshots |
| Code quality | 35% | Hard to follow | Clear | Clean, idiomatic, documented |
