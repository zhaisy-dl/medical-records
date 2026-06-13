import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Form, Input, TextArea, DatePicker, Button, Picker, Dialog, Toast, Switch } from 'antd-mobile'
import { DeleteOutline } from 'antd-mobile-icons'
import PageHeader from '@/components/Layout/PageHeader'
import { reminderService } from '@/services/reminderService'
import { REMINDER_TYPES } from '@/utils/constants'
import type { Reminder } from '@/db/schema'

const typeColumns = [REMINDER_TYPES.map(t => ({ label: t.label, value: t.value }))]
const repeatColumns = [[
  { label: '不重复', value: 'none' },
  { label: '每天', value: 'daily' },
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly' },
]]

const ReminderFormPage = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [typeVisible, setTypeVisible] = useState(false)
  const [repeatVisible, setRepeatVisible] = useState(false)

  const [formData, setFormData] = useState({
    title: searchParams.get('title') || '',
    type: (searchParams.get('type') as Reminder['type']) || 'custom' as Reminder['type'],
    reminderDate: new Date(),
    reminderTime: '09:00',
    repeatType: 'none' as Reminder['repeatType'],
    isActive: true,
    notes: '',
    relatedType: searchParams.get('relatedType') || undefined,
    relatedId: searchParams.get('relatedId') ? Number(searchParams.get('relatedId')) : undefined,
  })

  useState(() => {
    if (id) {
      reminderService.getById(Number(id)).then(r => {
        if (r) {
          setFormData({
            title: r.title,
            type: r.type,
            reminderDate: new Date(r.reminderDate),
            reminderTime: r.reminderTime,
            repeatType: r.repeatType,
            isActive: r.isActive,
            notes: r.notes,
            relatedType: r.relatedType,
            relatedId: r.relatedId,
          })
        }
      })
    }
  })

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Toast.show({ icon: 'fail', content: '请填写提醒标题' })
      return
    }

    setLoading(true)
    const result = isEdit
      ? await reminderService.update(Number(id), formData)
      : await reminderService.create({
          ...formData,
          isCompleted: false,
        } as Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>)

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
      content: '确定要删除这条提醒吗？',
      onConfirm: async () => {
        const result = await reminderService.remove(Number(id))
        if (result.success) {
          Toast.show({ icon: 'success', content: '已删除' })
          navigate('/reminders', { replace: true })
        }
      },
    })
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5' }}>
      <PageHeader
        title={isEdit ? '编辑提醒' : '新建提醒'}
        right={isEdit ? (
          <Button size="small" fill="none" color="danger" onClick={handleDelete}>
            <DeleteOutline />
          </Button>
        ) : undefined}
      />

      <div className="page-container">
        <Form layout="horizontal" style={{ '--border-inner': 'none' } as React.CSSProperties}>
          <Form.Item label="提醒标题" required>
            <Input
              placeholder="如：服用阿司匹林"
              value={formData.title}
              onChange={val => setFormData(p => ({ ...p, title: val }))}
            />
          </Form.Item>

          <Form.Item label="类型" onClick={() => setTypeVisible(true)}>
            <span>{REMINDER_TYPES.find(t => t.value === formData.type)?.label || '请选择'}</span>
          </Form.Item>

          <Form.Item label="提醒日期" required>
            <DatePicker
              value={formData.reminderDate}
              onConfirm={val => setFormData(p => ({ ...p, reminderDate: val || new Date() }))}
            >
              {value => value?.toLocaleDateString('zh-CN') || '请选择'}
            </DatePicker>
          </Form.Item>

          <Form.Item label="提醒时间">
            <Input
              type="time"
              value={formData.reminderTime}
              onChange={val => setFormData(p => ({ ...p, reminderTime: val }))}
            />
          </Form.Item>

          <Form.Item label="重复" onClick={() => setRepeatVisible(true)}>
            <span>{repeatColumns[0].find(r => r.value === formData.repeatType)?.label || '不重复'}</span>
          </Form.Item>

          <Form.Item label="启用">
            <Switch
              checked={formData.isActive}
              onChange={val => setFormData(p => ({ ...p, isActive: val }))}
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
          {isEdit ? '保存修改' : '创建提醒'}
        </Button>
      </div>

      {/* Type Picker */}
      <Picker
        columns={typeColumns}
        visible={typeVisible}
        onClose={() => setTypeVisible(false)}
        value={[formData.type]}
        onConfirm={val => {
          setFormData(p => ({ ...p, type: (val as string[])[0] as Reminder['type'] }))
          setTypeVisible(false)
        }}
        title="提醒类型"
      />

      {/* Repeat Picker */}
      <Picker
        columns={repeatColumns}
        visible={repeatVisible}
        onClose={() => setRepeatVisible(false)}
        value={[formData.repeatType]}
        onConfirm={val => {
          setFormData(p => ({ ...p, repeatType: (val as string[])[0] as Reminder['repeatType'] }))
          setRepeatVisible(false)
        }}
        title="重复方式"
      />
    </div>
  )
}

export default ReminderFormPage
