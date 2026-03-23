/**
 * SpectatorView — read-only live view of a shared/public team.
 * Connects to /api/ensemble/teams/:id/spectate SSE stream.
 * Allows upgrading to human participant via "Join as Human".
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, Radio, Users, Eye, ArrowLeft, UserPlus } from 'lucide-react'
import { cn } from '../lib/utils'
import type { EnsembleTeam, EnsembleMessage, RemoteParticipant } from '../types'
import { MessageFeed } from './MessageFeed'
import { AgentBadge } from './AgentBadge'
import { SteerInput } from './SteerInput'

interface SpectatorViewProps {
  teamId: string
  token?: string
  onBack?: () => void
}

export function SpectatorView({ teamId, token, onBack }: SpectatorViewProps) {
  const [team, setTeam] = useState<EnsembleTeam | null>(null)
  const [messages, setMessages] = useState<EnsembleMessage[]>([])
  const [participants, setParticipants] = useState<RemoteParticipant[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [spectatorCount] = useState(0)

  // Human join state
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [joinName, setJoinName] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [joinedAsHuman, setJoinedAsHuman] = useState(false)

  const esRef = useRef<EventSource | null>(null)

  // Connect SSE spectator stream
  useEffect(() => {
    const spectateUrl = token
      ? `/api/ensemble/teams/${teamId}/spectate?token=${encodeURIComponent(token)}`
      : `/api/ensemble/teams/${teamId}/spectate`

    const es = new EventSource(spectateUrl)
    esRef.current = es

    es.addEventListener('init', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as {
          team: EnsembleTeam
          messages: EnsembleMessage[]
          participants: RemoteParticipant[]
        }
        setTeam(data.team)
        setMessages(data.messages ?? [])
        setParticipants(data.participants ?? [])
        setConnected(true)
        setError(null)
      } catch { /* ignore */ }
    })

    es.addEventListener('message', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as { messages: EnsembleMessage[] }
        setMessages(prev => {
          const existing = new Set(prev.map(m => m.id))
          const news = data.messages.filter(m => !existing.has(m.id))
          return [...prev, ...news]
        })
      } catch { /* ignore */ }
    })

    es.addEventListener('join', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as { participant: RemoteParticipant }
        setParticipants(prev => [...prev.filter(p => p.participantId !== data.participant.participantId), data.participant])
      } catch { /* ignore */ }
    })

    es.addEventListener('leave', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as { participantId: string }
        setParticipants(prev => prev.map(p =>
          p.participantId === data.participantId ? { ...p, leftAt: new Date().toISOString() } : p
        ))
      } catch { /* ignore */ }
    })

    es.addEventListener('disbanded', () => {
      setConnected(false)
      es.close()
    })

    es.addEventListener('error', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as { error: string }
        setError(data.error)
      } catch { /* ignore */ }
    })

    es.onerror = () => {
      setConnected(false)
      setError('Connection lost — reconnecting…')
    }

    return () => {
      es.close()
      esRef.current = null
    }
  }, [teamId, token])

  const handleJoinAsHuman = useCallback(async () => {
    if (!joinName.trim()) return
    setJoining(true)
    setJoinError(null)
    try {
      const body: Record<string, unknown> = { agent_name: joinName.trim() }
      if (token) body.auth_token = token
      const res = await fetch(`/api/ensemble/teams/${teamId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setJoinError(data.error ?? 'Failed to join')
        return
      }
      setSessionToken(data.session_token)
      setParticipantId(data.participant_id)
      setJoinedAsHuman(true)
      setShowJoinForm(false)
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join')
    } finally {
      setJoining(false)
    }
  }, [teamId, token, joinName])

  const handleSendMessage = useCallback(async (content: string) => {
    if (!sessionToken) return
    await fetch(`/api/ensemble/teams/${teamId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ content, to: 'team' }),
    })
  }, [teamId, sessionToken])

  // Determine status color
  const statusColor = team?.status === 'active' ? 'text-green-400' :
    team?.status === 'forming' ? 'text-yellow-400' :
    team?.status === 'disbanded' ? 'text-red-400' : 'text-muted-foreground'

  if (error && !team) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
        <div className="text-4xl">🔒</div>
        <p className="text-sm font-medium text-destructive">{error}</p>
        {onBack && (
          <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground">
            ← Go back
          </button>
        )}
      </div>
    )
  }

  if (!team) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <span className="text-sm">Connecting to team…</span>
      </div>
    )
  }

  const activeParticipants = participants.filter(p => !p.leftAt)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
          </button>
        )}

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm opacity-40">◈</span>
          <h1 className="font-semibold text-sm truncate">{team.name}</h1>
          <span className={cn('text-[0.65rem] font-medium capitalize', statusColor)}>
            {team.status}
          </span>
        </div>

        {/* Connection indicator */}
        <div className="ml-auto flex items-center gap-3">
          {connected ? (
            <span className="flex items-center gap-1.5 text-[0.65rem] text-green-400">
              <Radio className="size-3 animate-pulse" />
              Live
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Reconnecting
            </span>
          )}

          <div className="flex items-center gap-1 text-[0.65rem] text-muted-foreground">
            <Eye className="size-3" />
            <span>Spectating</span>
          </div>

          {/* Join as Human button */}
          {!joinedAsHuman && team.status !== 'disbanded' && (
            <button
              onClick={() => setShowJoinForm(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/25 transition-colors"
            >
              <UserPlus className="size-3.5" />
              Join as Human
            </button>
          )}
          {joinedAsHuman && (
            <span className="text-[0.65rem] text-green-400 font-medium">👤 Joined as {joinName}</span>
          )}
        </div>
      </header>

      {/* Team description */}
      {team.description && (
        <div className="border-b border-border/50 px-4 py-2 text-xs text-muted-foreground bg-card/40">
          {team.description}
        </div>
      )}

      {/* Join form overlay */}
      {showJoinForm && (
        <div className="border-b border-border bg-card/80 px-4 py-3 flex items-center gap-3">
          <UserPlus className="size-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={joinName}
            onChange={e => setJoinName(e.target.value)}
            placeholder="Your display name…"
            className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
            onKeyDown={e => { if (e.key === 'Enter') void handleJoinAsHuman() }}
            autoFocus
          />
          <button
            onClick={() => void handleJoinAsHuman()}
            disabled={joining || !joinName.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {joining ? <Loader2 className="size-3 animate-spin" /> : null}
            Join
          </button>
          <button onClick={() => setShowJoinForm(false)} className="text-xs text-muted-foreground hover:text-foreground">
            Cancel
          </button>
          {joinError && <span className="text-xs text-destructive">{joinError}</span>}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Message feed */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <MessageFeed
            messages={messages}
            agents={team.agents}
            participants={activeParticipants}
            readOnly={!joinedAsHuman}
          />
          {/* Steer input if joined as human */}
          {joinedAsHuman && (
            <div className="border-t border-border px-4 py-3">
              <SteerInput
                teamId={teamId}
                onSend={handleSendMessage}
                placeholder={`Message as ${joinName}…`}
              />
            </div>
          )}
        </div>

        {/* Sidebar: agents + participants */}
        <aside className="hidden w-52 shrink-0 border-l border-border overflow-y-auto p-3 lg:flex flex-col gap-3">
          <div>
            <h3 className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Agents ({team.agents.length})
            </h3>
            <div className="flex flex-col gap-1.5">
              {team.agents.map(agent => (
                <div key={agent.name} className="flex items-center gap-2">
                  <AgentBadge
                    name={agent.name}
                    program={agent.program}
                    role={agent.role}
                    origin={agent.origin}
                  />
                  <span className={cn(
                    'ml-auto text-[0.55rem] rounded-full px-1.5 py-0.5 capitalize',
                    agent.status === 'active' ? 'bg-green-500/10 text-green-400' :
                    agent.status === 'done' ? 'bg-muted text-muted-foreground' :
                    'bg-yellow-500/10 text-yellow-400',
                  )}>
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {activeParticipants.length > 0 && (
            <div>
              <h3 className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                <Users className="inline size-2.5 mr-1" />
                Participants ({activeParticipants.length})
              </h3>
              <div className="flex flex-col gap-1">
                {activeParticipants.map(p => (
                  <div key={p.participantId} className="text-[0.65rem] text-muted-foreground flex items-center gap-1.5">
                    <span>{p.origin === 'human' ? '👤' : '🌐'}</span>
                    <span className="truncate">{p.displayName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto">
            <div className="text-[0.6rem] text-muted-foreground/50 flex items-center gap-1">
              <Eye className="size-2.5" />
              <span>Read-only spectator view</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
