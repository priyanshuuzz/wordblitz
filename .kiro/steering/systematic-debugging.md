---
inclusion: always
---

# Systematic Debugging

## Core Principle
ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

## The Iron Law
```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

## The Four Phases

### Phase 1: Root Cause Investigation
BEFORE attempting ANY fix:
1. Read error messages carefully — don't skip stack traces
2. Reproduce consistently — can you trigger it reliably?
3. Check recent changes — git diff, new dependencies, config changes
4. In multi-component systems — add diagnostic instrumentation at each boundary to find WHERE it breaks
5. Trace data flow — where does the bad value originate? Keep tracing up until you find the source

### Phase 2: Pattern Analysis
1. Find working examples of similar code in the same codebase
2. Compare against references — read completely, don't skim
3. Identify every difference, however small
4. Understand all dependencies and assumptions

### Phase 3: Hypothesis and Testing
1. Form ONE clear hypothesis: "I think X is the root cause because Y"
2. Make the SMALLEST possible change to test it — one variable at a time
3. Verify before continuing — if it didn't work, form a NEW hypothesis
4. Never add more fixes on top of failed fixes

### Phase 4: Implementation
1. Create a failing test case first
2. Implement ONE fix addressing the root cause
3. Verify the fix — tests pass, no regressions
4. If 3+ fixes have failed: STOP and question the architecture

## Red Flags — STOP and Return to Phase 1
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "It's probably X, let me fix that"
- Proposing solutions before tracing data flow
- "One more fix attempt" after already trying 2+
- Each fix reveals a new problem in a different place

## If 3+ Fixes Failed
Question the architecture — this is not a symptom problem, it's a structural problem. Discuss before attempting more fixes.
