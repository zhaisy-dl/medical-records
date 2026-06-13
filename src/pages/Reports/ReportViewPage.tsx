import { useEffect, useState, useRef, useCallback } from 'react'
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

  // Smooth zoom & pan using CSS transform with requestAnimationFrame
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const scaleRef = useRef(1)
  const posRef = useRef({ x: 0, y: 0 })
  const [renderScale, setRenderScale] = useState(1)
  const [renderPos, setRenderPos] = useState({ x: 0, y: 0 })

  // Touch tracking refs (no React state for 60fps)
  const touchState = useRef<{
    type: 'none' | 'drag' | 'pinch'
    startDist: number
    startScale: number
    startPos: { x: number; y: number }
    dragStart: { x: number; y: number }
    posAtStart: { x: number; y: number }
    lastPinchCenter: { x: number; y: number }
  }>({
    type: 'none',
    startDist: 0,
    startScale: 1,
    startPos: { x: 0, y: 0 },
    dragStart: { x: 0, y: 0 },
    posAtStart: { x: 0, y: 0 },
    lastPinchCenter: { x: 0, y: 0 },
  })

  // Animation frame ID
  const rafRef = useRef<number>(0)

  const clampScale = (s: number) => Math.min(5, Math.max(0.8, s))
  const clampPos = useCallback((p: { x: number; y: number }, s: number) => {
    // Allow generous pan range when zoomed
    const maxPan = (s - 1) * 300
    if (s <= 1) return { x: 0, y: 0 }
    return {
      x: Math.min(maxPan, Math.max(-maxPan, p.x)),
      y: Math.min(maxPan, Math.max(-maxPan, p.y)),
    }
  }, [])

  const applyTransform = useCallback(() => {
    const s = scaleRef.current
    const p = posRef.current
    setRenderScale(s)
    setRenderPos(p)
  }, [])

  useEffect(() => {
    if (id) {
      reportService.getById(Number(id)).then(r => {
        if (r) setReport(r)
        setLoading(false)
      })
    }
  }, [id])

  const handleDelete = () => {
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

  // Double tap to zoom in/out
  const lastTapRef = useRef(0)
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      // Double tap
      if (scaleRef.current > 1.5) {
        scaleRef.current = 1
        posRef.current = { x: 0, y: 0 }
      } else {
        scaleRef.current = 2.5
        posRef.current = { x: 0, y: 0 }
      }
      applyTransform()
    }
    lastTapRef.current = now
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2
      touchState.current = {
        type: 'pinch',
        startDist: Math.hypot(dx, dy),
        startScale: scaleRef.current,
        startPos: { ...posRef.current },
        dragStart: { x: 0, y: 0 },
        posAtStart: { ...posRef.current },
        lastPinchCenter: { x: cx, y: cy },
      }
    } else if (e.touches.length === 1) {
      touchState.current = {
        type: 'drag',
        startDist: 0,
        startScale: scaleRef.current,
        startPos: { ...posRef.current },
        dragStart: { x: e.touches[0].clientX, y: e.touches[0].clientY },
        posAtStart: { ...posRef.current },
        lastPinchCenter: { x: 0, y: 0 },
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()

    if (e.touches.length === 2 && touchState.current.type === 'pinch') {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2

      // Scale around pinch center
      const newScale = clampScale(touchState.current.startScale * (dist / touchState.current.startDist))
      const scaleDiff = newScale / touchState.current.startScale

      // Move position to keep pinch center stationary
      const newX = cx - touchState.current.lastPinchCenter.x + touchState.current.startPos.x * scaleDiff
      const newY = cy - touchState.current.lastPinchCenter.y + touchState.current.startPos.y * scaleDiff

      scaleRef.current = newScale
      posRef.current = clampPos({ x: newX, y: newY }, newScale)
      touchState.current.lastPinchCenter = { x: cx, y: cy }
      touchState.current.startPos = { ...posRef.current }
      touchState.current.startScale = newScale
      touchState.current.startDist = dist

      applyTransform()
    } else if (e.touches.length === 1 && touchState.current.type === 'drag') {
      const dx = e.touches[0].clientX - touchState.current.dragStart.x
      const dy = e.touches[0].clientY - touchState.current.dragStart.y
      const newPos = {
        x: touchState.current.posAtStart.x + dx,
        y: touchState.current.posAtStart.y + dy,
      }
      posRef.current = clampPos(newPos, scaleRef.current)
      applyTransform()
    }
  }

  const handleTouchEnd = () => {
    // Snap back if scale <= 1
    if (scaleRef.current <= 1) {
      scaleRef.current = 1
      posRef.current = { x: 0, y: 0 }
      applyTransform()
    }
    touchState.current.type = 'none'
  }

  if (loading) return <Loading />
  if (!report) return <div className="page-container">报告不存在</div>

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      overscrollBehavior: 'none',
    }}>
      {/* Image Area */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          touchAction: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        <img
          ref={imgRef}
          src={report.fileData}
          alt={report.title}
          draggable={false}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '100%',
            objectFit: 'contain',
            transform: `translate3d(${renderPos.x}px, ${renderPos.y}px, 0) scale(${renderScale})`,
            transition: touchState.current.type === 'none' && renderScale === 1
              ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              : 'none',
            willChange: touchState.current.type !== 'none' ? 'transform' : 'auto',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Bottom bar */}
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
