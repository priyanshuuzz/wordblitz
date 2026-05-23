---
inclusion: manual
---

# Requesting Code Review

## Before Asking for Review — Pre-Review Checklist

Run through this BEFORE presenting code for review:

### 1. Self-Review
- [ ] Read every line of the diff — no "I think this is right"
- [ ] No debug code, console.logs, or TODOs left in
- [ ] No commented-out code unless intentional with explanation
- [ ] Variable/function names are clear and descriptive

### 2. Tests
- [ ] New code has tests
- [ ] All existing tests still pass (run them, don't assume)
- [ ] Edge cases are covered

### 3. Types & Lint
- [ ] No TypeScript errors
- [ ] No lint warnings

### 4. Security
- [ ] No secrets or API keys in code
- [ ] User input is validated
- [ ] No SQL injection / XSS vectors

### 5. Performance
- [ ] No N+1 queries introduced
- [ ] No unnecessary re-renders
- [ ] No blocking operations on the main thread

## What to Include in Review Request
- What the change does (one sentence)
- Why it was done this way (if non-obvious)
- What you're uncertain about
- Any known tradeoffs

## Red Flags That Block Review
- Tests not passing
- TypeScript errors present
- Secrets in diff
- "I'll clean this up later"
