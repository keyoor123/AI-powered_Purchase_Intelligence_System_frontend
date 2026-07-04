// src/components/ExtractionReview.tsx
import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { BillData, BillItem } from '../services/api.ts';
import { Trash2, Plus, AlertCircle, Save, ZoomIn, ZoomOut } from 'lucide-react';

interface ExtractionReviewProps {
  initialData: BillData;
  fileName: string;
  onSave: (updatedData: BillData) => Promise<void> | void;
  onCancel?: () => void;
}

const ExtractionReview: React.FC<ExtractionReviewProps> = ({ initialData, fileName, onSave, onCancel }) => {
  const { categories } = useApp();
  const [zoom, setZoom] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Review editable state
  const [dealerName, setDealerName] = useState(initialData.dealer_name);
  const [invoiceNo, setInvoiceNo] = useState(initialData.invoice_no);
  const [invoiceDate, setInvoiceDate] = useState(initialData.date);
  const [category, setCategory] = useState(initialData.category || 'Paint');
  const [items, setItems] = useState<BillItem[]>(initialData.items || []);
  const [gstPercent, setGstPercent] = useState(18); // Default 18% GST

  // Compute Subtotal, GST and Total based on items
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const gst = (subtotal * gstPercent) / 100;
  const total = subtotal + gst;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 70));

  const handleItemChange = (index: number, key: keyof BillItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index] };
    
    if (key === 'quantity' || key === 'price') {
      const numVal = parseFloat(value) || 0;
      item[key] = numVal as never;
      item.amount = (key === 'quantity' ? numVal : item.quantity) * (key === 'price' ? numVal : item.price);
    } else {
      item[key] = value as never;
    }
    
    updated[index] = item;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([...items, { product: 'New Product', quantity: 1, price: 0, amount: 0, unit: 'Nos' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    if (!dealerName.trim() || !invoiceNo.trim() || !invoiceDate.trim()) {
      setError('Supplier, Invoice number, and Date are required.');
      return;
    }
    
    if (items.length === 0) {
      setError('Please add at least one line item.');
      return;
    }

    setSubmitting(false);
    setError(null);

    const payload: BillData = {
      ...initialData, // Preserve database IDs and metadata if editing an existing invoice
      dealer_name: dealerName,
      invoice_no: invoiceNo,
      date: invoiceDate,
      category,
      items,
      subtotal,
      gst,
      total,
      source: fileName,
      status: 'verified'
    };

    setSubmitting(true);
    try {
      await onSave(payload);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save confirmed invoice details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-split animate-fade-in">
      {/* Left Column: Visual Mock representation of invoice */}
      <div className="document-preview-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <span>DOCUMENT PREVIEW ({fileName})</span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={handleZoomOut} style={{ padding: '0.25rem 0.5rem' }}>
              <ZoomOut size={14} />
            </button>
            <span>{zoom}%</span>
            <button className="btn btn-secondary" onClick={handleZoomIn} style={{ padding: '0.25rem 0.5rem' }}>
              <ZoomIn size={14} />
            </button>
          </div>
        </div>

        <div className="document-preview-box">
          <div 
            className="doc-mock-invoice animate-scale-in"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center', transition: 'transform 0.2s ease' }}
          >
            <div className="doc-header-mock">
              <div>
                <strong style={{ fontSize: '0.9rem' }}>{dealerName || 'SUPPLIER NAME'}</strong>
                <div style={{ color: '#666', fontSize: '0.55rem', marginTop: '2px' }}>TAX INVOICE RECORD</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>INVOICE: #{invoiceNo || '—'}</div>
                <div>DATE: {invoiceDate || '—'}</div>
              </div>
            </div>

            <div className="doc-items-mock">
              <div className="doc-item-row-mock" style={{ fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '2px', marginBottom: '4px' }}>
                <span>PRODUCT</span>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <span>QTY</span>
                  <span>PRICE</span>
                  <span style={{ width: '50px', textAlign: 'right' }}>TOTAL</span>
                </div>
              </div>
              {items.map((item, idx) => (
                <div className="doc-item-row-mock" key={idx}>
                  <span style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '140px' }}>
                    {item.product}
                  </span>
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <span>{item.quantity}</span>
                    <span>₹{item.price.toFixed(1)}</span>
                    <span style={{ width: '50px', textAlign: 'right' }}>₹{item.amount.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="doc-footer-mock">
              <div>SUBTOTAL: ₹{subtotal.toFixed(2)}</div>
              <div>GST ({gstPercent}%): ₹{gst.toFixed(2)}</div>
              <div style={{ fontSize: '0.8rem', color: '#111', borderTop: '1px solid #333', paddingTop: '4px', marginTop: '2px' }}>
                TOTAL: ₹{total.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Ingest Variables review form */}
      <div className="review-form-container">
        {error && (
          <div className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '6px', textTransform: 'none' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="review-form-fields">
          <div className="form-group">
            <label className="form-label">Supplier / Dealer Name</label>
            <input 
              type="text" 
              value={dealerName} 
              onChange={(e) => setDealerName(e.target.value)} 
              className="input-field" 
            />
          </div>

          <div className="settings-form-row" style={{ marginBottom: 0 }}>
            <div className="form-group">
              <label className="form-label">Invoice Number</label>
              <input 
                type="text" 
                value={invoiceNo} 
                onChange={(e) => setInvoiceNo(e.target.value)} 
                className="input-field" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Invoice Date</label>
              <input 
                type="date" 
                value={invoiceDate} 
                onChange={(e) => setInvoiceDate(e.target.value)} 
                className="input-field" 
              />
            </div>
          </div>

          <div className="settings-form-row" style={{ marginBottom: 0 }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                className="input-field"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">GST Rate (%)</label>
              <select 
                value={gstPercent} 
                onChange={(e) => setGstPercent(parseInt(e.target.value) || 0)} 
                className="input-field"
              >
                <option value={0}>0% GST</option>
                <option value={5}>5% GST</option>
                <option value={12}>12% GST</option>
                <option value={18}>18% GST</option>
                <option value={28}>28% GST</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Line Items</label>
              <button type="button" className="btn btn-secondary" onClick={handleAddItem} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                <Plus size={12} /> Add Item
              </button>
            </div>
            
            <div className="items-review-list" style={{ marginTop: '0.5rem' }}>
              {items.map((item, idx) => (
                <div className="item-review-row animate-slide-up" key={idx}>
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={item.product}
                    onChange={(e) => handleItemChange(idx, 'product', e.target.value)}
                    className="input-field"
                    style={{ flexGrow: 2 }}
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    className="input-field"
                    style={{ width: '60px' }}
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={item.price}
                    onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                    className="input-field"
                    style={{ width: '80px' }}
                  />
                  <span style={{ fontSize: '0.8rem', width: '50px', textAlign: 'right', fontWeight: 600 }}>
                    ₹{item.amount.toFixed(0)}
                  </span>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => handleRemoveItem(idx)}
                    style={{ padding: '0.4rem', color: 'var(--danger)', borderColor: 'rgba(254,145,145,0.2)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="premium-card" style={{ background: 'hsla(217, 32%, 18%, 0.15)', padding: '1rem', marginTop: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
              <span>₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>GST ({gstPercent}%):</span>
              <span>₹{gst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem', fontSize: '1rem' }}>
              <span>Total Amount:</span>
              <span style={{ color: 'var(--primary-hover)' }}>₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
          {onCancel && (
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onCancel}
              disabled={submitting}
              style={{ flex: 1, padding: '0.9rem' }}
            >
              Cancel
            </button>
          )}
          <button 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={submitting} 
            style={{ flex: onCancel ? 2 : 1, padding: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
          >
            <Save size={18} />
            <span>{submitting ? 'Saving...' : 'Save Invoice'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtractionReview;
