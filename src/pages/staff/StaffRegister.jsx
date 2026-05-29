// src/pages/admin/StaffRegister.jsx
import React, { useState } from 'react';
import { Mail, Lock, User, Phone, Eye, EyeOff, Loader, AlertCircle, Plus } from 'lucide-react';

function StaffRegister() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        fullName: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const token = localStorage.getItem('jwt_token');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate
        if (formData.password !== formData.confirmPassword) {
            setError('❌ Mật khẩu không trùng khớp!');
            return;
        }

        if (formData.password.length < 6) {
            setError('❌ Mật khẩu phải ít nhất 6 ký tự!');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/users/register-staff`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    fullName: formData.fullName,
                    phone: formData.phone,
                    password: formData.password,
                    role: 'STAFF'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Đăng ký nhân viên thất bại');
            }

            setSuccess('✅ Tạo tài khoản nhân viên thành công!');

            // Reset form
            setFormData({
                username: '',
                email: '',
                fullName: '',
                phone: '',
                password: '',
                confirmPassword: ''
            });

            setTimeout(() => {
                setSuccess('');
            }, 3000);

        } catch (err) {
            console.error('Register staff error:', err);
            setError(err.message || 'Lỗi khi tạo tài khoản!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Plus className="w-6 h-6 text-amber-500" />
                    <h1 className="text-3xl font-bold text-white">Tạo Tài Khoản Nhân Viên</h1>
                </div>
                <p className="text-gray-400">Thêm nhân viên mới vào hệ thống</p>
            </div>

            {/* Form */}
            <div className="bg-gray-800 rounded-xl shadow-xl p-8 border border-gray-700">
                {error && (
                    <div className="mb-4 bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-4 bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg">
                        <span className="text-sm">{success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Username */}
                        <div>
                            <label className="block text-gray-300 mb-2 font-medium text-sm">
                                <User className="w-4 h-4 inline mr-2" />
                                Tên Đăng Nhập
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                placeholder="Ví dụ: staff001"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-gray-300 mb-2 font-medium text-sm">
                                <Mail className="w-4 h-4 inline mr-2" />
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                placeholder="Ví dụ: staff@coffee.vn"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Full Name */}
                        <div>
                            <label className="block text-gray-300 mb-2 font-medium text-sm">
                                <User className="w-4 h-4 inline mr-2" />
                                Tên Đầy Đủ
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                placeholder="Ví dụ: Nguyễn Văn A"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-gray-300 mb-2 font-medium text-sm">
                                <Phone className="w-4 h-4 inline mr-2" />
                                Số Điện Thoại
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                placeholder="Ví dụ: 0912345678"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Password */}
                        <div>
                            <label className="block text-gray-300 mb-2 font-medium text-sm">
                                <Lock className="w-4 h-4 inline mr-2" />
                                Mật Khẩu
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                    placeholder="Ít nhất 6 ký tự"
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                                    disabled={loading}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-gray-300 mb-2 font-medium text-sm">
                                <Lock className="w-4 h-4 inline mr-2" />
                                Xác Nhận Mật Khẩu
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                    placeholder="Nhập lại mật khẩu"
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                                    disabled={loading}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Đang tạo tài khoản...
                            </>
                        ) : (
                            <>
                                <Plus className="w-5 h-5" />
                                Tạo Tài Khoản Nhân Viên
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Info */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500 rounded-lg">
                <p className="text-blue-200 text-sm">
                    💡 Tài khoản nhân viên được tạo sẽ có quyền truy cập vào <strong>/staff</strong> với role <strong>STAFF</strong>
                </p>
            </div>
        </div>
    );
}

export default StaffRegister;