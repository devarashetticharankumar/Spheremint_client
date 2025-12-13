import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../lib/api";
import PostCard from "../components/PostCard";
import Sidebar from "../components/Sidebar";
import { Hash, Film, Clock, ArrowDown } from "lucide-react";

export default function HashtagFeed() {
    const { tag } = useParams();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPlayback, setIsPlayback] = useState(false);

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                // User requested Newest -> Oldest for Playback as well.
                // Default is newest first, so we just don't pass 'sort=oldest'.
                const params = {};
                // if (isPlayback) { params.sort = "oldest"; } // Removed as per request

                const { data } = await api.get(`/posts/hashtag/${tag}`, { params });
                setPosts(data.posts);
            } catch (err) {
                console.error("Failed to fetch hashtag posts", err);
            } finally {
                setLoading(false);
            }
        };

        if (tag) {
            fetchPosts();
        }
    }, [tag, isPlayback]);

    return (
        <div className="min-h-screen bg-[#f0f2f5]">
            <Sidebar />
            <div className="lg:pl-64 pt-6">
                <div className="max-w-2xl mx-auto px-4 pb-20">
                    <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-[#0ea5e9]">
                            <Hash size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">#{tag}</h1>
                            <p className="text-gray-500">{posts.length} posts</p>
                        </div>
                    </div>

                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => setIsPlayback(!isPlayback)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${isPlayback
                                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg scale-105"
                                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                                }`}
                        >
                            <Film size={18} />
                            {isPlayback ? "Playback On" : "Playback Feed"}
                        </button>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white h-48 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : posts.length > 0 ? (

                        <div className={`space-y-6 ${isPlayback ? "relative pl-8 border-l-2 border-gray-200 ml-4" : ""}`}>
                            {posts.map((post, index) => (
                                <div key={post._id} className="relative">
                                    {isPlayback && (
                                        <>
                                            <div className="absolute -left-[41px] top-6 w-5 h-5 bg-white border-4 border-rose-400 rounded-full z-10"></div>
                                            <div className="absolute -left-8 top-1 text-xs font-mono text-gray-400 -translate-x-full">
                                                {new Date(post.createdAt).toLocaleDateString()}
                                            </div>
                                        </>
                                    )}
                                    <PostCard post={post} />
                                    {isPlayback && index < posts.length - 1 && (
                                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-6 text-gray-300">
                                            <ArrowDown size={16} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <Hash size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No posts yet</h3>
                            <p className="text-gray-500">
                                Be the first to post with #{tag}!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
