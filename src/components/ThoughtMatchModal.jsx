import { X, UserPlus, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";

export default function ThoughtMatchModal({ matches, onClose, postId }) {
    const navigate = useNavigate();

    const handleInvite = async (targetUserId) => {
        if (!postId) {
            // toast.error("Error: Post ID missing");
            return;
        }
        try {
            await api.post("/posts/request-collab", {
                postId,
                targetUserId
            });
            toast.success("Collaboration invite sent!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to invite");
        }
    };

    if (!matches || matches.length === 0) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-20">
                        <MessageCircle size={100} />
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/30 rounded-full p-1 transition"
                    >
                        <X size={20} />
                    </button>

                    <h2 className="text-2xl font-bold relative z-10 flex items-center gap-2">
                        🎉 Thought Match!
                    </h2>
                    <p className="text-white/90 relative z-10 mt-1">
                        {matches.length} people are thinking about the same thing right now!
                    </p>
                </div>

                {/* List */}
                <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
                    {matches.map((user) => (
                        <div
                            key={user._id}
                            className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                                            {user.name?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 leading-tight">{user.name}</h3>
                                    <p className="text-xs text-gray-500">@{user.username || "user"}</p>
                                    {user.matchedTopic && (
                                        <span className="inline-block mt-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                            Matched: {user.matchedTopic}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleInvite(user._id)}
                                    className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition flex items-center gap-1.5 shadow-sm opacity-90 group-hover:opacity-100"
                                >
                                    <UserPlus size={14} />
                                    <span className="hidden sm:inline">Invite</span>
                                </button>

                                <button
                                    onClick={() => {
                                        onClose();
                                        navigate(`/profile/${user._id}`);
                                    }}
                                    className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-black transition flex items-center gap-1.5 shadow-sm opacity-90 group-hover:opacity-100"
                                >
                                    View <span className="hidden sm:inline">Profile</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 text-sm font-medium"
                    >
                        Close & Continue
                    </button>
                </div>
            </div>
        </div>
    );
}
