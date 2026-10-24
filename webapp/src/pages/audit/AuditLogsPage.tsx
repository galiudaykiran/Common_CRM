import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { ApiResponse, PageResponse, AuditLogItem } from '../../types';
import { ShieldCheck, Search, Filter } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);

  const [actionFilter, setActionFilter] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');

  const loadLogs = async (pageNum = 0) => {
    try {
      setLoading(true);
      const params: any = { page: pageNum, size: 15 };
      if (actionFilter) params.action = actionFilter;
      if (resourceTypeFilter) params.resourceType = resourceTypeFilter;
      if (actorFilter) params.actorUsername = actorFilter;

      const res = await apiClient.get<ApiResponse<PageResponse<AuditLogItem>>>('/admin/audit-logs', { params });
      if (res.data.success) {
        setLogs(res.data.data.content);
        setPage(res.data.data.page);
        setTotalPages(res.data.data.totalPages);
        setTotalElements(res.data.data.totalElements);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(0);
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLogs(0);
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Security & Admin Audit Trail
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Immutable logs of administrative changes, shop onboarding, and authentication events ({totalElements} entries).
        </p>
      </div>

      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleFilterSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by Actor Username..."
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
            />
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by Action (e.g. ADMIN_CREATED_SHOP)..."
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            />
          </div>

          <div style={{ flex: '1 1 180px' }}>
            <select
              className="form-control"
              value={resourceTypeFilter}
              onChange={(e) => setResourceTypeFilter(e.target.value)}
            >
              <option value="">All Resource Types</option>
              <option value="AUTH">Authentication (AUTH)</option>
              <option value="SHOP">Shop (SHOP)</option>
              <option value="TENANT">Tenant (TENANT)</option>
              <option value="BUSINESS_TYPE">Business Type</option>
              <option value="MODULE">Module</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            <Filter size={16} /> Filter Logs
          </button>
        </form>
      </div>

      <div className="glass-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No audit events found.</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Actor</th>
                  <th>Client IP / Request ID</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className="code-mono" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                        {log.resourceType}: {log.resourceId}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{log.actorUsername || 'SYSTEM'}</strong>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <div>{log.ipAddress}</div>
                        {log.requestId && <div className="code-mono" style={{ fontSize: '0.65rem', marginTop: '2px' }}>{log.requestId.slice(0, 8)}...</div>}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {log.newValue || log.oldValue || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Page {page + 1} of {totalPages}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    disabled={page === 0}
                    onClick={() => loadLogs(page - 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => loadLogs(page + 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
