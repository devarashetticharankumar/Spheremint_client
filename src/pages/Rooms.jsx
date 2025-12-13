import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { useNavigate } from "react-router-dom";
import { Search, Users, Globe, Plus, X, Upload, Image as ImageIcon, Edit, Shield, Mic, Trash2, LogOut, Clock } from "lucide-react";
import api from "../lib/api";
import toast from "react-hot-toast";
import ConfirmationModal from "../components/ConfirmationModal";
import MoodSelector, { MOODS } from "../components/MoodSelector";

export default function Rooms() {
    const navigate = useNavigate();
    const { user } = useStore();

    const [activeTab, setActiveTab] = useState("my");
    const [search, setSearch] = useState("");
    const [cityFilter, setCityFilter] = useState("");
    const [activeMood, setActiveMood] = useState("neutral");
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    // Create/Edit Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRoom, setNewRoom] = useState({
        name: "",
        description: "",
        image: "",
        city: "",
        isPublic: true,
        mood: "neutral",
        duration: "permanent"
    });
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingRoomId, setEditingRoomId] = useState(null);

    // Join Requests Modal
    const [showRequestsModal, setShowRequestsModal] = useState(false);
    const [selectedRoomRequests, setSelectedRoomRequests] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState(null);

    // Members & Admins Modal
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [selectedRoomMembers, setSelectedRoomMembers] = useState([]);
    const [selectedRoomAdmins, setSelectedRoomAdmins] = useState([]);

    // Confirmation Modal
    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        type: "", // 'delete' or 'leave'
        roomId: null,
        roomName: ""
    });

    const handleConfirmAction = async () => {
        const { type, roomId } = confirmationModal;
        if (type === "delete") {
            try {
                await api.delete(`/rooms/${roomId}`);
                toast.success("Room deleted");
                fetchRooms();
            } catch (err) {
                toast.error("Failed to delete room");
            }
        } else if (type === "leave") {
            try {
                await api.post(`/rooms/${roomId}/leave`);
                toast.success("Left room");
                fetchRooms();
            } catch (err) {
                toast.error("Failed to leave room");
            }
        }
        setConfirmationModal({ ...confirmationModal, isOpen: false });
    };

    useEffect(() => {
        fetchRooms();
    }, [cityFilter, activeMood]);

    const fetchRooms = async () => {
        try {
            const moodQuery = activeMood !== "neutral" ? `&mood=${activeMood}` : "";
            const res = await api.get(`/rooms?city=${cityFilter}${moodQuery}`);
            setRooms(res.data);
        } catch (err) {
            console.error("Failed to fetch rooms", err);
            toast.error("Failed to load rooms");
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size should be less than 5MB");
            return;
        }
        setUploading(true);
        try {
            const { data: { uploadUrl, key } } = await api.post("/posts/upload-url", {
                fileName: file.name,
                fileType: file.type,
            });

            await fetch(uploadUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type },
            });

            const imageUrl = `https://${import.meta.env.VITE_AWS_BUCKET_NAME}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${key}`;
            setNewRoom({ ...newRoom, image: imageUrl });
            toast.success("Image uploaded successfully");
        } catch (err) {
            console.error("Upload failed", err);
            toast.error("Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/rooms/${editingRoomId}`, newRoom);
                toast.success("Room updated successfully!");
            } else {
                await api.post("/rooms", newRoom);
                toast.success("Room created successfully!");
            }
            setShowCreateModal(false);
            setNewRoom({ name: "", description: "", image: "", city: "", isPublic: true });
            setIsEditing(false);
            setEditingRoomId(null);
            fetchRooms();
        } catch (err) {
            console.error("Failed to save room", err);
            toast.error(isEditing ? "Failed to update room" : "Failed to create room. Name might be taken.");
        }
    };

    const handleStartSpace = async () => {
        try {
            const res = await api.post("/rooms", {
                name: `${user.name}'s Space`,
                description: "Live Audio Room",
                isPublic: true,
                isVoice: true,
                image: user.avatar || "https://images.unsplash.com/photo-1478737270239-2f02b77ac6b5?w=800&auto=format&fit=crop&q=60"
            });
            navigate(`/voice/${res.data._id}`);
            toast.success("Space started!");
        } catch (err) {
            console.error("Failed to start space", err);
            toast.error("Failed to start space");
        }
    };

    const openEditModal = (room) => {
        setNewRoom({
            name: room.name,
            description: room.description,
            image: room.image || "",
            city: room.city || "",
            isPublic: room.isPublic,
            mood: room.mood || "neutral"
        });
        setEditingRoomId(room.id);
        setIsEditing(true);
        setShowCreateModal(true);
    };

    const openCreateModal = () => {
        setNewRoom({ name: "", description: "", image: "", city: "", isPublic: true, mood: "neutral", duration: "permanent" });
        setIsEditing(false);
        setEditingRoomId(null);
        setShowCreateModal(true);
    };

    const openRequestsModal = async (room) => {
        try {
            const res = await api.get(`/rooms/${room.id}`);
            setSelectedRoomRequests(res.data.joinRequests || []);
            setSelectedRoomId(room.id);
            setShowRequestsModal(true);
        } catch (err) {
            toast.error("Failed to fetch requests");
        }
    };

    const handleApprove = async (userId) => {
        try {
            await api.post("/rooms/approve", { roomId: selectedRoomId, userId });
            toast.success("Request approved");
            setSelectedRoomRequests(prev => prev.filter(u => u._id !== userId));
            fetchRooms();
        } catch (err) {
            toast.error("Failed to approve");
        }
    };

    const handleReject = async (userId) => {
        try {
            await api.post("/rooms/reject", { roomId: selectedRoomId, userId });
            toast.success("Request rejected");
            setSelectedRoomRequests(prev => prev.filter(u => u._id !== userId));
        } catch (err) {
            toast.error("Failed to reject");
        }
    };

    const openMembersModal = async (room) => {
        try {
            const res = await api.get(`/rooms/${room.id}`);
            setSelectedRoomMembers(res.data.members || []);
            setSelectedRoomAdmins(res.data.admins || []);
            setSelectedRoomId(room.id);
            setShowMembersModal(true);
        } catch (err) {
            toast.error("Failed to fetch members");
        }
    };

    const handlePromote = async (userId) => {
        try {
            await api.post("/rooms/promote", { roomId: selectedRoomId, userId });
            toast.success("User promoted to Admin");
            setSelectedRoomAdmins(prev => [...prev, userId]);
        } catch (err) {
            toast.error("Failed to promote");
        }
    };

    const handleDemote = async (userId) => {
        try {
            await api.post("/rooms/demote", { roomId: selectedRoomId, userId });
            toast.success("User demoted");
            setSelectedRoomAdmins(prev => prev.filter(id => id !== userId));
        } catch (err) {
            toast.error("Failed to demote");
        }
    };

    const filteredRooms = rooms.filter((room) => {
        const matchesSearch = room.name.toLowerCase().includes(search.toLowerCase());
        const matchesCity = cityFilter ? room.city?.toLowerCase().includes(cityFilter.toLowerCase()) : true;

        if (!matchesSearch || !matchesCity) return false;

        if (activeTab === "my") return room.category === "my";

        // For discovery tabs, show rooms that match the type
        // You can choose to show ALL rooms of that type or just 'discover' (unjoined)
        // Showing ALL gives a better directory feel.
        // Let's show ALL public/voice/private rooms in their respective tabs, even if joined.

        if (activeTab === "public") return room.isPublic && !room.isVoice;
        if (activeTab === "voice") return room.isVoice;
        if (activeTab === "private") return !room.isPublic && !room.isVoice;

        return false;
    });

    return (
        <div className="max-w-6xl mx-auto px-6 py-8 relative">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Social Circles</h1>
                    <p className="text-gray-500 text-lg">
                        Find your crowd. Join the conversation.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleStartSpace}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-sm flex items-center gap-2 transition"
                    >
                        <Mic size={20} /> Start Space
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-6 py-3 rounded-xl font-bold shadow-sm flex items-center gap-2 transition"
                    >
                        <Plus size={20} /> Create Room
                    </button>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search rooms..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-900 focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] outline-none transition text-lg"
                    />
                </div>
                <div className="w-1/3">
                    <input
                        type="text"
                        placeholder="Filter by City..."
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-900 focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] outline-none transition text-lg"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-1">
                {[
                    { id: "my", label: "My Rooms", icon: Users },
                    { id: "public", label: "Public", icon: Globe },
                    { id: "voice", label: "Voice Spaces", icon: Mic },
                    { id: "private", label: "Private", icon: Shield },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold text-sm transition-all relative top-[1px] ${activeTab === tab.id
                            ? "bg-white text-[#0ea5e9] border border-gray-200 border-b-white shadow-sm z-10"
                            : "text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border border-transparent"
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Mood Filter */}
            <div className="mb-6 overflow-x-auto">
                <MoodSelector selectedMood={activeMood} onSelect={setActiveMood} />
            </div>

            {/* Rooms Grid */}
            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading rooms...</div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRooms.map((room) => (
                        <div
                            key={room.id}
                            className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
                            onClick={() => {
                                if (room.isVoice) {
                                    navigate(`/voice/${room.id}`);
                                } else if (room.category === "my" || room.isPublic) {
                                    navigate(`/rooms/${room.id}`);
                                }
                            }}
                        >
                            <div className="h-48 overflow-hidden relative">
                                <img
                                    src={room.image || "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=60"}
                                    alt={room.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-700 flex items-center gap-1 shadow-sm">
                                    {room.isPublic ? <Globe size={12} /> : <Users size={12} />}
                                    {room.isPublic ? "Public" : "Private"}
                                    {room.city && <span className="ml-1 border-l border-gray-300 pl-1">{room.city}</span>}
                                </div>
                                {room.isVoice && (
                                    <div className="absolute bottom-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm animate-pulse">
                                        <Mic size={12} /> Live Space
                                    </div>
                                )}
                                {room.expiresAt && (
                                    <div className="absolute bottom-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                                        <Clock size={12} />
                                        {new Date(room.expiresAt) > new Date()
                                            ? `Expires in ${Math.ceil((new Date(room.expiresAt) - new Date()) / (1000 * 60 * 60))}h`
                                            : "Expiring soon"}
                                    </div>
                                )}
                            </div>

                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{room.name}</h3>
                                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{room.description}</p>

                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                                    <div className="flex items-center gap-1.5">
                                        <Users size={16} />
                                        <span>{room.members} members</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        <span className="text-green-600 font-medium">{room.online || 0} online</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <span className="text-xs text-gray-400 font-medium">
                                        Active {room.active || "recently"}
                                    </span>
                                    <div className="flex items-center gap-2">

                                        {room.creator === (user?._id || user?.id) ? (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditModal(room);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-[#0ea5e9] hover:bg-blue-50 rounded-full transition"
                                                    title="Edit Room"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                {!room.isPublic && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openRequestsModal(room);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-[#0ea5e9] hover:bg-blue-50 rounded-full transition relative"
                                                        title="Join Requests"
                                                    >
                                                        <Users size={18} />
                                                        {room.joinRequests?.length > 0 && (
                                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                                {room.joinRequests.length}
                                                            </span>
                                                        )}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openMembersModal(room);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-[#0ea5e9] hover:bg-blue-50 rounded-full transition"
                                                    title="Manage Members"
                                                >
                                                    <Shield size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmationModal({
                                                            isOpen: true,
                                                            type: "delete",
                                                            roomId: room.id,
                                                            roomName: room.name
                                                        });
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                                                    title="Delete Room"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            room.category === "my" && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmationModal({
                                                            isOpen: true,
                                                            type: "leave",
                                                            roomId: room.id,
                                                            roomName: room.name
                                                        });
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                                                    title="Leave Room"
                                                >
                                                    <LogOut size={18} />
                                                </button>
                                            )
                                        )}
                                        {room.category === "my" ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (room.isVoice) {
                                                        navigate(`/voice/${room.id}`);
                                                    } else {
                                                        navigate(`/rooms/${room.id}`);
                                                    }
                                                }}
                                                className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-5 py-2 rounded-full font-bold text-sm transition shadow-sm hover:shadow-md"
                                            >
                                                {room.isVoice ? "Join Space" : "Open Room"}
                                            </button>
                                        ) : room.isPublic ? (
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        await api.post(`/rooms/${room.id}/join`);
                                                        toast.success("Joined room successfully!");
                                                        // Refresh to update category to "my"
                                                        fetchRooms();
                                                        // Optional: navigate immediately
                                                        if (room.isVoice) {
                                                            navigate(`/voice/${room.id}`);
                                                        } else {
                                                            navigate(`/rooms/${room.id}`);
                                                        }
                                                    } catch (err) {
                                                        toast.error("Failed to join room");
                                                    }
                                                }}
                                                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-full font-bold text-sm transition shadow-sm hover:shadow-md"
                                            >
                                                {room.isVoice ? "Join Space" : "Join Group"}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        const res = await api.post(`/rooms/${room.id}/join`);
                                                        toast.success(res.data.message || "Join request sent!");
                                                    } catch (err) {
                                                        toast.error(err.response?.data?.message || "Failed to send request");
                                                    }
                                                }}
                                                className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2 rounded-full font-bold text-sm transition shadow-sm hover:shadow-md"
                                            >
                                                Request to Join
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Room Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {isEditing ? "Edit Room" : "Create New Room"}
                            </h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateRoom} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Room Vibe (Mood)</label>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                                    <MoodSelector selectedMood={newRoom.mood} onSelect={(m) => setNewRoom({ ...newRoom, mood: m })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newRoom.name}
                                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] outline-none"
                                    placeholder="e.g. Tech Talk"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    required
                                    value={newRoom.description}
                                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] outline-none resize-none"
                                    rows="3"
                                    placeholder="What's this room about?"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City (Optional)</label>
                                    <input
                                        type="text"
                                        value={newRoom.city}
                                        onChange={(e) => setNewRoom({ ...newRoom, city: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] outline-none"
                                        placeholder="e.g. Hyderabad"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Privacy</label>
                                    <select
                                        value={newRoom.isPublic}
                                        onChange={(e) => setNewRoom({ ...newRoom, isPublic: e.target.value === "true" })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] outline-none"
                                    >
                                        <option value="true">Public</option>
                                        <option value="false">Private</option>
                                    </select>
                                </div>
                            </div>

                            {!isEditing && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (HyperRoom)</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { id: "permanent", label: "Forever" },
                                            { id: "24h", label: "24 Hours" },
                                            { id: "3d", label: "3 Days" },
                                            { id: "1w", label: "1 Week" }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setNewRoom({ ...newRoom, duration: opt.id })}
                                                className={`py-2 px-1 text-sm font-medium rounded-lg border transition ${newRoom.duration === opt.id
                                                    ? "bg-gray-900 text-white border-gray-900"
                                                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {newRoom.duration !== "permanent"
                                            ? "⚠️ This room will automatically disappear after the set time."
                                            : "This room will exist until you delete it."}
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-[#0ea5e9] transition-colors cursor-pointer relative bg-gray-50 group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="space-y-1 text-center">
                                        {uploading ? (
                                            <div className="flex flex-col items-center">
                                                <div className="w-8 h-8 border-2 border-[#0ea5e9] border-t-transparent rounded-full animate-spin mb-2"></div>
                                                <p className="text-sm text-gray-500">Uploading...</p>
                                            </div>
                                        ) : newRoom.image ? (
                                            <div className="relative">
                                                <img src={newRoom.image} alt="Preview" className="mx-auto h-32 object-cover rounded-lg shadow-sm" />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-lg">
                                                    <p className="text-white font-medium text-sm">Click to change</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                                <div className="flex text-sm text-gray-600 justify-center">
                                                    <span className="font-medium text-[#0ea5e9]">Upload a file</span>
                                                    <p className="pl-1">or drag and drop</p>
                                                </div>
                                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] disabled:opacity-70 text-white font-bold py-3 rounded-xl transition mt-4"
                            >
                                {isEditing ? "Save Changes" : "Create Room"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Join Requests Modal */}
            {showRequestsModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Join Requests</h2>
                            <button onClick={() => setShowRequestsModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            {selectedRoomRequests.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No pending requests</p>
                            ) : (
                                selectedRoomRequests.map((request) => (
                                    <div key={request._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={request.avatar || "https://i.imgur.com/6vbOq2C.png"}
                                                alt={request.name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <div>
                                                <h4 className="font-bold text-gray-900">{request.name}</h4>
                                                <p className="text-xs text-gray-500">@{request.username || "user"}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(request._id)}
                                                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleReject(request._id)}
                                                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Members Modal */}
            {showMembersModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Manage Members</h2>
                            <button onClick={() => setShowMembersModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            {selectedRoomMembers.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No members yet</p>
                            ) : (
                                selectedRoomMembers.map((member) => (
                                    <div key={member._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={member.avatar || "https://i.imgur.com/6vbOq2C.png"}
                                                alt={member.name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <div>
                                                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                                    {member.name}
                                                    {selectedRoomAdmins.includes(member._id) && (
                                                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">Admin</span>
                                                    )}
                                                </h4>
                                                <p className="text-xs text-gray-500">@{member.username || "user"}</p>
                                            </div>
                                        </div>
                                        {member._id !== (user?._id || user?.id) && rooms.find(r => r.id === selectedRoomId)?.creator === (user?._id || user?.id) && (
                                            <div>
                                                {selectedRoomAdmins.includes(member._id) ? (
                                                    <button
                                                        onClick={() => handleDemote(member._id)}
                                                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                                                    >
                                                        Demote
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handlePromote(member._id)}
                                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                    >
                                                        Make Admin
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                onClose={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
                onConfirm={handleConfirmAction}
                title={confirmationModal.type === "delete" ? "Delete Room?" : "Leave Room?"}
                message={confirmationModal.type === "delete"
                    ? `Are you sure you want to permanently delete "${confirmationModal.roomName}"? This action cannot be undone.`
                    : `Are you sure you want to leave "${confirmationModal.roomName}"?`}
                confirmText={confirmationModal.type === "delete" ? "Delete" : "Leave"}
                confirmColor="red"
            />

        </div>
    );
}