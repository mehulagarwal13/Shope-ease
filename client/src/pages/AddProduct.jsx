import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { addProduct } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { MdAddBox, MdAutorenew } from 'react-icons/md';

const CATEGORIES = ['Electronics', 'FMCG', 'Pharma', 'Clothing', 'Grocery', 'Other'];
const GST_OPTIONS = [0, 5, 12, 18, 28];

const genSKU = () => `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

const AddProduct = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        productName: '', companyName: '', category: 'FMCG',
        sku: genSKU(), quantity: '', pricePerUnit: '',
        sellingPrice: '', gstPercent: '0', expiryDate: '', lowStockThreshold: '10'
    });

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.productName || !form.companyName || !form.quantity || !form.pricePerUnit || !form.sellingPrice) {
            toast.error('Please fill all required fields'); return;
        }
        if (Number(form.quantity) < 0 || Number(form.sellingPrice) < 0) {
            toast.error('Quantity and price must be positive'); return;
        }
        setLoading(true);
        try {
            await addProduct({ ...form, quantity: Number(form.quantity), pricePerUnit: Number(form.pricePerUnit), sellingPrice: Number(form.sellingPrice), gstPercent: Number(form.gstPercent), lowStockThreshold: Number(form.lowStockThreshold) });
            toast.success('Product added successfully! 🎉');
            navigate('/inventory');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to add product'); }
        finally { setLoading(false); }
    };

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><MdAddBox className="text-primary-400" /> Add New Product</h2>
                        <p className="text-slate-400 mt-1">Fill in the details to add a product to inventory</p>
                    </div>

                    <div className="glass-card p-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Product Name *</label>
                                    <input className="form-input" name="productName" value={form.productName} onChange={handleChange} placeholder="e.g. Paracetamol 500mg" />
                                </div>
                                <div>
                                    <label className="form-label">Company Name *</label>
                                    <input className="form-input" name="companyName" value={form.companyName} onChange={handleChange} placeholder="e.g. Sun Pharma" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Category *</label>
                                    <select className="form-input" name="category" value={form.category} onChange={handleChange}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">SKU</label>
                                    <div className="flex gap-2">
                                        <input className="form-input" name="sku" value={form.sku} onChange={handleChange} placeholder="Auto-generated" />
                                        <button type="button" onClick={() => setForm(f => ({ ...f, sku: genSKU() }))} className="btn-ghost px-3 flex-shrink-0" title="Regenerate">
                                            <MdAutorenew className="text-lg" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="form-label">Quantity *</label>
                                    <input className="form-input" type="number" min="0" name="quantity" value={form.quantity} onChange={handleChange} placeholder="0" />
                                </div>
                                <div>
                                    <label className="form-label">Purchase Price (₹) *</label>
                                    <input className="form-input" type="number" min="0" step="0.01" name="pricePerUnit" value={form.pricePerUnit} onChange={handleChange} placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="form-label">Selling Price (₹) *</label>
                                    <input className="form-input" type="number" min="0" step="0.01" name="sellingPrice" value={form.sellingPrice} onChange={handleChange} placeholder="0.00" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="form-label">GST %</label>
                                    <select className="form-input" name="gstPercent" value={form.gstPercent} onChange={handleChange}>
                                        {GST_OPTIONS.map(g => <option key={g} value={g}>{g}%</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Expiry Date</label>
                                    <input className="form-input" type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="form-label">Low Stock Threshold</label>
                                    <input className="form-input" type="number" min="0" name="lowStockThreshold" value={form.lowStockThreshold} onChange={handleChange} placeholder="10" />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
                                    {loading ? 'Saving...' : '✓ Add Product'}
                                </button>
                                <button type="button" onClick={() => navigate('/inventory')} className="btn-ghost px-6">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AddProduct;
