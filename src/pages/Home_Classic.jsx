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


  const renderFeedItem = (post, index) => {
    // FUTURE: Ad Injection Logic
    // if (index > 0 && index % 5 === 0) return <AdCard key={`ad-${index}`} />;
    return <PostCard key={post._id} post={post} />;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <SEO title="Home" />
      <Sidebar />

      <div className="lg:pl-64 flex justify-center">
        <div className="w-full max-w-2xl px-4 pt-6 pb-20 border-r border-[var(--border-subtle)] min-h-screen">
          {/* Tabs - Minimal */}
          <div className="flex border-b border-[var(--border-subtle)] mb-4 bg-white/80 backdrop-blur sticky top-0 z-30 pt-2">
            <button
              onClick={() => setActiveTab("foryou")}
              className={`flex-1 pb-3 text-sm font-medium transition-all relative ${activeTab === "foryou"
                ? "text-black"
                : "text-gray-400 hover:text-gray-600"
                }`}
            >
              For You
              {activeTab === "foryou" && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />}
            </button>
            <button
              onClick={() => setActiveTab("following")}
              className={`flex-1 pb-3 text-sm font-medium transition-all relative ${activeTab === "following"
                ? "text-black"
                : "text-gray-400 hover:text-gray-600"
                }`}
            >
              Following
              {activeTab === "following" && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />}
            </button>
            <button
              onClick={() => setActiveTab("nearby")}
              className={`flex-1 pb-3 text-sm font-medium transition-all relative ${activeTab === "nearby"
                ? "text-black"
                : "text-gray-400 hover:text-gray-600"
                }`}
            >
              Nearby
              {activeTab === "nearby" && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />}
            </button>
          </div>

          <MoodSelector selectedMood={activeMood} onSelect={setActiveMood} />

          <div className="mt-6 mb-8">
            <CreatePost />
          </div>

          <div className="space-y-0"> {/* Removed spacing to make it query-feed like */}
            {activeTab === "foryou" || activeTab === "following" ? (
              posts.length === 0 && !loading ? (
                <div className="text-center py-10 text-gray-500 font-light">
                  {activeTab === "following"
                    ? "Your following list is quiet."
                    : "The feed is empty. Start the conversation."}
                </div>
              ) : (
                posts.map((post, index) => renderFeedItem(post, index))
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
                nearbyPosts.map((post, index) => renderFeedItem(post, index))
              )
            )}
          </div>

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
