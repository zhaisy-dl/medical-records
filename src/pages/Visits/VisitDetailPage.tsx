import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Dialog, Toast } from 'antd-mobile'
import { EditFill, DeleteOutline } from 'antd-mobile-icons'
import PageHeader from '@/components/Layout/PageHeader'
import Loading from '@/components/common/Loading'
import { visitService } from '@/services/visitService'
import { medicationService } from '@/services/medicationService'
import { indicatorService } from '@/services/indicatorService'
import { reportService } from '@/services/reportService'
import { formatDate } from '@/utils/date'
import type { Visit, Medication, Indicator, Report } from '@/db/schema'

const VisitDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [visit, setVisit] = useState<Visit | null>(null)
  const [medications, setMedications] = useState<Medication[]>([])
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!id) return
    setLoading(true)
    const [v, meds, inds, reps] = await Promise.all([
      visitService.getById(Number(id)),
      medicationService.listByVisit(Number(id)),
      indicatorService.listByVisit(Number(id)),
      reportService.listByVisit(Number(id)),
    ])
    if (v) setVisit(v)
    setMedications(meds)
    setIndicators(inds)
    setReports(reps)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleDelete = () => {
    Dialog.confirm({
      title: '确认删除',
      content: '删除后相关用药、指标、报告也会一并删除，确定吗？',
      onConfirm: async () => {
        const result = await visitService.remove(Number(id))
        if (result.success) {
          Toast.show({ icon: 'success', content: '已删除' })
          navigate('/visits', { replace: true })
        }
      },
    })
  }

  if (loading) return <Loading />
  if (!visit) return <div className="page-container">就诊记录不存在</div>

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5', paddingBottom: 80 }}>
      <PageHeader
        title="就诊详情"
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="small" fill="none" onClick={() => navigate(`/visits/${id}/edit`)}>
              <EditFill />
            </Button>
            <Button size="small" fill="none" color="danger" onClick={handleDelete}>
              <DeleteOutline />
            </Button>
          </div>
        }
      />

      <div className="page-container">
        {/* Basic Info */}
        <div className="card">
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{visit.hospitalName}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
            <div>
              <span style={{ color: '#999' }}>就诊日期: </span>
              <span>{formatDate(visit.visitDate)}</span>
            </div>
            <div>
              <span style={{ color: '#999' }}>科室: </span>
              <span>{visit.department}</span>
            </div>
            {visit.doctorName && (
              <div>
                <span style={{ color: '#999' }}>医生: </span>
                <span>{visit.doctorName}</span>
              </div>
            )}
            {visit.followUpDate && (
              <div>
                <span style={{ color: '#999' }}>复诊日期: </span>
                <span style={{ color: '#1677ff' }}>{formatDate(visit.followUpDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Complaint / Diagnosis / Treatment */}
        {visit.chiefComplaint && (
          <div className="card">
            <div style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>主诉</div>
            <div style={{ fontSize: 14 }}>{visit.chiefComplaint}</div>
          </div>
        )}
        {visit.diagnosis && (
          <div className="card">
            <div style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>诊断</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{visit.diagnosis}</div>
          </div>
        )}
        {visit.treatment && (
          <div className="card">
            <div style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>治疗方案</div>
            <div style={{ fontSize: 14 }}>{visit.treatment}</div>
          </div>
        )}

        {/* Related Medications */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: medications.length > 0 ? 8 : 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>关联用药</div>
            <Button
              size="mini"
              color="primary"
              fill="none"
              onClick={() => navigate(`/medications/new?visitId=${id}`)}
            >
              添加
            </Button>
          </div>
          {medications.length === 0 ? (
            <div style={{ fontSize: 12, color: '#ccc' }}>暂无</div>
          ) : (
            medications.map(m => (
              <div
                key={m.id}
                style={{
                  padding: '8px 0',
                  borderBottom: '1px solid #f5f5f5',
                  fontSize: 13,
                }}
                onClick={() => navigate(`/medications/${m.id}`)}
              >
                <span style={{ fontWeight: 500 }}>{m.name}</span>
                <span style={{ color: '#666', marginLeft: 8 }}>{m.dosage} · {m.frequency}</span>
                <span style={{
                  marginLeft: 8,
                  fontSize: 11,
                  color: m.status === 'active' ? '#00b578' : '#999',
                }}>
                  {m.status === 'active' ? '进行中' : m.status === 'discontinued' ? '已停用' : '已完成'}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Related Indicators */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: indicators.length > 0 ? 8 : 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>关联指标</div>
            <Button
              size="mini"
              color="primary"
              fill="none"
              onClick={() => navigate(`/indicators/new?visitId=${id}`)}
            >
              添加
            </Button>
          </div>
          {indicators.length === 0 ? (
            <div style={{ fontSize: 12, color: '#ccc' }}>暂无</div>
          ) : (
            indicators.map(ind => (
              <div
                key={ind.id}
                style={{
                  padding: '8px 0',
                  borderBottom: '1px solid #f5f5f5',
                  fontSize: 13,
                }}
              >
                <span style={{ fontWeight: 500 }}>{ind.name}</span>
                <span style={{ color: '#666', marginLeft: 8 }}>
                  {ind.value} {ind.unit}
                </span>
                <span className={`abnormal-badge ${ind.isAbnormal ? 'high' : 'normal'}`} style={{ marginLeft: 8 }}>
                  {ind.isAbnormal ? '异常' : '正常'}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Related Reports */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: reports.length > 0 ? 8 : 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>关联报告</div>
            <Button
              size="mini"
              color="primary"
              fill="none"
              onClick={() => navigate(`/reports/new?visitId=${id}`)}
            >
              添加
            </Button>
          </div>
          {reports.length === 0 ? (
            <div style={{ fontSize: 12, color: '#ccc' }}>暂无</div>
          ) : (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
              {reports.map(r => (
                <div
                  key={r.id}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: '#f0f0f0',
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/reports/${r.id}`)}
                >
                  {r.thumbnailData ? (
                    <img src={r.thumbnailData} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#ccc' }}>
                      📄
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        {visit.notes && (
          <div className="card">
            <div style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>备注</div>
            <div style={{ fontSize: 13, color: '#666' }}>{visit.notes}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VisitDetailPage
