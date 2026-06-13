import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Form, Input, TextArea, DatePicker, Button, Picker, CheckList, Dialog, Toast, Popup } from 'antd-mobile'
import { DeleteOutline } from 'antd-mobile-icons'
import PageHeader from '@/components/Layout/PageHeader'
import { medicationService } from '@/services/medicationService'
import { MEDICATION_FREQUENCIES, MEDICATION_TIMES, MEDICATION_INSTRUCTIONS } from '@/utils/constants'
import type { Medication } from '@/db/schema'

const freqColumns = [MEDICATION_FREQUENCIES.map(f => ({ label: f, value: f }))]
const instructionColumns = [MEDICATION_INSTRUCTIONS.map(i => ({ label: i, value: i }))]

const MedicationFormPage = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [freqVisible, setFreqVisible] = useState(false)
  const [instVisible, setInstVisible] = useState(false)
  const [timeVisible, setTimeVisible] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    dosage: '',
    frequency: '每日1次',
    timeOfDay: '早' as string,
    startDate: new Date(),
    endDate: undefined as Date | undefined,
    instructions: '',
    status: 'active' as Medication['status'],
    visitId: searchParams.get('visitId') ? Number(searchParams.get('visitId')) : undefined,
    notes: '',
  })

  // Load existing data
  useState(() => {
    if (id) {
      medicationService.getById(Number(id)).then(med => {
        if (med) {
          setFormData({
            name: med.name,
            genericName: med.genericName || '',
            dosage: med.dosage,
            frequency: med.frequency,
            timeOfDay: med.timeOfDay,
            startDate: new Date(med.startDate),
            endDate: med.endDate ? new Date(med.endDate) : undefined,
            instructions: med.instructions,
            status: med.status,
            visitId: med.visitId,
            notes: med.notes,
          })
        }
      })
    }
  })

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Toast.show({ icon: 'fail', content: '请填写药品名称' })
      return
    }

    setLoading(true)
    const result = isEdit
      ? await medicationService.update(Number(id), formData)
      : await medicationService.create(formData as Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>)

    setLoading(false)

    if (result.success) {
      Toast.show({ icon: 'success', content: isEdit ? '已更新' : '已保存' })
      navigate(-1)
    } else {
      Toast.show({ icon: 'fail', content: result.error })
    }
  }

  const handleDelete = () => {
    Dialog.confirm({
      title: '确认删除',
      content: '确定要删除这条用药记录吗？',
      onConfirm: async () => {
        const result = await medicationService.remove(Number(id))
        if (result.success) {
          Toast.show({ icon: 'success', content: '已删除' })
          navigate('/medications', { replace: true })
        }
      },
    })
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5' }}>
      <PageHeader
        title={isEdit ? '编辑用药' : '新增用药'}
        right={isEdit ? (
          <Button size="small" fill="none" color="danger" onClick={handleDelete}>
            <DeleteOutline />
          </Button>
        ) : undefined}
      />

      <div className="page-container">
        <Form layout="horizontal" style={{ '--border-inner': 'none' } as React.CSSProperties}>
          <Form.Item label="药品名称" required>
            <Input
              placeholder="如：阿司匹林"
              value={formData.name}
              onChange={val => setFormData(p => ({ ...p, name: val }))}
            />
          </Form.Item>

          <Form.Item label="通用名">
            <Input
              placeholder="可选"
              value={formData.genericName}
              onChange={val => setFormData(p => ({ ...p, genericName: val }))}
            />
          </Form.Item>

          <Form.Item label="剂量">
            <Input
              placeholder="如：5mg"
              value={formData.dosage}
              onChange={val => setFormData(p => ({ ...p, dosage: val }))}
            />
          </Form.Item>

          <Form.Item label="服用频率" onClick={() => setFreqVisible(true)}>
            <span>{formData.frequency}</span>
          </Form.Item>

          <Form.Item label="用药时段" onClick={() => setTimeVisible(true)}>
            <span>{formData.timeOfDay || '请选择'}</span>
          </Form.Item>

          <Form.Item label="开始日期" required>
            <DatePicker
              value={formData.startDate}
              onConfirm={val => setFormData(p => ({ ...p, startDate: val || new Date() }))}
            >
              {value => value?.toLocaleDateString('zh-CN') || '请选择'}
            </DatePicker>
          </Form.Item>

          <Form.Item label="结束日期">
            <DatePicker
              value={formData.endDate}
              onConfirm={val => setFormData(p => ({ ...p, endDate: val || undefined }))}
            >
              {value => value?.toLocaleDateString('zh-CN') || '长期服用'}
            </DatePicker>
          </Form.Item>

          <Form.Item label="服用说明" onClick={() => setInstVisible(true)}>
            <span>{formData.instructions || '请选择'}</span>
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

      {/* Frequency Picker */}
      <Picker
        columns={freqColumns}
        visible={freqVisible}
        onClose={() => setFreqVisible(false)}
        value={[formData.frequency]}
        onConfirm={val => {
          setFormData(p => ({ ...p, frequency: (val as string[])[0] }))
          setFreqVisible(false)
        }}
        title="选择频率"
      />

      {/* Instructions Picker */}
      <Picker
        columns={instructionColumns}
        visible={instVisible}
        onClose={() => setInstVisible(false)}
        value={formData.instructions ? [formData.instructions] : undefined}
        onConfirm={val => {
          setFormData(p => ({ ...p, instructions: (val as string[])[0] }))
          setInstVisible(false)
        }}
        title="服用说明"
      />

      {/* Time of Day */}
      <Popup
        visible={timeVisible}
        onMaskClick={() => setTimeVisible(false)}
        bodyStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
      >
        <div style={{ padding: 16 }}>
          <h4 style={{ marginBottom: 12 }}>用药时段</h4>
          <CheckList
            value={formData.timeOfDay ? formData.timeOfDay.split(',') : []}
            onChange={vals => {
              setFormData(p => ({ ...p, timeOfDay: (vals as string[]).join(',') }))
            }}
          >
            {MEDICATION_TIMES.map(t => (
              <CheckList.Item key={t.value} value={t.value}>
                {t.label}
              </CheckList.Item>
            ))}
          </CheckList>
          <Button block color="primary" onClick={() => setTimeVisible(false)} style={{ marginTop: 12 }}>
            确定
          </Button>
        </div>
      </Popup>
    </div>
  )
}

export default MedicationFormPage
