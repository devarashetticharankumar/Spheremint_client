import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, UserCheck } from "lucide-react";
import api from "../lib/api";
import { useStore } from "../store/useStore";

const SuggestedUsers = () => {
    const [suggested, setSuggested] = useState([]);
    const { followUser, user } = useStore();

    useEffect(() => {
        const fetchSuggested = async () => {
            try {
                const res = await api.get("/users/suggested");
                setSuggested(res.data);
            } catch (err) {
                console.error("Failed to fetch suggested users", err);
            }
        };
        fetchSuggested();
    }, []);

    const handleFollow = async (id) => {
        await followUser(id);
        // Remove from list after following
        setSuggested((prev) => prev.filter((u) => u._id !== id));
    };

    if (suggested.length === 0) return null;

    return (
        <div className="bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Who to follow</h3>
            <div className="space-y-4">
                {suggested.map((u) => (
                    <div key={u._id} className="flex items-center justify-between">
                        <Link to={`/profile/${u._id}`} className="flex items-center gap-3 group">
                            <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-10 h-10 rounded-full object-cover border border-gray-600 group-hover:border-blue-500 transition-colors"
                            />
                            <div>
                                <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                                    {u.name}
                                </p>
                                <p className="text-xs text-gray-400">@{u.username || "user"}</p>
                            </div>
                        </Link>
                        <button
                            onClick={() => handleFollow(u._id)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                            title="Follow"
                        >
                            <UserPlus size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SuggestedUsers;
