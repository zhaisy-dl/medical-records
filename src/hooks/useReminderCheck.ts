import { useEffect } from 'react'
import { reminderService } from '@/services/reminderService'
import { sendNotification } from '@/services/notificationService'

export function useReminderCheck() {
  useEffect(() => {
    const check = async () => {
      const overdue = await reminderService.getOverdue()
      if (overdue.length > 0) {
        if (overdue.length === 1) {
          sendNotification(overdue[0].title, {
            body: `提醒时间: ${overdue[0].reminderTime}`,
          })
        } else {
          sendNotification('您有未完成的提醒', {
            body: `共 ${overdue.length} 条提醒待处理`,
          })
        }
      }
    }

    check()

    // Check every 60 seconds
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [])
}
