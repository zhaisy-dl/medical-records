import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Dialog, Toast } from 'antd-mobile'
import { DeleteOutline } from 'antd-mobile-icons'
import PageHeader from '@/components/Layout/PageHeader'
import Loading from '@/components/common/Loading'
import { reportService } from '@/services/reportService'
import { formatDate } from '@/utils/date'
import { formatFileSize } from '@/services/imageService'
import { REPORT_CATEGORIES } from '@/utils/constants'
import type { Report } from '@/db/schema'

const ReportViewPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(false)

  useEffect(() => {
    if (id) {
      reportService.getById(Number(id)).then(r => {
        if (r) setReport(r)
        setLoading(false)
      })
    }
  }, [id])

  const handleDelete = () => {
    Dialog.confirm({
      title: '确认删除',
      content: '确定要删除这张照片吗？',
      onConfirm: async () => {
        const result = await reportService.remove(Number(id))
        if (result.success) {
          Toast.show({ icon: 'success', content: '已删除' })
          navigate('/reports', { replace: true })
        }
      },
    })
  }

  if (loading) return <Loading />
  if (!report) return <div className="page-container">报告不存在</div>

  return (
    <div style={{ minHeight: '100dvh', background: '#000' }}>
      {/* Image Area */}
      <div
        style={{
          width: '100%',
          height: '70dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          cursor: zoom ? 'zoom-out' : 'zoom-in',
        }}
        onClick={() => setZoom(!zoom)}
      >
        <img
          src={report.fileData}
          alt={report.title}
          style={{
            maxWidth: zoom ? '200%' : '100%',
            maxHeight: zoom ? '200%' : '100%',
            objectFit: zoom ? 'none' : 'contain',
            transition: 'all 0.2s',
          }}
        />
      </div>

      {/* Info */}
      <div style={{
        background: '#1a1a1a',
        padding: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        marginTop: -16,
        position: 'relative',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>{report.title}</div>
          <Button size="small" fill="none" color="danger" onClick={handleDelete}>
            <DeleteOutline />
          </Button>
        </div>
        <div style={{ color: '#999', fontSize: 12, display: 'flex', gap: 12 }}>
          <span>{REPORT_CATEGORIES.find(c => c.value === report.category)?.label || report.category}</span>
          <span>{formatDate(report.reportDate)}</span>
          <span>{formatFileSize(report.fileSize)}</span>
        </div>
        {report.description && (
          <div style={{ color: '#ccc', fontSize: 13, marginTop: 8 }}>{report.description}</div>
        )}
      </div>
    </div>
  )
}

export default ReportViewPage
