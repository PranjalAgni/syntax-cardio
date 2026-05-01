---
name: best-solution
description: Rates a user-written JavaScript or TypeScript solution on a 1-10 scale against correctness, time complexity, space complexity, idiomatic JS/TS with modern language features, conciseness, and small wastes, then presents an ideal 10/10 reference solution optimized for readability over cleverness. Use when the user asks to rate, judge, score, grade, or review a JS/TS solution, asks for the best solution or ideal solution, or says things like "how good is this", "out of 10", or "what would score 10/10".
---

# Best Solution

Judge a JavaScript/TypeScript solution on a fixed six-part rubric, produce a single net score out of 10, then show an "ideal" reference solution that would plausibly win a popular vote on Stack Overflow — optimized for clarity over one-liner cleverness.

## When to apply

Trigger when the user asks any of:

- "rate my solution", "score this out of 10", "judge this", "grade this"
- "is this good?", "how would you rate it?"
- "what would score 10/10?", "what's the ideal solution?", "best solution for this"

Only applies to JavaScript / TypeScript. If the solution is in another language, say so in one line and stop.

## Scoring rubric

Rate each of the six dimensions 1–10 internally, then produce a single net score.

| # | Criterion | What it measures |
|---|---|---|
| 1 | Correctness | Passes the spec / tests; handles edge cases; no latent bugs |
| 2 | Time complexity | Asymptotically optimal for the problem; no accidental n² or repeat work |
| 3 | Space complexity | Uses only the auxiliary memory the problem requires |
| 4 | Idiomatic JS/TS + modern features | Uses the right built-ins (destructuring, spread, `for...of`, `Map`/`Set`, template literals, optional chaining, nullish coalescing, etc.); avoids legacy patterns when a cleaner modern equivalent exists |
| 5 | Conciseness | Says what it needs to say in as few lines as possible **without** hurting readability |
| 6 | Small wastes | No dead code, redundant operations, unused variables, unnecessary allocations, or work performed on values that are then discarded |

### How to compute the net score

- Start from 10 and deduct proportionally to how far each criterion is from perfect.
- Correctness dominates: a failing solution caps the net score at **4**, regardless of everything else.
- A latent bug (wrong per the spec but not caught by provided tests) costs 1–2 points.
- Prefer whole numbers. Allow `.5` only on a genuine boundary case.

### Score interpretation

| Score | Meaning |
|---|---|
| 10 | No realistic improvement. Would be a top-voted answer on a code review thread. |
| 8–9 | Excellent. Maybe one nit. |
| 6–7 | Solid and correct, but over-engineered or has avoidable waste. |
| 4–5 | Works but shape is wrong. Noticeable code smells or inefficiency. |
| 1–3 | Broken, algorithmically wrong, or painfully verbose. |

## Output format

Keep it tight. Do **not** produce a per-criterion table unless the user explicitly asks for one.

Produce exactly these two sections:

**Section 1 — the score:**

```
Score: X/10

Why: <2–4 sentences. Name the single biggest strength and the single biggest weakness. Reference which criterion (#1–#6) most moved the score.>
```

**Section 2 — the ideal solution:**

```
## Ideal 10/10 solution

<Inline code block. TypeScript by default; plain JS only if the user's file is .js.>

Why this scores 10: <1–2 sentences on why this shape would win a popular vote.>
```

## Rules for the "ideal" solution

The ideal solution must look like something a mid-senior engineer would upvote on first read. Concretely:

- **No clever one-liners.** A solution people can read on first pass beats a solution that saves three lines. If the idiomatic move is `s.replace(regex, '-')`, that's fine — but if the regex is non-obvious or nests several transforms, break it up.
- **No one-character variable names** except standard loop indices (`i`, `j`) or accumulators where convention is strong.
- **Modern JS/TS, no legacy ceremony:** `const`/`let` over `var`; arrow functions for callbacks; `for...of` over index loops unless the index matters; `Map`/`Set` over plain objects when keying by arbitrary values; destructuring; spread; optional chaining; nullish coalescing; template literals.
- **Early returns** over nested conditionals.
- **Meaningful names.** `result`, `pendingDash`, `counts` — not `tmp`, `x`, `arr`.
- **No hidden side effects.** Pure in, pure out (unless the problem is inherently imperative).
- **Match the user's file style** — semicolons, quote style, indentation, `export` placement.
- **Do not edit the user's file.** Show the ideal solution inline in the chat only. If the user later asks to apply it, *then* edit.
- **Do not comment the obvious.** No `// loop over string`, `// return result`.

## Workflow

1. Read the user's solution and the spec (docstring, inline tests, or problem description).
2. Mentally trace at least three inputs, including one edge case (empty input, max-size, off-by-one boundary).
3. Check for latent bugs the provided tests don't catch.
4. Compute the net score using the rubric.
5. Output in the two-section format above.
6. Stay focused on the function the user asked about. Do not volunteer refactors to unrelated code.

## Example

**User's code:**

```typescript
export function slugify(s: string): string {
  s = s.trim();
  const N = s.length;
  const ALPHANUMERIC_REGEX = /^[a-z0-9]+$/i;
  let answer = '';
  let foundNonAlphaNumeric = false;
  for (let idx = 0; idx < N; idx++) {
    const ch = s[idx].toLowerCase();
    const isAlphanumeric = ALPHANUMERIC_REGEX.test(ch);
    if (isAlphanumeric) {
      if (foundNonAlphaNumeric) {
        answer += '-';
        foundNonAlphaNumeric = false;
      }
      answer += ch;
    } else if (!foundNonAlphaNumeric) {
      foundNonAlphaNumeric = true;
    }
  }
  return answer;
}
```

**Skill output:**

Score: 7/10

Why: Correct on the provided tests and O(n) — the state machine is sound (#1, #2). Loses points mostly on #6 (redundant `trim()`, meaningless `+` quantifier in the regex, `toLowerCase()` called on chars that get discarded) and #5 (20 lines for what should be 12). Latent bug on #1: a leading non-whitespace punctuation like `',hello'` yields `'-hello'`.

## Ideal 10/10 solution

```typescript
export function slugify(s: string): string {
  let result = '';
  let pendingDash = false;
  for (const ch of s) {
    if (/[a-z0-9]/i.test(ch)) {
      if (pendingDash && result) result += '-';
      result += ch.toLowerCase();
      pendingDash = false;
    } else {
      pendingDash = true;
    }
  }
  return result;
}
```

Why this scores 10: Same linear-time state machine, but the flag name says what it does, the `&& result` guard correctly handles leading non-alnums of *any* kind (not just whitespace), and nothing is computed that gets thrown away. Reads top-to-bottom on first pass.
