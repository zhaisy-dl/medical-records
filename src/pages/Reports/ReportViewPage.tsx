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

  // Pinch-to-zoom state
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [lastTouch, setLastTouch] = useState<{ dist: number; x: number; y: number } | null>(null)
  const [moving, setMoving] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number; px: number; py: number } | null>(null)

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

  const handleDoubleClick = () => {
    if (scale > 1.5) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    } else {
      setScale(2.5)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2
      setLastTouch({ dist, x: cx, y: cy })
    } else if (e.touches.length === 1 && scale > 1) {
      setMoving(true)
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY, px: position.x, py: position.y })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouch) {
      e.preventDefault()
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const scaleChange = dist / lastTouch.dist
      setScale(prev => Math.min(5, Math.max(0.5, prev * scaleChange)))
      setLastTouch({ dist, x: lastTouch.x, y: lastTouch.y })
    } else if (e.touches.length === 1 && moving && dragStart) {
      const dx = e.touches[0].clientX - dragStart.x
      const dy = e.touches[0].clientY - dragStart.y
      setPosition({ x: dragStart.px + dx, y: dragStart.py + dy })
    }
  }

  const handleTouchEnd = () => {
    setLastTouch(null)
    setMoving(false)
    setDragStart(null)
  }

  if (loading) return <Loading />
  if (!report) return <div className="page-container">报告不存在</div>

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#000',
      overflow: 'hidden',
      position: 'relative',
      touchAction: 'none',
    }}>
      {/* Image Area - full screen */}
      <div
        style={{
          width: '100%',
          height: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
      >
        <img
          src={report.fileData}
          alt={report.title}
          draggable={false}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '100%',
            objectFit: 'contain',
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: lastTouch ? 'none' : 'transform 0.2s ease-out',
          }}
        />
      </div>

      {/* Bottom bar overlay */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
        padding: '40px 16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      }}>
        <div style={{ color: '#fff', fontSize: 13, opacity: 0.9 }}>
          <div style={{ fontWeight: 600 }}>{report.title}</div>
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
            {REPORT_CATEGORIES.find(c => c.value === report.category)?.label} · {formatDate(report.reportDate)}
          </div>
        </div>
        <Button size="small" fill="none" style={{ color: '#ff6b6b' }} onClick={handleDelete}>
          <DeleteOutline />
        </Button>
      </div>
    </div>
  )
}

export default ReportViewPage
