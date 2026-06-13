import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { List, Switch, Toast, Dialog, Button, Form, Input, TextArea, Popup } from 'antd-mobile'
import {
  LockOutline,
  DownlandOutline,
  UploadOutline,
  DeleteOutline,
  BellOutline,
  PictureOutline,
  UserOutline,
} from 'antd-mobile-icons'
import PageHeader from '@/components/Layout/PageHeader'
import { formatFileSize } from '@/services/imageService'
import { requestPermission } from '@/services/notificationService'
import { db } from '@/db/index'

// Profile keys
const PROFILE_KEY = 'user_profile'

interface UserProfile {
  height: string
  weight: string
  medicalHistory: string
  allergies: string
  bloodType: string
  medications: string
}

const defaultProfile: UserProfile = {
  height: '',
  weight: '',
  medicalHistory: '',
  allergies: '',
  bloodType: '',
  medications: '',
}

const loadProfile = (): UserProfile => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : defaultProfile
  } catch {
    return defaultProfile
  }
}

const SettingsPage = () => {
  const navigate = useNavigate()
  const [lockEnabled, setLockEnabled] = useState(() => localStorage.getItem('app_lock_enabled') === 'true')
  const [notifEnabled, setNotifEnabled] = useState(() => {
    try { return typeof Notification !== 'undefined' && Notification.permission === 'granted' } catch { return false }
  })
  const [notifSupported] = useState(() => {
    try { return typeof Notification !== 'undefined' } catch { return false }
  })

  // Profile popup
  const [profileVisible, setProfileVisible] = useState(false)
  const [profile, setProfile] = useState<UserProfile>(loadProfile)

  const handleToggleLock = (val: boolean) => {
    if (val) {
      navigate('/settings/lock')
    } else {
      localStorage.removeItem('app_lock_enabled')
      localStorage.removeItem('app_lock_pin_hash')
      setLockEnabled(false)
      Toast.show({ icon: 'success', content: '应用锁已关闭' })
    }
  }

  const handleToggleNotif = async (val: boolean) => {
    if (val) {
      if (!notifSupported) {
        Toast.show({ icon: 'fail', content: '当前浏览器不支持通知' })
        return
      }
      const granted = await requestPermission()
      setNotifEnabled(granted)
      if (!granted) {
        Toast.show({ icon: 'fail', content: '请允许通知权限' })
      }
    } else {
      setNotifEnabled(false)
    }
  }

  const handleSaveProfile = () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    setProfileVisible(false)
    Toast.show({ icon: 'success', content: '个人信息已保存' })
  }

  const handleExport = async () => {
    try {
      const [visits, medications, indicators, reports, reminders] = await Promise.all([
        db.visits.toArray(),
        db.medications.toArray(),
        db.indicators.toArray(),
        db.reports.toArray(),
        db.reminders.toArray(),
      ])

      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        data: { visits, medications, indicators, reports, reminders },
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `病历备份_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`
      a.click()
      URL.revokeObjectURL(url)
      Toast.show({ icon: 'success', content: '导出成功' })
    } catch (e) {
      Toast.show({ icon: 'fail', content: '导出失败: ' + String(e) })
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      Dialog.confirm({
        title: '确认导入',
        content: '导入将覆盖现有所有数据，确定继续吗？建议先导出一份备份。',
        onConfirm: async () => {
          try {
            const text = await file.text()
            const importData = JSON.parse(text)

            if (!importData.data) {
              Toast.show({ icon: 'fail', content: '无效的备份文件' })
              return
            }

            await db.visits.clear()
            await db.medications.clear()
            await db.indicators.clear()
            await db.reports.clear()
            await db.reminders.clear()

            const d = importData.data
            if (d.visits?.length) await db.visits.bulkAdd(d.visits)
            if (d.medications?.length) await db.medications.bulkAdd(d.medications)
            if (d.indicators?.length) await db.indicators.bulkAdd(d.indicators)
            if (d.reports?.length) await db.reports.bulkAdd(d.reports)
            if (d.reminders?.length) await db.reminders.bulkAdd(d.reminders)

            Toast.show({ icon: 'success', content: '导入成功' })
          } catch (e) {
            Toast.show({ icon: 'fail', content: '导入失败: ' + String(e) })
          }
        },
      })
    }
    input.click()
  }

  const handleClearAll = () => {
    Dialog.confirm({
      title: '清除所有数据',
      content: '此操作不可恢复，所有就诊记录、用药、指标、报告照片和提醒将被永久删除。建议先导出一份备份。',
      confirmText: '确认清除',
      cancelText: '取消',
      onConfirm: async () => {
        await db.visits.clear()
        await db.medications.clear()
        await db.indicators.clear()
        await db.reports.clear()
        await db.reminders.clear()
        Toast.show({ icon: 'success', content: '所有数据已清除' })
      },
    })
  }

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>设置</h2>

      {/* 个人信息 */}
      <List style={{ borderRadius: 12, marginBottom: 16, '--border-inner': 'none' } as React.CSSProperties}>
        <List.Item
          prefix={<UserOutline />}
          onClick={() => setProfileVisible(true)}
        >
          个人信息
        </List.Item>
      </List>

      {/* 安全 & 通知 */}
      <List style={{ borderRadius: 12, marginBottom: 16, '--border-inner': 'none' } as React.CSSProperties}>
        <List.Item
          prefix={<LockOutline />}
          extra={
            <Switch checked={lockEnabled} onChange={handleToggleLock} />
          }
        >
          应用锁
        </List.Item>
        <List.Item
          prefix={<BellOutline />}
          extra={
            notifSupported
              ? <Switch checked={notifEnabled} onChange={handleToggleNotif} />
              : <span style={{ fontSize: 12, color: '#ccc' }}>不支持</span>
          }
        >
          通知提醒
        </List.Item>
      </List>

      {/* 快捷入口 */}
      <List style={{ borderRadius: 12, marginBottom: 16, '--border-inner': 'none' } as React.CSSProperties}>
        <List.Item
          prefix={<PictureOutline />}
          onClick={() => navigate('/reports')}
        >
          报告照片管理
        </List.Item>
        <List.Item
          prefix={<BellOutline />}
          onClick={() => navigate('/reminders')}
        >
          提醒管理
        </List.Item>
      </List>

      {/* 数据备份 */}
      <List style={{ borderRadius: 12, marginBottom: 16, '--border-inner': 'none' } as React.CSSProperties}>
        <List.Item
          prefix={<DownlandOutline />}
          onClick={handleExport}
        >
          导出数据备份
        </List.Item>
        <List.Item
          prefix={<UploadOutline />}
          onClick={handleImport}
        >
          导入数据恢复
        </List.Item>
      </List>

      {/* 危险操作 */}
      <List style={{ borderRadius: 12, marginBottom: 16, '--border-inner': 'none' } as React.CSSProperties}>
        <List.Item
          prefix={<DeleteOutline />}
          onClick={handleClearAll}
          style={{ color: '#ff3141' }}
        >
          清除所有数据
        </List.Item>
      </List>

      <div style={{ textAlign: 'center', color: '#ccc', fontSize: 12, marginTop: 24 }}>
        健康管理 v1.0.0
      </div>

      {/* 个人信息编辑弹窗 */}
      <Popup
        visible={profileVisible}
        onMaskClick={() => setProfileVisible(false)}
        bodyStyle={{
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '80dvh',
          overflow: 'auto',
        }}
      >
        <div style={{ padding: 16 }}>
          <PageHeader title="个人信息" onBack={() => setProfileVisible(false)} />
          <Form layout="horizontal" style={{ '--border-inner': 'none' } as React.CSSProperties}>
            <Form.Item label="身高(cm)">
              <Input
                placeholder="如：170"
                value={profile.height}
                onChange={val => setProfile(p => ({ ...p, height: val }))}
              />
            </Form.Item>
            <Form.Item label="体重(kg)">
              <Input
                placeholder="如：65"
                value={profile.weight}
                onChange={val => setProfile(p => ({ ...p, weight: val }))}
              />
            </Form.Item>
            <Form.Item label="血型">
              <Input
                placeholder="A/B/AB/O"
                value={profile.bloodType}
                onChange={val => setProfile(p => ({ ...p, bloodType: val }))}
              />
            </Form.Item>
            <Form.Item label="基础疾病">
              <TextArea
                placeholder="如：高血压、冠心病（支架术后）"
                rows={2}
                value={profile.medicalHistory}
                onChange={val => setProfile(p => ({ ...p, medicalHistory: val }))}
              />
            </Form.Item>
            <Form.Item label="过敏史">
              <TextArea
                placeholder="药物或食物过敏"
                rows={2}
                value={profile.allergies}
                onChange={val => setProfile(p => ({ ...p, allergies: val }))}
              />
            </Form.Item>
            <Form.Item label="长期用药">
              <TextArea
                placeholder="长期服用的药物"
                rows={2}
                value={profile.medications}
                onChange={val => setProfile(p => ({ ...p, medications: val }))}
              />
            </Form.Item>
          </Form>
          <Button block color="primary" size="large" onClick={handleSaveProfile} style={{ marginTop: 16, borderRadius: 8 }}>
            保存
          </Button>
        </div>
      </Popup>
    </div>
  )
}

export default SettingsPage
