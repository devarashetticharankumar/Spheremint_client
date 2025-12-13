import { useState, useEffect, useRef } from "react";
import { LogOut, Search, Bell, MessageCircle, User as UserIcon, Heart, UserPlus, Menu, X, Home, Compass, Map, Users, Bookmark, Settings, MessageSquare, Globe } from "lucide-react";
import { useStore } from "../store/useStore";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";

export default function Navbar() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.read).length);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const markRead = async () => {
    if (unreadCount > 0) {
      try {
        await api.put("/notifications/read");
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch (err) {
        console.error("Failed to mark notifications as read", err);
      }
    }
  };

  const handleSearch = (e) => {
    if (e.key === "Enter" && search.trim()) {
      navigate(`/explore?q=${encodeURIComponent(search.trim())}`);
      setSearch("");
      setIsMobileMenuOpen(false);
    }
  };

  const goToProfile = () => {
    navigate("/profile");
    setIsMobileMenuOpen(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "like": return <Heart size={16} className="text-red-500 fill-current" />;
      case "comment": return <MessageCircle size={16} className="text-blue-500" />;
      case "follow": return <UserPlus size={16} className="text-green-500" />;
      case "reply": return <MessageCircle size={16} className="text-purple-500" />;
      case "collab_request": return <UserPlus size={16} className="text-indigo-500" />;
      default: return <Bell size={16} className="text-gray-500" />;
    }
  };

  const getNotificationText = (n) => {
    const name = n.sender?.name || "Someone";
    switch (n.type) {
      case "like": return <span><b>{name}</b> liked your post.</span>;
      case "comment": return <span><b>{name}</b> commented on your post.</span>;
      case "follow": return <span><b>{name}</b> started following you.</span>;
      case "reply": return <span><b>{name}</b> replied to your comment.</span>;
      case "collab_request": return <span><b>{name}</b> invited you to collaborate on a post.</span>;
      default: return <span><b>{name}</b> interacted with you.</span>;
    }
  };

  const handleAcceptCollab = async (notificationId) => {
    try {
      await api.post("/posts/accept-collab", { notificationId });
      toast.success("Collaboration accepted!");
      fetchNotifications();
      window.location.reload();
    } catch (err) {
      console.error("Failed to accept collab", err);
      toast.error(err.response?.data?.message || "Failed to accept collaboration");
    }
  };

  const handleJoinCollab = async (postId, notificationId) => {
    try {
      await api.post(`/posts/${postId}/collab/join`);
      toast.success("You joined the collaboration!");
      fetchNotifications();
      window.location.reload();
    } catch (err) {
      console.error("Failed to join collab", err);
      toast.error(err.response?.data?.message || "Failed to join collaboration");
    }
  };

  const menuItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: Globe, label: "The Sphere", path: "/sphere" },
    { icon: Users, label: "Rooms", path: "/rooms" },
    { icon: MessageSquare, label: "Messages", path: "/messages" },
    { icon: Bookmark, label: "Saved", path: "/saved" },
    { icon: UserIcon, label: "Profile", path: "/profile" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <>
      <nav className="sticky top-0 bg-white border-b border-gray-100 z-50 h-16">
        <div className="max-w-[1600px] mx-auto px-4 h-full flex justify-between items-center">
          {/* Logo & Mobile Menu Button */}
          <div className="flex items-center gap-2 w-64">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2"
            >
              <Menu size={24} />
            </button>
            <img src="/logo.jpg" alt="SphereMint Logo" className="w-10 h-10 rounded-xl" />
            <h1
              onClick={() => navigate("/")}
              className="text-2xl font-bold text-gray-900 cursor-pointer hidden md:block"
            >
              SphereMint
            </h1>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <div className="relative">
              <Search className="absolute left-4 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search posts, rooms, people..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearch}
                className="w-full bg-gray-100 border-none rounded-full py-2.5 pl-12 pr-4 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#0ea5e9]/20 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 w-64 justify-end">
            <button
              onClick={() => navigate("/explore")}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <Search size={22} />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) markRead();
                }}
                className="p-2.5 rounded-full hover:bg-gray-100 text-gray-600 transition relative"
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 z-[60]">
                  <div className="p-3 border-b border-gray-100 font-bold text-gray-900">Notifications</div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">No notifications yet.</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n._id} className={`p-3 hover:bg-gray-50 flex items-start gap-3 transition ${!n.read ? "bg-blue-50/50" : ""}`}>
                          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                            {n.sender?.avatar ? (
                              <img src={n.sender.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-600 text-white text-xs font-bold">
                                {n.sender?.name?.[0] || "U"}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800 leading-snug">{getNotificationText(n)}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>

                            {n.type === "collab_request" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcceptCollab(n._id);
                                }}
                                className="mt-2 bg-indigo-500 text-white text-xs px-3 py-1 rounded-md font-bold hover:bg-indigo-600 transition"
                              >
                                Accept Collab
                              </button>
                            )}

                            {n.type === "mention" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJoinCollab(n.post?._id, n._id);
                                }}
                                className="mt-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs px-3 py-1 rounded-md font-bold hover:opacity-90 transition flex items-center gap-1"
                              >
                                <UserPlus size={12} />
                                Join Collaboration
                              </button>
                            )}
                          </div>
                          <div className="mt-1">{getNotificationIcon(n.type)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate("/messages")}
              className="p-2.5 rounded-full hover:bg-gray-100 text-gray-600 transition"
            >
              <MessageCircle size={22} />
            </button>

            {/* User Avatar */}
            {user && (
              <div
                onClick={goToProfile}
                className="ml-2 cursor-pointer relative group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#0ea5e9] to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-sm overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name[0].toUpperCase()
                  )}
                </div>

                {/* Dropdown for Logout (Simple hover) */}
                <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 py-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <img src="/logo.jpg" alt="SphereMint Logo" className="w-10 h-10 rounded-xl" />
                <h2 className="text-xl font-bold text-gray-900">SphereMint</h2>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <div className="space-y-1 px-3">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        navigate(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-colors ${isActive
                        ? "bg-[#0ea5e9] text-white"
                        : "text-gray-600 hover:bg-gray-50 hover:text-[#0ea5e9]"
                        }`}
                    >
                      <item.icon size={22} />
                      <span className="text-base">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center gap-3 px-3 py-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0ea5e9] to-blue-600 flex items-center justify-center text-white font-bold shadow-sm overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">@{user?.name?.toLowerCase().replace(/\s+/g, '')}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium"
              >
                <LogOut size={22} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
