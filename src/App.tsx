import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/common/ErrorBoundary'
import TabBarLayout from './components/Layout/TabBarLayout'
import HomePage from './pages/Home/HomePage'
import VisitListPage from './pages/Visits/VisitListPage'
import VisitFormPage from './pages/Visits/VisitFormPage'
import VisitDetailPage from './pages/Visits/VisitDetailPage'
import MedicationListPage from './pages/Medications/MedicationListPage'
import MedicationFormPage from './pages/Medications/MedicationFormPage'
import MedicationDetailPage from './pages/Medications/MedicationDetailPage'
import IndicatorListPage from './pages/Indicators/IndicatorListPage'
import IndicatorFormPage from './pages/Indicators/IndicatorFormPage'
import IndicatorChartPage from './pages/Indicators/IndicatorChartPage'
import ReportGalleryPage from './pages/Reports/ReportGalleryPage'
import ReportViewPage from './pages/Reports/ReportViewPage'
import ReminderListPage from './pages/Reminders/ReminderListPage'
import ReminderFormPage from './pages/Reminders/ReminderFormPage'
import SettingsPage from './pages/Settings/SettingsPage'
import AppLockPage from './pages/Settings/AppLockPage'
import './assets/styles/global.css'

function App() {
  // Hide splash screen once app mounts
  useEffect(() => {
    const splash = document.getElementById('splash')
    if (splash) {
      // Small delay to let first paint happen
      setTimeout(() => {
        splash.classList.add('hide')
        setTimeout(() => splash.remove(), 400)
      }, 100)
    }
  }, [])

  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route element={<TabBarLayout />}>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/visits" element={<VisitListPage />} />
            <Route path="/medications" element={<MedicationListPage />} />
            <Route path="/indicators" element={<IndicatorListPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="/visits/new" element={<VisitFormPage />} />
          <Route path="/visits/:id" element={<VisitDetailPage />} />
          <Route path="/visits/:id/edit" element={<VisitFormPage />} />
          <Route path="/medications/new" element={<MedicationFormPage />} />
          <Route path="/medications/:id" element={<MedicationDetailPage />} />
          <Route path="/medications/:id/edit" element={<MedicationFormPage />} />
          <Route path="/indicators/new" element={<IndicatorFormPage />} />
          <Route path="/indicators/chart/:name" element={<IndicatorChartPage />} />
          <Route path="/indicators/:id/edit" element={<IndicatorFormPage />} />
          <Route path="/reports" element={<ReportGalleryPage />} />
          <Route path="/reports/:id" element={<ReportViewPage />} />
          <Route path="/reminders" element={<ReminderListPage />} />
          <Route path="/reminders/new" element={<ReminderFormPage />} />
          <Route path="/reminders/:id" element={<ReminderFormPage />} />
          <Route path="/settings/lock" element={<AppLockPage />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}

export default App
