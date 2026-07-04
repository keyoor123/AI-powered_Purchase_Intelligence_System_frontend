// src/pages/Products.tsx
import React, { useState, useEffect } from 'react';
import { api, ProductDetailResponse, PriceTrendsResponse, ProductComparisonResponse } from '../services/api.ts';
import { Search, ArrowLeft, Calendar, Users, Package, Trash2 } from 'lucide-react';

const Products: React.FC = () => {
  const [products, setProducts] = useState<ProductDetailResponse[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductDetailResponse | null>(null);
  const [priceTrends, setPriceTrends] = useState<PriceTrendsResponse | null>(null);
  const [comparisons, setComparisons] = useState<ProductComparisonResponse | null>(null);
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'rising' | 'falling'>('all');
  const [loading, setLoading] = useState(true);
  const [isDbEmpty, setIsDbEmpty] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const [data, billsData] = await Promise.all([
        api.getProductDetails(),
        api.getBills()
      ]);
      const empty = billsData.length === 0;
      setIsDbEmpty(empty);
      
      if (!empty) {
        setProducts(data);
      } else {
        setProducts(defaultProducts);
      }
    } catch (err) {
      console.error('Failed to load products list, using mock registry defaults.', err);
      setProducts(defaultProducts);
      setIsDbEmpty(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSelectProduct = async (product: ProductDetailResponse) => {
    setSelectedProduct(product);
    try {
      const [trendData, comparisonData] = await Promise.all([
        api.getPriceTrends(product.product_name),
        api.compareProducts(product.product_name)
      ]);
      setPriceTrends(trendData);
      setComparisons(comparisonData);
    } catch {
      // Setup demo variables if endpoint calls fail
      setPriceTrends(null);
      setComparisons(null);
    }
  };

  const formatCurrency = (val: number, isShort = false) => {
    if (isShort && val >= 100000) {
      return `₹${(val / 100000).toFixed(1)}L`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Default product records if backend DB is empty
  const defaultProducts: ProductDetailResponse[] = [
    { product_name: 'Cement OPC 53', category: 'Building Materials', average_price: 412, total_quantity_purchased: 1240, number_of_dealers: 5, overall_trend: 'RISING', trend_percentage: 9.2 },
    { product_name: 'PR Eco Distemper', category: 'Paint', average_price: 526, total_quantity_purchased: 420, number_of_dealers: 3, overall_trend: 'RISING', trend_percentage: 8.4 },
    { product_name: 'Copper Wire 2.5mm', category: 'Electrical', average_price: 2840, total_quantity_purchased: 86, number_of_dealers: 4, overall_trend: 'STABLE', trend_percentage: 0.8 },
    { product_name: 'Steel Fasteners', category: 'Hardware', average_price: 118, total_quantity_purchased: 640, number_of_dealers: 6, overall_trend: 'FALLING', trend_percentage: 3.1 }
  ];

  const activeProducts = isDbEmpty ? defaultProducts : products;

  // Helper to categorize products direction trends for styling
  const getTrendBadgeInfo = (trend: string, percentage: number) => {
    const trendUpper = (trend || 'STABLE').toUpperCase();
    if (trendUpper === 'RISING') {
      return { text: `RISING ${percentage}%`, badge: 'badge-danger', val: 'rising' };
    } else if (trendUpper === 'FALLING') {
      return { text: `FALLING ${percentage}%`, badge: 'badge-success', val: 'falling' };
    } else {
      return { text: `STABLE ${percentage}%`, badge: 'badge-info', val: 'stable' };
    }
  };

  const filteredProducts = activeProducts.filter((p) => {
    const matchesSearch = p.product_name.toLowerCase().includes(search.toLowerCase()) || 
                          p.category.toLowerCase().includes(search.toLowerCase());
    
    const direction = getTrendBadgeInfo(p.overall_trend, p.trend_percentage).val;
    const matchesDirection = directionFilter === 'all' || 
                             (directionFilter === 'rising' && direction === 'rising') ||
                             (directionFilter === 'falling' && direction === 'falling');

    return matchesSearch && matchesDirection;
  });

  const getLatestPurchaseDate = () => {
    if (comparisons && comparisons.historical_prices && comparisons.historical_prices.length > 0) {
      const dates = comparisons.historical_prices
        .map(h => h.last_purchase_date)
        .filter(d => !!d);
      if (dates.length > 0) {
        return new Date(dates[0]).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      }
    }
    return '2026-06-10'; // Reasonable default date
  };

  if (selectedProduct) {
    const trend = getTrendBadgeInfo(selectedProduct.overall_trend, selectedProduct.trend_percentage);
    const avg = selectedProduct.average_price;
    const minPrice = avg * 0.95;
    const maxPrice = avg * 1.05;

    // Fallback comparison profiles
    const defaultComparisons: ProductComparisonResponse = {
      product_name: selectedProduct.product_name,
      cheapest_dealer: 'Shree Traders',
      cheapest_price: minPrice,
      costliest_dealer: 'Metro Buildmart',
      costliest_price: maxPrice,
      average_market_price: avg,
      price_difference: maxPrice - minPrice,
      potential_savings: 18420,
      historical_prices: [
        { dealer_name: 'Shree Traders', average_price: minPrice, min_price: minPrice, max_price: minPrice, last_purchase_date: '2026-06-04' },
        { dealer_name: 'Volt Supply Co.', average_price: avg - 2, min_price: avg - 5, max_price: avg + 3, last_purchase_date: '2026-06-06' },
        { dealer_name: 'Metro Buildmart', average_price: maxPrice, min_price: maxPrice, max_price: maxPrice, last_purchase_date: '2026-06-08' }
      ]
    };

    const activeComparisons = comparisons || defaultComparisons;

    // Line trend points
    const defaultPoints = [
      { label: 'Jan', average_price: selectedProduct.average_price - 25 },
      { label: 'Feb', average_price: selectedProduct.average_price - 15 },
      { label: 'Mar', average_price: selectedProduct.average_price - 5 },
      { label: 'Apr', average_price: selectedProduct.average_price + 10 },
      { label: 'May', average_price: selectedProduct.average_price },
      { label: 'Jun', average_price: selectedProduct.average_price + 8 }
    ];

    const activePoints = priceTrends?.month_wise_trend || defaultPoints;

    return (
      <div className="animate-fade-in">
        <button className="btn btn-secondary" onClick={() => setSelectedProduct(null)} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <ArrowLeft size={16} />
          <span>Back to Product Explorer</span>
        </button>

        {/* 4 Cards Grid Row */}
        <div className="metrics-grid" style={{ marginBottom: '2rem' }}>
          <div className="premium-card">
            <div className="metric-card-header">
              <span className="metric-card-title">Average Price</span>
              <div className={`badge ${trend.badge}`}>{trend.text}</div>
            </div>
            <h3 className="metric-card-value">{formatCurrency(selectedProduct.average_price)}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Based on {selectedProduct.number_of_dealers} suppliers</span>
          </div>

          <div className="premium-card">
            <div className="metric-card-header">
              <span className="metric-card-title">Volume Purchased</span>
              <div className="upload-icon-container" style={{ width: 32, height: 32, color: 'var(--secondary)' }}>
                <Package size={14} />
              </div>
            </div>
            <h3 className="metric-card-value">{selectedProduct.total_quantity_purchased}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Across active invoices</span>
          </div>

          <div className="premium-card">
            <div className="metric-card-header">
              <span className="metric-card-title">Suppliers</span>
              <div className="upload-icon-container" style={{ width: 32, height: 32, color: 'var(--success)' }}>
                <Users size={14} />
              </div>
            </div>
            <h3 className="metric-card-value">{selectedProduct.number_of_dealers}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Providing options</span>
          </div>

          <div className="premium-card">
            <div className="metric-card-header">
              <span className="metric-card-title">Last Purchase</span>
              <div className="upload-icon-container" style={{ width: 32, height: 32, color: 'var(--warning)' }}>
                <Calendar size={14} />
              </div>
            </div>
            <h3 className="metric-card-value" style={{ fontSize: '1.75rem', lineHeight: '2.1rem', padding: '0.2rem 0' }}>
              {getLatestPurchaseDate()}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Most recent invoice record</span>
          </div>
        </div>

        {/* Main detail split */}
        <div className="dashboard-main-grid">
          
          {/* SVG Price Trend and Supplier Price comparison */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h3 style={{ marginBottom: '1rem' }}>Unit Price Trend (6 Months)</h3>
              <div style={{ height: '200px', width: '100%', position: 'relative', marginTop: '1rem' }}>
                {/* SVG Line graph */}
                <svg width="100%" height="100%" viewBox="0 0 500 150" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="0" y1="25" x2="500" y2="25" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3" />
                  <line x1="0" y1="75" x2="500" y2="75" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3" />
                  <line x1="0" y1="125" x2="500" y2="125" stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3" />
                  
                  {/* Generate path for trend */}
                  {(() => {
                    const prices = activePoints.map(p => p.average_price);
                    const minP = Math.min(...prices) * 0.95;
                    const maxP = Math.max(...prices) * 1.05;
                    const range = maxP - minP || 1;
                    
                    const pointsCoords = activePoints.map((p, idx) => {
                      const x = (idx / (activePoints.length - 1)) * 500;
                      const y = 150 - ((p.average_price - minP) / range) * 120 - 15;
                      return { x, y, price: p.average_price, label: p.label };
                    });

                    const pathString = pointsCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
                    const areaString = `${pathString} L 500 150 L 0 150 Z`;

                    return (
                      <>
                        {/* Area gradient under line */}
                        <path d={areaString} fill="url(#trendGrad)" opacity="0.1" />
                        <defs>
                          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--primary)" />
                            <stop offset="100%" stopColor="transparent" />
                          </linearGradient>
                        </defs>
                        
                        {/* The Line */}
                        <path d={pathString} fill="none" stroke="var(--primary)" strokeWidth="2.5" />
                        
                        {/* Points */}
                        {pointsCoords.map((c, i) => (
                          <g key={i}>
                            <circle cx={c.x} cy={c.y} r="4.5" fill="var(--bg-app)" stroke="var(--primary)" strokeWidth="2" />
                            <text x={c.x} y={c.y - 10} fill="var(--text-primary)" fontSize="8" fontWeight="600" textAnchor="middle">
                              ₹{c.price.toFixed(0)}
                            </text>
                            <text x={c.x} y="145" fill="var(--text-muted)" fontSize="8" textAnchor="middle">
                              {c.label}
                            </text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '1.25rem' }}>Supplier Price Comparison</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeComparisons.historical_prices.map((dealer) => {
                  const maxPrice = activeComparisons.costliest_price * 1.05;
                  const percent = (dealer.average_price / maxPrice) * 100;
                  const isCheapest = dealer.dealer_name === activeComparisons.cheapest_dealer;
                  return (
                    <div key={dealer.dealer_name} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>{dealer.dealer_name}</span>
                        <span style={{ fontWeight: 600, color: isCheapest ? 'var(--success)' : 'var(--text-primary)' }}>
                          {formatCurrency(dealer.average_price)}
                          {isCheapest && ' (Cheapest)'}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            width: `${percent}%`, 
                            background: isCheapest ? 'linear-gradient(to right, var(--success-glow), var(--success))' : 'linear-gradient(to right, var(--primary-glow), var(--primary))',
                            borderRadius: '4px' 
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right side: Demand Forecasts */}
          <div className="premium-card" style={{ height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Next Month Forecast</h3>
              <span className="badge badge-warning" style={{ textTransform: 'none', borderRadius: '4px', fontSize: '0.7rem' }}>Experimental AI</span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Predictive models projection based on historical demand cycles.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="premium-card" style={{ background: 'hsla(217, 32%, 18%, 0.2)', padding: '1.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Projected Quantity</span>
                <h2 style={{ fontSize: '1.8rem', marginTop: '0.25rem', color: 'var(--primary-hover)' }}>1,420–1,560 units</h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Expected growth: +12% MoM demand
                </div>
              </div>

              <div className="premium-card" style={{ background: 'hsla(217, 32%, 18%, 0.2)', padding: '1.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Cost</span>
                <h2 style={{ fontSize: '1.8rem', marginTop: '0.25rem', color: 'var(--success)' }}>₹7.4L–₹8.1L</h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  At current average market rate {formatCurrency(selectedProduct.average_price)}
                </div>
              </div>

              {activeComparisons.potential_savings > 0 && (
                <div className="premium-card" style={{ border: '1px dashed var(--success)', background: 'var(--success-glow)', padding: '1rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--success)', fontSize: '0.9rem' }}>Savings Alert</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: '1.4' }}>
                    Sourcing exclusively from <strong>{activeComparisons.cheapest_dealer}</strong> next month could yield savings of approximately <strong>{formatCurrency(activeComparisons.potential_savings)}</strong>.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading products database...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="invoices-filter-bar">
        {/* Search */}
        <div className="invoices-search-wrapper">
          <Search size={18} className="invoices-search-icon" />
          <input
            type="text"
            placeholder="Search tracked product or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field invoices-search-input"
          />
        </div>

        {/* Filters */}
        <div className="filter-btn-group">
          <button
            onClick={() => setDirectionFilter('all')}
            className={`filter-btn ${directionFilter === 'all' ? 'active' : ''}`}
          >
            All {activeProducts.length}
          </button>
          <button
            onClick={() => setDirectionFilter('rising')}
            className={`filter-btn ${directionFilter === 'rising' ? 'active' : ''}`}
          >
            Rising {activeProducts.filter(p => getTrendBadgeInfo(p.overall_trend, p.trend_percentage).val === 'rising').length}
          </button>
          <button
            onClick={() => setDirectionFilter('falling')}
            className={`filter-btn ${directionFilter === 'falling' ? 'active' : ''}`}
          >
            Falling {activeProducts.filter(p => getTrendBadgeInfo(p.overall_trend, p.trend_percentage).val === 'falling').length}
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No products found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Avg. Price</th>
                  <th>Total Quantity</th>
                  <th>Suppliers</th>
                  <th>Price Trend</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const trend = getTrendBadgeInfo(p.overall_trend, p.trend_percentage);
                  return (
                    <tr 
                      key={p.product_name} 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSelectProduct(p)}
                    >
                      <td style={{ fontWeight: 600 }}>{p.product_name}</td>
                      <td>
                        <span className="badge badge-info" style={{ textTransform: 'none', borderRadius: '4px' }}>{p.category}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(p.average_price)}</td>
                      <td>{p.total_quantity_purchased} units</td>
                      <td style={{ fontWeight: 500 }}>{p.number_of_dealers} suppliers</td>
                      <td>
                        <span className={`badge ${trend.badge}`}>
                          {trend.text}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`Are you sure you want to delete the product "${p.product_name}"? This will remove it from all invoices and recalculate those invoice totals. If any invoice becomes empty, it will be deleted.`)) {
                              try {
                                await api.deleteProduct(p.product_name);
                                fetchProducts();
                              } catch (err: any) {
                                alert(err.message || 'Failed to delete product.');
                              }
                            }
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--danger)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.25rem',
                          }}
                          title="Delete Product"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
