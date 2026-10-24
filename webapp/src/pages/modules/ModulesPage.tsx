import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { ApiResponse, PlatformModule } from '../../types';
import { Layers, CheckCircle2, XCircle, Shield } from 'lucide-react';

export const ModulesPage: React.FC = () => {
  const [modules, setModules] = useState<PlatformModule[]>([]);
  const [loading, setLoading] = useState(false);

  const loadModules = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<ApiResponse<PlatformModule[]>>('/admin/modules');
      if (res.data.success) {
        setModules(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  const handleToggleStatus = async (id: number, currentActive: boolean) => {
    try {
      const res = await apiClient.patch<ApiResponse<PlatformModule>>(`/admin/modules/${id}/status?active=${!currentActive}`);
      if (res.data.success) {
        setModules((prev) => prev.map((m) => (m.id === id ? res.data.data : m)));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle module status');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Platform Feature Modules
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Modular functionality available for shops to activate based on business requirements.
        </p>
      </div>

      <div className="glass-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading modules...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Module Code</th>
                  <th>Module Name</th>
                  <th>Description</th>
                  <th>Classification</th>
                  <th>Global Availability</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <span className="code-mono" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                        {m.code}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{m.name}</strong>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {m.description || '—'}
                      </span>
                    </td>
                    <td>
                      {m.coreModule ? (
                        <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>
                          Core Module
                        </span>
                      ) : (
                        <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                          Add-on Module
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${m.active ? 'badge-active' : 'badge-inactive'}`}>
                        {m.active ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleStatus(m.id, m.active)}
                        className={`btn btn-sm ${m.active ? 'btn-danger' : 'btn-secondary'}`}
                      >
                        {m.active ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
