import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Loading from '@/components/common/Loading'
import { reportService } from '@/services/reportService'
import { formatDate } from '@/utils/date'
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
    // Use native confirm for reliability on mobile
    if (window.confirm('确定要删除这张照片吗？')) {
      reportService.remove(Number(id)).then(result => {
        if (result.success) {
          navigate('/reports', { replace: true })
        } else {
          alert('删除失败: ' + result.error)
        }
      })
    }
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
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Image Area - takes remaining space, pinch zoom works here */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          touchAction: 'none',
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

      {/* Bottom bar - completely separate from touch area, always clickable */}
      <div style={{
        background: '#1a1a1a',
        padding: '12px 16px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ color: '#fff', fontSize: 13, opacity: 0.9, flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{report.title}</div>
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
            {REPORT_CATEGORIES.find(c => c.value === report.category)?.label} · {formatDate(report.reportDate)}
          </div>
        </div>
        <button
          onClick={handleDelete}
          style={{
            background: '#ff3141',
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            flexShrink: 0,
            marginLeft: 12,
            touchAction: 'manipulation',
          }}
        >
          删除
        </button>
      </div>
    </div>
  )
}

export default ReportViewPage
