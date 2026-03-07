import { useEffect, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { getProducts, createBill } from '../services/api';
import toast from 'react-hot-toast';
import { MdSearch, MdAdd, MdDelete, MdReceipt, MdClose, MdPrint, MdDownload } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Credit'];

const CreateBill = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [cart, setCart] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [discount, setDiscount] = useState('');
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [loading, setLoading] = useState(false);
    const [bill, setBill] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const billRef = useRef();

    useEffect(() => {
        getProducts().then(r => setProducts(r.data)).catch(() => toast.error('Failed to load products'));
    }, []);

    useEffect(() => {
        if (!search.trim()) { setSuggestions([]); return; }
        const q = search.toLowerCase();
        setSuggestions(
            products.filter(p =>
                (p.productName.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)) &&
                p.quantity > 0
            ).slice(0, 6)
        );
    }, [search, products]);

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(i => i.productId === product._id);
            if (existing) {
                if (existing.qty >= product.quantity) { toast.error(`Only ${product.quantity} units available`); return prev; }
                return prev.map(i => i.productId === product._id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, {
                productId: product._id, productName: product.productName, companyName: product.companyName,
                unitPrice: product.sellingPrice, qty: 1, maxQty: product.quantity, gstPercent: product.gstPercent || 0
            }];
        });
        setSearch('');
        setSuggestions([]);
    };

    const updateQty = (productId, val) => {
        const num = parseInt(val) || 1;
        setCart(prev => prev.map(i => {
            if (i.productId !== productId) return i;
            if (num > i.maxQty) { toast.error(`Only ${i.maxQty} units available`); return i; }
            return { ...i, qty: Math.max(1, num) };
        }));
    };

    const removeFromCart = (productId) => setCart(prev => prev.filter(i => i.productId !== productId));

    const subtotal = cart.reduce((s, i) => s + (i.unitPrice * i.qty), 0);
    const gstAmount = cart.reduce((s, i) => s + ((i.unitPrice * i.qty * i.gstPercent) / 100), 0);
    const discountAmt = Number(discount) || 0;
    const grandTotal = subtotal + gstAmount - discountAmt;

    const handleGenerateBill = async () => {
        if (cart.length === 0) { toast.error('Add at least one item to the cart'); return; }
        if (grandTotal < 0) { toast.error('Grand total cannot be negative'); return; }
        setLoading(true);
        try {
            const res = await createBill({
                customerName, customerPhone,
                items: cart.map(i => ({ productId: i.productId, productName: i.productName, quantity: i.qty, unitPrice: i.unitPrice })),
                discountAmount: discountAmt, paymentMode
            });
            setBill(res.data);
            setShowPreview(true);
            setCart([]);
            setCustomerName('');
            setCustomerPhone('');
            setDiscount('');
            toast.success(`Bill ${res.data.billNumber} generated! 🎉`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create bill');
        } finally { setLoading(false); }
    };

    const handleDownloadPDF = async () => {
        const element = billRef.current;
        const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${bill?.billNumber || 'Bill'}.pdf`);
        toast.success('PDF downloaded!');
    };

    const handlePrint = () => window.print();

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2"><MdReceipt className="text-primary-400" /> Create Bill</h2>
                    <p className="text-slate-400 mt-1 text-sm">Point of Sale — search & add products to generate a bill</p>
                </div>

                <div className="flex gap-6 h-full">
                    {/* LEFT: Search + Cart */}
                    <div className="flex-1 space-y-4">
                        {/* Search */}
                        <div className="glass-card p-4 relative z-50">
                            <div className="relative">
                                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl z-10" />
                                <input
                                    className="form-input pl-10"
                                    placeholder="Search product by name or SKU..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                                {suggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 z-[100] bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                                        {suggestions.map(p => (
                                            <button key={p._id} onClick={() => addToCart(p)}
                                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700 transition-colors text-left border-b border-slate-700/50 last:border-0">
                                                <div>
                                                    <p className="font-medium text-white text-sm">{p.productName}</p>
                                                    <p className="text-xs text-slate-400">{p.companyName} · {p.sku}</p>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <p className="text-emerald-400 font-semibold text-sm">₹{p.sellingPrice}</p>
                                                    <p className="text-xs text-slate-500">{p.quantity} in stock</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cart Table */}
                        <div className="glass-card overflow-hidden relative z-0">
                            {cart.length === 0 ? (
                                <div className="text-center py-16 text-slate-500">
                                    <MdReceipt className="text-6xl mx-auto mb-3 text-slate-700" />
                                    <p>No items in cart yet</p>
                                    <p className="text-sm mt-1">Search and click a product to add it</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-800 bg-slate-900/50">
                                                {['Product', 'Company', 'Qty', 'Unit Price', 'GST%', 'Subtotal', ''].map(h => (
                                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60">
                                            {cart.map(item => (
                                                <tr key={item.productId} className="table-row-hover">
                                                    <td className="px-4 py-3 font-medium text-white text-sm">{item.productName}</td>
                                                    <td className="px-4 py-3 text-slate-400 text-sm">{item.companyName}</td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number" min="1" max={item.maxQty} value={item.qty}
                                                            onChange={e => updateQty(item.productId, e.target.value)}
                                                            className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-center text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-300 text-sm">₹{item.unitPrice}</td>
                                                    <td className="px-4 py-3 text-slate-400 text-sm">{item.gstPercent}%</td>
                                                    <td className="px-4 py-3 font-semibold text-emerald-400">₹{(item.unitPrice * item.qty).toFixed(2)}</td>
                                                    <td className="px-4 py-3">
                                                        <button onClick={() => removeFromCart(item.productId)}
                                                            className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white transition-all">
                                                            <MdDelete />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Bill Summary */}
                    <div className="w-80 space-y-4">
                        <div className="glass-card p-5 space-y-4">
                            <h3 className="font-bold text-white text-lg border-b border-slate-800 pb-3">Bill Summary</h3>

                            <div>
                                <label className="form-label">Customer Name</label>
                                <input className="form-input" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Optional" />
                            </div>
                            <div>
                                <label className="form-label">Customer Phone</label>
                                <input className="form-input" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Optional" maxLength={10} />
                            </div>
                            <div>
                                <label className="form-label">Payment Mode</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {PAYMENT_MODES.map(m => (
                                        <button key={m} type="button"
                                            onClick={() => setPaymentMode(m)}
                                            className={`py-2 rounded-xl text-sm font-medium border transition-all ${paymentMode === m ? 'bg-primary-600 border-primary-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="space-y-2 border-t border-slate-800 pt-4">
                                <div className="flex justify-between text-sm text-slate-400">
                                    <span>Subtotal</span><span className="text-white">₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-400">
                                    <span>GST</span><span className="text-white">₹{gstAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-slate-400">
                                    <span>Discount (₹)</span>
                                    <input
                                        type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0"
                                        className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                                    />
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t border-slate-700 pt-3 mt-2">
                                    <span className="text-white">Grand Total</span>
                                    <span className="text-gradient">₹{Math.max(0, grandTotal).toFixed(2)}</span>
                                </div>
                            </div>

                            <button onClick={handleGenerateBill} disabled={loading || cart.length === 0}
                                className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
                                {loading ? 'Generating...' : <><MdReceipt className="text-lg" /> Generate Bill</>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bill Preview Modal */}
                {showPreview && bill && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-800">
                            <div className="flex items-center justify-between p-4 border-b border-slate-800 no-print">
                                <h3 className="font-bold text-white">Bill Preview</h3>
                                <div className="flex items-center gap-2">
                                    <button onClick={handleDownloadPDF} className="btn-ghost flex items-center gap-1 text-sm px-3 py-1.5">
                                        <MdDownload /> PDF
                                    </button>
                                    <button onClick={handlePrint} className="btn-ghost flex items-center gap-1 text-sm px-3 py-1.5">
                                        <MdPrint /> Print
                                    </button>
                                    <button onClick={() => setShowPreview(false)} className="p-1.5 text-slate-400 hover:text-white">
                                        <MdClose className="text-xl" />
                                    </button>
                                </div>
                            </div>

                            {/* Printable Bill */}
                            <div ref={billRef} className="p-6 bg-white text-gray-900 font-mono text-sm print-bill">
                                <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
                                    <h1 className="text-2xl font-bold">{user?.shopName || 'ShopEase'}</h1>
                                    {user?.address && <p className="text-xs mt-0.5">{user.address}</p>}
                                    <p className="text-xs">{user?.phone && `📞 ${user.phone}`} {user?.gstNumber && `| GST: ${user.gstNumber}`}</p>
                                </div>

                                <div className="flex justify-between text-xs mb-3">
                                    <div>
                                        <p><strong>Bill No:</strong> {bill.billNumber}</p>
                                        <p><strong>Date:</strong> {new Date(bill.createdAt).toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="text-right">
                                        {bill.customerName && <p><strong>Customer:</strong> {bill.customerName}</p>}
                                        {bill.customerPhone && <p><strong>Phone:</strong> {bill.customerPhone}</p>}
                                        <p><strong>Payment:</strong> {bill.paymentMode}</p>
                                    </div>
                                </div>

                                <table className="w-full border-collapse text-xs mb-3">
                                    <thead>
                                        <tr className="border-y border-gray-400">
                                            <th className="py-1 text-left">#</th>
                                            <th className="py-1 text-left">Item</th>
                                            <th className="py-1 text-left">Company</th>
                                            <th className="py-1 text-right">Qty</th>
                                            <th className="py-1 text-right">Price</th>
                                            <th className="py-1 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bill.items.map((item, i) => (
                                            <tr key={i} className="border-b border-gray-200">
                                                <td className="py-1">{i + 1}</td>
                                                <td className="py-1">{item.productName}</td>
                                                <td className="py-1 text-gray-500">{item.companyName}</td>
                                                <td className="py-1 text-right">{item.quantity}</td>
                                                <td className="py-1 text-right">₹{item.unitPrice}</td>
                                                <td className="py-1 text-right">₹{item.subtotal.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="text-right text-xs space-y-0.5 border-t border-gray-400 pt-2">
                                    <p>Subtotal: ₹{bill.subtotalAmount.toFixed(2)}</p>
                                    {bill.gstAmount > 0 && <p>GST: ₹{bill.gstAmount.toFixed(2)}</p>}
                                    {bill.discountAmount > 0 && <p>Discount: -₹{bill.discountAmount.toFixed(2)}</p>}
                                    <p className="text-lg font-bold border-t border-gray-400 pt-1 mt-1">GRAND TOTAL: ₹{bill.grandTotal.toFixed(2)}</p>
                                </div>

                                <div className="text-center mt-4 text-xs text-gray-500 border-t border-gray-300 pt-3">
                                    <p>Thank you for shopping with us! 🙏</p>
                                    <p>Powered by ShopEase</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CreateBill;
