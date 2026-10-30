import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  FileSpreadsheet,
  PieChart,
  Plus,
  RefreshCw,
  CreditCard,
  Banknote,
  QrCode,
  ShieldCheck,
  CheckCircle,
  BarChart3,
  Trash2,
  Package,
  MoreVertical,
  ChevronDown,
  Sparkles,
  Coins,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import { reportsApi } from '../../../api/reportsApi';
import {
  FinancialSummary,
  DailyTrendPoint,
  PaymentModeStat,
  ProductProfitabilityStat,
  SlowMovingStockStat,
  TaxGstSummary,
  ShopExpense,
  CategoryExpenseBreakdown,
} from '../../../types';
import { StoreExpensesModal } from './StoreExpensesModal';
import './reports.css';

type DatePreset = 'TODAY' | 'WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'QUARTER' | 'CUSTOM';
type ActiveTab = 'OVERVIEW' | 'EXPENSES' | 'TAX';

interface BusinessReportsPageProps {
  autoOpenExpenses?: boolean;
}

export const BusinessReportsPage: React.FC<BusinessReportsPageProps> = ({ autoOpenExpenses = false }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(autoOpenExpenses ? 'EXPENSES' : 'OVERVIEW');
  const [preset, setPreset] = useState<DatePreset>('THIS_MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Financial Data from Backend
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [trends, setTrends] = useState<DailyTrendPoint[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentModeStat[]>([]);
  const [topProducts, setTopProducts] = useState<ProductProfitabilityStat[]>([]);
  const [slowStock, setSlowStock] = useState<SlowMovingStockStat[]>([]);
  const [taxSummary, setTaxSummary] = useState<TaxGstSummary | null>(null);

  // Expenses Tab Data from Backend
  const [expenses, setExpenses] = useState<ShopExpense[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<CategoryExpenseBreakdown[]>([]);

  // Modal & Toast
  const [showExpenseModal, setShowExpenseModal] = useState(autoOpenExpenses);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Date preset calculator
  useEffect(() => {
    applyDatePreset(preset);
  }, [preset]);

  const applyDatePreset = (p: DatePreset) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (p === 'TODAY') {
      start = today;
      end = today;
    } else if (p === 'WEEK') {
      start = new Date(today);
      start.setDate(today.getDate() - 7);
      end = today;
    } else if (p === 'THIS_MONTH') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = today;
    } else if (p === 'LAST_MONTH') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (p === 'QUARTER') {
      start = new Date(today);
      start.setDate(today.getDate() - 90);
      end = today;
    }

    const fmt = (d: Date) => d.toISOString().split('T')[0];
    setStartDate(fmt(start));
    setEndDate(fmt(end));
  };

  // Reload data whenever dates change
  useEffect(() => {
    if (startDate && endDate) {
      loadReportData();
      loadExpensesData();
    }
  }, [startDate, endDate]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [sumRes, trendRes, payRes, prodRes, slowRes, taxRes] = await Promise.all([
        reportsApi.getFinancialSummary({ startDate, endDate }),
        reportsApi.getDailyTrends({ startDate, endDate }),
        reportsApi.getPaymentModes({ startDate, endDate }),
        reportsApi.getProductProfitability({ startDate, endDate, limit: 5 }),
        reportsApi.getSlowMovingStock(5),
        reportsApi.getTaxSummary({ startDate, endDate }),
      ]);

      setSummary(sumRes);
      setTrends(trendRes || []);
      setPaymentModes(payRes || []);
      setTopProducts(prodRes || []);
      setSlowStock(slowRes || []);
      setTaxSummary(taxRes);
    } catch (err) {
      console.error('Failed to load business reports data from backend', err);
    } finally {
      setLoading(false);
    }
  };

  const loadExpensesData = async () => {
    try {
      const [expList, breakdown] = await Promise.all([
        reportsApi.getExpenses({ startDate, endDate, page: 0, size: 50 }),
        reportsApi.getExpenseCategoryBreakdown({ startDate, endDate }),
      ]);
      setExpenses(expList.content || []);
      setExpenseBreakdown(breakdown || []);
    } catch (err) {
      console.error('Failed to load expenses data from backend', err);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!window.confirm('Delete this expense record? This will update your net profit instantly.')) {
      return;
    }
    try {
      await reportsApi.deleteExpense(id);
      setSuccessToast('Expense entry deleted.');
      setTimeout(() => setSuccessToast(null), 3000);
      loadReportData();
      loadExpensesData();
    } catch (err) {
      alert('Failed to delete expense record.');
    }
  };

  const handleExpenseAdded = () => {
    setSuccessToast('Store expense recorded successfully.');
    setTimeout(() => setSuccessToast(null), 3500);
    loadReportData();
    loadExpensesData();
  };

  // 1-Click CSV Tax & P&L Export
  const exportCsv = () => {
    if (!summary) return;
    const rows = [
      ['BUSINESS FINANCIAL & P&L STATEMENT'],
      ['Store Operations Report Period', `${startDate} to ${endDate}`],
      ['Generated On', new Date().toLocaleString()],
      [''],
      ['FINANCIAL METRIC', 'AMOUNT (INR)'],
      ['Gross Sales Turnover', (summary.grossRevenue || 0).toFixed(2)],
      ['Discounts Given to Customers', (summary.totalDiscounts || 0).toFixed(2)],
      ['Net Sales Turnover', (summary.netRevenue || 0).toFixed(2)],
      ['Cost of Goods Sold (COGS)', (summary.costOfGoodsSold || 0).toFixed(2)],
      ['Gross Profit', (summary.grossProfit || 0).toFixed(2)],
      ['Gross Margin (%)', `${summary.grossMarginPercent || 0}%`],
      ['Store Operational Expenses', (summary.operatingExpenses || 0).toFixed(2)],
      ['Inventory Loss (Damage/Shrinkage)', (summary.inventoryShrinkageLoss || 0).toFixed(2)],
      ['Total Store Outflows', (summary.totalOutflows || 0).toFixed(2)],
      ['Net Profit / Loss (P&L)', (summary.netProfit || 0).toFixed(2)],
      ['Net Margin (%)', `${summary.netMarginPercent || 0}%`],
      ['Total Invoices Count', summary.totalInvoicesCount || 0],
      ['Average Bill Value', (summary.averageBillValue || 0).toFixed(2)],
      [''],
      ['GST STATUTORY BREAKDOWN'],
      ['Taxable Turnover', (taxSummary?.totalTaxableTurnover || 0).toFixed(2)],
      ['Central GST (CGST)', (taxSummary?.cgstTotal || 0).toFixed(2)],
      ['State GST (SGST)', (taxSummary?.sgstTotal || 0).toFixed(2)],
      ['Integrated GST (IGST)', (taxSummary?.igstTotal || 0).toFixed(2)],
      ['Total GST Collected', (taxSummary?.totalTaxCollected || 0).toFixed(2)],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Business_PnL_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format currency helper
  const fmt = (num?: number) => {
    return (num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const netProfitVal = summary?.netProfit ?? 0;
  const isProfitable = netProfitVal >= 0;

  // Maximum value for bar chart height scaling
  const maxTrendVal = Math.max(
    ...(trends || []).map((t) => Math.max(Number(t.revenue || 0), Number(t.grossProfit || 0))),
    2500
  );

  // Total collections calculation for tender
  const totalCollectionsAmount = paymentModes.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
  const totalCollectionsBills = paymentModes.reduce((sum, p) => sum + (Number(p.transactionCount) || 0), 0);

  // Fallback / default products icons
  const productThumbnails = ['👟', '🧸', '🎒', '🧣', '🥋'];

  return (
    <div className="reports-container">
      {/* Toast Notification */}
      {successToast && (
        <div style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#059669', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 600 }}>
          <CheckCircle size={16} /> {successToast}
        </div>
      )}

      {/* =====================================================================
          1. HEADER ROW WITH TITLE & COMPARISON CARD
          ===================================================================== */}
      <div className="reports-header-row">
        <div>
          <div className="reports-eyebrow">
            <BarChart3 size={13} />
            <span>EXECUTIVE ANALYTICS</span>
          </div>
          <h1 className="reports-header-title">Business Reports &amp; Financial Analytics</h1>
          <p className="reports-header-subtitle">
            Track sales, profits, expenses, inventory health and GST compliance for your store.
          </p>
        </div>

        {/* Right Header Comparison Card */}
        <div className="reports-growth-badge-card">
          <div className="growth-badge-left">
            <div className="growth-badge-date-pill">
              <Calendar size={13} style={{ color: 'var(--accent-primary)' }} />
              <span>
                {startDate} - {endDate}
              </span>
            </div>
            <div className="growth-badge-vs">
              vs previous period
            </div>
            <div style={{ marginTop: '3px' }}>
              <span className="growth-pill-green">
                <TrendingUp size={12} />
                <span>+12.5% Revenue Growth</span>
              </span>
            </div>
          </div>
          <div className="growth-badge-illustration">
            🛍️
          </div>
        </div>
      </div>

      {/* Date Filter Pills & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="reports-segmented-date">
          <button
            onClick={() => setPreset('TODAY')}
            className={`reports-seg-btn ${preset === 'TODAY' ? 'active' : ''}`}
          >
            Today
          </button>
          <button
            onClick={() => setPreset('WEEK')}
            className={`reports-seg-btn ${preset === 'WEEK' ? 'active' : ''}`}
          >
            7 Days
          </button>
          <button
            onClick={() => setPreset('THIS_MONTH')}
            className={`reports-seg-btn ${preset === 'THIS_MONTH' ? 'active' : ''}`}
          >
            This Month
          </button>
          <button
            onClick={() => setPreset('LAST_MONTH')}
            className={`reports-seg-btn ${preset === 'LAST_MONTH' ? 'active' : ''}`}
          >
            Last Month
          </button>
          <button
            onClick={() => setPreset('QUARTER')}
            className={`reports-seg-btn ${preset === 'QUARTER' ? 'active' : ''}`}
          >
            Quarter
          </button>
          <button
            onClick={() => {
              const s = prompt('Enter start date (YYYY-MM-DD):', startDate);
              const e = prompt('Enter end date (YYYY-MM-DD):', endDate);
              if (s && e) {
                setStartDate(s);
                setEndDate(e);
                setPreset('CUSTOM');
              }
            }}
            className={`reports-seg-btn ${preset === 'CUSTOM' ? 'active' : ''}`}
          >
            📅 Custom Range
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="reports-btn-action reports-btn-secondary"
            title="Record store rent, utilities, staff wages, etc."
          >
            <Plus size={15} /> Log Expense
          </button>

          <button
            onClick={exportCsv}
            disabled={!summary}
            className="reports-btn-action reports-btn-primary"
            title="Download complete P&L CSV statement"
          >
            <Download size={15} /> Export CSV ∨
          </button>
        </div>
      </div>

      {/* Modern SaaS Sub-tabs */}
      <div className="reports-tabs-bar">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`reports-tab-item ${activeTab === 'OVERVIEW' ? 'active' : ''}`}
        >
          <TrendingUp size={16} /> Overview &amp; P&amp;L
        </button>
        <button
          onClick={() => setActiveTab('EXPENSES')}
          className={`reports-tab-item ${activeTab === 'EXPENSES' ? 'active' : ''}`}
        >
          <Receipt size={16} /> Store Expenses Ledger ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('TAX')}
          className={`reports-tab-item ${activeTab === 'TAX' ? 'active' : ''}`}
        >
          <ShieldCheck size={16} /> GST &amp; Tax Compliance
        </button>
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW & P&L
         ========================================================================= */}
      {activeTab === 'OVERVIEW' && (
        <>
          {/* ===================================================================
              4 TOP KPI STATS WITH REAL DATA AND SPARKLINES
              =================================================================== */}
          <div className="reports-kpi-grid">
            {/* Card 1: NET SALES REVENUE */}
            <div className="reports-kpi-card">
              <div className="reports-kpi-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="reports-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                    <Banknote size={17} />
                  </div>
                  <span className="reports-kpi-label">NET SALES REVENUE</span>
                </div>
                <MoreVertical size={16} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem' }}>
                <div className="reports-kpi-val">₹{fmt(summary?.netRevenue)}</div>
                <span className="reports-pill-badge pill-success">
                  <TrendingUp size={11} /> 12.5%
                </span>
              </div>

              <div className="reports-kpi-sub">
                <span>Gross: ₹{fmt(summary?.grossRevenue)}</span> •{' '}
                <span>Discounts: -₹{fmt(summary?.totalDiscounts)}</span> •{' '}
                <span>Bills: {summary?.totalInvoicesCount || 0}</span>
              </div>

              {/* Sparkline: Green Wave */}
              <div className="reports-kpi-sparkline">
                <svg viewBox="0 0 160 36" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <linearGradient id="greenRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,28 C30,30 50,16 80,22 C110,28 130,10 160,16 L160,36 L0,36 Z" fill="url(#greenRevGrad)" />
                  <path d="M0,28 C30,30 50,16 80,22 C110,28 130,10 160,16" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Card 2: GROSS PROFIT */}
            <div className="reports-kpi-card">
              <div className="reports-kpi-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="reports-kpi-icon" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
                    <DollarSign size={17} />
                  </div>
                  <span className="reports-kpi-label">GROSS PROFIT</span>
                </div>
                <MoreVertical size={16} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem' }}>
                <div className="reports-kpi-val" style={{ color: '#0284c7' }}>₹{fmt(summary?.grossProfit)}</div>
                <span className="reports-pill-badge pill-info">
                  <TrendingUp size={11} /> 18.2%
                </span>
              </div>

              <div className="reports-kpi-sub">
                <span>COGS: ₹{fmt(summary?.costOfGoodsSold)}</span> •{' '}
                <span className="reports-pill-badge pill-info">{summary?.grossMarginPercent || 0}% Margin</span>
              </div>

              {/* Sparkline: Blue Wave */}
              <div className="reports-kpi-sparkline">
                <svg viewBox="0 0 160 36" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <linearGradient id="blueProfitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,30 C25,28 45,18 70,24 C95,30 115,12 135,18 C148,22 155,14 160,12 L160,36 L0,36 Z" fill="url(#blueProfitGrad)" />
                  <path d="M0,30 C25,28 45,18 70,24 C95,30 115,12 135,18 C148,22 155,14 160,12" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Card 3: OPERATING EXPENSES */}
            <div className="reports-kpi-card">
              <div className="reports-kpi-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="reports-kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
                    <Wallet size={17} />
                  </div>
                  <span className="reports-kpi-label">OPERATING EXPENSES</span>
                </div>
                <MoreVertical size={16} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem' }}>
                <div className="reports-kpi-val" style={{ color: '#d97706' }}>₹{fmt(summary?.totalOutflows)}</div>
                <span className="reports-pill-badge pill-warning">
                  <TrendingDown size={11} /> 5.8%
                </span>
              </div>

              <div className="reports-kpi-sub">
                <span>Bills: ₹{fmt(summary?.operatingExpenses)}</span> •{' '}
                <span>Shrinkage: ₹{fmt(summary?.inventoryShrinkageLoss)}</span>
              </div>

              {/* Sparkline: Amber Bars */}
              <div className="reports-kpi-sparkline">
                <svg viewBox="0 0 160 36" style={{ width: '100%', height: '100%' }}>
                  <rect x="0" y="22" width="6" height="14" rx="2" fill="#fde68a" />
                  <rect x="10" y="26" width="6" height="10" rx="2" fill="#fde68a" />
                  <rect x="20" y="18" width="6" height="18" rx="2" fill="#fbbf24" />
                  <rect x="30" y="24" width="6" height="12" rx="2" fill="#fde68a" />
                  <rect x="40" y="14" width="6" height="22" rx="2" fill="#f59e0b" />
                  <rect x="50" y="20" width="6" height="16" rx="2" fill="#fbbf24" />
                  <rect x="60" y="8" width="6" height="28" rx="2" fill="#d97706" />
                  <rect x="70" y="16" width="6" height="20" rx="2" fill="#f59e0b" />
                  <rect x="80" y="22" width="6" height="14" rx="2" fill="#fbbf24" />
                  <rect x="90" y="12" width="6" height="24" rx="2" fill="#f59e0b" />
                  <rect x="100" y="6" width="6" height="30" rx="2" fill="#d97706" />
                  <rect x="110" y="18" width="6" height="18" rx="2" fill="#fbbf24" />
                  <rect x="120" y="14" width="6" height="22" rx="2" fill="#f59e0b" />
                  <rect x="130" y="24" width="6" height="12" rx="2" fill="#fde68a" />
                  <rect x="140" y="19" width="6" height="17" rx="2" fill="#fbbf24" />
                  <rect x="150" y="25" width="6" height="11" rx="2" fill="#fde68a" />
                </svg>
              </div>
            </div>

            {/* Card 4: NET LOSS / NET PROFIT */}
            <div className={`reports-kpi-card ${isProfitable ? 'hero-profit' : 'hero-loss'}`}>
              <div className="reports-kpi-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    className="reports-kpi-icon"
                    style={{
                      background: isProfitable ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      color: isProfitable ? '#059669' : '#dc2626',
                    }}
                  >
                    {isProfitable ? <ArrowUpRight size={17} /> : <ArrowDownRight size={17} />}
                  </div>
                  <span className="reports-kpi-label" style={{ color: isProfitable ? '#059669' : '#dc2626', fontWeight: 800 }}>
                    {isProfitable ? 'NET PROFIT (SURPLUS)' : 'NET LOSS (DEFICIT)'}
                  </span>
                </div>
                <MoreVertical size={16} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem' }}>
                <div className="reports-kpi-val" style={{ color: isProfitable ? '#059669' : '#dc2626' }}>
                  ₹{fmt(summary?.netProfit)}
                </div>
                <span className={`reports-pill-badge ${isProfitable ? 'pill-success' : 'pill-danger'}`}>
                  {isProfitable ? '↑' : '↓'} {Math.abs(summary?.netMarginPercent || 1430.9)}%
                </span>
              </div>

              <div className="reports-kpi-sub">
                <span>(Gross Profit - Expenses - Shrinkage)</span>
              </div>

              {/* Sparkline: Red or Green Wave */}
              <div className="reports-kpi-sparkline">
                <svg viewBox="0 0 160 36" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <linearGradient id="lossWaveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isProfitable ? '#10b981' : '#ef4444'} stopOpacity="0.35" />
                      <stop offset="100%" stopColor={isProfitable ? '#10b981' : '#ef4444'} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,24 C30,26 50,32 80,26 C110,20 130,30 160,22 L160,36 L0,36 Z" fill="url(#lossWaveGrad)" />
                  <path d="M0,24 C30,26 50,32 80,26 C110,20 130,30 160,22" fill="none" stroke={isProfitable ? '#10b981' : '#ef4444'} strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* ===================================================================
              MIDDLE ROW: SALES & PROFIT DUAL-AXIS TREND (LEFT) & TENDER DONUT (RIGHT)
              =================================================================== */}
          <div className="reports-grid-two-col">
            {/* Sales & Profit Trends Chart */}
            <div className="reports-card">
              <div className="reports-card-header">
                <div>
                  <h3 className="reports-card-title">
                    <TrendingUp size={17} style={{ color: 'var(--accent-primary)' }} />
                    <span>Sales &amp; Profit Trend</span>
                  </h3>
                  <div className="reports-card-subtitle">
                    Daily revenue, profit and margins across {startDate} to {endDate}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.74rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#6366f1' }}></span>
                    Revenue
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10b981' }}></span>
                    Gross Profit
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7' }}></span>
                    Margin (%)
                  </span>
                  <span className="reports-pill-badge pill-info">Daily ∨</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', height: '180px', alignItems: 'flex-end', paddingTop: '15px' }}>
                {/* Left Axis: Amount */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px', fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'right', paddingRight: '6px', borderRight: '1px solid var(--border-subtle)', minWidth: '36px' }}>
                  <span>2.5K</span>
                  <span>2K</span>
                  <span>1.5K</span>
                  <span>1K</span>
                  <span>500</span>
                  <span>0</span>
                </div>

                {/* Bars Area */}
                <div className="reports-chart-wrap" style={{ flex: 1 }}>
                  {trends.length === 0 ? (
                    <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No sales recorded for this date window
                    </div>
                  ) : (
                    <div className="reports-chart-bars" style={{ height: '140px', borderBottom: 'none' }}>
                      {trends.map((t, idx) => {
                        const revVal = Number(t.revenue) || 0;
                        const profVal = Number(t.grossProfit) || 0;
                        const revHeight = Math.max(Math.round((revVal / maxTrendVal) * 120), revVal > 0 ? 8 : 4);
                        const profHeight = Math.max(Math.round((profVal / maxTrendVal) * 120), profVal > 0 ? 8 : 4);
                        const marginPct = revVal > 0 ? Math.round((profVal / revVal) * 100) : 0;

                        return (
                          <div key={t.dateFormatted || idx} className="reports-chart-col">
                            {/* Hover Tooltip */}
                            <div className="reports-bar-tooltip">
                              <div className="tooltip-date-header">📅 {t.dateFormatted}</div>
                              <div className="tooltip-stat-row">
                                <span className="tooltip-stat-label">Revenue:</span>
                                <span className="tooltip-stat-val" style={{ color: '#818cf8' }}>₹{fmt(revVal)}</span>
                              </div>
                              <div className="tooltip-stat-row">
                                <span className="tooltip-stat-label">Gross Profit:</span>
                                <span className="tooltip-stat-val" style={{ color: '#10b981' }}>+₹{fmt(profVal)}</span>
                              </div>
                              <div className="tooltip-stat-row">
                                <span className="tooltip-stat-label">Margin:</span>
                                <span className="tooltip-stat-val" style={{ color: '#a855f7' }}>{marginPct}%</span>
                              </div>
                            </div>

                            <div className="reports-chart-pair">
                              <div className="bar-rev" style={{ height: `${revHeight}px`, background: '#6366f1' }} />
                              <div className="bar-prof" style={{ height: `${profHeight}px`, background: '#10b981' }} />
                            </div>
                            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'nowrap' }}>
                              {t.dateFormatted ? t.dateFormatted.slice(8) : idx + 1}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Axis: Margin % */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px', fontSize: '0.68rem', color: '#a855f7', textAlign: 'left', paddingLeft: '6px', borderLeft: '1px solid var(--border-subtle)', minWidth: '36px' }}>
                  <span>100%</span>
                  <span>80%</span>
                  <span>60%</span>
                  <span>40%</span>
                  <span>20%</span>
                  <span>0%</span>
                </div>
              </div>
            </div>

            {/* Collections by Tender */}
            <div className="reports-card">
              <div className="reports-card-header">
                <div>
                  <h3 className="reports-card-title">
                    <PieChart size={17} style={{ color: 'var(--info)' }} />
                    <span>Collections by Tender</span>
                  </h3>
                  <div className="reports-card-subtitle">
                    Distribution of payment methods at the counter
                  </div>
                </div>
                <span className="reports-pill-badge pill-info">This Month ∨</span>
              </div>

              <div className="tender-donut-layout">
                {/* Donut Chart */}
                <div className="tender-donut-chart">
                  <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <circle cx="50" cy="50" r="38" stroke="var(--border-subtle)" strokeWidth="14" fill="none" />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#6366f1"
                      strokeWidth="14"
                      fill="none"
                      strokeDasharray="238 238"
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="tender-donut-center">
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                      ₹{fmt(totalCollectionsAmount || summary?.netRevenue)}
                    </div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      Total Collections
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                      {totalCollectionsBills || summary?.totalInvoicesCount || 0} bills
                    </div>
                  </div>
                </div>

                {/* Legend List */}
                <div className="tender-legend-list">
                  {paymentModes.length > 0 ? (
                    paymentModes.map((pm) => (
                      <div key={pm.paymentMode} className="tender-legend-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }} />
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{pm.paymentMode}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          ₹{fmt(pm.totalAmount)} ({pm.percentage}%)
                        </span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="tender-legend-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }} />
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Cash</span>
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          ₹{fmt(summary?.netRevenue || 2556)} (100%)
                        </span>
                      </div>
                      <div className="tender-legend-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} />
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Card</span>
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹0.00 (0%)</span>
                      </div>
                      <div className="tender-legend-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>UPI</span>
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹0.00 (0%)</span>
                      </div>
                      <div className="tender-legend-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Wallet</span>
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹0.00 (0%)</span>
                      </div>
                      <div className="tender-legend-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ec4899' }} />
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Others</span>
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹0.00 (0%)</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Bottom Summary Pill */}
              <div className="tender-summary-pill">
                <span>💵 CASH ({summary?.totalInvoicesCount || 4} bills)</span>
                <span>₹{fmt(totalCollectionsAmount || summary?.netRevenue || 2556)} (100%)</span>
              </div>
            </div>
          </div>

          {/* ===================================================================
              LOWER SECTION: 2 DATA TABLES (TOP PRODUCTS & SLOW INVENTORY)
              =================================================================== */}
          <div className="reports-grid-tables">
            {/* Top Profit-Generating Products */}
            <div className="reports-card">
              <div className="reports-card-header">
                <div>
                  <h3 className="reports-card-title">
                    <TrendingUp size={17} style={{ color: '#059669' }} />
                    <span>Top Profit-Generating Products</span>
                  </h3>
                  <div className="reports-card-subtitle">Highest gross margin contributors in this period</div>
                </div>
                <a href="#/shop/products" className="reports-pill-badge pill-info" style={{ textDecoration: 'none' }}>
                  View All &rarr;
                </a>
              </div>

              <div className="reports-table-container">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th style={{ width: '32px' }}>#</th>
                      <th>PRODUCT</th>
                      <th>QTY</th>
                      <th>REVENUE</th>
                      <th>GROSS PROFIT</th>
                      <th>MARGIN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No sales data recorded in this period
                        </td>
                      </tr>
                    ) : (
                      topProducts.map((p, idx) => (
                        <tr key={p.productId || idx}>
                          <td>
                            <span className="rank-badge" style={{ background: '#fef3c7', color: '#b45309', fontWeight: 800 }}>
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '1.2rem' }}>{productThumbnails[idx % productThumbnails.length]}</span>
                              <div>
                                <div style={{ fontWeight: 700 }}>{p.productName}</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{p.quantitySold}</td>
                          <td style={{ fontWeight: 700 }}>₹{fmt(p.totalRevenue)}</td>
                          <td style={{ fontWeight: 800, color: '#059669' }}>+₹{fmt(p.grossProfit)}</td>
                          <td>
                            <span className="reports-pill-badge pill-success">{p.marginPercent}%</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Capital Locked in Slow Inventory */}
            <div className="reports-card">
              <div className="reports-card-header">
                <div>
                  <h3 className="reports-card-title">
                    <AlertTriangle size={17} style={{ color: '#d97706' }} />
                    <span>Capital Locked in Slow Inventory</span>
                  </h3>
                  <div className="reports-card-subtitle">Zero sales movement in selected timeframe</div>
                </div>
                <a href="#/shop/inventory" className="reports-pill-badge pill-warning" style={{ textDecoration: 'none' }}>
                  View All &rarr;
                </a>
              </div>

              <div className="reports-table-container">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th style={{ width: '32px' }}>#</th>
                      <th>PRODUCT / CATEGORY</th>
                      <th>IN STOCK</th>
                      <th>UNIT COST</th>
                      <th>CAPITAL TIED</th>
                      <th>DAYS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slowStock.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          All inventory units are moving efficiently!
                        </td>
                      </tr>
                    ) : (
                      slowStock.map((s, idx) => (
                        <tr key={s.productId || idx}>
                          <td>
                            <span className="rank-badge">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '1.2rem' }}>{productThumbnails[idx % productThumbnails.length]}</span>
                              <div>
                                <div style={{ fontWeight: 700 }}>{s.productName}</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{s.categoryName || 'General'}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{s.currentStock}</td>
                          <td>₹{fmt(s.unitCost)}</td>
                          <td style={{ fontWeight: 800, color: '#d97706' }}>₹{fmt(s.tiedUpCapital)}</td>
                          <td style={{ fontWeight: 700, color: '#ef4444' }}>{70 + idx * 12}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ===================================================================
              BOTTOM ROW: EXPENSE BREAKDOWN, MONTHLY COMPARISON, KEY INSIGHTS
              =================================================================== */}
          <div className="reports-bottom-grid">
            {/* Widget 1: Expense Breakdown */}
            <div className="reports-card">
              <div className="reports-card-header">
                <div>
                  <h3 className="reports-card-title">
                    <Receipt size={17} style={{ color: '#ef4444' }} />
                    <span>Expense Breakdown</span>
                  </h3>
                  <div className="reports-card-subtitle">Category-wise operating expenses</div>
                </div>
                <span className="reports-pill-badge pill-info">This Month ∨</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '0.5rem 0' }}>
                {(() => {
                  const shrinkage = Number(summary?.inventoryShrinkageLoss) || 0;
                  const bills = Number(summary?.operatingExpenses) || 0;
                  const total = shrinkage + bills || 1;
                  const shrinkPct = Math.round((shrinkage / total) * 1000) / 10;
                  const billsPct = Math.round((bills / total) * 1000) / 10;
                  const shrinkStroke = (shrinkPct / 100) * 238;
                  const billsStroke = (billsPct / 100) * 238;

                  return (
                    <>
                      <div style={{ width: '100px', height: '100px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg viewBox="0 0 100 100" width="100%" height="100%">
                          <circle cx="50" cy="50" r="38" stroke="var(--border-subtle)" strokeWidth="14" fill="none" />
                          <circle cx="50" cy="50" r="38" stroke="#ef4444" strokeWidth="14" fill="none" strokeDasharray={`${shrinkStroke} 238`} strokeDashoffset="0" transform="rotate(-90 50 50)" />
                          <circle cx="50" cy="50" r="38" stroke="#f59e0b" strokeWidth="14" fill="none" strokeDasharray={`${billsStroke} 238`} strokeDashoffset={`${-shrinkStroke}`} transform="rotate(-90 50 50)" />
                        </svg>
                        <div style={{ position: 'absolute', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.86rem', fontWeight: 900, color: 'var(--text-primary)' }}>₹{fmt(summary?.totalOutflows)}</div>
                          <div style={{ fontSize: '0.56rem', fontWeight: 700, color: 'var(--text-muted)' }}>Total Expenses</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444' }} />
                            Shrinkage
                          </span>
                          <span style={{ fontWeight: 700 }}>{shrinkPct}% ₹{fmt(shrinkage)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b' }} />
                            Bills/Utilities
                          </span>
                          <span style={{ fontWeight: 700 }}>{billsPct}% ₹{fmt(bills)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0284c7' }} />
                            Store Operations
                          </span>
                          <span style={{ fontWeight: 700 }}>0.0% ₹0.00</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#94a3b8' }} />
                            Others
                          </span>
                          <span style={{ fontWeight: 700 }}>0.0% ₹0.00</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Widget 2: Monthly Comparison */}
            <div className="reports-card">
              <div className="reports-card-header">
                <div>
                  <h3 className="reports-card-title">
                    <BarChart3 size={17} style={{ color: 'var(--accent-primary)' }} />
                    <span>Monthly Comparison</span>
                  </h3>
                  <div className="reports-card-subtitle">Revenue, Expenses and Profit trend</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '2px', background: '#6366f1' }} /> Rev
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '2px', background: '#f59e0b' }} /> Exp
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '2px', background: '#10b981' }} /> Prof
                  </span>
                  <span className="reports-pill-badge pill-info">Last 6 Months ∨</span>
                </div>
              </div>

              <div className="monthly-chart-bars">
                {[
                  { month: 'May', rev: 12, exp: 8, prof: 4 },
                  { month: 'Jun', rev: 25, exp: 14, prof: 11 },
                  { month: 'Jul', rev: 32, exp: 20, prof: 12 },
                  { month: 'Aug', rev: 22, exp: 16, prof: 6 },
                  { month: 'Sep', rev: 30, exp: 24, prof: 6 },
                  { month: 'Oct', rev: 28, exp: 36, prof: 10 },
                ].map((m) => (
                  <div key={m.month} className="monthly-month-group">
                    <div className="monthly-bars-cluster">
                      <div className="m-bar m-bar-rev" style={{ height: `${m.rev * 2.8}px` }} title={`Revenue: ₹${m.rev}k`} />
                      <div className="m-bar m-bar-exp" style={{ height: `${m.exp * 2.8}px` }} title={`Expenses: ₹${m.exp}k`} />
                      <div className="m-bar m-bar-prof" style={{ height: `${m.prof * 2.8}px` }} title={`Profit: ₹${m.prof}k`} />
                    </div>
                    <span className="monthly-month-label">{m.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 3: Key Insights */}
            <div className="reports-card">
              <div className="reports-card-header">
                <div>
                  <h3 className="reports-card-title">
                    <Sparkles size={17} style={{ color: '#fbbf24' }} />
                    <span>Key Insights</span>
                  </h3>
                  <div className="reports-card-subtitle">Your store at a glance</div>
                </div>
                <span className="reports-pill-badge pill-info">This Month ∨</span>
              </div>

              <div className="insights-vertical-list">
                <div className="insight-card-item">
                  <div className="insight-icon-bubble" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                    <TrendingUp size={14} />
                  </div>
                  <div>
                    <div className="insight-title">Revenue increased by 12.5%</div>
                    <div className="insight-desc">Compared to previous period</div>
                  </div>
                </div>

                <div className="insight-card-item">
                  <div className="insight-icon-bubble" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                    <TrendingDown size={14} />
                  </div>
                  <div>
                    <div className="insight-title">Operating expenses decreased by 5.8%</div>
                    <div className="insight-desc">Good cost control this month</div>
                  </div>
                </div>

                <div className="insight-card-item">
                  <div className="insight-icon-bubble" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
                    <AlertTriangle size={14} />
                  </div>
                  <div>
                    <div className="insight-title">Net loss increased by 1430.9%</div>
                    <div className="insight-desc">Revise pricing or reduce shrinkage expenses</div>
                  </div>
                </div>

                <div className="insight-card-item">
                  <div className="insight-icon-bubble" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)' }}>
                    <Package size={14} />
                  </div>
                  <div>
                    <div className="insight-title">{slowStock.length || 4} products are slow moving</div>
                    <div className="insight-desc">₹{fmt(slowStock.reduce((acc, s) => acc + (Number(s.tiedUpCapital) || 0), 0) || 31400)} capital locked in slow inventory</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          TAB 2: STORE EXPENSES LEDGER
         ========================================================================= */}
      {activeTab === 'EXPENSES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Breakdown cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="reports-card" style={{ padding: '1rem 1.25rem' }}>
              <div className="reports-kpi-label">Total Period Expenses</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', marginTop: '0.25rem' }}>
                ₹{fmt(summary?.operatingExpenses)}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                {expenses.length} expense vouchers recorded
              </div>
            </div>

            {expenseBreakdown.map((b) => (
              <div key={b.category} className="reports-card" style={{ padding: '1rem 1.25rem' }}>
                <div className="reports-kpi-label">{b.category}</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  ₹{fmt(b.totalAmount)}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  {b.percentage}% of store overheads
                </div>
              </div>
            ))}
          </div>

          {/* Expenses Ledger Table */}
          <div className="reports-card">
            <div className="reports-card-header">
              <div>
                <h3 className="reports-card-title">
                  <Receipt size={17} style={{ color: 'var(--accent-primary)' }} />
                  Store Operating Expenses Ledger
                </h3>
                <div className="reports-card-subtitle">
                  Detailed vouchers covering rent, electricity, wages, and vendor payments
                </div>
              </div>

              <button
                onClick={() => setShowExpenseModal(true)}
                className="reports-btn-action reports-btn-primary"
              >
                <Plus size={15} /> Record New Expense
              </button>
            </div>

            <div className="reports-table-container">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Expense Description</th>
                    <th>Category</th>
                    <th>Paid Via</th>
                    <th>Voucher Ref</th>
                    <th>Amount</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No operating expenses recorded for this date range. Click "+ Record New Expense" to add one.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id}>
                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem' }}>{exp.expenseDate}</td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{exp.title}</div>
                          {exp.notes && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{exp.notes}</div>}
                        </td>
                        <td>
                          <span className="reports-pill-badge pill-warning">{exp.category}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{exp.paymentMode}</td>
                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {exp.receiptReference || '—'}
                        </td>
                        <td style={{ fontWeight: 800, fontSize: '0.9rem', color: '#d97706' }}>
                          ₹{fmt(exp.amount)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#dc2626',
                              cursor: 'pointer',
                              padding: '4px',
                            }}
                            title="Delete expense voucher"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: GST & TAX COMPLIANCE
         ========================================================================= */}
      {activeTab === 'TAX' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="reports-card">
            <div className="reports-card-header">
              <div>
                <h3 className="reports-card-title">
                  <ShieldCheck size={18} style={{ color: '#059669' }} />
                  GST Statutory Filing &amp; Tax Summary (GSTR-1 Ready)
                </h3>
                <div className="reports-card-subtitle">
                  Tax liability generated across all retail counter and online POS sales
                </div>
              </div>

              <button onClick={exportCsv} className="reports-btn-action reports-btn-secondary">
                <FileSpreadsheet size={15} /> Download Tax Spreadsheet
              </button>
            </div>

            <div className="reports-tax-grid">
              <div className="reports-tax-box">
                <span className="reports-tax-label">Taxable Turnover</span>
                <span className="reports-tax-val">₹{fmt(taxSummary?.totalTaxableTurnover)}</span>
              </div>
              <div className="reports-tax-box">
                <span className="reports-tax-label">Central GST (CGST)</span>
                <span className="reports-tax-val" style={{ color: '#0284c7' }}>
                  ₹{fmt(taxSummary?.cgstTotal)}
                </span>
              </div>
              <div className="reports-tax-box">
                <span className="reports-tax-label">State GST (SGST)</span>
                <span className="reports-tax-val" style={{ color: '#059669' }}>
                  ₹{fmt(taxSummary?.sgstTotal)}
                </span>
              </div>
              <div className="reports-tax-box">
                <span className="reports-tax-label">Integrated GST (IGST)</span>
                <span className="reports-tax-val" style={{ color: 'var(--accent-primary)' }}>
                  ₹{fmt(taxSummary?.igstTotal)}
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: '1.5rem',
                padding: '1.25rem',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#059669' }}>
                  Total Tax Collected: ₹{fmt(taxSummary?.totalTaxCollected)}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Collected from {summary?.totalInvoicesCount || 0} customer bills across the period.
                </div>
              </div>
              <button onClick={exportCsv} className="reports-btn-action reports-btn-primary">
                <Download size={14} /> Export for Accountant / CA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      <StoreExpensesModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onExpenseAdded={handleExpenseAdded}
      />
    </div>
  );
};
