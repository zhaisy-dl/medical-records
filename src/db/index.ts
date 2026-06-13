import Dexie from 'dexie'
import type { Visit, Medication, Indicator, Report, Reminder, AppSetting } from './schema'

class MedicalDatabase extends Dexie {
  visits!: Dexie.Table<Visit, number>
  medications!: Dexie.Table<Medication, number>
  indicators!: Dexie.Table<Indicator, number>
  reports!: Dexie.Table<Report, number>
  reminders!: Dexie.Table<Reminder, number>
  settings!: Dexie.Table<AppSetting, string>

  constructor() {
    super('MedicalRecordsDB')
    this.version(1).stores({
      visits: '++id, visitDate, hospitalName, followUpDate',
      medications: '++id, status, startDate, endDate, visitId',
      indicators: '++id, [name+testDate], category, isAbnormal, visitId',
      reports: '++id, category, reportDate, visitId',
      reminders: '++id, [reminderDate+reminderTime], isActive, type',
      settings: '&key',
    })
  }
}

export const db = new MedicalDatabase()
