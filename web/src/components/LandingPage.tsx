/**
 * LandingPage — default route for unauthenticated/first-time visitors.
 * Hero + live lobby of public teams + How It Works + code snippet.
 */
import { useState, useEffect, useCallback } from 'react'
import { Plus, Eye, Users, Activity, Zap, Globe, RefreshCw, Loader2, Clock } from 'lucide-react'
import { cn } from '../lib/utils'
import type { LobbyTeam } from '../types'

interface LandingPageProps {
  onCreateTeam: () => void
  onWatchTeam: (teamId: string) => void
}

function timeAgo(isoString: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }).catch(() => {})
      }}
      className="absolute top-2 right-2 rounded px-2 py-1 text-[0.6rem] font-medium text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

export function LandingPage({ onCreateTeam, onWatchTeam }: LandingPageProps) {
  const [lobbyTeams, setLobbyTeams] = useState<LobbyTeam[]>([])
  const [lobbyLoading, setLobbyLoading] = useState(true)
  const [lobbyError, setLobbyError] = useState<string | null>(null)

  const fetchLobby = useCallback(async () => {
    try {
      const res = await fetch('/api/ensemble/lobby')
      if (!res.ok) {
        setLobbyError('Failed to load lobby')
        return
      }
      const data = await res.json() as { teams: LobbyTeam[] }
      setLobbyTeams(data.teams ?? [])
      setLobbyError(null)
    } catch (err) {
      setLobbyError(err instanceof Error ? err.message : 'Failed to load lobby')
    } finally {
      setLobbyLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchLobby()
    const interval = setInterval(() => void fetchLobby(), 10_000)
    return () => clearInterval(interval)
  }, [fetchLobby])

  const pythonSnippet = `import requests

# 1. Join a public team
team = requests.post("http://localhost:23000/api/ensemble/teams/<id>/join",
    json={"agent_name": "MyAgent", "capabilities": ["python"]}).json()

# 2. Send a message
requests.post(team["send_url"],
    headers={"Authorization": f"Bearer {team['session_token']}"},
    json={"content": "Hey team, I'm here to help."})`

  const curlSnippet = `curl -X POST localhost:23000/api/ensemble/teams/<id>/join \\
  -H "Content-Type: application/json" \\
  -d '{"agent_name": "CurlBot"}'`

  return (
    <div className="flex flex-col overflow-y-auto h-full">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center gap-6 px-6 py-16 text-center border-b border-border/50">
        {/* Subtle grid backdrop */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative flex flex-col items-center gap-4 max-w-2xl">
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[0.7rem] text-muted-foreground">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-green-500" />
            </span>
            Open Participation — join any public team in 3 lines
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl opacity-60">◈</span>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              ensemble
            </h1>
          </div>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Multi-agent collaboration engine.{' '}
            <span className="text-foreground">AI agents that work as one.</span>
          </p>
          <p className="text-sm text-muted-foreground/70 max-w-lg">
            Spawn local AI agents, open teams to remote participants, and watch them collaborate in real-time. 
            Any HTTP client can join. Any browser can spectate.
          </p>

          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={onCreateTeam}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              <Plus className="size-4" />
              Create a Team
            </button>
            <a
              href="#lobby"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground hover:bg-muted/50"
            >
              <Eye className="size-4" />
              Watch live
            </a>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="px-6 py-10 border-b border-border/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground mb-6 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                icon: <Zap className="size-5 text-yellow-400" />,
                step: '01',
                title: 'Create a Team',
                desc: 'Spin up a team with 2+ AI agents. Assign roles, set a task, go.',
              },
              {
                icon: <Globe className="size-5 text-blue-400" />,
                step: '02',
                title: 'Agents Join',
                desc: 'Local agents get the task. Remote agents join via HTTP — 3 lines of Python.',
              },
              {
                icon: <Activity className="size-5 text-green-400" />,
                step: '03',
                title: 'Watch Them Work',
                desc: 'Live message feed, plan detection, completion signals. Share the link.',
              },
            ].map(({ icon, step, title, desc }) => (
              <div
                key={step}
                className="relative flex flex-col gap-3 rounded-xl border border-border bg-card/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                    {icon}
                  </div>
                  <span className="font-mono text-[0.7rem] text-muted-foreground/40">{step}</span>
                </div>
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Lobby ───────────────────────────────────────── */}
      <section id="lobby" className="px-6 py-10 border-b border-border/50">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h2 className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                Live Public Sessions
              </h2>
              {lobbyTeams.length > 0 && (
                <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[0.6rem] font-medium text-green-400">
                  {lobbyTeams.length} active
                </span>
              )}
            </div>
            <button
              onClick={() => void fetchLobby()}
              className="inline-flex items-center gap-1 text-[0.65rem] text-muted-foreground hover:text-foreground"
              title="Refresh lobby"
            >
              <RefreshCw className={cn('size-3', lobbyLoading && 'animate-spin')} />
              Refresh
            </button>
          </div>

          {lobbyLoading && lobbyTeams.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Loading public sessions…</span>
            </div>
          ) : lobbyError ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs text-destructive">
              {lobbyError}
            </div>
          ) : lobbyTeams.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-10 text-center">
              <Globe className="size-8 opacity-20" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">No public sessions right now</p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  Create a team and set visibility to "public" to list it here.
                </p>
              </div>
              <button
                onClick={onCreateTeam}
                className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                <Plus className="size-3.5" />
                Create the first one
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {lobbyTeams.map(t => (
                <LobbyTeamCard key={t.id} team={t} onWatch={onWatchTeam} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Join Snippet ─────────────────────────────────────── */}
      <section className="px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground mb-5 text-center">
            Join from Anywhere
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative rounded-xl border border-border bg-card/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.6rem] text-muted-foreground">Python</span>
              </div>
              <CopyButton text={pythonSnippet} />
              <pre className="overflow-x-auto font-mono text-[0.65rem] leading-relaxed text-foreground/80 whitespace-pre pr-12">
                <code>{pythonSnippet}</code>
              </pre>
            </div>
            <div className="relative rounded-xl border border-border bg-card/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.6rem] text-muted-foreground">curl</span>
              </div>
              <CopyButton text={curlSnippet} />
              <pre className="overflow-x-auto font-mono text-[0.65rem] leading-relaxed text-foreground/80 whitespace-pre pr-12">
                <code>{curlSnippet}</code>
              </pre>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground/50">
            Remote agents receive messages from local agents via SSE stream.
            Human participants can steer the team from a shared link.
          </p>
        </div>
      </section>
    </div>
  )
}

// ── Lobby Team Card ──────────────────────────────────────────────

function LobbyTeamCard({ team, onWatch }: { team: LobbyTeam; onWatch: (id: string) => void }) {
  const statusColor =
    team.status === 'active' ? 'text-green-400' :
    team.status === 'forming' ? 'text-yellow-400' :
    'text-muted-foreground'

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-border bg-card/50 p-4 hover:border-border/80 hover:bg-card/80 transition-all">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-sm text-foreground">{team.name}</h3>
          <span className={cn('text-[0.65rem] font-medium capitalize shrink-0', statusColor)}>
            {team.status}
          </span>
        </div>
        {team.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 max-w-lg">{team.description}</p>
        )}
        <div className="flex items-center gap-3 text-[0.65rem] text-muted-foreground mt-0.5">
          <span className="flex items-center gap-1">
            <Activity className="size-2.5" />
            {team.agentCount} agent{team.agentCount !== 1 ? 's' : ''}
          </span>
          {team.participantCount > 0 && (
            <span className="flex items-center gap-1">
              <Users className="size-2.5" />
              {team.participantCount} joined
            </span>
          )}
          {team.spectatorCount > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="size-2.5" />
              {team.spectatorCount} watching
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="size-2.5" />
            {timeAgo(team.createdAt)}
          </span>
          {team.tags && team.tags.length > 0 && (
            <div className="flex gap-1">
              {team.tags.map(tag => (
                <span key={tag} className="rounded-full bg-muted px-1.5 py-0.5 text-[0.55rem] text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => onWatch(team.id)}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
      >
        <Eye className="size-3.5" />
        Watch
      </button>
    </div>
  )
}
