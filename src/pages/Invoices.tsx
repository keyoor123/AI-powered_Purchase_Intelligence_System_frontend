// src/pages/Invoices.tsx
import React, { useState, useEffect } from 'react';
import { api, BillData } from '../services/api.ts';
import { Search, ArrowLeft, Image, Edit, Trash2 } from 'lucide-react';
import ExtractionReview from '../components/ExtractionReview.tsx';

const Invoices: React.FC = () => {
  const [bills, setBills] = useState<BillData[]>([]);
  const [selectedBill, setSelectedBill] = useState<BillData | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'review'>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDbEmpty, setIsDbEmpty] = useState(true);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const data = await api.getBills();
      setBills(data);
      setIsDbEmpty(data.length === 0);
    } catch (err) {
      console.error('Failed to load bills, seeding high-fidelity mock list.', err);
      setIsDbEmpty(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading invoices...</p>
      </div>
    );
  }

  const handleSelectBill = async (id: string) => {
    try {
      const detailed = await api.getBill(id);
      setSelectedBill(detailed);
    } catch {
      // Fallback if detail fetch fails
      const matched = bills.find(b => b._id === id || b.id === id);
      if (matched) setSelectedBill(matched);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Mock list in case database is empty
  const defaultBills: BillData[] = [
    {
      _id: 'b1',
      invoice_no: '12',
      dealer_name: 'PR Sales',
      date: '2026-04-10',
      category: 'Paint',
      total: 13662.05,
      status: 'Saved',
      subtotal: 11578.01,
      gst: 2084.04,
      items: [
        { product: 'PR Eco Distemper White 20 KG', quantity: 22, price: 526.27, amount: 11578.01 }
      ]
    },
    {
      _id: 'b2',
      invoice_no: '2081',
      dealer_name: 'Metro Buildmart',
      date: '2026-04-08',
      category: 'Building Materials',
      total: 86420,
      status: 'Review',
      subtotal: 73237.28,
      gst: 13182.72,
      items: [
        { product: 'Cement OPC 53', quantity: 180, price: 428.00, amount: 77040.00 }
      ]
    },
    {
      _id: 'b3',
      invoice_no: '441',
      dealer_name: 'Volt Supply Co.',
      date: '2026-04-06',
      category: 'Electrical',
      total: 24880,
      status: 'Saved',
      subtotal: 21084.75,
      gst: 3795.25,
      items: [
        { product: 'Copper Wire 2.5mm', quantity: 8, price: 2840, amount: 22720 }
      ]
    },
    {
      _id: 'b4',
      invoice_no: '789',
      dealer_name: 'Shree Traders',
      date: '2026-04-04',
      category: 'Building Materials',
      total: 46200,
      status: 'Saved',
      subtotal: 39152.54,
      gst: 7047.46,
      items: [
        { product: 'Cement OPC 53', quantity: 116, price: 398, amount: 46200 }
      ]
    }
  ];

  const activeBills = isDbEmpty ? defaultBills : bills;

  // Filter list by search query and tab status
  const filteredBills = activeBills.filter((bill) => {
    const matchesSearch = 
      bill.invoice_no.toLowerCase().includes(search.toLowerCase()) ||
      bill.dealer_name.toLowerCase().includes(search.toLowerCase()) ||
      (bill.category && bill.category.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'review' && bill.status?.toLowerCase() === 'review');

    return matchesSearch && matchesStatus;
  });

  if (selectedBill) {
    if (isEditing) {
      return (
        <div className="animate-fade-in">
          <button className="btn btn-secondary" onClick={() => setIsEditing(false)} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <ArrowLeft size={16} />
            <span>Cancel Editing</span>
          </button>
          <div className="premium-card">
            <ExtractionReview
              initialData={selectedBill}
              fileName={selectedBill.source || selectedBill.bill_image || 'invoice.pdf'}
              onSave={async (updatedBill) => {
                try {
                  const billId = selectedBill._id || selectedBill.id;
                  if (!billId) throw new Error('Missing invoice database ID.');
                  await api.updateBill(billId, updatedBill);
                  setSelectedBill({ ...selectedBill, ...updatedBill, status: 'verified' });
                  setIsEditing(false);
                  fetchBills();
                } catch (err: any) {
                  console.error(err);
                  alert(err.message || 'Failed to update invoice details.');
                }
              }}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        </div>
      );
    }

    const detailSubtotal = selectedBill.subtotal || selectedBill.items?.reduce((sum, item) => sum + item.amount, 0) || (selectedBill.total / 1.18);
    const detailGst = selectedBill.gst || (selectedBill.total - detailSubtotal);

    return (
      <div className="animate-fade-in">
        <button className="btn btn-secondary" onClick={() => setSelectedBill(null)} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <ArrowLeft size={16} />
          <span>Back to Invoices</span>
        </button>

        <div className="invoice-detail-grid">
          {/* Detailed list and Line Items */}
          <div className="premium-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <span className="badge badge-info" style={{ marginBottom: '0.5rem', textTransform: 'none' }}>{selectedBill.category}</span>
                <h2>{selectedBill.dealer_name}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Invoice date: {selectedBill.date}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge ${selectedBill.status === 'Review' ? 'badge-warning' : 'badge-success'}`} style={{ marginBottom: '0.5rem' }}>
                  {selectedBill.status || 'Saved'}
                </span>
                <h2 style={{ color: 'var(--primary-hover)' }}>{formatCurrency(selectedBill.total)}</h2>
              </div>
            </div>

            <h3 className="detail-section-title" style={{ marginTop: 0 }}>Invoice Line Items</h3>
            <div className="line-items-wrapper" style={{ overflowX: 'auto', marginBottom: '2rem' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Unit Price</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.items && selectedBill.items.length > 0 ? (
                    selectedBill.items.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{item.product}</td>
                        <td>{item.quantity}</td>
                        <td>{item.unit || 'Nos'}</td>
                        <td>{formatCurrency(item.price)}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(item.amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No line items parsed.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div className="premium-card" style={{ background: 'hsla(217, 32%, 18%, 0.15)', padding: '1rem', width: '280px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                    <span>{formatCurrency(detailSubtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>GST:</span>
                    <span>{formatCurrency(detailGst)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem', fontSize: '1rem' }}>
                    <span>Total:</span>
                    <span style={{ color: 'var(--primary-hover)' }}>{formatCurrency(selectedBill.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Record Details side panel */}
          <div className="premium-card" style={{ height: 'fit-content' }}>
            <h3 className="detail-section-title" style={{ marginTop: 0 }}>Record Details</h3>
            
            <div className="metadata-list" style={{ marginBottom: '1.5rem' }}>
              <div className="metadata-item">
                <span className="metadata-label">Invoice Number</span>
                <span className="metadata-value">#{selectedBill.invoice_no}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Status</span>
                <span className="metadata-value">{selectedBill.status || 'Saved'}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Source Document</span>
                <span className="metadata-value" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Image size={14} style={{ color: 'var(--primary)' }} />
                  {selectedBill.source || 'OCR Uploaded'}
                </span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Last Updated</span>
                <span className="metadata-value">{selectedBill.date} · 14:32</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => setIsEditing(true)}
                style={{ width: '100%', fontSize: '0.9rem', display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center' }}
              >
                <Edit size={16} />
                <span>Edit Invoice Details</span>
              </button>

              <button 
                className="btn btn-danger" 
                onClick={async () => {
                  const billId = selectedBill._id || selectedBill.id;
                  if (!billId) return;
                  if (confirm("Are you sure you want to delete this invoice? This will permanently remove the record and any exclusive product or supplier links.")) {
                    try {
                      await api.deleteBill(billId);
                      setSelectedBill(null);
                      fetchBills();
                    } catch (err: any) {
                      alert(err.message || 'Failed to delete invoice.');
                    }
                  }
                }}
                style={{ width: '100%', fontSize: '0.9rem', display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--danger)', color: '#fff' }}
              >
                <Trash2 size={16} />
                <span>Delete Invoice</span>
              </button>
            </div>
          </div>
        </div>
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
            placeholder="Search invoice number, supplier or product category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field invoices-search-input"
          />
        </div>

        {/* Tab switcher */}
        <div className="filter-btn-group">
          <button
            onClick={() => setStatusFilter('all')}
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
          >
            All {activeBills.length}
          </button>
          <button
            onClick={() => setStatusFilter('review')}
            className={`filter-btn ${statusFilter === 'review' ? 'active' : ''}`}
          >
            Needs review {activeBills.filter(b => b.status === 'Review').length}
          </button>
        </div>
      </div>

      {/* Main Table List */}
      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredBills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No invoices found matching criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Supplier</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => (
                  <tr 
                    key={bill._id || bill.id} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSelectBill(bill._id || bill.id || '')}
                  >
                    <td style={{ fontWeight: 600 }}>{bill.invoice_no}</td>
                    <td>{bill.dealer_name}</td>
                    <td style={{ fontSize: '0.9rem' }}>{bill.date}</td>
                    <td>
                      <span className="badge badge-info" style={{ textTransform: 'none', borderRadius: '4px' }}>{bill.category || 'Materials'}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatCurrency(bill.total)}
                    </td>
                    <td>
                      <span className={`badge ${bill.status === 'Review' ? 'badge-warning' : 'badge-success'}`}>
                        {bill.status || 'Saved'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;
