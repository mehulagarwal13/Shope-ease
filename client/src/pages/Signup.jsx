import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup as apiSignup } from '../services/api';
import toast from 'react-hot-toast';
import { MdStorefront, MdVisibility, MdVisibilityOff } from 'react-icons/md';

const Signup = () => {
    const [form, setForm] = useState({
        shopName: '', ownerName: '', email: '', phone: '', password: '', confirmPassword: '',
        address: '', gstNumber: ''
    });
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const validate = () => {
        if (!form.shopName || !form.ownerName || !form.email || !form.password) {
            toast.error('Please fill all required fields'); return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            toast.error('Enter a valid email address'); return false;
        }
        if (form.password.length < 8) {
            toast.error('Password must be at least 8 characters'); return false;
        }
        if (form.password !== form.confirmPassword) {
            toast.error('Passwords do not match'); return false;
        }
        if (form.phone && !/^\d{10}$/.test(form.phone)) {
            toast.error('Phone must be 10 digits'); return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            await apiSignup({ shopName: form.shopName, ownerName: form.ownerName, email: form.email, phone: form.phone, password: form.password, address: form.address, gstNumber: form.gstNumber });
            toast.success('Account created! Please login.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-lg relative">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-primary-900/60">
                        <MdStorefront className="text-white text-3xl" />
                    </div>
                    <h1 className="text-3xl font-bold text-gradient">ShopEase</h1>
                    <p className="text-slate-500 mt-1">Create your shop account</p>
                </div>

                <div className="glass-card p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="form-label">Shop Name *</label>
                                <input className="form-input" name="shopName" value={form.shopName} onChange={handleChange} placeholder="e.g. ABC General Store" />
                            </div>
                            <div>
                                <label className="form-label">Owner Name *</label>
                                <input className="form-input" name="ownerName" value={form.ownerName} onChange={handleChange} placeholder="Full name" />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Email *</label>
                            <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="shop@example.com" />
                        </div>

                        <div>
                            <label className="form-label">Phone</label>
                            <input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit mobile number" maxLength={10} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="form-label">Password *</label>
                                <div className="relative">
                                    <input className="form-input pr-10" type={showPwd ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Min 8 characters" />
                                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200" onClick={() => setShowPwd(!showPwd)}>
                                        {showPwd ? <MdVisibilityOff /> : <MdVisibility />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Confirm Password *</label>
                                <input className="form-input" type={showPwd ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter password" />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Address</label>
                            <input className="form-input" name="address" value={form.address} onChange={handleChange} placeholder="Shop address (optional)" />
                        </div>

                        <div>
                            <label className="form-label">GST Number</label>
                            <input className="form-input" name="gstNumber" value={form.gstNumber} onChange={handleChange} placeholder="e.g. 27ABCDE1234F1Z5 (optional)" />
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full mt-2 py-3">
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 mt-4 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
