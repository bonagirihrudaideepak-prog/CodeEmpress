// Objective: Stateful closure — a counter with truly private internal state.
// Guide §6: source, line-by-line, expected output, complexity, pitfalls.

// 'count' lives in the closure of createCounter and is unreachable from outside.
function createCounter(start = 0) {
  let count = start;

  return {
    increment: () => ++count, // closes over 'count' (read + write)
    decrement: () => --count,
    getValue: () => count, // read-only outside view
  };
}

const c = createCounter();
c.increment(); // 1
c.increment(); // 2
c.decrement(); // 1

console.log(c.getValue()); // 1
console.log("Private access:", c.count); // undefined — not exposed

// Complexity: O(1) per call. Pitfall: don't leak 'count' into the public API.
