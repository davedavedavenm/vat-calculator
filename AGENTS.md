# AGENTS.md — VAT Margin Calculator

Small static VAT margin calculator app.

## Scope

- `index.html`, `styles.css`, `app.js`, and README updates for the calculator.
- This should work by opening `index.html` directly or serving the folder with a simple static server.

## MCPProxy / Tool Surfaces

- Use the MCPProxy instance local to where the agent is running. Windows normally uses `http://127.0.0.1:8080/mcp`; `khpi5` uses `http://127.0.0.1:9092` for work started on that host.
- MCP/Nango/Appwrite services are not normally needed for this repo.
- If browser verification is needed, use a local browser/Playwright flow against the static file or local server.

## Core Rules

1. Keep the app dependency-free unless the user explicitly asks.
2. Verify VAT arithmetic with clear sample cases before reporting completion.
3. Stage only intentional files; never `git add -A`.

