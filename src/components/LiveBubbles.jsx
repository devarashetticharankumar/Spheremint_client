import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";
import { Sparkles, TrendingUp } from "lucide-react";

export default function LiveBubbles() {
    const [topics, setTopics] = useState([]);
    const navigate = useNavigate();
    const containerRef = useRef(null);

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const res = await api.get("/posts/topics");
                setTopics(res.data.topics || []);
            } catch (err) {
                console.error("Failed to fetch topics", err);
            }
        };
        fetchTopics();
    }, []);

    const handleBubbleClick = async (topicName) => {
        // ... (Navigation logic remains same)
        const toastId = toast.loading(`Checking rooms for "${topicName}"...`);
        try {
            const res = await api.get(`/rooms?search=${encodeURIComponent(topicName)}`);
            const rooms = res.data;
            const match = rooms.find(r => r.name.toLowerCase() === topicName.toLowerCase()) || rooms[0];

            if (match) {
                toast.dismiss(toastId);
                navigate(`/rooms/${match._id}`);
            } else {
                toast.dismiss(toastId);
                toast("No active room found. Create one!", { icon: "✨" });
                navigate("/rooms");
            }
        } catch (err) {
            toast.dismiss(toastId);
            toast.error("Failed to join room");
        }
    };

    if (topics.length === 0) return (
        <div className="py-8 text-center bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-3xl border border-white/40 backdrop-blur-sm mx-4 mb-6">
            <div className="inline-flex p-3 rounded-full bg-white/50 backdrop-blur mb-3 shadow-sm">
                <Sparkles size={20} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium text-sm">Trends will appear here once they heat up! 🔥</p>
        </div>
    );

    // Dynamic Organic Shapes
    const getShape = (index) => {
        const shapes = [
            "60% 40% 30% 70% / 60% 30% 70% 40%",
            "30% 70% 70% 30% / 30% 30% 70% 70%",
            "50% 50% 20% 80% / 25% 80% 20% 75%",
            "70% 30% 30% 70% / 60% 40% 60% 40%",
        ];
        return shapes[index % shapes.length];
    };

    const getSize = (count) => {
        const base = 80;
        const max = 160;
        const scale = Math.min(count * 8, 80);
        return Math.min(base + scale, max);
    };

    const getGradient = (index) => {
        const gradients = [
            "bg-gradient-to-br from-violet-600/90 to-indigo-600/90 shadow-indigo-500/30",
            "bg-gradient-to-br from-fuchsia-500/90 to-pink-600/90 shadow-pink-500/30",
            "bg-gradient-to-br from-blue-500/90 to-cyan-500/90 shadow-blue-500/30",
            "bg-gradient-to-br from-emerald-500/90 to-teal-600/90 shadow-emerald-500/30",
            "bg-gradient-to-br from-amber-500/90 to-orange-600/90 shadow-orange-500/30",
        ];
        return gradients[index % gradients.length];
    };

    return (
        <div className="w-full relative overflow-hidden mb-8">
            <div className="px-6 flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-gradient-to-r from-pink-500 to-violet-500 rounded-lg">
                    <TrendingUp size={16} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Live Clusters</h2>
                <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">BETA</span>
            </div>

            <div
                ref={containerRef}
                className="relative w-full h-[280px] bg-white/30 backdrop-blur-xl border-y border-white/20 overflow-x-auto no-scrollbar scroll-smooth"
                style={{
                    perspective: '1000px'
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />

                <div className="flex items-center gap-6 px-10 h-full w-max mx-auto md:mx-0">
                    {topics.map((topic, i) => {
                        const size = getSize(topic.count);

                        return (
                            <button
                                key={topic.name}
                                onClick={() => handleBubbleClick(topic.name)}
                                className={`
                                    relative flex flex-col items-center justify-center
                                    text-white transition-all duration-700 ease-in-out
                                    group hover:z-50 hover:scale-110
                                    ${getGradient(i)}
                                    shadow-xl backdrop-blur-md
                                    animate-float
                                `}
                                style={{
                                    width: size,
                                    height: size,
                                    borderRadius: getShape(i),
                                    animationDelay: `${i * -0.5}s`,
                                    animationDuration: `${4 + (i % 3)}s`
                                }}
                            >
                                {/* Shine Effect */}
                                <div className="absolute top-4 left-4 w-1/3 h-1/3 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-[2px]" />

                                <span className="font-extrabold text-sm md:text-lg tracking-tight z-10 drop-shadow-md px-2 break-all text-center leading-none">
                                    {topic.name}
                                </span>
                                <span className="text-[10px] font-medium bg-black/20 px-2 py-0.5 rounded-full mt-1 backdrop-blur-sm">
                                    {topic.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    33% { transform: translateY(-8px) rotate(2deg); }
                    66% { transform: translateY(5px) rotate(-1deg); }
                }
                .animate-float {
                    animation-name: float;
                    animation-timing-function: ease-in-out;
                    animation-iteration-count: infinite;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
