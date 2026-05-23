---
inclusion: manual
---

# Local Code Review

When asked to review local changes or "review my code before commit", follow this process:

## Step 1: Check what changed
Run `git status` and `git diff` to see all staged and unstaged changes. If nothing changed, stop and inform the user.

## Step 2: Review across 5 dimensions

For all changed files, check:

### a) Bugs & Logic Errors
- Null/undefined issues
- Off-by-one errors
- Race conditions
- Resource leaks
- Error handling gaps
- Edge cases not handled

### b) Security (OWASP Top 10)
- Injection flaws (SQL, command, etc.)
- XSS vulnerabilities
- Auth bypass
- Sensitive data exposure
- Insecure dependencies
- Missing input validation

### c) TypeScript & Code Quality
- Type safety issues
- Missing return types on exported functions
- `any` types where avoidable
- Performance problems (N+1 queries, unnecessary re-renders)

### d) Code Clarity
- Unnecessary complexity or nesting
- Redundant code
- Unclear variable/function names
- Nested ternaries (prefer if/else or switch)
- Overly compact one-liners that hurt readability

### e) Project Standards (LegalFlow specific)
- API routes must have rate limiting + auth check
- No secrets or API keys in code
- Server-only code not imported by client components
- Supabase queries use service role key on server, anon key on client

## Step 3: Filter false positives
Only report issues that are:
- Introduced in the current changes (not pre-existing)
- Real issues a senior engineer would flag
- Not already caught by TypeScript/linter

## Step 4: Present results grouped by severity

**Critical** — Must fix before committing (security issues, data loss bugs, auth bypass)

**Warning** — Should fix (logic errors, type issues, missing error handling)

**Suggestion** — Consider fixing (clarity, simplification, style)

If no issues found: confirm "Code looks good for commit."

## Format
For each issue include:
- File path and line number
- Brief description
- Why it matters
- Suggested fix with code snippet
