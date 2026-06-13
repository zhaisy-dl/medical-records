import type { FC } from 'react'

interface Props {
  title: string
  value: string | number
  color?: string
}

const StatCard: FC<Props> = ({ title, value, color = '#1677ff' }) => (
  <div style={{
    flex: 1,
    background: '#fff',
    borderRadius: 12,
    padding: '16px 12px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  }}>
    <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{title}</div>
  </div>
)

export default StatCard
