import { useEffect, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { getBills, deleteBill } from '../services/api';
import toast from 'react-hot-toast';
import { MdHistory, MdSearch, MdClose, MdDownload, MdPrint, MdReceipt, MdDelete } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const BillHistory = () => {
    const { user } = useAuth();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedBill, setSelectedBill] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const billRef = useRef();

    const load = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            const res = await getBills(params);
            setBills(res.data);
        } catch { toast.error('Failed to load bills'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleSearch = (e) => { e.preventDefault(); load(); };

    const handleDownloadPDF = async () => {
        if (!billRef.current) return;
        const canvas = await html2canvas(billRef.current, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${selectedBill?.billNumber || 'Bill'}.pdf`);
        toast.success('PDF downloaded!');
    };

    const paymentBadge = (mode) => {
        const colors = { Cash: 'badge-green', UPI: 'bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full text-xs font-semibold', Card: 'bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full text-xs font-semibold', Credit: 'badge-yellow' };
        return <span className={colors[mode] || 'badge-green'}>{mode}</span>;
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this bill? This will restore the stock for all items in this bill.')) return;
        setDeleting(true);
        try {
            await deleteBill(id);
            toast.success('Bill deleted successfully');
            setSelectedBill(null);
            load();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete bill');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><MdHistory className="text-primary-400" /> Bill History</h2>
                        <p className="text-slate-400 mt-1">{bills.length} bills found</p>
                    </div>
                </div>

                {/* Filters */}
                <form onSubmit={handleSearch} className="glass-card p-4 mb-6">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-48">
                            <label className="form-label text-xs">Search Bill / Customer</label>
                            <div className="relative">
                                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg" />
                                <input className="form-input pl-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} placeholder="Bill No. or Customer Name" />
                            </div>
                        </div>
                        <div>
                            <label className="form-label text-xs">From Date</label>
                            <input className="form-input text-sm" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label text-xs">To Date</label>
                            <input className="form-input text-sm" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                        <button type="submit" className="btn-primary px-5 py-2.5 text-sm">Search</button>
                        <button type="button" className="btn-ghost text-sm" onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); setTimeout(load, 100); }}>Reset</button>
                    </div>
                </form>

                {/* Table */}
                <div className="glass-card overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : bills.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <MdReceipt className="text-6xl mx-auto mb-3 text-slate-700" />
                            <p className="font-medium">No bills found</p>
                            <p className="text-sm mt-1">Bills you generate will appear here</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-900/50">
                                        {['Bill No.', 'Customer', 'Items', 'Subtotal', 'GST', 'Discount', 'Grand Total', 'Payment', 'Date', ''].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {bills.map(b => (
                                        <tr key={b._id} className="table-row-hover cursor-pointer" onClick={() => setSelectedBill(b)}>
                                            <td className="px-4 py-3 font-semibold text-primary-400 font-mono">{b.billNumber}</td>
                                            <td className="px-4 py-3 text-slate-300">{b.customerName || <span className="text-slate-600 italic">Walk-in</span>}</td>
                                            <td className="px-4 py-3 text-white font-medium">{b.items.length} items</td>
                                            <td className="px-4 py-3 text-slate-300 text-sm">₹{b.subtotalAmount.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-slate-400 text-sm">₹{b.gstAmount.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-slate-400 text-sm">{b.discountAmount > 0 ? `-₹${b.discountAmount.toFixed(2)}` : '-'}</td>
                                            <td className="px-4 py-3 font-bold text-emerald-400">₹{b.grandTotal.toFixed(2)}</td>
                                            <td className="px-4 py-3">{paymentBadge(b.paymentMode)}</td>
                                            <td className="px-4 py-3 text-slate-400 text-sm whitespace-nowrap">{new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                            <td className="px-4 py-3">
                                                <button className="text-xs text-primary-400 hover:text-primary-300 underline" onClick={(e) => { e.stopPropagation(); setSelectedBill(b); }}>View</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Bill Preview Modal */}
                {selectedBill && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-800">
                            <div className="flex items-center justify-between p-4 border-b border-slate-800">
                                <h3 className="font-bold text-white">{selectedBill.billNumber}</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleDelete(selectedBill._id)}
                                        disabled={deleting}
                                        className="btn-ghost flex items-center gap-1 text-sm px-3 py-1.5 text-red-500 hover:bg-red-500/10"
                                    >
                                        <MdDelete /> {deleting ? 'Deleting...' : 'Delete'}
                                    </button>
                                    <button onClick={handleDownloadPDF} className="btn-ghost flex items-center gap-1 text-sm px-3 py-1.5">
                                        <MdDownload /> PDF
                                    </button>
                                    <button onClick={() => window.print()} className="btn-ghost flex items-center gap-1 text-sm px-3 py-1.5">
                                        <MdPrint /> Print
                                    </button>
                                    <button onClick={() => setSelectedBill(null)} className="p-1.5 text-slate-400 hover:text-white">
                                        <MdClose className="text-xl" />
                                    </button>
                                </div>
                            </div>

                            <div ref={billRef} className="p-6 bg-white text-gray-900 font-mono text-sm">
                                <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
                                    <h1 className="text-2xl font-bold">{user?.shopName || 'ShopEase'}</h1>
                                    {user?.address && <p className="text-xs mt-0.5">{user.address}</p>}
                                    <p className="text-xs">{user?.gstNumber && `GST: ${user.gstNumber}`}</p>
                                </div>

                                <div className="flex justify-between text-xs mb-3">
                                    <div>
                                        <p><strong>Bill No:</strong> {selectedBill.billNumber}</p>
                                        <p><strong>Date:</strong> {new Date(selectedBill.createdAt).toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="text-right">
                                        {selectedBill.customerName && <p><strong>Customer:</strong> {selectedBill.customerName}</p>}
                                        {selectedBill.customerPhone && <p><strong>Phone:</strong> {selectedBill.customerPhone}</p>}
                                        <p><strong>Payment:</strong> {selectedBill.paymentMode}</p>
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
                                        {selectedBill.items.map((item, i) => (
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
                                    <p>Subtotal: ₹{selectedBill.subtotalAmount.toFixed(2)}</p>
                                    {selectedBill.gstAmount > 0 && <p>GST: ₹{selectedBill.gstAmount.toFixed(2)}</p>}
                                    {selectedBill.discountAmount > 0 && <p>Discount: -₹{selectedBill.discountAmount.toFixed(2)}</p>}
                                    <p className="text-lg font-bold border-t border-gray-400 pt-1 mt-1">GRAND TOTAL: ₹{selectedBill.grandTotal.toFixed(2)}</p>
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

export default BillHistory;
