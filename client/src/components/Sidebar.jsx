import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    MdDashboard, MdInventory, MdAddBox, MdReceipt, MdHistory, MdLogout, MdStorefront
} from 'react-icons/md';

const navItems = [
    { to: '/dashboard', icon: MdDashboard, label: 'Dashboard' },
    { to: '/inventory', icon: MdInventory, label: 'Inventory' },
    { to: '/add-product', icon: MdAddBox, label: 'Add Product' },
    { to: '/create-bill', icon: MdReceipt, label: 'Create Bill' },
    { to: '/bill-history', icon: MdHistory, label: 'Bill History' }
];

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="w-64 min-h-screen bg-slate-900/95 border-r border-slate-800 flex flex-col fixed left-0 top-0 z-30 shadow-2xl">
            {/* Logo */}
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-900/50">
                        <MdStorefront className="text-white text-xl" />
                    </div>
                    <div>
                        <h1 className="font-bold text-white text-base leading-tight">ShopEase</h1>
                        <p className="text-xs text-slate-500 truncate max-w-[130px]">{user?.shopName || 'My Shop'}</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                        <Icon className="text-xl flex-shrink-0" />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* User Info & Logout */}
            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-slate-800/60">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-sm font-bold text-white">
                        {(user?.ownerName || user?.shopName || 'U')[0].toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{user?.ownerName || 'Owner'}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20">
                    <MdLogout className="text-xl" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
