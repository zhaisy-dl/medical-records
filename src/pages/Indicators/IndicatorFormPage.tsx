import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Form, Input, TextArea, DatePicker, Button, Picker, Dialog, Toast } from 'antd-mobile'
import { DeleteOutline } from 'antd-mobile-icons'
import PageHeader from '@/components/Layout/PageHeader'
import { indicatorService } from '@/services/indicatorService'
import { INDICATOR_CATEGORIES } from '@/utils/constants'
import type { Indicator } from '@/db/schema'

const catColumns = [INDICATOR_CATEGORIES.map(c => ({ label: c.label, value: c.value }))]

const IndicatorFormPage = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [catVisible, setCatVisible] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    category: 'blood' as Indicator['category'],
    value: '' as string,
    unit: '',
    referenceMin: '' as string,
    referenceMax: '' as string,
    testDate: new Date(),
    labName: '',
    visitId: searchParams.get('visitId') ? Number(searchParams.get('visitId')) : undefined,
    notes: '',
  })

  useState(() => {
    if (id) {
      indicatorService.getById(Number(id)).then(ind => {
        if (ind) {
          setFormData({
            name: ind.name,
            category: ind.category,
            value: String(ind.value),
            unit: ind.unit,
            referenceMin: ind.referenceMin != null ? String(ind.referenceMin) : '',
            referenceMax: ind.referenceMax != null ? String(ind.referenceMax) : '',
            testDate: new Date(ind.testDate),
            labName: ind.labName || '',
            visitId: ind.visitId,
            notes: ind.notes,
          })
        }
      })
    }
  })

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Toast.show({ icon: 'fail', content: '请填写指标名称' })
      return
    }
    if (!formData.value || isNaN(Number(formData.value))) {
      Toast.show({ icon: 'fail', content: '请填写有效数值' })
      return
    }

    setLoading(true)
    const data = {
      name: formData.name.trim(),
      category: formData.category,
      value: Number(formData.value),
      unit: formData.unit,
      referenceMin: formData.referenceMin ? Number(formData.referenceMin) : undefined,
      referenceMax: formData.referenceMax ? Number(formData.referenceMax) : undefined,
      testDate: formData.testDate,
      labName: formData.labName || undefined,
      visitId: formData.visitId,
      notes: formData.notes,
    }

    const result = isEdit
      ? await indicatorService.update(Number(id), data)
      : await indicatorService.create(data as Omit<Indicator, 'id' | 'isAbnormal' | 'createdAt' | 'updatedAt'>)

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
      content: '确定要删除这条记录吗？',
      onConfirm: async () => {
        const result = await indicatorService.remove(Number(id))
        if (result.success) {
          Toast.show({ icon: 'success', content: '已删除' })
          navigate('/indicators', { replace: true })
        }
      },
    })
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5' }}>
      <PageHeader
        title={isEdit ? '编辑指标' : '录入指标'}
        right={isEdit ? (
          <Button size="small" fill="none" color="danger" onClick={handleDelete}>
            <DeleteOutline />
          </Button>
        ) : undefined}
      />

      <div className="page-container">
        <Form layout="horizontal" style={{ '--border-inner': 'none' } as React.CSSProperties}>
          <Form.Item label="指标名称" required>
            <Input
              placeholder="如：空腹血糖"
              value={formData.name}
              onChange={val => setFormData(p => ({ ...p, name: val }))}
            />
          </Form.Item>

          <Form.Item label="分类" onClick={() => setCatVisible(true)}>
            <span>{INDICATOR_CATEGORIES.find(c => c.value === formData.category)?.label || '请选择'}</span>
          </Form.Item>

          <Form.Item label="检测数值" required>
            <Input
              placeholder="如：5.6"
              type="number"
              value={formData.value}
              onChange={val => setFormData(p => ({ ...p, value: val }))}
            />
          </Form.Item>

          <Form.Item label="单位">
            <Input
              placeholder="如：mmol/L"
              value={formData.unit}
              onChange={val => setFormData(p => ({ ...p, unit: val }))}
            />
          </Form.Item>

          <Form.Item label="参考下限">
            <Input
              placeholder="如：3.9"
              type="number"
              value={formData.referenceMin}
              onChange={val => setFormData(p => ({ ...p, referenceMin: val }))}
            />
          </Form.Item>

          <Form.Item label="参考上限">
            <Input
              placeholder="如：6.1"
              type="number"
              value={formData.referenceMax}
              onChange={val => setFormData(p => ({ ...p, referenceMax: val }))}
            />
          </Form.Item>

          <Form.Item label="检测日期" required>
            <DatePicker
              value={formData.testDate}
              onConfirm={val => setFormData(p => ({ ...p, testDate: val || new Date() }))}
            >
              {value => value?.toLocaleDateString('zh-CN') || '请选择'}
            </DatePicker>
          </Form.Item>

          <Form.Item label="检验机构">
            <Input
              placeholder="可选"
              value={formData.labName}
              onChange={val => setFormData(p => ({ ...p, labName: val }))}
            />
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

      {/* Category Picker */}
      <Picker
        columns={catColumns}
        visible={catVisible}
        onClose={() => setCatVisible(false)}
        value={[formData.category]}
        onConfirm={val => {
          setFormData(p => ({ ...p, category: (val as string[])[0] as Indicator['category'] }))
          setCatVisible(false)
        }}
        title="选择分类"
      />
    </div>
  )
}

export default IndicatorFormPage
