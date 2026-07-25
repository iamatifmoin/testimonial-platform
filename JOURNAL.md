# JOURNAL.md - Decision Journal

## 1. Prioritization

I followed the same priority order as given in the assignment doc because the doc mentions "Pick what matters most, build that well, and submit whatever is done".

This was the order-

1. Core submit-review-publish flow: submission form, backend endpoints,
   moderation actions, and public wall.
2. UX improvement: validation, loading states, empty states, duplicate
   detection, and dashboard pagination.
3. Widget + AI feature: embeddable widget, demo page, and optional sentiment
   enrichment.

I skipped the following as the assignment doc explicitly specifies that "Time spent here is time wasted".

Deliberate cuts made-

- No authentication for the dashboard.
- No multi-tenant business model.
- No email notifications.
- No hosted media layer; uploaded photos are stored on local disk.

## 2. Key decisions

- **Decision:** Keep the backend very thin and use Supabase through REST instead of adding a full ORM or a local database.
  **Options:** SQLite, Prisma + Postgres, raw SQL against a self-managed database, or Supabase.
  **Why:** The data model here is tiny. I mostly needed reliable persistence for testimonials plus simple filtering and updates. Supabase let me keep the backend focused on validation, uploads, and workflow instead of spending time on schema tooling and migrations.

- **Decision:** Make the widget a plain script-tag embed with Shadow DOM.
  **Options:** iframe embed, Web Component with a bigger API surface, or a React-based widget.
  **Why:** I wanted the easiest possible copy-paste embed. The script-tag model is simple for a host page, and Shadow DOM gives enough style isolation without forcing a separate hosted iframe shell.

- **Decision:** Treat sentiment analysis as optional background enrichment, not part of the success path.
  **Options:** block submission until Gemini responds, remove AI entirely, or run it asynchronously after save.
  **Why:** The submission form should succeed even if Gemini is slow, unavailable, or not configured. The sentiment badge is useful in the dashboard, but it is not important enough to hold up the actual testimonial submission.

- **Decision:** Store uploaded photos on local disk for now.
  **Options:** S3, Cloudinary, Supabase Storage, or local disk.
  **Why:** For this assignment, local disk is the fastest path that actually works end to end. It keeps setup small and makes the upload flow easy to reason about. The tradeoff is obvious: it is not durable enough for a real production deployment.

- **Decision:** Split the browsing UX between operational pagination in the dashboard and lighter discovery on the wall.
  **Options:** paginate both, infinite scroll both, or keep them different.
  **Why:** The dashboard is an admin surface, so explicit page controls make sense there. The wall is more of a showcase surface, so "Load more" and rating filters felt better than a stricter admin-style paginator.

- **Decision:** Add duplicate detection, but keep it intentionally lightweight.
  **Options:** no duplicate protection, exact full-text match only, fuzzy search, or a small heuristic.
  **Why:** I did not want to over-engineer this. The current check of email plus normalized text preview is enough to catch the obvious "same person submitted the same thing again" case without introducing search infrastructure or more dependencies.

## 3. Working with AI agents

- **Tools and models used:** I used Codex heavily for implementation, codebase cleanup, and repo-aware edits. I also used Claude for thinking through tradeoffs and make product decisions. I did not use AI as an autopilot; I used it more like a fast pair programmer plus editor.

- **How I split the work:** I used the agent for repetitive implementation work, repo-grounded rewrites, and checking whether pieces lined up across backend/frontend/widget. I kept the product decisions, the prioritization, and the final calls on architecture and scope for myself. That split worked well because the repo is small enough that I could still keep the whole shape of it in my head.

- **Your agent setup:** I committed an `AGENTS.md` file mainly to pin the repo constraints so the agent would not drift into the wrong stack or invent features. The important parts were: use Supabase rather than SQLite, keep the widget framework-free, keep backend errors in a `{ error: string }` shape, and do not casually add auth just because there is a dashboard. That saved me from a lot of generic AI suggestions that would have pushed the project away from the brief.

- **Your 3-5 most important prompts:**
  - Dashboard Page Prompt- This worked because it was very detailed and mentioned exactly what features were required.

```
Context: Testimonial platform. React + Tailwind. 
API functions: getTestimonials({ status, page, limit }), 
               updateStatus(id, status), deleteTestimonial(id).
Components: TestimonialCard, Badge, Button, Avatar, StarRating, 
            EmptyState, Spinner, Toast.

Implement src/pages/DashboardPage.jsx — the business owner's moderation view.

---

DESIGN GOAL: Functional, clean dashboard. Think Linear or Notion admin panel. 
Dense enough to show many testimonials, clear enough to act on them quickly.

No auth required (per spec). No auth gate.

---

LAYOUT:
  Page: max-w-6xl mx-auto px-4 py-8

  Header row:
    Left: "Dashboard" (text-2xl font-bold) + 
          counts badge: "X pending" in yellow-100 text-yellow-800 rounded-full
          (show 0 if none, but still show it)
    Right: nothing for now (could be filters)

  Filter tabs (below header):
    Tab strip: "All", "Pending", "Approved", "Rejected"
    Each tab is a button with count in a badge.
    Active tab: text-primary-600, border-b-2 border-primary-600
    Inactive: text-gray-500 hover:text-gray-700
    Clicking a tab filters the list.
    
    Counts per tab: show total from API for current filter 
    (or fetch counts separately with 4 calls on load).
    
    IMPLEMENTATION: Fetch counts separately for all 4 tabs once on mount 
    using Promise.all([getTestimonials({status:'pending',limit:1}), ...]). 
    Then fetch the actual list data when tab changes.

  Main list: below tabs

---

TESTIMONIAL LIST ITEMS:
  NOT a table. Use card rows instead (easier to read with long text).
  
  Each row: white bg, border-b border-gray-100, py-4 px-0 (no horizontal padding, 
  use inner container), hover:bg-gray-50, transition-colors.
  
  Row layout (flex, items-start, gap-4):
  
    Column 1 — Avatar (sm, 2.5rem)
    
    Column 2 — flex-1:
      Row: name (font-semibold text-gray-900 text-sm) + company (text-gray-500 
           text-sm ml-2) + StarRating (sm, read-only) inline
      Below: testimonial text (text-gray-600 text-sm, line-clamp-2)
      Below: date (text-xs text-gray-400) + email (text-xs text-gray-400 ml-3)
      If sentiment tag exists: small pill below text 
        positive → green, negative → red, neutral → gray (text-xs rounded-full px-2)
    
    Column 3 — status badge (Badge component, flex-shrink-0)
    
    Column 4 — action buttons (flex gap-2, flex-shrink-0):
      If status === 'pending':
        "Approve" button (variant='primary' size='sm')
        "Reject"  button (variant='danger'  size='sm')
      If status === 'approved':
        "Reject" button (variant='secondary' size='sm')
      If status === 'rejected':
        "Approve" button (variant='secondary' size='sm')
      
      Always: Delete button (variant='ghost' size='sm', icon: 🗑 or ×)
        Show a confirm: window.confirm('Delete this testimonial?') before deleting.

---

OPTIMISTIC UPDATES:
  When approve/reject is clicked:
    1. Immediately update the local state to reflect new status.
    2. Call updateStatus(id, status) in background.
    3. If API fails: revert local state + show error toast.
    4. Show success toast: "Testimonial approved" / "Testimonial rejected"
  
  When delete is clicked:
    1. Immediately remove from local list.
    2. Call deleteTestimonial(id).
    3. If fails: refetch + show error toast.
    4. Update counts.

---

PAGINATION:
  Show 20 per page.
  At bottom: simple prev/next buttons, "Page X of Y" text.
  Disable prev on page 1, disable next on last page.
  Only show pagination if totalPages > 1.

---

EMPTY STATE:
  Use EmptyState component.
  pending: icon="📬", title="Nothing to review", desc="New testimonials will appear here."
  approved: icon="✅", title="No approved testimonials yet"
  rejected: icon="🗑️", title="No rejected testimonials"
  all: icon="💬", title="No testimonials yet", desc="Share your submission link to get started."

---

LOADING STATE:
  While fetching: show 5 skeleton rows (gray animated pulse divs, same height 
  as real rows). Use Tailwind animate-pulse.

---

TOAST: 
  Import useToast hook. Position Toast in bottom-right of screen via a portal 
  or just render inside the page at fixed position.
  
  Show toasts for: approve success, reject success, delete success, any error.

---

Use useCallback/useMemo where appropriate to avoid unnecessary re-renders.
The status filter state should be in URL search params (useSearchParams from 
react-router-dom) so the tab persists on refresh.
```

  - Wall Page Prompt- This helped building a lightweight wall page which contains all approved testimonials.
    
```
Context: Testimonial platform. React + Tailwind.
API: getPublicTestimonials({ page, limit }) → { data, total, page, totalPages }
Components: TestimonialCard, EmptyState, Spinner.

Implement src/pages/WallPage.jsx — the public showcase of approved testimonials.

---

DESIGN GOAL: This should look like a real "testimonials" section you'd see 
on a SaaS product's marketing page. Polished, grid-based, confidence-inspiring.
Think Notion testimonials page or Vercel's social proof section.

---

LAYOUT:

Hero section (centered, py-16):
  Eyebrow text: "TESTIMONIALS" (text-xs font-semibold tracking-widest 
                 text-primary-600 uppercase)
  Heading: "Loved by our customers" (text-4xl font-bold text-gray-900, mt-2)
  Subtext: "Here's what real customers say about us." (text-gray-500 mt-3)
  
  Stats row (mt-8, flex gap-8 justify-center):
    Show aggregate stats from loaded testimonials:
      - Total count ("X+ reviews")
      - Average rating (⭐ X.X average)  
      - "X this month" (filter by current month)
    Each stat: number in font-bold text-2xl text-gray-900, 
               label in text-sm text-gray-500.
    Compute these client-side from the full loaded set.

Grid (mt-12):
  Masonry-style, 3 columns on lg, 2 on md, 1 on sm.
  Use CSS columns (column-count) for true masonry, not CSS grid.
  Gap: gap-4.
  Each item: break-inside-avoid mb-4.
  Use TestimonialCard with showStatus=false.

Rating filter (below hero, above grid):
  "Filter by rating:" label, then star buttons 1-5.
  Each button: a star icon (★) + number, rounded-full, 
               selected=primary-600 bg, unselected=gray-100.
  Also "All" button (selected by default).
  Filter client-side on loaded data.

---

PAGINATION / LOAD MORE:
  Use "Load More" pattern instead of page numbers (better UX for a wall).
  Load first 12. At bottom: "Load more" Button (variant='secondary').
  On click: fetch next page, APPEND to existing list.
  When all loaded: show "You've seen all {total} testimonials" text in 
  text-gray-400 text-sm text-center.
  Hide Load More button when on last page.

---

EMPTY STATE:
  EmptyState: icon="💬", title="No testimonials yet", 
  desc="Be the first to share your experience!"
  Include a Button → navigate('/') for "Leave a testimonial"

LOADING (initial):
  While loading first page: show a 3-column grid of 6 skeleton cards 
  (animate-pulse, same dimensions as real cards — ~180px tall placeholder divs, 
  rounded-xl bg-gray-100).

LOAD MORE loading:
  Replace button with a small Spinner while fetching next page.

---

SHARE EMBED CALLOUT (if you're the site owner, visible at top):
  A subtle info banner: light primary-50 bg, border border-primary-100, 
  rounded-xl, p-4, mb-8.
  Text: "Add this wall to your website — embed it with our widget."
  Small "Learn how →" link (opens /dashboard for now, or anchor to docs).
  Show this only if ?preview=true is in the URL OR just always show it 
  (it's harmless, helps discoverability).
  Actually: always show it with a dismiss button (sessionStorage based hide).

---

IMPLEMENTATION NOTE:
  Keep separate state for: allLoaded (all fetched items), displayed (after 
  rating filter). The rating filter is client-side on allLoaded. 
  Load more fetches from API and pushes into allLoaded.
```

  - Final Polish Prompt- This sounds simple, but it matters. This prompt added the final loading/error states and gave the product the final polish.

```
Context: All major features are implemented. This prompt adds polish and 
handles edge cases throughout the app.

Make the following improvements:

---

1. GLOBAL ERROR BOUNDARY (src/components/ErrorBoundary.jsx)
   Create a class component ErrorBoundary.
   In componentDidCatch: console.error the error.
   Render fallback UI: centered, "Something went wrong" heading, 
   error message in text-gray-500, "Reload page" button (onClick: window.location.reload()).
   
   Wrap the router in App.jsx with <ErrorBoundary>.

---

2. PAGE TRANSITIONS
   Add a simple fade-in to all pages.
   In index.css: 
     @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
     .page-enter { animation: fadeIn 0.2s ease-out; }
   Add className="page-enter" to the outermost div of SubmitPage, DashboardPage, WallPage.

---

3. SUBMIT PAGE — IMPROVED ERROR HANDLING
   In SubmitPage, the API client throws errors with message strings.
   Handle these cases explicitly:
     - If err.message includes "already exists": set a specific state 
       isDuplicate=true, render a soft yellow info box instead of red error:
       "Looks like we already have your testimonial! Thank you again. 🙏"
     - If err.message includes "required" or "Invalid": show as validation error
     - Otherwise: show generic red error box

---

4. DASHBOARD — KEYBOARD SHORTCUTS
   Add a useEffect in DashboardPage for keydown events:
   When a testimonial row is "focused" (hovering — track with onMouseEnter 
   state), pressing 'a' approves it, 'r' rejects it.
   Show tooltip on rows: "Press A to approve, R to reject" in text-xs 
   text-gray-400, only visible on hover of the row.
   Clean up event listener on unmount.

---

5. TESTIMONIAL CARD — EXPAND/COLLAPSE LONG TEXT
   Modify TestimonialCard.jsx:
   If text is longer than 200 characters, show first 200 chars + "… read more" 
   (text-primary-600 cursor-pointer text-xs).
   Toggle expanded state with useState.
   When expanded: show full text + "show less" link.
   Do this in both the WallPage card and any card displayed in dashboard.

---

6. WALL PAGE — META TAGS
   In WallPage, use useEffect to set document.title = "Testimonials — TestimonialHub"
   and add an og:description meta tag via DOM manipulation 
   (or use react-helmet if already installed — if not, just do it with 
   document.querySelector/createElement, don't add a new dependency).

---

7. SMOOTH SCROLL TO TOP ON ROUTE CHANGE
   In App.jsx, add a ScrollToTop component (useEffect + useLocation that 
   calls window.scrollTo(0, 0) on location change). Render it inside Router.

---

8. RESPONSIVE NAV
   The current navbar has logo + links inline. On mobile (< md), the nav 
   links should be hidden and replaced with a hamburger icon (☰).
   Clicking it toggles a dropdown showing the nav links vertically.
   Close on click outside or route change.

---

9. DASHBOARD COUNTS REFRESH
   After any approve/reject/delete action, re-run the counts fetch 
   (the Promise.all that populates tab counts). This keeps tab badges accurate.
   Extract the counts fetch into a fetchCounts() function and call it 
   both on mount and after any mutation.

---

10. ACCESSIBILITY BASICS
    - All interactive elements have visible focus rings (Tailwind's 
      focus-visible:ring-2 focus-visible:ring-primary-500)
    - Images have alt text
    - Form fields have associated <label htmlFor> correctly linked
    - StarRating interactive mode: role="radiogroup", each star has 
      role="radio" aria-checked aria-label="N stars"
    - Dashboard action buttons have aria-label={"Approve testimonial by " + name}
    - Toast has role="alert" aria-live="polite"
```

- **At least one time AI was wrong:** One clear miss was that the backend being implemented was Express + SQLite. That was just wrong for this repo. The actual code uses Supabase REST in the backend data layer. I noticed it after the implementation had already started. Because of hallucination, SQLite was being implemented instead of Supabase even though it was mentioned in Agents.md.

- **Something you rejected:** I threw away the parts of the AI-written docs that sounded polished but were not grounded in the repo. I would rather keep a shorter and more honest explanation than a nicer-looking one that claims things I did not build or verify.

## 4. Verification

What I used to convince myself this was working:

- I checked the full happy-path architecture across all three surfaces: submit form, moderation dashboard, and public wall.
- I verified the backend exposes the expected routes for submit, list, public list, approve/reject, delete, uploads, and widget serving.
- I checked the frontend routes and API client wiring so `/`, `/dashboard`, and `/wall` all point at the expected backend endpoints.
- I reviewed the form validation and upload handling on both sides: required fields, email validation, rating bounds, accepted image types, and 5 MB upload limit.
- I checked the duplicate submission guard so obvious resubmits from the same email do not go through.
- I verified the widget is standalone vanilla JS, uses Shadow DOM, escapes user content before injection, and reads configuration from `data-*` attributes.
- I checked that sentiment analysis is fail-safe: if Gemini is missing or fails, submission still succeeds and sentiment just stays empty.

What I have not fully proved end to end yet:

- I have not stress-tested uploads beyond the implemented file checks.
- I have not added automated tests yet, so verification is still mostly manual plus code-path inspection.

What I know is still fragile:

- Local-disk uploads are fine for the assignment but weak for real deployment.
- The dashboard is intentionally unauthenticated, which is okay only because I chose to keep scope aligned with the brief.
- The Gemini integration depends on external model availability and model names, so it is best-effort by design.
- There are a few UX/details areas I would still tighten if this were going live, especially around empty states, retry messaging, and production deployment setup.

## 5. If I had 5 more hours

1. Add lightweight route-level automated tests for the backend and a few critical UI tests for submit/review/publish.
2. Replace local-disk uploads with durable storage like Supabase Storage or S3.
3. Add some basic dashboard auth, even if it is simple password protection for a single admin.
4. Clean up production readiness details: deployment docs, environment examples, and better error/retry behavior around third-party failures.
