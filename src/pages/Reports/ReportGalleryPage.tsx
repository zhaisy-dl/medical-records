import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Toast } from 'antd-mobile'
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

  const handleAdd = () => {
    // Simple inline action sheet
    const div = document.createElement('div')
    div.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#fff;border-radius:16px 16px 0 0;padding:20px;box-shadow:0 -4px 20px rgba(0,0,0,0.2)'

    const mask = document.createElement('div')
    mask.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.4)'
    mask.onclick = () => { document.body.removeChild(div); document.body.removeChild(mask) }

    const btnStyle = 'display:block;width:100%;padding:14px;border:none;background:#f5f5f5;border-radius:10px;margin-bottom:8px;font-size:16px;text-align:center;cursor:pointer'

    const cameraBtn = document.createElement('button')
    cameraBtn.textContent = '📷 拍照'
    cameraBtn.style.cssText = btnStyle
    cameraBtn.onclick = async () => {
      document.body.removeChild(div); document.body.removeChild(mask)
      const result = await openCamera()
      if (result) {
        await reportService.create({
          title: result.fileName,
          category: 'other',
          fileData: result.dataUrl,
          thumbnailData: result.thumbnail,
          mimeType: result.mimeType,
          fileSize: result.fileSize,
          reportDate: new Date(),
          description: '',
        })
        Toast.show({ icon: 'success', content: '已保存' })
        loadData()
      }
    }

    const galleryBtn = document.createElement('button')
    galleryBtn.textContent = '🖼️ 从相册选择'
    galleryBtn.style.cssText = btnStyle
    galleryBtn.onclick = async () => {
      document.body.removeChild(div); document.body.removeChild(mask)
      const result = await openGallery()
      if (result) {
        await reportService.create({
          title: result.fileName,
          category: 'other',
          fileData: result.dataUrl,
          thumbnailData: result.thumbnail,
          mimeType: result.mimeType,
          fileSize: result.fileSize,
          reportDate: new Date(),
          description: '',
        })
        Toast.show({ icon: 'success', content: '已保存' })
        loadData()
      }
    }

    const cancelBtn = document.createElement('button')
    cancelBtn.textContent = '取消'
    cancelBtn.style.cssText = btnStyle + 'background:#fff;border:1px solid #eee'
    cancelBtn.onclick = () => { document.body.removeChild(div); document.body.removeChild(mask) }

    div.appendChild(cameraBtn)
    div.appendChild(galleryBtn)
    div.appendChild(cancelBtn)
    document.body.appendChild(mask)
    document.body.appendChild(div)
  }

  const handleLongPress = (id: number) => {
    const div = document.createElement('div')
    div.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#fff;border-radius:16px 16px 0 0;padding:20px;box-shadow:0 -4px 20px rgba(0,0,0,0.2)'

    const mask = document.createElement('div')
    mask.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.4)'
    mask.onclick = () => { document.body.removeChild(div); document.body.removeChild(mask) }

    const btnStyle = 'display:block;width:100%;padding:14px;border:none;background:#f5f5f5;border-radius:10px;margin-bottom:8px;font-size:16px;text-align:center;cursor:pointer'

    const delBtn = document.createElement('button')
    delBtn.textContent = '🗑️ 删除'
    delBtn.style.cssText = btnStyle + 'color:#ff3141'
    delBtn.onclick = async () => {
      document.body.removeChild(div); document.body.removeChild(mask)
      const result = await reportService.remove(id)
      if (result.success) { Toast.show({ icon: 'success', content: '已删除' }); loadData() }
    }

    const cancelBtn = document.createElement('button')
    cancelBtn.textContent = '取消'
    cancelBtn.style.cssText = btnStyle + 'background:#fff;border:1px solid #eee'
    cancelBtn.onclick = () => { document.body.removeChild(div); document.body.removeChild(mask) }

    div.appendChild(delBtn)
    div.appendChild(cancelBtn)
    document.body.appendChild(mask)
    document.body.appendChild(div)
  }

  const getCatLabel = (cat: Report['category']) => {
    return REPORT_CATEGORIES.find(c => c.value === cat)?.label || cat
  }

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>报告照片</h2>
          <div style={{ fontSize: 11, color: '#999' }}>已用 {formatFileSize(totalSize)}</div>
        </div>
        <Button size="small" color="primary" onClick={handleAdd} loading={capturing}>
          <CameraOutline /> 添加
        </Button>
      </div>

      {loading ? (
        <Loading />
      ) : reports.length === 0 ? (
        <EmptyState message="还没有报告照片" icon="📷" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {reports.map(r => (
            <div
              key={r.id}
              style={{
                position: 'relative',
                borderRadius: 8,
                overflow: 'hidden',
                aspectRatio: '1',
                background: '#f0f0f0',
              }}
            >
              {r.thumbnailData ? (
                <img
                  src={r.thumbnailData}
                  alt={r.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onClick={() => navigate(`/reports/${r.id}`)}
                  onContextMenu={e => { e.preventDefault(); handleLongPress(r.id!) }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, color: '#ccc',
                }}>
                  📄
                </div>
              )}
              <div style={{
                position: 'absolute',
                bottom: 0, left: 0, right: 0,
                background: 'rgba(0,0,0,0.5)',
                color: '#fff', fontSize: 10,
                padding: '4px 6px', lineHeight: 1.2,
              }}>
                <div style={{ opacity: 0.8 }}>{getCatLabel(r.category)}</div>
                <div>{formatDate(r.reportDate)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ReportGalleryPage
