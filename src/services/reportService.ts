import { db } from '@/db/index'
import type { Report } from '@/db/schema'
import type { Result } from '@/db/schema'

export const reportService = {
  async list(): Promise<Report[]> {
    return db.reports.orderBy('reportDate').reverse().toArray()
  },

  async getById(id: number): Promise<Report | undefined> {
    return db.reports.get(id)
  },

  async listByVisit(visitId: number): Promise<Report[]> {
    return db.reports.where('visitId').equals(visitId).toArray()
  },

  async create(data: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<number>> {
    try {
      const now = new Date()
      const id = await db.reports.add({
        ...data,
        reportDate: new Date(data.reportDate),
        createdAt: now,
        updatedAt: now,
      })
      return { success: true, data: id }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  },

  async update(id: number, data: Partial<Omit<Report, 'id' | 'createdAt'>>): Promise<Result<void>> {
    try {
      const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() }
      if (data.reportDate) updateData.reportDate = new Date(data.reportDate)
      await db.reports.update(id, updateData)
      return { success: true, data: undefined }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  },

  async remove(id: number): Promise<Result<void>> {
    try {
      await db.reports.delete(id)
      return { success: true, data: undefined }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  },

  async getTotalSize(): Promise<number> {
    const all = await db.reports.toArray()
    return all.reduce((sum, r) => sum + r.fileSize, 0)
  },
}
