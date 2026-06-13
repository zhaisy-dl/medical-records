import { db } from '@/db/index'
import type { Visit } from '@/db/schema'
import type { Result } from '@/db/schema'

export const visitService = {
  async list(): Promise<Visit[]> {
    return db.visits.orderBy('visitDate').reverse().toArray()
  },

  async getById(id: number): Promise<Visit | undefined> {
    return db.visits.get(id)
  },

  async create(data: Omit<Visit, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<number>> {
    try {
      const now = new Date()
      const id = await db.visits.add({
        ...data,
        visitDate: new Date(data.visitDate),
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
        createdAt: now,
        updatedAt: now,
      })
      return { success: true, data: id }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  },

  async update(id: number, data: Partial<Omit<Visit, 'id' | 'createdAt'>>): Promise<Result<void>> {
    try {
      const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() }
      if (data.visitDate) updateData.visitDate = new Date(data.visitDate)
      if (data.followUpDate !== undefined) updateData.followUpDate = data.followUpDate ? new Date(data.followUpDate) : null
      await db.visits.update(id, updateData)
      return { success: true, data: undefined }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  },

  async remove(id: number): Promise<Result<void>> {
    try {
      await db.visits.delete(id)
      // cascade: delete related medications, indicators, reports
      await db.medications.where('visitId').equals(id).delete()
      await db.indicators.where('visitId').equals(id).delete()
      await db.reports.where('visitId').equals(id).delete()
      return { success: true, data: undefined }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  },

  async search(query: { hospitalName?: string; department?: string; dateFrom?: Date; dateTo?: Date }): Promise<Visit[]> {
    let collection = db.visits.orderBy('visitDate').reverse()
    const visits = await collection.toArray()
    return visits.filter(v => {
      if (query.hospitalName && !v.hospitalName.includes(query.hospitalName)) return false
      if (query.department && v.department !== query.department) return false
      if (query.dateFrom && new Date(v.visitDate) < query.dateFrom) return false
      if (query.dateTo && new Date(v.visitDate) > query.dateTo) return false
      return true
    })
  },
}
