import { useState } from "react";
import { useStore } from "../store/useStore";
import api from "../lib/api";
import { Sparkles, Mail, Lock, User, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", username: "" });
  const { setUser } = useStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <SEO title={isRegister ? "Join SphereMint" : "Login"} />
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-4 text-[#0ea5e9]">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">SphereMint</h1>
          <p className="text-gray-500">
            {isRegister ? "Create an account to join" : "Welcome back, please login"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] transition"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="relative">
                <span className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 font-bold text-center">@</span>
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] transition"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Email Address"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] transition"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] transition"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              "Please wait..."
            ) : (
              <>
                {isRegister ? "Create Account" : "Login"}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            {isRegister ? "Already have an account? " : "New to SphereMint? "}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-[#0ea5e9] font-bold hover:underline"
            >
              {isRegister ? "Login" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
