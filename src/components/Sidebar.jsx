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
        <div className="w-64 fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-100 p-4 overflow-y-auto hidden lg:block scrollbar-hide">
            <div className="space-y-2">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <div
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={`nav-item ${isActive ? "active bg-[#0ea5e9] text-white hover:bg-[#0284c7] hover:text-white" : ""}`}
                        >
                            <item.icon size={22} />
                            <span className="text-lg">{item.label}</span>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="px-4 text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                    Trending Topics
                </h3>
                <div className="space-y-3 px-4">
                    {trendingTags.length > 0 ? (
                        trendingTags.map((tag) => (
                            <div
                                key={tag.tag}
                                onClick={() => navigate(`/hashtag/${tag.tag.slice(1)}`)}
                                className="flex items-center justify-between text-gray-600 hover:text-[#0ea5e9] cursor-pointer font-medium transition-colors group"
                            >
                                <span>{tag.tag}</span>
                                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                    {tag.count}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-gray-400 italic">No trending topics yet</div>
                    )}
                </div>
            </div>

            {/* Footer Links for AdSense/Legal */}
            <div className="mt-8 pt-8 border-t border-gray-100 pb-20">
                <div className="flex flex-wrap gap-x-4 gap-y-2 px-4 text-xs text-gray-400">
                    <span onClick={() => navigate("/privacy")} className="hover:underline cursor-pointer">Privacy</span>
                    <span onClick={() => navigate("/terms")} className="hover:underline cursor-pointer">Terms</span>
                    <span onClick={() => navigate("/about")} className="hover:underline cursor-pointer">About</span>
                    <span onClick={() => navigate("/contact")} className="hover:underline cursor-pointer">Contact</span>
                    <span>© 2024 SphereMint</span>
                </div>
            </div>
        </div>
    );
}
