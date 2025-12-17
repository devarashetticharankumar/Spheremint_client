import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import api from "../lib/api";
import { Sparkles, Mail, Lock, User, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import SEO from "../components/SEO";
import { motion, AnimatePresence } from "framer-motion";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", username: "" });
  const { setUser } = useStore();
  const [loading, setLoading] = useState(false);
  const [showWakeUpMessage, setShowWakeUpMessage] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => {
        setShowWakeUpMessage(true);
      }, 3000); // Show message if request takes longer than 3s
    } else {
      setShowWakeUpMessage(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowWakeUpMessage(false);

    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const res = await api.post(endpoint, form);
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
      toast.success(isRegister ? "Welcome to SphereMint! 🎉" : "Welcome back! 👋");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setForm({ name: "", email: "", password: "", username: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[20%] w-[500px] h-[500px] rounded-full bg-purple-500/20 blur-[100px] animate-pulse delay-1000" />
      </div>

      <SEO title={isRegister ? "Join SphereMint" : "Login"} />

      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl w-full bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row relative z-10"
      >
        {/* Left Side - Visual */}
        <div className="md:w-1/2 p-12 bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative z-10"
          >
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-blue-500/30">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">SphereMint</h2>
            <p className="text-blue-100/80 leading-relaxed">
              Connect, Share, and Discover in a <br /> Next-Generation Social Space.
            </p>
          </motion.div>
        </div>

        {/* Right Side - Form */}
        <div className="md:w-1/2 p-8 md:p-12 bg-white/95">
          <motion.div
            key={isRegister ? "register" : "login"}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {isRegister ? "Create Account" : "Welcome Back"}
            </h3>
            <p className="text-gray-500 mb-8">
              {isRegister ? "Enter your details to get started." : "Please enter your details to login."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence>
                {isRegister && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-5 overflow-hidden"
                  >
                    <div className="relative group">
                      <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        placeholder="Full Name"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required={isRegister}
                      />
                    </div>

                    <div className="relative group">
                      <span className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 font-bold text-center group-focus-within:text-blue-500 transition-colors">@</span>
                      <input
                        type="text"
                        placeholder="Username"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        required={isRegister}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {!isRegister && (
                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm text-blue-500 hover:text-blue-700 font-medium hover:underline">
                    Forgot Password?
                  </Link>
                </div>
              )}

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </>
                  ) : (
                    <>
                      {isRegister ? "Create Account" : "Sign In"}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {showWakeUpMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center bg-yellow-50 text-yellow-700 p-3 rounded-lg text-sm border border-yellow-100"
                  >
                    <p className="font-semibold">Starting up the server...</p>
                    <p className="text-xs opacity-80">Render's free tier sleeps when inactive. This first request might take almost a minute. Thanks for waiting!</p>
                  </motion.div>
                )}
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">
                {isRegister ? "Already have an account? " : "New to SphereMint? "}
                <button
                  onClick={toggleMode}
                  className="text-blue-600 font-bold hover:underline focus:outline-none"
                >
                  {isRegister ? "Login" : "Sign Up"}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
