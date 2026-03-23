import { cn } from '../lib/utils'

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

interface AgentBadgeProps {
  name: string
  program: string
  role?: string
  showRole?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function AgentBadge({ name, program, role, showRole = false, size = 'sm' }: AgentBadgeProps) {
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
