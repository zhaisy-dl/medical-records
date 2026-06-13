import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Tabs } from 'antd-mobile'
import { AddOutline } from 'antd-mobile-icons'
import EmptyState from '@/components/common/EmptyState'
import Loading from '@/components/common/Loading'
import { medicationService } from '@/services/medicationService'
import { formatDate } from '@/utils/date'
import type { Medication } from '@/db/schema'

const statusTabs = [
  { key: 'all', title: '全部' },
  { key: 'active', title: '进行中' },
  { key: 'discontinued', title: '已停用' },
  { key: 'completed', title: '已完成' },
]

const statusLabel: Record<string, string> = {
  active: '进行中', discontinued: '已停用', completed: '已完成',
}

const statusColor: Record<string, string> = {
  active: '#00b578', discontinued: '#ff8f1f', completed: '#999',
}

const MedicationListPage = () => {
  const navigate = useNavigate()
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')

  const loadData = async () => {
    setLoading(true)
    const data = await medicationService.list(tab === 'all' ? undefined : tab as Medication['status'])
    setMedications(data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [tab])

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>用药管理</h2>
        <Button size="small" color="primary" onClick={() => navigate('/medications/new')}>
          <AddOutline /> 新增
        </Button>
      </div>

      <Tabs activeKey={tab} onChange={key => setTab(key)} style={{ marginBottom: 16 }}>
        {statusTabs.map(st => (
          <Tabs.Tab title={st.title} key={st.key} />
        ))}
      </Tabs>

      {loading ? (
        <Loading />
      ) : medications.length === 0 ? (
        <EmptyState message="暂无用药记录" icon="💊" />
      ) : (
        medications.map(m => (
          <div key={m.id} className="card" onClick={() => navigate(`/medications/${m.id}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{m.name}</span>
                  <span style={{
                    fontSize: 10,
                    color: statusColor[m.status],
                    background: `${statusColor[m.status]}15`,
                    padding: '1px 6px',
                    borderRadius: 4,
                  }}>
                    {statusLabel[m.status]}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                  {m.dosage} · {m.frequency} · {m.timeOfDay}
                </div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  {formatDate(m.startDate)}
                  {m.endDate ? ` ~ ${formatDate(m.endDate)}` : ' 至今'}
                  {m.instructions ? ` · ${m.instructions}` : ''}
                </div>
              </div>
              <span style={{ fontSize: 20 }}>💊</span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default MedicationListPage
