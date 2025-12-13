import { useEffect, useState } from "react";
import api from "../lib/api";
import PostCard from "../components/PostCard";
import { Bookmark } from "lucide-react";

export default function Saved() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSaved = async () => {
            try {
                const res = await api.get("/posts/saved");
                setPosts(res.data.posts || []);
            } catch (err) {
                console.error("Failed to load saved posts", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSaved();
    }, []);

    if (loading) return <div className="text-center mt-10">Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
                <Bookmark className="text-[#0ea5e9]" size={28} />
                <h1 className="text-2xl font-bold text-gray-900">Saved Posts</h1>
            </div>

            {posts.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <Bookmark size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-lg">No saved posts yet</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {posts.map((post) => (
                        <PostCard key={post._id} post={post} />
                    ))}
                </div>
            )}
        </div>
    );
}
