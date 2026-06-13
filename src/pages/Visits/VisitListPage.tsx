import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchBar, Button, Picker, Popup } from 'antd-mobile'
import { AddOutline, FilterOutline } from 'antd-mobile-icons'
import EmptyState from '@/components/common/EmptyState'
import Loading from '@/components/common/Loading'
import { visitService } from '@/services/visitService'
import { formatRelative } from '@/utils/date'
import { DEPARTMENTS } from '@/utils/constants'
import type { Visit } from '@/db/schema'

const VisitListPage = () => {
  const navigate = useNavigate()
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [filterVisible, setFilterVisible] = useState(false)
  const [filterDept, setFilterDept] = useState<string>('')

  const loadData = async () => {
    setLoading(true)
    const data = await visitService.list()
    setVisits(data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSearch = async (text: string) => {
    setSearchText(text)
    if (!text.trim() && !filterDept) {
      loadData()
      return
    }
    const results = await visitService.search({
      hospitalName: text || undefined,
      department: filterDept || undefined,
    })
    setVisits(results)
  }

  const handleFilter = async (dept: string) => {
    setFilterDept(dept)
    setFilterVisible(false)
    const results = await visitService.search({
      hospitalName: searchText || undefined,
      department: dept || undefined,
    })
    setVisits(results)
  }

  return (
    <div className="page-container" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>就诊记录</h2>
        <Button
          size="small"
          color="primary"
          onClick={() => navigate('/visits/new')}
        >
          <AddOutline /> 新增
        </Button>
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <SearchBar
            placeholder="搜索医院名称"
            value={searchText}
            onChange={handleSearch}
            style={{ '--background': '#fff', '--border-radius': '8px' } as React.CSSProperties}
          />
        </div>
        <Button
          size="small"
          fill={filterDept ? 'solid' : 'none'}
          color={filterDept ? 'primary' : 'default'}
          onClick={() => setFilterVisible(true)}
        >
          <FilterOutline /> {filterDept || '科室'}
        </Button>
      </div>

      {/* Department Filter Picker */}
      <Popup
        visible={filterVisible}
        onMaskClick={() => setFilterVisible(false)}
        bodyStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
      >
        <div style={{ padding: 16 }}>
          <h4 style={{ marginBottom: 12 }}>选择科室</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Button
              size="small"
              fill={filterDept === '' ? 'solid' : 'none'}
              color={filterDept === '' ? 'primary' : 'default'}
              onClick={() => handleFilter('')}
            >
              全部
            </Button>
            {DEPARTMENTS.map(dept => (
              <Button
                key={dept}
                size="small"
                fill={filterDept === dept ? 'solid' : 'none'}
                color={filterDept === dept ? 'primary' : 'default'}
                onClick={() => handleFilter(dept)}
              >
                {dept}
              </Button>
            ))}
          </div>
        </div>
      </Popup>

      {/* List */}
      {loading ? (
        <Loading />
      ) : visits.length === 0 ? (
        <EmptyState
          message={searchText || filterDept ? '没有找到匹配的就诊记录' : '还没有就诊记录'}
          icon="🏥"
        />
      ) : (
        <div>
          {visits.map(v => (
            <div key={v.id} className="timeline-item" onClick={() => navigate(`/visits/${v.id}`)}>
              <div className="card" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{v.hospitalName}</div>
                    <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                      {v.department}{v.doctorName ? ` · ${v.doctorName}` : ''}
                    </div>
                    {v.diagnosis && (
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                        诊断: {v.diagnosis}
                      </div>
                    )}
                    {v.followUpDate && (
                      <div style={{ fontSize: 11, color: '#1677ff', marginTop: 4 }}>
                        复诊: {new Date(v.followUpDate).toLocaleDateString('zh-CN')}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#999', whiteSpace: 'nowrap', marginLeft: 8 }}>
                    {formatRelative(v.visitDate)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default VisitListPage
