# Decisions — VAT Margin Calculator

Settled, closed questions for this repo. Check here before proposing to
change, redo, or re-open something; update this file in the same session a
decision is settled or reversed.

Status values: **Active** · **Superseded** · **Historical**.

---

## Dependency-free by default — Active

Keep the app dependency-free unless the user explicitly asks otherwise.
It's a small static calculator (`index.html`/`styles.css`/`app.js`) — don't
introduce a build step or framework without being asked.
