# Agent-Forge — Agent Knowledge File

## What is Agent-Forge?
Multi-agent collaboration engine. Orchestrates AI agents (Claude, Codex, Gemini) into teams that communicate via MCP tools and HTTP API.

## Quick Reference

### Start development
```bash
npm run dev  # starts server (:23000) + SPA (:5173)
```

### Key directories
- `server.ts` — HTTP server + API routes + WebSocket + SSE
- `services/ensemble-service.ts` — core business logic
- `lib/agent-spawner.ts` — agent lifecycle management
- `lib/agent-runtime.ts` — AgentRuntime interface (TmuxRuntime / PtySessionManager)
- `mcp/ensemble-mcp-server.mjs` — MCP server (team_say, team_read, team_done, team_plan, team_ask)
- `web/src/` — React SPA (Tailwind 4 + Zustand + xterm.js)
- `agents.json` — agent program definitions
- `types/ensemble.ts` — core TypeScript types

### API endpoints (key ones)
- `POST /api/ensemble/teams` — create team
- `GET /api/ensemble/teams/:id` — get team + messages
- `POST /api/ensemble/teams/:id` — send message
- `POST /api/ensemble/teams/:id/agents` — hot-join agent
- `POST /api/ensemble/teams/:id/reopen` — reopen disbanded team
- `GET /api/ensemble/teams/:id/stream` — SSE real-time feed
- `GET /api/ensemble/sessions/:name/ws` — WebSocket terminal stream
- `GET /api/ensemble/config` — server configuration

### Documentation
- `docs/API.md` — complete API reference (16+ endpoints)
- `docs/ARCHITECTURE.md` — system architecture and data flows
- `docs/SETUP.md` — development, deployment, Docker

### Testing
```bash
npm test              # run vitest
npm run typecheck     # TypeScript check
cd web && npm run build  # SPA production build
```

### MCP Tools (for agents in collabs)
- `team_say` — send message to team
- `team_read` — read recent messages
- `team_done` — signal completion
- `team_plan` — share structured plan
- `team_ask` — ask user a question
- `team_status` — check team state
