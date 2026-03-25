# Agent-Forge Deployer Sidecar

Agent-Forge deploy parity uses a localhost sidecar on `127.0.0.1:3102`.

Endpoints:
- `GET /status` — current deploy/service status
- `GET /commits` — update check / incoming commits
- `GET /history` — deploy history
- `GET /logs` — SSE log stream
- `POST /deploy` — run deploy
- `POST /rollback` — rollback to a commit

Systemd user service:
- `openclaw-agent-forge-deployer.service`

Primary app service:
- `openclaw-agent-forge.service`
