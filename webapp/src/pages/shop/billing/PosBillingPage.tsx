import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  User,
  CreditCard,
  Banknote,
  QrCode,
  Layers,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  UserPlus,
  Sparkles,
  Phone,
  Pause,
  Clock,
  Check,
  X,
  Tag,
  Package,
  ShoppingBag,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { inventoryApi } from '../../../api/inventoryApi';
import { billingApi } from '../../../api/billingApi';
import { soundFx } from '../../../utils/soundEffects';
import {
  Product,
  Category,
  Customer,
  CreateInvoiceRequest,
  InvoiceResponse,
  ThermalReceiptResponse,
  CreateCustomerRequest,
} from '../../../types';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { useAuth } from '../../../context/AuthContext';
import './billing.css';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  lineTotal: number;
}

export const PosBillingPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [sendDigitalReceipt, setSendDigitalReceipt] = useState(true);

  // Park / Hold Cart State
  interface ParkedCart {
    id: string;
    timestamp: string;
    customer: Customer | null;
    cart: CartItem[];
    overallDiscount: number;
    notes: string;
    total: number;
  }
  const [parkedCarts, setParkedCarts] = useState<ParkedCart[]>([]);
  const [showParkedList, setShowParkedList] = useState(false);

  // Customer State
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState<CreateCustomerRequest>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    gstin: '',
  });

  // Debounced customer live search by name or phone
  useEffect(() => {
    if (!customerSearch.trim() || customerSearch.trim().length < 2) {
      setCustomerResults([]);
      return;
    }
    const timer = setTimeout(() => {
      billingApi
        .searchCustomers({ search: customerSearch.trim(), page: 0, size: 8 })
        .then((res) => setCustomerResults(res.content || []))
        .catch(() => setCustomerResults([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const getCategoryIcon = (categoryName?: string) => {
    const name = (categoryName || '').toLowerCase();
    if (name.includes('shoe') || name.includes('footwear')) return <Tag size={16} />;
    if (name.includes('toy') || name.includes('game')) return <Sparkles size={16} />;
    if (name.includes('cloth') || name.includes('fashion') || name.includes('apparel')) return <ShoppingBag size={16} />;
    return <Package size={16} />;
  };

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'SPLIT'>('CASH');
  const [tenderedAmount, setTenderedAmount] = useState<string>('');
  const [cardRef, setCardRef] = useState('');
  const [upiRef, setUpiRef] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Post-Checkout Receipt Modal
  const [latestReceipt, setLatestReceipt] = useState<ThermalReceiptResponse | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Keyboard Shortcuts (F2: Focus Barcode, F4: Checkout, Esc: Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0 && !showPaymentModal) {
          handleOpenCheckout();
        }
      } else if (e.key === 'Escape') {
        setShowPaymentModal(false);
        setShowAddCustomerModal(false);
        setShowReceiptModal(false);
        setShowParkedList(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, showPaymentModal]);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await inventoryApi.getActiveCategories();
      setCategories(data);
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  const loadProducts = async (catId?: number | null, query?: string) => {
    setLoadingProducts(true);
    try {
      const res = await inventoryApi.searchProducts({
        categoryId: catId || undefined,
        search: query || undefined,
        status: 'ACTIVE',
        page: 0,
        size: 50,
      });
      setProducts(res.content);
    } catch (e) {
      console.error('Failed to load products', e);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    loadProducts(selectedCategory, val);
  };

  const handleCategorySelect = (catId: number | null) => {
    setSelectedCategory(catId);
    loadProducts(catId, searchQuery);
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const barcode = barcodeInput.trim();
    if (!barcode) return;

    try {
      const prod = await inventoryApi.getProductByBarcode(barcode);
      if (prod) {
        soundFx.playBarcodeBeep();
        addToCart(prod);
        setBarcodeInput('');
      } else {
        alert(`No product found with barcode: ${barcode}`);
      }
    } catch (err) {
      const found = products.find((p) => p.barcode === barcode || p.sku.toLowerCase() === barcode.toLowerCase());
      if (found) {
        soundFx.playBarcodeBeep();
        addToCart(found);
        setBarcodeInput('');
      } else {
        alert(`No product found for barcode: ${barcode}`);
      }
    }
  };

  const addToCart = (product: Product) => {
    soundFx.playClick();
    const availableStock = product.availableStock ?? 0;
    if (availableStock <= 0) {
      alert(`Warning: '${product.name}' is out of stock!`);
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      const unitPrice = Number(product.sellingPrice) || 0;
      const taxRate = Number(product.taxRate) || 0;

      if (existingIndex > -1) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + 1;
        const discount = existing.discountAmount;
        const lineTotal = Math.max(0, newQty * unitPrice - discount);
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          lineTotal,
        };
        return updated;
      } else {
        const lineTotal = unitPrice;
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unitPrice,
            discountAmount: 0,
            taxRate,
            lineTotal,
          },
        ];
      }
    });
  };

  // Cross-domain Deep-linking: auto-select customer and auto-stage scanned/selected product
  useEffect(() => {
    const customerPhone = searchParams.get('customerPhone');
    const customerName = searchParams.get('customerName');
    if (customerPhone) {
      billingApi
        .searchCustomers({ search: customerPhone, page: 0, size: 10 })
        .then((res) => {
          if (res.content && res.content.length > 0) {
            setSelectedCustomer(res.content[0]);
          } else if (customerName) {
            setSelectedCustomer({
              id: 0,
              name: customerName,
              phone: customerPhone,
              totalVisits: 0,
              totalSpend: 0,
              loyaltyPoints: 0,
            } as any);
          }
        })
        .catch((err) => console.error('Failed to link customer to POS', err));
    }

    const barcode = searchParams.get('barcode');
    const search = searchParams.get('search');
    if (barcode) {
      inventoryApi
        .getProductByBarcode(barcode)
        .then((product) => {
          if (product) {
            addToCart(product);
          }
        })
        .catch(() => {
          setSearchQuery(barcode);
          loadProducts(null, barcode);
        });
    } else if (search) {
      setSearchQuery(search);
      loadProducts(null, search);
    }
  }, [searchParams]);

  const updateQuantity = (productId: number, delta: number) => {
    soundFx.playClick();
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const lineTotal = Math.max(0, newQty * item.unitPrice - item.discountAmount);
            return { ...item, quantity: newQty, lineTotal };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateDiscount = (productId: number, discount: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const validDiscount = Math.max(0, discount);
          const lineTotal = Math.max(0, item.quantity * item.unitPrice - validDiscount);
          return { ...item, discountAmount: validDiscount, lineTotal };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Are you sure you want to clear the entire cart?')) {
      setCart([]);
      setSelectedCustomer(null);
      setOverallDiscount(0);
      setInvoiceNotes('');
    }
  };

  const handleParkCart = () => {
    if (cart.length === 0) return;
    const newParked: ParkedCart = {
      id: 'HOLD-' + Math.floor(1000 + Math.random() * 9000),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customer: selectedCustomer,
      cart: [...cart],
      overallDiscount,
      notes: invoiceNotes,
      total: roundedGrandTotal,
    };
    setParkedCarts((prev) => [newParked, ...prev]);
    setCart([]);
    setSelectedCustomer(null);
    setOverallDiscount(0);
    setInvoiceNotes('');
  };

  const handleRecallCart = (parked: ParkedCart) => {
    if (cart.length > 0 && !window.confirm('Current cart has items. Replace with parked cart?')) {
      return;
    }
    setCart(parked.cart);
    setSelectedCustomer(parked.customer);
    setOverallDiscount(parked.overallDiscount);
    setInvoiceNotes(parked.notes);
    setParkedCarts((prev) => prev.filter((p) => p.id !== parked.id));
    setShowParkedList(false);
  };

  // Calculations
  const rawSubtotal = cart.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  const itemDiscounts = cart.reduce((acc, it) => acc + (it.discountAmount || 0), 0);
  const totalItemLevelTotal = cart.reduce((acc, it) => acc + it.lineTotal, 0);

  const estimatedTax = cart.reduce((acc, it) => {
    if (it.taxRate > 0) {
      const taxable = it.lineTotal;
      return acc + (taxable * it.taxRate) / (100 + it.taxRate);
    }
    return acc;
  }, 0);

  const totalBeforeRound = Math.max(0, totalItemLevelTotal - overallDiscount);
  const roundedGrandTotal = Math.round(totalBeforeRound);
  const roundOff = roundedGrandTotal - totalBeforeRound;

  // Customer Search
  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomerResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await billingApi.quickSearchCustomers(customerSearch);
        setCustomerResults(results);
      } catch (e) {
        console.error(e);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      alert('Customer Name and Phone are required.');
      return;
    }
    try {
      const created = await billingApi.createCustomer(newCustomer);
      setSelectedCustomer(created);
      setShowAddCustomerModal(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '', city: '', state: '', gstin: '' });
      setCustomerSearch('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create customer');
    }
  };

  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      alert('Please add items to cart before proceeding to billing.');
      return;
    }
    setTenderedAmount(roundedGrandTotal.toString());
    setCheckoutError(null);
    setShowPaymentModal(true);
  };

  const tenderedNumeric = parseFloat(tenderedAmount) || 0;
  const changeReturned = Math.max(0, tenderedNumeric - roundedGrandTotal);

  const handleCheckoutSubmit = async () => {
    if (paymentMode === 'CASH' && tenderedNumeric < roundedGrandTotal) {
      setCheckoutError(`Tendered cash ₹${tenderedNumeric} is less than total bill ₹${roundedGrandTotal}`);
      return;
    }

    setIsCheckingOut(true);
    setCheckoutError(null);

    const request: CreateInvoiceRequest = {
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Guest',
      customerPhone: selectedCustomer?.phone,
      customerEmail: selectedCustomer?.email,
      customerGstin: selectedCustomer?.gstin,
      customerAddress: selectedCustomer?.address,
      invoiceDiscountTotal: overallDiscount,
      paymentMode,
      primaryPaymentMode: paymentMode,
      amountPaid: paymentMode === 'CASH' ? tenderedNumeric : roundedGrandTotal,
      notes: invoiceNotes,
      sendReceiptNotification: sendDigitalReceipt,
      items: cart.map((it) => ({
        productId: it.product.id,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discountAmount: it.discountAmount,
      })),
      payments: [
        {
          paymentMode,
          amount: roundedGrandTotal,
          referenceNumber: paymentMode === 'UPI' ? upiRef : paymentMode === 'CARD' ? cardRef : undefined,
          transactionReference: paymentMode === 'UPI' ? upiRef : paymentMode === 'CARD' ? cardRef : undefined,
          notes: paymentMode === 'CASH' && changeReturned > 0 ? `Change: ₹${changeReturned.toFixed(2)}` : undefined,
        },
      ],
    };

    try {
      const invoice: InvoiceResponse = await billingApi.checkout(request);
      setShowPaymentModal(false);

      const receipt = await billingApi.getThermalReceipt(invoice.invoiceNumber);
      setLatestReceipt(receipt);
      setShowReceiptModal(true);
      soundFx.playCashRegister();

      setCart([]);
      setSelectedCustomer(null);
      setOverallDiscount(0);
      setInvoiceNotes('');

      loadProducts(selectedCategory, searchQuery);
    } catch (err: any) {
      setCheckoutError(err.response?.data?.message || 'Checkout failed. Please check stock and try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="pos-wrapper">
      {/* Top Bar */}
      <div className="pos-topbar">
        <div className="pos-brand-group">
          <div className="pos-brand-icon">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="pos-brand-title">
              POS Smart Billing Counter
              <span className="pos-live-pill">
                <span className="pos-live-dot" /> Live
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Cashier: <strong style={{ color: 'var(--text-primary)' }}>{user?.fullName || user?.username}</strong> • Instant Auto-Deduction
            </div>
          </div>
        </div>

        {/* Barcode scanner */}
        <form onSubmit={handleBarcodeSubmit} className="pos-barcode-form">
          <div className="pos-input-container">
            <Barcode size={15} className="pos-input-icon" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan Barcode / SKU + Enter... [F2]"
              className="pos-barcode-input"
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '7px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus size={13} /> Add
          </button>
        </form>

        {/* Shortcuts & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="pos-shortcut-hint" title="Keyboard Shortcuts">
            [F2] Scan • [F4] Pay • [Esc] Close
          </span>

          {parkedCarts.length > 0 && (
            <button
              onClick={() => setShowParkedList(true)}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--warning)',
                background: 'var(--warning-bg)',
                color: 'var(--warning)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Clock size={12} /> Parked ({parkedCarts.length})
            </button>
          )}

          <button
            onClick={handleParkCart}
            disabled={cart.length === 0}
            title="Hold current cart to bill next customer"
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              opacity: cart.length === 0 ? 0.4 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Pause size={12} /> Hold
          </button>

          <button
            onClick={() => loadProducts(selectedCategory, searchQuery)}
            title="Refresh Catalog"
            style={{
              padding: '6px 8px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} />
          </button>

          <button
            onClick={clearCart}
            disabled={cart.length === 0}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--danger)',
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              opacity: cart.length === 0 ? 0.4 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Trash2 size={13} /> Clear
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="pos-main-split">
        {/* LEFT: Products Catalog */}
        <div className="pos-catalog-pane">
          {/* Search Box */}
          <div className="pos-search-bar">
            <div className="pos-input-container" style={{ flex: 1 }}>
              <Search size={15} className="pos-input-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search products by title, SKU, or category..."
                className="pos-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    loadProducts(selectedCategory, '');
                  }}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="pos-category-strip">
            <button
              onClick={() => handleCategorySelect(null)}
              className={`pos-category-chip ${selectedCategory === null ? 'active' : ''}`}
            >
              <Package size={12} /> All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`pos-category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
              >
                {getCategoryIcon(cat.name)} {cat.name}
              </button>
            ))}
          </div>

          {/* Product Cards */}
          <div className="pos-products-grid">
            {loadingProducts ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: 'var(--accent-primary)' }} />
                <div>Loading catalog...</div>
              </div>
            ) : products.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <Layers size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <div>No products found matching criteria</div>
              </div>
            ) : (
              products.map((prod) => {
                const stock = prod.availableStock ?? 0;
                const isLow = prod.isLowStock || (stock > 0 && stock <= (prod.reorderLevel ?? 5));
                const isOut = prod.isOutOfStock || stock <= 0;
                const cartItem = cart.find((it) => it.product.id === prod.id);
                const inCartQty = cartItem ? cartItem.quantity : 0;

                return (
                  <div
                    key={prod.id}
                    onClick={() => addToCart(prod)}
                    className={`pos-product-card ${inCartQty > 0 ? 'in-cart' : ''}`}
                    style={{ opacity: isOut ? 0.6 : 1 }}
                  >
                    <div>
                      <div className="pos-card-header">
                        <span className="pos-card-sku">{prod.sku}</span>
                        {isOut ? (
                          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--danger)', background: 'var(--danger-bg)', padding: '1px 5px', borderRadius: '4px' }}>
                            ● Out of Stock
                          </span>
                        ) : isLow ? (
                          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--warning)', background: 'var(--warning-bg)', padding: '1px 5px', borderRadius: '4px' }}>
                            ● Low: {stock}
                          </span>
                        ) : (
                          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--success)', background: 'var(--success-bg)', padding: '1px 5px', borderRadius: '4px' }}>
                            ● In Stock: {stock}
                          </span>
                        )}
                      </div>

                      <div className="pos-card-body">
                        <div className="pos-card-icon-box">
                          {getCategoryIcon(prod.categoryName)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 className="pos-card-title" title={prod.name}>{prod.name}</h4>
                          <div className="pos-card-cat">{prod.categoryName || 'General'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="pos-card-footer">
                      <div>
                        <div className="pos-card-price">₹{Number(prod.sellingPrice).toFixed(2)}</div>
                        {prod.taxRate ? (
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>+{prod.taxRate}% GST</div>
                        ) : null}
                      </div>
                      {inCartQty > 0 ? (
                        <span className="pos-in-cart-pill" title={`${inCartQty} currently in bill`}>
                          <Check size={10} /> {inCartQty} in cart
                        </span>
                      ) : (
                        <button className="pos-card-add-btn" title="Add to bill">
                          <Plus size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Cart & Checkout Desk */}
        <div className="pos-cart-pane">
          {/* Customer Selection */}
          <div className="pos-customer-box">
            <div className="pos-customer-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-primary)' }}>
                <User size={13} color="var(--accent-primary)" />
                {selectedCustomer ? 'Customer Account' : 'Customer Assignment'}
              </span>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <UserPlus size={11} /> + New Customer
              </button>
            </div>

            {selectedCustomer ? (
              <div className="pos-selected-customer">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px' }}>
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '12px' }}>{selectedCustomer.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {selectedCustomer.phone} {selectedCustomer.gstin ? `• GSTIN: ${selectedCustomer.gstin}` : ''}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  title="Revert to Walk-in Guest"
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px', padding: '2px 6px' }}
                >
                  ✕ Clear
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <div className="pos-input-container" style={{ flex: 1 }}>
                    <Search size={13} className="pos-input-icon" />
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Search customer by phone or name..."
                      style={{
                        width: '100%',
                        padding: '6px 10px 6px 28px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--input-border)',
                        background: 'var(--input-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '11px',
                      }}
                    />
                  </div>
                  <div className="pos-walkin-pill" title="Default Cash Customer">
                    <User size={11} /> Walk-in Guest
                  </div>
                </div>

                {customerResults.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: '100%',
                      marginTop: '4px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 30,
                      maxHeight: '160px',
                      overflowY: 'auto',
                    }}
                  >
                    {customerResults.map((cust) => (
                      <div
                        key={cust.id}
                        onClick={() => {
                          setSelectedCustomer(cust);
                          setCustomerSearch('');
                          setCustomerResults([]);
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border-subtle)',
                          fontSize: '11px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cust.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                            {cust.phone} {cust.city ? `• ${cust.city}` : ''}
                          </div>
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 700 }}>Select</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div className="pos-cart-empty">
                <ShoppingCart size={38} style={{ opacity: 0.35, color: 'var(--accent-primary)' }} />
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>Billing Cart is Empty</div>
                <div style={{ fontSize: '11px', maxWidth: '220px', lineHeight: 1.4 }}>
                  Scan barcode [F2] or click any product from the catalog to add items to bill
                </div>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="pos-cart-item">
                  <div className="pos-item-header">
                    <div>
                      <div className="pos-item-name">{item.product.name}</div>
                      <div className="pos-item-meta">
                        {item.product.sku} • ₹{item.unitPrice.toFixed(2)} / unit
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      title="Remove item"
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="pos-item-controls">
                    {/* Stepper */}
                    <div className="pos-stepper">
                      <button className="pos-step-btn" onClick={() => updateQuantity(item.product.id, -1)} title="Decrease quantity">
                        <Minus size={11} />
                      </button>
                      <span className="pos-step-val">{item.quantity}</span>
                      <button className="pos-step-btn" onClick={() => updateQuantity(item.product.id, 1)} title="Increase quantity">
                        <Plus size={11} />
                      </button>
                    </div>

                    {/* Item Discount */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Disc ₹</span>
                      <input
                        type="number"
                        min="0"
                        value={item.discountAmount || ''}
                        onChange={(e) => updateDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="pos-disc-input"
                      />
                    </div>

                    {/* Line Total */}
                    <div className="pos-item-total">₹{item.lineTotal.toFixed(2)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Dock */}
          <div className="pos-checkout-dock">
            <div className="pos-dock-inputs">
              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  Bill Discount ₹
                </label>
                <input
                  type="number"
                  min="0"
                  value={overallDiscount || ''}
                  onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '5px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '12px' }}>
                <input
                  type="checkbox"
                  id="sendDigitalReceipt"
                  checked={sendDigitalReceipt}
                  onChange={(e) => setSendDigitalReceipt(e.target.checked)}
                  style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                />
                <label htmlFor="sendDigitalReceipt" style={{ fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Digital WhatsApp / SMS
                </label>
              </div>
            </div>

            {/* Quick Cash Tender Presets */}
            {roundedGrandTotal > 0 && (
              <div className="pos-quick-tender-strip">
                <button
                  type="button"
                  className="pos-quick-tender-btn"
                  onClick={() => {
                    setTenderedAmount(roundedGrandTotal.toString());
                    setPaymentMode('CASH');
                    setShowPaymentModal(true);
                  }}
                  title="Tender Exact Cash"
                >
                  Exact ₹{roundedGrandTotal}
                </button>
                {[roundedGrandTotal, 100, 200, 500, 2000]
                  .filter((v, i, a) => a.indexOf(v) === i && v > roundedGrandTotal)
                  .slice(0, 3)
                  .map((cash) => (
                    <button
                      key={cash}
                      type="button"
                      className="pos-quick-tender-btn"
                      onClick={() => {
                        setTenderedAmount(cash.toString());
                        setPaymentMode('CASH');
                        setShowPaymentModal(true);
                      }}
                      title={`Tender ₹${cash} note`}
                    >
                      ₹{cash}
                    </button>
                  ))}
              </div>
            )}

            <div className="pos-summary-table">
              <div className="pos-summary-row">
                <span>Items Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} pcs):</span>
                <span>₹{rawSubtotal.toFixed(2)}</span>
              </div>
              {(itemDiscounts > 0 || overallDiscount > 0) && (
                <div className="pos-summary-row" style={{ color: 'var(--success)' }}>
                  <span>Total Discount:</span>
                  <span>-₹{(itemDiscounts + overallDiscount).toFixed(2)}</span>
                </div>
              )}
              {estimatedTax > 0 && (
                <div className="pos-summary-row">
                  <span>Est. GST:</span>
                  <span>₹{estimatedTax.toFixed(2)}</span>
                </div>
              )}
              {roundOff !== 0 && (
                <div className="pos-summary-row">
                  <span>Round Off:</span>
                  <span>{roundOff > 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}</span>
                </div>
              )}
              <div className="pos-summary-row grand">
                <span>PAYABLE DUE:</span>
                <span className="pos-grand-amount">₹{roundedGrandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleOpenCheckout}
              disabled={cart.length === 0}
              className="pos-checkout-btn"
            >
              <Banknote size={17} /> Collect Payment & Print Bill (F4)
            </button>
          </div>
        </div>
      </div>

      {/* PAYMENT & TENDER MODAL */}
      {showPaymentModal && (
        <div className="pos-modal-overlay">
          <div className="pos-modal-card">
            <div className="pos-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <Banknote size={18} color="var(--success)" /> Tender & Final Checkout
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <div className="pos-modal-body">
              {/* Grand Total Callout */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--success-bg)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  textAlign: 'center',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--success)', fontWeight: 700 }}>
                  Total Bill Amount
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--success)', marginTop: '4px' }}>
                  ₹{roundedGrandTotal.toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Customer: {selectedCustomer ? selectedCustomer.name : 'Walk-in Guest'}
                </div>
              </div>

              {checkoutError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--danger-bg)',
                    border: '1px solid var(--danger)',
                    color: 'var(--danger)',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <AlertCircle size={16} /> {checkoutError}
                </div>
              )}

              {/* Mode Select */}
              <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Payment Method
              </label>
              <div className="pos-mode-grid">
                <button
                  type="button"
                  onClick={() => setPaymentMode('CASH')}
                  className={`pos-mode-btn ${paymentMode === 'CASH' ? 'active' : ''}`}
                >
                  <Banknote size={16} /> CASH
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('UPI')}
                  className={`pos-mode-btn ${paymentMode === 'UPI' ? 'active' : ''}`}
                >
                  <QrCode size={16} /> UPI / QR
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('CARD')}
                  className={`pos-mode-btn ${paymentMode === 'CARD' ? 'active' : ''}`}
                >
                  <CreditCard size={16} /> CARD
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('SPLIT')}
                  className={`pos-mode-btn ${paymentMode === 'SPLIT' ? 'active' : ''}`}
                >
                  <Layers size={16} /> SPLIT
                </button>
              </div>

              {/* CASH details */}
              {paymentMode === 'CASH' && (
                <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Cash Tendered by Customer (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={tenderedAmount}
                    onChange={(e) => setTenderedAmount(e.target.value)}
                    placeholder={roundedGrandTotal.toString()}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '16px',
                      fontWeight: 800,
                      fontFamily: 'JetBrains Mono, monospace',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--input-border)',
                      background: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                    }}
                  />

                  {/* Quick currency buttons */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                    {[roundedGrandTotal, 100, 200, 500, 2000]
                      .filter((v, i, a) => a.indexOf(v) === i && v >= roundedGrandTotal)
                      .slice(0, 4)
                      .map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setTenderedAmount(val.toString())}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '4px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                          }}
                        >
                          ₹{val}
                        </button>
                      ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Change to return:</span>
                    <span style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: changeReturned > 0 ? 'var(--info)' : 'var(--text-muted)' }}>
                      ₹{changeReturned.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* UPI QR */}
              {paymentMode === 'UPI' && (
                <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Scan with PhonePe / GPay / Paytm</div>
                  <div style={{ width: '150px', height: '150px', margin: '0 auto 8px', background: '#fff', borderRadius: '8px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=2&data=${encodeURIComponent(
                        `upi://pay?pa=store@upi&pn=Common%20CRM%20Store&am=${roundedGrandTotal}&cu=INR&tn=Bill`
                      )}`}
                      alt="UPI Payment QR"
                      style={{ width: '138px', height: '138px', display: 'block' }}
                    />
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--success)', marginBottom: '4px' }}>
                    Pay ₹{roundedGrandTotal.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Supported: Google Pay • PhonePe • BHIM • Paytm
                  </div>
                  <input
                    type="text"
                    value={upiRef}
                    onChange={(e) => setUpiRef(e.target.value)}
                    placeholder="Enter UPI Ref / UTR (Optional)"
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      fontSize: '11px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--input-border)',
                      background: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  />
                </div>
              )}

              {/* CARD */}
              {paymentMode === 'CARD' && (
                <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Swipe/Dip Card on POS Terminal
                  </label>
                  <input
                    type="text"
                    value={cardRef}
                    onChange={(e) => setCardRef(e.target.value)}
                    placeholder="Enter Card Approval Code / Last 4 Digits"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--input-border)',
                      background: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Invoice Notes (Optional)
                </label>
                <input
                  type="text"
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  placeholder="e.g. Festival gift wrap / custom order"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--input-border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            <div className="pos-modal-footer">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCheckingOut}
                onClick={handleCheckoutSubmit}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {isCheckingOut ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Processing Bill...
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} /> Complete Sale & Print
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="pos-modal-overlay">
          <div className="pos-modal-card">
            <div className="pos-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <UserPlus size={18} color="var(--accent-primary)" /> Register New Customer
              </div>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer}>
              <div className="pos-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Full Name <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder="e.g. Ramesh Sharma"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Mobile Phone (WhatsApp / SMS) <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Email</label>
                    <input
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      placeholder="customer@email.com"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>GSTIN</label>
                    <input
                      type="text"
                      value={newCustomer.gstin}
                      onChange={(e) => setNewCustomer({ ...newCustomer, gstin: e.target.value })}
                      placeholder="36ABCDE1234F1Z5"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '12px', textTransform: 'uppercase' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Address</label>
                  <input
                    type="text"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    placeholder="e.g. Main Bazaar Road, Store Area"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div className="pos-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 18px', fontSize: '12px' }}
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PARKED / ON-HOLD CARTS MODAL */}
      {showParkedList && (
        <div className="pos-modal-overlay">
          <div className="pos-modal-card" style={{ maxWidth: '480px' }}>
            <div className="pos-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <Clock size={18} color="var(--warning)" /> Parked / On-Hold Carts ({parkedCarts.length})
              </div>
              <button
                onClick={() => setShowParkedList(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <div className="pos-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {parkedCarts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  No carts currently on hold.
                </div>
              ) : (
                parkedCarts.map((parked) => (
                  <div
                    key={parked.id}
                    style={{
                      padding: '12px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                          {parked.id}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>at {parked.timestamp}</span>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {parked.customer ? parked.customer.name : 'Walk-in Guest'} • {parked.cart.length} items
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--success)', fontFamily: 'JetBrains Mono, monospace' }}>
                        ₹{parked.total.toFixed(2)}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRecallCart(parked)}
                      className="btn-primary"
                      style={{ padding: '6px 14px', fontSize: '11px', fontWeight: 700 }}
                    >
                      Recall to Counter
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pos-modal-footer">
              <button
                onClick={() => setShowParkedList(false)}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THERMAL BILL PRINT MODAL */}
      <ThermalReceiptModal
        receipt={latestReceipt}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
};
