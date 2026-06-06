---
target: src/components/Navbar.tsx
total_score: 38
p0_count: 0
p1_count: 1
timestamp: 2026-06-06T10-32-51Z
slug: src-components-navbar-tsx
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Wallet connection status cleanly indicated. |
| 2 | Match System / Real World | 4 | Familiar "Profile" and "Disconnect" terminology. |
| 3 | User Control and Freedom | 4 | Clear wallet disconnect control. |
| 4 | Consistency and Standards | 2 | Wallet dropdown uses JS hover events (`onMouseEnter`) and hardcoded colors. |
| 5 | Error Prevention | 4 | N/A |
| 6 | Recognition Rather Than Recall | 4 | Simple, recognizable navigation links. |
| 7 | Flexibility and Efficiency | 4 | Fast, accessible dropdown menu. |
| 8 | Aesthetic and Minimalist Design | 4 | Clean, well-spaced header component. |
| 9 | Error Recovery | 4 | N/A |
| 10 | Help and Documentation | 4 | N/A |
| **Total** | | **38/40** | **Great component, but messy styles** |

#### Anti-Patterns Verdict

**LLM assessment**: The `Navbar` component is visually polished and highly functional. However, it contains an explicit React anti-pattern: using JavaScript `onMouseEnter` and `onMouseLeave` event handlers to simulate CSS `:hover` states for the wallet dropdown menu. This is highly discouraged as it bloats the component tree, triggers unnecessary re-renders, and defeats the purpose of the CSS engine.

#### Overall Impression
A solid core navigation component that just needs some minor CSS refactoring to be production-ready.

#### Priority Issues
- **[P1] JS-Driven Hover States**: The `Profile` link and `Disconnect` button inside the `CustomWalletButton` use React events to toggle background colors (`onMouseEnter={(e) => e.currentTarget.style.background = "#fee2e2"}`).
  - **Why it matters**: React events should not be used to replicate basic CSS functionality like `:hover`. It causes unnecessary JS execution, hurts performance, and makes the code harder to read.
  - **Fix**: Move the hover styles to `globals.css` (e.g. creating `.dropdown-item` and `.dropdown-item-danger` classes) and remove the `onMouseEnter`/`onMouseLeave` attributes entirely.
- **[P2] Hardcoded Colors**: The `CustomWalletButton` uses raw hex codes (`#f3f3f3`, `#ef4444`, `#fee2e2`) instead of the app's established CSS variables.
  - **Why it matters**: It breaks the design system and makes it impossible to implement a dark mode or theme shift later.
  - **Fix**: Replace hex codes with CSS variables (`var(--color-surface-mist)`, `var(--color-error)`, etc.).
