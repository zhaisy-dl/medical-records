import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, SpinLoading, Toast } from 'antd-mobile'
import { RightOutline } from 'antd-mobile-icons'
import StatCard from '@/components/common/StatCard'
import { visitService } from '@/services/visitService'
import { medicationService } from '@/services/medicationService'
import { indicatorService } from '@/services/indicatorService'
import { reminderService } from '@/services/reminderService'
import { useAI } from '@/hooks/useAI'
import { formatRelative } from '@/utils/date'
import type { Visit, Reminder, Indicator } from '@/db/schema'

const HomePage = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ visits: 0, activeMeds: 0, abnormalIndicators: 0, pendingReminders: 0 })
  const [recentVisits, setRecentVisits] = useState<Visit[]>([])
  const [todayReminders, setTodayReminders] = useState<Reminder[]>([])
  const [allIndicators, setAllIndicators] = useState<Indicator[]>([])

  // AI analysis
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const { loading: aiLoading, progress: aiProgress, progressPct: aiPct, analyzeHealth, error: aiError } = useAI()

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
    setAllIndicators(indicators)
  }

  const handleAIAnalysis = async () => {
    try {
      const profile = JSON.parse(localStorage.getItem('user_profile') || '{}')
      const visits = await visitService.list()
      const indicators = await indicatorService.list()
      const analysis = await analyzeHealth(visits, indicators, profile)
      if (analysis) {
        setAiAnalysis(analysis)
      }
    } catch {
      Toast.show({ icon: 'fail', content: 'AI分析失败，请稍后重试' })
    }
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

      {/* AI 健康分析 */}
      <div style={{ marginBottom: 20 }}>
        {!aiAnalysis && !aiLoading && (
          <Card
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              borderRadius: 12,
              cursor: 'pointer',
            }}
            onClick={handleAIAnalysis}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>🤖</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>AI 健康分析</div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>基于您的就诊记录和检查指标，AI分析健康趋势</div>
              </div>
              <RightOutline style={{ color: '#fff' }} />
            </div>
          </Card>
        )}

        {aiLoading && (
          <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <SpinLoading style={{ '--size': '24px', margin: '0 auto' }} color="primary" />
            <div style={{ fontSize: 13, color: '#666', marginTop: 12 }}>{aiProgress}</div>
            <div style={{
              width: '100%',
              height: 4,
              background: '#eee',
              borderRadius: 2,
              marginTop: 8,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${aiPct}%`,
                height: '100%',
                background: '#1677ff',
                borderRadius: 2,
                transition: 'width 0.3s',
              }} />
            </div>
          </div>
        )}

        {aiAnalysis && (
          <div className="card" style={{ borderLeft: '4px solid #667eea' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>🤖 AI 健康分析</span>
              <Button size="mini" fill="none" onClick={() => setAiAnalysis(null)}>
                收起
              </Button>
            </div>
            <div style={{ fontSize: 13, color: '#333', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {aiAnalysis}
            </div>
            <div style={{ fontSize: 10, color: '#ccc', marginTop: 8 }}>
              AI分析仅供参考，不构成医疗建议
            </div>
          </div>
        )}

        {aiError && (
          <div className="card" style={{ textAlign: 'center', color: '#ff3141', fontSize: 13 }}>
            {aiError}
            <Button size="mini" fill="none" color="primary" onClick={handleAIAnalysis} style={{ marginTop: 8 }}>
              重试
            </Button>
          </div>
        )}
      </div>

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
