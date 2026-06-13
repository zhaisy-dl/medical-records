import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'antd-mobile'
import { AddOutline } from 'antd-mobile-icons'
import EmptyState from '@/components/common/EmptyState'
import Loading from '@/components/common/Loading'
import { indicatorService } from '@/services/indicatorService'
import { formatDate } from '@/utils/date'
import { INDICATOR_CATEGORIES } from '@/utils/constants'
import type { Indicator } from '@/db/schema'

const IndicatorListPage = () => {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<{ name: string; latest: Indicator; count: number; abnormal: number }[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const names = await indicatorService.getAllNames()
    const groupData = await Promise.all(names.map(async name => {
      const data = await indicatorService.getTrend(name)
      const latest = data[data.length - 1]
      const abnormal = data.filter(i => i.isAbnormal).length
      return { name, latest, count: data.length, abnormal }
    }))
    setGroups(groupData.filter(g => g.latest))
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const getCategoryLabel = (cat: Indicator['category']) => {
    return INDICATOR_CATEGORIES.find(c => c.value === cat)?.label || cat
  }

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>检验指标</h2>
        <Button size="small" color="primary" onClick={() => navigate('/indicators/new')}>
          <AddOutline /> 录入
        </Button>
      </div>

      {loading ? (
        <Loading />
      ) : groups.length === 0 ? (
        <EmptyState message="暂无检验指标" icon="📊" />
      ) : (
        groups.map(g => (
          <div
            key={g.name}
            className="card"
            onClick={() => navigate(`/indicators/chart/${encodeURIComponent(g.name)}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{g.name}</div>
                <div style={{ fontSize: 12, color: '#999' }}>
                  {getCategoryLabel(g.latest.category)} · 共{g.count}次检测
                  {g.abnormal > 0 && <span style={{ color: '#ff3141' }}> · {g.abnormal}次异常</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: g.latest.isAbnormal ? '#ff3141' : '#00b578',
                }}>
                  {g.latest.value}
                </div>
                <div style={{ fontSize: 11, color: '#999' }}>{g.latest.unit}</div>
              </div>
            </div>
            {g.latest.referenceMin != null && g.latest.referenceMax != null && (
              <div style={{
                fontSize: 10,
                color: '#999',
                marginTop: 8,
                paddingTop: 8,
                borderTop: '1px solid #f0f0f0',
              }}>
                参考范围: {g.latest.referenceMin}~{g.latest.referenceMax} {g.latest.unit}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default IndicatorListPage
