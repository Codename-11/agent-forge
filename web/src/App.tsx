import { useState, useEffect, useCallback } from 'react'
import { useRouter } from './hooks/useRouter'
import { navigate } from './hooks/useRouter'
import { DashboardLayout } from './components/DashboardLayout'
import { PublicLayout } from './components/PublicLayout'
import { TeamListView } from './components/TeamListView'
import { HistoryView } from './components/HistoryView'
import { Monitor } from './components/Monitor'
import { SettingsPage } from './components/SettingsPage'
import { DeployPage } from './components/DeployPage'
import { LandingPage } from './components/LandingPage'
import { SpectatorView } from './components/SpectatorView'
import { ReplayView } from './components/ReplayView'
import { useEnsemble } from './hooks/useEnsemble'

// Check if landing page is enabled (can be overridden via meta tag from server)
function isLandingEnabled(): boolean {
  const meta = document.querySelector('meta[name="ensemble-landing"]')
  if (meta) return meta.getAttribute('content') !== 'false'
  return true // default: show landing page
}

export function App() {
  const { pathname } = useRouter()
  const [serverOnline, setServerOnline] = useState<boolean | undefined>(undefined)
  const [connecting, setConnecting] = useState(true)

  // Monitor view state
  const [monitorTeamId, setMonitorTeamId] = useState<string | null>(() => {
    const m = pathname.match(/^\/app\/team\/([^/?]+)/)
    return m ? m[1] : null
  })

  const { team, messages, connected, error, sendMessage, disbandTeam } = useEnsemble(monitorTeamId)

  // Sync monitorTeamId from URL changes
  useEffect(() => {
    const m = pathname.match(/^\/app\/team\/([^/?]+)/)
    setMonitorTeamId(m ? m[1] : null)
  }, [pathname])

  const handleServerStatus = useCallback((online: boolean, isConnecting: boolean) => {
    setServerOnline(online)
    setConnecting(isConnecting)
  }, [])

  // ── Public routes ──────────────────────────────────────────

  // Landing page (root route)
  if (pathname === '/' && isLandingEnabled()) {
    return (
      <PublicLayout>
        <LandingPage
          onCreateTeam={() => navigate('/app?new=1')}
          onWatchTeam={(teamId) => navigate(`/team/${teamId}`)}
          onDashboard={() => navigate('/app')}
        />
      </PublicLayout>
    )
  }

  // Public spectator view
  if (pathname.startsWith('/team/')) {
    const teamId = pathname.replace('/team/', '').split('/')[0]
    const token = new URLSearchParams(window.location.search).get('token') ?? undefined
    return (
      <PublicLayout>
        <SpectatorView
          teamId={teamId}
          token={token}
          onBack={() => navigate('/')}
          onWatchReplay={(id) => navigate(`/replay/${id}`)}
        />
      </PublicLayout>
    )
  }

  // Public replay view
  if (pathname.startsWith('/replay/')) {
    const teamId = pathname.replace('/replay/', '').split('/')[0]
    return (
      <PublicLayout>
        <ReplayView
          teamId={teamId}
          onBack={() => navigate('/')}
        />
      </PublicLayout>
    )
  }

  // Public lobby
  if (pathname === '/lobby') {
    return (
      <PublicLayout>
        <LandingPage
          onCreateTeam={() => navigate('/app?new=1')}
          onWatchTeam={(teamId) => navigate(`/team/${teamId}`)}
          onDashboard={() => navigate('/app')}
        />
      </PublicLayout>
    )
  }

  // ── Dashboard routes ──────────────────────────────────────

  // Settings
  if (pathname === '/app/settings') {
    return (
      <DashboardLayout serverOnline={serverOnline} connecting={connecting}>
        <SettingsPage onBack={() => navigate('/app')} />
      </DashboardLayout>
    )
  }

  // Deploy
  if (pathname === '/app/deploy') {
    return (
      <DashboardLayout serverOnline={serverOnline} connecting={connecting}>
        <DeployPage onBack={() => navigate('/app')} />
      </DashboardLayout>
    )
  }

  // History
  if (pathname === '/app/history') {
    return (
      <DashboardLayout serverOnline={serverOnline} connecting={connecting}>
        <HistoryView />
      </DashboardLayout>
    )
  }

  // Monitor (team detail)
  if (pathname.startsWith('/app/team/')) {
    return (
      <DashboardLayout serverOnline={serverOnline} connecting={connecting}>
        <div className="flex h-full max-h-full flex-col overflow-hidden">
          {monitorTeamId && team ? (
            <Monitor
              team={team}
              messages={messages}
              connected={connected}
              error={error}
              onSend={sendMessage}
              onDisband={disbandTeam}
              onBack={() => navigate('/app')}
              onNavigateToTeam={(id) => navigate(`/app/team/${id}`)}
            />
          ) : monitorTeamId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
              <div className="animate-spin rounded-full border-2 border-muted border-t-primary size-6" />
              <span className="text-sm">Loading team...</span>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
              <span className="text-sm">Team not found</span>
            </div>
          )}
        </div>
      </DashboardLayout>
    )
  }

  // Dashboard home (/app or /)
  return (
    <DashboardLayout serverOnline={serverOnline} connecting={connecting}>
      <TeamListView onServerStatus={handleServerStatus} />
    </DashboardLayout>
  )
}
