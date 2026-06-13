import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Form, Input, TextArea, DatePicker, Button, Picker, Dialog, Toast, ImageViewer, SpinLoading } from 'antd-mobile'
import { DeleteOutline, CameraOutline } from 'antd-mobile-icons'
import PageHeader from '@/components/Layout/PageHeader'
import { visitService } from '@/services/visitService'
import { reportService } from '@/services/reportService'
import { reminderService } from '@/services/reminderService'
import { useCamera } from '@/hooks/useCamera'
import { useAI } from '@/hooks/useAI'
import { DEPARTMENTS } from '@/utils/constants'
import type { Visit } from '@/db/schema'

const deptColumns = [DEPARTMENTS.map(d => ({ label: d, value: d }))]

const VisitFormPage = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [deptVisible, setDeptVisible] = useState(false)
  const [followUpVisible, setFollowUpVisible] = useState(false)
  const [visitDateVisible, setVisitDateVisible] = useState(false)

  // AI state
  const { loading: aiLoading, progress: aiProgress, progressPct: aiPct, ocrReport } = useAI()

  // Photo report state
  const [attachedPhoto, setAttachedPhoto] = useState<{
    dataUrl: string
    thumbnail: string
    fileName: string
    fileSize: number
  } | null>(null)
  const [viewerVisible, setViewerVisible] = useState(false)
  const { capturing, openCamera, openGallery } = useCamera()

  const [formData, setFormData] = useState({
    visitDate: new Date(),
    hospitalName: '',
    department: '',
    doctorName: '',
    chiefComplaint: '',
    diagnosis: '',
    treatment: '',
    followUpDate: undefined as Date | undefined,
    notes: '',
  })

  // Load existing data for editing
  useEffect(() => {
    if (id) {
      visitService.getById(Number(id)).then(visit => {
        if (visit) {
          setFormData({
            visitDate: new Date(visit.visitDate),
            hospitalName: visit.hospitalName,
            department: visit.department,
            doctorName: visit.doctorName,
            chiefComplaint: visit.chiefComplaint,
            diagnosis: visit.diagnosis,
            treatment: visit.treatment,
            followUpDate: visit.followUpDate ? new Date(visit.followUpDate) : undefined,
            notes: visit.notes,
          })
        }
      })
    }
  }, [id])

  const handleSubmit = async () => {
    if (!formData.hospitalName.trim()) {
      Toast.show({ icon: 'fail', content: '请填写医院名称' })
      return
    }
    if (!formData.department) {
      Toast.show({ icon: 'fail', content: '请选择科室' })
      return
    }

    setLoading(true)
    const data = {
      ...formData,
      visitDate: formData.visitDate,
      chiefComplaint: formData.chiefComplaint || '',
      diagnosis: formData.diagnosis || '',
      treatment: formData.treatment || '',
      notes: formData.notes || '',
    }

    const result = isEdit
      ? await visitService.update(Number(id), data)
      : await visitService.create(data)

    if (result.success) {
      const visitId = isEdit ? Number(id) : result.data

      // Save attached photo as report
      if (attachedPhoto && visitId) {
        await reportService.create({
          title: `就诊报告_${formData.diagnosis || formData.hospitalName}`,
          category: 'other',
          fileData: attachedPhoto.dataUrl,
          thumbnailData: attachedPhoto.thumbnail,
          mimeType: 'image/jpeg',
          fileSize: attachedPhoto.fileSize,
          reportDate: formData.visitDate,
          visitId,
          description: formData.diagnosis || '',
        })
      }

      // Auto-create follow-up reminder if followUpDate is set
      if (formData.followUpDate && visitId) {
        await reminderService.create({
          title: `复诊提醒 · ${formData.hospitalName}`,
          type: 'followUp',
          reminderDate: formData.followUpDate,
          reminderTime: '09:00',
          repeatType: 'none',
          isActive: true,
          isCompleted: false,
          relatedType: 'visit',
          relatedId: visitId,
          notes: formData.diagnosis || '',
        })
      }

      Toast.show({ icon: 'success', content: isEdit ? '已更新' : '已保存' })
      navigate(-1)
    } else {
      Toast.show({ icon: 'fail', content: result.error })
    }
    setLoading(false)
  }

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

  const handleCapture = useCallback(async () => {
    const result = await openCamera()
    if (result) {
      setAttachedPhoto({
        dataUrl: result.dataUrl,
        thumbnail: result.thumbnail,
        fileName: result.fileName,
        fileSize: result.fileSize,
      })
      Toast.show({ icon: 'success', content: '照片已添加，正在OCR识别...' })

      // Auto OCR the captured image
      try {
        const fields = await ocrReport(result.dataUrl)
        if (Object.keys(fields).length > 0) {
          setFormData(p => ({
            ...p,
            hospitalName: fields.hospitalName || p.hospitalName,
            diagnosis: fields.diagnosis || p.diagnosis,
            doctorName: fields.doctorName || p.doctorName,
          }))
          Toast.show({ icon: 'success', content: `OCR识别完成，已自动填入${Object.keys(fields).length}个字段` })
        }
      } catch {
        // OCR failed silently, photo still saved
      }
    }
  }, [openCamera, ocrReport])

  const handlePickGallery = useCallback(async () => {
    const result = await openGallery()
    if (result) {
      setAttachedPhoto({
        dataUrl: result.dataUrl,
        thumbnail: result.thumbnail,
        fileName: result.fileName,
        fileSize: result.fileSize,
      })
      Toast.show({ icon: 'success', content: '照片已添加，正在OCR识别...' })

      try {
        const fields = await ocrReport(result.dataUrl)
        if (Object.keys(fields).length > 0) {
          setFormData(p => ({
            ...p,
            hospitalName: fields.hospitalName || p.hospitalName,
            diagnosis: fields.diagnosis || p.diagnosis,
            doctorName: fields.doctorName || p.doctorName,
          }))
          Toast.show({ icon: 'success', content: `OCR识别完成，已自动填入${Object.keys(fields).length}个字段` })
        }
      } catch {
        // OCR failed silently
      }
    }
  }, [openGallery, ocrReport])

  const handlePhotoSheet = () => {
    // Use native buttons for reliable touch on mobile
    const div = document.createElement('div')
    div.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#fff;border-radius:16px 16px 0 0;padding:20px;box-shadow:0 -4px 20px rgba(0,0,0,0.2);font-family:system-ui'

    const mask = document.createElement('div')
    mask.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.4)'
    mask.onclick = () => { document.body.removeChild(div); document.body.removeChild(mask) }

    const btnStyle = 'display:block;width:100%;padding:16px;border:none;background:#f5f5f5;border-radius:12px;margin-bottom:8px;font-size:16px;text-align:center'

    const cameraBtn = document.createElement('button')
    cameraBtn.textContent = '📷 拍照'
    cameraBtn.style.cssText = btnStyle
    cameraBtn.onclick = async () => {
      document.body.removeChild(div); document.body.removeChild(mask)
      handleCapture()
    }

    const galleryBtn = document.createElement('button')
    galleryBtn.textContent = '🖼️ 从相册选'
    galleryBtn.style.cssText = btnStyle
    galleryBtn.onclick = async () => {
      document.body.removeChild(div); document.body.removeChild(mask)
      handlePickGallery()
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

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5' }}>
      <PageHeader
        title={isEdit ? '编辑就诊' : '新增就诊'}
        right={isEdit ? (
          <Button size="small" fill="none" color="danger" onClick={handleDelete}>
            <DeleteOutline />
          </Button>
        ) : undefined}
      />

      <div className="page-container">
        <Form layout="horizontal" style={{ '--border-inner': 'none' } as React.CSSProperties}>
          {/* 就诊日期 - use direct button for reliability */}
          <Form.Item label="就诊日期" required>
            <div
              onClick={() => setVisitDateVisible(true)}
              style={{ color: '#333', cursor: 'pointer', padding: '8px 0' }}
            >
              {formData.visitDate.toLocaleDateString('zh-CN')}
            </div>
          </Form.Item>

          <Form.Item label="医院名称" required>
            <Input
              placeholder="如：协和医院"
              value={formData.hospitalName}
              onChange={val => setFormData(p => ({ ...p, hospitalName: val }))}
            />
          </Form.Item>

          <Form.Item label="科室" required onClick={() => setDeptVisible(true)}>
            <span style={{ color: formData.department ? '#333' : '#ccc' }}>
              {formData.department || '请选择科室'}
            </span>
          </Form.Item>

          <Form.Item label="医生姓名">
            <Input
              placeholder="可选"
              value={formData.doctorName}
              onChange={val => setFormData(p => ({ ...p, doctorName: val }))}
            />
          </Form.Item>

          <Form.Item label="主诉">
            <TextArea
              placeholder="如：胸闷气短3天"
              rows={2}
              value={formData.chiefComplaint}
              onChange={val => setFormData(p => ({ ...p, chiefComplaint: val }))}
            />
          </Form.Item>

          <Form.Item label="诊断结果">
            <TextArea
              placeholder="医生的诊断"
              rows={2}
              value={formData.diagnosis}
              onChange={val => setFormData(p => ({ ...p, diagnosis: val }))}
            />
          </Form.Item>

          <Form.Item label="治疗方案">
            <TextArea
              placeholder="处方、处置等"
              rows={2}
              value={formData.treatment}
              onChange={val => setFormData(p => ({ ...p, treatment: val }))}
            />
          </Form.Item>

          {/* 检查报告拍照上传 - AI OCR */}
          <Form.Item label="检查报告">
            {aiLoading && (
              <div style={{
                marginBottom: 8,
                padding: '8px 12px',
                background: '#f0f7ff',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: '#1677ff',
              }}>
                <SpinLoading style={{ '--size': '16px' }} color="primary" />
                <span>{aiProgress} ({Math.round(aiPct)}%)</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
              {attachedPhoto ? (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img
                    src={attachedPhoto.thumbnail}
                    alt="报告"
                    style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover', border: '1px solid #eee' }}
                    onClick={() => setViewerVisible(true)}
                  />
                  <span
                    style={{
                      position: 'absolute', top: -8, right: -8,
                      background: '#ff3141', color: '#fff', borderRadius: '50%',
                      width: 20, height: 20, fontSize: 10, lineHeight: '20px', textAlign: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => setAttachedPhoto(null)}
                  >
                    ✕
                  </span>
                </div>
              ) : null}
              <Button
                size="small"
                color={attachedPhoto ? 'default' : 'primary'}
                fill={attachedPhoto ? 'none' : 'solid'}
                onClick={handlePhotoSheet}
                loading={capturing}
              >
                <CameraOutline /> {attachedPhoto ? '更换' : '拍照上传'}
              </Button>
            </div>
          </Form.Item>

          {/* 复诊日期 - use direct date picker trigger */}
          <Form.Item label="复诊日期">
            <div
              onClick={() => setFollowUpVisible(true)}
              style={{ color: formData.followUpDate ? '#333' : '#ccc', cursor: 'pointer', padding: '8px 0' }}
            >
              {formData.followUpDate?.toLocaleDateString('zh-CN') || '请选择（有复诊建议选填）'}
            </div>
          </Form.Item>

          <Form.Item label="备注">
            <TextArea
              placeholder="其他说明"
              rows={2}
              value={formData.notes}
              onChange={val => setFormData(p => ({ ...p, notes: val }))}
            />
          </Form.Item>
        </Form>

        <Button
          block
          color="primary"
          size="large"
          loading={loading}
          onClick={handleSubmit}
          style={{ marginTop: 24, borderRadius: 8 }}
        >
          {isEdit ? '保存修改' : '保存记录'}
        </Button>
      </div>

      {/* Visit Date Picker */}
      <DatePicker
        visible={visitDateVisible}
        value={formData.visitDate}
        onConfirm={val => {
          setFormData(p => ({ ...p, visitDate: val || new Date() }))
          setVisitDateVisible(false)
        }}
        onClose={() => setVisitDateVisible(false)}
        min={new Date(2000, 0, 1)}
        max={new Date()}
        title="选择就诊日期"
      />

      {/* Follow-up Date Picker */}
      <DatePicker
        visible={followUpVisible}
        value={formData.followUpDate}
        onConfirm={val => {
          setFormData(p => ({ ...p, followUpDate: val || undefined }))
          setFollowUpVisible(false)
        }}
        onClose={() => setFollowUpVisible(false)}
        min={new Date()}
        title="选择复诊日期"
      />

      {/* Department Picker */}
      <Picker
        columns={deptColumns}
        visible={deptVisible}
        onClose={() => setDeptVisible(false)}
        value={formData.department ? [formData.department] : undefined}
        onConfirm={val => {
          setFormData(p => ({ ...p, department: (val as string[])[0] }))
          setDeptVisible(false)
        }}
        title="选择科室"
      />

      {/* Photo Viewer */}
      {attachedPhoto && (
        <ImageViewer
          image={attachedPhoto.dataUrl}
          visible={viewerVisible}
          onClose={() => setViewerVisible(false)}
        />
      )}
    </div>
  )
}

export default VisitFormPage
