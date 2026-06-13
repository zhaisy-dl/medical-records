import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Tabs, Toast } from 'antd-mobile'
import { AddOutline } from 'antd-mobile-icons'
import EmptyState from '@/components/common/EmptyState'
import Loading from '@/components/common/Loading'
import { reminderService } from '@/services/reminderService'
import { formatDate } from '@/utils/date'
import { REMINDER_TYPES } from '@/utils/constants'
import type { Reminder } from '@/db/schema'

const typeEmoji: Record<string, string> = {
  medication: '💊',
  appointment: '🏥',
  followUp: '🩺',
  custom: '📌',
}

const ReminderListPage = () => {
  const navigate = useNavigate()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('today')

  const loadData = async () => {
    setLoading(true)
    let data: Reminder[]
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (tab) {
      case 'today':
        data = await reminderService.getToday()
        break
      case 'upcoming':
        data = (await reminderService.getActive()).filter(r => !r.isCompleted && new Date(r.reminderDate) > new Date())
        break
      case 'completed':
        data = (await reminderService.list()).filter(r => r.isCompleted)
        break
      default:
        data = await reminderService.list()
    }
    setReminders(data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [tab])

  const handleComplete = async (id: number) => {
    const result = await reminderService.complete(id)
    if (result.success) {
      Toast.show({ icon: 'success', content: '已完成' })
      loadData()
    }
  }

  const handleDelete = async (id: number) => {
    const result = await reminderService.remove(id)
    if (result.success) {
      Toast.show({ icon: 'success', content: '已删除' })
      loadData()
    }
  }

  const getTypeLabel = (type: Reminder['type']) => {
    return REMINDER_TYPES.find(t => t.value === type)?.label || type
  }

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>提醒</h2>
        <Button size="small" color="primary" onClick={() => navigate('/reminders/new')}>
          <AddOutline /> 新建
        </Button>
      </div>

      <Tabs activeKey={tab} onChange={key => setTab(key)} style={{ marginBottom: 16 }}>
        <Tabs.Tab title="今日" key="today" />
        <Tabs.Tab title="即将" key="upcoming" />
        <Tabs.Tab title="已完成" key="completed" />
      </Tabs>

      {loading ? (
        <Loading />
      ) : reminders.length === 0 ? (
        <EmptyState message={tab === 'today' ? '今日暂无提醒' : tab === 'completed' ? '暂无已完成的提醒' : '暂无待办提醒'} icon="🔔" />
      ) : (
        reminders.map(r => (
          <div key={r.id} className="card" style={{ opacity: r.isCompleted ? 0.5 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 24 }}>{typeEmoji[r.type] || '📌'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  {formatDate(r.reminderDate)} · {r.reminderTime}
                  {r.repeatType !== 'none' && (
                    <span style={{ color: '#1677ff' }}>
                      {' · '}
                      {r.repeatType === 'daily' ? '每天' : r.repeatType === 'weekly' ? '每周' : '每月'}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>{getTypeLabel(r.type)}</div>
                {r.notes && <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{r.notes}</div>}
              </div>
            </div>

            {!r.isCompleted && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                <Button size="mini" color="default" fill="none" onClick={() => navigate(`/reminders/${r.id}`)}>
                  编辑
                </Button>
                <Button size="mini" color="success" onClick={() => handleComplete(r.id!)}>
                  完成
                </Button>
                <Button size="mini" color="danger" fill="none" onClick={() => handleDelete(r.id!)}>
                  删除
                </Button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default ReminderListPage
