import { useState } from "react";
import api from "../lib/api";
import { Lock, key, Eye, EyeOff, CheckCircle, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import SEO from "../components/SEO";
import { motion } from "framer-motion";

export default function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return toast.error("Passwords do not match!");
        }
        setLoading(true);
        try {
            await api.put(`/auth/reset-password/${token}`, { password });
            toast.success("Password reset successfully! Login now.");
            navigate("/login");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe] flex items-center justify-center px-4 overflow-hidden relative">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-blue-400/20 blur-3xl" />
                <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-purple-400/20 blur-3xl" />
            </div>

            <SEO title="Reset Password | SphereMint" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100/50 rounded-2xl mb-4 text-[#0ea5e9]">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
                    <p className="text-gray-500 text-sm">
                        Enter your new password below.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-[#0ea5e9] transition-colors" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="New Password"
                            className="w-full pl-12 pr-12 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-[#0ea5e9] transition-colors" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm New Password"
                            className="w-full pl-12 pr-12 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] transition-all"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-[#0ea5e9] to-[#2563eb] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                    >
                        {loading ? (
                            "Updating..."
                        ) : (
                            <>
                                Update Password
                                <CheckCircle className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
