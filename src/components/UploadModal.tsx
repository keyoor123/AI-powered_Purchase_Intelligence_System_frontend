// src/components/UploadModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api, BillData, Category } from '../services/api.ts';
import { X, Upload, File, Loader2, Check, AlertCircle, Edit, FileText } from 'lucide-react';
import ExtractionReview from './ExtractionReview.tsx';

type UploadStep = 'idle' | 'uploading' | 'review' | 'error' | 'batch_review' | 'batch_result';

interface BatchSummary {
  total: number;
  successCount: number;
  failCount: number;
  savedList: Array<{ filename: string; invoice_no: string; total: number; id: string }>;
  errorList: Array<{ filename: string; error: string }>;
}

const UploadModal: React.FC = () => {
  const { setUploadModalOpen, addNotification } = useApp();
  const [step, setStep] = useState<UploadStep>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [batchCount, setBatchCount] = useState(0);
  
  // OCR processing states
  const [procStep, setProcStep] = useState(1); // 1: Reading text, 2: Extracting details
  const [extractedData, setExtractedData] = useState<BillData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [batchSummary, setBatchSummary] = useState<BatchSummary | null>(null);

  // Batch Review state
  const [categories, setCategories] = useState<Category[]>([]);
  const [batchBills, setBatchBills] = useState<{ filename: string; bill_data: BillData }[]>([]);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  const [savingBatch, setSavingBatch] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await api.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    loadCategories();
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFiles(Array.from(e.target.files));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const processSelectedFiles = async (selectedFiles: File[]) => {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const validFiles = selectedFiles.filter(file => {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      return validExtensions.includes(ext);
    });

    if (validFiles.length === 0) {
      alert('No valid invoice files (JPG, JPEG, PNG, WebP, PDF) found in your selection.');
      return;
    }

    // Single file flow (preserves review and edit control)
    if (validFiles.length === 1) {
      const selectedFile = validFiles[0];
      setFile(selectedFile);
      setStep('uploading');
      setProcStep(1);

      try {
        setTimeout(() => setProcStep(2), 1500);
        
        const parsedData = await api.uploadBill(selectedFile);
        
        const sanitized: BillData = {
          ...parsedData,
          invoice_no: parsedData.invoice_no || Math.floor(1000 + Math.random() * 9000).toString(),
          date: parsedData.date || new Date().toISOString().split('T')[0],
          category: parsedData.category || 'Paint',
          items: parsedData.items || []
        };

        setTimeout(() => {
          setExtractedData(sanitized);
          setStep('review');
        }, 3000);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Invoice extraction failed. Please review file format.');
        setStep('error');
        addNotification(`Failed to extract text from ${selectedFile.name}`, 'failed');
      }
      return;
    }

    // Batch / Folder Upload Flow
    setFile(null);
    setBatchCount(validFiles.length);
    setStep('uploading');

    try {
      // Hit batch processing endpoint
      const batchRes = await api.uploadBatchBills(validFiles);
      
      const parsedBills: typeof batchBills = [];
      let failCount = 0;
      const errorList: BatchSummary['errorList'] = [];
      
      const defaultCategory = categories[0]?.name || 'Paint';

      // Load parsed bills into local state for verification before saving
      for (const res of batchRes.results) {
        if (res.success && res.bill_data) {
          const sanitized: BillData = {
            ...res.bill_data,
            invoice_no: res.bill_data.invoice_no || Math.floor(1000 + Math.random() * 9000).toString(),
            date: res.bill_data.date || new Date().toISOString().split('T')[0],
            category: res.bill_data.category || defaultCategory,
            items: res.bill_data.items || []
          };
          parsedBills.push({
            filename: res.filename,
            bill_data: sanitized
          });
        } else {
          failCount++;
          errorList.push({
            filename: res.filename,
            error: res.detail || res.validation_errors || 'Extraction failed.'
          });
        }
      }

      setBatchBills(parsedBills);
      setBatchSummary({
        total: validFiles.length,
        successCount: 0,
        failCount,
        savedList: [],
        errorList
      });

      if (parsedBills.length > 0) {
        setStep('batch_review');
      } else {
        setStep('batch_result'); // Show results instantly if all files failed processing
      }

    } catch (batchErr: any) {
      console.error(batchErr);
      setErrorMsg(batchErr.message || 'Batch processing failed. Please try again.');
      setStep('error');
      addNotification(`Batch upload of ${validFiles.length} files failed`, 'failed');
    }
  };

  const handleManualEntry = () => {
    const defaultCategory = categories[0]?.name || 'Paint';
    const defaultManualBill: BillData = {
      dealer_name: '',
      invoice_no: '',
      date: new Date().toISOString().split('T')[0],
      items: [
        { product: '', quantity: 1, price: 0, amount: 0, unit: 'Nos' }
      ],
      subtotal: 0,
      gst: 0,
      total: 0,
      category: defaultCategory,
      source: 'Manual Entry',
      status: 'verified'
    };
    setFile(null);
    setExtractedData(defaultManualBill);
    setStep('review');
  };

  const handleBatchCategoryChange = (index: number, newCategory: string) => {
    setBatchBills(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        bill_data: {
          ...copy[index].bill_data,
          category: newCategory
        }
      };
      return copy;
    });
  };

  const handleSaveAllBatch = async () => {
    if (!batchSummary) return;
    
    setSavingBatch(true);
    setStep('uploading');
    setFile(null); // Shows batch loading spinner
    
    let successCount = 0;
    let failCount = batchSummary.failCount;
    const savedList: BatchSummary['savedList'] = [];
    const errorList: BatchSummary['errorList'] = [...batchSummary.errorList];

    for (const item of batchBills) {
      try {
        const saveRes = await api.saveBill(item.bill_data);
        successCount++;
        savedList.push({
          filename: item.filename,
          invoice_no: item.bill_data.invoice_no,
          total: item.bill_data.total,
          id: saveRes.id
        });
      } catch (saveErr: any) {
        console.error(`Failed to save ${item.filename}:`, saveErr);
        failCount++;
        errorList.push({
          filename: item.filename,
          error: saveErr.message || 'Failed to save to database.'
        });
      }
    }

    setBatchSummary({
      total: batchSummary.total,
      successCount,
      failCount,
      savedList,
      errorList
    });
    
    setSavingBatch(false);
    setStep('batch_result');
    addNotification(`Batch upload complete: ${successCount} saved, ${failCount} failed.`, 'info');
  };

  const handleReviewSave = async (updatedBill: BillData) => {
    try {
      await api.saveBill(updatedBill);
      setUploadModalOpen(false);
      addNotification(`Invoice ${updatedBill.invoice_no} saved successfully.`, 'ready');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to save invoice.');
    }
  };

  return (
    <div className="modal-backdrop">
      <div 
        className="modal-content glass-panel animate-scale-in"
        style={{ maxWidth: reviewIndex !== null ? '960px' : (step === 'review' || step === 'batch_review' || step === 'batch_result' ? '960px' : '580px') }}
      >
        <div className="modal-header">
          <h3>
            {reviewIndex !== null && 'Edit Invoice Details'}
            {reviewIndex === null && (
              <>
                {step === 'idle' && 'Upload Invoice'}
                {step === 'uploading' && (savingBatch ? 'Saving Invoices...' : 'Processing Invoices...')}
                {step === 'review' && (file ? 'Extraction Review' : 'Manual Invoice Entry')}
                {step === 'batch_review' && 'Review Batch Uploads'}
                {step === 'batch_result' && 'Batch Processing Results'}
                {step === 'error' && 'Ingestion Error'}
              </>
            )}
          </h3>
          <button className="modal-close-btn" onClick={() => setUploadModalOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {reviewIndex !== null && batchBills[reviewIndex] ? (
          <ExtractionReview
            initialData={batchBills[reviewIndex].bill_data}
            fileName={batchBills[reviewIndex].filename}
            onSave={(updatedBill) => {
              setBatchBills(prev => {
                const copy = [...prev];
                copy[reviewIndex] = {
                  ...copy[reviewIndex],
                  bill_data: updatedBill
                };
                return copy;
              });
              setReviewIndex(null);
            }}
            onCancel={() => setReviewIndex(null)}
          />
        ) : (
          <>
            {/* Drop Area Step */}
            {step === 'idle' && (
              <div className="animate-fade-in">
                <div 
                  className={`upload-drop-area ${isDragOver ? 'dragover' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    style={{ display: 'none' }}
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    multiple
                  />
                  <input 
                    type="file" 
                    ref={folderInputRef} 
                    onChange={handleFolderChange} 
                    style={{ display: 'none' }}
                    {...({
                      webkitdirectory: "",
                      directory: "",
                      multiple: true
                    } as any)}
                  />
                  <div className="upload-icon-container">
                    <Upload size={32} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      Drop invoices or folder here
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      JPG, JPEG, PNG, WebP or PDF · multiple files supported
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose Files
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => folderInputRef.current?.click()}
                    >
                      Choose Folder
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={handleManualEntry}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <FileText size={16} />
                      Add Invoice Manually
                    </button>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '2rem' }}>
                  <div className="premium-card" style={{ padding: '1rem', background: 'transparent' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.1rem' }}>01</span>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Multiple files supported</p>
                  </div>
                  <div className="premium-card" style={{ padding: '1rem', background: 'transparent' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.1rem' }}>02</span>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Folder uploading allowed</p>
                  </div>
                  <div className="premium-card" style={{ padding: '1rem', background: 'transparent' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.1rem' }}>03</span>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Review before saving items</p>
                  </div>
                </div>
              </div>
            )}

            {/* Processing Stepper Loader Step */}
            {step === 'uploading' && (
              <div className="processing-container animate-fade-in">
                {file ? (
                  // Single file upload
                  <>
                    <div className="file-info-badge">
                      <File size={20} style={{ color: 'var(--primary)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{file.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                    </div>

                    <div className="stepper-list">
                      <div className="stepper-item completed">
                        <div className="stepper-left">
                          <div className="stepper-indicator">
                            <Check size={16} style={{ color: 'var(--success)' }} />
                          </div>
                          <span className="stepper-text">Upload complete</span>
                        </div>
                      </div>

                      <div className={`stepper-item ${procStep === 1 ? 'active' : 'completed'}`}>
                        <div className="stepper-left">
                          <div className="stepper-indicator">
                            {procStep === 1 ? (
                              <Loader2 size={16} className="animate-spin" style={{ color: 'var(--primary)', animation: 'spin 1.5s linear infinite' }} />
                            ) : (
                              <Check size={16} style={{ color: 'var(--success)' }} />
                            )}
                          </div>
                          <span className="stepper-text">Read invoice text</span>
                        </div>
                        {procStep === 1 && <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>In progress</span>}
                      </div>

                      <div className={`stepper-item ${procStep === 2 ? 'active' : ''}`}>
                        <div className="stepper-left">
                          <div className="stepper-indicator">
                            {procStep === 2 ? (
                              <Loader2 size={16} className="animate-spin" style={{ color: 'var(--primary)', animation: 'spin 1.5s linear infinite' }} />
                            ) : (
                              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--border-color)' }}></div>
                            )}
                          </div>
                          <span className="stepper-text">Extract invoice details</span>
                        </div>
                        {procStep === 2 && <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>In progress</span>}
                      </div>
                    </div>
                  </>
                ) : (
                  // Batch upload
                  <div style={{ textAlign: 'center', padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    <Loader2 size={48} className="animate-spin" style={{ color: 'var(--primary)', animation: 'spin 1.5s linear infinite' }} />
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        {savingBatch ? `Saving batch of ${batchBills.length} invoices` : `Processing batch of ${batchCount} files`}
                      </h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.5 }}>
                        {savingBatch 
                          ? 'Writing invoice records and products data to MongoDB. Please do not close the window.'
                          : 'Uploading documents and running OCR text extraction + AI analysis in parallel.'}
                      </p>
                    </div>
                  </div>
                )}

                {!savingBatch && (
                  <button className="btn btn-secondary" onClick={() => setStep('idle')} style={{ alignSelf: 'flex-start' }}>
                    Cancel processing
                  </button>
                )}
              </div>
            )}

            {/* Detailed Extraction Form Review Step */}
            {step === 'review' && extractedData && (
              <ExtractionReview 
                initialData={extractedData} 
                fileName={file?.name || 'Manual Entry'}
                onSave={handleReviewSave}
                onCancel={() => setStep('idle')}
              />
            )}

            {/* Batch / Folder Review Step */}
            {step === 'batch_review' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '1rem 1.5rem', background: 'var(--bg-app)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Review extracted invoices ({batchBills.length} files)</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      Please select categories for each bill. You can edit line items or details before saving.
                    </p>
                  </div>
                  <span className="badge badge-warning" style={{ textTransform: 'none' }}>Verification Required</span>
                </div>

                <div style={{ overflowX: 'auto', maxHeight: '340px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
                  <table className="premium-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Filename</th>
                        <th>Supplier / Invoice No</th>
                        <th>Invoice Date</th>
                        <th>Total Value</th>
                        <th style={{ width: '220px' }}>Category</th>
                        <th style={{ textAlign: 'right', width: '120px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchBills.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                            <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }} title={item.filename}>
                              {item.filename}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.bill_data.dealer_name}</span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{item.bill_data.invoice_no}</div>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{item.bill_data.date}</td>
                          <td style={{ fontWeight: 700 }}>{formatCurrency(item.bill_data.total)}</td>
                          <td>
                            <select 
                              value={item.bill_data.category} 
                              onChange={(e) => handleBatchCategoryChange(idx, e.target.value)}
                              className="input-field"
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem', height: 'auto', minHeight: 'unset' }}
                            >
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="btn btn-secondary" 
                              onClick={() => setReviewIndex(idx)}
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}
                            >
                              <Edit size={12} />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button className="btn btn-secondary" onClick={() => setStep('idle')} style={{ flex: 1 }}>
                    Cancel Upload
                  </button>
                  <button className="btn btn-primary" onClick={handleSaveAllBatch} style={{ flex: 1.5, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                    <Check size={18} />
                    <span>Confirm & Save All ({batchBills.length} Invoices)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Batch / Folder Upload Summary Step */}
            {step === 'batch_result' && batchSummary && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '1.5rem', background: 'var(--bg-app)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Batch Processing Summary</h4>
                    <span className="badge badge-success" style={{ textTransform: 'none', backgroundColor: 'var(--success-glow)', color: 'var(--success)', border: '1px solid var(--success)' }}>
                      {batchSummary.successCount} / {batchSummary.total} Succeeded
                    </span>
                  </div>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                    Processed {batchSummary.total} invoices. Successfully saved {batchSummary.successCount} records.
                  </p>
                </div>

                {batchSummary.savedList.length > 0 && (
                  <div>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Saved Invoices</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                      {batchSummary.savedList.map((item, idx) => (
                        <div key={idx} className="premium-card" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.filename}</span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Invoice #{item.invoice_no}</div>
                          </div>
                          <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.95rem' }}>
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {batchSummary.errorList.length > 0 && (
                  <div>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Failures & Errors</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                      {batchSummary.errorList.map((item, idx) => (
                        <div key={idx} className="premium-card" style={{ padding: '0.75rem 1rem', borderLeft: '3px solid var(--danger)' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.filename}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.15rem' }}>{item.error}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button className="btn btn-secondary" onClick={() => setStep('idle')} style={{ flex: 1 }}>
                    Upload More
                  </button>
                  <button className="btn btn-primary" onClick={() => setUploadModalOpen(false)} style={{ flex: 1 }}>
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* Error Fallback Step */}
            {step === 'error' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
                <AlertCircle size={48} style={{ color: 'var(--danger)' }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Failed to parse document</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{errorMsg}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1rem' }}>
                  <button className="btn btn-secondary" onClick={() => setStep('idle')} style={{ flex: 1 }}>
                    Try Again
                  </button>
                  <button className="btn btn-primary" onClick={() => setUploadModalOpen(false)} style={{ flex: 1 }}>
                    Close Window
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UploadModal;
