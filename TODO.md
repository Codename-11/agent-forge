# Ensemble — Release Checklist

## P0 — Release Blockers

| # | Issue | Location | Status |
|---|-------|----------|--------|
| 1 | No LICENSE file | repo root | ⬜ Open |
| 2 | ~~No README.md~~ | ~~repo root~~ | ✅ Done |
| 3 | No CI/CD (.github/workflows/) | repo root | ⬜ Open |
| 4 | Open CORS * + 0.0.0.0 binding | server.ts:15-16, 35-38, 110-112 | ⬜ Open |
| 5 | No auth/rate limiting on API | server.ts | ⬜ Open |
| 6 | Hardcoded permissive agent commands (--full-auto, --dangerously-skip-permissions) | agent-spawner.ts:35-39, 58-60 | ⬜ Open |
| 7 | strict: false in tsconfig | tsconfig.json:7 | ⬜ Open |

## Known Issues / Technical Debt

| # | Issue |
|---|-------|
| 1 | No test suite — no test/lint scripts in package.json |
| 2 | JSONL persistence without file locking — race conditions with multi-process |
| 3 | ~~Undocumented ai-maestro dependency~~ → renamed to ~/.ensemble |
| 4 | execAsync with string interpolation — command injection risk in agent-runtime |
| 5 | Shell script embeds variables in inline Python — ensemble-bridge.sh:33-89 |
| 6 | Code duplication in cli/monitor.ts:100-133 (apiGet/apiPost + polling) |
| 7 | No CONTRIBUTING.md |
| 8 | No .gitignore for generated/temp files |

## P1 — Planned Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Remote Agent Join (HTTP)** | Allow external agents to join Ensemble teams via HTTP POST without being locally spawned. Inspired by AgentMeet.net's open-join model. Agents POST to a join endpoint with `agent_id`, `agent_name`, and can send/receive messages via REST. This turns Ensemble from a local dev tool into a platform that any agent can plug into remotely. |

## Recently Shipped ✅

- Projects directory scanning + settings layout + SKILL.md
- Session naming with readable auto-names
- Launch modal improvements (wider, renamed "Launch Team" → "Launch Session")
- Reopen disbanded teams with conversation context
- Auto-summary cleanup
- README.md

## P2 — Nice-to-haves

- API docs (OpenAPI/Swagger)
- Plugin/extensibility system for custom agent programs
- Persistent storage beyond JSONL (SQLite etc.)
- Improve health check endpoint (more diagnostics)
- Configurable agent timeout/retry
- Structured logging (not console.log)

## Architecture & Code Quality

**Positive:**
- Clean separation: types/ lib/ services/ cli/ scripts/ — well layered
- AgentRuntime abstraction is solid
- sanitizeName input sanitization present
- TypeScript types well defined
- MCP-based agent communication is distinctive vs competitors (previously tmux-only, now protocol-level)

**Feature Gaps vs Competitors (CrewAI/AutoGen/LangGraph/Swarm):**
- No built-in tool/function calling framework
- No memory/context sharing between agents
- No workflow graphs or DAG support
- No observability/tracing
- No structured agent-to-agent protocol standard beyond MCP + REST

## Decided

- **Repo name:** `ensemble`
- **GitHub description (SEO):** Multi-agent collaboration engine for real-time team orchestration
- **README hero tagline:** Multi-agent collaboration engine — AI agents that work as one
- **License:** MIT (TBD)
- **Position as:** "experimental developer tool", not "production framework"

## Features to borrow from other frameworks

| From | Feature |
|------|---------|
| CrewAI | Role definitions with goals, task decomposition, HITL |
| LangGraph | Checkpointing, state machines, conditional routing |
| AutoGen | Structured conversation patterns, sandboxing |
| Swarm | Handoff pattern, shared context variables, routines |
