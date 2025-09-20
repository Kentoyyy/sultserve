'use client'

import { useState, useMemo } from 'react'

interface ActivityLog {
  id: string
  action: string
  entityType: string
  entityId: string | null
  entityName: string | null
  description: string
  metadata: unknown
  userName: string | null
  createdAt: Date
}

interface Props {
  logs: ActivityLog[]
}

export function ActivityLogsPageClient({ logs }: Props) {
  const [actionFilter, setActionFilter] = useState<string>('')
  const [entityFilter, setEntityFilter] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Get unique actions and entity types for filters
  const uniqueActions = useMemo(() => {
    const actions = [...new Set(logs.map(log => log.action))]
    return actions.sort()
  }, [logs])

  const uniqueEntityTypes = useMemo(() => {
    const entities = [...new Set(logs.map(log => log.entityType))]
    return entities.sort()
  }, [logs])

  // Filter logs based on selected filters
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesAction = !actionFilter || log.action === actionFilter
      const matchesEntity = !entityFilter || log.entityType === entityFilter
      const matchesSearch = !searchTerm || 
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesDate = !dateFilter || 
        new Date(log.createdAt).toDateString() === new Date(dateFilter).toDateString()

      return matchesAction && matchesEntity && matchesSearch && matchesDate
    })
  }, [logs, actionFilter, entityFilter, searchTerm, dateFilter])

  // Pagination logic
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentLogs = filteredLogs.slice(startIndex, endIndex)

  // Reset to first page when filters change
  const resetPage = () => {
    setCurrentPage(1)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const getActionBadge = (action: string) => {
    const badgeClasses = {
      'CREATE': 'badge badge-success',
      'UPDATE': 'badge badge-warning',
      'DELETE': 'badge badge-danger',
      'ARCHIVE': 'badge badge-neutral',
      'RESTORE': 'badge badge-success',
      'SELL': 'badge bg-blue-100 text-blue-800',
      'ADJUST_STOCK': 'badge bg-purple-100 text-purple-800'
    }
    return badgeClasses[action as keyof typeof badgeClasses] || 'badge badge-neutral'
  }

  const getEntityIcon = (entityType: string) => {
    const icons = {
      'PRODUCT': '🍔',
      'INVENTORY': '📦',
      'RECIPE': '📋',
      'ORDER': '🛒',
      'CATEGORY': '🏷️',
      'STAFF': '👤'
    }
    return icons[entityType as keyof typeof icons] || '📄'
  }

  const clearFilters = () => {
    setActionFilter('')
    setEntityFilter('')
    setSearchTerm('')
    setDateFilter('')
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Activity Logs</h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">Track all system activities and changes</p>
        </div>
        <div className="text-sm text-slate-500">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} activities
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Action</label>
            <select 
              value={actionFilter} 
              onChange={(e) => {
                setActionFilter(e.target.value)
                resetPage()
              }}
              className="select"
            >
              <option value="">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Entity Type</label>
            <select 
              value={entityFilter} 
              onChange={(e) => {
                setEntityFilter(e.target.value)
                resetPage()
              }}
              className="select"
            >
              <option value="">All Types</option>
              {uniqueEntityTypes.map(entity => (
                <option key={entity} value={entity}>{entity}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                resetPage()
              }}
              placeholder="Search descriptions..."
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input 
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value)
                resetPage()
              }}
              className="input"
            />
          </div>

          <div className="flex items-end">
            <button 
              onClick={clearFilters}
              className="btn btn-ghost text-sm w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-200">
          {currentLogs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-slate-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-lg">
                    {getEntityIcon(log.entityType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={getActionBadge(log.action)}>
                        {log.action}
                      </span>
                      <span className="text-sm text-slate-500">
                        {log.entityType}
                      </span>
                      {log.entityName && (
                        <span className="text-sm font-medium text-slate-700">
                          &quot;{log.entityName}&quot;
                        </span>
                      )}
                    </div>
                    <p className="text-slate-900 text-sm mb-2">
                      {log.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>
                        👤 {log.userName || 'System'}
                      </span>
                      <span>
                        🕒 {new Date(log.createdAt).toLocaleString()}
                      </span>
                      {log.entityId && (
                        <span className="font-mono">
                          ID: {log.entityId.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Metadata */}
              {log.metadata && typeof log.metadata === 'object' && log.metadata !== null && Object.keys(log.metadata as Record<string, unknown>).length > 0 ? (
                <details className="mt-3">
                  <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                    View Details
                  </summary>
                  <pre className="text-xs bg-slate-50 p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </details>
              ) : null}
            </div>
          ))}

          {currentLogs.length === 0 && (
            <div className="py-12 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-slate-900 mb-2">
                  {logs.length === 0 ? 'No activity logs yet' : 'No logs match your filters'}
                </p>
                <p className="text-slate-500">
                  {logs.length === 0 
                    ? 'Activity logs will appear here as you use the system.'
                    : 'Try adjusting your filters to see more results.'
                  }
                </p>
                {logs.length > 0 && (
                  <button 
                    onClick={clearFilters}
                    className="mt-4 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <span className="text-sm text-slate-600 px-3">
              {currentPage} / {totalPages}
            </span>
            
            <button 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="w-8 h-8 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


