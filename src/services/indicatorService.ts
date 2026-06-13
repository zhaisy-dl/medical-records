import { db } from '@/db/index'
import type { Indicator } from '@/db/schema'
import type { Result } from '@/db/schema'

export const indicatorService = {
  async list(): Promise<Indicator[]> {
    return db.indicators.orderBy('testDate').reverse().toArray()
  },

  async getById(id: number): Promise<Indicator | undefined> {
    return db.indicators.get(id)
  },

  async getByName(name: string): Promise<Indicator[]> {
    return db.indicators.where('name').equals(name).sortBy('testDate')
  },

  async getTrend(name: string): Promise<Indicator[]> {
    return db.indicators
      .where('[name+testDate]')
      .between([name, new Date(0)], [name, new Date()])
      .reverse()
      .sortBy('testDate')
  },

  async getAllNames(): Promise<string[]> {
    const all = await db.indicators.toArray()
    return [...new Set(all.map(i => i.name))]
  },

  async listByVisit(visitId: number): Promise<Indicator[]> {
    return db.indicators.where('visitId').equals(visitId).toArray()
  },

  async create(data: Omit<Indicator, 'id' | 'isAbnormal' | 'createdAt' | 'updatedAt'>): Promise<Result<number>> {
    try {
      const now = new Date()
      const isAbnormal = data.referenceMin != null && data.referenceMax != null
        ? data.value < data.referenceMin || data.value > data.referenceMax
        : false
      const id = await db.indicators.add({
        ...data,
        testDate: new Date(data.testDate),
        isAbnormal,
        createdAt: now,
        updatedAt: now,
      })
      return { success: true, data: id }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  },

  async update(id: number, data: Partial<Omit<Indicator, 'id' | 'createdAt'>>): Promise<Result<void>> {
    try {
      const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() }
      if (data.testDate) updateData.testDate = new Date(data.testDate)
      // recalc isAbnormal if value or references changed
      const existing = await db.indicators.get(id)
      if (existing) {
        const val = data.value ?? existing.value
        const min = data.referenceMin !== undefined ? data.referenceMin : existing.referenceMin
        const max = data.referenceMax !== undefined ? data.referenceMax : existing.referenceMax
        if (min != null && max != null) {
          updateData.isAbnormal = val < min || val > max
        }
      }
      await db.indicators.update(id, updateData)
      return { success: true, data: undefined }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  },

  async remove(id: number): Promise<Result<void>> {
    try {
      await db.indicators.delete(id)
      return { success: true, data: undefined }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  },
}
