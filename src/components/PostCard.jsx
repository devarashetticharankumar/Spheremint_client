import { useState, useRef } from "react";
import { useStore } from "../store/useStore";
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Trash2, Edit, X, Check, AlertTriangle, Repeat, Volume2, VolumeX, BadgeCheck, Flag, Shield, Palette, Lock, Unlock, Mic } from "lucide-react";
import api from "../lib/api";
import CommentSection from "./CommentSection";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Modal from "./Modal";
import MediaCarousel from "./MediaCarousel";
import MultiCardViewer from "./MultiCardViewer";
import LinkPreviewCard from "./LinkPreviewCard";

const THEMES = [
  { name: "Default", from: "#ffffff", to: "#ffffff", text: "#1f2937" },
  { name: "Ocean", from: "#e0f2fe", to: "#0ea5e9", text: "#0c4a6e" },
  { name: "Sunset", from: "#ffedd5", to: "#f97316", text: "#7c2d12" },
  { name: "Lavender", from: "#f3e8ff", to: "#a855f7", text: "#581c87" },
  { name: "Mint", from: "#d1fae5", to: "#10b981", text: "#064e3b" },
  { name: "Midnight", from: "#1e1b4b", to: "#312e81", text: "#ffffff" },
  { name: "Rose", from: "#ffe4e6", to: "#f43f5e", text: "#881337" },
];

const VideoItem = ({ url, onClick }) => {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <div className="relative w-full h-full group cursor-pointer" onClick={onClick}>
      <video
        ref={videoRef}
        src={url}
        className="w-full h-full object-cover"
        autoPlay
        muted={isMuted}
        loop
        playsInline
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
      />
      <button
        onClick={toggleMute}
        aria-label="Toggle Mute"
        className="absolute bottom-2 right-2 bg-black/50 p-1.5 rounded-full text-white hover:bg-black/70 transition opacity-0 group-hover:opacity-100"
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
    </div>
  );
};

export default function PostCard({ post }) {
  const { user, likePost, toggleSave, deletePost, updatePost, repostPost } = useStore();
  const isLiked = post.likes.includes(user?._id || user?.id);
  const isOwner = (user?._id || user?.id) === (post.user?._id || post.user);
  const isReposted = post.reposts?.includes(user?._id || user?.id);

  // If this is a repost, we want to show the original post content but with a header
  const displayPost = post.repostOf ? post.repostOf : post;

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(post.text);
  const [editedCards, setEditedCards] = useState(post.cards || []);
  const [editedTheme, setEditedTheme] = useState(post.theme || THEMES[0]);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCarousel, setShowCarousel] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const navigate = useNavigate();

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const handleDelete = async () => {
    try {
      await deletePost(post._id);
      toast.success("Post deleted successfully");
      setShowDeleteModal(false);
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const handleUpdate = async () => {
    if (editedText.trim() !== post.text || JSON.stringify(editedCards) !== JSON.stringify(post.cards) || JSON.stringify(editedTheme) !== JSON.stringify(post.theme)) {
      try {
        await updatePost(post._id, {
          text: editedText,
          cards: editedCards,
          theme: editedTheme
        });
        toast.success("Post updated successfully");
      } catch (error) {
        toast.error("Failed to update post");
      }
    }
    setIsEditing(false);
    setShowMenu(false);
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    try {
      await toggleSave(post._id);
      const isSaved = user?.savedPosts?.includes(post._id);
      toast.success(isSaved ? "Post removed from saved" : "Post saved");
    } catch (error) {
      toast.error("Failed to save post");
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const handleVerify = async () => {
    try {
      await api.post(`/posts/${post._id}/verify`);
      toast.success("Post verification updated");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to verify post");
    }
  };

  const openReportModal = () => {
    setReportReason("");
    setShowReportModal(true);
    setShowMenu(false);
  };

  const submitReport = async () => {
    if (!reportReason.trim()) return toast.error("Please provide a reason");

    try {
      await api.post(`/posts/${post._id}/report`, { reason: reportReason });
      toast.success("Post reported successfully");
      setShowReportModal(false);
    } catch (error) {
      toast.error("Failed to report post");
    }
  };


  const handleVote = async (optionIndex) => {
    try {
      const res = await api.post(`/posts/${post._id}/vote`, { optionIndex });
      window.location.reload();
    } catch (err) {
      toast.error("Failed to vote");
    }
  };

  // Sphere Echoes Logic
  const [unlockedPost, setUnlockedPost] = useState(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const finalPost = unlockedPost || displayPost;

  const handleUnlock = async () => {
    if (isUnlocking) return;

    // If condition involves location, get it first
    let locationData = {};
    if (finalPost.unlockCondition === 'location' || finalPost.unlockCondition === 'both') {
      // Promisify geolocation
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      } catch (e) {
        toast.error("Location access needed to unlock this memory!");
        return;
      }
    }

    setIsUnlocking(true);
    try {
      const { data } = await api.post(`/posts/${finalPost._id}/unlock`, locationData);
      setUnlockedPost(data);
      toast.success("Memory Unlocked! 🔓");
    } catch (err) {
      toast.error(err.response?.data?.reason || "Failed to unlock");
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <>
      <div className="zen-card relative hover:bg-gray-50/50 transition-colors duration-500">
        {post.repostOf && (
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2 ml-1">
            <Repeat size={14} />
            <span className="font-medium">
              {post.user?._id === user?._id ? "You" : post.user?.name} reposted
            </span>
          </div>
        )}
        <div className="flex justify-between items-start mb-3">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (finalPost.anonymous) {
                toast("This user is currently wearing a mask! 🎭", { icon: "🕵️" });
                return;
              }
              navigate(`/profile/${post.user?._id || post.user}`);
            }}
          >
            <div className="w-10 h-10 relative flex-shrink-0">
              {/* Primary Author */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden ${finalPost.collaborators?.length > 0 ? "absolute top-0 left-0 z-10" : ""} ${!finalPost.user?.avatar ? "bg-black" : ""}`}>
                {finalPost.anonymous ? (
                  finalPost.maskAvatar ? (
                    <img src={finalPost.maskAvatar} alt="Mask" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">🎭</span>
                  )
                ) : finalPost.user?.avatar ? (
                  <img src={finalPost.user.avatar} alt={finalPost.user.name} className="w-full h-full object-cover" />
                ) : (
                  finalPost.user?.name?.[0] || "U"
                )}
              </div>

              {/* Collaborator (Show 1st for now) */}
              {finalPost.collaborators && finalPost.collaborators.length > 0 && (
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xs overflow-hidden absolute -bottom-1 -right-2 z-20 border-2 border-white shadow-sm">
                  {finalPost.collaborators[0].avatar ? (
                    <img src={finalPost.collaborators[0].avatar} alt="Collab" className="w-full h-full object-cover" />
                  ) : (
                    finalPost.collaborators[0].name?.[0] || "C"
                  )}
                </div>
              )}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm hover:underline flex items-center gap-1">
                {finalPost.anonymous ? (finalPost.maskName || "Anonymous") : finalPost.user?.name || "Unknown User"}
                {finalPost.collaborators && finalPost.collaborators.length > 0 && (
                  <span className="text-gray-500 font-normal"> & {finalPost.collaborators[0].name}</span>
                )}
                {finalPost.isVerified && <BadgeCheck size={16} className="text-blue-500 fill-blue-50" />}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <p>{new Date(displayPost.createdAt).toLocaleString()}</p>
                {displayPost.visibility === "followers" && (
                  <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> Followers Only
                  </span>
                )}
                {displayPost.visibility === "whisper" && (
                  <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Nearby
                  </span>
                )}
                {displayPost.visibility === "public" && (
                  <span className="text-gray-400">• Public</span>
                )}
              </div>
            </div>
          </div>

          {/* Menu for everyone (Report) or Owner/Admin (Edit/Delete/Verify) */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              aria-label="More Options"
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
            >
              <MoreHorizontal size={20} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 bg-white shadow-lg border border-gray-100 rounded-xl overflow-hidden z-10 w-40 animate-in fade-in zoom-in duration-200">
                {isOwner && (
                  <>
                    <button
                      onClick={() => { setIsEditing(true); setShowMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      onClick={() => { setShowDeleteModal(true); setShowMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </>
                )}
                {/* Admin Actions */}
                <button
                  onClick={() => { handleVerify(); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                >
                  <BadgeCheck size={14} /> Verify
                </button>

                <button
                  onClick={openReportModal}
                  className="w-full text-left px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                >
                  <Flag size={14} /> Report
                </button>
              </div>
            )}
          </div>
        </div>

        {finalPost.cards && finalPost.cards.length > 0 ? (
          isEditing ? (
            <div className="mb-3 space-y-4">
              {/* Theme Selector */}
              <div className="relative z-20">
                <button
                  onClick={() => setShowThemeSelector(!showThemeSelector)}
                  className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border transition ${showThemeSelector ? "bg-pink-50 border-pink-200 text-pink-600" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  <Palette size={16} />
                  <span>Theme: {editedTheme.name || 'Default'}</span>
                </button>
                {showThemeSelector && (
                  <div className="absolute top-10 left-0 bg-white border border-gray-100 shadow-xl rounded-xl p-3 grid grid-cols-4 gap-2 w-64 z-50">
                    {THEMES.map((theme) => (
                      <button
                        key={theme.name}
                        onClick={() => { setEditedTheme(theme); setShowThemeSelector(false); }}
                        className={`w-10 h-10 rounded-full border-2 transition ${editedTheme?.name === theme.name ? "border-black scale-110" : "border-gray-200 hover:scale-105"}`}
                        style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
                        title={theme.name}
                      />
                    ))}
                  </div>
                )}
              </div>

              {editedCards.map((card, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">Card {idx + 1}</span>
                    {card.media && card.media.length > 0 && (
                      <button
                        onClick={() => {
                          const newCards = [...editedCards];
                          newCards[idx].memeMode = !newCards[idx].memeMode;
                          setEditedCards(newCards);
                        }}
                        className={`text-xs font-bold px-2 py-1 rounded-md transition flex items-center gap-1 ${card.memeMode ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                      >
                        <span className="text-lg">Aa</span>
                        {card.memeMode ? "Overlay On" : "Text Overlay"}
                      </button>
                    )}
                  </div>
                  <textarea
                    value={card.text || ""}
                    onChange={(e) => {
                      const newCards = [...editedCards];
                      newCards[idx].text = e.target.value;
                      setEditedCards(newCards);
                    }}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none text-sm"
                    rows="2"
                    placeholder="Card text..."
                  />
                </div>
              ))}
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                >
                  <X size={18} />
                </button>
                <button
                  onClick={handleUpdate}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                >
                  <Check size={18} />
                </button>
              </div>
            </div>
          ) : (
            <MultiCardViewer cards={finalPost.cards} theme={finalPost.theme} />
          )
        ) : finalPost.isLocked ? (
          // LOCKED POST OVERLAY
          <div className="w-full h-48 bg-gray-100 rounded-xl flex flex-col items-center justify-center gap-3 relative overflow-hidden mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm"></div>
            <div className="z-10 bg-white p-3 rounded-full shadow-lg">
              <Lock className="text-indigo-600" size={24} />
            </div>
            <div className="z-10 text-center">
              <p className="font-bold text-gray-800">Time Capsule Locked</p>
              <p className="text-xs text-gray-500">This memory is saved for the future.</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleUnlock(); }}
              disabled={isUnlocking}
              className="z-10 mt-1 bg-white border border-indigo-100 text-indigo-600 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-indigo-50 transition shadow-sm flex items-center gap-2"
            >
              {isUnlocking ? "Unlocking..." : <><Unlock size={14} /> Unlock Memory</>}
            </button>
          </div>
        ) : (
          <>
            {isEditing ? (
              <div className="mb-3">
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] outline-none resize-none"
                  rows="3"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                  >
                    <X size={18} />
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                  >
                    <Check size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 text-[15px] leading-relaxed mb-3 whitespace-pre-wrap">
                {finalPost.text?.split(/(\s+)/).map((part, i) => {
                  if (part.match(/https?:\/\/[^\s]+/i)) {
                    return (
                      <a
                        key={i}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline break-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {part}
                      </a>
                    );
                  }
                  if (part.match(/#[a-z0-9_]+/i)) {
                    return (
                      <span
                        key={i}
                        className="text-[#0ea5e9] font-medium cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/hashtag/${part.slice(1)}`);
                        }}
                      >
                        {part}
                      </span>
                    );
                  }
                  if (part.match(/@[a-z0-9_]+/i)) {
                    return (
                      <span
                        key={i}
                        className="text-[#0ea5e9] font-medium cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/u/${part.slice(1)}`);
                        }}
                      >
                        {part}
                      </span>
                    );
                  }
                  return part;
                })}
              </p>
            )}

            {finalPost.media && finalPost.media.length > 0 ? (
              <div className={`grid gap-0.5 mb-4 rounded-xl overflow-hidden border border-gray-100 ${finalPost.media.length === 1 ? "grid-cols-1" : "grid-cols-2"
                }`}>
                {finalPost.media.map((item, index) => (
                  <div
                    key={index}
                    className={`relative bg-gray-100 ${finalPost.media.length === 3 && index === 0 ? "col-span-2" : ""
                      } ${finalPost.media.length === 1 ? "" : "aspect-square"}`}
                  >
                    {item.mediaType === "image" ? (
                      <img
                        src={item.url}
                        alt={`Post content ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCarouselIndex(index);
                          setShowCarousel(true);
                        }}
                      />
                    ) : (
                      <VideoItem
                        url={item.url}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCarouselIndex(index);
                          setShowCarousel(true);
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                {finalPost.image && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-gray-100">
                    <img
                      src={finalPost.image}
                      alt="Post content"
                      className="w-full h-auto object-cover max-h-[500px]"
                    />
                  </div>
                )}

                {finalPost.video && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-gray-100">
                    <video
                      src={finalPost.video}
                      controls
                      autoPlay
                      muted
                      loop
                      playsInline
                      controlsList="nodownload"
                      onContextMenu={(e) => e.preventDefault()}
                      className="w-full h-auto object-cover max-h-[500px]"
                    />
                  </div>
                )}

                {finalPost.audio && (
                  <div className="mb-4 rounded-xl bg-blue-50 p-3 border border-blue-100 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                      <Mic size={14} /> Voice Ripple
                    </div>
                    <audio
                      src={finalPost.audio}
                      controls
                      className="w-full h-10"
                      controlsList="nodownload"
                    />
                  </div>
                )}
              </>
            )}

            {/* Link Preview */}
            {finalPost.linkPreview && (
              <div className="mb-4">
                <a
                  href={finalPost.linkPreview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block no-underline hover:opacity-95 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <LinkPreviewCard preview={finalPost.linkPreview} />
                </a>
              </div>
            )}

            {finalPost.poll && (
              <div className="mb-4 border border-gray-200 rounded-xl p-3 bg-gray-50">
                <p className="font-bold text-gray-900 mb-3">{finalPost.poll.question}</p>
                <div className="space-y-2">
                  {finalPost.poll.options.map((option, index) => {
                    const totalVotes = finalPost.poll.options.reduce((acc, opt) => acc + opt.votes.length, 0);
                    const percentage = totalVotes === 0 ? 0 : Math.round((option.votes.length / totalVotes) * 100);
                    const hasVoted = finalPost.poll.options.some(opt => opt.votes.includes(user?._id || user?.id));
                    const isSelected = option.votes.includes(user?._id || user?.id);

                    return (
                      <div key={index} className="relative">
                        {/* Background Progress Bar */}
                        <div
                          className={`absolute top-0 left-0 h-full rounded-lg transition-all duration-500 ${isSelected ? "bg-blue-100" : "bg-gray-200"
                            }`}
                          style={{ width: `${hasVoted ? percentage : 0}%` }}
                        ></div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!hasVoted) handleVote(index);
                          }}
                          disabled={hasVoted}
                          className={`relative w-full flex justify-between items-center px-4 py-2.5 rounded-lg border transition-all z-10 ${isSelected
                            ? "border-[#0ea5e9] text-[#0ea5e9] font-medium"
                            : "border-transparent hover:bg-gray-100 text-gray-700"
                            }`}
                        >
                          <span>{option.text}</span>
                          {hasVoted && <span className="text-sm font-bold">{percentage}%</span>}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-right">
                  {finalPost.poll.options.reduce((acc, opt) => acc + opt.votes.length, 0)} votes
                </p>
              </div>
            )
            }
          </>
        )}

        <div className="flex items-center justify-between mt-4 pt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              likePost(post._id);
            }}
            aria-label="Like Post"
            className={`flex items-center gap-1.5 text-sm font-medium transition ${isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
              }`}
          >
            <Heart className={isLiked ? "fill-current" : ""} size={20} />
            <span className={post.likes.length > 0 ? "" : "hidden sm:inline"}>{post.likes.length > 0 ? post.likes.length : "Like"}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            aria-label="Comment on Post"
            className={`flex items-center gap-1.5 text-sm font-medium transition ${showComments ? "text-[#0ea5e9]" : "text-gray-500 hover:text-[#0ea5e9]"}`}
          >
            <MessageCircle size={20} className={showComments ? "fill-current" : ""} />
            <span className={post.comments?.length > 0 ? "" : "hidden sm:inline"}>{post.comments?.length > 0 ? post.comments.length : "Comment"}</span>
          </button>

          <button
            onClick={handleShare}
            aria-label="Share Post"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#0ea5e9] transition"
          >
            <Share2 size={20} />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              repostPost(displayPost._id);
            }}
            aria-label="Repost"
            className={`flex items-center gap-1.5 text-sm font-medium transition ${isReposted ? "text-green-500" : "text-gray-500 hover:text-green-500"
              }`}
          >
            <Repeat size={20} className={isReposted ? "text-green-500" : ""} />
            <span className={displayPost.reposts?.length > 0 ? "" : "hidden sm:inline"}>{displayPost.reposts?.length > 0 ? displayPost.reposts.length : "Repost"}</span>
          </button>

          <button
            onClick={handleSave}
            aria-label="Save Post"
            className={`text-gray-400 hover:text-[#0ea5e9] transition ${user?.savedPosts?.includes(post._id) ? "text-[#0ea5e9] fill-current" : ""
              }`}
          >
            <Bookmark size={20} className={user?.savedPosts?.includes(post._id) ? "fill-current" : ""} />
          </button>
        </div>

        {showComments && <CommentSection post={post} />}
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Post"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3 rounded-xl">
            <AlertTriangle size={24} />
            <p className="text-sm font-medium">This action cannot be undone.</p>
          </div>
          <p className="text-gray-600">
            Are you sure you want to delete this post? It will be permanently removed from your profile and the feed.
          </p>
          <div className="flex justify-end gap-3 mt-2">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-200"
            >
              Delete Post
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report Post"
      >
        <div className="flex flex-col gap-4">
          <p className="text-gray-600 text-sm">
            Please provide a reason for reporting this post. This will be reviewed by our moderation team.
          </p>
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="e.g. Spam, Harassment, Inappropriate content..."
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none resize-none h-32"
          />
          <div className="flex justify-end gap-3 mt-2">
            <button
              onClick={() => setShowReportModal(false)}
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={submitReport}
              disabled={!reportReason.trim()}
              className="px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Report
            </button>
          </div>
        </div>
      </Modal>

      <MediaCarousel
        isOpen={showCarousel}
        onClose={() => setShowCarousel(false)}
        media={displayPost.media || (displayPost.image ? [{ url: displayPost.image, mediaType: "image" }] : []) || (displayPost.video ? [{ url: displayPost.video, mediaType: "video" }] : [])}
        initialIndex={carouselIndex}
      />
    </>
  );
}
