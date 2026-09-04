// Objective: Demonstrate the loop-variable closure trap and the let fix.
// Guide §6: source + expected output + why + improved version.

const actionsVar = [];
for (var i = 0; i < 3; i++) {
  actionsVar.push(() => console.log(i)); // all share ONE 'i' binding
}
actionsVar.forEach((fn) => fn()); // 3 3 3

const actionsLet = [];
for (let i = 0; i < 3; i++) {
  actionsLet.push(() => console.log(i)); // fresh 'i' each iteration
}
actionsLet.forEach((fn) => fn()); // 0 1 2

// Improved: pass the value as an argument so each closure captures its own copy.
const byArg = Array.from({ length: 3 }, (_, n) => () => console.log(n));
byArg.forEach((fn) => fn()); // 0 1 2
