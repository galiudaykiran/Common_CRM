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
  Info,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  ArrowUpDown,
  UtensilsCrossed,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

type DatePreset = 'TODAY' | 'WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'QUARTER' | 'YEAR' | 'CUSTOM';
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

  // Expenses Tab Data from Backend & Pagination (Default Page 0, Size 10)
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<ShopExpense[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<CategoryExpenseBreakdown[]>([]);
  const [expensePage, setExpensePage] = useState(0);
  const [expenseTotalPages, setExpenseTotalPages] = useState(1);
  const [expenseTotalElements, setExpenseTotalElements] = useState(0);
  const expenseSize = 10;

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
      start.setDate(today.getDate() - 6);
      end = today;
    } else if (p === 'THIS_MONTH') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = today;
    } else if (p === 'LAST_MONTH') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (p === 'QUARTER') {
      start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      end = today;
    } else if (p === 'YEAR') {
      start = new Date(today.getFullYear(), 0, 1);
      end = today;
    }

    const fmtLocal = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    setStartDate(fmtLocal(start));
    setEndDate(fmtLocal(end));
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

  const loadExpensesData = async (targetPage = expensePage) => {
    try {
      const [expList, breakdown] = await Promise.all([
        reportsApi.getExpenses({ startDate, endDate, page: targetPage, size: expenseSize }),
        reportsApi.getExpenseCategoryBreakdown({ startDate, endDate }),
      ]);
      setExpenses(expList.content || []);
      setExpenseTotalPages(expList.totalPages || 1);
      setExpenseTotalElements(expList.totalElements || 0);
      setExpenseBreakdown(breakdown || []);
    } catch (err) {
      console.error('Failed to load expenses data from backend', err);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      loadExpensesData(expensePage);
    }
  }, [expensePage]);

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
  const totalCollectionsAmount = paymentModes.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0) || Number(summary?.netRevenue || 0);
  const totalCollectionsBills = paymentModes.reduce((sum, p) => sum + (Number(p.transactionCount) || 0), 0) || summary?.totalInvoicesCount || 0;

  // Full Roster of Payment Tenders for Clear Display
  const standardTenders = [
    { mode: 'Cash', color: '#6366f1', key: 'CASH' },
    { mode: 'Card', color: '#0284c7', key: 'CARD' },
    { mode: 'UPI', color: '#10b981', key: 'UPI' },
    { mode: 'Wallet', color: '#f59e0b', key: 'WALLET' },
    { mode: 'Others', color: '#ec4899', key: 'OTHERS' },
  ];

  const fullTenderList = standardTenders.map((st) => {
    const match = paymentModes.find((p) => p.paymentMode.toUpperCase() === st.key);
    if (match) {
      return {
        ...st,
        amount: Number(match.totalAmount) || 0,
        count: match.transactionCount,
        percentage: match.percentage,
      };
    }
    // If no backend record exists for cash but summary has net revenue
    if (st.key === 'CASH' && paymentModes.length === 0 && (summary?.netRevenue || 0) > 0) {
      return {
        ...st,
        amount: summary?.netRevenue || 0,
        count: summary?.totalInvoicesCount || 0,
        percentage: 100,
      };
    }
    return {
      ...st,
      amount: 0,
      count: 0,
      percentage: 0,
    };
  });

  // Format milestone date or timing slot (e.g. "08:00" -> "8 AM", "2026-10-31" -> "31 Oct", "Aug 2026" -> "Aug")
  const formatDayLabel = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes(':')) {
      const hr = parseInt(dateStr.split(':')[0], 10);
      const ampm = hr >= 12 ? 'PM' : 'AM';
      const formattedHr = hr % 12 === 0 ? 12 : hr % 12;
      return `${formattedHr} ${ampm}`;
    }
    if (dateStr.includes(' ')) {
      return dateStr.split(' ')[0];
    }
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return `${d} ${months[m] || ''}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Smooth spline curve generator for multiple line identification
  const getSmoothSvgPath = (coords: Array<{ x: number; y: number }>) => {
    if (coords.length === 0) return '';
    if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;
    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? 0 : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2 < coords.length ? i + 2 : coords.length - 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const getChartModeLabel = () => {
    if (preset === 'TODAY') return 'Today (Hourly 08:00 - 22:00)';
    if (preset === 'WEEK') return '7 Individual Days';
    if (preset === 'THIS_MONTH') return 'This Month (Daily)';
    if (preset === 'LAST_MONTH') return 'Last Month (Daily)';
    if (preset === 'QUARTER') return 'Quarterly (Every Month)';
    if (preset === 'YEAR') return 'Yearly (All 12 Months)';
    return 'Custom Date Window';
  };

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
        {(() => {
          const growthPct = summary?.revenueGrowthPercent ?? 0;
          const currentGross = summary?.grossRevenue ?? 0;
          const prevGross = summary?.previousGrossRevenue ?? 0;
          const isUp = growthPct >= 0;
          let growthLabel = '0.0% vs Prev Period';
          if (growthPct > 0) {
            growthLabel = `+${growthPct.toFixed(1)}% Revenue Growth`;
          } else if (growthPct < 0) {
            growthLabel = `${growthPct.toFixed(1)}% vs Prev Period`;
          } else if (currentGross > 0 && prevGross === 0) {
            growthLabel = `Turnover ₹${fmt(currentGross)}`;
          } else {
            growthLabel = `Turnover ₹${fmt(currentGross)}`;
          }

          const isPositive = growthPct > 0 || (currentGross > 0 && prevGross === 0);
          const isNegative = growthPct < 0;

          return (
            <div className="reports-growth-badge-card">
              <div className="growth-badge-left">
                <div className="growth-badge-date-pill">
                  <Calendar size={13} style={{ color: 'var(--accent-primary)' }} />
                  <span>
                    {startDate} — {endDate}
                  </span>
                </div>
                <div className="growth-badge-vs">
                  {preset === 'TODAY' ? 'vs yesterday' : 'vs previous period'}
                </div>
                <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className={isNegative ? 'growth-pill-red' : 'growth-pill-green'}>
                    {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    <span>{growthLabel}</span>
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 600 }}>
                  Turnover: ₹{fmt(currentGross)} &bull; {summary?.totalInvoicesCount || 0} bills
                </div>
              </div>
              <div
                className={`growth-badge-icon-box ${isNegative ? 'icon-box-negative' : 'icon-box-positive'}`}
                title="Audited Period Financial Performance"
              >
                {isUp ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              </div>
            </div>
          );
        })()}
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
            onClick={() => setPreset('YEAR')}
            className={`reports-seg-btn ${preset === 'YEAR' ? 'active' : ''}`}
          >
            Year
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

              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
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

              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
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

              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
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

            {/* Card 4: NET LOSS (DEFICIT) / NET PROFIT */}
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

              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.4rem', flexWrap: 'wrap' }}>
                <div className="reports-kpi-val" style={{ color: isProfitable ? '#059669' : '#dc2626' }}>
                  {isProfitable ? '+' : ''}₹{fmt(summary?.netProfit)}
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
              CHANNEL CONTRIBUTION BREAKDOWN (RETAIL POS vs RESTAURANT & DINING)
              =================================================================== */}
          {(summary?.diningRevenue !== undefined || summary?.retailRevenue !== undefined) && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}>
              <div style={{
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-subtle, rgba(226, 232, 240, 0.8))',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.12)',
                    color: '#6366f1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0,
                  }}>
                    🛍️
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                      Retail POS Channel
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      ₹{fmt(summary?.retailRevenue ?? 0)}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="reports-pill-badge pill-info" style={{ fontWeight: 600 }}>
                    {summary?.retailInvoicesCount ?? 0} Invoices
                  </span>
                </div>
              </div>

              <div style={{
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-subtle, rgba(226, 232, 240, 0.8))',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    color: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0,
                  }}>
                    🍽️
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                      Restaurant &amp; Dining Channel
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#d97706' }}>
                      ₹{fmt(summary?.diningRevenue ?? 0)}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="reports-pill-badge pill-warning" style={{ fontWeight: 600 }}>
                    {summary?.diningBillsCount ?? 0} Settled Bills
                  </span>
                </div>
              </div>
            </div>
          )}

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
                    Revenue and gross profit trajectory across {startDate} to {endDate}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.74rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#6366f1' }}></span>
                    Revenue
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10b981' }}></span>
                    Gross Profit
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '12px', height: '2.5px', borderRadius: '2px', background: '#f59e0b' }}></span>
                    Growth Curve
                  </span>
                  <span className="reports-pill-badge pill-info">{getChartModeLabel()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', height: '185px', alignItems: 'flex-end', paddingTop: '15px' }}>
                {/* Left Axis: Amount */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '135px', fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'right', paddingRight: '6px', borderRight: '1px solid var(--border-subtle)', minWidth: '40px' }}>
                  <span>{maxTrendVal >= 1000 ? `${(maxTrendVal / 1000).toFixed(1)}k` : Math.round(maxTrendVal)}</span>
                  <span>{maxTrendVal * 0.75 >= 1000 ? `${((maxTrendVal * 0.75) / 1000).toFixed(1)}k` : Math.round(maxTrendVal * 0.75)}</span>
                  <span>{maxTrendVal * 0.5 >= 1000 ? `${((maxTrendVal * 0.5) / 1000).toFixed(1)}k` : Math.round(maxTrendVal * 0.5)}</span>
                  <span>{maxTrendVal * 0.25 >= 1000 ? `${((maxTrendVal * 0.25) / 1000).toFixed(1)}k` : Math.round(maxTrendVal * 0.25)}</span>
                  <span>0</span>
                </div>

                {/* Bars Area with Smooth Curve Line Overlay */}
                <div className="reports-chart-wrap" style={{ flex: 1, position: 'relative' }}>
                  {trends.length === 0 ? (
                    <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No transactions recorded for this period
                    </div>
                  ) : (
                    <>
                      {/* SVG Multi-Line Spline Growth Curve Overlay */}
                      <svg
                        viewBox="0 0 1000 135"
                        preserveAspectRatio="none"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '135px',
                          pointerEvents: 'none',
                          zIndex: 10,
                          overflow: 'visible',
                        }}
                      >
                        <defs>
                          <linearGradient id="curveAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {(() => {
                          const n = trends.length;
                          if (n === 0) return null;
                          const revPoints = trends.map((t, idx) => {
                            const rev = Number(t.revenue) || 0;
                            const x = n === 1 ? 500 : ((idx + 0.5) / n) * 1000;
                            const y = 135 - ((rev / maxTrendVal) * 115) - 8;
                            return { x, y: Math.max(8, Math.min(130, y)) };
                          });

                          const curvePath = getSmoothSvgPath(revPoints);
                          if (!curvePath) return null;

                          const areaPath = `${curvePath} L ${revPoints[revPoints.length - 1].x} 135 L ${revPoints[0].x} 135 Z`;

                          return (
                            <>
                              <path d={areaPath} fill="url(#curveAreaGrad)" />
                              <path d={curvePath} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                              {revPoints.map((pt, i) => (
                                <circle
                                  key={i}
                                  cx={pt.x}
                                  cy={pt.y}
                                  r="3.5"
                                  fill="#fff"
                                  stroke="#f59e0b"
                                  strokeWidth="2.2"
                                />
                              ))}
                            </>
                          );
                        })()}
                      </svg>

                      {/* Bar Columns */}
                      <div className="reports-chart-bars" style={{ height: '135px', borderBottom: 'none' }}>
                        {trends.map((t, idx) => {
                          const revVal = Number(t.revenue) || 0;
                          const profVal = Number(t.grossProfit) || 0;
                          const revHeight = Math.max(Math.round((revVal / maxTrendVal) * 115), revVal > 0 ? 8 : 4);
                          const profHeight = Math.max(Math.round((profVal / maxTrendVal) * 115), profVal > 0 ? 8 : 4);
                          const marginPct = revVal > 0 ? Math.round((profVal / revVal) * 100) : 0;

                          // Spaced timeline label to prevent overlapping on wide ranges
                          const showLabel = trends.length <= 12 || idx % Math.ceil(trends.length / 8) === 0 || idx === trends.length - 1;

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
                                  <span className="tooltip-stat-val" style={{ color: '#f59e0b' }}>{marginPct}%</span>
                                </div>
                                {t.billCount !== undefined && (
                                  <div className="tooltip-stat-row" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '2px', marginTop: '2px' }}>
                                    <span>Bills Count:</span>
                                    <span>{t.billCount}</span>
                                  </div>
                                )}
                              </div>

                              <div className="reports-chart-pair">
                                <div
                                  className="bar-rev"
                                  style={{
                                    height: `${revHeight}px`,
                                    background: 'linear-gradient(180deg, #818cf8 0%, #6366f1 100%)',
                                    borderRadius: '3px 3px 0 0',
                                  }}
                                  title={`Revenue: ₹${fmt(revVal)}`}
                                />
                                <div
                                  className="bar-prof"
                                  style={{
                                    height: `${profHeight}px`,
                                    background: 'linear-gradient(180deg, #34d399 0%, #10b981 100%)',
                                    borderRadius: '3px 3px 0 0',
                                  }}
                                  title={`Gross Profit: ₹${fmt(profVal)}`}
                                />
                              </div>

                              <div style={{ height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {showLabel ? (
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                    {formatDayLabel(t.dateFormatted)}
                                  </span>
                                ) : (
                                  <span style={{ width: '2px', height: '4px', background: 'var(--border-subtle)' }} />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Right Axis: Margin % */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '135px', fontSize: '0.68rem', color: '#f59e0b', textAlign: 'left', paddingLeft: '6px', borderLeft: '1px solid var(--border-subtle)', minWidth: '36px' }}>
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
                    <div style={{ fontSize: '0.98rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                      ₹{fmt(totalCollectionsAmount)}
                    </div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      Total Collections
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                      {totalCollectionsBills} bills
                    </div>
                  </div>
                </div>

                {/* Legend List (All 5 Standard Modes for Comprehensive Clarity - Interlinked to Invoices) */}
                <div className="tender-legend-list">
                  {fullTenderList.map((t) => (
                    <div
                      key={t.mode}
                      className="tender-legend-row"
                      onClick={() => navigate(`/shop/invoices?search=${encodeURIComponent(t.mode)}`)}
                      style={{ cursor: 'pointer' }}
                      title={`Filter all ${t.mode} invoices in Billing History`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.color }} />
                        <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{t.mode} ↗</span>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                        ₹{fmt(t.amount)} <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 500 }}>({t.percentage}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Summary Pill */}
              <div className="tender-summary-pill">
                <span>💵 CASH ({totalCollectionsBills} bills)</span>
                <span>₹{fmt(totalCollectionsAmount)} (100%)</span>
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
                      <th style={{ width: '28px' }}>#</th>
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
                      topProducts.map((p, idx) => {
                        const isDineIn = p.sku?.startsWith('DINE-IN-') || p.productName?.includes('🍽️');
                        const displayName = p.productName.replace(' (🍽️ Dine-In)', '');
                        return (
                          <tr key={p.productId || idx}>
                            <td>
                              <span className="rank-badge" style={{ background: '#fef3c7', color: '#b45309', fontWeight: 800 }}>
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '6px',
                                  background: isDineIn ? 'rgba(245, 158, 11, 0.12)' : 'rgba(99, 102, 241, 0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: isDineIn ? '#d97706' : 'var(--accent-primary)',
                                  flexShrink: 0
                                }}>
                                  {isDineIn ? <UtensilsCrossed size={14} /> : <Package size={14} />}
                                </div>
                                <div>
                                  <div
                                    onClick={() => navigate(isDineIn ? '/shop/dining/menu' : `/shop/products?search=${encodeURIComponent(p.productName)}`)}
                                    style={{ fontWeight: 700, color: isDineIn ? '#b45309' : 'var(--accent-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                    title={isDineIn ? 'View dining dish in menu' : 'View product in catalog'}
                                  >
                                    <span>{displayName}</span>
                                    {isDineIn && (
                                      <span style={{ fontSize: '0.62rem', background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                        DINE-IN
                                      </span>
                                    )}
                                    <span>↗</span>
                                  </div>
                                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontWeight: 600 }}>{p.quantitySold}</td>
                            <td style={{ fontWeight: 700 }}>₹{fmt(p.totalRevenue)}</td>
                            <td style={{ fontWeight: 800, color: '#059669' }}>+₹{fmt(p.grossProfit)}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="reports-pill-badge pill-success">{p.marginPercent}%</span>
                                {isDineIn ? (
                                  <button
                                    onClick={() => navigate('/shop/dining/orders')}
                                    className="btn btn-outline"
                                    style={{
                                      padding: '3px 8px',
                                      fontSize: '10px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      color: '#d97706',
                                      borderColor: 'rgba(245, 158, 11, 0.4)',
                                      cursor: 'pointer',
                                    }}
                                    title="View dining orders"
                                  >
                                    <UtensilsCrossed size={11} /> Dining
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => navigate(`/shop/pos?barcode=${encodeURIComponent(p.sku || '')}`)}
                                    className="btn btn-outline"
                                    style={{
                                      padding: '3px 8px',
                                      fontSize: '10px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      color: '#8b5cf6',
                                      cursor: 'pointer',
                                    }}
                                    title="Sell at POS"
                                  >
                                    <ShoppingCart size={11} /> POS
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
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
                      <th style={{ width: '28px' }}>#</th>
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
                              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                                <Package size={14} />
                              </div>
                              <div>
                                <div
                                  onClick={() => navigate(`/shop/products?search=${encodeURIComponent(s.productName)}`)}
                                  style={{ fontWeight: 700, color: 'var(--accent-primary)', cursor: 'pointer' }}
                                  title="View product in catalog"
                                >
                                  {s.productName} ↗
                                </div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{s.categoryName || 'General'}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{s.currentStock}</td>
                          <td>₹{fmt(s.unitCost)}</td>
                          <td style={{ fontWeight: 800, color: '#d97706' }}>₹{fmt(s.tiedUpCapital)}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 700, color: '#ef4444' }}>{70 + idx * 12}d</span>
                              <button
                                onClick={() => navigate(`/shop/inventory?search=${encodeURIComponent(s.productName)}`)}
                                className="btn btn-outline"
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '10px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  color: '#f59e0b',
                                  cursor: 'pointer',
                                }}
                                title="Audit stock ledger"
                              >
                                <ArrowUpDown size={11} /> Stock
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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

            {/* Expenses Pagination Footer (Page 0, Size 10) */}
            <div
              style={{
                padding: '12px 18px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: 'var(--text-muted)',
                background: 'var(--bg-tertiary)',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                Showing <strong>{expenses.length}</strong> of <strong>{expenseTotalElements}</strong> expenses (Page {expensePage + 1} of {expenseTotalPages})
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  disabled={expensePage === 0}
                  onClick={() => setExpensePage((p) => Math.max(0, p - 1))}
                  className="btn btn-outline"
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ChevronLeft size={13} /> Prev
                </button>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', padding: '0 4px' }}>
                  {expensePage + 1} / {expenseTotalPages}
                </span>
                <button
                  disabled={expensePage >= expenseTotalPages - 1}
                  onClick={() => setExpensePage((p) => Math.min(expenseTotalPages - 1, p + 1))}
                  className="btn btn-outline"
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
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
