---
target: src/app/profile/[address]/page.tsx
total_score: 35
p0_count: 0
p1_count: 1
timestamp: 2026-06-06T10-16-46Z
slug: src-app-profile-address-page-tsx
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Excellent use of skeleton loaders tailored to the dataset card dimensions. |
| 2 | Match System / Real World | 4 | Clear, understandable metrics like "Total Earnings" and "Member Since". |
| 3 | User Control and Freedom | 3 | Functional back button, though visually inconsistent. |
| 4 | Consistency and Standards | 3 | Back button uses inline styles instead of `.btn-ghost`. |
| 5 | Error Prevention | 3 | Displays error bounds securely. |
| 6 | Recognition Rather Than Recall | 4 | High-level metrics are immediately visible at the top of the profile. |
| 7 | Flexibility and Efficiency | 4 | Intelligently adapts UI depending on whether the visitor is the profile owner or a guest. |
| 8 | Aesthetic and Minimalist Design | 4 | Layout is pristine, maintaining the app's brutalist guidelines. |
| 9 | Error Recovery | 3 | Standard error display when datasets fail to load. |
| 10 | Help and Documentation | 3 | Self-explanatory UI. |
| **Total** | | **35/40** | **Great UX, but hides technical debt** |

#### Anti-Patterns Verdict

**LLM assessment**: The Profile page is visually flawless and functionally rich (especially the owner vs. guest view toggle). However, it exhibits a significant architectural anti-pattern under the hood: **Client-Side Over-fetching**. In `useEffect`, it fetches the entire registry of all datasets on the network just to filter them down to the 1 or 2 owned by the profile address. 

#### Overall Impression
A highly polished addition to the application that gives publishers a sense of identity and ownership. The UI is fantastic, but the data-fetching strategy is a ticking time bomb for scalability.

#### Priority Issues
- **[P1] Client-Side Over-fetching**: The page downloads the entire dataset directory to the client and filters it locally (`const userDatasets = (raw ?? []).filter(d => d.owner === address);`).
  - **Why it matters**: If there are 10,000 datasets published to Vela, this page will download massive JSON payloads just to display a profile with 0 datasets, causing severe UI lag and bandwidth waste.
  - **Fix**: Move the filtering logic to the backend API. Update `/api/datasets` to accept an `?owner=address` query parameter and perform the filtering on the server.
- **[P2] Inconsistent Back Button Styling**: The back button uses inline styles (`textDecoration: "underline"`) instead of the global `.btn-ghost` class used elsewhere.
  - **Why it matters**: Creates subtle visual inconsistencies across pages.
  - **Fix**: Apply `className="btn btn-ghost"` and remove the custom inline overrides.
