import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import api from "../lib/api";
import { useStore } from "../store/useStore";
import { Edit2, Camera, Grid3X3, MapPin, Link as LinkIcon, Calendar, UserPlus, UserCheck, MoreVertical, Shield, Lock, EyeOff, MessageCircle } from "lucide-react";
import PostCard from "../components/PostCard";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";

export default function Profile() {
  const { user, setUser, followUser, unfollowUser, blockUser, unblockUser, muteUser, unmuteUser } = useStore();
  const { id } = useParams();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const toastId = toast.loading("Uploading avatar...");

    try {
      const { data } = await api.post("/posts/upload-url", {
        fileName: file.name,
        fileType: file.type,
      });

      await fetch(data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const res = await api.put("/auth/me", { avatar: data.imageUrl });
      const updatedUser = res.data;

      setUser(updatedUser);
      setProfileUser(updatedUser);

      toast.success("Avatar updated!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload avatar", { id: toastId });
    }
  };

  const isOwnProfile = !id || id === user?._id || id === user?.id;
  const isFollowing = profileUser?.followers?.some(f => (f?._id || f) === (user?._id || user?.id));
  const isBlocked = user?.blockedUsers?.includes(profileUser?._id);
  const isMuted = user?.mutedUsers?.includes(profileUser?._id);
  const [showMenu, setShowMenu] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'followers' | 'following' | null

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = id || user?._id || user?.id;
        if (!userId) return;

        const res = await api.get(`/users/${userId}`);
        const fetchedUser = res.data.user;
        setProfileUser(fetchedUser);

        // If it's own profile, initialize edit states
        if (isOwnProfile) {
          setName(fetchedUser.name || "");
          setBio(fetchedUser.bio || "");
          setInterests(fetchedUser.interests?.join(", ") || "");
        }

        loadUserPosts(fetchedUser._id, activeTab);
      } catch (err) {
        console.error("Failed to load profile:", err);
        toast.error("Failed to load profile");
      }
    };
    fetchProfile();
  }, [id, user?._id, isOwnProfile, activeTab]);

  const loadUserPosts = async (userId, tab) => {
    try {
      const res = await api.get(`/posts/user/${userId}?tab=${tab}`);
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error("Failed to load posts:", err);
    }
  };

  const saveProfile = async () => {
    if (!name.trim()) return alert("Name cannot be empty!");

    setLoading(true);
    try {
      const interestsArray = interests.split(",").map(i => i.trim()).filter(i => i);
      const res = await api.put("/auth/me", { name: name.trim(), bio, interests: interestsArray });
      const updatedUser = res.data;

      setProfileUser(updatedUser);
      setUser(updatedUser);
      setIsEditing(false);
    } catch (err) {
      alert("Failed to update profile. Try again!");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (isFollowing) {
      await unfollowUser(profileUser._id);
      setProfileUser(prev => ({
        ...prev,
        followers: prev.followers.filter(id => id !== user._id && id._id !== user._id)
      }));
    } else {
      await followUser(profileUser._id);
      setProfileUser(prev => ({
        ...prev,
        followers: [...prev.followers, user._id]
      }));
    }
  };

  const startChat = () => {
    if (!user || !profileUser) return;
    const ids = [user._id || user.id, profileUser._id].sort();
    const roomId = `dm-${ids[0]}-${ids[1]}`;
    navigate(`/rooms/${roomId}`);
  };

  if (!profileUser) return <div className="text-center mt-10">Loading profile...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
      <SEO
        title={`${profileUser.name} (@${profileUser.username || profileUser.name.toLowerCase().replace(/\s+/g, '')})`}
        description={profileUser.bio || `Check out ${profileUser.name}'s profile on SphereMint.`}
        image={profileUser.avatar}
      />
      {/* Left Sidebar */}
      <div className="hidden lg:block lg:col-span-1">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3 space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-[#0ea5e9] to-blue-600"></div>

          <div className="px-6 pb-6">
            <div className="flex justify-between items-end -mt-12 mb-4">
              <div className="relative group">
                <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md overflow-hidden">
                  {profileUser.avatar ? (
                    <img
                      src={profileUser.avatar}
                      alt={profileUser.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                      {profileUser.name[0].toUpperCase()}
                    </div>
                  )}
                </div>
                {isOwnProfile && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-gray-900/70 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  >
                    <Camera size={14} />
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>

              <div className="flex gap-2 items-center">
                {isOwnProfile ? (
                  !isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
                    >
                      Edit Profile
                    </button>
                  )
                ) : (
                  <>
                    <button
                      onClick={handleFollow}
                      className={`px-6 py-2 rounded-full text-sm font-bold transition shadow-sm flex items-center gap-2 ${isFollowing
                        ? "bg-white border border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        : "bg-black text-white hover:bg-gray-800"
                        }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck size={16} /> Following
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} /> Follow
                        </>
                      )}
                    </button>

                    <button
                      onClick={startChat}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm flex items-center gap-2"
                    >
                      <MessageCircle size={18} />
                      Message
                    </button>

                    {/* More Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition"
                      >
                        <MoreVertical size={20} className="text-gray-600" />
                      </button>

                      {showMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20">
                          <button
                            onClick={() => {
                              isBlocked ? unblockUser(profileUser._id) : blockUser(profileUser._id);
                              setShowMenu(false);
                              toast.success(isBlocked ? "User unblocked" : "User blocked");
                            }}
                            className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Shield size={16} /> {isBlocked ? "Unblock" : "Block"} @{profileUser.username || profileUser.name}
                          </button>
                          <button
                            onClick={() => {
                              isMuted ? unmuteUser(profileUser._id) : muteUser(profileUser._id);
                              setShowMenu(false);
                              toast.success(isMuted ? "User unmuted" : "User muted");
                            }}
                            className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <EyeOff size={16} /> {isMuted ? "Unmute" : "Mute"} @{profileUser.username || profileUser.name}
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4 max-w-lg">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] outline-none font-bold text-xl"
                  placeholder="Name"
                />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] outline-none resize-none"
                  rows="3"
                  placeholder="Bio"
                />
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] outline-none"
                  placeholder="Interests (comma separated)"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveProfile}
                    disabled={loading}
                    className="px-4 py-2 bg-[#0ea5e9] text-white rounded-lg font-bold text-sm hover:bg-[#0284c7] transition disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profileUser.name}</h1>
                <p className="text-gray-500 text-sm mb-3">@{profileUser.name.toLowerCase().replace(/\s+/g, '')}</p>
                <p className="text-gray-800 mb-4">{profileUser.bio || "No bio yet."}</p>

                {profileUser.interests && profileUser.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {profileUser.interests.map((interest, index) => (
                      <span key={index} className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {interest}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin size={16} />
                    <span>Internet</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <LinkIcon size={16} />
                    <a href="#" className="text-[#0ea5e9] hover:underline">socialmint.com</a>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <span>Joined {new Date(profileUser.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-6 text-sm">
                  <div className="flex gap-1">
                    <span className="font-bold text-gray-900">{posts.length}</span>
                    <span className="text-gray-500">Posts</span>
                  </div>
                  <div
                    className="flex gap-1 cursor-pointer hover:underline"
                    onClick={() => setActiveModal("following")}
                  >
                    <span className="font-bold text-gray-900">{profileUser.following?.length || 0}</span>
                    <span className="text-gray-500">Following</span>
                  </div>
                  <div
                    className="flex gap-1 cursor-pointer hover:underline"
                    onClick={() => setActiveModal("followers")}
                  >
                    <span className="font-bold text-gray-900">{profileUser.followers?.length || 0}</span>
                    <span className="text-gray-500">Followers</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Followers/Following Modal */}
          <Modal
            isOpen={!!activeModal}
            onClose={() => setActiveModal(null)}
            title={activeModal === "followers" ? "Followers" : "Following"}
          >
            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
              {activeModal && profileUser[activeModal]?.length > 0 ? (
                profileUser[activeModal].map((u) => (
                  <div key={u._id} className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => {
                        navigate(`/profile/${u._id}`);
                        setActiveModal(null);
                      }}
                    >
                      <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                            {u.name?.[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">{u.name}</h4>
                        <p className="text-xs text-gray-500">@{u.username || u.name?.toLowerCase().replace(/\s+/g, "") || "user"}</p>
                      </div>
                    </div>
                    {/* We could add follow/unfollow button here, but let's keep it simple for now */}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No users found.</p>
              )}
            </div>
          </Modal>

          {/* Tabs */}
          <div className="flex border-t border-gray-100">
            {["posts", "replies", "media", "likes"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-bold capitalize transition ${activeTab === tab
                  ? "text-gray-900 border-b-2 border-[#0ea5e9] bg-gray-50"
                  : "text-gray-500 hover:bg-gray-50"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {profileUser.privacy?.isLocked && !isFollowing && !isOwnProfile ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Lock size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">This account is private</h3>
              <p className="text-gray-500 max-w-xs mx-auto">Follow this account to see their posts and media.</p>
            </div>
          ) : (
            posts.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <Grid3X3 size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-500">When you post, it will show up here.</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}
