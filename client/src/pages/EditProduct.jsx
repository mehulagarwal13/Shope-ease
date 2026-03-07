import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getProducts, updateProduct } from '../services/api';
import toast from 'react-hot-toast';
import { MdEdit } from 'react-icons/md';

const CATEGORIES = ['Electronics', 'FMCG', 'Pharma', 'Clothing', 'Grocery', 'Other'];
const GST_OPTIONS = [0, 5, 12, 18, 28];

const EditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [form, setForm] = useState({
        productName: '', companyName: '', category: 'FMCG',
        sku: '', quantity: '', pricePerUnit: '',
        sellingPrice: '', gstPercent: '0', expiryDate: '', lowStockThreshold: '10'
    });

    useEffect(() => {
        const load = async () => {
            try {
                const res = await getProducts();
                const product = res.data.find(p => p._id === id);
                if (!product) { toast.error('Product not found'); navigate('/inventory'); return; }
                setForm({
                    productName: product.productName,
                    companyName: product.companyName,
                    category: product.category,
                    sku: product.sku || '',
                    quantity: String(product.quantity),
                    pricePerUnit: String(product.pricePerUnit),
                    sellingPrice: String(product.sellingPrice),
                    gstPercent: String(product.gstPercent ?? 0),
                    expiryDate: product.expiryDate ? product.expiryDate.substring(0, 10) : '',
                    lowStockThreshold: String(product.lowStockThreshold ?? 10)
                });
            } catch { toast.error('Failed to load product'); }
            finally { setFetching(false); }
        };
        load();
    }, [id, navigate]);

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateProduct(id, {
                ...form,
                quantity: Number(form.quantity),
                pricePerUnit: Number(form.pricePerUnit),
                sellingPrice: Number(form.sellingPrice),
                gstPercent: Number(form.gstPercent),
                lowStockThreshold: Number(form.lowStockThreshold)
            });
            toast.success('Product updated! ✅');
            navigate('/inventory');
        } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
        finally { setLoading(false); }
    };

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><MdEdit className="text-primary-400" /> Edit Product</h2>
                        <p className="text-slate-400 mt-1">Update product information</p>
                    </div>

                    {fetching ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="glass-card p-8">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="form-label">Product Name *</label>
                                        <input className="form-input" name="productName" value={form.productName} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label className="form-label">Company Name *</label>
                                        <input className="form-input" name="companyName" value={form.companyName} onChange={handleChange} />
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
                                        <input className="form-input" name="sku" value={form.sku} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="form-label">Quantity *</label>
                                        <input className="form-input" type="number" min="0" name="quantity" value={form.quantity} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label className="form-label">Purchase Price (₹) *</label>
                                        <input className="form-input" type="number" min="0" step="0.01" name="pricePerUnit" value={form.pricePerUnit} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label className="form-label">Selling Price (₹) *</label>
                                        <input className="form-input" type="number" min="0" step="0.01" name="sellingPrice" value={form.sellingPrice} onChange={handleChange} />
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
                                        <input className="form-input" type="number" min="0" name="lowStockThreshold" value={form.lowStockThreshold} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
                                        {loading ? 'Saving...' : '✓ Save Changes'}
                                    </button>
                                    <button type="button" onClick={() => navigate('/inventory')} className="btn-ghost px-6">Cancel</button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default EditProduct;
