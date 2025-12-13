import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import Sidebar from "../components/Sidebar";
import SuggestedUsers from "../components/SuggestedUsers";
import { useStore } from "../store/useStore";
import { useEffect, useState } from "react";
import api from "../lib/api";
import { MapPin, Users, Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import { useInView } from "react-intersection-observer";

import MoodSelector from "../components/MoodSelector";
import SEO from "../components/SEO";

export default function Home() {
  const { posts, loadPosts, page, hasMore, loading } = useStore();
  const { ref, inView } = useInView();
  const [activeMood, setActiveMood] = useState("neutral");
  const [activeTab, setActiveTab] = useState("foryou"); // 'foryou' | 'following' | 'nearby'
  const [nearbyPosts, setNearbyPosts] = useState([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    if (activeTab === "foryou") {
      loadPosts(1, activeMood, "foryou");
    } else if (activeTab === "following") {
      loadPosts(1, activeMood, "following");
    } else if (activeTab === "nearby") {
      fetchNearbyPosts();
    }
  }, [activeMood, activeTab]); // Reload when mood or tab changes

  const fetchNearbyPosts = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setLoadingNearby(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await api.get("/posts/whisper", {
            params: { latitude, longitude }
          });
          setNearbyPosts(res.data.posts || []);
        } catch (error) {
          console.error("Error fetching nearby posts:", error);
          setLocationError("Failed to fetch nearby posts.");
        } finally {
          setLoadingNearby(false);
        }
      },
      (error) => {
        console.error("Location error:", error);
        if (error.code === 1) {
          setLocationError("Location access denied. Please click the 🔒 icon in your address bar and allow location access.");
        } else {
          setLocationError("Unable to retrieve location. Please check your connection and try again.");
        }
        setLoadingNearby(false);
      }
    );
  };

  useEffect(() => {
    if (inView && hasMore && !loading && (activeTab === "foryou" || activeTab === "following")) {
      loadPosts(page + 1, activeMood, activeTab);
    }
  }, [inView, hasMore, loading, page, activeMood, activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO title="Home" />
      <Sidebar />

      <div className="lg:pl-64 pt-6 flex justify-center">
        <div className="w-full max-w-2xl px-4 pb-20">
          {/* Tabs */}
          <div className="flex p-1 bg-gray-200/50 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab("foryou")}
              aria-label="For You Feed"
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === "foryou"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <Sparkles size={18} />
              For You
            </button>
            <button
              onClick={() => setActiveTab("following")}
              aria-label="Following Feed"
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === "following"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <Users size={18} />
              Following
            </button>
            <button
              onClick={() => setActiveTab("nearby")}
              aria-label="Nearby Feed"
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === "nearby"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-gray-500 hover:text-emerald-600"
                }`}
            >
              <MapPin size={18} />
              Nearby
            </button>
          </div>

          <MoodSelector selectedMood={activeMood} onSelect={setActiveMood} />

          <div className="mt-4">
            <CreatePost />
          </div>

          <motion.div layout className="space-y-6">
            {activeTab === "foryou" || activeTab === "following" ? (
              posts.length === 0 && !loading ? (
                <div className="text-center py-10 text-gray-500">
                  {activeTab === "following"
                    ? "No posts from people you follow. Go to Explore to find more!"
                    : "No posts found. Start interacting to see more!"}
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))
              )
            ) : (
              // Nearby Tab Content
              loadingNearby ? (
                <div className="py-8 flex justify-center">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : locationError ? (
                <div className="flex flex-col items-center justify-center py-10 text-center bg-white rounded-2xl border border-dashed border-gray-300 p-8">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <Lock size={32} />
                  </div>
                  <h3 className="text-gray-900 font-bold text-lg mb-2">Location Access Required</h3>
                  <p className="text-gray-500 max-w-xs mb-4">{locationError}</p>
                  <button
                    onClick={fetchNearbyPosts}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-black transition"
                  >
                    Try Again
                  </button>
                </div>
              ) : nearbyPosts.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                      <MapPin size={32} />
                    </div>
                  </div>
                  No whisper posts nearby. Be the first to whisper! 🤫
                </div>
              ) : (
                nearbyPosts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))
              )
            )}
          </motion.div>

          {/* Infinite Scroll Trigger */}
          {(activeTab === "foryou" || activeTab === "following") && hasMore && (
            <div ref={ref} className="py-8 flex justify-center">
              <div className="w-8 h-8 border-4 border-[#0ea5e9] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {(activeTab === "foryou" || activeTab === "following") && !hasMore && posts.length > 0 && (
            <div className="py-8 text-center text-gray-500 text-sm">
              You've reached the end!
            </div>
          )}
        </div>

        {/* Right Sidebar for Suggested Users */}
        <div className="hidden xl:block w-80 px-4 sticky top-6 h-fit">
          <SuggestedUsers />
        </div>
      </div>
    </div>
  );
}
