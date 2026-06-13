import type { FC, ReactNode } from 'react'
import { NavBar } from 'antd-mobile'
import { useNavigate } from 'react-router-dom'

interface Props {
  title: string
  right?: ReactNode
  onBack?: () => void
}

const PageHeader: FC<Props> = ({ title, right, onBack }) => {
  const navigate = useNavigate()
  return (
    <NavBar
      onBack={onBack || (() => navigate(-1))}
      right={right}
      style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}
    >
      {title}
    </NavBar>
  )
}

export default PageHeader
