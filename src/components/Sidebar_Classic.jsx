import { Home, Compass, Users, MessageSquare, Bookmark, User, Settings, Hash, Map, Globe } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../lib/api";

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [trendingTags, setTrendingTags] = useState([]);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const res = await api.get("/posts/hashtags");
                setTrendingTags(res.data.hashtags?.slice(0, 5) || []);
            } catch (err) {
                console.error("Failed to fetch trending tags", err);
            }
        };
        fetchTrending();
    }, []);

    const menuItems = [
        { icon: Home, label: "Home", path: "/" },
        { icon: Compass, label: "Explore", path: "/explore" },
        { icon: Globe, label: "The Sphere", path: "/sphere" },
        { icon: Users, label: "Rooms", path: "/rooms" },
        { icon: MessageSquare, label: "Messages", path: "/messages" },
        { icon: Bookmark, label: "Saved", path: "/saved" },
        { icon: User, label: "Profile", path: "/profile" },
        { icon: Settings, label: "Settings", path: "/settings" },
    ];

    return (
        <div className="w-64 fixed left-0 top-16 h-[calc(100vh-4rem)] bg-[var(--bg-primary)] p-4 overflow-y-auto hidden lg:flex flex-col justify-between scrollbar-hide">
            <div className="space-y-1">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <div
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={`nav-item ${isActive ? "active" : ""}`}
                        >
                            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-lg">{item.label}</span>
                        </div>
                    );
                })}
            </div>

            <div className="space-y-8 mb-8">
                <div>
                    <h3 className="px-6 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                        Trending
                    </h3>
                    <div className="space-y-4 px-6">
                        {trendingTags.length > 0 ? (
                            trendingTags.map((tag) => (
                                <div
                                    key={tag.tag}
                                    onClick={() => navigate(`/hashtag/${tag.tag.slice(1)}`)}
                                    className="flex items-center justify-between text-gray-500 hover:text-black cursor-pointer transition-colors group"
                                >
                                    <span className="font-medium">#{tag.tag.replace('#', '')}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-gray-300 italic">Quiet today...</div>
                        )}
                    </div>
                </div>

                {/* Footer Links - Minimal */}
                <div className="px-6 border-t border-[var(--border-subtle)] pt-6">
                    <div className="text-[11px] text-gray-400 flex flex-wrap gap-x-4 gap-y-2 leading-relaxed">
                        <span onClick={() => navigate("/privacy")} className="hover:text-gray-900 cursor-pointer">Privacy</span>
                        <span onClick={() => navigate("/terms")} className="hover:text-gray-900 cursor-pointer">Terms</span>
                        <span onClick={() => navigate("/about")} className="hover:text-gray-900 cursor-pointer">About</span>
                        <span onClick={() => navigate("/contact")} className="hover:text-gray-900 cursor-pointer">Contact</span>
                        <span className="w-full mt-2 font-medium opacity-50">© 2025 SphereMint</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
