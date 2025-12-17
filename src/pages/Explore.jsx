import { useEffect, useState } from "react";
import api from "../lib/api";
import { Search, Flame, Users, Hash, TrendingUp, X, MessageCircle, Heart, MapPin, Globe } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LiveBubbles from "../components/LiveBubbles";
import MomentMap from "../components/MomentMap";

export default function Explore() {
    const [posts, setPosts] = useState([]);
    const [people, setPeople] = useState([]);
    const [hashtags, setHashtags] = useState([]);
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [nearbyPosts, setNearbyPosts] = useState([]);
    const [locationError, setLocationError] = useState(null);
    const [activeTab, setActiveTab] = useState("trending");
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q") || "";
    const [search, setSearch] = useState(query);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = search ? { params: { search } } : {};

                if (activeTab === "trending") {
                    const res = await api.get("/posts/explore", params);
                    setPosts(res.data.posts || []);
                } else if (activeTab === "nearby") {
                    if (!navigator.geolocation) {
                        setLocationError("Geolocation is not supported by your browser.");
                        setLoading(false);
                        return;
                    }
                    navigator.geolocation.getCurrentPosition(
                        async (position) => {
                            try {
                                const { latitude, longitude } = position.coords;
                                const res = await api.get("/posts/whisper", {
                                    params: { latitude, longitude, ...params.params }
                                });
                                setNearbyPosts(res.data.posts || []);
                            } catch (error) {
                                console.error("Error fetching nearby posts:", error);
                                setLocationError("Failed to fetch nearby posts.");
                            } finally {
                                setLoading(false);
                            }
                        },
                        (error) => {
                            console.error("Location error:", error);
                            if (error.code === 1) { // 1 = PERMISSION_DENIED
                                setLocationError("Location access denied. Please click the 🔒 icon in your address bar and allow location access.");
                            } else {
                                setLocationError("Unable to retrieve location. Please check your connection and try again.");
                            }
                            setLoading(false);
                        }
                    );
                    return; // Return here as setting loading false is handled in callbacks
                } else if (activeTab === "people") {
                    const res = await api.get("/auth/users", params); // Using existing endpoint
                    setPeople(res.data || []);
                } else if (activeTab === "hashtags") {
                    const res = await api.get("/posts/hashtags", params);
                    setHashtags(res.data.hashtags || []);
                } else if (activeTab === "topics") {
                    const res = await api.get("/posts/topics", params);
                    setTopics(res.data.topics || []);
                }
            } catch (err) {
                console.error("Failed to load explore data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab, search]);

    const tabs = [
        { id: "trending", label: "Trending", icon: Flame },
        { id: "nearby", label: "Nearby", icon: MapPin },
        { id: "map", label: "Map", icon: Globe },
        { id: "people", label: "People", icon: Users },
        { id: "hashtags", label: "Hashtags", icon: Hash },
        { id: "topics", label: "Topics", icon: TrendingUp },
    ];

    const renderContent = () => {
        if (loading) {
            return <div className="text-center py-10 text-gray-500">Loading...</div>;
        }

        if (activeTab === "trending") {
            return posts.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No trending posts found.</div>
            ) : (
                posts.map((post) => (
                    <div
                        key={post._id}
                        onClick={() => navigate(`/post/${post._id}`)}
                        className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer group mb-4"
                    >
                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-3">
                            <div
                                className="flex items-center gap-3 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/profile/${post.user?._id || post.user}`);
                                }}
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                    {post.user?.name?.[0] || "U"}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm hover:underline">{post.user?.name || "Unknown"}</h3>
                                    <p className="text-xs text-gray-400">Recommended for you</p>
                                </div>
                            </div>
                            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                <Flame size={10} className="fill-white" /> Trending
                            </div>
                        </div>

                        {/* Text */}
                        <p className="text-gray-800 text-[15px] leading-relaxed mb-4 break-words">
                            {post.text}
                        </p>

                        {/* Image */}
                        {post.image && (
                            <div className="rounded-xl overflow-hidden mb-4 shadow-sm">
                                <img
                                    src={post.image}
                                    alt="Post"
                                    className="w-full h-48 sm:h-64 object-cover transform group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center gap-6 text-xs font-medium text-gray-500">
                            <span className="flex items-center gap-1.5">
                                <Heart size={14} /> {post.likes?.length || 0} likes
                            </span>
                            <span className="flex items-center gap-1.5">
                                <MessageCircle size={14} /> {post.comments?.length || 0} comments
                            </span>
                        </div>
                    </div>
                ))
            );
        }

        if (activeTab === "nearby") {
            if (locationError) {
                return (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                            <MapPin size={32} />
                        </div>
                        <h3 className="text-gray-900 font-bold text-lg mb-2">Location Required</h3>
                        <p className="text-gray-500 max-w-xs">{locationError}</p>
                    </div>
                );
            }

            return nearbyPosts.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No nearby whisper posts found. Be the first to whisper! 🤫</div>
            ) : (
                nearbyPosts.map((post) => (
                    <div
                        key={post._id}
                        onClick={() => navigate(`/post/${post._id}`)}
                        className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer group mb-4"
                    >
                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-3">
                            <div
                                className="flex items-center gap-3 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/profile/${post.user?._id || post.user}`);
                                }}
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-[#0ea5e9] to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                    {post.user?.name?.[0] || "U"}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm hover:underline">{post.user?.name || "Unknown"}</h3>
                                    <p className="text-xs text-gray-400">Nearby Whisper 🤫</p>
                                </div>
                            </div>
                            <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm border border-emerald-100">
                                <MapPin size={10} /> {parseInt(post.distance || 0)}m away
                            </div>
                        </div>

                        {/* Text */}
                        <p className="text-gray-800 text-[15px] leading-relaxed mb-4 break-words">
                            {post.text}
                        </p>

                        {/* Image */}
                        {post.image && (
                            <div className="rounded-xl overflow-hidden mb-4 shadow-sm">
                                <img
                                    src={post.image}
                                    alt="Post"
                                    className="w-full h-48 sm:h-64 object-cover transform group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center gap-6 text-xs font-medium text-gray-500">
                            <span className="flex items-center gap-1.5">
                                <Heart size={14} /> {post.likes?.length || 0} likes
                            </span>
                            <span className="flex items-center gap-1.5">
                                <MessageCircle size={14} /> {post.comments?.length || 0} comments
                            </span>
                        </div>
                    </div>
                ))
            );
        }

        if (activeTab === "map") {
            return <MomentMap />;
        }

        if (activeTab === "people") {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {people.map((user) => (
                        <div key={user._id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 hover:shadow-md transition cursor-pointer" onClick={() => navigate(`/profile/${user._id}`)}>
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {user.name?.[0] || "U"}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{user.name}</h3>
                                <p className="text-sm text-gray-500 truncate max-w-[150px]">{user.bio || "No bio"}</p>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (activeTab === "hashtags") {
            return (
                <div className="grid grid-cols-2 gap-4">
                    {hashtags.map((tag, index) => (
                        <div
                            key={index}
                            onClick={() => navigate(`/hashtag/${tag.tag.slice(1)}`)}
                            className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition cursor-pointer flex justify-between items-center"
                        >
                            <span className="font-bold text-[#0ea5e9]">{tag.tag}</span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{tag.count} posts</span>
                        </div>
                    ))}
                </div>
            );
        }

        if (activeTab === "topics") {
            return (
                <div className="grid grid-cols-2 gap-4">
                    {topics.map((topic, index) => (
                        <div
                            key={index}
                            onClick={() => navigate(`/hashtag/${topic.name.toLowerCase()}`)}
                            className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition cursor-pointer"
                        >
                            <h3 className="font-bold text-gray-900">{topic.name}</h3>
                            <p className="text-xs text-gray-500">{topic.count} interested</p>
                        </div>
                    ))}
                </div>
            );
        }
    };

    return (
        <div className="max-w-3xl mx-auto bg-white min-h-screen border-x border-gray-100 shadow-sm">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <h1 className="text-xl font-bold text-gray-900">Explore</h1>
                <button onClick={() => navigate("/")} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>
            </div>

            {/* Search Bar */}
            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search posts, users, or hashtags..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-gray-100 border-none rounded-full py-3 pl-12 pr-4 text-gray-900 focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none transition text-sm font-medium"
                    />
                </div>
            </div>

            {/* Live Bubbles */}
            <LiveBubbles />

            {/* Tabs */}
            <div className="flex items-center gap-2 px-4 pb-4 border-b border-gray-100 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                            ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                            : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent"
                            }`}
                    >
                        <tab.icon size={16} className={activeTab === tab.id ? "text-[#0ea5e9]" : ""} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className={activeTab === "map" ? "h-full" : "p-4 space-y-6"}>
                {renderContent()}
            </div>
        </div>
    );
}
