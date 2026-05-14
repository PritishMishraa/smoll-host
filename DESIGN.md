# Designing smoll.host: turning static hosting into a 30-second flow

## Problem Statement

The original smoll.host UI worked, but it didn't feel like a 30-second flow. Every input was visible at once, error messages were generic, and success felt like an afterthought. The dashboard empty state was a single line of text. There was no moment of delight after deploying.

We redesigned the core flow to feel guided, fast, and rewarding.

---

## Before vs After

### Before

The original homepage stacked every decision on top of each other:

```
+----------------------------------------+
|  smoll.host                            |
|  host your smoll sites with ease       |
|                                        |
|  [Domain Name]                         |
|  https://[______________].pritish.in   |
|  Choose carefully. Subdomains cannot   |
|  be renamed after creation.            |
|                                        |
|  [ Drop zone - always visible ]        |
|                                        |
|  [      Create domain       ]          |
+----------------------------------------+
```

**Issues:**
- All fields visible simultaneously = cognitive overload
- Vague subtitle ("with ease" doesn't mean anything)
- No sense of progress or completion
- Error state only shows after clicking submit
- No celebration on success

### After

The redesign treats hosting as a 3-step guided flow:

```
+----------------------------------------+
|  smoll.host                            |
|  Your HTML live in 30 seconds          |
|                                        |
|  Step 1 of 3                           |
|  Pick a subdomain                      |
|  https://[______________].pritish.in   |
|  [Continue →]                          |
|                                        |
|  ────────  or  ────────                |
|  Already hosting? View your domains    |
+----------------------------------------+
```

```
+----------------------------------------+
|  Step 2 of 3                           |
|  Upload your HTML file                 |
|                                        |
|  [        Drop HTML here or click      |
|              to browse               ] |
|                                        |
|  ← Back          [Continue →]        |
+----------------------------------------+
```

```
+----------------------------------------+
|  Step 3 of 3                           |
|  Deploying...                          |
|                                        |
|  [==========>          ] 50%          |
|  Uploading to S3...                    |
|                                        |
+----------------------------------------+
```

```
+----------------------------------------+
|  You're live!                          |
|                                        |
|  https://my-site.pritish.in            |
|  [Open site]  [Copy link]              |
|                                        |
|  [Deploy another]                      |
+----------------------------------------+
```

---

## State-by-State Breakdown

### 1. Empty State (Dashboard)

**Before:**
```
Your domains
Domains                              [Refresh]

+----------------------------------------+
| No domains yet.                        |
+----------------------------------------+
```

**After:**
```
Your domains

+----------------------------------------+
|                                        |
|           [illustration]               |
|         No sites yet                   |
|    Claim a subdomain and upload        |
|    an HTML file to get started.        |
|                                        |
|       [Create your first site]         |
|                                        |
+----------------------------------------+
```

**Changes:**
- **Hierarchy:** Removed the redundant "Domains" heading next to "Your domains". Replaced with a single clear section title.
- **Copy:** "No domains yet" became "No sites yet" (more human). Added a sentence explaining *how* to get started, not just stating the absence.
- **Spacing:** Increased padding from `py-8` to `py-12` so the empty state breathes and doesn't feel like a broken table.
- **Friction:** Added a direct CTA button that scrolls to the creation form, removing the need to hunt for where to start.

**Why:** Empty states are onboarding moments. A dead-end sentence makes users think the product is broken. A warm explanation with a clear next step turns an empty state into a conversion surface.

---

### 2. Domain Creation State

**Before:**
- Domain input and file upload were always visible together
- Validation only happened after blur or debounce, leaving users uncertain
- The CTA said "Create domain" even when no file was selected
- No inline progress indication during name checking

**After:**
- Step 1 isolates subdomain selection. The input is the hero.
- As you type, a live checkmark or warning appears instantly (debounced to 300ms to feel responsive but not noisy).
- The CTA is disabled until a valid, available name is entered.
- Clear microcopy below: "Letters, numbers, and hyphens only. 3–30 characters."

**Changes:**
- **Hierarchy:** Separated domain naming from file upload into distinct steps. This reduces the number of visible decisions from 3 to 1.
- **Copy:** "Enter your domain name" became "What should we call it?" — conversational and action-oriented. Replaced the intimidating "Choose carefully. Subdomains cannot be renamed" with gentler inline validation.
- **Spacing:** Increased vertical padding on the focused step. Reduced opacity on inactive steps so the eye is drawn to the active decision.
- **Friction:** Auto-validates as you type so you never reach Step 2 with a bad name. Removed the separate "Sign in to create" banner — the CTA itself adapts: unsigned users see "Sign in with GitHub to continue".

**Why:** Hick's Law — every extra visible option increases decision time. By sequencing the flow, we turned a form into a conversation. The user always knows exactly what to do next.

---

### 3. Upload Flow

**Before:**
- Dropzone was permanently visible under the domain input
- Success/error only communicated via toast notifications
- After upload, the page reset abruptly with no confirmation of what just happened

**After:**
- Step 2 reveals the dropzone only after a valid domain is chosen
- The dropzone shows file metadata (name, size) immediately on selection
- Upload progress is shown inline with a progress bar, not just a toast
- On completion, the view transitions smoothly to the success state

**Changes:**
- **Hierarchy:** The dropzone is now the sole focal point of Step 2. Nothing else competes for attention.
- **Copy:** "Drag a HTML file here, or click to select it" became "Drop your HTML file here". Shorter, more direct. Added file constraints as helper text below, not inside the dropzone.
- **Spacing:** Gave the dropzone more vertical space (h-64 vs h-52) so it feels substantial and easier to hit.
- **Friction:** Auto-advances to Step 3 on file drop if the file is valid, skipping an explicit "continue" click for power users. The explicit button remains for accessibility.

**Why:** Progressive disclosure keeps the UI light. Showing the upload zone only when relevant respects the user's attention. Auto-advance removes a click for the happy path while preserving control.

---

### 4. Loading State

**Before:**
- Button spinner only. No sense of *what* was happening.
- Background processes (S3 upload, DB write, cache invalidation) were invisible.

**After:**
```
+----------------------------------------+
|  Deploying your site...                |
|                                        |
|  [████████████████░░░░░░]              |
|                                        |
|  Validating subdomain...   ✓           |
|  Uploading to S3...        ✓           |
|  Saving to database...     ⟳           |
|  Purging cache...                      |
|                                        |
+----------------------------------------+
```

**Changes:**
- **Hierarchy:** Replaced the simple button spinner with a full-screen(ish) overlay showing a progress bar and a checklist of operations.
- **Copy:** Each step has a human label: "Uploading to S3" not "POST /api/domains".
- **Spacing:** Centered vertically with generous padding so the user isn't distracted by the underlying form.
- **Friction:** Added an estimated time hint: "This usually takes about 5 seconds." This reduces anxiety during the wait.

**Why:** Uncertain waits feel longer than known waits. A checklist with visible progress transforms anxiety into anticipation. Users tolerate waiting if they can see work being done.

---

### 5. Error State

**Before:**
- Generic toasts: "Error uploading files: [message]"
- Domain taken error appeared as red text under the input, but only after typing stopped
- No guidance on *how* to fix the error

**After:**
- Domain input shows inline errors with suggestions:
  - "That name is taken. Try `my-site-2` or `my-site-dev`."
  - "Names can only contain letters, numbers, and hyphens."
  - "Too short — minimum 3 characters."
- File upload errors are shown inside the dropzone, not as a disappearing toast:
  - "File too large (24 MB). Max is 16 MB."
  - "We only accept .html and .htm files."
- Network errors show a retry button directly in the UI.

**Changes:**
- **Hierarchy:** Errors are co-located with their source. No more scanning the screen for a toast that disappeared.
- **Copy:** Every error message now includes *what* went wrong and *how* to fix it.
- **Spacing:** Error messages have `mt-2` and `text-sm` with a subtle red background pill so they don't feel like screaming text.
- **Friction:** Suggesting alternative names for taken domains removes the creative dead-end. Users don't have to think of a new name from scratch.

**Why:** Error messages are the most important copy in your product. A bad error message stops the user. A good error message guides them forward.

---

### 6. Deployed-Success State

**Before:**
- Toast: "Domain created and file uploaded!"
- Form reset to empty. The user had to manually navigate to their new site.
- The new domain appeared in the dashboard list below, but only after a refresh.

**After:**
```
+----------------------------------------+
|           🎉                           |
|     Your site is live!                 |
|                                        |
|  https://my-site.pritish.in            |
|  [Copy link]  [Open in new tab]        |
|                                        |
|  Created just now · 1 HTML file          |
|                                        |
|  [Deploy another site]                 |
+----------------------------------------+
```

**Changes:**
- **Hierarchy:** Replaced the form entirely with a success card. The form is gone; the result is the UI.
- **Copy:** "Domain created and file uploaded" became "Your site is live!" — outcome-focused, not process-focused.
- **Spacing:** Large emoji/icon, generous padding, and a prominent URL make this feel like a celebration, not a system log.
- **Friction:** One-click copy and open actions. The dashboard list auto-refreshes in the background so the new site is already there if the user scrolls down.

**Why:** Success states are retention moments. If the end of a flow feels good, users come back. We turned a transactional toast into a moment of delight.

---

## Summary of Principles Applied

| Principle | How we applied it |
|-----------|-----------------|
| **Progressive Disclosure** | Only show the next step when the previous one is valid |
| **Hick's Law** | One decision per step instead of three simultaneous fields |
| **Co-located Feedback** | Errors and success messages appear at their source |
| **Reducing Cognitive Load** | Conversational copy, clear step indicators, disabled CTAs until ready |
| **Delight in Completion** | Animated success state with one-click actions |
| **Uncertain Wait → Known Wait** | Checklist loading state with human-readable step names |

---

## Files Changed

- `app/page.tsx` — Updated hero copy and layout
- `components/domain-input.tsx` — Rebuilt as 3-step wizard with state machine
- `components/file-uploader.tsx` — Added selected-file preview, inline errors
- `components/domain-dashboard.tsx` — Redesigned empty state, auto-refresh on new domain
- `components/deploy-success.tsx` *(new)* — Success celebration card
- `components/deploy-loading.tsx` *(new)* — Checklist-style loading overlay
