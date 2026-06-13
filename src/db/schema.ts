// --- 就诊记录 ---
export interface Visit {
  id?: number
  visitDate: Date
  hospitalName: string
  department: string
  doctorName: string
  chiefComplaint: string
  diagnosis: string
  treatment: string
  followUpDate?: Date
  notes: string
  createdAt: Date
  updatedAt: Date
}

// --- 用药记录 ---
export interface Medication {
  id?: number
  name: string
  genericName?: string
  dosage: string
  frequency: string
  timeOfDay: string
  startDate: Date
  endDate?: Date
  instructions: string
  status: 'active' | 'discontinued' | 'completed'
  visitId?: number
  notes: string
  createdAt: Date
  updatedAt: Date
}

// --- 检验指标 ---
export interface Indicator {
  id?: number
  name: string
  category: 'blood' | 'urine' | 'imaging' | 'other'
  value: number
  unit: string
  referenceMin?: number
  referenceMax?: number
  isAbnormal: boolean
  testDate: Date
  labName?: string
  visitId?: number
  notes: string
  createdAt: Date
  updatedAt: Date
}

// --- 报告/照片 ---
export interface Report {
  id?: number
  title: string
  category: 'lab' | 'imaging' | 'diagnosis' | 'prescription' | 'other'
  fileData: string
  thumbnailData?: string
  mimeType: string
  fileSize: number
  reportDate: Date
  visitId?: number
  description: string
  createdAt: Date
  updatedAt: Date
}

// --- 提醒事项 ---
export interface Reminder {
  id?: number
  title: string
  type: 'medication' | 'appointment' | 'followUp' | 'custom'
  reminderDate: Date
  reminderTime: string
  repeatType: 'none' | 'daily' | 'weekly' | 'monthly'
  repeatDays?: number[]
  isActive: boolean
  isCompleted: boolean
  relatedType?: string
  relatedId?: number
  notes: string
  createdAt: Date
  updatedAt: Date
}

// --- 应用设置 ---
export interface AppSetting {
  key: string
  value: string
}

// --- 统一返回类型 ---
export type Result<T> = { success: true; data: T } | { success: false; error: string }
