import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { TabBar } from 'antd-mobile'
import { AppOutline, UnorderedListOutline, PayCircleOutline, ClockCircleOutline, UserOutline } from 'antd-mobile-icons'

const tabs = [
  { key: '/home', title: '首页', icon: <AppOutline /> },
  { key: '/visits', title: '就诊', icon: <UnorderedListOutline /> },
  { key: '/medications', title: '用药', icon: <PayCircleOutline /> },
  { key: '/indicators', title: '指标', icon: <ClockCircleOutline /> },
  { key: '/settings', title: '设置', icon: <UserOutline /> },
]

const TabBarLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const activeKey = '/' + location.pathname.split('/')[1]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 50 }}>
        <Outlet />
      </div>
      <TabBar
        activeKey={activeKey}
        onChange={key => navigate(key)}
        safeArea
        style={{ position: 'fixed', bottom: 0, width: '100%', background: '#fff', borderTop: '1px solid #eee' }}
      >
        {tabs.map(tab => (
          <TabBar.Item key={tab.key} icon={tab.icon} title={tab.title} />
        ))}
      </TabBar>
    </div>
  )
}

export default TabBarLayout
