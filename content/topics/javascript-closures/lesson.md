# JavaScript Closures in Depth

## Metadata

- **Domain:** Web Development
- **Category:** JavaScript
- **Module:** JavaScript Fundamentals
- **Difficulty:** INTERMEDIATE
- **Estimated time:** 45 minutes
- **Version:** 1.0.0
- **Status:** PUBLISHED

## Learning Objectives

By the end of this topic you will be able to:

- Explain what a closure is in plain terms.
- Describe how lexical scope lets a function "remember" its outer variables.
- Identify where closures appear naturally (callbacks, event handlers, module patterns).
- Build a closure-based counter and a private-state factory.
- Recognise and avoid the classic loop-and-closure pitfall.

## Prerequisites

- Variables, functions, and basic `function` vs arrow syntax.
- Understanding of copying vs referencing values.
- (Nice to have) a basic idea of how JavaScript executes synchronously.

## Estimated Duration

45 minutes.

## ELI5 Explanation

Imagine you give a friend a backpack. Inside the backpack is a photo of your
house. Later, even after you've moved away, when your friend opens the
backpack they still see a picture of the *old* house.

A closure is that backpack. When you define a function inside another function,
JavaScript tucks the outer function's variables into a little backpack that the
inner function carries around. Even after the outer function has finished, the
inner function can still reach into the backpack and read those variables.

## Beginner Explanation

In JavaScript, every function forms a *lexical scope* — it can access variables
declared in the place where it was **written**, not where it's called.

A closure happens when an inner function references a variable from an outer
function. The inner function "closes over" that variable, keeping it alive.

```js
function makeGreeter(name) {
  // 'name' is available inside the returned function
  return function () {
    console.log(`Hello, ${name}!`);
  };
}

const greetAlice = makeGreeter("Alice");
greetAlice(); // Hello, Alice!   <- 'name' was remembered
greetAlice(); // Hello, Alice!
```

Even though `makeGreeter` has returned, `greetAlice` still knows `name` is
`"Alice"`. That's the closure.

## Intermediate Explanation

A closure captures the *variable binding*, not just its value. This is why the
"loop trap" below is so common: if you capture a loop variable, every closure
sees the final value because they all point to the *same* binding.

Closures are created every time a function is created in JavaScript — they're
not a special syntax, just a consequence of nested functions and lexical scope.

Common real uses:

- **Private state / data encapsulation:** a factory that returns functions
  which share hidden variables but expose no direct access.
- **Partial application / currying:** fixing some arguments now, more later.
- **Callback memory:** a callback that needs to remember the state at the time
  it was created.

```js
function createCounter() {
  let count = 0;            // private variable, no direct access
  return {
    increment: () => ++count,
    decrement: () => --count,
    value: () => count,     // <- closure reads 'count'
  };
}

const c = createCounter();
c.increment(); // 1
c.increment(); // 2
c.decrement(); // 1
c.value();     // 1
// count is NOT accessible from outside — it's private.
```

## Advanced Explanation

Beneath the surface, each call to a function creates an *execution context*
with its own *lexical environment*. When an inner function references an outer
variable, the engine links to that environment via a reference (sometimes
called a closure's `[[Environment]]` internal slot). Garbage collectors keep an
environment alive as long as any closure referencing it is reachable.

Considerations for production:

- **Performance:** creating many closures has a cost (extra allocation per
  function call). A closure that captures large arrays can keep them alive
  longer than expected — avoid accidental retention in hot paths.
- **Block scoping (`let`/`const`):** each loop *iteration* creates a fresh
  binding for `let`, which is why `let` avoids the classic trap that `var`
  falls into.
- **Memory leaks:** closures intentionally keep their environment alive. If a
  closure is long-lived but only needed briefly, that captured state stays in
  memory unless the closure itself is released.

## Real-world Use Cases

- **React hooks:** each render forms a closure over `props`/`state`; `useEffect`
  callbacks and event handlers capture the values from the render they were
  created in.
- **Event handlers:** a button handler that remembers which item it belongs to.
- **Module pattern:** bundling private data with public API (IIFE modules,
  `const mod = (() => {...})()`).
- **Debounce/throttle:** a wrapper remembers the timer and the last arguments.
- **Currying** in functional utilities (e.g. `add(a)(b)`).

## Worked Examples

### Example 1 — A closure-based counter

```js
// Objective: create a function that generates independent counters,
// each with its own private state. Demonstrates stateful closures.

function createCounter(start = 0) {
  let count = start;            // captured by the returned methods
  return {
    increment: () => ++count,   // closure reads & writes 'count'
    decrement: () => --count,
    getValue: () => count,
  };
}

const a = createCounter(10);
const b = createCounter(0);

a.increment(); // 11
a.increment(); // 12
b.increment(); // 1   <- independent of 'a'
b.increment(); // 2

console.log(a.getValue()); // 12
console.log(b.getValue()); // 2
```

**Line-by-line:** `createCounter` declares `count`. The returned object's three
arrow functions each close over that `count`. Each call to `createCounter`
creates a *separate* `count` in its own environment, so `a` and `b` never
interfere.

**Expected output:**

```
12
2
```

**Complexity:** O(1) for each operation. **Pitfalls:** don't expose `count`
directly — it would break encapsulation; also note arrows inherit `this` from
the enclosing scope (here it doesn't matter, but arrow vs `function` matters
when you need a dynamic `this`).

### Example 2 — Fixing the classic loop trap

```js
// Objective: show WHY capturing a loop variable fails, then how to fix it
// with let (block scope creates a fresh binding each iteration).

const actions = [];
for (var i = 0; i < 3; i++) {
  actions.push(() => console.log(i));   // captures the SAME 'i'
}
actions.forEach((fn) => fn());          // 3 3 3  (surprise!)

const actionsLet = [];
for (let i = 0; i < 3; i++) {           // fresh 'i' per iteration
  actionsLet.push(() => console.log(i));
}
actionsLet.forEach((fn) => fn());       // 0 1 2  (expected)
```

**Expected output:**

```
3
3
3
0
1
2
```

**Why:** with `var`, all closures share one binding, which ends at `3`. With
`let`, each iteration gets its own binding, so each closure remembers a
different value. **Improved version:** alternatively wrap with an IIFE or use
`Array.from` to pass the value by argument.

## Hands-on Exercises

1. **Counter factory:** build `createAccumulator()` that starts at 0, has
   `add(n)` and `reset()`, and proves the value is private (attempting to read
   it from outside returns `undefined`).
2. **Multiply with closures:** write `multiply(x)` returning a function that
   multiplies its argument by `x`. Use it to make `double` and `triple`.
3. **Debounce:** write a `debounce(fn, delay)` that returns a wrapped function
   which only runs `fn` after `delay` ms of no further calls. Confirm it
   remembers the latest arguments.

## Mini Project

Build a **`createStore(reducer, initialState)`** closure: a tiny observable
state container with `getState()`, `dispatch(action)`, and `subscribe(listener)`.
The state and listeners live in the closure, so they are private. Then wire it
into a small DOM counter (click a button to `dispatch({type:'INCREMENT'})`) to
prove the subscriber fires.

> Full details: see `project.md`.

## Common Mistakes

- Assuming closures copy the value — they capture the **reference/binding**.
- The `var` loop trap (see Example 2) — and then blaming the closure when it's
  really about shared scope.
- Overusing closures in hot loops and leaking large objects that stay reachable.
- Forgetting that an arrow function closes over the `this` of where it was
  defined, not where it's called.
- Expecting the captured binding to be fresh per call when it isn't.

## Best Practices

- Prefer `let`/`const` and keep closure payloads small.
- Name the factory/closures clearly to make the captured state obvious.
- Use closures for encapsulation (data hiding) rather than global state.
- Clean up subscriptions/event listeners to avoid keeping unrelated objects
  alive.
- Test closures with multiple instances to confirm state is not shared.

## Cheat Sheet

- **Closure** = inner function + the outer-scope variables it closes over.
- Created automatically whenever a nested function references an outer binding.
- **Captures the binding**, so changes are shared unless you use block scope.
- `let` in a loop → fresh binding per iteration; `var` → one shared binding.
- Use for: private state, callbacks, currying, memoization, module pattern.
- Watch for: memory retention, `this` with arrow functions, hot-path allocation.

```js
function outer(x) {
  return () => x * 2; // closes over x
}
const double = outer(5);
double(); // 10
```

## Quiz

> See `quiz.json` — 5 questions covering objectives 1–5.

## Interview Questions

> See `interview.md`.

## Further Reading

- MDN: *Closures*
- You Don't Know JS Yet: *Scope & Closures*
- JavaScript.info: *Closures*

## AI Tutor Prompt

```
Teach me JavaScript closures. First explain with a simple analogy, then show a
counter example and the loop-trap fix, and finally quiz me with 5 questions that
test whether I understand that closures capture bindings (not values). Keep any
example ES6+ and executable.
```

## Mastery Checklist

- [ ] I can explain what a closure is in my own words.
- [ ] I can build a counter with truly private state.
- [ ] I can explain the `var` vs `let` loop difference.
- [ ] I can identify closures in React hooks / event handlers.
- [ ] I can complete the mini project and pass the quiz.
