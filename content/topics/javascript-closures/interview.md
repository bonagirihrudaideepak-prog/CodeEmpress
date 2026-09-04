# JavaScript Closures in Depth — Interview Questions

## Q1. What is a closure? Give a real-world example.

**Model answer:** A closure is a function plus the lexical scope it was created
in — it can access outer variables even after the outer function returns.
Example:

```js
function counter() {
  let n = 0;
  return () => ++n;
}
```

Each call to `counter()` returns a function that remembers its own `n`,
enabling private, per-instance state.

## Q2. Why does the classic loop-with-closures problem happen, and how do you fix it?

**Model answer:** The loop variable is shared. With `var` every closure captures
the same function-scoped binding, which is the loop's final value. Fix: use
`let` (a fresh binding per iteration) or capture the value by passing it as an
argument.

## Q3. What are the downsides of closures?

**Model answer:** They keep their enclosing scope alive, so long-lived closures
can cause memory retention. Creating many in hot paths adds allocation cost.
Arrow functions also capture `this` lexically, which surprises people in
object methods. Mitigate by keeping closures small and cleaning up listeners.
