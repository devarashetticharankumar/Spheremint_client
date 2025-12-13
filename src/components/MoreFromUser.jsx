import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { Lock } from "lucide-react";

export default function MoreFromUser({ userId, currentPostId }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            if (!userId) return;
            try {
                // Assuming we have an endpoint to get user posts. 
                // Using getUserPosts from postController logic which is mapped to /posts/user/:userId
                const res = await api.get(`/posts/user/${userId}`);
                // API returns { posts: [...] }
                const postsData = res.data.posts || [];
                // Filter out current post and take top 3
                const otherPosts = postsData.filter(p => p._id !== currentPostId).slice(0, 3);
                setPosts(otherPosts);
            } catch (err) {
                console.error("Failed to load user posts", err);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchPosts();
        }
    }, [userId, currentPostId]);

    if (loading || posts.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 p-4">
            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">More from Author</h3>
            <div className="space-y-4">
                {posts.map(post => (
                    <Link to={`/post/${post._id}`} key={post._id} className="block group">
                        <div className="flex gap-3">
                            {post.isLocked ? (
                                // Locked State Thumbnail
                                <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-400 border border-gray-200">
                                    <Lock size={20} />
                                </div>
                            ) : (
                                // Normal Post Thumbnail
                                post.image || post.media?.[0]?.url ? (
                                    <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                        <img
                                            src={post.image || post.media?.[0]?.url}
                                            alt="Post thumbnail"
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0 flex items-center justify-center text-xs text-gray-400 border border-gray-100">
                                        Text
                                    </div>
                                )
                            )}

                            <div className="flex-1 min-w-0">
                                {post.isLocked ? (
                                    <p className="text-sm font-medium text-gray-500 italic">
                                        Locked Memory
                                    </p>
                                ) : (
                                    <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition">
                                        {post.text || "Shared a moment"}
                                    </p>
                                )}
                                <span className="text-xs text-gray-400 mt-1 block">
                                    {new Date(post.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
