import { Dialog } from 'antd-mobile'
import type { FC } from 'react'

interface Props {
  title?: string
  content?: string
  onConfirm: () => void
  onCancel?: () => void
  trigger: (open: () => void) => React.ReactNode
}

const ConfirmDelete: FC<Props> = ({ title = '确认删除', content = '删除后无法恢复，确定要删除吗？', onConfirm, trigger }) => {
  return (
    <>
      {trigger(() => {
        Dialog.confirm({ title, content, onConfirm })
      })}
    </>
  )
}

export default ConfirmDelete
