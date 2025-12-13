import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useStore } from "../store/useStore";
import { MessageCircle, Search, Users, X, Check, Plus, User, Users as UsersIcon, Hash, Music } from "lucide-react";
import Modal from "../components/Modal";
import toast from "react-hot-toast";

export default function Messages() {
    const [conversations, setConversations] = useState([]);
    const [following, setFollowing] = useState([]); // For starting new chats
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("all"); // 'all' | 'people' | 'groups' | 'rooms'
    const navigate = useNavigate();
    const { user: currentUser } = useStore();

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;
            try {
                const [convRes, userRes] = await Promise.all([
                    api.get("/messages/conversations"),
                    api.get(`/users/${currentUser.id || currentUser._id}`)
                ]);

                setConversations(convRes.data);
                setFollowing(userRes.data.user.following || []);
            } catch (err) {
                console.error("Failed to load messages", err);
                toast.error("Failed to load messages");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser]);

    const [showGroupModal, setShowGroupModal] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [groupName, setGroupName] = useState("");

    const startChat = (otherUser) => {
        const ids = [currentUser.id || currentUser._id, otherUser._id].sort();
        const roomId = `dm-${ids[0]}-${ids[1]}`;
        navigate(`/rooms/${roomId}`);
    };

    const toggleUserSelection = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const createGroup = async () => {
        if (!groupName.trim()) return toast.error("Group name is required");
        if (selectedUsers.length === 0) return toast.error("Select at least one member");

        try {
            const res = await api.post("/rooms", {
                name: groupName,
                type: "group",
                members: selectedUsers,
                isPublic: false
            });
            setShowGroupModal(false);
            navigate(`/rooms/${res.data._id}`);
            toast.success("Group created!");
        } catch (err) {
            console.error("Failed to create group", err);
            toast.error("Failed to create group");
        }
    };

    // Filter conversations based on search and tabs
    const filteredConversations = conversations.filter(c => {
        const matchesSearch = c.room.name.toLowerCase().includes(search.toLowerCase());
        const matchesTab =
            activeTab === "all" ? true :
                activeTab === "people" ? c.room.type === "dm" :
                    activeTab === "groups" ? c.room.type === "group" :
                        activeTab === "rooms" ? (c.room.type !== "dm" && c.room.type !== "group") : true;

        return matchesSearch && matchesTab;
    });

    // Also filter 'following' for search results if they don't have a conversation yet
    const filteredFollowing = following.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) &&
        !conversations.some(c => c.room.type === "dm" && c.room.name === u.name) // Basic check, ideally check ID
    );

    if (loading) return <div className="text-center mt-10">Loading...</div>;

    const renderConversationItem = (c) => (
        <div
            key={c.room._id}
            onClick={() => navigate(`/rooms/${c.room._id}`)}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition cursor-pointer relative"
        >
            <div className="relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0 ${c.room.type === 'dm' ? 'bg-gradient-to-br from-[#0ea5e9] to-blue-600' :
                        c.room.type === 'group' ? 'bg-purple-100 text-purple-600' :
                            'bg-orange-100 text-orange-600'
                    }`}>
                    {c.room.image ? (
                        <img src={c.room.image} alt={c.room.name} className="w-full h-full object-cover" />
                    ) : c.room.type === 'dm' ? (
                        c.room.name[0].toUpperCase()
                    ) : c.room.type === 'group' ? (
                        <UsersIcon size={20} />
                    ) : (
                        <Hash size={20} />
                    )}
                </div>
                {/* Online indicator could go here */}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-gray-900 truncate pr-2">{c.room.name}</h3>
                    <span className="text-xs text-gray-400 shrink-0">
                        {new Date(c.lastMessage.createdAt).toLocaleDateString() === new Date().toLocaleDateString()
                            ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : new Date(c.lastMessage.createdAt).toLocaleDateString()}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <p className={`text-sm truncate pr-2 ${c.unreadCount > 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                        {c.lastMessage.sender === (currentUser.id || currentUser._id) && <span className="text-gray-400 font-normal">You: </span>}
                        {c.lastMessage.media ? <span className="italic flex items-center gap-1">📷 Media</span> :
                            c.lastMessage.audio ? <span className="italic flex items-center gap-1">🎤 Voice Message</span> :
                                c.lastMessage.text}
                    </p>
                    {c.unreadCount > 0 && (
                        <span className="bg-[#0ea5e9] text-white text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                            {c.unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <MessageCircle className="text-[#0ea5e9]" size={28} />
                    <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                </div>
                <button
                    onClick={() => setShowGroupModal(true)}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-800 transition"
                >
                    <Plus size={18} /> New Group
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto no-scrollbar">
                {['all', 'people', 'groups', 'rooms'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 px-4 font-medium transition relative capitalize whitespace-nowrap ${activeTab === tab ? "text-[#0ea5e9]" : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {tab}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0ea5e9] rounded-t-full" />}
                    </button>
                ))}
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-4 top-3 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search messages..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-900 focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] outline-none transition"
                />
            </div>

            <div className="space-y-4">
                {/* Active Conversations */}
                {filteredConversations.length > 0 && (
                    <div className="space-y-2">
                        {filteredConversations.map(renderConversationItem)}
                    </div>
                )}

                {/* Show 'Start a new chat' suggestions if searching and no conversation found */}
                {search && filteredConversations.length === 0 && filteredFollowing.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 mt-4">Start a new chat</h3>
                        {filteredFollowing.map(u => (
                            <div
                                key={u._id}
                                onClick={() => startChat(u)}
                                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition cursor-pointer opacity-80 hover:opacity-100"
                            >
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold">
                                    {u.avatar ? <img src={u.avatar} className="w-full h-full rounded-full object-cover" /> : u.name[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{u.name}</h3>
                                    <p className="text-xs text-gray-500">Tap to start chatting</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {filteredConversations.length === 0 && (!search || filteredFollowing.length === 0) && (
                    <div className="text-center py-10 text-gray-500">
                        <MessageCircle size={48} className="mx-auto mb-3 opacity-20" />
                        <p>No messages yet.</p>
                        <p className="text-sm mt-2">Start a chat with someone you follow!</p>
                    </div>
                )}
            </div>

            {/* Create Group Modal */}
            <Modal
                isOpen={showGroupModal}
                onClose={() => setShowGroupModal(false)}
                title="Create New Group"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] outline-none"
                            placeholder="e.g. Weekend Plans"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Members (from following)</label>
                        <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-100 rounded-lg p-2">
                            {following.length > 0 ? (
                                following.map(u => (
                                    <div
                                        key={u._id}
                                        onClick={() => toggleUserSelection(u._id)}
                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${selectedUsers.includes(u._id) ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"}`}
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedUsers.includes(u._id) ? "bg-[#0ea5e9] border-[#0ea5e9]" : "border-gray-300"}`}>
                                            {selectedUsers.includes(u._id) && <Check size={12} className="text-white" />}
                                        </div>
                                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 overflow-hidden">
                                            {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : u.name[0]}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">{u.name}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">Follow users to add them to groups.</p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={createGroup}
                        className="w-full bg-[#0ea5e9] text-white py-2.5 rounded-xl font-bold hover:bg-[#0284c7] transition"
                    >
                        Create Group
                    </button>
                </div>
            </Modal>
        </div>
    );
}
