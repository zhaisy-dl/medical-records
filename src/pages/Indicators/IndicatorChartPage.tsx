import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from 'antd-mobile'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import PageHeader from '@/components/Layout/PageHeader'
import Loading from '@/components/common/Loading'
import { indicatorService } from '@/services/indicatorService'
import { formatDate } from '@/utils/date'
import type { Indicator } from '@/db/schema'

const IndicatorChartPage = () => {
  const { name } = useParams<{ name: string }>()
  const navigate = useNavigate()
  const decodedName = decodeURIComponent(name || '')
  const [data, setData] = useState<Indicator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (decodedName) {
      indicatorService.getTrend(decodedName).then(d => {
        setData(d)
        setLoading(false)
      })
    }
  }, [decodedName])

  if (loading) return <Loading />
  if (data.length === 0) return <div className="page-container">暂无数据</div>

  const latest = data[data.length - 1]
  const refMin = latest.referenceMin
  const refMax = latest.referenceMax

  const chartData = data.map(d => ({
    date: formatDate(d.testDate),
    value: d.value,
    isAbnormal: d.isAbnormal,
  }))

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5', paddingBottom: 80 }}>
      <PageHeader title={`${decodedName} · 趋势图`} />

      <div className="page-container">
        {/* Latest Value */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#999' }}>最新值 ({formatDate(latest.testDate)})</div>
          <div style={{
            fontSize: 36,
            fontWeight: 700,
            color: latest.isAbnormal ? '#ff3141' : '#00b578',
            marginTop: 4,
          }}>
            {latest.value}
            <span style={{ fontSize: 16, fontWeight: 400, color: '#999', marginLeft: 4 }}>{latest.unit}</span>
          </div>
          {refMin != null && refMax != null && (
            <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
              参考范围: {refMin} ~ {refMax} {latest.unit}
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="card" style={{ padding: '12px 8px' }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 12 }}
              />
              {refMin != null && (
                <ReferenceLine y={refMin} stroke="#ff8f1f" strokeDasharray="5 5" strokeWidth={1} label={{ value: '下限', fontSize: 10, fill: '#ff8f1f' }} />
              )}
              {refMax != null && (
                <ReferenceLine y={refMax} stroke="#ff8f1f" strokeDasharray="5 5" strokeWidth={1} label={{ value: '上限', fontSize: 10, fill: '#ff8f1f' }} />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#1677ff"
                strokeWidth={2}
                dot={{ r: 4, fill: '#1677ff' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* History Table */}
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>检测记录</div>
          {data.slice().reverse().map(d => (
            <div
              key={d.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #f5f5f5',
                fontSize: 13,
              }}
              onClick={() => navigate(`/indicators/${d.id}/edit`)}
            >
              <div>
                <span style={{ fontWeight: 500 }}>{d.value} {d.unit}</span>
                <span style={{ color: '#999', marginLeft: 8 }}>{formatDate(d.testDate)}</span>
                {d.labName && <span style={{ color: '#ccc', marginLeft: 8 }}>{d.labName}</span>}
              </div>
              <span className={`abnormal-badge ${d.isAbnormal ? 'high' : 'normal'}`}>
                {d.isAbnormal ? '异常' : '正常'}
              </span>
            </div>
          ))}
        </div>

        <Button
          block
          color="primary"
          fill="outline"
          onClick={() => navigate(`/indicators/new?name=${encodeURIComponent(decodedName)}`)}
        >
          新增{decodedName}记录
        </Button>
      </div>
    </div>
  )
}

export default IndicatorChartPage
