// src/pages/CategoriesPage.tsx
import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { Plus, Edit3, Trash2, X, Check, RefreshCw } from 'lucide-react';

const CategoriesPage: React.FC = () => {
  const { categories, refreshCategories, addNotification } = useApp();
  
  // Local inputs
  const [newCatName, setNewCatName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      await api.createCategory(newCatName);
      setNewCatName('');
      setIsAdding(false);
      await refreshCategories();
      addNotification(`Category '${newCatName}' created.`, 'ready');
    } catch (err: any) {
      setError(err.message || 'Failed to create category.');
    } finally {
      setLoading(false);
    }
  };

  const handleRenameSubmit = async (id: string) => {
    if (!editingName.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      await api.updateCategory(id, editingName);
      setEditingId(null);
      await refreshCategories();
      addNotification(`Category renamed to '${editingName}'.`, 'ready');
    } catch (err: any) {
      setError(err.message || 'Failed to rename category.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirm = window.confirm(`Are you sure you want to delete '${name}'? All products and bills with this category will be reset to empty.`);
    if (!confirm) return;

    setLoading(true);
    try {
      await api.deleteCategory(id);
      await refreshCategories();
      addNotification(`Category '${name}' deleted successfully.`, 'ready');
    } catch (err: any) {
      alert(err.message || 'Failed to delete category.');
    } finally {
      setLoading(false);
    }
  };

  // Hardcode product/invoices count mocks for seeded default visual representations
  const getCategoryMocks = (name: string) => {
    switch (name) {
      case 'Paint':
        return { products: 18, invoices: 42, date: '10 Apr 2026' };
      case 'Building Materials':
        return { products: 22, invoices: 68, date: '08 Apr 2026' };
      case 'Hardware':
        return { products: 16, invoices: 35, date: '04 Apr 2026' };
      case 'Electrical':
        return { products: 18, invoices: 41, date: '03 Apr 2026' };
      default:
        return { products: 0, invoices: 0, date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) };
    }
  };

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3>{categories.length} Purchase Categories</h3>
        {!isAdding && (
          <button className="btn btn-primary" onClick={() => setIsAdding(true)} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <Plus size={18} />
            <span>Add Category</span>
          </button>
        )}
      </div>

      {error && (
        <div className="badge badge-danger" style={{ display: 'block', padding: '0.75rem', marginBottom: '1.25rem', borderRadius: '6px', textTransform: 'none' }}>
          {error}
        </div>
      )}

      {/* Add category inline collapse */}
      {isAdding && (
        <form onSubmit={handleAddSubmit} className="premium-card animate-slide-up" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', background: 'hsla(263, 70%, 55%, 0.03)' }}>
          <div className="form-group" style={{ flexGrow: 1, marginBottom: 0 }}>
            <label className="form-label">Category Name</label>
            <input
              type="text"
              placeholder="e.g. Plumbing, Hand Tools"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <RefreshCw size={18} className="animate-spin" /> : 'Create'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAdding(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Categories List table */}
      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Tracked Products</th>
                <th>Invoices Count</th>
                <th>Last Modified</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const mocks = getCategoryMocks(cat.name);
                const isEditing = editingId === cat.id;
                return (
                  <tr key={cat.id}>
                    <td>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="input-field"
                            style={{ padding: '0.4rem 0.75rem', maxWidth: '200px' }}
                            required
                          />
                          <button 
                            className="btn btn-primary" 
                            onClick={() => handleRenameSubmit(cat.id)}
                            style={{ padding: '0.4rem 0.6rem' }}
                            title="Save Rename"
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => setEditingId(null)}
                            style={{ padding: '0.4rem 0.6rem' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontWeight: 600 }}>{cat.name}</span>
                      )}
                    </td>
                    <td>{mocks.products} products</td>
                    <td>{mocks.invoices} invoices</td>
                    <td style={{ fontSize: '0.9rem' }}>{mocks.date}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.75rem' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setEditingId(cat.id);
                            setEditingName(cat.name);
                          }}
                          style={{ padding: '0.4rem 0.6rem', border: 'none' }}
                          title="Rename Category"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleDelete(cat.id, cat.name)}
                          style={{ padding: '0.4rem 0.6rem', border: 'none', color: 'var(--danger)' }}
                          title="Delete Category"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
