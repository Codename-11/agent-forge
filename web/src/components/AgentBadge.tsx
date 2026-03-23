import { useState } from 'react'
import { cn } from '../lib/utils'
import type { ParticipantOrigin } from '../types'

const AGENT_COLORS: Record<string, { dot: string; text: string; bg: string; hex: string }> = {
  codex:  { dot: 'bg-agent-codex',  text: 'text-agent-codex',  bg: 'bg-agent-codex/20',  hex: 'var(--agent-codex)' },
  claude: { dot: 'bg-agent-claude', text: 'text-agent-claude', bg: 'bg-agent-claude/20', hex: 'var(--agent-claude)' },
  gemini: { dot: 'bg-agent-gemini', text: 'text-agent-gemini', bg: 'bg-agent-gemini/20', hex: 'var(--agent-gemini)' },
  aider:  { dot: 'bg-agent-aider',  text: 'text-agent-aider',  bg: 'bg-agent-aider/20',  hex: 'var(--agent-aider)' },
}

function getAgentClasses(program: string): { dot: string; text: string; bg: string; hex: string } {
  const key = program.toLowerCase()
  for (const [name, classes] of Object.entries(AGENT_COLORS)) {
    if (key.includes(name)) return classes
  }
  return { dot: 'bg-agent-default', text: 'text-agent-default', bg: 'bg-agent-default/20', hex: 'var(--agent-default)' }
}

/** Small badge showing origin: local (no badge), remote (🌐), human (👤) */
function OriginBadge({ origin }: { origin?: ParticipantOrigin }) {
  if (!origin || origin === 'local') return null
  return (
    <span
      className="text-[0.65rem] leading-none opacity-70"
      title={origin === 'remote' ? 'Remote agent' : 'Human participant'}
    >
      {origin === 'remote' ? '🌐' : '👤'}
    </span>
  )
}

/** Circular avatar — letter-based with agent color, or emoji/image if provided */
function AgentAvatar({ name, program, avatar, size }: {
  name: string
  program: string
  avatar?: string
  size: 'sm' | 'md' | 'lg'
}) {
  const colors = getAgentClasses(program)
  const sizeClass = size === 'sm' ? 'size-5 text-[0.55rem]' : size === 'md' ? 'size-6 text-xs' : 'size-8 text-sm'

  if (avatar && avatar.length <= 2) {
    // Emoji avatar
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full font-bold',
          sizeClass,
          colors.bg,
        )}
      >
        {avatar}
      </span>
    )
  }

  if (avatar && avatar.startsWith('http')) {
    // Image avatar
    return (
      <img
        src={avatar}
        alt={name}
        className={cn('inline-block shrink-0 rounded-full object-cover', sizeClass)}
      />
    )
  }

  // Default: first letter of name with colored background
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold uppercase',
        sizeClass,
        colors.bg,
        colors.text,
      )}
    >
      {name.charAt(0)}
    </span>
  )
}

interface AgentBadgeProps {
  name: string
  program: string
  role?: string
  showRole?: boolean
  size?: 'sm' | 'md' | 'lg'
  origin?: ParticipantOrigin
  avatar?: string
  personality?: string
  /** If true, render circular avatar instead of dot */
  showAvatar?: boolean
}

export function AgentBadge({
  name,
  program,
  role,
  showRole = false,
  size = 'sm',
  origin,
  avatar,
  personality,
  showAvatar = false,
}: AgentBadgeProps) {
  const colors = getAgentClasses(program)
  const isLead = role === 'lead'
  const [showTooltip, setShowTooltip] = useState(false)

  const personalityText = personality ?? (isLead
    ? 'Strategic thinker who plans before acting.'
    : 'Pragmatic builder who ships fast.')

  return (
    <span
      className="relative inline-flex items-center gap-1.5"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {showAvatar ? (
        <AgentAvatar name={name} program={program} avatar={avatar} size={size} />
      ) : (
        <span
          className={cn(
            'inline-block shrink-0 rounded-full',
            size === 'sm' ? 'size-2' : size === 'md' ? 'size-2.5' : 'size-3',
            colors.dot,
          )}
        />
      )}
      <span
        className={cn(
          'font-medium',
          size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base',
          colors.text,
        )}
      >
        {name}
      </span>
      <OriginBadge origin={origin} />
      {showRole && isLead && (
        <span
          className={cn(
            'font-normal text-muted-foreground/60',
            size === 'sm' ? 'text-[0.6rem]' : size === 'md' ? 'text-[0.65rem]' : 'text-xs',
          )}
        >
          (Lead)
        </span>
      )}

      {/* Personality tooltip */}
      {showTooltip && personalityText && (
        <div className="absolute bottom-full left-0 z-50 mb-1.5 w-48 rounded-lg border border-border bg-card px-3 py-2 shadow-lg pointer-events-none">
          <div className="flex items-center gap-1.5 mb-1">
            {showAvatar && (
              <AgentAvatar name={name} program={program} avatar={avatar} size="sm" />
            )}
            <span className={cn('text-xs font-semibold', colors.text)}>{name}</span>
            {role && (
              <span className="text-[0.6rem] text-muted-foreground capitalize ml-auto">{role}</span>
            )}
          </div>
          <p className="text-[0.65rem] leading-relaxed text-muted-foreground">{personalityText}</p>
        </div>
      )}
    </span>
  )
}

/** Standalone circular avatar component for agent cards */
export function AgentCard({ name, program, role, avatar, personality }: {
  name: string
  program: string
  role?: string
  avatar?: string
  personality?: string
}) {
  const colors = getAgentClasses(program)
  const isLead = role === 'lead'
  const personalityText = personality ?? (isLead
    ? 'Strategic thinker who plans before acting.'
    : 'Pragmatic builder who ships fast.')

  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-2.5 min-w-[72px]">
      <AgentAvatar name={name} program={program} avatar={avatar} size="lg" />
      <span className={cn('text-xs font-semibold', colors.text)}>{name}</span>
      {role && (
        <span className="text-[0.55rem] text-muted-foreground capitalize">{role}</span>
      )}
      <p className="text-center text-[0.55rem] leading-relaxed text-muted-foreground/70 line-clamp-2">
        {personalityText}
      </p>
    </div>
  )
}

/** Badge for a remote participant (not a local agent) */
interface ParticipantBadgeProps {
  displayName: string
  origin: ParticipantOrigin
  size?: 'sm' | 'md'
}

export function ParticipantBadge({ displayName, origin, size = 'sm' }: ParticipantBadgeProps) {
  const icon = origin === 'human' ? '👤' : '🌐'
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('text-muted-foreground', size === 'sm' ? 'text-xs' : 'text-sm')}>
        {icon}
      </span>
      <span
        className={cn(
          'font-medium text-muted-foreground',
          size === 'sm' ? 'text-xs' : 'text-sm',
        )}
      >
        {displayName}
      </span>
    </span>
  )
}
