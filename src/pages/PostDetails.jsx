import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import PostCard from "../components/PostCard";
import AuthorCard from "../components/AuthorCard";
import MoreFromUser from "../components/MoreFromUser";
import TrendingTopics from "../components/TrendingTopics";
import { ArrowLeft } from "lucide-react";
import SEO from "../components/SEO";

export default function PostDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await api.get(`/posts/${id}`);
                setPost(res.data);
            } catch (err) {
                console.error("Failed to load post", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [id]);

    if (loading)
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );

    if (!post)
        return (
            <div className="flex flex-col justify-center items-center h-screen text-gray-500">
                <h2 className="text-2xl font-bold mb-2">Post not found</h2>
                <button
                    onClick={() => navigate(-1)}
                    className="text-indigo-600 hover:text-indigo-800"
                >
                    Go Back
                </button>
            </div>
        );

    // Identify the user to show in AuthorCard. 
    // Prioritize the original author if it's a repost, or just the post author.
    const displayMeta = post.repostOf || post;
    const author = displayMeta.user;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <SEO
                title={displayMeta.anonymous ? "Anonymous Post" : `Post by ${author?.name || 'User'}`}
                description={displayMeta.content?.substring(0, 150) || "Check out this post on SphereMint."}
                image={displayMeta.image || author?.avatar}
            />
            {/* Sticky Glassmorphic Header */}
            <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm supports-[backdrop-filter]:bg-white/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-100/50 text-gray-700 transition"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 truncate">
                        {displayMeta.anonymous ? "Anonymous Post" : `Post by ${author?.name || 'User'}`}
                    </h1>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content Column */}
                    <div className="lg:col-span-8 space-y-6">
                        <PostCard post={post} />

                        {/* Mobile Wrapper for simpler consumption flow */}
                        <div className="block lg:hidden space-y-6">
                            <MoreFromUser userId={author?._id} currentPostId={post._id} />
                            <TrendingTopics />
                        </div>
                    </div>

                    {/* Sidebar Column (Desktop) */}
                    <div className="hidden lg:block lg:col-span-4 space-y-6">
                        <div className="sticky top-24 space-y-6">
                            {!displayMeta.anonymous && <AuthorCard user={author} />}
                            {displayMeta.anonymous && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                                    <div className="w-20 h-20 mx-auto bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                                        <span className="text-4xl">🎭</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">{displayMeta.maskName || "Anonymous"}</h3>
                                    <p className="text-gray-500 text-sm mt-2">Identity is hidden for this post.</p>
                                </div>
                            )}
                            <MoreFromUser userId={author?._id} currentPostId={post._id} />
                            <TrendingTopics />

                            <div className="text-xs text-center text-gray-400">
                                © 2024 Socialmint Inc.
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
