import { useState } from "react";
import api from "../lib/api";
import { Mail, ArrowRight, ArrowLeft, Send } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { motion } from "framer-motion";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/auth/forgot-password", { email });
            setSent(true);
            toast.success("Reset link sent to your email!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send reset link");
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

            <SEO title="Forgot Password | SphereMint" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100/50 rounded-2xl mb-4 text-[#0ea5e9]">
                        <Mail className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
                    <p className="text-gray-500 text-sm">
                        {sent
                            ? `We sent a reset link to ${email}`
                            : "Enter your email address and we'll send you a link to reset your password."}
                    </p>
                </div>

                {!sent ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative group">
                            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-[#0ea5e9] transition-colors" />
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-[#0ea5e9] to-[#2563eb] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                "Sending..."
                            ) : (
                                <>
                                    Send Reset Link
                                    <Send className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="p-4 bg-green-50 rounded-xl border border-green-100 text-green-700 text-sm text-center">
                            Check your email (and spam folder) for the reset link.
                        </div>
                        <button
                            onClick={() => setSent(false)}
                            className="w-full py-3 text-[#0ea5e9] font-semibold hover:bg-blue-50 rounded-xl transition-colors"
                        >
                            Try another email
                        </button>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
