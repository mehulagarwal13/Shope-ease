import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MdStorefront, MdVisibility, MdVisibilityOff } from 'react-icons/md';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) { toast.error('Please enter email and password'); return; }
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back! 👋');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-primary-900/60">
                        <MdStorefront className="text-white text-3xl" />
                    </div>
                    <h1 className="text-3xl font-bold text-gradient">ShopEase</h1>
                    <p className="text-slate-500 mt-1">Sign in to your shop</p>
                </div>

                <div className="glass-card p-8">
                    {/* Demo hint */}
                    <div className="bg-primary-900/30 border border-primary-700/40 rounded-xl p-3 mb-6 text-center">
                        <p className="text-xs text-primary-300 font-medium">🎮 Demo Account</p>
                        <p className="text-xs text-slate-400 mt-0.5">demo@shopease.com / demo1234</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="form-label">Email</label>
                            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="shop@example.com" autoFocus />
                        </div>
                        <div>
                            <label className="form-label">Password</label>
                            <div className="relative">
                                <input className="form-input pr-10" type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200" onClick={() => setShowPwd(!showPwd)}>
                                    {showPwd ? <MdVisibilityOff /> : <MdVisibility />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 mt-4 text-sm">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-medium">Sign Up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
