# Exercises — JavaScript Closures in Depth

## 1. Accumulator factory

Write `createAccumulator()` that starts at `0` and returns an object with `add(n)`
and `reset()`. Prove the internal value is private: reading an arbitrary property
from outside (e.g. `acc.value`) should return `undefined`.

## 2. Closure multipliers

Write `multiply(x)` that returns a function which multiplies its argument by `x`.
Use it to create `double` and `triple`. Call `double(5)` and `triple(4)`.

## 3. Debounce

Write `debounce(fn, delay)` that returns a wrapper which only invokes `fn`
after `delay` ms of no further calls. It must remember the latest arguments and
confirm with a small `console.log` timing test.

## 4. Once-only

Write `once(fn)` returning a function that runs `fn` only the first time it is
called and ignores subsequent calls.
