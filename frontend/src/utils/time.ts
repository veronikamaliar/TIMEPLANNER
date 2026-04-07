export function toSeconds(value: string | number, unit: string): number {
  const n = Number(value)
  if (!n) return 0
  if (unit === 'minutes') return n * 60
  if (unit === 'hours') return n * 3600
  return n
}

export function fromSeconds(seconds: number) {
  if (!seconds) return { value: '', unit: 'minutes' }

  if (seconds % 3600 === 0) {
    return { value: seconds / 3600, unit: 'hours' }
  }
  if (seconds % 60 === 0) {
    return { value: seconds / 60, unit: 'minutes' }
  }
  return { value: seconds, unit: 'seconds' }
}