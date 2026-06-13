import { SpinLoading } from 'antd-mobile'

const Loading = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px 0',
  }}>
    <SpinLoading color="primary" />
  </div>
)

export default Loading
