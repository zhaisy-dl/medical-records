export const DEPARTMENTS = [
  '心内科', '心外科', '神经内科', '神经外科', '呼吸内科', '消化内科',
  '肾内科', '内分泌科', '血液科', '肿瘤科', '骨科', '普外科',
  '泌尿外科', '胸外科', '眼科', '耳鼻喉科', '口腔科', '皮肤科',
  '妇产科', '儿科', '急诊科', 'ICU', '康复科', '中医科', '其他',
]

export const INDICATOR_CATEGORIES = [
  { value: 'blood', label: '血液检查' },
  { value: 'urine', label: '尿液检查' },
  { value: 'imaging', label: '影像检查' },
  { value: 'other', label: '其他检查' },
] as const

export const REPORT_CATEGORIES = [
  { value: 'lab', label: '化验单' },
  { value: 'imaging', label: '影像报告' },
  { value: 'diagnosis', label: '诊断书' },
  { value: 'prescription', label: '处方' },
  { value: 'other', label: '其他' },
] as const

export const MEDICATION_FREQUENCIES = [
  '每日1次', '每日2次', '每日3次', '每日4次',
  '隔日1次', '每周1次', '每周2次', '必要时',
]

export const MEDICATION_TIMES = [
  { value: '早', label: '早晨' },
  { value: '中', label: '中午' },
  { value: '晚', label: '晚上' },
  { value: '睡前', label: '睡前' },
]

export const MEDICATION_INSTRUCTIONS = [
  '饭前', '饭后', '空腹', '不限',
]

export const REMINDER_TYPES = [
  { value: 'medication', label: '服药' },
  { value: 'appointment', label: '预约' },
  { value: 'followUp', label: '复诊' },
  { value: 'custom', label: '自定义' },
] as const

export const APP_NAME = '病历管理'
export const DB_NAME = 'MedicalRecordsDB'
export const MAX_PHOTO_SIZE_KB = 200
export const THUMBNAIL_SIZE_KB = 20
