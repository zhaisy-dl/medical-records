import dayjs from 'dayjs'

export function formatDate(date: Date | string): string {
  return dayjs(date).format('YYYY-MM-DD')
}

export function formatDateTime(date: Date | string): string {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

export function formatRelative(date: Date | string): string {
  const d = dayjs(date)
  const now = dayjs()
  const diffDays = now.diff(d, 'day')
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  return d.format('MM-DD')
}

export function nowISO(): string {
  return new Date().toISOString()
}
