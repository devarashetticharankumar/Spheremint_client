import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Hash } from "lucide-react";
import api from "../lib/api";

export default function TrendingTopics() {
    const [hashtags, setHashtags] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrends = async () => {
            try {
                const res = await api.get("/posts/hashtags");
                // API returns { hashtags: [...] }
                const tags = res.data.hashtags || [];
                setHashtags(tags.slice(0, 5));
            } catch (err) {
                console.error("Failed to load trends", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTrends();
    }, []);

    if (loading) return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-8 bg-gray-100 rounded"></div>)}
            </div>
        </div>
    );

    if (hashtags.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-4">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-purple-600" />
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Trending Now</h3>
            </div>
            <div className="flex flex-wrap gap-2">
                {hashtags.map((tag) => (
                    <Link
                        to={`/hashtag/${tag.tag.replace('#', '')}`}
                        key={tag.tag}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-600 rounded-full text-sm font-medium transition duration-200 border border-transparent hover:border-purple-200"
                    >
                        <Hash size={13} className="opacity-50" />
                        <span>{tag.tag}</span>
                        <span className="text-xs ml-1 opacity-40 font-normal">{tag.count}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
