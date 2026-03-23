import os from 'os'
import path from 'path'

function trimConfiguredDir(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function getEnsembleDataDir(): string {
  return trimConfiguredDir(process.env.AGENT_FORGE_DATA_DIR)
    || path.join(os.homedir(), '.agent-forge')
}

export function getEnsembleRegistryDir(): string {
  return path.join(getEnsembleDataDir(), 'registry')
}

export function getHostsConfigPath(): string {
  return path.join(getEnsembleDataDir(), 'hosts.json')
}
