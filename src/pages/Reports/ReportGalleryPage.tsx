import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, ActionSheet, Toast } from 'antd-mobile'
import { CameraOutline } from 'antd-mobile-icons'
import EmptyState from '@/components/common/EmptyState'
import Loading from '@/components/common/Loading'
import { reportService } from '@/services/reportService'
import { useCamera } from '@/hooks/useCamera'
import { formatDate } from '@/utils/date'
import { formatFileSize } from '@/services/imageService'
import { REPORT_CATEGORIES } from '@/utils/constants'
import type { Report } from '@/db/schema'

const ReportGalleryPage = () => {
  const navigate = useNavigate()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [totalSize, setTotalSize] = useState(0)
  const [sheetVisible, setSheetVisible] = useState(false)
  const { capturing, openCamera, openGallery } = useCamera()

  const loadData = async () => {
    setLoading(true)
    const [data, size] = await Promise.all([
      reportService.list(),
      reportService.getTotalSize(),
    ])
    setReports(data)
    setTotalSize(size)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCapture = async () => {
    setSheetVisible(false)
    const result = await openCamera()
    if (result) {
      // Create with minimal info first, user can edit later
      const createResult = await reportService.create({
        title: result.fileName,
        category: 'other',
        fileData: result.dataUrl,
        thumbnailData: result.thumbnail,
        mimeType: result.mimeType,
        fileSize: result.fileSize,
        reportDate: new Date(),
        description: '',
      })
      if (createResult.success) {
        Toast.show({ icon: 'success', content: '已保存' })
        loadData()
      } else {
        Toast.show({ icon: 'fail', content: createResult.error })
      }
    }
  }

  const handleGallery = async () => {
    setSheetVisible(false)
    const result = await openGallery()
    if (result) {
      const createResult = await reportService.create({
        title: result.fileName,
        category: 'other',
        fileData: result.dataUrl,
        thumbnailData: result.thumbnail,
        mimeType: result.mimeType,
        fileSize: result.fileSize,
        reportDate: new Date(),
        description: '',
      })
      if (createResult.success) {
        Toast.show({ icon: 'success', content: '已保存' })
        loadData()
      } else {
        Toast.show({ icon: 'fail', content: createResult.error })
      }
    }
  }

  const handleDelete = (id: number) => {
    ActionSheet.show({
      actions: [
        { text: '删除', key: 'delete', danger: true },
      ],
      onAction: async (action) => {
        if (action.key === 'delete') {
          const result = await reportService.remove(id)
          if (result.success) {
            Toast.show({ icon: 'success', content: '已删除' })
            loadData()
          }
        }
      },
    })
  }

  const getCatLabel = (cat: Report['category']) => {
    return REPORT_CATEGORIES.find(c => c.value === cat)?.label || cat
  }

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>报告照片</h2>
          <div style={{ fontSize: 11, color: '#999' }}>已用 {formatFileSize(totalSize)}</div>
        </div>
        <Button size="small" color="primary" onClick={() => setSheetVisible(true)} loading={capturing}>
          <CameraOutline /> 拍照
        </Button>
      </div>

      {loading ? (
        <Loading />
      ) : reports.length === 0 ? (
        <EmptyState message="还没有报告照片" icon="📷" />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
        }}>
          {reports.map(r => (
            <div
              key={r.id}
              style={{
                position: 'relative',
                borderRadius: 8,
                overflow: 'hidden',
                aspectRatio: '1',
                background: '#f0f0f0',
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/reports/${r.id}`)}
              onContextMenu={e => {
                e.preventDefault()
                handleDelete(r.id!)
              }}
            >
              {r.thumbnailData ? (
                <img src={r.thumbnailData} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  color: '#ccc',
                }}>
                  📄
                </div>
              )}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                fontSize: 10,
                padding: '4px 6px',
                lineHeight: 1.2,
              }}>
                <div style={{ opacity: 0.8 }}>{getCatLabel(r.category)}</div>
                <div>{formatDate(r.reportDate)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Photo Sheet */}
      <ActionSheet
        visible={sheetVisible}
        actions={[
          { text: '📷 拍照', key: 'camera' },
          { text: '🖼️ 从相册选择', key: 'gallery' },
        ]}
        onClose={() => setSheetVisible(false)}
        onAction={action => {
          if (action.key === 'camera') handleCapture()
          else if (action.key === 'gallery') handleGallery()
        }}
      />
    </div>
  )
}

export default ReportGalleryPage
