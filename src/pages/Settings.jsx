import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import api from "../lib/api";
import { Lock, MessageCircle, Eye, Shield, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Settings() {
    const { user, setUser } = useStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [privacy, setPrivacy] = useState({
        isLocked: false,
        messaging: "everyone",
        postVisibility: "everyone",
    });

    useEffect(() => {
        if (user?.privacy) {
            setPrivacy(user.privacy);
        }
    }, [user]);

    const handleToggle = async (key) => {
        const newVal = !privacy[key];
        updatePrivacy({ ...privacy, [key]: newVal });
    };

    const handleChange = async (key, value) => {
        updatePrivacy({ ...privacy, [key]: value });
    };

    const updatePrivacy = async (newPrivacy) => {
        setPrivacy(newPrivacy);
        setLoading(true);
        try {
            // We need to update the user model. 
            // Currently authController.updateProfile handles name/bio/avatar/interests.
            // We need to update it to handle privacy or create a new endpoint.
            // Let's assume updateProfile can handle it or we add it.
            // I'll update authController.updateProfile to accept privacy.

            const res = await api.put("/auth/me", { privacy: newPrivacy });
            setUser(res.data);
            toast.success("Settings updated");
        } catch (err) {
            console.error(err);
            toast.error("Failed to update settings");
            // Revert on error
            if (user?.privacy) setPrivacy(user.privacy);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white min-h-screen border-x border-gray-100 shadow-sm">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-4 sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ChevronLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">Settings & Privacy</h1>
            </div>

            <div className="p-6 space-y-8">
                {/* Account Privacy */}
                <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Lock size={20} className="text-[#0ea5e9]" /> Account Privacy
                    </h2>
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-900">Private Account</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Only people you approve can see your photos and videos. Your existing followers won't be affected.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={privacy.isLocked}
                                    onChange={() => handleToggle("isLocked")}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0ea5e9]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0ea5e9]"></div>
                            </label>
                        </div>
                    </div>
                </section>

                {/* Interactions */}
                <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield size={20} className="text-[#0ea5e9]" /> Interactions
                    </h2>
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

                        {/* Messaging */}
                        <div className="p-4 border-b border-gray-100">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                                    <MessageCircle size={20} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900">Messages</h3>
                                    <p className="text-sm text-gray-500 mb-3">Who can send you private messages?</p>
                                    <div className="flex gap-2">
                                        {["everyone", "followers", "nobody"].map((option) => (
                                            <button
                                                key={option}
                                                onClick={() => handleChange("messaging", option)}
                                                className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition ${privacy.messaging === option
                                                        ? "bg-gray-900 text-white"
                                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                    }`}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Post Visibility */}
                        <div className="p-4">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-purple-50 text-purple-500 rounded-lg">
                                    <Eye size={20} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900">Post Visibility</h3>
                                    <p className="text-sm text-gray-500 mb-3">Who can see your future posts?</p>
                                    <div className="flex gap-2">
                                        {["everyone", "followers"].map((option) => (
                                            <button
                                                key={option}
                                                onClick={() => handleChange("postVisibility", option)}
                                                className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition ${privacy.postVisibility === option
                                                        ? "bg-gray-900 text-white"
                                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                    }`}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>
            </div>
        </div>
    );
}
