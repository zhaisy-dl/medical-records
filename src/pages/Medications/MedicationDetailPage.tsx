import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Dialog, Toast } from 'antd-mobile'
import { EditFill, DeleteOutline } from 'antd-mobile-icons'
import PageHeader from '@/components/Layout/PageHeader'
import Loading from '@/components/common/Loading'
import { medicationService } from '@/services/medicationService'
import { formatDate } from '@/utils/date'
import type { Medication } from '@/db/schema'

const statusLabel: Record<string, string> = { active: '进行中', discontinued: '已停用', completed: '已完成' }
const statusColor: Record<string, string> = { active: '#00b578', discontinued: '#ff8f1f', completed: '#999' }

const MedicationDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [med, setMed] = useState<Medication | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      medicationService.getById(Number(id)).then(m => {
        if (m) setMed(m)
        setLoading(false)
      })
    }
  }, [id])

  const handleStatusChange = async (status: Medication['status']) => {
    const result = await medicationService.updateStatus(Number(id), status)
    if (result.success) {
      setMed(prev => prev ? { ...prev, status } : null)
      Toast.show({ icon: 'success', content: '状态已更新' })
    }
  }

  const handleDelete = () => {
    Dialog.confirm({
      title: '确认删除',
      content: '确定要删除这条用药记录吗？',
      onConfirm: async () => {
        const result = await medicationService.remove(Number(id))
        if (result.success) {
          Toast.show({ icon: 'success', content: '已删除' })
          navigate('/medications', { replace: true })
        }
      },
    })
  }

  if (loading) return <Loading />
  if (!med) return <div className="page-container">记录不存在</div>

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5', paddingBottom: 80 }}>
      <PageHeader
        title="用药详情"
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="small" fill="none" onClick={() => navigate(`/medications/${id}/edit`)}>
              <EditFill />
            </Button>
            <Button size="small" fill="none" color="danger" onClick={handleDelete}>
              <DeleteOutline />
            </Button>
          </div>
        }
      />

      <div className="page-container">
        {/* Name & Status */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{med.name}</div>
            <span style={{
              fontSize: 12,
              color: statusColor[med.status],
              background: `${statusColor[med.status]}15`,
              padding: '2px 8px',
              borderRadius: 4,
            }}>
              {statusLabel[med.status]}
            </span>
          </div>
          {med.genericName && (
            <div style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>{med.genericName}</div>
          )}
          <div style={{ fontSize: 15, color: '#333', fontWeight: 500 }}>
            {med.dosage} · {med.frequency}
          </div>
        </div>

        {/* Schedule */}
        <div className="card">
          <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>用药安排</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
            <div><span style={{ color: '#999' }}>时段: </span>{med.timeOfDay}</div>
            <div><span style={{ color: '#999' }}>说明: </span>{med.instructions || '无'}</div>
            <div><span style={{ color: '#999' }}>开始: </span>{formatDate(med.startDate)}</div>
            <div><span style={{ color: '#999' }}>结束: </span>{med.endDate ? formatDate(med.endDate) : '长期'}</div>
          </div>
        </div>

        {/* Status Actions */}
        <div className="card">
          <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>状态管理</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['active', 'discontinued', 'completed'] as Medication['status'][]).map(s => (
              <Button
                key={s}
                size="small"
                color={med.status === s ? 'primary' : 'default'}
                fill={med.status === s ? 'solid' : 'outline'}
                onClick={() => handleStatusChange(s)}
              >
                {statusLabel[s]}
              </Button>
            ))}
          </div>
        </div>

        {med.notes && (
          <div className="card">
            <div style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>备注</div>
            <div style={{ fontSize: 13, color: '#666' }}>{med.notes}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MedicationDetailPage
