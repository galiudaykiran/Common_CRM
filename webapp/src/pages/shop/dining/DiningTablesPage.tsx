import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  QrCode,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  X,
  Printer,
  Copy,
  ExternalLink,
  PlayCircle,
  CheckCircle,
  AlertTriangle,
  FolderPlus,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import {
  diningApi,
  DiningArea,
  DiningTable,
} from '../../../api/diningApi';

export const DiningTablesPage: React.FC = () => {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<DiningArea[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<DiningTable | null>(null);
  const [tableForm, setTableForm] = useState({
    tableNumber: '',
    areaId: '' as string | number,
    seatingCapacity: 4,
    status: 'AVAILABLE',
  });

  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<DiningArea | null>(null);
  const [areaForm, setAreaForm] = useState({
    name: '',
    description: '',
    displayOrder: 0,
  });

  const [qrModalTable, setQrModalTable] = useState<DiningTable | null>(null);

  const [sessionModalTable, setSessionModalTable] = useState<DiningTable | null>(null);
  const [sessionForm, setSessionForm] = useState({
    guestCount: 2,
    customerName: '',
    customerPhone: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [areasData, tablesData] = await Promise.all([
        diningApi.getAreas(),
        diningApi.getTables(),
      ]);
      setAreas(areasData);
      setTables(tablesData);
    } catch (err) {
      console.error('Failed to load tables and areas', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  // Filtered tables
  const displayedTables = selectedAreaId === null
    ? tables
    : tables.filter((t) => t.areaId === selectedAreaId);

  // Table CRUD
  const handleOpenTableModal = (table?: DiningTable) => {
    if (table) {
      setEditingTable(table);
      setTableForm({
        tableNumber: table.tableNumber,
        areaId: table.areaId || '',
        seatingCapacity: table.seatingCapacity,
        status: table.status,
      });
    } else {
      setEditingTable(null);
      setTableForm({
        tableNumber: '',
        areaId: selectedAreaId || (areas.length > 0 ? areas[0].id : ''),
        seatingCapacity: 4,
        status: 'AVAILABLE',
      });
    }
    setIsTableModalOpen(true);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableForm.tableNumber.trim()) return;

    try {
      setSubmitting(true);
      if (editingTable) {
        await diningApi.updateTable(editingTable.id, {
          tableNumber: tableForm.tableNumber,
          areaId: tableForm.areaId ? Number(tableForm.areaId) : undefined,
          seatingCapacity: Number(tableForm.seatingCapacity),
          status: tableForm.status as any,
        });
        showNotification(`Table ${tableForm.tableNumber} updated successfully`);
      } else {
        await diningApi.createTable({
          tableNumber: tableForm.tableNumber,
          areaId: tableForm.areaId ? Number(tableForm.areaId) : undefined,
          seatingCapacity: Number(tableForm.seatingCapacity),
        });
        showNotification(`Table ${tableForm.tableNumber} created successfully`);
      }
      setIsTableModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving table');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTable = async (table: DiningTable) => {
    if (!window.confirm(`Are you sure you want to delete Table ${table.tableNumber}?`)) return;
    try {
      await diningApi.deleteTable(table.id);
      showNotification(`Table ${table.tableNumber} deleted`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cannot delete table');
    }
  };

  const handleUpdateStatus = async (tableId: number, newStatus: string) => {
    try {
      await diningApi.updateTableStatus(tableId, newStatus);
      showNotification(`Table status updated to ${newStatus}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error changing table status');
    }
  };

  // Area CRUD
  const handleOpenAreaModal = (area?: DiningArea) => {
    if (area) {
      setEditingArea(area);
      setAreaForm({
        name: area.name,
        description: area.description || '',
        displayOrder: area.displayOrder,
      });
    } else {
      setEditingArea(null);
      setAreaForm({
        name: '',
        description: '',
        displayOrder: areas.length,
      });
    }
    setIsAreaModalOpen(true);
  };

  const handleSaveArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaForm.name.trim()) return;

    try {
      setSubmitting(true);
      if (editingArea) {
        await diningApi.updateArea(editingArea.id, areaForm);
        showNotification(`Area '${areaForm.name}' updated`);
      } else {
        await diningApi.createArea(areaForm);
        showNotification(`Area '${areaForm.name}' created`);
      }
      setIsAreaModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving area');
    } finally {
      setSubmitting(false);
    }
  };

  // Start Session
  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionModalTable) return;

    try {
      setSubmitting(true);
      await diningApi.startSession({
        tableId: sessionModalTable.id,
        guestCount: Number(sessionForm.guestCount),
        customerName: sessionForm.customerName.trim() || undefined,
        customerPhone: sessionForm.customerPhone.trim() || undefined,
        notes: sessionForm.notes.trim() || undefined,
      });
      showNotification(`Dining session started on Table ${sessionModalTable.tableNumber}`);
      setSessionModalTable(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error starting session');
    } finally {
      setSubmitting(false);
    }
  };

  // Status Styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return { label: 'AVAILABLE', bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'OCCUPIED':
        return { label: 'OCCUPIED', bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
      case 'BILL_REQUESTED':
        return { label: 'BILL REQUESTED', bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
      case 'CLEANING':
        return { label: 'CLEANING', bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'RESERVED':
        return { label: 'RESERVED', bg: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)' };
      default:
        return { label: status, bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af', border: 'rgba(156, 163, 175, 0.3)' };
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Alert */}
      {actionMessage && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            background: 'var(--bg-secondary)',
            border: '1px solid #10b981',
            color: '#10b981',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle size={18} /> {actionMessage}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Dining Tables & QR Code Generator
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
            Design floor sections, assign seating capacity, track table statuses, and generate printable digital menu QR codes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => handleOpenAreaModal()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.6rem 1rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <FolderPlus size={16} /> Add Area
          </button>

          <button
            onClick={() => handleOpenTableModal()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.6rem 1.25rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            }}
          >
            <Plus size={16} /> Add Table
          </button>
        </div>
      </div>

      {/* Area Filter Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.75rem',
        }}
      >
        <button
          onClick={() => setSelectedAreaId(null)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: selectedAreaId === null ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
            background: selectedAreaId === null ? 'var(--accent-primary)' : 'var(--bg-secondary)',
            color: selectedAreaId === null ? '#fff' : 'var(--text-primary)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          All Areas ({tables.length})
        </button>

        {areas.map((area) => (
          <div key={area.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
            <button
              onClick={() => setSelectedAreaId(area.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px 0 0 8px',
                border: selectedAreaId === area.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                background: selectedAreaId === area.id ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: selectedAreaId === area.id ? '#fff' : 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {area.name} ({area.tableCount})
            </button>
            <button
              onClick={() => handleOpenAreaModal(area)}
              title="Edit Area"
              style={{
                padding: '0.5rem 0.6rem',
                borderRadius: '0 8px 8px 0',
                border: selectedAreaId === area.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                borderLeft: 'none',
                background: selectedAreaId === area.id ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: selectedAreaId === area.id ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <Edit size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Tables Grid */}
      {displayedTables.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px dashed var(--border-subtle)',
            padding: '4rem 2rem',
            textAlign: 'center',
          }}
        >
          <QrCode size={48} style={{ opacity: 0.4, margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            No tables in this section
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.35rem 0 1.25rem' }}>
            Click below to create your first dining table with a dedicated digital QR code.
          </p>
          <button
            onClick={() => handleOpenTableModal()}
            style={{
              padding: '0.65rem 1.5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
            }}
          >
            Create Table Now
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {displayedTables.map((table) => {
            const badge = getStatusBadge(table.status);
            return (
              <div
                key={table.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${badge.border}`,
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                }}
              >
                {/* Table Header */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Table {table.tableNumber}
                    </div>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: badge.bg,
                        color: badge.text,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                    Section: <strong style={{ color: 'var(--text-primary)' }}>{table.areaName || 'General'}</strong>
                    {' • '}
                    <span>{table.seatingCapacity} Persons</span>
                  </div>

                  {/* Active Session Info */}
                  {table.status === 'OCCUPIED' && (
                    <div
                      style={{
                        background: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{table.customerName || 'Walk-in Guest'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Party size:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{table.guestCount || 1} Guests</strong>
                      </div>
                    </div>
                  )}

                  {table.status === 'CLEANING' && (
                    <div
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        borderRadius: '8px',
                        padding: '0.6rem',
                        marginBottom: '1rem',
                        fontSize: '0.8rem',
                        color: '#ef4444',
                        fontWeight: 600,
                      }}
                    >
                      Needs cleaning before next party
                    </div>
                  )}
                </div>

                {/* Table Quick Status Dropdown & Action Controls */}
                <div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Change Status:
                    </label>
                    <select
                      value={table.status}
                      onChange={(e) => handleUpdateStatus(table.id, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.4rem 0.6rem',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="OCCUPIED">OCCUPIED</option>
                      <option value="BILL_REQUESTED">BILL REQUESTED</option>
                      <option value="CLEANING">CLEANING</option>
                      <option value="RESERVED">RESERVED</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', flexWrap: 'wrap' }}>
                    {table.status === 'AVAILABLE' && (
                      <>
                        <button
                          onClick={() => {
                            setSessionModalTable(table);
                            setSessionForm({
                              guestCount: table.seatingCapacity,
                              customerName: '',
                              customerPhone: '',
                              notes: '',
                            });
                          }}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            padding: '0.45rem',
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#10b981',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <PlayCircle size={14} /> Seat
                        </button>

                        <button
                          onClick={() => navigate(`/shop/dining/orders?openOrder=true&target=table:${table.id}`)}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            padding: '0.45rem',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          <UtensilsCrossed size={13} /> Order
                        </button>
                      </>
                    )}

                    {table.status === 'OCCUPIED' && (
                      <button
                        onClick={() => navigate(`/shop/dining/orders?openOrder=true&target=${table.currentSessionId ? `session:${table.currentSessionId}` : `table:${table.id}`}`)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          padding: '0.45rem',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        <UtensilsCrossed size={13} /> + Take Order
                      </button>
                    )}

                    <button
                      onClick={() => setQrModalTable(table)}
                      title="View & Print Digital QR Menu"
                      style={{
                        padding: '0.45rem 0.65rem',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <QrCode size={14} /> QR
                    </button>

                    <button
                      onClick={() => handleOpenTableModal(table)}
                      title="Edit Table Details"
                      style={{
                        padding: '0.45rem',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      <Edit size={14} />
                    </button>

                    <button
                      onClick={() => handleDeleteTable(table)}
                      title="Delete Table"
                      style={{
                        padding: '0.45rem',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#ef4444',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- ADD/EDIT TABLE MODAL --- */}
      {isTableModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '460px',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {editingTable ? `Edit Table ${editingTable.tableNumber}` : 'Add New Dining Table'}
              </h3>
              <button
                onClick={() => setIsTableModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTable}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Table Number / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. T-01, Rooftop-A, Booth 4"
                  value={tableForm.tableNumber}
                  onChange={(e) => setTableForm({ ...tableForm, tableNumber: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Dining Area / Floor Section
                </label>
                <select
                  value={tableForm.areaId}
                  onChange={(e) => setTableForm({ ...tableForm, areaId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                >
                  <option value="">Unassigned General Area</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Seating Capacity (Guests) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={50}
                  value={tableForm.seatingCapacity}
                  onChange={(e) => setTableForm({ ...tableForm, seatingCapacity: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.6rem 1.5rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                  }}
                >
                  {submitting ? 'Saving...' : editingTable ? 'Save Changes' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT AREA MODAL --- */}
      {isAreaModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '440px',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {editingArea ? `Edit Area: ${editingArea.name}` : 'Create Dining Area'}
              </h3>
              <button
                onClick={() => setIsAreaModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveArea}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Area / Section Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Hall, AC Family Lounge, Rooftop"
                  value={areaForm.name}
                  onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Non-smoking outdoor garden seating"
                  value={areaForm.description}
                  onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAreaModalOpen(false)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.6rem 1.5rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                  }}
                >
                  {submitting ? 'Saving...' : editingArea ? 'Update Area' : 'Save Area'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SEAT TABLE / START SESSION MODAL --- */}
      {sessionModalTable && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '460px',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Seat Guests at Table {sessionModalTable.tableNumber}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Section: {sessionModalTable.areaName || 'General'}
                </span>
              </div>
              <button
                onClick={() => setSessionModalTable(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStartSession}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Guest Count *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={30}
                  value={sessionForm.guestCount}
                  onChange={(e) => setSessionForm({ ...sessionForm, guestCount: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe / Walk-in"
                  value={sessionForm.customerName}
                  onChange={(e) => setSessionForm({ ...sessionForm, customerName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Customer Phone (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 9876543210"
                  value={sessionForm.customerPhone}
                  onChange={(e) => setSessionForm({ ...sessionForm, customerPhone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Seating / Dietary Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. High chair needed, window seat"
                  value={sessionForm.notes}
                  onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setSessionModalTable(null)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.6rem 1.5rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {submitting ? 'Starting...' : 'Open Session & Seat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- QR CODE VIEW & PRINT MODAL --- */}
      {qrModalTable && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            id="printable-qr-card"
            style={{
              background: '#ffffff',
              color: '#111827',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '380px',
              padding: '2rem',
              boxShadow: 'var(--shadow-xl)',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }} className="no-print">
              <button
                onClick={() => setQrModalTable(null)}
                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.1em', color: '#10b981', textTransform: 'uppercase' }}>
              SCAN TO VIEW DIGITAL MENU
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0.35rem 0', color: '#111827' }}>
              TABLE {qrModalTable.tableNumber}
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1.5rem' }}>
              {qrModalTable.areaName || 'Main Dining Floor'}
            </div>

            {/* QR Code Canvas / Visual representation */}
            <div
              style={{
                background: '#f9fafb',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '2px solid #e5e7eb',
                display: 'inline-block',
                marginBottom: '1.25rem',
              }}
            >
              {/* High-contrast printable SVG QR representation */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  window.location.origin + '/dining/public/menu/' + qrModalTable.qrCodeToken
                )}`}
                alt={`QR Menu for Table ${qrModalTable.tableNumber}`}
                style={{ width: '180px', height: '180px', display: 'block' }}
              />
            </div>

            <div style={{ fontSize: '0.8rem', color: '#4b5563', marginBottom: '1.25rem' }}>
              Point phone camera to scan and browse the live interactive food & beverages menu.
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }} className="no-print">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    window.location.origin + '/dining/public/menu/' + qrModalTable.qrCodeToken
                  );
                  showNotification('QR Menu Link copied to clipboard!');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.6rem 0.9rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                <Copy size={15} /> Copy Link
              </button>

              <button
                onClick={() => {
                  window.open('/dining/public/menu/' + qrModalTable.qrCodeToken, '_blank');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.6rem 0.9rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                <ExternalLink size={15} /> Preview
              </button>

              <button
                onClick={() => window.print()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.6rem 1rem',
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                <Printer size={15} /> Print QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
