---
inclusion: manual
---

# Writing Implementation Plans

## Core Principle
Plans must be clear enough for an enthusiastic junior engineer with no project context to follow. Vague plans produce vague results.

## When to Write a Plan
- Before implementing any feature with 3+ files changed
- Before any architectural change
- When the user says "plan this" or "let's plan"

## Plan Structure

### 1. Goal Statement
One sentence: what does this accomplish for the user?

### 2. Scope
- What IS included
- What is NOT included (explicit boundaries prevent scope creep)

### 3. Tasks (bite-sized, 2-5 min each)
Each task must have:
- Exact file path(s) to change
- What to add/change/remove (specific, not vague)
- Verification step — how to confirm it worked

### 4. Test Plan
- What tests need to pass
- What new tests to write
- How to run them

### 5. Rollback Plan
- How to undo if something goes wrong

## Rules
- No task should be "refactor X" — break it into specific changes
- Every task must be independently verifiable
- List dependencies between tasks explicitly
- If a task requires understanding context, provide that context inline
- YAGNI — don't plan features not asked for
- DRY — don't plan duplicate implementations

## Present Plans in Chunks
Show the plan in sections, get confirmation before proceeding to implementation.
