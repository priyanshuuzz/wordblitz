---
inclusion: always
---

# Verification Before Completion

## Core Principle
Evidence before claims, always. Claiming work is complete without verification is dishonesty, not efficiency.

## The Iron Law
```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

## The Gate Function
BEFORE claiming any status or expressing satisfaction:
1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
5. ONLY THEN: Make the claim

## Common Failures

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Build succeeds | Build command: exit 0 | Linter passing, logs look good |
| Bug fixed | Test original symptom: passes | Code changed, assumed fixed |
| Requirements met | Line-by-line checklist | Tests passing |

## Red Flags — STOP
- Using "should", "probably", "seems to"
- Expressing satisfaction before verification
- Trusting previous run results
- Relying on partial verification
- ANY wording implying success without having run verification

## Key Patterns
```
✅ [Run test command] → [See: all pass] → "Tests pass"
❌ "Should pass now" / "Looks correct"

✅ [Run build] → [See: exit 0] → "Build succeeds"
❌ "Linter passed" (linter ≠ compiler)
```
