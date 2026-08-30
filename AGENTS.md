# AGENTS.md — VAT Margin Calculator

Small static VAT margin calculator app.

Read [DECISIONS.md](DECISIONS.md) before starting work — settled, closed
questions (dependency-free by default). Check before proposing to change
or redo something.

## Scope

- `index.html`, `styles.css`, `app.js`, and README updates for the calculator.
- This should work by opening `index.html` directly or serving the folder with a simple static server.

## MCPProxy / Tool Surfaces

- Use the MCPProxy instance local to where the agent is running. Windows normally uses `http://127.0.0.1:8080/mcp`; `khpi5` uses `http://127.0.0.1:9092` for work started on that host.
- **Tool discovery is mandatory, not optional.** Do not assume a tool exists or doesn't exist — call `retrieve_tools` on the local MCPProxy at the moment you need a capability. Use exact `server:tool` names and verify the server name before every call, especially before any write.
- MCP/Nango/Appwrite services are not normally needed for this repo.
- If browser verification is needed, prefer a simple local browser/Playwright flow against the static file or local server; for any signed-in-surface work use the sanctioned route in the section below.

## Core Rules

1. Keep the app dependency-free unless the user explicitly asks.
2. Verify VAT arithmetic with clear sample cases before reporting completion.
3. Stage only intentional files; never `git add -A`.

### Signed-in Edge Browser (Windows MCPProxy only)
For authenticated-browser tasks (signed-in sites), use the MCPProxy upstream `playwright-edge` — Microsoft's official Playwright Extension attached to the live Edge `Default` profile (`David M` / `davidm@live.co.uk`). **This route exists only on the Windows MCPProxy (`http://127.0.0.1:8080/mcp`) — khpi5 has no signed-in browser route.** Never use Edge debugging mode, port 9222, or profile clones. Canonical runbook: `C:\Users\Dave\repos\windows\mcpproxy\signed-in-edge-automation.md`; prove health with `Test-SignedInEdgeAutomation.ps1 -RequireLiveProof` before first use (operational, full gate + authenticated identity readback verified 2026-08-30).

