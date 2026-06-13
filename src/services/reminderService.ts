import { db } from '@/db/index'
import type { Reminder } from '@/db/schema'
import type { Result } from '@/db/schema'

/* eslint-disable @typescript-eslint/no-explicit-any */

export const reminderService = {
  async list(): Promise<Reminder[]> {
    return db.reminders.orderBy('reminderDate').toArray()
  },

  async getActive(): Promise<Reminder[]> {
    const all = await db.reminders.orderBy('reminderDate').toArray()
    return all.filter(r => r.isActive)
  },

  async getById(id: number): Promise<Reminder | undefined> {
    return db.reminders.get(id)
  },

  async getToday(): Promise<Reminder[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return db.reminders
      .where('reminderDate')
      .between(today, tomorrow, true, false)
      .filter(r => r.isActive && !r.isCompleted)
      .toArray()
  },

  async getOverdue(): Promise<Reminder[]> {
    const now = new Date()
    const all = await db.reminders.toArray()
    return all.filter(r => r.isActive && !r.isCompleted && new Date(r.reminderDate) <= now)
  },

  async create(data: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<number>> {
    try {
      const now = new Date()
      const id = await db.reminders.add({
        ...data,
        reminderDate: new Date(data.reminderDate),
        createdAt: now,
        updatedAt: now,
      } as any)
      return { success: true, data: id as number }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  },

  async update(id: number, data: Partial<Omit<Reminder, 'id' | 'createdAt'>>): Promise<Result<void>> {
    try {
      const updateData: any = { ...data, updatedAt: new Date() }
      if (data.reminderDate) updateData.reminderDate = new Date(data.reminderDate)
      await db.reminders.update(id, updateData)
      return { success: true, data: undefined }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  },

  async remove(id: number): Promise<Result<void>> {
    try {
      await db.reminders.delete(id)
      return { success: true, data: undefined }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  },

  async complete(id: number): Promise<Result<void>> {
    try {
      await db.reminders.update(id, { isCompleted: true, updatedAt: new Date() } as any)
      const reminder = await db.reminders.get(id)
      if (reminder && reminder.repeatType !== 'none') {
        const nextDate = new Date(reminder.reminderDate)
        switch (reminder.repeatType) {
          case 'daily':
            nextDate.setDate(nextDate.getDate() + 1)
            break
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7)
            break
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1)
            break
        }
        await db.reminders.add({
          ...reminder,
          id: undefined,
          reminderDate: nextDate,
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any)
      }
      return { success: true, data: undefined }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  },
}
