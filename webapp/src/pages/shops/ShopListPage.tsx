import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import {
  ApiResponse,
  PageResponse,
  ShopSummary,
  ShopDetail,
  BusinessType,
  PlatformModule,
  CreateShopRequest,
  OtpResponse,
  ResetOwnerPasswordRequest,
  UpdateShopOwnerRequest,
  UpdateShopProfileRequest,
} from '../../types';
import {
  Store,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Building,
  Mail,
  Phone,
  Layers,
  FileText,
  AlertCircle,
  X,
  Key,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Lock,
  User,
  RefreshCw,
  UserCheck,
  RotateCcw,
  EyeOff,
  MapPin,
  ExternalLink,
  Navigation,
  Edit3,
  Tag,
} from 'lucide-react';
import { OtpBoxInput } from '../../components/common/OtpBoxInput';

export const ShopListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shops, setShops] = useState<ShopSummary[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Metadata
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [modules, setModules] = useState<PlatformModule[]>([]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedShopDetail, setSelectedShopDetail] = useState<ShopDetail | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Status Change (Activation / Deactivation) Modal State
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    shopId: number;
    shopName: string;
    currentStatus: string;
    targetStatus: string;
    otp: string;
    otpSent: boolean;
    otpCodePreview?: string;
    otpCountdown: number;
    error: string | null;
    submitting: boolean;
  }>({
    isOpen: false,
    shopId: 0,
    shopName: '',
    currentStatus: '',
    targetStatus: '',
    otp: '',
    otpSent: false,
    otpCountdown: 0,
    error: null,
    submitting: false,
  });

  // Password Reset Modal State
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    shopId: number;
    shopName: string;
    ownerUsername: string;
    newPassword: string;
    confirmPassword: string;
    showPassword: boolean;
    otp: string;
    otpSent: boolean;
    otpCodePreview?: string;
    error: string | null;
    submitting: boolean;
  }>({
    isOpen: false,
    shopId: 0,
    shopName: '',
    ownerUsername: '',
    newPassword: '',
    confirmPassword: '',
    showPassword: false,
    otp: '',
    otpSent: false,
    error: null,
    submitting: false,
  });

  // Ownership Update / Transfer Modal State
  const [ownershipModal, setOwnershipModal] = useState<{
    isOpen: boolean;
    shopId: number;
    shopName: string;
    fullName: string;
    username: string;
    email: string;
    phone: string;
    syncShopContact: boolean;
    otp: string;
    otpSent: boolean;
    otpCodePreview?: string;
    error: string | null;
    submitting: boolean;
  }>({
    isOpen: false,
    shopId: 0,
    shopName: '',
    fullName: '',
    username: '',
    email: '',
    phone: '',
    syncShopContact: true,
    otp: '',
    otpSent: false,
    error: null,
    submitting: false,
  });

  // Edit Shop Profile & Address Modal State
  const [editAddressModal, setEditAddressModal] = useState<{
    isOpen: boolean;
    shopId: number;
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    currency: string;
    timezone: string;
    error: string | null;
    submitting: boolean;
  }>({
    isOpen: false,
    shopId: 0,
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    error: null,
    submitting: false,
  });

  // Shop Creation Form State
  const [createForm, setCreateForm] = useState<CreateShopRequest>({
    shopCode: '',
    shopName: '',
    businessTypeId: 1,
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    ownerUsername: '',
    ownerEmail: '',
    ownerPassword: '',
    ownerFullName: '',
    ownerPhone: '',
    taxNumber: '',
    defaultTaxRate: 5.0,
    invoicePrefix: 'INV-',
    enabledModuleIds: [],
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsCreateModalOpen(true);
      searchParams.delete('create');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  useEffect(() => {
    // Load Business Types & Modules
    apiClient.get<ApiResponse<BusinessType[]>>('/admin/business-types?activeOnly=true')
      .then((res) => {
        if (res.data.success && res.data.data.length > 0) {
          setBusinessTypes(res.data.data);
          setCreateForm((prev) => ({ ...prev, businessTypeId: res.data.data[0].id }));
        }
      });

    apiClient.get<ApiResponse<PlatformModule[]>>('/admin/modules?activeOnly=true')
      .then((res) => {
        if (res.data.success) {
          setModules(res.data.data);
          const coreModuleIds = res.data.data.filter((m) => m.coreModule).map((m) => m.id);
          setCreateForm((prev) => ({ ...prev, enabledModuleIds: coreModuleIds }));
        }
      });
  }, []);

  const loadShops = async (pageNum = 0) => {
    try {
      setLoading(true);
      const params: any = { page: pageNum, size: 10 };
      if (searchTerm) params.search = searchTerm;
      if (selectedBusinessType) params.businessTypeId = selectedBusinessType;
      if (selectedStatus) params.status = selectedStatus;

      const res = await apiClient.get<ApiResponse<PageResponse<ShopSummary>>>('/admin/shops', { params });
      if (res.data.success) {
        setShops(res.data.data.content);
        setPage(res.data.data.page);
        setTotalPages(res.data.data.totalPages);
        setTotalElements(res.data.data.totalElements);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load shop records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShops(0);
  }, [selectedBusinessType, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadShops(0);
  };

  const handleOpenDetail = async (id: number) => {
    try {
      const res = await apiClient.get<ApiResponse<ShopDetail>>(`/admin/shops/${id}`);
      if (res.data.success) {
        setSelectedShopDetail(res.data.data);
        setIsDetailModalOpen(true);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load shop details', 'error');
    }
  };

  // -------------------------------------------------------------
  // STATUS CHANGE (ACTIVATION / DEACTIVATION) WITH OTP VERIFICATION
  // -------------------------------------------------------------
  const initiateStatusChange = (shopId: number, shopName: string, currentStatus: string) => {
    const targetStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setStatusModal({
      isOpen: true,
      shopId,
      shopName,
      currentStatus,
      targetStatus,
      otp: '',
      otpSent: false,
      otpCodePreview: undefined,
      otpCountdown: 0,
      error: null,
      submitting: false,
    });
  };

  const requestStatusOtp = async () => {
    try {
      const purpose = `SHOP_STATUS:${statusModal.shopId}`;
      const res = await apiClient.post<ApiResponse<OtpResponse>>('/admin/security/generate-otp', { purpose });
      if (res.data.success) {
        setStatusModal((prev) => ({
          ...prev,
          otpSent: true,
          otp: res.data.data.otp,
          otpCodePreview: res.data.data.otp,
          otpCountdown: 60,
          error: null,
        }));
        showToast(`Verification OTP generated: ${res.data.data.otp}`, 'info');
      }
    } catch (err: any) {
      setStatusModal((prev) => ({
        ...prev,
        error: err.response?.data?.message || 'Failed to generate security OTP',
      }));
    }
  };

  const handleConfirmStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModal.otp.trim()) {
      setStatusModal((prev) => ({ ...prev, error: 'Please enter the 6-digit Security OTP' }));
      return;
    }

    try {
      setStatusModal((prev) => ({ ...prev, submitting: true, error: null }));
      const url = `/admin/shops/${statusModal.shopId}/status?status=${statusModal.targetStatus}&otp=${encodeURIComponent(statusModal.otp.trim())}`;
      const res = await apiClient.patch<ApiResponse<ShopDetail>>(url);

      if (res.data.success) {
        showToast(
          `Shop '${statusModal.shopName}' successfully ${statusModal.targetStatus === 'ACTIVE' ? 'activated' : 'deactivated'}!`,
          'success'
        );
        setStatusModal((prev) => ({ ...prev, isOpen: false }));
        loadShops(page);
        if (selectedShopDetail && selectedShopDetail.id === statusModal.shopId) {
          setSelectedShopDetail(res.data.data);
        }
      }
    } catch (err: any) {
      setStatusModal((prev) => ({
        ...prev,
        error: err.response?.data?.message || 'Failed to update shop status. Invalid OTP.',
      }));
    } finally {
      setStatusModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // -------------------------------------------------------------
  // PASSWORD RESET WITH OTP VERIFICATION
  // -------------------------------------------------------------
  const openResetPasswordModal = () => {
    if (!selectedShopDetail) return;
    setPasswordModal({
      isOpen: true,
      shopId: selectedShopDetail.id,
      shopName: selectedShopDetail.name,
      ownerUsername: selectedShopDetail.owner?.username || 'owner',
      newPassword: '',
      confirmPassword: '',
      showPassword: false,
      otp: '',
      otpSent: false,
      otpCodePreview: undefined,
      error: null,
      submitting: false,
    });
  };

  const requestPasswordOtp = async () => {
    try {
      const purpose = `RESET_PASSWORD:${passwordModal.shopId}`;
      const res = await apiClient.post<ApiResponse<OtpResponse>>('/admin/security/generate-otp', { purpose });
      if (res.data.success) {
        setPasswordModal((prev) => ({
          ...prev,
          otpSent: true,
          otp: res.data.data.otp,
          otpCodePreview: res.data.data.otp,
          error: null,
        }));
        showToast(`Verification OTP generated: ${res.data.data.otp}`, 'info');
      }
    } catch (err: any) {
      setPasswordModal((prev) => ({
        ...prev,
        error: err.response?.data?.message || 'Failed to generate security OTP',
      }));
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordModal.newPassword.length < 8) {
      setPasswordModal((prev) => ({ ...prev, error: 'Password must be at least 8 characters long' }));
      return;
    }
    if (passwordModal.newPassword !== passwordModal.confirmPassword) {
      setPasswordModal((prev) => ({ ...prev, error: 'Passwords do not match' }));
      return;
    }
    if (!passwordModal.otp.trim()) {
      setPasswordModal((prev) => ({ ...prev, error: 'Please enter the 6-digit Security OTP' }));
      return;
    }

    try {
      setPasswordModal((prev) => ({ ...prev, submitting: true, error: null }));
      const payload: ResetOwnerPasswordRequest = {
        newPassword: passwordModal.newPassword,
        otp: passwordModal.otp.trim(),
      };
      const res = await apiClient.post<ApiResponse<ShopDetail>>(
        `/admin/shops/${passwordModal.shopId}/owner/reset-password`,
        payload
      );

      if (res.data.success) {
        showToast(`Password for owner '${passwordModal.ownerUsername}' reset successfully!`, 'success');
        setPasswordModal((prev) => ({ ...prev, isOpen: false }));
        setSelectedShopDetail(res.data.data);
      }
    } catch (err: any) {
      setPasswordModal((prev) => ({
        ...prev,
        error: err.response?.data?.message || 'Password reset failed. Invalid or expired OTP.',
      }));
    } finally {
      setPasswordModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // -------------------------------------------------------------
  // OWNERSHIP UPDATE / TRANSFER WITH OTP VERIFICATION
  // -------------------------------------------------------------
  const openOwnershipModal = () => {
    if (!selectedShopDetail) return;
    setOwnershipModal({
      isOpen: true,
      shopId: selectedShopDetail.id,
      shopName: selectedShopDetail.name,
      fullName: selectedShopDetail.owner?.fullName || '',
      username: selectedShopDetail.owner?.username || '',
      email: selectedShopDetail.owner?.email || '',
      phone: selectedShopDetail.owner?.phone || '',
      syncShopContact: true,
      otp: '',
      otpSent: false,
      otpCodePreview: undefined,
      error: null,
      submitting: false,
    });
  };

  const requestOwnershipOtp = async () => {
    try {
      const purpose = `TRANSFER_OWNERSHIP:${ownershipModal.shopId}`;
      const res = await apiClient.post<ApiResponse<OtpResponse>>('/admin/security/generate-otp', { purpose });
      if (res.data.success) {
        setOwnershipModal((prev) => ({
          ...prev,
          otpSent: true,
          otp: res.data.data.otp,
          otpCodePreview: res.data.data.otp,
          error: null,
        }));
        showToast(`Verification OTP generated: ${res.data.data.otp}`, 'info');
      }
    } catch (err: any) {
      setOwnershipModal((prev) => ({
        ...prev,
        error: err.response?.data?.message || 'Failed to generate security OTP',
      }));
    }
  };

  const handleOwnershipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownershipModal.fullName.trim() || !ownershipModal.username.trim() || !ownershipModal.email.trim()) {
      setOwnershipModal((prev) => ({ ...prev, error: 'Name, Username, and Email are strictly required' }));
      return;
    }
    if (!ownershipModal.otp.trim()) {
      setOwnershipModal((prev) => ({ ...prev, error: 'Please enter the 6-digit Security OTP' }));
      return;
    }

    try {
      setOwnershipModal((prev) => ({ ...prev, submitting: true, error: null }));
      const payload: UpdateShopOwnerRequest = {
        fullName: ownershipModal.fullName.trim(),
        username: ownershipModal.username.trim(),
        email: ownershipModal.email.trim(),
        phone: ownershipModal.phone.trim() || undefined,
        syncShopContact: ownershipModal.syncShopContact,
        otp: ownershipModal.otp.trim(),
      };

      const res = await apiClient.put<ApiResponse<ShopDetail>>(
        `/admin/shops/${ownershipModal.shopId}/owner`,
        payload
      );

      if (res.data.success) {
        showToast(`Ownership for '${ownershipModal.shopName}' updated successfully!`, 'success');
        setOwnershipModal((prev) => ({ ...prev, isOpen: false }));
        setSelectedShopDetail(res.data.data);
        loadShops(page);
      }
    } catch (err: any) {
      setOwnershipModal((prev) => ({
        ...prev,
        error: err.response?.data?.message || 'Ownership update failed. Invalid OTP or duplicate username.',
      }));
    } finally {
      setOwnershipModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // -------------------------------------------------------------
  // EDIT SHOP PROFILE & ADDRESS MODAL
  // -------------------------------------------------------------
  const openEditAddressModal = () => {
    if (!selectedShopDetail) return;
    setEditAddressModal({
      isOpen: true,
      shopId: selectedShopDetail.id,
      name: selectedShopDetail.name,
      phone: selectedShopDetail.phone || '',
      email: selectedShopDetail.email || '',
      address: selectedShopDetail.address || '',
      city: selectedShopDetail.city || '',
      state: selectedShopDetail.state || '',
      postalCode: selectedShopDetail.postalCode || '',
      currency: selectedShopDetail.currency || 'INR',
      timezone: selectedShopDetail.timezone || 'Asia/Kolkata',
      error: null,
      submitting: false,
    });
  };

  const handleEditAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAddressModal.name.trim()) {
      setEditAddressModal((prev) => ({ ...prev, error: 'Store Name is required' }));
      return;
    }

    try {
      setEditAddressModal((prev) => ({ ...prev, submitting: true, error: null }));
      const payload: UpdateShopProfileRequest = {
        name: editAddressModal.name.trim(),
        phone: editAddressModal.phone.trim() || undefined,
        email: editAddressModal.email.trim() || undefined,
        address: editAddressModal.address.trim() || undefined,
        city: editAddressModal.city.trim() || undefined,
        state: editAddressModal.state.trim() || undefined,
        postalCode: editAddressModal.postalCode.trim() || undefined,
        currency: editAddressModal.currency.trim() || 'INR',
        timezone: editAddressModal.timezone.trim() || 'Asia/Kolkata',
      };

      const res = await apiClient.put<ApiResponse<ShopDetail>>(
        `/admin/shops/${editAddressModal.shopId}`,
        payload
      );

      if (res.data.success) {
        showToast(`Store profile & map address updated successfully!`, 'success');
        setEditAddressModal((prev) => ({ ...prev, isOpen: false }));
        setSelectedShopDetail(res.data.data);
        loadShops(page);
      }
    } catch (err: any) {
      setEditAddressModal((prev) => ({
        ...prev,
        error: err.response?.data?.message || 'Failed to update store address & profile',
      }));
    } finally {
      setEditAddressModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // -------------------------------------------------------------
  // ONBOARD STORE: VALIDATION & REVIEW CONFIRMATION MODAL
  // -------------------------------------------------------------
  const handleValidateForReview = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!createForm.shopName.trim()) {
      setFormError('Store Name is required');
      return;
    }
    if (!createForm.shopCode.trim()) {
      setFormError('Store Code is required');
      return;
    }
    if (!createForm.email?.trim()) {
      setFormError('Store Email Address is required');
      return;
    }
    if (!createForm.ownerFullName.trim()) {
      setFormError('Shop Owner Full Name is required');
      return;
    }
    if (!createForm.ownerUsername.trim()) {
      setFormError('Shop Owner Username is required');
      return;
    }
    if (!createForm.ownerEmail.trim()) {
      setFormError('Shop Owner Email is required');
      return;
    }
    if (createForm.ownerPassword.length < 8) {
      setFormError('Owner Initial Password must be at least 8 characters');
      return;
    }
    if (!createForm.enabledModuleIds || createForm.enabledModuleIds.length === 0) {
      setFormError('Please select at least one module to activate');
      return;
    }

    setIsReviewModalOpen(true);
  };

  const handleFinalProvisionSubmit = async () => {
    setFormError(null);
    setFormSubmitting(true);

    try {
      const res = await apiClient.post<ApiResponse<ShopDetail>>('/admin/shops', createForm);
      if (res.data.success) {
        setIsReviewModalOpen(false);
        setIsCreateModalOpen(false);
        showToast(`Store '${res.data.data.name}' provisioned and activated successfully!`, 'success');
        loadShops(0);

        // Reset form
        setCreateForm({
          shopCode: '',
          shopName: '',
          businessTypeId: businessTypes[0]?.id || 1,
          phone: '',
          email: '',
          address: '',
          city: '',
          state: '',
          postalCode: '',
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          ownerUsername: '',
          ownerEmail: '',
          ownerPassword: '',
          ownerFullName: '',
          ownerPhone: '',
          taxNumber: '',
          defaultTaxRate: 5.0,
          invoicePrefix: 'INV-',
          enabledModuleIds: modules.filter((m) => m.coreModule).map((m) => m.id),
        });
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Shop provisioning failed');
      setIsReviewModalOpen(false);
    } finally {
      setFormSubmitting(false);
    }
  };

  const toggleModuleSelection = (moduleId: number) => {
    setCreateForm((prev) => {
      const current = prev.enabledModuleIds || [];
      const updated = current.includes(moduleId)
        ? current.filter((id) => id !== moduleId)
        : [...current, moduleId];
      return { ...prev, enabledModuleIds: updated };
    });
  };

  const selectedBusinessTypeName =
    businessTypes.find((bt) => bt.id === createForm.businessTypeId)?.name || 'Custom Business';

  const getMapQuery = (address?: string, city?: string, state?: string, postalCode?: string) => {
    const parts = [address, city, state, postalCode, 'India'].filter(Boolean);
    return parts.length > 1 ? parts.join(', ') : 'Hyderabad, India';
  };

  return (
    <div>
      {/* Toast Notification Banner */}
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          {toast.type === 'success' && <CheckCircle2 size={18} />}
          {toast.type === 'error' && <AlertCircle size={18} />}
          {toast.type === 'info' && <ShieldCheck size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Shops & Tenants
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Total registered business stores: {totalElements}
          </p>
        </div>

        <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
          <Plus size={18} /> Onboard New Shop
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 260px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.4rem' }}
              placeholder="Search by shop name, code, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ flex: '1 1 180px' }}>
            <select
              className="form-control"
              value={selectedBusinessType}
              onChange={(e) => setSelectedBusinessType(e.target.value)}
            >
              <option value="">All Business Types</option>
              {businessTypes.map((bt) => (
                <option key={bt.id} value={bt.id}>
                  {bt.name} ({bt.code})
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <select
              className="form-control"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            <Filter size={16} /> Filter
          </button>
        </form>
      </div>

      {/* Table Card */}
      <div className="glass-card">
        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading shops data...
          </div>
        ) : shops.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <Store size={44} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Shops Found</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              No business shops match your filter criteria or none have been onboarded yet.
            </p>
            <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
              <Plus size={16} /> Onboard First Shop
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Shop Information</th>
                  <th>Tenant Group</th>
                  <th>Business Type</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shops.map((shop) => (
                  <tr key={shop.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{shop.name}</div>
                      <span className="shop-code-badge" title="Unique Store Identification Code">
                        <Tag size={11} style={{ flexShrink: 0 }} />
                        {shop.code}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        • {shop.tenantName}
                      </div>
                    </td>
                    <td>
                      {/* Clean, Non-Highlighted Natural Typography for Business Category */}
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {shop.businessTypeName}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        <div>{shop.phone || '—'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {shop.email || '—'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                        <span>{shop.city || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${shop.status.toLowerCase()}`}>
                        {shop.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {/* Kept as clean "Details" button */}
                        <button
                          onClick={() => handleOpenDetail(shop.id)}
                          className="btn btn-secondary btn-sm"
                          title="View Store Details & Map"
                        >
                          <Eye size={14} /> Details
                        </button>
                        <button
                          onClick={() => initiateStatusChange(shop.id, shop.name, shop.status)}
                          className={`btn btn-sm ${shop.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}`}
                          title={shop.status === 'ACTIVE' ? 'Deactivate with OTP' : 'Activate with OTP'}
                        >
                          {shop.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Page {page + 1} of {totalPages} ({totalElements} total stores)
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    disabled={page === 0}
                    onClick={() => loadShops(page - 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => loadShops(page + 1)}
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

      {/* ========================================================= */}
      {/* 1. ONBOARD NEW SHOP MODAL                                 */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '820px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Store size={20} style={{ color: '#fff' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Onboard Business Store
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Atomically provisions Tenant boundary, Store Entity, Owner credentials, and Map Location.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'var(--danger-bg)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleValidateForReview}>
              {/* Step 1: Shop Profile, Address & Live Map */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  1. Shop Profile & Physical Address
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Shop Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Royal Fashion Boutique"
                      value={createForm.shopName}
                      onChange={(e) => setCreateForm({ ...createForm, shopName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Shop Code (Unique Identifier) *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. ROYAL-FASHION-01"
                      value={createForm.shopCode}
                      onChange={(e) => setCreateForm({ ...createForm, shopCode: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Business Category *</label>
                    <select
                      className="form-control"
                      value={createForm.businessTypeId}
                      onChange={(e) => setCreateForm({ ...createForm, businessTypeId: Number(e.target.value) })}
                    >
                      {businessTypes.map((bt) => (
                        <option key={bt.id} value={bt.id}>
                          {bt.name} ({bt.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Store Contact Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="+91 9876543210"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Store Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="store@business.com"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Store Address / Street *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Plot 42, Main Road, Near Clock Tower"
                      value={createForm.address}
                      onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 0.8fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Hyderabad"
                      value={createForm.city}
                      onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Telangana"
                      value={createForm.state}
                      onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Postal / PIN Code</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="500001"
                      value={createForm.postalCode}
                      onChange={(e) => setCreateForm({ ...createForm, postalCode: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Currency</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createForm.currency}
                      onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })}
                    />
                  </div>
                </div>

                {/* Real Live Map Preview */}
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                      <MapPin size={14} /> Live Geolocation Map Preview
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Location: {getMapQuery(createForm.address, createForm.city, createForm.state, createForm.postalCode)}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '170px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                    <iframe
                      title="Onboard Store Location Map"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(getMapQuery(createForm.address, createForm.city, createForm.state, createForm.postalCode))}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                      style={{ border: 0 }}
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Shop Owner Account Credentials */}
              <div style={{ marginBottom: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  2. Shop Owner Account Credentials
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Owner Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Ramesh Kumar"
                      value={createForm.ownerFullName}
                      onChange={(e) => setCreateForm({ ...createForm, ownerFullName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Owner Username *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. ramesh_owner"
                      value={createForm.ownerUsername}
                      onChange={(e) => setCreateForm({ ...createForm, ownerUsername: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Owner Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="owner@business.com"
                      value={createForm.ownerEmail}
                      onChange={(e) => setCreateForm({ ...createForm, ownerEmail: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Initial Password * (min 8 chars)</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Password@123"
                      value={createForm.ownerPassword}
                      onChange={(e) => setCreateForm({ ...createForm, ownerPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Enable Feature Modules */}
              <div style={{ marginBottom: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  3. Feature Modules to Activate
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
                  {modules.map((m) => {
                    const isSelected = (createForm.enabledModuleIds || []).includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleModuleSelection(m.id)}
                        className={`module-select-card ${isSelected ? 'selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ cursor: 'pointer', transform: 'scale(1.15)' }}
                        />
                        <div>
                          <div className="module-select-title">
                            {m.name}
                          </div>
                          {m.coreModule ? (
                            <span style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', fontWeight: 700 }}>CORE MODULE</span>
                          ) : (
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ADD-ON</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Tax Configuration */}
              <div style={{ marginBottom: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  4. Tax & Invoicing Configuration
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Tax / GST Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 29AAAAA0000A1Z5"
                      value={createForm.taxNumber}
                      onChange={(e) => setCreateForm({ ...createForm, taxNumber: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Default Tax Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={createForm.defaultTaxRate}
                      onChange={(e) => setCreateForm({ ...createForm, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Invoice Prefix</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createForm.invoicePrefix}
                      onChange={(e) => setCreateForm({ ...createForm, invoicePrefix: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Review & Provision Store <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. READY TO ONBOARD - CONFIRMATION & REVIEW MODAL         */}
      {/* ========================================================= */}
      {isReviewModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={24} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Ready to Onboard Store
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  Please review store profile, physical address, and owner parameters before provisioning.
                </p>
              </div>
            </div>

            {/* Summary Review Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Store & Category */}
              <div style={{ padding: '0.9rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Store Profile & Physical Address
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div><strong>Store Name:</strong> {createForm.shopName}</div>
                  <div><strong>Store Code:</strong> <span className="code-mono">{createForm.shopCode}</span></div>
                  <div><strong>Business Category:</strong> {selectedBusinessTypeName}</div>
                  <div><strong>Store Email:</strong> {createForm.email}</div>
                  <div><strong>Street Address:</strong> {createForm.address || 'N/A'}</div>
                  <div><strong>City / State:</strong> {createForm.city || 'N/A'}, {createForm.state || ''}</div>
                  <div><strong>Postal / PIN:</strong> {createForm.postalCode || 'N/A'}</div>
                  <div><strong>Currency:</strong> {createForm.currency}</div>
                </div>
              </div>

              {/* Shop Owner Credentials */}
              <div style={{ padding: '0.9rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Assigned Shop Holder / Owner
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div><strong>Full Name:</strong> {createForm.ownerFullName}</div>
                  <div><strong>Username:</strong> <span className="code-mono">{createForm.ownerUsername}</span></div>
                  <div><strong>Owner Email:</strong> {createForm.ownerEmail}</div>
                  <div><strong>Role:</strong> <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>SHOP_OWNER</span></div>
                </div>
              </div>

              {/* Modules To Activate */}
              <div style={{ padding: '0.9rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Feature Modules to Provision ({createForm.enabledModuleIds?.length || 0})
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {(createForm.enabledModuleIds || []).map((modId) => {
                    const m = modules.find((x) => x.id === modId);
                    return (
                      <span key={modId} className="badge badge-active" style={{ fontSize: '0.7rem' }}>
                        ✓ {m?.name || `Module #${modId}`}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Confirmation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="btn btn-secondary"
                disabled={formSubmitting}
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleFinalProvisionSubmit}
                className="btn btn-primary"
                disabled={formSubmitting}
              >
                {formSubmitting ? (
                  <>
                    <RefreshCw size={16} className="spin" /> Provisioning Tenant...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} /> Confirm & Provision Store
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. STATUS CHANGE (ACTIVATION / DEACTIVATION) OTP MODAL    */}
      {/* ========================================================= */}
      {statusModal.isOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: statusModal.targetStatus === 'ACTIVE' ? 'var(--success-bg)' : 'var(--danger-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {statusModal.targetStatus === 'ACTIVE' ? (
                  <CheckCircle size={26} style={{ color: 'var(--success)' }} />
                ) : (
                  <AlertTriangle size={26} style={{ color: 'var(--danger)' }} />
                )}
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {statusModal.targetStatus === 'ACTIVE' ? 'Activate Store' : 'Deactivate Store'}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Security Verification Required
                </p>
              </div>
            </div>

            <div
              style={{
                padding: '0.9rem',
                borderRadius: 'var(--radius-md)',
                background: statusModal.targetStatus === 'ACTIVE' ? 'var(--success-bg)' : 'var(--danger-bg)',
                border: statusModal.targetStatus === 'ACTIVE' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                lineHeight: 1.45,
                color: 'var(--text-primary)',
              }}
            >
              {statusModal.targetStatus === 'ACTIVE' ? (
                <span>
                  Reactivating <strong>{statusModal.shopName}</strong> will restore cashier POS billing, inventory sync, and store owner access immediately.
                </span>
              ) : (
                <span>
                  Deactivating <strong>{statusModal.shopName}</strong> will instantly lock checkout counters, disable POS terminals, and revoke shop owner access.
                </span>
              )}
            </div>

            {statusModal.error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--danger-bg)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                <AlertCircle size={16} />
                <span>{statusModal.error}</span>
              </div>
            )}

            <form onSubmit={handleConfirmStatusChange}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Admin Security OTP *
                  </label>
                  <button
                    type="button"
                    onClick={requestStatusOtp}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  >
                    <Key size={13} /> {statusModal.otpSent ? 'Resend OTP' : 'Request Security OTP'}
                  </button>
                </div>

                {statusModal.otpSent && (
                  <div style={{ margin: '0.4rem 0 0.6rem 0' }}>
                    <div className="otp-badge">
                      <ShieldCheck size={14} /> OTP Code: <strong>{statusModal.otpCodePreview}</strong> (Valid for 5 mins)
                    </div>
                  </div>
                )}

                <OtpBoxInput
                  value={statusModal.otp}
                  onChange={(val) => setStatusModal({ ...statusModal, otp: val })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
                  className="btn btn-secondary"
                  disabled={statusModal.submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${statusModal.targetStatus === 'ACTIVE' ? 'btn-primary' : 'btn-danger'}`}
                  disabled={statusModal.submitting || !statusModal.otp}
                >
                  {statusModal.submitting
                    ? 'Verifying...'
                    : statusModal.targetStatus === 'ACTIVE'
                    ? 'Verify & Activate Store'
                    : 'Verify & Deactivate Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. RESET SHOP OWNER PASSWORD MODAL (WITH OTP)             */}
      {/* ========================================================= */}
      {passwordModal.isOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Key size={22} style={{ color: '#d97706' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Reset Owner Password
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  User: <span className="code-mono">{passwordModal.ownerUsername}</span> ({passwordModal.shopName})
                </p>
              </div>
            </div>

            {passwordModal.error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--danger-bg)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                <AlertCircle size={16} />
                <span>{passwordModal.error}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit}>
              <div className="form-group">
                <label className="form-label">New Password * (min 8 chars)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={passwordModal.showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Enter new strong password"
                    value={passwordModal.newPassword}
                    onChange={(e) => setPasswordModal({ ...passwordModal, newPassword: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordModal((prev) => ({ ...prev, showPassword: !prev.showPassword }))}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {passwordModal.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password *</label>
                <input
                  type={passwordModal.showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Re-enter new password"
                  value={passwordModal.confirmPassword}
                  onChange={(e) => setPasswordModal({ ...passwordModal, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Security Verification OTP *
                  </label>
                  <button
                    type="button"
                    onClick={requestPasswordOtp}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  >
                    <Key size={13} /> {passwordModal.otpSent ? 'Resend OTP' : 'Request Security OTP'}
                  </button>
                </div>

                {passwordModal.otpSent && (
                  <div style={{ margin: '0.4rem 0 0.6rem 0' }}>
                    <div className="otp-badge">
                      <ShieldCheck size={14} /> OTP Code: <strong>{passwordModal.otpCodePreview}</strong>
                    </div>
                  </div>
                )}

                <OtpBoxInput
                  value={passwordModal.otp}
                  onChange={(val) => setPasswordModal({ ...passwordModal, otp: val })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setPasswordModal((prev) => ({ ...prev, isOpen: false }))}
                  className="btn btn-secondary"
                  disabled={passwordModal.submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none' }}
                  disabled={passwordModal.submitting || !passwordModal.otp}
                >
                  {passwordModal.submitting ? 'Resetting Password...' : 'Verify & Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. UPDATE SHOP OWNERSHIP MODAL (WITH OTP)                 */}
      {/* ========================================================= */}
      {ownershipModal.isOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={22} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Update Shop Ownership
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Store: <strong>{ownershipModal.shopName}</strong>
                </p>
              </div>
            </div>

            {ownershipModal.error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--danger-bg)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                <AlertCircle size={16} />
                <span>{ownershipModal.error}</span>
              </div>
            )}

            <form onSubmit={handleOwnershipSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Owner Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={ownershipModal.fullName}
                    onChange={(e) => setOwnershipModal({ ...ownershipModal, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={ownershipModal.username}
                    onChange={(e) => setOwnershipModal({ ...ownershipModal, username: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={ownershipModal.email}
                    onChange={(e) => setOwnershipModal({ ...ownershipModal, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    value={ownershipModal.phone}
                    onChange={(e) => setOwnershipModal({ ...ownershipModal, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ margin: '0.5rem 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="syncShopContact"
                  checked={ownershipModal.syncShopContact}
                  onChange={(e) => setOwnershipModal({ ...ownershipModal, syncShopContact: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="syncShopContact" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Sync primary store contact details with updated owner email and phone
                </label>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Security Verification OTP *
                  </label>
                  <button
                    type="button"
                    onClick={requestOwnershipOtp}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  >
                    <Key size={13} /> {ownershipModal.otpSent ? 'Resend OTP' : 'Request Security OTP'}
                  </button>
                </div>

                {ownershipModal.otpSent && (
                  <div style={{ margin: '0.4rem 0 0.6rem 0' }}>
                    <div className="otp-badge">
                      <ShieldCheck size={14} /> OTP Code: <strong>{ownershipModal.otpCodePreview}</strong>
                    </div>
                  </div>
                )}

                <OtpBoxInput
                  value={ownershipModal.otp}
                  onChange={(val) => setOwnershipModal({ ...ownershipModal, otp: val })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setOwnershipModal((prev) => ({ ...prev, isOpen: false }))}
                  className="btn btn-secondary"
                  disabled={ownershipModal.submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={ownershipModal.submitting || !ownershipModal.otp}
                >
                  {ownershipModal.submitting ? 'Updating Ownership...' : 'Verify & Update Ownership'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. EDIT SHOP PROFILE & PHYSICAL ADDRESS MODAL             */}
      {/* ========================================================= */}
      {editAddressModal.isOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(5, 150, 105, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={22} style={{ color: 'var(--success)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Edit Store Profile & Address
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Update physical street location, locality, and contact details for real map display.
                </p>
              </div>
            </div>

            {editAddressModal.error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--danger-bg)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                <AlertCircle size={16} />
                <span>{editAddressModal.error}</span>
              </div>
            )}

            <form onSubmit={handleEditAddressSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Store Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editAddressModal.name}
                    onChange={(e) => setEditAddressModal({ ...editAddressModal, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Store Contact Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editAddressModal.phone}
                    onChange={(e) => setEditAddressModal({ ...editAddressModal, phone: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Store Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={editAddressModal.email}
                    onChange={(e) => setEditAddressModal({ ...editAddressModal, email: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Street Address / Shop No. *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Shop 12, Main Road, Near Charminar"
                    value={editAddressModal.address}
                    onChange={(e) => setEditAddressModal({ ...editAddressModal, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Hyderabad"
                    value={editAddressModal.city}
                    onChange={(e) => setEditAddressModal({ ...editAddressModal, city: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Telangana"
                    value={editAddressModal.state}
                    onChange={(e) => setEditAddressModal({ ...editAddressModal, state: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Postal / PIN Code</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="500001"
                    value={editAddressModal.postalCode}
                    onChange={(e) => setEditAddressModal({ ...editAddressModal, postalCode: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editAddressModal.currency}
                    onChange={(e) => setEditAddressModal({ ...editAddressModal, currency: e.target.value })}
                  />
                </div>
              </div>

              {/* Map Preview on Edit */}
              <div style={{ marginTop: '0.5rem', marginBottom: '1.25rem', padding: '0.6rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Updated Map Query: {getMapQuery(editAddressModal.address, editAddressModal.city, editAddressModal.state, editAddressModal.postalCode)}
                </div>
                <div style={{ height: '140px', borderRadius: '6px', overflow: 'hidden' }}>
                  <iframe
                    title="Live Edit Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(getMapQuery(editAddressModal.address, editAddressModal.city, editAddressModal.state, editAddressModal.postalCode))}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                    style={{ border: 0 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setEditAddressModal((prev) => ({ ...prev, isOpen: false }))}
                  className="btn btn-secondary"
                  disabled={editAddressModal.submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', border: 'none' }}
                  disabled={editAddressModal.submitting}
                >
                  {editAddressModal.submitting ? 'Saving Address...' : 'Save Address & Update Map'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. SHOP DETAILS MODAL (TOP HIGHLIGHTS & REAL MAP DISPLAY)  */}
      {/* ========================================================= */}
      {isDetailModalOpen && selectedShopDetail && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '740px' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {selectedShopDetail.name}
                  </h3>
                  <span className={`badge badge-${selectedShopDetail.status.toLowerCase()}`}>
                    {selectedShopDetail.status}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                  <span className="shop-code-badge" title="Unique Store Identification Code">
                    <Tag size={11} /> {selectedShopDetail.code}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    • Tenant: <strong>{selectedShopDetail.tenantName}</strong> ({selectedShopDetail.tenantCode})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* TOP HIGHLIGHTED SECURITY & OWNERSHIP ACTION BAR */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.9rem 1.15rem',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%)',
                border: '1.5px solid rgba(99, 102, 241, 0.35)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.12)',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={20} style={{ color: '#fff' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Admin Security & Ownership Controls
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Protected by multi-factor administrative Security OTP
                  </div>
                </div>
              </div>

              {/* HIGHLIGHTED BUTTONS IN TOP */}
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  onClick={openResetPasswordModal}
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    boxShadow: '0 3px 10px rgba(245, 158, 11, 0.35)',
                    border: 'none',
                    padding: '0.5rem 0.95rem',
                    fontSize: '0.825rem',
                    borderRadius: 'var(--radius-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                  title="Reset Owner Password with Security OTP"
                >
                  <Key size={14} /> Reset Password
                </button>

                <button
                  onClick={openOwnershipModal}
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    boxShadow: '0 3px 10px rgba(99, 102, 241, 0.35)',
                    border: 'none',
                    padding: '0.5rem 0.95rem',
                    fontSize: '0.825rem',
                    borderRadius: 'var(--radius-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                  title="Update or Transfer Shop Ownership with Security OTP"
                >
                  <UserCheck size={14} /> Update Ownership
                </button>

                <button
                  onClick={openEditAddressModal}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.825rem',
                    padding: '0.5rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                  title="Update Store Address, City & Location"
                >
                  <Edit3 size={14} /> Edit Address
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Store Profile & Contact */}
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h5 style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Store Profile & Contact
                  </h5>
                  <button
                    onClick={openEditAddressModal}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                  >
                    <Edit3 size={12} /> Edit Info
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.875rem' }}>
                  <div><strong style={{ color: 'var(--text-secondary)' }}>Category:</strong> {selectedShopDetail.businessTypeName}</div>
                  <div><strong style={{ color: 'var(--text-secondary)' }}>Currency / Zone:</strong> {selectedShopDetail.currency} ({selectedShopDetail.timezone})</div>
                  <div><strong style={{ color: 'var(--text-secondary)' }}>Store Phone:</strong> {selectedShopDetail.phone || 'N/A'}</div>
                  <div>
                    <strong style={{ color: 'var(--text-secondary)' }}>Store Email:</strong>{' '}
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{selectedShopDetail.email || 'N/A'}</span>
                  </div>
                  <div><strong style={{ color: 'var(--text-secondary)' }}>Street Address:</strong> {selectedShopDetail.address || 'N/A'}</div>
                  <div>
                    <strong style={{ color: 'var(--text-secondary)' }}>City / Region:</strong>{' '}
                    {selectedShopDetail.city || 'N/A'}{selectedShopDetail.state ? `, ${selectedShopDetail.state}` : ''}{selectedShopDetail.postalCode ? ` - ${selectedShopDetail.postalCode}` : ''}
                  </div>
                  <div><strong style={{ color: 'var(--text-secondary)' }}>Optimistic Lock Version:</strong> {selectedShopDetail.version}</div>
                </div>
              </div>

              {/* REAL MAP LOCATION & GEOLOCATION CARD */}
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={16} style={{ color: 'var(--accent-primary)' }} />
                    <h5 style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Physical Shop Location & Real Interactive Map
                    </h5>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getMapQuery(selectedShopDetail.address, selectedShopDetail.city, selectedShopDetail.state, selectedShopDetail.postalCode))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <ExternalLink size={12} /> Open in Google Maps
                  </a>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Pinned Location:</strong>{' '}
                  <span>
                    {selectedShopDetail.address ? `${selectedShopDetail.address}, ` : ''}
                    {selectedShopDetail.city || 'Hyderabad'}
                    {selectedShopDetail.state ? `, ${selectedShopDetail.state}` : ''}
                    {selectedShopDetail.postalCode ? ` - ${selectedShopDetail.postalCode}` : ''}
                  </span>
                </div>

                {/* Real Interactive Google Maps Embed Frame */}
                <div style={{ width: '100%', height: '240px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <iframe
                    title={`${selectedShopDetail.name} Location Map`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(getMapQuery(selectedShopDetail.address, selectedShopDetail.city, selectedShopDetail.state, selectedShopDetail.postalCode))}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    style={{ border: 0 }}
                  />
                </div>
              </div>

              {/* Shop Owner / Business Holder Details */}
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h5 style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Shop Holder / Business Owner
                    </h5>
                    <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>SHOP_OWNER</span>
                  </div>
                </div>
                {selectedShopDetail.owner ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.875rem' }}>
                    <div><strong style={{ color: 'var(--text-secondary)' }}>Owner Name:</strong> {selectedShopDetail.owner.fullName}</div>
                    <div><strong style={{ color: 'var(--text-secondary)' }}>Username:</strong> <span className="code-mono">{selectedShopDetail.owner.username}</span></div>
                    <div>
                      <strong style={{ color: 'var(--text-secondary)' }}>Owner Email:</strong>{' '}
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{selectedShopDetail.owner.email}</span>
                    </div>
                    <div><strong style={{ color: 'var(--text-secondary)' }}>Owner Phone:</strong> {selectedShopDetail.owner.phone || 'N/A'}</div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No dedicated owner assigned to tenant.</p>
                )}
              </div>

              {/* Invoicing Configuration */}
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <h5 style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
                  Billing & Tax Configuration
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div><strong style={{ color: 'var(--text-secondary)' }}>Tax Number:</strong> {selectedShopDetail.configuration?.taxNumber || 'None'}</div>
                  <div><strong style={{ color: 'var(--text-secondary)' }}>Default Tax:</strong> {selectedShopDetail.configuration?.defaultTaxRate || 0}%</div>
                  <div><strong style={{ color: 'var(--text-secondary)' }}>Prefix:</strong> {selectedShopDetail.configuration?.invoicePrefix || 'INV-'}</div>
                </div>
              </div>

              {/* Activated Modules */}
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <h5 style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>
                  Active Feature Modules ({selectedShopDetail.modules?.length || 0})
                </h5>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {(selectedShopDetail.modules || []).map((m) => (
                    <span key={m.moduleId} className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                      ✓ {m.moduleName} ({m.moduleCode})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '0.75rem' }}>
              <button
                onClick={() => initiateStatusChange(selectedShopDetail.id, selectedShopDetail.name, selectedShopDetail.status)}
                className={`btn ${selectedShopDetail.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}`}
              >
                {selectedShopDetail.status === 'ACTIVE' ? 'Deactivate Shop' : 'Activate Shop'}
              </button>
              <button onClick={() => setIsDetailModalOpen(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
