import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Button, Toast } from 'antd-mobile'

const AppLockPage = () => {
  const navigate = useNavigate()
  const isSettingUp = !localStorage.getItem('app_lock_pin_hash')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step, setStep] = useState<'enter' | 'confirm'>('enter')

  const hashPin = async (pin: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(pin)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const handleSetPin = async () => {
    if (pin.length < 4) {
      Toast.show({ icon: 'fail', content: 'PIN至少4位数字' })
      return
    }

    if (step === 'enter') {
      setConfirmPin('')
      setStep('confirm')
    } else {
      if (pin !== confirmPin) {
        Toast.show({ icon: 'fail', content: '两次PIN不一致' })
        return
      }
      const hash = await hashPin(pin)
      localStorage.setItem('app_lock_pin_hash', hash)
      localStorage.setItem('app_lock_enabled', 'true')
      Toast.show({ icon: 'success', content: '应用锁已设置' })
      navigate('/settings')
    }
  }

  const handleVerifyPin = async () => {
    const storedHash = localStorage.getItem('app_lock_pin_hash')
    const hash = await hashPin(pin)

    if (hash === storedHash) {
      Toast.show({ icon: 'success', content: '验证成功' })
      navigate('/settings')
    } else {
      Toast.show({ icon: 'fail', content: 'PIN错误' })
      setPin('')
    }
  }

  return (
    <div className="page-container" style={{ textAlign: 'center', paddingTop: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h3 style={{ marginBottom: 8 }}>
        {isSettingUp ? '设置应用锁' : '输入PIN解锁'}
      </h3>
      <div style={{ fontSize: 12, color: '#999', marginBottom: 24 }}>
        {step === 'enter'
          ? '请输入4-6位数字PIN'
          : '请再次输入确认'}
      </div>

      <div style={{ maxWidth: 280, margin: '0 auto' }}>
        {isSettingUp ? (
          <>
            <Input
              type="password"
              maxLength={6}
              placeholder={step === 'enter' ? '设置PIN' : '确认PIN'}
              value={step === 'enter' ? pin : confirmPin}
              onChange={val => step === 'enter' ? setPin(val) : setConfirmPin(val)}
              style={{ textAlign: 'center', fontSize: 20, letterSpacing: 8 }}
            />
            <Button
              block
              color="primary"
              size="large"
              onClick={handleSetPin}
              style={{ marginTop: 24, borderRadius: 8 }}
            >
              {step === 'enter' ? '下一步' : '确认设置'}
            </Button>
          </>
        ) : (
          <>
            <Input
              type="password"
              maxLength={6}
              placeholder="输入PIN"
              value={pin}
              onChange={val => setPin(val)}
              style={{ textAlign: 'center', fontSize: 20, letterSpacing: 8 }}
            />
            <Button
              block
              color="primary"
              size="large"
              onClick={handleVerifyPin}
              style={{ marginTop: 24, borderRadius: 8 }}
            >
              验证
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default AppLockPage
