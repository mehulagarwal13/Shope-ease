import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getProducts, getLowStockProducts, getTodayStats } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
    MdInventory, MdWarning, MdReceipt, MdAttachMoney, MdArrowForward, MdTrendingUp
} from 'react-icons/md';
import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, sub, color, to }) => (
    <Link to={to || '#'} className={`glass-card p-6 flex items-start gap-4 hover:scale-[1.02] transition-transform cursor-pointer group`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
            <Icon className="text-2xl text-white" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-sm">{label}</p>
            <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
        <MdArrowForward className="text-slate-600 group-hover:text-primary-400 transition-colors mt-1" />
    </Link>
);

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [stats, setStats] = useState({ totalBillsToday: 0, totalRevenueToday: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [prodRes, lowRes, statRes] = await Promise.all([
                    getProducts(),
                    getLowStockProducts(),
                    getTodayStats()
                ]);
                setProducts(prodRes.data);
                setLowStock(lowRes.data);
                setStats(statRes.data);
            } catch {
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // Top 5 products by quantity sold (for chart — use current stock as a placeholder)
    const chartData = products
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
        .map(p => ({ name: p.productName.substring(0, 15), stock: p.quantity }));

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white">
                        Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.ownerName?.split(' ')[0] || 'there'} 👋
                    </h2>
                    <p className="text-slate-400 mt-1">Here's what's happening at <span className="text-primary-400 font-semibold">{user?.shopName}</span> today</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                            <StatCard icon={MdInventory} label="Total Products" value={products.length} sub="In inventory" color="bg-gradient-to-br from-primary-600 to-primary-700" to="/inventory" />
                            <StatCard icon={MdWarning} label="Low Stock Items" value={lowStock.length} sub="Need restocking" color="bg-gradient-to-br from-amber-500 to-orange-600" to="/inventory" />
                            <StatCard icon={MdReceipt} label="Bills Today" value={stats.totalBillsToday} sub="Generated today" color="bg-gradient-to-br from-emerald-500 to-teal-600" to="/bill-history" />
                            <StatCard icon={MdAttachMoney} label="Revenue Today" value={`₹${stats.totalRevenueToday.toFixed(2)}`} sub="Total earnings" color="bg-gradient-to-br from-violet-500 to-purple-700" to="/bill-history" />
                        </div>

                        {/* Low Stock Alert */}
                        {lowStock.length > 0 && (
                            <div className="glass-card p-6 mb-8 border-amber-500/30">
                                <div className="flex items-center gap-2 mb-4">
                                    <MdWarning className="text-amber-400 text-2xl" />
                                    <h3 className="font-semibold text-amber-400">Low Stock Alerts ({lowStock.length} items)</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                                    {lowStock.slice(0, 6).map(p => (
                                        <div key={p._id} className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-2.5">
                                            <div>
                                                <p className="text-sm font-medium text-slate-200">{p.productName}</p>
                                                <p className="text-xs text-slate-500">{p.companyName} · {p.category}</p>
                                            </div>
                                            <span className={`font-bold text-sm ml-3 ${p.quantity === 0 ? 'text-red-400' : 'text-amber-400'}`}>
                                                {p.quantity === 0 ? 'Out' : `${p.quantity} left`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {lowStock.length > 6 && (
                                    <button onClick={() => navigate('/inventory')} className="text-xs text-primary-400 mt-3 hover:underline">
                                        View all {lowStock.length} low stock items →
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Chart */}
                        {chartData.length > 0 && (
                            <div className="glass-card p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <MdTrendingUp className="text-primary-400 text-xl" />
                                    <h3 className="font-semibold text-white">Top Products by Stock Level</h3>
                                </div>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#f1f5f9' }}
                                            cursor={{ fill: 'rgba(99,102,241,0.1)' }}
                                        />
                                        <Bar dataKey="stock" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                                        <defs>
                                            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6366f1" />
                                                <stop offset="100%" stopColor="#8b5cf6" />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Quick actions */}
                        <div className="mt-8 flex gap-4 flex-wrap">
                            <button onClick={() => navigate('/add-product')} className="btn-primary flex items-center gap-2">
                                <MdInventory /> Add New Product
                            </button>
                            <button onClick={() => navigate('/create-bill')} className="btn-ghost flex items-center gap-2">
                                <MdReceipt /> Create Bill
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
