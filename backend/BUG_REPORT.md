# RollScape Bug Report

Generated: 2025-11-22 20:52:31

**Total Bugs Found:** 3

## Medium Priority

### BUG-010: POST /api/campaigns

**Severity:** Medium

**Expected:** 422 Validation Error

**Actual:** Got: No response

**Steps to Reproduce:**
1. 1. POST /api/campaigns with only name field

**Impact:** Validation not enforcing required fields

---

### BUG-018: POST /api/campaigns

**Severity:** Medium

**Expected:** Name length validation

**Actual:** Accepted 10k character name

**Steps to Reproduce:**
1. 1. POST campaign with 10k char name

**Impact:** Database bloat, DoS potential

**Suggested Fix:** Add max length validation to schemas

---

## Low Priority

### BUG-007: GET /api/users/{invalid-id}

**Severity:** Low

**Expected:** 404 or 422 error

**Actual:** Got: No response

**Steps to Reproduce:**
1. 1. GET /api/users/invalid-uuid

**Impact:** Error handling inconsistent

---

