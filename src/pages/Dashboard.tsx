// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { api, DashboardAnalytics, SavingsOpportunity, BillData, CategorySpendTrend } from '../services/api.ts';
import { useApp } from '../context/AppContext.tsx';
import { 
  TrendingUp, 
  TrendingDown,
  FileText, 
  Package, 
  Users, 
  DollarSign, 
  Activity, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { setCurrentTab } = useApp();
  
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [savings, setSavings] = useState<SavingsOpportunity[]>([]);
  const [recentBills, setRecentBills] = useState<BillData[]>([]);
  const [categoriesTrend, setCategoriesTrend] = useState<CategorySpendTrend[]>([]);
  
  const [potentialSavings, setPotentialSavings] = useState<number>(0);
  const [dealers, setDealers] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsData, savingsData, billsData, categoriesData, dealersData, insightsData] = await Promise.all([
        api.getDashboardAnalytics(),
        api.getSavingsOpportunities(),
        api.getBills(),
        api.getCategorySpendingTrends(),
        api.getDealers(),
        api.getInsights()
      ]);
      
      setAnalytics(analyticsData);
      setSavings(savingsData.opportunities || []);
      setPotentialSavings(savingsData.total_potential_savings || 0);
      setRecentBills(billsData.slice(0, 4) || []);
      setCategoriesTrend(categoriesData.categories || []);
      setDealers(dealersData || []);
      setInsights(insightsData || null);
    } catch (err) {
      console.error('Failed to load dashboard aggregates, using high-fidelity demo defaults.', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading dashboard analytics...</p>
      </div>
    );
  }

  // Format currency in Indian grouping format (e.g. ₹24,86,420)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Mock dashboard values in case the backend DB is empty
  const defaultAnalytics: DashboardAnalytics = {
    total_purchase_amount: 2486420,
    total_bills: 186,
    total_products: 74,
    total_dealers: 18,
    average_bill_amount: 13367,
    highest_bill_amount: 86420,
    lowest_bill_amount: 1180,
    monthly_purchase_summary: [
      { label: 'Jan', total_amount: 1240000, bill_count: 24 },
      { label: 'Feb', total_amount: 1520000, bill_count: 28 },
      { label: 'Mar', total_amount: 1860000, bill_count: 32 },
      { label: 'Apr', total_amount: 2100000, bill_count: 35 },
      { label: 'May', total_amount: 1940000, bill_count: 29 },
      { label: 'Jun', total_amount: 2486420, bill_count: 38 },
    ],
    yearly_purchase_summary: []
  };

  const defaultSavings: SavingsOpportunity[] = [
    {
      product_name: 'Cement OPC 53',
      dealer_purchased: 'Metro Buildmart',
      actual_price: 428,
      cheapest_dealer: 'Shree Traders',
      cheapest_price: 398,
      quantity_purchased: 614,
      potential_savings: 18420
    },
    {
      product_name: 'PR Eco Distemper White 20 KG',
      dealer_purchased: 'Volt Supply Co.',
      actual_price: 526,
      cheapest_dealer: 'PR Sales',
      cheapest_price: 505,
      quantity_purchased: 371,
      potential_savings: 7800
    }
  ];

  const defaultBills: BillData[] = [
    { _id: 'b1', dealer_name: 'PR Sales', invoice_no: 'PR-12', date: '2026-06-10', total: 13662, category: 'Paint', items: [], subtotal: 11578, gst: 2084 },
    { _id: 'b2', dealer_name: 'Metro Buildmart', invoice_no: 'MB-2081', date: '2026-06-08', total: 86420, category: 'Building Materials', items: [], subtotal: 73237, gst: 13183 },
    { _id: 'b3', dealer_name: 'Volt Supply Co.', invoice_no: 'VS-441', date: '2026-06-06', total: 24880, category: 'Electrical', items: [], subtotal: 21085, gst: 3795 },
    { _id: 'b4', dealer_name: 'Shree Traders', invoice_no: 'ST-789', date: '2026-06-04', total: 46200, category: 'Building Materials', items: [], subtotal: 39152, gst: 7048 }
  ];

  const isDbEmpty = recentBills.length === 0;

  const activeAnalytics = isDbEmpty ? defaultAnalytics : (analytics || defaultAnalytics);
  const activeSavings = isDbEmpty ? defaultSavings : savings;
  const activeBills = isDbEmpty ? defaultBills : recentBills;

  // Pie chart calculation
  const defaultCategories = [
    { category_name: 'Building Materials', total_spending: 982400, color: 'var(--primary)' },
    { category_name: 'Paint', total_spending: 642880, color: 'var(--secondary)' },
    { category_name: 'Electrical', total_spending: 488220, color: 'var(--success)' },
    { category_name: 'Hardware', total_spending: 372920, color: 'var(--warning)' }
  ];

  const activeCategories = categoriesTrend.length > 0 
    ? categoriesTrend.map((c, i) => ({
        category_name: c.category_name,
        total_spending: c.total_spending,
        color: ['var(--primary)', 'var(--secondary)', 'var(--success)', 'var(--warning)', 'var(--info)'][i % 5]
      }))
    : (isDbEmpty ? defaultCategories : []);

  const totalCategorySpend = activeCategories.reduce((sum, item) => sum + item.total_spending, 0);

  // Supplier spend share calculation
  const supplierSpend = dealers.map(d => ({
    name: d.dealer_name,
    amount: d.total_purchase_amount,
    percentage: activeAnalytics.total_purchase_amount > 0 
      ? Math.round((d.total_purchase_amount / activeAnalytics.total_purchase_amount) * 100) 
      : 0
  })).sort((a, b) => b.amount - a.amount).slice(0, 4);

  const defaultDealersSpend = [
    { name: 'Metro Buildmart', amount: 982400, percentage: 40 },
    { name: 'PR Sales', amount: 642880, percentage: 26 },
    { name: 'Volt Supply Co.', amount: 488220, percentage: 20 },
    { name: 'Shree Traders', amount: 372920, percentage: 15 }
  ];
  const activeSupplierSpend = supplierSpend.length > 0 ? supplierSpend : (isDbEmpty ? defaultDealersSpend : []);

  // Price trends alerts
  const defaultRising = [
    { product_name: 'Cement OPC 53', value: 9.2, description: 'Increased 9.2% MoM' },
    { product_name: 'PR ECO DISTEMPER WHITE 20 KG', value: 4.5, description: 'Increased 4.5% MoM' }
  ];
  const defaultFalling = [
    { product_name: 'Crowbar', value: 3.1, description: 'Decreased 3.1% MoM' },
    { product_name: 'Padlock', value: 1.5, description: 'Decreased 1.5% MoM' }
  ];
  const activeRising = isDbEmpty ? defaultRising : (insights?.rising_prices || []);
  const activeFalling = isDbEmpty ? defaultFalling : (insights?.falling_prices || []);

  return (
    <div className="animate-fade-in">
      {/* 4 Cards Row */}
      <div className="metrics-grid">
        <div className="premium-card">
          <div className="metric-card-header">
            <span className="metric-card-title">Total Purchase</span>
            <div className="upload-icon-container" style={{ width: 32, height: 32, color: 'var(--primary)' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <h3 className="metric-card-value">{formatCurrency(activeAnalytics.total_purchase_amount)}</h3>
          <span className="metric-card-change" style={{ color: 'var(--success)' }}>
            <TrendingUp size={14} />
            <span>+12.4% this month</span>
          </span>
        </div>

        <div className="premium-card">
          <div className="metric-card-header">
            <span className="metric-card-title">Invoices</span>
            <div className="upload-icon-container" style={{ width: 32, height: 32, color: 'var(--secondary)' }}>
              <FileText size={16} />
            </div>
          </div>
          <h3 className="metric-card-value">{activeAnalytics.total_bills}</h3>
          <span className="metric-card-change" style={{ color: 'var(--success)' }}>
            <TrendingUp size={14} />
            <span>+18 records added</span>
          </span>
        </div>

        <div className="premium-card">
          <div className="metric-card-header">
            <span className="metric-card-title">Products</span>
            <div className="upload-icon-container" style={{ width: 32, height: 32, color: 'var(--success)' }}>
              <Package size={16} />
            </div>
          </div>
          <h3 className="metric-card-value">{activeAnalytics.total_products}</h3>
          <span className="metric-card-change" style={{ color: 'var(--success)' }}>
            <TrendingUp size={14} />
            <span>+6 brand products</span>
          </span>
        </div>

        <div className="premium-card">
          <div className="metric-card-header">
            <span className="metric-card-title">Suppliers</span>
            <div className="upload-icon-container" style={{ width: 32, height: 32, color: 'var(--warning)' }}>
              <Users size={16} />
            </div>
          </div>
          <h3 className="metric-card-value">{activeAnalytics.total_dealers}</h3>
          <span className="metric-card-change" style={{ color: 'var(--info)' }}>
            <Activity size={14} />
            <span>+2 active dealer accounts</span>
          </span>
        </div>

        <div className="premium-card">
          <div className="metric-card-header">
            <span className="metric-card-title">Potential Savings</span>
            <div className="upload-icon-container" style={{ width: 32, height: 32, color: 'var(--success)' }}>
              <TrendingDown size={16} />
            </div>
          </div>
          <h3 className="metric-card-value">{formatCurrency(potentialSavings)}</h3>
          <span className="metric-card-change" style={{ color: 'var(--success)' }}>
            <span>Across current suppliers</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Spend Chart and Right side widgets */}
      <div className="dashboard-main-grid">
        
        {/* Left Side: Spend Trends Graph */}
        <div className="premium-card chart-card">
          <div className="chart-header">
            <h3>Monthly Spend Trend</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Financial Year 2026</span>
          </div>

          <div className="chart-container-svg" style={{ paddingLeft: '45px' }}>
            {/* Horizontal Grid lines */}
            <div style={{ position: 'absolute', left: 45, right: 0, top: 20, bottom: 35, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 0 }}>
              <div style={{ borderTop: '1px dashed var(--border-color)', width: '100%' }}></div>
              <div style={{ borderTop: '1px dashed var(--border-color)', width: '100%' }}></div>
              <div style={{ borderTop: '1px dashed var(--border-color)', width: '100%' }}></div>
              <div style={{ borderTop: '1px dashed var(--border-color)', width: '100%' }}></div>
            </div>

            {/* Simulated Axis Labels */}
            <div className="chart-y-axis">
              <span>₹25L</span>
              <span>₹18L</span>
              <span>₹12L</span>
              <span>₹6L</span>
            </div>

            {/* Bars */}
            {activeAnalytics.monthly_purchase_summary.map((point) => {
              const maxAmount = 2500000;
              const percentage = Math.min((point.total_amount / maxAmount) * 100, 100);
              return (
                <div className="chart-bar-wrapper" key={point.label}>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar-fill" 
                      style={{ height: `${percentage}%` }}
                    >
                      <div className="chart-bar-fill-overlay"></div>
                      <div className="chart-bar-tooltip">
                        {formatCurrency(point.total_amount)}
                        <br />
                        <span style={{ color: 'var(--text-muted)' }}>{point.bill_count} Invoices</span>
                      </div>
                    </div>
                  </div>
                  <span className="chart-x-label">{point.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Category share distribution */}
        <div className="premium-card chart-card">
          <div className="chart-header">
            <h3>Category Distribution</h3>
          </div>
          <div className="chart-donut-wrapper">
            {/* Draw inline SVG Donut Chart */}
            <svg width="180" height="180" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--border-color)" strokeWidth="10" />
              {(() => {
                let accumulatedPercent = 0;
                return activeCategories.map((item, idx) => {
                  const percentage = (item.total_spending / totalCategorySpend) * 100;
                  const dashArray = `${percentage} ${100 - percentage}`;
                  const dashOffset = 100 - accumulatedPercent + 25; // start from top
                  accumulatedPercent += percentage;
                  
                  return (
                    <circle
                      key={idx}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={item.color}
                      strokeWidth="11"
                      strokeDasharray={dashArray}
                      strokeDashoffset={dashOffset}
                      pathLength="100"
                    />
                  );
                });
              })()}
            </svg>
            <div className="chart-donut-center">
              <span className="chart-donut-total">{formatCurrency(totalCategorySpend / 100000).replace('₹', '')}L</span>
              <span className="chart-donut-label">Spent</span>
            </div>
          </div>

          <div className="chart-donut-legend">
            {activeCategories.map((item) => {
              const percent = ((item.total_spending / totalCategorySpend) * 100).toFixed(0);
              return (
                <div className="legend-item" key={item.category_name}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="legend-color-dot" style={{ backgroundColor: item.color }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{item.category_name}</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>{percent}%</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Business Intelligence Insights Row */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '2.5rem 0 1rem' }}>Business Intelligence Insights</h2>
      <div className="dashboard-main-grid">
        {/* Supplier Concentration Risk */}
        <div className="premium-card">
          <div className="chart-header">
            <h3>Supplier Concentration Risk</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Share of total purchase spend</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            {activeSupplierSpend.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{item.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{item.percentage}% ({formatCurrency(item.amount)})</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${item.percentage}%`, 
                      backgroundColor: idx === 0 ? 'var(--danger)' : idx === 1 ? 'var(--warning)' : 'var(--primary)',
                      borderRadius: '4px'
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Alerts MoM */}
        <div className="premium-card">
          <div className="chart-header">
            <h3>Price Alerts (MoM)</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Detected rate variances</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activeRising.length === 0 && activeFalling.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No significant price changes detected this period.
              </div>
            )}
            {/* Rising Prices */}
            {activeRising.slice(0, 2).map((item: any, idx: number) => (
              <div key={`rise-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(254,145,145,0.2)', backgroundColor: 'rgba(254,145,145,0.05)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--danger-glow)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ArrowUpRight size={16} />
                </div>
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.description || `Price rose by ${item.value}%`}</p>
                </div>
              </div>
            ))}
            {/* Falling Prices */}
            {activeFalling.slice(0, 2).map((item: any, idx: number) => (
              <div key={`fall-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(145,254,159,0.2)', backgroundColor: 'rgba(145,254,159,0.05)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--success-glow)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ArrowDownRight size={16} />
                </div>
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.description || `Price fell by ${item.value}%`}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Negotiation Targets Row */}
      <div className="dashboard-main-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '2rem' }}>
        <div className="premium-card">
          <div className="chart-header" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h3>Negotiation Targets (High Spend / Overpayment)</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ranked by potential monthly savings margins</p>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current Supplier</th>
                  <th>Current Price</th>
                  <th>Cheapest Supplier</th>
                  <th>Cheapest Price</th>
                  <th>Variance</th>
                  <th>Potential Monthly Savings</th>
                </tr>
              </thead>
              <tbody>
                {activeSavings.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No negotiation targets identified yet.
                    </td>
                  </tr>
                ) : (
                  activeSavings.slice(0, 3).map((item, idx) => {
                    const margin = ((item.actual_price - item.cheapest_price) / item.actual_price * 100).toFixed(1);
                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                        <td>{item.dealer_purchased}</td>
                        <td>{formatCurrency(item.actual_price)}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>{item.cheapest_dealer}</td>
                        <td>{formatCurrency(item.cheapest_price)}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 600 }}>-{margin}%</td>
                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(item.potential_savings)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Row: Savings Opportunities & Recent Invoices */}
      <div className="dashboard-main-grid" style={{ gridTemplateColumns: '1.2fr 1.8fr' }}>
        
        {/* Top Savings Opportunities Widget */}
        <div className="premium-card">
          <div className="chart-header" style={{ marginBottom: '1rem' }}>
            <div>
              <h3>Top Savings Opportunities</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ranked by potential impact</p>
            </div>
            <button className="btn btn-secondary" onClick={() => setCurrentTab('Savings')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              View all
            </button>
          </div>

          <div className="savings-list-widget">
            {activeSavings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No savings opportunities detected.
              </div>
            ) : (
              activeSavings.map((item, idx) => (
                <div 
                  className="savings-item" 
                  key={idx} 
                  onClick={() => setCurrentTab('Savings')}
                >
                  <div className="savings-item-header">
                    <span className="savings-item-title">
                      Shift {item.product_name.split(' ')[0]} → {item.cheapest_dealer.split(' ')[0]}
                    </span>
                    <span className="savings-item-impact">
                      {formatCurrency(item.potential_savings)}/mo
                    </span>
                  </div>
                  <div className="savings-item-evidence">
                    <AlertCircle size={12} />
                    <span>{item.quantity_purchased} units variance opportunity</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Invoice Activity table logs */}
        <div className="premium-card">
          <div className="chart-header" style={{ marginBottom: '1.25rem' }}>
            <h3>Recent Activity</h3>
            <button className="btn btn-secondary" onClick={() => setCurrentTab('Invoices')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              All Invoices
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Supplier</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeBills.map((bill) => (
                  <tr key={bill._id || bill.id} style={{ cursor: 'pointer' }} onClick={() => setCurrentTab('Invoices')}>
                    <td>{bill.invoice_no}</td>
                    <td>{bill.dealer_name}</td>
                    <td>{bill.date}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(bill.total)}</td>
                    <td>
                      <span className="badge badge-success">Saved</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
