import { useNavigate } from "react-router-dom";
import { UserPlus, UserMinus, Shield, MapPin, Calendar, Link as LinkIcon, Users } from "lucide-react";
import { useStore } from "../store/useStore";
import { useState } from "react";
import api from "../lib/api";
import toast from "react-hot-toast";

export default function AuthorCard({ user }) {
    const navigate = useNavigate();
    const { user: currentUser, followUser, unfollowUser } = useStore();
    const [isFollowing, setIsFollowing] = useState(currentUser?.following?.includes(user?._id));
    const [hover, setHover] = useState(false);

    if (!user) return null;

    const handleFollowToggle = async (e) => {
        e.stopPropagation();
        try {
            if (isFollowing) {
                await unfollowUser(user._id);
                setIsFollowing(false);
                toast.success(`Unfollowed ${user.name}`);
            } else {
                await followUser(user._id);
                setIsFollowing(true);
                toast.success(`Following ${user.name}`);
            }
        } catch (error) {
            toast.error("Failed to update follow status");
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            {/* Cover Image Placeholder - could be real if user has one */}
            <div className="h-24 bg-gradient-to-r from-blue-400 to-purple-500 relative">
                <div className="absolute inset-0 bg-black/10"></div>
            </div>

            <div className="px-6 pb-6 relative">
                <div className="flex justify-between items-end -mt-10 mb-4">
                    <div
                        className="w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-white shadow-md cursor-pointer"
                        onClick={() => navigate(`/profile/${user._id}`)}
                    >
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-2xl font-bold text-gray-400">
                                {user.name?.[0].toUpperCase()}
                            </div>
                        )}
                    </div>

                    {currentUser?._id !== user._id && (
                        <button
                            onClick={handleFollowToggle}
                            onMouseEnter={() => setHover(true)}
                            onMouseLeave={() => setHover(false)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 shadow-sm
                ${isFollowing
                                    ? "bg-white border border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                    : "bg-black text-white hover:bg-gray-800"
                                }`}
                        >
                            {isFollowing ? (
                                hover ? <><UserMinus size={16} /> Unfollow</> : <><Users size={16} /> Following</>
                            ) : (
                                <><UserPlus size={16} /> Follow</>
                            )}
                        </button>
                    )}
                </div>

                <div onClick={() => navigate(`/profile/${user._id}`)} className="cursor-pointer group">
                    <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition flex items-center gap-2">
                        {user.name}
                        {user.isAdmin && <Shield size={16} className="text-blue-500 fill-blue-50" />}
                    </h3>
                    <p className="text-gray-500 text-sm">@{user.username || user.name.toLowerCase().replace(/\s+/g, '')}</p>
                </div>

                {user.bio && (
                    <p className="mt-3 text-gray-700 text-sm leading-relaxed">
                        {user.bio}
                    </p>
                )}

                <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar size={14} />
                        <span>Joined {new Date(user.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                    </div>
                    {user.location && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin size={14} />
                            <span>{user.location}</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-4 mt-5 pt-4 border-t border-gray-50">
                    <div className="text-center">
                        <span className="block font-bold text-gray-900">{user.followers?.length || 0}</span>
                        <span className="text-xs text-gray-500">Followers</span>
                    </div>
                    <div className="text-center">
                        <span className="block font-bold text-gray-900">{user.following?.length || 0}</span>
                        <span className="text-xs text-gray-500">Following</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
