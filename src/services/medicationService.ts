import { db } from '@/db/index'
import type { Medication } from '@/db/schema'
import type { Result } from '@/db/schema'

export const medicationService = {
  async list(status?: Medication['status']): Promise<Medication[]> {
    if (status) {
      return db.medications.where('status').equals(status).reverse().sortBy('startDate')
    }
    return db.medications.orderBy('startDate').reverse().toArray()
  },

  async getById(id: number): Promise<Medication | undefined> {
    return db.medications.get(id)
  },

  async listByVisit(visitId: number): Promise<Medication[]> {
    return db.medications.where('visitId').equals(visitId).toArray()
  },

  async create(data: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<number>> {
    try {
      const now = new Date()
      const id = await db.medications.add({
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        createdAt: now,
        updatedAt: now,
      })
      return { success: true, data: id }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  },

  async update(id: number, data: Partial<Omit<Medication, 'id' | 'createdAt'>>): Promise<Result<void>> {
    try {
      const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() }
      if (data.startDate) updateData.startDate = new Date(data.startDate)
      if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null
      await db.medications.update(id, updateData)
      return { success: true, data: undefined }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  },

  async remove(id: number): Promise<Result<void>> {
    try {
      await db.medications.delete(id)
      return { success: true, data: undefined }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  },

  async updateStatus(id: number, status: Medication['status']): Promise<Result<void>> {
    return this.update(id, { status })
  },
}
