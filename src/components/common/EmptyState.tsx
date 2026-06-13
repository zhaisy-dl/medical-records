import type { FC } from 'react'

interface Props {
  message?: string
  icon?: string
}

const EmptyState: FC<Props> = ({ message = '暂无数据', icon = '📋' }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#999',
  }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
    <div style={{ fontSize: 14 }}>{message}</div>
  </div>
)

export default EmptyState
