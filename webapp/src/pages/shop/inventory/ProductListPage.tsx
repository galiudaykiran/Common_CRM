import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Barcode,
  Boxes,
  History,
  ArrowUpDown,
  RefreshCw,
  Edit2,
  CheckCircle,
  X,
  TrendingUp,
  Percent,
  Layers,
  FileText,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Camera,
  Scan,
} from 'lucide-react';
import { BarcodeScannerModal } from '../../../components/common/BarcodeScannerModal';
import { inventoryApi } from '../../../api/inventoryApi';
import {
  Product,
  Category,
  CreateProductRequest,
  UpdateProductRequest,
  StockAdjustmentRequest,
  StockReceiveRequest,
  InventoryTransaction,
} from '../../../types';

export const ProductListPage: React.FC = () => {
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const pageSize = 15;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [stockLevelFilter, setStockLevelFilter] = useState<'ALL' | 'LOW' | 'OUT' | 'IN'>('ALL');

  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [receivingProduct, setReceivingProduct] = useState<Product | null>(null);
  const [ledgerProduct, setLedgerProduct] = useState<Product | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Ledger state
  const [ledgerItems, setLedgerItems] = useState<InventoryTransaction[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Hardware Barcode Scanner Buffer
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const [scannedAlert, setScannedAlert] = useState<string | null>(null);

  // Camera Sensor Barcode Scanner Modal State
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'PRODUCT_FORM' | 'SEARCH_BAR'>('PRODUCT_FORM');

  const handleBarcodeScanned = (scannedCode: string) => {
    if (scannerTarget === 'PRODUCT_FORM') {
      setFormState((prev) => ({ ...prev, barcode: scannedCode }));
      setActionSuccess(`Scanned barcode: ${scannedCode}`);
      setTimeout(() => setActionSuccess(null), 4000);
    } else {
      setSearchTerm(scannedCode);
      handleBarcodeScan(scannedCode);
    }
  };

  // Form State for Add / Edit (String representation for clean, zero-free input handling)
  const [formState, setFormState] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '' as string | number,
    hsnSacCode: '',
    unitOfMeasure: 'PCS',
    costPrice: '',
    sellingPrice: '',
    mrp: '',
    taxRate: '0',
    taxInclusive: false,
    reorderLevel: '10',
    safetyStock: '5',
    initialStock: '',
    binLocation: '',
    description: '',
    status: 'ACTIVE',
  });

  // Stock Adjustment Form
  const [adjustQuantity, setAdjustQuantity] = useState<string>('');
  const [adjustType, setAdjustType] = useState<StockAdjustmentRequest['adjustmentType']>('CORRECTION');
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  // Stock Receiving Form
  const [receiveQuantity, setReceiveQuantity] = useState<string>('');
  const [receiveUnitCost, setReceiveUnitCost] = useState<string>('');
  const [receiveInvoice, setReceiveInvoice] = useState<string>('');
  const [receiveNotes, setReceiveNotes] = useState<string>('');

  // New Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatCode, setNewCatCode] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Helper to strip leading zeros e.g. "01000" -> "1000", but keep "0" or "0.5"
  const cleanNumericInput = (val: string) => {
    if (!val) return '';
    return val.replace(/^0+(?=\d)/, '');
  };

  // Load Products & Categories
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.searchProducts({
        search: searchTerm || undefined,
        categoryId: selectedCategory,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page,
        size: pageSize,
      });

      let items = data.content;
      if (stockLevelFilter === 'LOW') {
        items = items.filter((p) => p.isLowStock);
      } else if (stockLevelFilter === 'OUT') {
        items = items.filter((p) => p.isOutOfStock);
      } else if (stockLevelFilter === 'IN') {
        items = items.filter((p) => !p.isOutOfStock);
      }

      setProducts(items);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, statusFilter, stockLevelFilter, page]);

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await inventoryApi.getActiveCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Hardware Barcode Scanner Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'textarea' || (activeTag === 'input' && (document.activeElement as HTMLInputElement).type === 'text')) {
        return;
      }

      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (barcodeBufferRef.current.length >= 3) {
          const barcode = barcodeBufferRef.current;
          barcodeBufferRef.current = '';
          handleBarcodeScan(barcode);
        }
        return;
      }

      if (diff > 100) {
        barcodeBufferRef.current = '';
      }

      if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBarcodeScan = async (barcode: string) => {
    setScannedAlert(`Scanning Barcode: ${barcode}...`);
    try {
      const product = await inventoryApi.getProductByBarcode(barcode);
      setScannedAlert(`Found: ${product.name} (Stock: ${product.currentStock} ${product.unitOfMeasure})`);
      setSearchTerm(barcode);
    } catch (err) {
      setScannedAlert(`No product registered with barcode: ${barcode}`);
    }
    setTimeout(() => setScannedAlert(null), 4000);
  };

  // Open Edit Modal
  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setFormState({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      categoryId: p.categoryId ? p.categoryId : '',
      hsnSacCode: p.hsnSacCode || '',
      unitOfMeasure: p.unitOfMeasure,
      costPrice: p.costPrice != null ? String(p.costPrice) : '',
      sellingPrice: p.sellingPrice != null ? String(p.sellingPrice) : '',
      mrp: p.mrp != null ? String(p.mrp) : '',
      taxRate: String(p.taxRate || 0),
      taxInclusive: p.taxInclusive,
      reorderLevel: String(p.reorderLevel || 10),
      safetyStock: String(p.safetyStock || 5),
      initialStock: '',
      binLocation: p.binLocation || '',
      description: p.description || '',
      status: p.status,
    });
    setActionError(null);
    setShowAddModal(true);
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);

    const costNum = parseFloat(formState.costPrice) || 0;
    const sellNum = parseFloat(formState.sellingPrice) || 0;
    const mrpNum = formState.mrp ? parseFloat(formState.mrp) : undefined;
    const taxNum = parseFloat(formState.taxRate) || 0;
    const reorderNum = parseInt(formState.reorderLevel) || 10;
    const safetyNum = parseInt(formState.safetyStock) || 5;
    const initialNum = formState.initialStock ? parseFloat(formState.initialStock) : 0;
    const catId = formState.categoryId ? Number(formState.categoryId) : undefined;

    try {
      if (editingProduct) {
        const updatePayload: UpdateProductRequest = {
          name: formState.name.trim(),
          sku: formState.sku.trim(),
          barcode: formState.barcode.trim() || undefined,
          categoryId: catId,
          hsnSacCode: formState.hsnSacCode.trim() || undefined,
          unitOfMeasure: formState.unitOfMeasure,
          costPrice: costNum,
          sellingPrice: sellNum,
          mrp: mrpNum,
          taxRate: taxNum,
          taxInclusive: formState.taxInclusive,
          reorderLevel: reorderNum,
          safetyStock: safetyNum,
          binLocation: formState.binLocation.trim() || undefined,
          description: formState.description.trim() || undefined,
          status: formState.status,
        };
        await inventoryApi.updateProduct(editingProduct.id, updatePayload);
        setActionSuccess(`Product '${formState.name}' updated successfully`);
      } else {
        const createPayload: CreateProductRequest = {
          name: formState.name.trim(),
          sku: formState.sku.trim() || undefined,
          barcode: formState.barcode.trim() || undefined,
          categoryId: catId,
          hsnSacCode: formState.hsnSacCode.trim() || undefined,
          unitOfMeasure: formState.unitOfMeasure,
          costPrice: costNum,
          sellingPrice: sellNum,
          mrp: mrpNum,
          taxRate: taxNum,
          taxInclusive: formState.taxInclusive,
          reorderLevel: reorderNum,
          safetyStock: safetyNum,
          initialStock: initialNum,
          binLocation: formState.binLocation.trim() || undefined,
          description: formState.description.trim() || undefined,
          status: formState.status,
        };
        await inventoryApi.createProduct(createPayload);
        setActionSuccess(`Product '${formState.name}' registered to catalog`);
      }

      setShowAddModal(false);
      setEditingProduct(null);
      fetchProducts();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to save product details');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Stock Adjustment
  const handleOpenAdjustment = (p: Product) => {
    setAdjustingProduct(p);
    setAdjustType('CORRECTION');
    setAdjustQuantity(String(p.currentStock));
    setAdjustNotes('');
    setActionError(null);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    setActionLoading(true);
    setActionError(null);

    const qty = parseFloat(adjustQuantity);
    if (isNaN(qty)) {
      setActionError('Please enter a valid quantity');
      setActionLoading(false);
      return;
    }

    try {
      await inventoryApi.adjustStock({
        productId: adjustingProduct.id,
        adjustmentType: adjustType,
        quantity: qty,
        notes: adjustNotes,
      });
      setActionSuccess(`Stock updated for ${adjustingProduct.name}`);
      setAdjustingProduct(null);
      fetchProducts();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Stock Receiving
  const handleOpenReceive = (p: Product) => {
    setReceivingProduct(p);
    setReceiveQuantity('');
    setReceiveUnitCost(p.costPrice ? String(p.costPrice) : '');
    setReceiveInvoice('');
    setReceiveNotes('');
    setActionError(null);
  };

  const handleSaveReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingProduct) return;
    setActionLoading(true);
    setActionError(null);

    const qty = parseFloat(receiveQuantity);
    if (isNaN(qty) || qty <= 0) {
      setActionError('Received quantity must be greater than zero');
      setActionLoading(false);
      return;
    }

    try {
      await inventoryApi.receiveStock({
        productId: receivingProduct.id,
        quantity: qty,
        unitCost: receiveUnitCost ? parseFloat(receiveUnitCost) : undefined,
        invoiceNumber: receiveInvoice || undefined,
        notes: receiveNotes || undefined,
      });
      setActionSuccess(`Received ${qty} units for ${receivingProduct.name}`);
      setReceivingProduct(null);
      fetchProducts();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to record stock intake');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Ledger Timeline
  const handleOpenLedger = async (p: Product) => {
    setLedgerProduct(p);
    setLedgerLoading(true);
    try {
      const data = await inventoryApi.getProductLedger(p.id, { page: 0, size: 50 });
      setLedgerItems(data.content);
    } catch (err) {
      console.error('Failed to load ledger', err);
    } finally {
      setLedgerLoading(false);
    }
  };

  // Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      await inventoryApi.createCategory({
        name: newCatName,
        code: newCatCode || undefined,
        description: newCatDesc,
      });
      setNewCatName('');
      setNewCatCode('');
      setNewCatDesc('');
      setShowCategoryModal(false);
      fetchCategories();
      setActionSuccess('Category created successfully');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to create category');
    } finally {
      setActionLoading(false);
    }
  };

  // Calculations for Margin Preview in Add Modal
  const cost = parseFloat(formState.costPrice) || 0;
  const sell = parseFloat(formState.sellingPrice) || 0;
  const marginAmt = sell - cost;
  const marginPct = sell > 0 ? ((marginAmt / sell) * 100).toFixed(1) : '0';
  const markupPct = cost > 0 ? ((marginAmt / cost) * 100).toFixed(1) : '0';

  return (
    <div style={{ padding: '28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Toast Alerts */}
      {scannedAlert && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 2000,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <Barcode size={20} />
          {scannedAlert}
        </div>
      )}

      {actionSuccess && (
        <div
          style={{
            marginBottom: '20px',
            padding: '14px 18px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <CheckCircle size={18} />
          {actionSuccess}
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
              }}
            >
              <Package size={22} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Products Catalog & Inventory
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
            Multi-tier inventory tracking, double-entry stock ledger, and barcode-ready product catalog.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowCategoryModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '9px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Layers size={16} />
            Add Category
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setFormState({
                name: '',
                sku: '',
                barcode: '',
                categoryId: '',
                hsnSacCode: '',
                unitOfMeasure: 'PCS',
                costPrice: '',
                sellingPrice: '',
                mrp: '',
                taxRate: '0',
                taxInclusive: false,
                reorderLevel: '10',
                safetyStock: '5',
                initialStock: '',
                binLocation: '',
                description: '',
                status: 'ACTIVE',
              });
              setActionError(null);
              setShowAddModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '9px',
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
              transition: 'all 0.2s',
            }}
          >
            <Plus size={18} />
            Register Product
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          padding: '18px 22px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search
              size={18}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search by Product Name, SKU, or scan Barcode..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              style={{
                width: '100%',
                padding: '10px 42px 10px 38px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => {
                setScannerTarget('SEARCH_BAR');
                setShowScannerModal(true);
              }}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
              }}
              title="Scan barcode with camera sensor"
            >
              <Camera size={18} />
            </button>
          </div>

          {/* Category Dropdown */}
          <div style={{ minWidth: '180px' }}>
            <select
              value={selectedCategory || ''}
              onChange={(e) => {
                setSelectedCategory(e.target.value ? Number(e.target.value) : undefined);
                setPage(0);
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div style={{ minWidth: '140px' }}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DISCONTINUED">Discontinued</option>
            </select>
          </div>

          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory(undefined);
              setStatusFilter('ALL');
              setStockLevelFilter('ALL');
              setPage(0);
              fetchProducts();
            }}
            title="Reset Filters"
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-primary)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
            }}
          >
            <RefreshCw size={15} />
            Reset
          </button>
        </div>

        {/* Stock Level Quick Pills */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, marginRight: '4px' }}>
            Stock Filters:
          </span>
          {[
            { key: 'ALL', label: 'All Items' },
            { key: 'IN', label: 'In Stock' },
            { key: 'LOW', label: 'Low Stock Alerts', badgeColor: '#f59e0b' },
            { key: 'OUT', label: 'Out of Stock', badgeColor: '#ef4444' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setStockLevelFilter(item.key as any);
                setPage(0);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                border: stockLevelFilter === item.key ? '1px solid #3b82f6' : '1px solid var(--border-subtle)',
                background: stockLevelFilter === item.key ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-primary)',
                color: stockLevelFilter === item.key ? '#3b82f6' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Product Details
                </th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  SKU & Barcode
                </th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Category
                </th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Cost / Sell Price
                </th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Current Stock
                </th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Status
                </th>
                <th style={{ padding: '14px 18px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading product catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Package size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      No products found
                    </div>
                    <div style={{ fontSize: '13px' }}>Click "Register Product" above to add your first item.</div>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background 0.15s',
                      }}
                    >
                      {/* Name & Unit */}
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>{p.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                          <span>Unit: {p.unitOfMeasure}</span>
                          {p.hsnSacCode && <span>• HSN: {p.hsnSacCode}</span>}
                        </div>
                      </td>

                      {/* SKU & Barcode */}
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                          {p.sku}
                        </div>
                        {p.barcode ? (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Barcode size={13} /> {p.barcode}
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No barcode</span>
                        )}
                      </td>

                      {/* Category */}
                      <td style={{ padding: '16px 18px' }}>
                        {p.categoryName ? (
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: 'var(--bg-tertiary)',
                              border: '1px solid var(--border-subtle)',
                              fontSize: '12px',
                              fontWeight: 500,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {p.categoryName}
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>General</span>
                        )}
                      </td>

                      {/* Pricing */}
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                          ₹{Number(p.sellingPrice).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Cost: ₹{Number(p.costPrice).toFixed(2)}
                        </div>
                      </td>

                      {/* Stock Badge */}
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: 700,
                              background: p.isOutOfStock
                                ? 'rgba(239, 68, 68, 0.15)'
                                : p.isLowStock
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(16, 185, 129, 0.15)',
                              color: p.isOutOfStock ? '#ef4444' : p.isLowStock ? '#f59e0b' : '#10b981',
                              border: p.isOutOfStock
                                ? '1px solid rgba(239, 68, 68, 0.3)'
                                : p.isLowStock
                                ? '1px solid rgba(245, 158, 11, 0.3)'
                                : '1px solid rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            {p.currentStock} {p.unitOfMeasure}
                          </span>

                          {p.isLowStock && !p.isOutOfStock && (
                            <span title="Low stock threshold reached">
                              <AlertTriangle size={15} color="#f59e0b" />
                            </span>
                          )}
                        </div>
                        {p.binLocation && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Bin: {p.binLocation}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 18px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: p.status === 'ACTIVE' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(107, 114, 128, 0.12)',
                            color: p.status === 'ACTIVE' ? '#3b82f6' : '#9ca3af',
                          }}
                        >
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleOpenReceive(p)}
                            title="Inward Goods Receipt"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-subtle)',
                              background: 'var(--bg-primary)',
                              color: '#10b981',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Plus size={13} /> Receive
                          </button>

                          <button
                            onClick={() => handleOpenAdjustment(p)}
                            title="Adjust / Audit Stock"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-subtle)',
                              background: 'var(--bg-primary)',
                              color: '#f59e0b',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <ArrowUpDown size={13} /> Adjust
                          </button>

                          <button
                            onClick={() => handleOpenLedger(p)}
                            title="Stock Movement Ledger"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-subtle)',
                              background: 'var(--bg-primary)',
                              color: '#3b82f6',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <History size={13} />
                          </button>

                          <button
                            onClick={() => handleEdit(p)}
                            title="Edit Product"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-subtle)',
                              background: 'var(--bg-primary)',
                              color: 'var(--text-primary)',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            <Edit2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}
        >
          <div>
            Showing {products.length} of {totalElements} products
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-primary)',
                color: page === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: page === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span>
              Page {page + 1} of {totalPages || 1}
            </span>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-primary)',
                color: page + 1 >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: page + 1 >= totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. Register / Edit Product Modal                                          */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              maxWidth: '720px',
              width: '95%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              overflow: 'hidden',
            }}
          >
            {/* Fixed Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <Package size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {editingProduct ? 'Edit Product Details' : 'Register New Product'}
                  </h2>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {editingProduct ? `Updating SKU: ${editingProduct.sku}` : 'Add product to inventory catalog'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="productForm" onSubmit={handleSaveProduct} style={{ overflowY: 'auto', padding: '24px' }}>
              {actionError && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    fontSize: '13px',
                  }}
                >
                  {actionError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                {/* Product Name */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Organic Assam Black Tea 250g"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                    }}
                  />
                </div>

                {/* SKU */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    SKU Code (Auto-generated if empty)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., TEA-ASSAM-250"
                    value={formState.sku}
                    onChange={(e) => setFormState({ ...formState, sku: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>

                {/* Barcode */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Barcode / EAN (Scan or type)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setScannerTarget('PRODUCT_FORM');
                        setShowScannerModal(true);
                      }}
                      style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        color: 'var(--accent-primary)',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease',
                      }}
                      title="Scan using connected mobile device, camera sensor, or barcode gun"
                    >
                      <Camera size={13} />
                      <span>Scan Barcode</span>
                    </button>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Barcode
                      size={16}
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                    />
                    <input
                      type="text"
                      placeholder="e.g., 8901234567890"
                      value={formState.barcode}
                      onChange={(e) => setFormState({ ...formState, barcode: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 42px 10px 36px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setScannerTarget('PRODUCT_FORM');
                        setShowScannerModal(true);
                      }}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-primary)',
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                      }}
                      title="Open Camera Viewfinder / Mobile Sensor"
                    >
                      <Camera size={18} />
                    </button>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Scan with camera, connected mobile device, hardware scanner, or type manually.
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={formState.categoryId}
                    onChange={(e) => setFormState({ ...formState, categoryId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unit of Measure */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Unit of Measure *
                  </label>
                  <select
                    value={formState.unitOfMeasure}
                    onChange={(e) => setFormState({ ...formState, unitOfMeasure: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                    }}
                  >
                    <option value="PCS">Pieces (PCS)</option>
                    <option value="KG">Kilograms (KG)</option>
                    <option value="GM">Grams (GM)</option>
                    <option value="LTR">Liters (LTR)</option>
                    <option value="ML">Milliliters (ML)</option>
                    <option value="BOX">Box / Carton</option>
                    <option value="PACK">Pack / Bundle</option>
                    <option value="METER">Meter</option>
                  </select>
                </div>

                {/* Cost Price */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Cost Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="Enter cost price"
                    value={formState.costPrice}
                    onChange={(e) => setFormState({ ...formState, costPrice: cleanNumericInput(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                    }}
                  />
                </div>

                {/* Selling Price */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="Enter selling price"
                    value={formState.sellingPrice}
                    onChange={(e) => setFormState({ ...formState, sellingPrice: cleanNumericInput(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                    }}
                  />
                </div>

                {/* Margin Preview Card */}
                <div
                  style={{
                    gridColumn: '1 / -1',
                    padding: '12px 18px',
                    borderRadius: '10px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Gross Profit: </span>
                      <strong style={{ color: marginAmt >= 0 ? '#10b981' : '#ef4444' }}>
                        ₹{marginAmt.toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Profit Margin: </span>
                      <strong style={{ color: Number(marginPct) >= 0 ? '#10b981' : '#ef4444' }}>
                        {marginPct}%
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Markup: </span>
                      <strong>{markupPct}%</strong>
                    </div>
                  </div>
                  <TrendingUp size={16} color="#3b82f6" />
                </div>

                {/* Tax Rate */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Tax / GST Rate (%)
                  </label>
                  <select
                    value={formState.taxRate}
                    onChange={(e) => setFormState({ ...formState, taxRate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                    }}
                  >
                    <option value="0">0% (Exempt)</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST (Standard)</option>
                    <option value="28">28% GST</option>
                  </select>
                </div>

                {/* Reorder Level */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Low-Stock Reorder Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="10"
                    value={formState.reorderLevel}
                    onChange={(e) => setFormState({ ...formState, reorderLevel: cleanNumericInput(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                    }}
                  />
                </div>

                {/* Initial Stock (Only for new product) */}
                {!editingProduct && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Opening Stock (Initial Intake)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="Enter opening quantity (e.g., 50)"
                      value={formState.initialStock}
                      onChange={(e) => setFormState({ ...formState, initialStock: cleanNumericInput(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                )}

                {/* Bin Location */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Warehouse Bin / Shelf Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Aisle 3 - Shelf B2"
                    value={formState.binLocation}
                    onChange={(e) => setFormState({ ...formState, binLocation: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>
            </form>

            {/* Fixed Pinned Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
              }}
            >
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="productForm"
                disabled={actionLoading}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                }}
              >
                {actionLoading ? 'Saving...' : editingProduct ? 'Save Changes' : 'Register Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. Stock Adjustment Modal                                                 */}
      {/* ========================================================================= */}
      {adjustingProduct && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              maxWidth: '520px',
              width: '95%',
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Stock Adjustment & Audit
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {adjustingProduct.name} ({adjustingProduct.sku})
                </div>
              </div>
              <button onClick={() => setAdjustingProduct(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <form id="adjustForm" onSubmit={handleSaveAdjustment} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {actionError && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', fontSize: '13px' }}>
                  {actionError}
                </div>
              )}

              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Verified System Stock:</span>
                <strong style={{ fontSize: '16px', color: '#3b82f6' }}>
                  {adjustingProduct.currentStock} {adjustingProduct.unitOfMeasure}
                </strong>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Adjustment Type *
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                >
                  <option value="CORRECTION">Physical Audit Count (Reconcile to exact count)</option>
                  <option value="DAMAGE_LOSS">Damaged / Broken Items (Deduct)</option>
                  <option value="THEFT_SHRINKAGE">Shrinkage / Missing Items (Deduct)</option>
                  <option value="FOUND_STOCK">Discovered Surplus (Add)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {adjustType === 'CORRECTION' ? 'Actual Counted Quantity *' : 'Quantity to Deduct/Add *'}
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  required
                  placeholder="Enter quantity"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(cleanNumericInput(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Audit Reason / Notes * (Mandatory for Compliance)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Annual physical count discrepancy / Water leak damage"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
              </div>
            </form>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="adjustForm"
                disabled={actionLoading}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {actionLoading ? 'Adjusting...' : 'Commit Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. Inward Goods Receipt Modal                                             */}
      {/* ========================================================================= */}
      {receivingProduct && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              maxWidth: '520px',
              width: '95%',
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Inward Goods Receipt
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {receivingProduct.name} ({receivingProduct.sku})
                </div>
              </div>
              <button onClick={() => setReceivingProduct(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <form id="receiveForm" onSubmit={handleSaveReceive} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {actionError && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', fontSize: '13px' }}>
                  {actionError}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Received Quantity *
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  required
                  placeholder="Enter received units"
                  value={receiveQuantity}
                  onChange={(e) => setReceiveQuantity(cleanNumericInput(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Unit Cost (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter cost per unit"
                  value={receiveUnitCost}
                  onChange={(e) => setReceiveUnitCost(cleanNumericInput(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Supplier Invoice Number / PO #
                </label>
                <input
                  type="text"
                  placeholder="e.g., INV-99042"
                  value={receiveInvoice}
                  onChange={(e) => setReceiveInvoice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g., Weekly replenishment intake"
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
              </div>
            </form>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setReceivingProduct(null)}
                style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="receiveForm"
                disabled={actionLoading}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {actionLoading ? 'Processing...' : 'Record Goods Intake'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. Stock Movement Ledger Modal                                            */}
      {/* ========================================================================= */}
      {ledgerProduct && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              maxWidth: '820px',
              width: '95%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <History size={20} color="#3b82f6" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Double-Entry Stock Movement Ledger
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {ledgerProduct.name} (SKU: {ledgerProduct.sku})
                  </div>
                </div>
              </div>
              <button onClick={() => setLedgerProduct(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Ledger List */}
            <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
              {ledgerLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading audit trail...</div>
              ) : ledgerItems.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No historical ledger movements recorded for this product.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {ledgerItems.map((tx) => {
                    const isPositive = Number(tx.quantityDelta) > 0;
                    return (
                      <div
                        key={tx.id}
                        style={{
                          padding: '14px 18px',
                          borderRadius: '10px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                background: isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: isPositive ? '#10b981' : '#ef4444',
                              }}
                            >
                              {tx.transactionType}
                            </span>
                            {tx.referenceId && (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                Ref: {tx.referenceId}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                            {tx.notes || 'No description entered'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {new Date(tx.createdAt).toLocaleString()}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              fontSize: '15px',
                              fontWeight: 700,
                              color: isPositive ? '#10b981' : '#ef4444',
                            }}
                          >
                            {isPositive ? `+${tx.quantityDelta}` : tx.quantityDelta}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Balance: {tx.quantityBefore} → <strong>{tx.quantityAfter}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pinned Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-subtle)', textAlign: 'right' }}>
              <button
                onClick={() => setLedgerProduct(null)}
                style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. Create Category Modal                                                  */}
      {/* ========================================================================= */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              maxWidth: '460px',
              width: '95%',
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Add Product Category
              </h3>
              <button onClick={() => setShowCategoryModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Beverages & Cold Drinks"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Category Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., BEV"
                  value={newCatCode}
                  onChange={(e) => setNewCatCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Short description of category"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  {actionLoading ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Sensor Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onScan={handleBarcodeScanned}
        title={scannerTarget === 'PRODUCT_FORM' ? 'Scan Product Barcode / EAN' : 'Scan Barcode to Search Product'}
      />
    </div>
  );
};
