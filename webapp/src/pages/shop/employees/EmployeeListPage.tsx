import React, { useState, useEffect } from 'react';
import { employeeApi } from '../../../api/employeeApi';
import { Employee, EmployeeStats, CreateEmployeeRequest, UpdateEmployeeRequest } from '../../../types';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Briefcase,
  KeyRound,
  Edit2,
  CheckCircle,
  AlertCircle,
  X,
  CreditCard,
  UserCheck,
  Calendar,
  Lock,
} from 'lucide-react';

export const EmployeeListPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Messages & Submit state
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state for Adding
  const initialAddForm: CreateEmployeeRequest = {
    fullName: '',
    username: '',
    email: '',
    password: 'Staff@12345',
    phone: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    designation: 'Senior Cashier & Billing Head',
    department: 'Cash Counter',
    roleCode: 'CASHIER',
    joiningDate: new Date().toISOString().split('T')[0],
    monthlySalary: 25000,
    salaryPayoutMethod: 'BANK_TRANSFER',
    bankAccountNumber: '',
    bankIfscCode: '',
    panOrIdNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    notes: '',
  };
  const [addForm, setAddForm] = useState<CreateEmployeeRequest>(initialAddForm);

  // Form state for Editing
  const [editForm, setEditForm] = useState<UpdateEmployeeRequest>({
    fullName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    designation: '',
    department: '',
    roleCode: 'CASHIER',
    joiningDate: '',
    monthlySalary: 0,
    salaryPayoutMethod: 'BANK_TRANSFER',
    bankAccountNumber: '',
    bankIfscCode: '',
    panOrIdNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    status: 'ACTIVE',
    notes: '',
  });

  // Password reset state
  const [newPassword, setNewPassword] = useState('Staff@12345');

  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, statsRes] = await Promise.all([
        employeeApi.getEmployees({
          search: search || undefined,
          status: statusFilter || undefined,
          designation: designationFilter || undefined,
          page,
          size: 10,
        }),
        employeeApi.getStats(),
      ]);

      setEmployees(empRes.content || []);
      setTotalPages(empRes.totalPages || 1);
      setTotalElements(empRes.totalElements || 0);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load employee directory', err);
      showToast('error', 'Failed to load employee records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter, designationFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadData();
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Handle Add Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: CreateEmployeeRequest = {
        ...addForm,
        password: addForm.password?.trim() || 'Staff@12345',
        monthlySalary: Number(addForm.monthlySalary) || 0,
      };

      await employeeApi.createEmployee(payload);
      showToast('success', `Staff member ${addForm.fullName} onboarded successfully!`);
      setIsAddModalOpen(false);
      setAddForm(initialAddForm);
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to onboard staff member.';
      showToast('error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEditForm({
      fullName: emp.fullName,
      email: emp.email,
      phone: emp.phone,
      alternatePhone: emp.alternatePhone || '',
      address: emp.address || '',
      city: emp.city || '',
      state: emp.state || '',
      postalCode: emp.postalCode || '',
      designation: emp.designation,
      department: emp.department || '',
      roleCode: emp.roleCode,
      joiningDate: emp.joiningDate || '',
      monthlySalary: emp.monthlySalary ?? 0,
      salaryPayoutMethod: emp.salaryPayoutMethod || 'BANK_TRANSFER',
      bankAccountNumber: emp.bankAccountNumber || '',
      bankIfscCode: emp.bankIfscCode || '',
      panOrIdNumber: emp.panOrIdNumber || '',
      emergencyContactName: emp.emergencyContactName || '',
      emergencyContactPhone: emp.emergencyContactPhone || '',
      status: emp.status,
      notes: emp.notes || '',
    });
    setIsEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setSubmitting(true);
    try {
      await employeeApi.updateEmployee(selectedEmployee.id, {
        ...editForm,
        monthlySalary: Number(editForm.monthlySalary) || 0,
      });
      showToast('success', `Staff records for ${editForm.fullName} updated successfully!`);
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update employee details.';
      showToast('error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Status Toggle
  const handleToggleStatus = async (emp: Employee, newStatus: string) => {
    try {
      await employeeApi.changeStatus(emp.id, newStatus);
      showToast('success', `${emp.fullName}'s status changed to ${newStatus}`);
      loadData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update status.');
    }
  };

  // Handle Reset Password Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setSubmitting(true);
    try {
      await employeeApi.resetPassword(selectedEmployee.id, newPassword);
      showToast('success', `Password for ${selectedEmployee.fullName} reset successfully!`);
      setIsPasswordModalOpen(false);
      setNewPassword('Staff@12345');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  const roleDisplayNames: Record<string, string> = {
    STORE_MANAGER: 'Store Operations Manager',
    CASHIER: 'Cashier / Billing Counter',
    SALES_ASSOCIATE: 'Floor Sales Associate',
    INVENTORY_CLERK: 'Inventory & Stock Clerk',
    SHOP_EMPLOYEE: 'General Store Staff',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* SaaS Page Header */}
      <div className="saas-header">
        <div className="saas-title-group">
          <div className="saas-icon-badge" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
            <Users size={22} />
          </div>
          <div>
            <h1 className="saas-title">Staff & Employee Management</h1>
            <p className="saas-subtitle">
              Maintain staff contact profiles, residential addresses, monthly compensation, and POS permissions.
            </p>
          </div>
        </div>

        <div className="saas-actions">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <UserPlus size={16} />
            <span>Onboard New Staff</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            background: toastMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${toastMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: toastMessage.type === 'success' ? '#10b981' : '#ef4444',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {toastMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Modern SaaS KPI Stats Grid */}
      <div className="saas-stat-grid">
        <div className="saas-stat-card">
          <div className="saas-stat-top">
            <span className="saas-stat-label">Total Headcount</span>
            <div className="saas-stat-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="saas-stat-value">
            {stats?.totalEmployees ?? 0}
          </div>
          <div className="saas-stat-footer">Enrolled team members</div>
        </div>

        <div className="saas-stat-card">
          <div className="saas-stat-top">
            <span className="saas-stat-label">Active On Duty</span>
            <div className="saas-stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <UserCheck size={18} />
            </div>
          </div>
          <div className="saas-stat-value" style={{ color: '#10b981' }}>
            {stats?.activeEmployees ?? 0}
          </div>
          <div className="saas-stat-footer">Operating on store floors</div>
        </div>

        <div className="saas-stat-card">
          <div className="saas-stat-top">
            <span className="saas-stat-label">On Leave</span>
            <div className="saas-stat-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div className="saas-stat-value" style={{ color: '#3b82f6' }}>
            {stats?.onLeaveEmployees ?? 0}
          </div>
          <div className="saas-stat-footer">Approved scheduled absence</div>
        </div>

        <div className="saas-stat-card">
          <div className="saas-stat-top">
            <span className="saas-stat-label">Monthly Payroll</span>
            <div className="saas-stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="saas-stat-value" style={{ color: '#f59e0b' }}>
            ₹{(stats?.monthlyPayroll ?? 0).toLocaleString()}
          </div>
          <div className="saas-stat-footer">Total active staff compensation</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Search by code (EMP-001), name, mobile phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: '180px' }}>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="INACTIVE">Inactive</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Search size={14} /> Search
          </button>

          {(search || statusFilter || designationFilter) && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setDesignationFilter('');
                setPage(0);
              }}
            >
              Clear Filters
            </button>
          )}
        </form>
      </div>

      {/* Main Staff Directory Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Retrieving store employee records...</p>
          </div>
        ) : employees.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                color: 'var(--accent-primary)',
              }}
            >
              <Users size={28} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
              No Staff Members Found
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
              Start building your store team by onboarding cashiers, sales associates, or inventory staff.
            </p>
            <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary btn-sm">
              <UserPlus size={15} style={{ marginRight: '0.4rem' }} /> Add First Employee
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>EMPLOYEE & CODE</th>
                  <th>DESIGNATION & ROLE</th>
                  <th>PHONE & RESIDENTIAL ADDRESS</th>
                  <th>SALARY & PAYOUT</th>
                  <th>JOINING DATE</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: 'var(--accent-gradient)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            flexShrink: 0,
                          }}
                        >
                          {emp.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                              {emp.fullName}
                            </span>
                            <span className="shop-code-badge" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                              {emp.employeeCode}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            @{emp.username} • {emp.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                          {emp.designation}
                        </div>
                        <span className="badge badge-primary" style={{ fontSize: '0.68rem', marginTop: '2px' }}>
                          {roleDisplayNames[emp.roleCode] || emp.roleName}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', color: 'var(--text-primary)' }}>
                          <Phone size={13} style={{ color: 'var(--accent-primary)' }} />
                          <strong>{emp.phone}</strong>
                        </div>
                        {emp.address ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }} title={`${emp.address}, ${emp.city}`}>
                            <MapPin size={12} />
                            <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {emp.address}, {emp.city}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No address stored</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          ₹{emp.monthlySalary.toLocaleString()} <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ mo</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          via {emp.salaryPayoutMethod.replace('_', ' ')}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                        {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          emp.status === 'ACTIVE'
                            ? 'badge-success'
                            : emp.status === 'ON_LEAVE'
                            ? 'badge-primary'
                            : 'badge-danger'
                        }`}
                        style={{ fontSize: '0.72rem' }}
                      >
                        {emp.status}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openEditModal(emp)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.6rem' }}
                          title="Maintain Employee Record"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setIsPasswordModalOpen(true);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.6rem' }}
                          title="Reset Login Password"
                        >
                          <KeyRound size={13} />
                        </button>
                        {emp.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleToggleStatus(emp, 'INACTIVE')}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.35rem 0.6rem', color: 'var(--danger)' }}
                            title="Deactivate Staff"
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(emp, 'ACTIVE')}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.35rem 0.6rem', color: 'var(--success)' }}
                            title="Reactivate Staff"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Showing {employees.length} of {totalElements} records
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                disabled={page === 0}
              >
                Previous
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. ADD EMPLOYEE MODAL (CORRECTED OVERLAY & SCROLLABLE CONTAINER)           */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '820px',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
              padding: 0,
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 2rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-secondary)',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Onboard New Staff Member
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                  Register employee identity, residential address, compensation, and store permissions
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div
                style={{
                  padding: '1.5rem 2rem',
                  overflowY: 'auto',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                }}
              >
                {/* 1. Account & Identity */}
                <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem' }}>
                    1. Identity & Credentials
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={addForm.fullName}
                        onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                        placeholder="e.g. Ramesh Kumar"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Login Username *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={addForm.username}
                        onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                        placeholder="e.g. ramesh_cashier"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Official Email Address *</label>
                      <input
                        type="email"
                        className="form-control"
                        required
                        value={addForm.email}
                        onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                        placeholder="ramesh@store.com"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Initial Password</label>
                      <input
                        type="text"
                        className="form-control"
                        value={addForm.password}
                        onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                        placeholder="Staff@12345"
                      />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Default: Staff@12345 (Staff can change upon login)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Designation & Store Role */}
                <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem' }}>
                    2. Store Role & Department
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Designation / Job Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={addForm.designation}
                        onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
                        placeholder="e.g. Senior Billing Cashier"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <input
                        type="text"
                        className="form-control"
                        value={addForm.department}
                        onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                        placeholder="e.g. Cash Counter, Floor Sales"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">System Role Access *</label>
                      <select
                        className="form-control"
                        value={addForm.roleCode}
                        onChange={(e) => setAddForm({ ...addForm, roleCode: e.target.value })}
                      >
                        <option value="CASHIER">Cashier / Billing Counter</option>
                        <option value="SALES_ASSOCIATE">Floor Sales Associate</option>
                        <option value="INVENTORY_CLERK">Inventory & Stock Clerk</option>
                        <option value="STORE_MANAGER">Store Operations Manager</option>
                        <option value="SHOP_EMPLOYEE">General Store Staff</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Joining Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={addForm.joiningDate}
                        onChange={(e) => setAddForm({ ...addForm, joiningDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Phone & Residential Address */}
                <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem' }}>
                    3. Contact & Residential Address
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Mobile Phone *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={addForm.phone}
                        onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                        placeholder="+91 9848022334"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Alternate Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        value={addForm.alternatePhone}
                        onChange={(e) => setAddForm({ ...addForm, alternatePhone: e.target.value })}
                        placeholder="+91 9848000000"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Residential Street Address</label>
                    <input
                      type="text"
                      className="form-control"
                      value={addForm.address}
                      onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                      placeholder="Flat 302, Sai Residency, Road No. 5"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        className="form-control"
                        value={addForm.city}
                        onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                        placeholder="Hyderabad"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State</label>
                      <input
                        type="text"
                        className="form-control"
                        value={addForm.state}
                        onChange={(e) => setAddForm({ ...addForm, state: e.target.value })}
                        placeholder="Telangana"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Postal / PIN Code</label>
                      <input
                        type="text"
                        className="form-control"
                        value={addForm.postalCode}
                        onChange={(e) => setAddForm({ ...addForm, postalCode: e.target.value })}
                        placeholder="500072"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Compensation & Banking */}
                <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem' }}>
                    4. Salary & Banking Records
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Monthly Salary (₹)</label>
                      <input
                        type="number"
                        step="500"
                        min="0"
                        className="form-control"
                        value={addForm.monthlySalary}
                        onChange={(e) => setAddForm({ ...addForm, monthlySalary: parseFloat(e.target.value) || 0 })}
                        placeholder="26000"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Payout Method</label>
                      <select
                        className="form-control"
                        value={addForm.salaryPayoutMethod}
                        onChange={(e) => setAddForm({ ...addForm, salaryPayoutMethod: e.target.value })}
                      >
                        <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                        <option value="UPI">UPI Direct</option>
                        <option value="CASH">Cash in Hand</option>
                        <option value="CHEQUE">Cheque</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Bank Account Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={addForm.bankAccountNumber}
                        onChange={(e) => setAddForm({ ...addForm, bankAccountNumber: e.target.value })}
                        placeholder="50100234567890"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Bank IFSC Code</label>
                      <input
                        type="text"
                        className="form-control"
                        value={addForm.bankIfscCode}
                        onChange={(e) => setAddForm({ ...addForm, bankIfscCode: e.target.value })}
                        placeholder="HDFC0001234"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">PAN / Government ID</label>
                      <input
                        type="text"
                        className="form-control"
                        value={addForm.panOrIdNumber}
                        onChange={(e) => setAddForm({ ...addForm, panOrIdNumber: e.target.value })}
                        placeholder="ABCDE1234F"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Emergency Contact */}
                <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem' }}>
                    5. Emergency Contact
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Emergency Contact Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={addForm.emergencyContactName}
                        onChange={(e) => setAddForm({ ...addForm, emergencyContactName: e.target.value })}
                        placeholder="Suresh Sharma"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Emergency Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        value={addForm.emergencyContactPhone}
                        onChange={(e) => setAddForm({ ...addForm, emergencyContactPhone: e.target.value })}
                        placeholder="+91 9848011223"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Fixed Footer */}
              <div
                style={{
                  padding: '1rem 2rem',
                  borderTop: '1px solid var(--border-subtle)',
                  background: 'var(--bg-secondary)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  alignItems: 'center',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ minWidth: '180px' }}
                >
                  {submitting ? 'Creating Employee...' : 'Confirm & Onboard Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EDIT EMPLOYEE MODAL                                                    */}
      {/* ========================================================================= */}
      {isEditModalOpen && selectedEmployee && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '820px',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
              padding: 0,
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 2rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-secondary)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Maintain Staff Record: {selectedEmployee.fullName}
                  </h2>
                  <span className="shop-code-badge">{selectedEmployee.employeeCode}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                  Update contact details, residential address, salary compensation, and system role
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div
                style={{
                  padding: '1.5rem 2rem',
                  overflowY: 'auto',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                }}
              >
                {/* Personal & Role */}
                <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Designation / Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={editForm.designation}
                        onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">System Role *</label>
                      <select
                        className="form-control"
                        value={editForm.roleCode}
                        onChange={(e) => setEditForm({ ...editForm, roleCode: e.target.value })}
                      >
                        <option value="CASHIER">Cashier / Billing Counter</option>
                        <option value="SALES_ASSOCIATE">Floor Sales Associate</option>
                        <option value="INVENTORY_CLERK">Inventory & Stock Clerk</option>
                        <option value="STORE_MANAGER">Store Operations Manager</option>
                        <option value="SHOP_EMPLOYEE">General Store Staff</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Employment Status</label>
                      <select
                        className="form-control"
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      >
                        <option value="ACTIVE">Active (On Duty)</option>
                        <option value="ON_LEAVE">On Leave</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="TERMINATED">Terminated</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Joining Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editForm.joiningDate}
                        onChange={(e) => setEditForm({ ...editForm, joiningDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Phone & Address */}
                <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem' }}>
                    Contact & Residential Address
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Primary Mobile Phone *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Alternate Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.alternatePhone}
                        onChange={(e) => setEditForm({ ...editForm, alternatePhone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Street Address</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.state}
                        onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">PIN Code</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.postalCode}
                        onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Salary & Banking */}
                <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem' }}>
                    Salary & Banking Records
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Monthly Salary (₹)</label>
                      <input
                        type="number"
                        step="500"
                        min="0"
                        className="form-control"
                        value={editForm.monthlySalary}
                        onChange={(e) => setEditForm({ ...editForm, monthlySalary: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Payout Method</label>
                      <select
                        className="form-control"
                        value={editForm.salaryPayoutMethod}
                        onChange={(e) => setEditForm({ ...editForm, salaryPayoutMethod: e.target.value })}
                      >
                        <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                        <option value="UPI">UPI Direct</option>
                        <option value="CASH">Cash in Hand</option>
                        <option value="CHEQUE">Cheque</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Bank Account Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.bankAccountNumber}
                        onChange={(e) => setEditForm({ ...editForm, bankAccountNumber: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Bank IFSC</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.bankIfscCode}
                        onChange={(e) => setEditForm({ ...editForm, bankIfscCode: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">PAN / Government ID</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.panOrIdNumber}
                        onChange={(e) => setEditForm({ ...editForm, panOrIdNumber: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem' }}>
                    Emergency Contact
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Contact Person</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.emergencyContactName}
                        onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Emergency Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.emergencyContactPhone}
                        onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Fixed Footer */}
              <div
                style={{
                  padding: '1rem 2rem',
                  borderTop: '1px solid var(--border-subtle)',
                  background: 'var(--bg-secondary)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ minWidth: '150px' }}
                >
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. RESET PASSWORD MODAL                                                   */}
      {/* ========================================================================= */}
      {isPasswordModalOpen && selectedEmployee && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '460px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
              padding: 0,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '1.25rem 1.75rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-secondary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={18} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Reset Staff Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} style={{ padding: '1.5rem 1.75rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.45 }}>
                Set a new login password for <strong>{selectedEmployee.fullName}</strong> (@{selectedEmployee.username}).
              </p>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">New Password *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !newPassword}
                >
                  {submitting ? 'Resetting...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
