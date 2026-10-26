import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
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

type DatePreset = 'TODAY' | 'WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'QUARTER';
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

  // Financial Data
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [trends, setTrends] = useState<DailyTrendPoint[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentModeStat[]>([]);
  const [topProducts, setTopProducts] = useState<ProductProfitabilityStat[]>([]);
  const [slowStock, setSlowStock] = useState<SlowMovingStockStat[]>([]);
  const [taxSummary, setTaxSummary] = useState<TaxGstSummary | null>(null);

  // Expenses Tab Data
  const [expenses, setExpenses] = useState<ShopExpense[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<CategoryExpenseBreakdown[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);

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
      console.error('Failed to load business reports data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadExpensesData = async () => {
    setExpensesLoading(true);
    try {
      const [expList, breakdown] = await Promise.all([
        reportsApi.getExpenses({ startDate, endDate, page: 0, size: 50 }),
        reportsApi.getExpenseCategoryBreakdown({ startDate, endDate }),
      ]);
      setExpenses(expList.content || []);
      setExpenseBreakdown(breakdown || []);
    } catch (err) {
      console.error('Failed to load expenses data', err);
    } finally {
      setExpensesLoading(false);
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
      ['Gross Sales Turnover', summary.grossRevenue.toFixed(2)],
      ['Discounts Given to Customers', summary.totalDiscounts.toFixed(2)],
      ['Net Sales Turnover', summary.netRevenue.toFixed(2)],
      ['Cost of Goods Sold (COGS)', summary.costOfGoodsSold.toFixed(2)],
      ['Gross Profit', summary.grossProfit.toFixed(2)],
      ['Gross Margin (%)', `${summary.grossMarginPercent}%`],
      ['Store Operational Expenses', summary.operatingExpenses.toFixed(2)],
      ['Inventory Loss (Damage/Shrinkage)', summary.inventoryShrinkageLoss.toFixed(2)],
      ['Total Store Outflows', summary.totalOutflows.toFixed(2)],
      ['Net Profit / Loss (P&L)', summary.netProfit.toFixed(2)],
      ['Net Margin (%)', `${summary.netMarginPercent}%`],
      ['Total Invoices Count', summary.totalInvoicesCount],
      ['Average Bill Value', summary.averageBillValue.toFixed(2)],
      [''],
      ['GST STATUTORY BREAKDOWN'],
      ['Taxable Turnover', taxSummary?.totalTaxableTurnover.toFixed(2) || '0.00'],
      ['Central GST (CGST)', taxSummary?.cgstTotal.toFixed(2) || '0.00'],
      ['State GST (SGST)', taxSummary?.sgstTotal.toFixed(2) || '0.00'],
      ['Integrated GST (IGST)', taxSummary?.igstTotal.toFixed(2) || '0.00'],
      ['Total GST Collected', taxSummary?.totalTaxCollected.toFixed(2) || '0.00'],
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

  // Calculations for Net Profit / Net Loss
  const netProfitVal = summary?.netProfit ?? 0;
  const isProfitable = netProfitVal >= 0;

  // Maximum value for bar chart height scaling
  const maxTrendVal = Math.max(
    ...(trends || []).map((t) => Math.max(Number(t.revenue || 0), Number(t.grossProfit || 0))),
    100
  );

  // Format dates for timeline axis (e.g. "2026-10-26" -> "26 Oct")
  const formatMilestone = (str?: string) => {
    if (!str) return '';
    const parts = str.split('-');
    if (parts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const m = parseInt(parts[1], 10) - 1;
      return `${parts[2]} ${months[m] || parts[1]}`;
    }
    return str;
  };

  return (
    <div className="reports-container">
      {/* Toast Notification */}
      {successToast && (
        <div style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#059669', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 600 }}>
          <CheckCircle size={16} /> {successToast}
        </div>
      )}

      {/* Header Row */}
      <div className="reports-header-row">
        <div>
          <div className="reports-eyebrow">
            <BarChart3 size={12} /> Executive Analytics
          </div>
          <h1 className="reports-header-title">Business Reports & Financial Analytics</h1>
          <p className="reports-header-subtitle">
            Track gross revenue, profit margins, operational store bills, and statutory compliance in real time.
          </p>
        </div>

        {/* Date Selector & Action Buttons */}
        <div className="reports-controls">
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
          </div>

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
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Modern SaaS Sub-tabs */}
      <div className="reports-tabs-bar">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`reports-tab-item ${activeTab === 'OVERVIEW' ? 'active' : ''}`}
        >
          <TrendingUp size={16} /> Overview & P&L
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
          <ShieldCheck size={16} /> GST & Tax Compliance
        </button>
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW & P&L
         ========================================================================= */}
      {activeTab === 'OVERVIEW' && (
        <>
          {/* 4 Balanced Financial KPI Cards */}
          <div className="reports-kpi-grid">
            {/* 1. Net Sales Turnover */}
            <div className="reports-kpi-card">
              <div className="reports-kpi-top">
                <span className="reports-kpi-label">Net Sales Revenue</span>
                <div className="reports-kpi-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)' }}>
                  <DollarSign size={17} />
                </div>
              </div>
              <div className="reports-kpi-val">₹{summary?.netRevenue.toFixed(2) || '0.00'}</div>
              <div className="reports-kpi-sub">
                <span>Gross: ₹{summary?.grossRevenue.toFixed(0) || '0'}</span> •{' '}
                <span>Discounts: -₹{summary?.totalDiscounts.toFixed(0) || '0'}</span> •{' '}
                <span>Bills: {summary?.totalInvoicesCount || 0}</span>
              </div>
            </div>

            {/* 2. Gross Profit & COGS */}
            <div className="reports-kpi-card">
              <div className="reports-kpi-top">
                <span className="reports-kpi-label">Gross Profit</span>
                <div className="reports-kpi-icon" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0284c7' }}>
                  <TrendingUp size={17} />
                </div>
              </div>
              <div className="reports-kpi-val" style={{ color: '#0284c7' }}>
                ₹{summary?.grossProfit.toFixed(2) || '0.00'}
              </div>
              <div className="reports-kpi-sub">
                <span>COGS: ₹{summary?.costOfGoodsSold.toFixed(0) || '0'}</span> •{' '}
                <span className="reports-pill-badge pill-info">{summary?.grossMarginPercent || 0}% Margin</span>
              </div>
            </div>

            {/* 3. Expenses & Shrinkage */}
            <div className="reports-kpi-card">
              <div className="reports-kpi-top">
                <span className="reports-kpi-label">Operating Expenses</span>
                <div className="reports-kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
                  <Receipt size={17} />
                </div>
              </div>
              <div className="reports-kpi-val" style={{ color: '#d97706' }}>
                ₹{summary?.totalOutflows.toFixed(2) || '0.00'}
              </div>
              <div className="reports-kpi-sub">
                <span>Bills: ₹{summary?.operatingExpenses.toFixed(0) || '0'}</span> •{' '}
                <span>Shrinkage: ₹{summary?.inventoryShrinkageLoss.toFixed(0) || '0'}</span>
              </div>
            </div>

            {/* 4. NET PROFIT / NET LOSS HERO CARD */}
            <div className={`reports-kpi-card ${isProfitable ? 'hero-profit' : 'hero-loss'}`}>
              <div className="reports-kpi-top">
                <span className="reports-kpi-label" style={{ color: isProfitable ? '#059669' : '#dc2626', fontWeight: 800 }}>
                  {isProfitable ? 'Net Profit (Earnings)' : 'Net Loss (Deficit)'}
                </span>
                <div
                  className="reports-kpi-icon"
                  style={{
                    background: isProfitable ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    color: isProfitable ? '#059669' : '#dc2626',
                  }}
                >
                  {isProfitable ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                </div>
              </div>
              <div className="reports-kpi-val">
                {isProfitable ? '+' : ''}₹{summary?.netProfit.toFixed(2) || '0.00'}
              </div>
              <div className="reports-kpi-sub">
                <span className={`reports-pill-badge ${isProfitable ? 'pill-success' : 'pill-danger'}`}>
                  {summary?.netMarginPercent || 0}% Net Margin
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  (Gross Profit - Expenses - Shrinkage)
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Sales & Profit Daily Trends + Payment Tender Mix */}
          <div className="reports-grid-two-col">
            {/* Sales & Profit Trends Chart */}
            <div className="reports-card">
              <div className="reports-card-header">
                <div>
                  <h3 className="reports-card-title">
                    <TrendingUp size={17} style={{ color: 'var(--accent-primary)' }} />
                    Daily Sales & Profit Trends
                  </h3>
                  <div className="reports-card-subtitle">
                    Volume progression and retained margins across {startDate} to {endDate}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.74rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--accent-primary)' }}></span>
                    Revenue
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10b981' }}></span>
                    Gross Profit
                  </span>
                </div>
              </div>

              <div className="reports-chart-wrap">
                {trends.length === 0 ? (
                  <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No sales recorded for this date window
                  </div>
                ) : (
                  <>
                    <div className="reports-chart-bars">
                    {trends.map((t, idx) => {
                      const revVal = Number(t.revenue) || 0;
                      const profVal = Number(t.grossProfit) || 0;
                      const netVal = Number(t.netProfit) || 0;
                      const revHeight = Math.max(Math.round((revVal / maxTrendVal) * 130), revVal > 0 ? 8 : 2);
                      const profHeight = Math.max(Math.round((profVal / maxTrendVal) * 130), profVal > 0 ? 8 : 2);
                      
                      // Compressed date markers (every 5-6 days or active)
                      const showLabel = trends.length <= 10 || idx === 0 || idx === trends.length - 1 || idx % 5 === 0 || revVal > 0;
                      const shortDate = t.dateFormatted ? t.dateFormatted.slice(5) : '';

                      // Tooltip alignment to avoid clipping near borders
                      const isLeftEdge = idx < 3;
                      const isRightEdge = idx >= trends.length - 3;
                      const tooltipStyle: React.CSSProperties = {
                        left: isLeftEdge ? '0px' : isRightEdge ? 'auto' : '50%',
                        right: isRightEdge ? '0px' : 'auto',
                        transform: isLeftEdge || isRightEdge ? 'none' : 'translateX(-50%)',
                      };

                      return (
                        <div key={t.dateFormatted || idx} className="reports-chart-col">
                          {/* Interactive Hover Tooltip */}
                          <div className="reports-bar-tooltip" style={tooltipStyle}>
                            <div className="tooltip-date-header">📅 {t.dateFormatted}</div>
                            <div className="tooltip-stat-row">
                              <span className="tooltip-stat-label">Revenue:</span>
                              <span className="tooltip-stat-val" style={{ color: '#818cf8' }}>
                                ₹{revVal.toFixed(2)}
                              </span>
                            </div>
                            <div className="tooltip-stat-row">
                              <span className="tooltip-stat-label">Gross Profit:</span>
                              <span className="tooltip-stat-val" style={{ color: '#10b981' }}>
                                +₹{profVal.toFixed(2)}
                              </span>
                            </div>
                            <div className="tooltip-stat-row">
                              <span className="tooltip-stat-label">{netVal >= 0 ? 'Net Profit:' : 'Net Loss:'}</span>
                              <span
                                className="tooltip-stat-val"
                                style={{ color: netVal >= 0 ? '#10b981' : '#f87171' }}
                              >
                                {netVal >= 0 ? '+' : ''}₹{netVal.toFixed(2)}
                              </span>
                            </div>
                            {t.billCount > 0 && (
                              <div className="tooltip-stat-row" style={{ color: '#94a3b8', fontSize: '0.68rem', marginTop: '2px' }}>
                                <span>Bills Count:</span>
                                <span>{t.billCount} invoices</span>
                              </div>
                            )}
                          </div>

                          {revVal > 0 ? (
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '3px', whiteSpace: 'nowrap' }}>
                              ₹{revVal >= 1000 ? `${(revVal / 1000).toFixed(1)}k` : revVal.toFixed(0)}
                            </div>
                          ) : (
                            <div style={{ height: '14px' }} />
                          )}

                          <div className="reports-chart-pair">
                            <div
                              className="bar-rev"
                              style={{ height: `${revHeight}px`, opacity: revVal > 0 ? 1 : 0.25 }}
                            />
                            <div
                              className="bar-prof"
                              style={{ height: `${profHeight}px`, opacity: profVal > 0 ? 1 : 0.25 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dedicated Non-Overlapping Timeline Axis */}
                  {trends.length > 0 && (
                    <div className="reports-chart-timeline-axis">
                      <span className="timeline-axis-label">
                        {formatMilestone(trends[0]?.dateFormatted)}
                      </span>
                      {trends.length >= 14 ? (
                        <>
                          <span className="timeline-axis-label">
                            {formatMilestone(trends[Math.floor(trends.length * 0.25)]?.dateFormatted)}
                          </span>
                          <span className="timeline-axis-label">
                            {formatMilestone(trends[Math.floor(trends.length * 0.50)]?.dateFormatted)}
                          </span>
                          <span className="timeline-axis-label">
                            {formatMilestone(trends[Math.floor(trends.length * 0.75)]?.dateFormatted)}
                          </span>
                        </>
                      ) : trends.length >= 7 ? (
                        <span className="timeline-axis-label">
                          {formatMilestone(trends[Math.floor(trends.length * 0.50)]?.dateFormatted)}
                        </span>
                      ) : null}
                      <span className="timeline-axis-label" style={{ color: 'var(--text-primary)' }}>
                        {formatMilestone(trends[trends.length - 1]?.dateFormatted)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

            {/* Tender Mode Breakdown */}
            <div className="reports-card">
              <div className="reports-card-header">
                <div>
                  <h3 className="reports-card-title">
                    <PieChart size={17} style={{ color: 'var(--info)' }} />
                    Collections by Tender
                  </h3>
                  <div className="reports-card-subtitle">
                    Distribution of payment methods at the counter
                  </div>
                </div>
              </div>

              {paymentModes.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No payment collections in this timeframe
                </div>
              ) : (
                <div className="reports-tender-list">
                  {paymentModes.map((pm) => {
                    const isCash = pm.paymentMode === 'CASH';
                    const isUpi = pm.paymentMode === 'UPI';
                    return (
                      <div key={pm.paymentMode} className="reports-tender-item">
                        <div className="reports-tender-meta">
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                            {isCash ? (
                              <Banknote size={15} color="#10b981" />
                            ) : isUpi ? (
                              <QrCode size={15} color="#6366f1" />
                            ) : (
                              <CreditCard size={15} color="#0284c7" />
                            )}
                            {pm.paymentMode} ({pm.transactionCount} bills)
                          </span>
                          <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                            ₹{pm.totalAmount.toFixed(2)} ({pm.percentage}%)
                          </span>
                        </div>
                        <div className="reports-tender-bar">
                          <div
                            className="reports-tender-fill"
                            style={{
                              width: `${pm.percentage}%`,
                              background: isCash ? '#10b981' : isUpi ? 'var(--accent-primary)' : '#0284c7',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Top Profit Contributors & Slow Moving Stock Alerts */}
          <div className="reports-grid-tables">
            {/* Top Products */}
            <div className="reports-card">
              <div className="reports-card-header">
                <div>
                  <h3 className="reports-card-title">
                    <TrendingUp size={17} style={{ color: '#059669' }} />
                    Top Profit-Generating Products
                  </h3>
                  <div className="reports-card-subtitle">Highest gross margin contributors in catalog</div>
                </div>
              </div>

              <div className="reports-table-container">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>Rank</th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Revenue</th>
                      <th>Gross Profit</th>
                      <th>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No sales data in this period
                        </td>
                      </tr>
                    ) : (
                      topProducts.map((p, idx) => (
                        <tr key={p.productId}>
                          <td>
                            <span className={`rank-badge ${idx === 0 ? 'top-1' : ''}`}>#{idx + 1}</span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{p.productName}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{p.quantitySold}</td>
                          <td style={{ fontWeight: 600 }}>₹{p.totalRevenue.toFixed(2)}</td>
                          <td style={{ fontWeight: 700, color: '#059669' }}>+₹{p.grossProfit.toFixed(2)}</td>
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

            {/* Dead Stock / Capital Locked */}
            <div className="reports-card">
              <div className="reports-card-header">
                <div>
                  <h3 className="reports-card-title">
                    <AlertTriangle size={17} style={{ color: '#d97706' }} />
                    Capital Locked in Slow Inventory
                  </h3>
                  <div className="reports-card-subtitle">Zero sales movement in selected timeframe</div>
                </div>
              </div>

              <div className="reports-table-container">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Product / Category</th>
                      <th>In Stock</th>
                      <th>Unit Cost</th>
                      <th>Capital Tied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slowStock.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          All inventory units are moving efficiently!
                        </td>
                      </tr>
                    ) : (
                      slowStock.map((s) => (
                        <tr key={s.productId}>
                          <td>
                            <div style={{ fontWeight: 700 }}>{s.productName}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.categoryName}</div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{s.currentStock}</td>
                          <td>₹{s.unitCost.toFixed(2)}</td>
                          <td style={{ fontWeight: 700, color: '#d97706' }}>₹{s.tiedUpCapital.toFixed(2)}</td>
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
                ₹{summary?.operatingExpenses.toFixed(2) || '0.00'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                {expenses.length} expense vouchers recorded
              </div>
            </div>

            {expenseBreakdown.map((b) => (
              <div key={b.category} className="reports-card" style={{ padding: '1rem 1.25rem' }}>
                <div className="reports-kpi-label">{b.category}</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  ₹{b.totalAmount.toFixed(2)}
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
                          ₹{exp.amount.toFixed(2)}
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
                  GST Statutory Filing & Tax Summary (GSTR-1 Ready)
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
                <span className="reports-tax-val">₹{taxSummary?.totalTaxableTurnover.toFixed(2) || '0.00'}</span>
              </div>
              <div className="reports-tax-box">
                <span className="reports-tax-label">Central GST (CGST)</span>
                <span className="reports-tax-val" style={{ color: '#0284c7' }}>
                  ₹{taxSummary?.cgstTotal.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="reports-tax-box">
                <span className="reports-tax-label">State GST (SGST)</span>
                <span className="reports-tax-val" style={{ color: '#059669' }}>
                  ₹{taxSummary?.sgstTotal.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="reports-tax-box">
                <span className="reports-tax-label">Integrated GST (IGST)</span>
                <span className="reports-tax-val" style={{ color: 'var(--accent-primary)' }}>
                  ₹{taxSummary?.igstTotal.toFixed(2) || '0.00'}
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
                  Total Tax Collected: ₹{taxSummary?.totalTaxCollected.toFixed(2) || '0.00'}
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
