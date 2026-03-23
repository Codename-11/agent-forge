import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ArrowLeft,
  GitBranch,
  GitCommit,
  RefreshCw,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Copy,
  Terminal,
  Check,
  AlertCircle,
} from 'lucide-react'
import { cn } from '../lib/utils'

// ── Types ──────────────────────────────────────────────────────

interface DeployStatus {
  commitHash: string
  branch: string
  lastCommitMessage: string
  lastDeployTime: string | null
  serviceRunning: boolean
}

interface UpdateCheckResult {
  upToDate: boolean
  commitsBehind: number
  commits: Array<{
    hash: string
    message: string
    author: string
  }>
  changedFiles: string[]
}

interface DeployOutputLine {
  type: 'step' | 'output' | 'done' | 'error'
  text: string
  timestamp: number
}

interface Toast {
  type: 'success' | 'error'
  message: string
}

// ── Helpers ────────────────────────────────────────────────────

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function shortenHash(hash: string): string {
  return hash.slice(0, 7)
}

// ── Component ──────────────────────────────────────────────────

interface DeployPageProps {
  onBack: () => void
}

export function DeployPage({ onBack }: DeployPageProps) {
  // Status
  const [status, setStatus] = useState<DeployStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [statusError, setStatusError] = useState<string | null>(null)

  // Update check
  const [checking, setChecking] = useState(false)
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null)

  // Deploy
  const [deploying, setDeploying] = useState(false)
  const [deployOutput, setDeployOutput] = useState<DeployOutputLine[]>([])
  const [deploySuccess, setDeploySuccess] = useState(false)
  const [deployError, setDeployError] = useState<string | null>(null)

  // UI
  const [toast, setToast] = useState<Toast | null>(null)
  const [copiedHash, setCopiedHash] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const showToast = useCallback((type: Toast['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // ── Fetch status on mount ─────────────────────────────────

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true)
    setStatusError(null)
    try {
      const res = await fetch('/api/ensemble/deploy/status')
      if (!res.ok) {
        setStatusError(`Failed to load deploy status: ${res.status}`)
        return
      }
      const data: DeployStatus = await res.json()
      setStatus(data)
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Failed to load deploy status')
    } finally {
      setStatusLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchStatus()
  }, [fetchStatus])

  // ── Check for updates ─────────────────────────────────────

  const handleCheckUpdates = async () => {
    setChecking(true)
    setUpdateResult(null)
    try {
      const res = await fetch('/api/ensemble/deploy/check', { method: 'POST' })
      if (!res.ok) {
        showToast('error', `Check failed: ${res.status}`)
        return
      }
      const data: UpdateCheckResult = await res.json()
      setUpdateResult(data)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Check failed')
    } finally {
      setChecking(false)
    }
  }

  // ── Deploy ────────────────────────────────────────────────

  const handleDeploy = () => {
    setDeploying(true)
    setDeployOutput([])
    setDeploySuccess(false)
    setDeployError(null)

    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const es = new EventSource('/api/ensemble/deploy/run')
    eventSourceRef.current = es

    const appendLine = (type: DeployOutputLine['type'], text: string) => {
      setDeployOutput(prev => [...prev, { type, text, timestamp: Date.now() }])
      // Auto-scroll to bottom
      requestAnimationFrame(() => {
        if (outputRef.current) {
          outputRef.current.scrollTop = outputRef.current.scrollHeight
        }
      })
    }

    es.addEventListener('step', (e: MessageEvent) => {
      appendLine('step', e.data)
    })

    es.addEventListener('output', (e: MessageEvent) => {
      appendLine('output', e.data)
    })

    es.addEventListener('done', (e: MessageEvent) => {
      appendLine('done', e.data || 'Deploy complete')
      setDeploying(false)
      setDeploySuccess(true)
      es.close()
      eventSourceRef.current = null
      // Refresh version info after deploy
      void fetchStatus()
      setUpdateResult(null)
    })

    es.addEventListener('error', (e: MessageEvent) => {
      // SSE error event with data (server-sent)
      if (e.data) {
        appendLine('error', e.data)
        setDeployError(e.data)
      }
      setDeploying(false)
      es.close()
      eventSourceRef.current = null
    })

    // Native EventSource error (connection lost)
    es.onerror = () => {
      if (deploying) {
        setDeployError('Connection to server lost')
        setDeploying(false)
        es.close()
        eventSourceRef.current = null
      }
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  // ── Copy commit hash ──────────────────────────────────────

  const copyHash = () => {
    if (!status) return
    navigator.clipboard.writeText(status.commitHash).then(() => {
      setCopiedHash(true)
      showToast('success', 'Commit hash copied')
      setTimeout(() => setCopiedHash(false), 1500)
    }).catch(() => {
      showToast('error', 'Failed to copy')
    })
  }

  // ── Loading / error states ────────────────────────────────

  if (statusLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <span className="text-sm">Loading deploy status...</span>
      </div>
    )
  }

  if (statusError || !status) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-destructive">{statusError || 'Failed to load deploy status'}</p>
        <button
          className="mt-2 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          onClick={onBack}
        >
          Go back
        </button>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────

  const canDeploy = updateResult && !updateResult.upToDate && !deploying

  return (
    <div className="flex h-full max-h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border px-6 py-4">
        <button
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
        <div className="h-4 w-px bg-border" />
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Deploy & Updates</h1>
          <p className="text-xs text-muted-foreground">Manage server deployments</p>
        </div>
      </header>

      {/* Toast notification */}
      {toast && (
        <div
          className={cn(
            'mx-6 mt-3 flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-all',
            toast.type === 'success'
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          )}
        >
          {toast.type === 'success' ? <Check className="size-3.5" /> : <AlertCircle className="size-3.5" />}
          {toast.message}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">

          {/* ── Current Version Card ──────────────────────────── */}
          <section className="rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
              <GitCommit className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Current Version</h2>
              <div className="ml-auto">
                {status.serviceRunning ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-[10px] font-medium text-green-400">
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-green-500" />
                    </span>
                    Running
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-medium text-red-400">
                    <span className="inline-block size-1.5 rounded-full bg-red-500" />
                    Stopped
                  </span>
                )}
              </div>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {/* Commit hash */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  Commit
                </span>
                <div className="flex items-center gap-2">
                  <code className="rounded bg-background px-2 py-1 font-mono text-sm text-foreground">
                    {shortenHash(status.commitHash)}
                  </code>
                  <button
                    onClick={copyHash}
                    className={cn(
                      'rounded p-1 transition-colors',
                      copiedHash
                        ? 'text-green-400'
                        : 'text-muted-foreground/40 hover:text-foreground'
                    )}
                    title="Copy full commit hash"
                  >
                    {copiedHash ? <Check className="size-3" /> : <Copy className="size-3" />}
                  </button>
                </div>
              </div>

              {/* Branch */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  Branch
                </span>
                <div className="flex items-center gap-1.5">
                  <GitBranch className="size-3.5 text-muted-foreground" />
                  <span className="font-mono text-sm text-foreground">{status.branch}</span>
                </div>
              </div>

              {/* Last commit message */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  Last Commit
                </span>
                <p className="text-sm text-foreground/80 leading-snug">
                  {status.lastCommitMessage}
                </p>
              </div>

              {/* Last deploy time */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  Last Deploy
                </span>
                <span className="text-sm text-foreground/80">
                  {relativeTime(status.lastDeployTime)}
                </span>
              </div>
            </div>
          </section>

          {/* ── Check for Updates ─────────────────────────────── */}
          <section className="rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
              <RefreshCw className={cn('size-4 text-blue-400', checking && 'animate-spin')} />
              <h2 className="text-sm font-semibold">Check for Updates</h2>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  onClick={() => void handleCheckUpdates()}
                  disabled={checking || deploying}
                >
                  {checking ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3" />
                  )}
                  {checking ? 'Checking...' : 'Check for Updates'}
                </button>

                {/* Update result badge */}
                {updateResult && !checking && (
                  updateResult.upToDate ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                      <CheckCircle2 className="size-3.5" />
                      Up to date
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                      <AlertTriangle className="size-3.5" />
                      {updateResult.commitsBehind} commit{updateResult.commitsBehind !== 1 ? 's' : ''} behind
                    </span>
                  )
                )}
              </div>

              {/* New commits list */}
              {updateResult && !updateResult.upToDate && updateResult.commits.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-muted-foreground">New Commits</h3>
                  <div className="rounded-md border border-border bg-background">
                    {updateResult.commits.map((commit, i) => (
                      <div
                        key={commit.hash}
                        className={cn(
                          'flex items-start gap-3 px-4 py-2.5 text-xs',
                          i < updateResult.commits.length - 1 && 'border-b border-border/50'
                        )}
                      >
                        <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-primary">
                          {shortenHash(commit.hash)}
                        </code>
                        <span className="flex-1 text-foreground/80">{commit.message}</span>
                        <span className="shrink-0 text-muted-foreground">{commit.author}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Changed files */}
              {updateResult && !updateResult.upToDate && updateResult.changedFiles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Changed Files ({updateResult.changedFiles.length})
                  </h3>
                  <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-background p-3">
                    {updateResult.changedFiles.map((file) => (
                      <div key={file} className="font-mono text-[11px] text-foreground/60 leading-relaxed">
                        {file}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deploy button (in update section) */}
              {updateResult && !updateResult.upToDate && (
                <div className="pt-2">
                  <button
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:opacity-50"
                    onClick={handleDeploy}
                    disabled={!canDeploy}
                  >
                    {deploying ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Rocket className="size-4" />
                    )}
                    {deploying ? 'Deploying...' : 'Deploy Update'}
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ── Deploy Output ─────────────────────────────────── */}
          {(deployOutput.length > 0 || deploying) && (
            <section className="rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                <Terminal className="size-4 text-green-400" />
                <h2 className="text-sm font-semibold">Deploy Output</h2>
                {deploying && (
                  <Loader2 className="ml-auto size-3.5 animate-spin text-primary" />
                )}
              </div>

              {/* Success banner */}
              {deploySuccess && (
                <div className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-medium text-green-400">
                  <CheckCircle2 className="size-4" />
                  Deploy completed successfully
                </div>
              )}

              {/* Error banner */}
              {deployError && (
                <div className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400">
                  <XCircle className="size-4" />
                  Deploy failed: {deployError}
                </div>
              )}

              {/* Terminal output */}
              <div
                ref={outputRef}
                className="m-5 max-h-80 overflow-y-auto rounded-md bg-zinc-950 p-4 font-mono text-xs leading-relaxed"
              >
                {deployOutput.map((line, i) => (
                  <div key={i} className={cn(
                    line.type === 'step' && 'font-bold text-foreground mt-2 first:mt-0',
                    line.type === 'output' && 'text-muted-foreground',
                    line.type === 'done' && 'text-green-400 font-medium mt-2',
                    line.type === 'error' && 'text-red-400 font-medium mt-2',
                  )}>
                    {line.type === 'step' && <span className="text-primary mr-1">{'\u2192'}</span>}
                    {line.text}
                  </div>
                ))}
                {deploying && (
                  <span className="inline-block size-2 animate-pulse rounded-full bg-primary mt-1" />
                )}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  )
}
