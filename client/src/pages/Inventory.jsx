import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { getProducts, deleteProduct as apiDeleteProduct } from '../services/api';
import toast from 'react-hot-toast';
import { MdEdit, MdDelete, MdSearch, MdAdd, MdInventory } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const getStockBadge = (qty, threshold) => {
    if (qty === 0) return <span className="badge-red">Out of Stock</span>;
    if (qty <= threshold) return <span className="badge-yellow">Low Stock</span>;
    return <span className="badge-green">In Stock</span>;
};

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [sortCol, setSortCol] = useState('createdAt');
    const [sortDir, setSortDir] = useState('desc');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const PER_PAGE = 10;

    const load = async () => {
        setLoading(true);
        try {
            const res = await getProducts();
            setProducts(res.data);
            setFiltered(res.data);
        } catch { toast.error('Failed to load products'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    useEffect(() => {
        let arr = [...products];
        if (search) {
            const q = search.toLowerCase();
            arr = arr.filter(p =>
                p.productName.toLowerCase().includes(q) ||
                p.companyName.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                (p.sku || '').toLowerCase().includes(q)
            );
        }
        arr.sort((a, b) => {
            const av = a[sortCol]; const bv = b[sortCol];
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        setFiltered(arr);
        setPage(1);
    }, [search, products, sortCol, sortDir]);

    const handleSort = (col) => {
        if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortCol(col); setSortDir('asc'); }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete "${name}"?`)) return;
        try {
            await apiDeleteProduct(id);
            toast.success('Product deleted');
            load();
        } catch { toast.error('Failed to delete'); }
    };

    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const totalPages = Math.ceil(filtered.length / PER_PAGE);

    const SortIcon = ({ col }) => (
        <span className="ml-1 text-xs text-slate-500">
            {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
    );

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><MdInventory className="text-primary-400" /> Inventory</h2>
                        <p className="text-slate-400 mt-1">{filtered.length} products found</p>
                    </div>
                    <button onClick={() => navigate('/add-product')} className="btn-primary flex items-center gap-2">
                        <MdAdd className="text-lg" /> Add Product
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-6 max-w-md">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl" />
                    <input
                        className="form-input pl-10"
                        placeholder="Search by name, company, SKU or category..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Table */}
                <div className="glass-card overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : paginated.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <MdInventory className="text-6xl mx-auto mb-3 text-slate-700" />
                            <p className="font-medium">No products found</p>
                            <p className="text-sm mt-1">Add your first product to get started</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-900/50">
                                        {[
                                            { label: 'SKU', col: 'sku' },
                                            { label: 'Product Name', col: 'productName' },
                                            { label: 'Company', col: 'companyName' },
                                            { label: 'Category', col: 'category' },
                                            { label: 'Qty', col: 'quantity' },
                                            { label: 'Price (₹)', col: 'sellingPrice' },
                                            { label: 'Expiry', col: 'expiryDate' },
                                            { label: 'Status', col: null },
                                            { label: 'Actions', col: null }
                                        ].map(({ label, col }) => (
                                            <th
                                                key={label}
                                                className={`px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide ${col ? 'cursor-pointer hover:text-white select-none' : ''}`}
                                                onClick={() => col && handleSort(col)}
                                            >
                                                {label}{col && <SortIcon col={col} />}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {paginated.map(p => (
                                        <tr key={p._id} className={`table-row-hover ${p.quantity === 0 ? 'bg-red-900/10' : p.quantity <= p.lowStockThreshold ? 'bg-amber-900/10' : ''}`}>
                                            <td className="px-4 py-3 text-xs text-slate-400 font-mono">{p.sku || '-'}</td>
                                            <td className="px-4 py-3 font-medium text-white">{p.productName}</td>
                                            <td className="px-4 py-3 text-slate-300">{p.companyName}</td>
                                            <td className="px-4 py-3">
                                                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-lg text-xs">{p.category}</span>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-white">{p.quantity}</td>
                                            <td className="px-4 py-3 text-emerald-400 font-medium">₹{p.sellingPrice}</td>
                                            <td className="px-4 py-3 text-slate-400 text-sm">
                                                {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('en-IN') : '-'}
                                            </td>
                                            <td className="px-4 py-3">{getStockBadge(p.quantity, p.lowStockThreshold)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button onClick={() => navigate(`/edit-product/${p._id}`)} className="p-2 rounded-lg bg-primary-600/20 hover:bg-primary-600 text-primary-400 hover:text-white transition-all" title="Edit">
                                                        <MdEdit className="text-lg" />
                                                    </button>
                                                    <button onClick={() => handleDelete(p._id, p.productName)} className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white transition-all" title="Delete">
                                                        <MdDelete className="text-lg" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-slate-400">Page {page} of {totalPages}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40">← Prev</button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40">Next →</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Inventory;
