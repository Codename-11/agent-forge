import { cn } from '../lib/utils'
import type { ParticipantOrigin } from '../types'

const AGENT_COLORS: Record<string, { dot: string; text: string }> = {
  codex:  { dot: 'bg-agent-codex',  text: 'text-agent-codex' },
  claude: { dot: 'bg-agent-claude', text: 'text-agent-claude' },
  gemini: { dot: 'bg-agent-gemini', text: 'text-agent-gemini' },
  aider:  { dot: 'bg-agent-aider',  text: 'text-agent-aider' },
}

function getAgentClasses(program: string): { dot: string; text: string } {
  const key = program.toLowerCase()
  for (const [name, classes] of Object.entries(AGENT_COLORS)) {
    if (key.includes(name)) return classes
  }
  return { dot: 'bg-agent-default', text: 'text-agent-default' }
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

interface AgentBadgeProps {
  name: string
  program: string
  role?: string
  showRole?: boolean
  size?: 'sm' | 'md' | 'lg'
  origin?: ParticipantOrigin
}

export function AgentBadge({ name, program, role, showRole = false, size = 'sm', origin }: AgentBadgeProps) {
  const colors = getAgentClasses(program)
  const isLead = role === 'lead'
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          'inline-block shrink-0 rounded-full',
          size === 'sm' ? 'size-2' : size === 'md' ? 'size-2.5' : 'size-3',
          colors.dot,
        )}
      />
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
    </span>
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
