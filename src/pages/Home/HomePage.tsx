import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from 'antd-mobile'
import { RightOutline } from 'antd-mobile-icons'
import StatCard from '@/components/common/StatCard'
import { db } from '@/db/index'
import { visitService } from '@/services/visitService'
import { medicationService } from '@/services/medicationService'
import { indicatorService } from '@/services/indicatorService'
import { reminderService } from '@/services/reminderService'
import { formatRelative } from '@/utils/date'
import type { Visit, Reminder } from '@/db/schema'

const HomePage = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ visits: 0, activeMeds: 0, abnormalIndicators: 0, pendingReminders: 0 })
  const [recentVisits, setRecentVisits] = useState<Visit[]>([])
  const [todayReminders, setTodayReminders] = useState<Reminder[]>([])

  const loadData = async () => {
    const [visits, meds, indicators, reminders, allReminders] = await Promise.all([
      visitService.list(),
      medicationService.list('active'),
      indicatorService.list(),
      reminderService.getToday(),
      reminderService.getActive(),
    ])

    const abnormalCount = indicators.filter(i => i.isAbnormal).length

    setStats({
      visits: visits.length,
      activeMeds: meds.length,
      abnormalIndicators: abnormalCount,
      pendingReminders: allReminders.filter(r => !r.isCompleted).length,
    })
    setRecentVisits(visits.slice(0, 3))
    setTodayReminders(reminders)
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>健康管理</h2>
          <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <StatCard title="就诊次数" value={stats.visits} color="#1677ff" />
        <StatCard title="活跃用药" value={stats.activeMeds} color="#00b578" />
        <StatCard title="异常指标" value={stats.abnormalIndicators} color={stats.abnormalIndicators > 0 ? '#ff3141' : '#999'} />
        <StatCard title="待办提醒" value={stats.pendingReminders} color="#ff8f1f" />
      </div>

      {/* Today's Reminders */}
      {todayReminders.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 15, marginBottom: 8, color: '#333' }}>今日提醒</h4>
          {todayReminders.map(r => (
            <div key={r.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
              <span>{r.type === 'medication' ? '💊' : r.type === 'appointment' ? '🏥' : r.type === 'followUp' ? '🩺' : '📌'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{r.reminderTime}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Visits */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h4 style={{ fontSize: 15, color: '#333' }}>最近就诊</h4>
          <span style={{ fontSize: 12, color: '#1677ff' }} onClick={() => navigate('/visits')}>
            查看全部 <RightOutline style={{ fontSize: 10 }} />
          </span>
        </div>
        {recentVisits.length === 0 ? (
          <Card
            style={{ textAlign: 'center', color: '#999', padding: '24px 0', cursor: 'pointer' }}
            onClick={() => navigate('/visits/new')}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏥</div>
            <div style={{ fontSize: 13 }}>还没有就诊记录</div>
            <div style={{ fontSize: 13, color: '#1677ff', marginTop: 4 }}>点击添加第一条</div>
          </Card>
        ) : (
          <div>
            {recentVisits.map(v => (
              <div key={v.id} className="timeline-item" onClick={() => navigate(`/visits/${v.id}`)}>
                <div className="card" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{v.hospitalName}</div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{v.department} · {v.doctorName || '未知医生'}</div>
                      {v.diagnosis && <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>诊断: {v.diagnosis}</div>}
                    </div>
                    <div style={{ fontSize: 11, color: '#999', whiteSpace: 'nowrap' }}>
                      {formatRelative(v.visitDate)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage
