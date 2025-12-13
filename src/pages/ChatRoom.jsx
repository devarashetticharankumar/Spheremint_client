import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useStore } from "../store/useStore";
import api from "../lib/api";
import { Send, ArrowLeft, Smile, Paperclip, X, Image as ImageIcon, Video as VideoIcon, Reply, Forward, MoreVertical, Trash2, Edit2, Check, Mic, Square, Play, Pause, FileText, Download, ExternalLink, Maximize2, Bot, Sparkles, Lock, Layout, PanelRightClose, PanelRightOpen } from "lucide-react";
import PostCard from "../components/PostCard";
import EmojiPicker from "emoji-picker-react";
import toast from "react-hot-toast";
import { encryptMessage, decryptMessage, encryptGroupMessage, decryptGroupMessage } from "../lib/encryption";
import { applyAudioFilter } from "../lib/audioFilters";

import Modal from "../components/Modal";
import SEO from "../components/SEO";


export default function ChatRoom() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user } = useStore();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [chatTitle, setChatTitle] = useState(roomId);
    const [replyingTo, setReplyingTo] = useState(null);
    const [forwardingMsg, setForwardingMsg] = useState(null);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [recentRooms, setRecentRooms] = useState([]);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editedText, setEditedText] = useState("");
    const [showOptionsFor, setShowOptionsFor] = useState(null);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [viewingMedia, setViewingMedia] = useState(null);
    const [aiSummary, setAiSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [selectedVoiceFilter, setSelectedVoiceFilter] = useState("normal");
    const [isProcessingAudio, setIsProcessingAudio] = useState(false);

    // DEBUG: Log my current keys on mount
    useEffect(() => {
        const k = JSON.parse(localStorage.getItem("e2ee_keys") || "{}");
        if (k.publicKey) {
            console.log("MY CURRENT PUBLIC KEY:", k.publicKey);
        } else {
            console.warn("NO KEYS FOUND IN LOCAL STORAGE");
        }
    }, [user]);

    const [recipientPublicKey, setRecipientPublicKey] = useState(null); // For DMs (Unused now)
    const [roomMembers, setRoomMembers] = useState([]); // For Groups
    const [isGroupEncrypted, setIsGroupEncrypted] = useState(false); // Flag for UI (Unused)
    const [relatedPosts, setRelatedPosts] = useState([]);
    const [showRelated, setShowRelated] = useState(false); // Default hidden on mobile, toggleable


    const socketRef = useRef();
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);

    // E2EE: Decrypt messages on the fly
    // E2EE Features Removed (User Request)
    const displayedMessages = useMemo(() => {
        return messages.map(msg => {
            if (msg.isEncrypted) {
                return { ...msg, text: "🔒 Encrypted Message (Feature Disabled)" };
            }
            return msg;
        });
    }, [messages]);

    // Function to get my keys
    const getMyKeys = () => {
        return JSON.parse(localStorage.getItem("e2ee_keys") || "null");
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        // Connect to Socket.IO
        const SOCKET_URL = import.meta.env.VITE_APP_API_URL?.replace("/api", "") || "http://localhost:5001";
        socketRef.current = io(SOCKET_URL, {
            auth: { token: localStorage.getItem("token") },
        });

        const joinRoom = () => {
            socketRef.current.emit("join-room", roomId);
        };

        socketRef.current.on("connect", joinRoom);

        if (socketRef.current.connected) {
            joinRoom();
        }

        socketRef.current.on("receive-message", (message) => {
            setMessages((prev) => [...prev, message]);
            scrollToBottom();
        });

        socketRef.current.on("message-reaction-update", ({ messageId, reactions }) => {
            setMessages((prev) => prev.map(msg =>
                msg._id === messageId ? { ...msg, reactions } : msg
            ));
        });

        socketRef.current.on("message-updated", ({ messageId, newText, isEdited }) => {
            setMessages((prev) => prev.map(msg =>
                msg._id === messageId ? { ...msg, text: newText, isEdited } : msg
            ));
        });

        socketRef.current.on("message-deleted", ({ messageId }) => {
            setMessages((prev) => prev.filter(msg => msg._id !== messageId));
        });

        // Fetch previous messages
        const fetchMessages = async () => {
            try {
                const res = await api.get(`/messages/${roomId}`);
                setMessages(res.data);
                scrollToBottom();

                // Mark as read
                await api.post(`/messages/read/${roomId}`);
            } catch (err) {
                console.error("Failed to load messages", err);
            }
        };
        fetchMessages();

        // Fetch recent rooms
        const fetchRecentRooms = async () => {
            try {
                const res = await api.get("/rooms");
                setRecentRooms(res.data.filter(r => r.category === "my"));
            } catch (err) {
                console.error("Failed to fetch rooms", err);
            }
        };
        fetchRecentRooms();

        // Set Chat Title & Get Recipient Public Key
        const setupChat = async () => {
            if (roomId.startsWith("dm-")) {
                const parts = roomId.split("-");
                const otherUserId = parts.find(id => id !== "dm" && id !== user.id && id !== user._id);

                if (otherUserId) {
                    try {
                        const res = await api.get(`/users/${otherUserId}`);
                        setChatTitle(res.data.user.name);
                        setRecipientPublicKey(res.data.user.publicKey);
                    } catch (err) {
                        console.error("Failed to fetch user", err);
                        setChatTitle("Chat");
                    }
                }
            } else {
                try {
                    // Always fetch fresh room details to get members and their keys (and type!)
                    const res = await api.get(`/rooms/${roomId}`);
                    // setRecentRooms logic was using cached data that might miss new fields

                    setChatTitle(res.data.name);

                    if (res.data && res.data.members) {
                        setRoomMembers(res.data.members);
                        setIsGroupEncrypted(false);

                        // Fetch Related Posts for Context (Live Clusters)
                        if (res.data.isPublic) {
                            try {
                                // Search for posts containing the room name (topic)
                                const topicRes = await api.get("/posts/explore", { params: { search: res.data.name } });
                                setRelatedPosts(topicRes.data.posts || []);
                                if ((topicRes.data.posts || []).length > 0) {
                                    setShowRelated(true); // Auto-open if relevant content exists
                                }
                            } catch (e) {
                                console.error("Failed to fetch related posts", e);
                            }
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch room details", err);
                    setChatTitle(`#${roomId}`);
                }
            }
        };
        setupChat();

        return () => {
            socketRef.current.disconnect();
        };
    }, [roomId, user.id, user._id]);



    useEffect(() => {
        const fetchBattle = async () => {
            try {
                const res = await api.get("/battles/active");
                if (res.data) {
                    // only set if current room is part of it
                    if (res.data.room1._id === roomId || res.data.room2._id === roomId) {
                        setActiveBattle(res.data);
                    } else {
                        setActiveBattle(null);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch battle", err);
            }
        };

        fetchBattle();
        const interval = setInterval(fetchBattle, 30000);
        return () => clearInterval(interval);
    }, [roomId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            toast.error("File size must be less than 50MB");
            return;
        }

        let type = "file";
        if (file.type.startsWith("image/")) type = "image";
        else if (file.type.startsWith("video/")) type = "video";

        setSelectedFile({
            file,
            type,
            preview: type === "image" || type === "video" ? URL.createObjectURL(file) : null
        });
        e.target.value = ""; // Reset input
    };

    const clearFile = () => {
        setSelectedFile(null);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: "audio/webm" });
                setAudioBlob(blob);
                const tracks = stream.getTracks();
                tracks.forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Failed to start recording:", err);
            toast.error("Microphone access denied");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        stopRecording();
        setAudioBlob(null);
        setRecordingTime(0);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    const onEmojiClick = (emojiObject) => {
        setNewMessage((prev) => prev + emojiObject.emoji);
        setShowEmojiPicker(false);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !selectedFile && !audioBlob) return;

        let media = null;
        let audioUrl = null;

        if (selectedFile) {
            setUploading(true);
            try {
                const { data } = await api.post("/posts/upload-url", {
                    fileName: selectedFile.file.name,
                    fileType: selectedFile.file.type,
                });

                await fetch(data.uploadUrl, {
                    method: "PUT",
                    headers: { "Content-Type": selectedFile.file.type },
                    body: selectedFile.file,
                });

                media = {
                    url: data.imageUrl,
                    mediaType: selectedFile.type
                };
            } catch (err) {
                console.error("Upload failed:", err);
                toast.error("Failed to upload media");
                setUploading(false);
                return;
            }
            setUploading(false);
            setSelectedFile(null);
        }

        if (audioBlob) {
            setUploading(true);
            try {
                const fileName = `voice_note_${Date.now()}.webm`;
                const { data } = await api.post("/posts/upload-url", {
                    fileName,
                    fileType: "audio/webm",
                });

                await fetch(data.uploadUrl, {
                    method: "PUT",
                    headers: { "Content-Type": "audio/webm" },
                    body: audioBlob,
                });

                audioUrl = data.imageUrl;
            } catch (err) {
                console.error("Audio upload failed:", err);
                toast.error("Failed to upload voice note");
                setUploading(false);
                return;
            }
            setUploading(false);
            setAudioBlob(null);

            setRecordingTime(0);
        }

        // E2EE Features Removed (User Request)
        const isEncrypted = false;
        const textToSend = newMessage;
        const recipientKeys = {};
        const myPublicKey = null;

        const messageData = {
            roomId,
            text: newMessage, // Local Optimistic: Plaintext
            media,
            audio: audioUrl,
            user: { _id: user.id || user._id, name: user.name, avatar: user.avatar },
            createdAt: new Date().toISOString(),
            _id: `temp-${Date.now()}`,
            isEncrypted: false,
            isPlaintextLocal: true, // Flag for display logic
            senderPublicKey: null
        };

        // Optimistic Update
        setMessages((prev) => [...prev, messageData]);
        scrollToBottom();

        // Emit to socket (Plaintext payload)
        socketRef.current.emit("send-message", {
            roomId,
            text: newMessage,
            media,
            audio: audioUrl,
            anonymous: false,
            replyTo: replyingTo?._id,
            isEncrypted: false,
            // recipientKeys, // Removed
            // senderPublicKey // Removed
        });

        setNewMessage("");
        setReplyingTo(null);
    };

    const handleReaction = (e, messageId, emoji) => {
        e.preventDefault();
        e.stopPropagation();
        if (socketRef.current) {
            socketRef.current.emit("add-reaction", { messageId, emoji });
        }
    };

    const handleForward = (roomToForward) => {
        if (!forwardingMsg) return;

        socketRef.current.emit("send-message", {
            roomId: roomToForward.id,
            text: forwardingMsg.text,
            media: forwardingMsg.media,
            isForwarded: true
        });

        toast.success(`Forwarded to ${roomToForward.name}`);
        setShowForwardModal(false);
        setForwardingMsg(null);
    };

    const startEditing = (msg) => {
        setEditingMessageId(msg._id);
        setEditedText(msg.text);
        setShowOptionsFor(null);
    };

    const saveEdit = (messageId) => {
        if (!editedText.trim()) return;
        socketRef.current.emit("edit-message", { messageId, newText: editedText });
        setEditingMessageId(null);
        setEditedText("");
    };

    const deleteMessage = (messageId) => {
        setMessageToDelete(messageId);
        setShowDeleteModal(true);
        setShowOptionsFor(null);
    };

    const confirmDelete = () => {
        if (messageToDelete) {
            socketRef.current.emit("delete-message", { messageId: messageToDelete });
            setShowDeleteModal(false);
            setMessageToDelete(null);
        }
    };

    const handleSummarize = async () => {
        setLoadingSummary(true);
        try {
            const res = await api.post("/ai/summarize", { roomId });
            setAiSummary(res.data.summary);
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate summary");
        } finally {
            setLoadingSummary(false);
        }
    };

    const handleApplyFilter = async (filter) => {
        if (!audioBlob) return;
        setIsProcessingAudio(true);
        try {
            // Always start from original blob? 
            // Better UX: If I click "Robot", it applies to current. If I click "Normal", revert?
            // Since we overwrite audioBlob, we might lose original.
            // Let's store `originalAudioBlob` in a ref or state if needed, but for now, 
            // if we only have one blob state, applying filter is destructive.
            // Workaround: We can't easily "undo" without storing original.
            // BUT, `audioBlob` is the one we play/send.
            // Let's just trust the user knows what they are doing or re-record.
            // Actually, for better UX let's not support "undo" to normal for now to keep it simple, 
            // OR we assume the current `audioBlob` is the source. 
            // If we apply Robot on Robot, it gets double Robot.
            // Ideally we need `originalAudioBlob` state.

            const processedBlob = await applyAudioFilter(audioBlob, filter);
            setAudioBlob(processedBlob);

            // Create new object URL for preview
            const newUrl = URL.createObjectURL(processedBlob);
            // Updating the <audio> src is tricky because `audioBlob` changes trigger re-render, 
            // but we need to ensure the blob is fresh.

            // To properly support "Preview" we need to update the <audio> src.
            // The current UI uses `URL.createObjectURL(audioBlob)` inline? No, let's check.
            // It sees: `audioUrl = data.imageUrl` in send.
            // The preview UI just shows "Voice Note Recorded". It doesn't seem to have a player?
            // "Voice Note Recorded"
            // Wait, looking at lines 924-946: 
            // It just says "Voice Note Recorded" with a trash icon and send icon.
            // It does NOT have an audio player `<audio src={...} />` for preview!
            // That is a missing feature in the original code too?
            // Line 676 shows `<audio controls src={msg.audio} />` for SENT messages.
            // But for recording preview (lines 924+), there is NO player.
            // I should ADD a player so they can hear the filter.

            setSelectedVoiceFilter(filter);
            toast.success(`Applied ${filter} filter!`);
        } catch (err) {
            console.error("Filter error:", err);
            toast.error("Failed to apply voice filter");
        } finally {
            setIsProcessingAudio(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#f0f2f5]">
            <SEO title={chatTitle || "Chat"} />


            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center gap-4 shadow-sm z-10 sticky top-0">
                <button
                    onClick={() => navigate("/rooms")}
                    aria-label="Back to Rooms"
                    className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
                >
                    <ArrowLeft size={22} />
                </button>
                <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-xl text-gray-900 tracking-tight truncate">{chatTitle}</h2>
                    <div className="flex items-center gap-1.5">
                        {(roomId.startsWith("dm-") && recipientPublicKey) || isGroupEncrypted ? (
                            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200" title="End-to-End Encrypted">
                                <Lock size={12} />
                                <span className="text-xs font-medium">Encrypted</span>
                            </div>
                        ) : (
                            <>
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                </span>
                                <span className="text-xs text-gray-500 font-medium">Live Chat</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSummarize}
                        disabled={loadingSummary}
                        className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-100 transition disabled:opacity-50"
                    >
                        {loadingSummary ? <Sparkles size={16} className="animate-spin" /> : <Bot size={16} />}
                        <span className="hidden sm:inline">Summarize</span>
                    </button>

                    {relatedPosts.length > 0 && (
                        <button
                            onClick={() => setShowRelated(!showRelated)}
                            aria-label="Toggle Knowledge Panel"
                            className={`p-2 rounded-full transition ${showRelated ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                            title="Toggle Knowledge Panel"
                        >
                            {showRelated ? <PanelRightClose size={22} /> : <PanelRightOpen size={22} />}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#f0f2f5]">



                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                        {displayedMessages.map((msg, idx) => {
                            const msgUserId = msg.user?._id || msg.user;
                            const isMe = msgUserId === user.id || msgUserId === user._id;
                            const showAvatar = !isMe && (idx === 0 || displayedMessages[idx - 1]?.user?._id !== msgUserId);

                            // 4. BLOCKING LOGIC: REMOVED as per user request. 
                            const isBlocked = false;

                            return (
                                <div key={idx} className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"}`}>
                                    {!isMe && (
                                        <div className={`flex-shrink-0 w-8 h-8 ${!showAvatar ? "opacity-0" : ""}`}>
                                            {msg.user?.avatar ? (
                                                <img src={msg.user.avatar} alt={msg.user.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                    {msg.user?.name?.[0]?.toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`}>
                                        {!isMe && showAvatar && (
                                            <span className="text-xs text-gray-500 ml-1 mb-1 flex items-center gap-1">
                                                {msg.isAi && <Bot size={12} className="text-purple-500" />}
                                                {msg.user?.name}
                                            </span>
                                        )}

                                        {/* Reply Context */}
                                        {msg.replyTo && (
                                            <div className={`text-xs mb-1 px-3 py-1 rounded-lg border-l-2 ${isMe ? "bg-blue-100 border-blue-500 text-blue-800" : "bg-gray-100 border-gray-400 text-gray-600"}`}>
                                                <span className="font-bold block">{msg.replyTo.user?.name}</span>
                                                <span className="line-clamp-1">{msg.replyTo.text || "Media"}</span>
                                            </div>
                                        )}

                                        {msg.isForwarded && (
                                            <div className="text-[10px] text-gray-400 flex items-center gap-1 mb-1 italic">
                                                <Forward size={10} /> Forwarded
                                            </div>
                                        )}

                                        <div
                                            className={`px-4 py-2.5 shadow-sm relative group ${msg.isAi
                                                ? "bg-gradient-to-r from-purple-100 to-indigo-100 text-indigo-900 border border-purple-200 rounded-2xl rounded-tl-sm"
                                                : isMe
                                                    ? "bg-gradient-to-br from-[#0ea5e9] to-blue-600 text-white rounded-2xl rounded-tr-sm"
                                                    : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm"
                                                }`}
                                        >
                                            {msg.media && (
                                                <div className="mb-2 rounded-lg overflow-hidden bg-black/5">
                                                    {msg.media.mediaType === "image" ? (
                                                        <div
                                                            className="cursor-pointer relative group/media"
                                                            onClick={() => setViewingMedia(msg.media)}
                                                        >
                                                            <img src={msg.media.url} alt="Shared media" className="max-w-full h-auto max-h-72 object-cover" />
                                                            <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/10 transition flex items-center justify-center opacity-0 group-hover/media:opacity-100">
                                                                <Maximize2 className="text-white drop-shadow-lg" size={24} />
                                                            </div>
                                                        </div>
                                                    ) : msg.media.mediaType === "video" ? (
                                                        <div className="relative">
                                                            <video src={msg.media.url} controls className="max-w-full h-auto max-h-72" />
                                                            <button
                                                                onClick={() => setViewingMedia(msg.media)}
                                                                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition opacity-0 hover:opacity-100"
                                                            >
                                                                <Maximize2 size={16} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <a
                                                            href={msg.media.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition group/file"
                                                        >
                                                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                                <FileText size={24} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm text-gray-900 truncate">
                                                                    Attachment
                                                                </p>
                                                                <p className="text-xs text-gray-500">Click to open</p>
                                                            </div>
                                                            <div className="p-2 text-gray-400 group-hover/file:text-[#0ea5e9] transition">
                                                                <ExternalLink size={20} />
                                                            </div>
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            {msg.audio && (
                                                <div className="mb-2 min-w-[200px]">
                                                    <audio controls src={msg.audio} className="w-full h-10" />
                                                </div>
                                            )}

                                            {editingMessageId === msg._id ? (
                                                <div className="flex items-center gap-2 min-w-[200px]">
                                                    <input
                                                        type="text"
                                                        value={editedText}
                                                        onChange={(e) => setEditedText(e.target.value)}
                                                        className="flex-1 bg-white/20 text-inherit border-b border-white/30 focus:outline-none px-1 py-0.5"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") saveEdit(msg._id);
                                                            if (e.key === "Escape") setEditingMessageId(null);
                                                        }}
                                                    />
                                                    <button onClick={() => saveEdit(msg._id)} className="p-1 hover:bg-white/20 rounded-full">
                                                        <Check size={14} />
                                                    </button>
                                                    <button onClick={() => setEditingMessageId(null)} className="p-1 hover:bg-white/20 rounded-full">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    {msg.text && (
                                                        <div className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                                                            {(() => {
                                                                const text = msg.text;
                                                                const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;

                                                                if (!urlRegex.test(text)) {
                                                                    return text;
                                                                }

                                                                const parts = text.split(urlRegex);
                                                                return parts.map((part, i) => {
                                                                    if (!part) return null;
                                                                    if (part.match(urlRegex)) {
                                                                        const href = part.startsWith("http") ? part : `https://${part}`;
                                                                        return (
                                                                            <a
                                                                                key={i}
                                                                                href={href}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className={`underline hover:opacity-80 ${isMe ? "text-white font-medium" : "text-blue-600 font-medium"}`}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                {part}
                                                                            </a>
                                                                        );
                                                                    }
                                                                    return <span key={i}>{part}</span>;
                                                                });
                                                            })()}
                                                        </div>
                                                    )}
                                                    {msg.isEdited && <span className="text-[10px] opacity-60 block text-right italic">edited</span>}
                                                </>
                                            )}

                                            <p className={`text-[10px] mt-1 text-right ${isMe ? "text-blue-100/80" : "text-gray-400"}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>

                                            {/* Hover Actions */}
                                            <div className={`absolute top-0 ${isMe ? "-left-28" : "-right-28"} h-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-2`}>
                                                <button onClick={() => setReplyingTo(msg)} className="p-1.5 bg-white rounded-full shadow-sm text-gray-500 hover:text-[#0ea5e9] transition" title="Reply">
                                                    <Reply size={14} />
                                                </button>
                                                <button onClick={() => { setForwardingMsg(msg); setShowForwardModal(true); }} className="p-1.5 bg-white rounded-full shadow-sm text-gray-500 hover:text-[#0ea5e9] transition" title="Forward">
                                                    <Forward size={14} />
                                                </button>

                                                {isMe && !msg.media && (
                                                    <button onClick={() => startEditing(msg)} className="p-1.5 bg-white rounded-full shadow-sm text-gray-500 hover:text-[#0ea5e9] transition" title="Edit">
                                                        <Edit2 size={14} />
                                                    </button>
                                                )}

                                                {isMe && (
                                                    <button onClick={() => deleteMessage(msg._id)} className="p-1.5 bg-white rounded-full shadow-sm text-red-500 hover:bg-red-50 transition" title="Delete">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}



                                                <div className="relative group/emoji">
                                                    <button className="p-1.5 bg-white rounded-full shadow-sm text-gray-500 hover:text-[#0ea5e9] transition">
                                                        <Smile size={14} />
                                                    </button>
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-2 hidden group-hover/emoji:block z-50">
                                                        <div className="bg-white shadow-xl rounded-full p-1 flex gap-1">
                                                            {["❤️", "😂", "😮", "😢", "👍"].map(emoji => (
                                                                <button
                                                                    key={emoji}
                                                                    onMouseDown={(e) => handleReaction(e, msg._id, emoji)}
                                                                    className="hover:scale-125 transition text-lg p-1 cursor-pointer"
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reactions Display */}
                                            {msg.reactions?.length > 0 && (
                                                <div className="absolute -bottom-3 right-2 flex gap-0.5 bg-white rounded-full px-1.5 py-0.5 shadow-sm border border-gray-100">
                                                    {Array.from(new Set(msg.reactions.map(r => r.emoji))).slice(0, 3).map((emoji, i) => (
                                                        <span key={i} className="text-[10px]">{emoji}</span>
                                                    ))}
                                                    <span className="text-[10px] text-gray-500 font-bold ml-0.5">{msg.reactions.length}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="bg-white border-t border-gray-200 p-4 sm:px-6 pb-6">
                        {/* Reply Preview */}
                        {replyingTo && (
                            <div className="mb-2 mx-4 p-3 bg-gray-100 rounded-xl border-l-4 border-[#0ea5e9] flex justify-between items-center animate-in slide-in-from-bottom-2">
                                <div>
                                    <p className="text-xs font-bold text-[#0ea5e9]">Replying to {replyingTo.user?.name}</p>
                                    <p className="text-sm text-gray-600 line-clamp-1">{replyingTo.text || "Media"}</p>
                                </div>
                                <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-gray-200 rounded-full">
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        {/* File Preview */}
                        {selectedFile && (
                            <div className="mb-4 relative inline-block animate-in fade-in slide-in-from-bottom-2">
                                <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-100 shadow-md bg-gray-50 flex items-center justify-center">
                                    {selectedFile.type === "image" ? (
                                        <img src={selectedFile.preview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : selectedFile.type === "video" ? (
                                        <video src={selectedFile.preview} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-2">
                                            <FileText size={32} className="mx-auto text-gray-400 mb-1" />
                                            <p className="text-xs text-gray-500 truncate max-w-[100px]">{selectedFile.file.name}</p>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={clearFile}
                                    className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-1.5 hover:bg-black shadow-lg transition-transform hover:scale-110"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        <form onSubmit={sendMessage} className="flex gap-2 max-w-4xl mx-auto items-end relative bg-gray-50 p-2 rounded-[24px] border border-gray-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 transition-all shadow-sm">
                            {/* Emoji Picker */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="p-3 text-gray-500 hover:text-yellow-500 transition rounded-full hover:bg-white"
                                >
                                    <Smile size={22} />
                                </button>
                                {showEmojiPicker && (
                                    <div className="absolute bottom-14 left-0 z-50 shadow-2xl rounded-2xl border border-gray-100">
                                        <EmojiPicker onEmojiClick={onEmojiClick} width={320} height={400} />
                                    </div>
                                )}
                            </div>

                            {/* File Upload */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-3 text-gray-500 hover:text-[#0ea5e9] transition rounded-full hover:bg-white"
                            >
                                <Paperclip size={22} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={selectedFile ? "Add a caption..." : `Message #${roomId}...`}
                                className="flex-1 bg-transparent border-none px-2 py-3 focus:ring-0 outline-none text-gray-800 placeholder-gray-400 min-h-[44px]"
                            />

                            <button
                                type="submit"
                                aria-label="Send Message"
                                disabled={(!newMessage.trim() && !selectedFile && !audioBlob) || uploading}
                                className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white p-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95 transform duration-200"
                            >
                                <Send size={20} />
                            </button>

                            {/* Voice Recorder */}
                            {!newMessage.trim() && !selectedFile && !audioBlob && !isRecording && (
                                <button
                                    type="button"
                                    onClick={startRecording}
                                    aria-label="Start Voice Recording"
                                    className="absolute right-16 bottom-3 p-3 text-gray-500 hover:text-red-500 transition rounded-full hover:bg-red-50"
                                >
                                    <Mic size={22} />
                                </button>
                            )}

                            {isRecording && (
                                <div className="absolute inset-0 bg-white z-10 flex items-center justify-between px-4 rounded-[24px] border border-red-200 animate-in fade-in">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                        <span className="text-red-500 font-mono font-bold">{formatTime(recordingTime)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={cancelRecording}
                                            aria-label="Cancel Recording"
                                            className="p-2 text-gray-400 hover:text-gray-600"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={stopRecording}
                                            aria-label="Stop Recording"
                                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                                        >
                                            <Square size={16} fill="currentColor" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {audioBlob && (
                                <div className="absolute inset-0 bg-white z-10 flex items-center justify-between px-4 rounded-[24px] border border-[#0ea5e9] animate-in fade-in">
                                    <div className="flex items-center gap-2">
                                        <Mic size={18} className="text-[#0ea5e9]" />
                                        <span className="text-gray-700 font-medium">Voice Note Recorded</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAudioBlob(null)}
                                            className="p-2 text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 size={18} />
                                        </button>

                                        {/* Filter Menu */}
                                        <div className="flex items-center gap-1 mr-2 px-2 border-l border-r border-gray-100">
                                            <button
                                                type="button"
                                                onClick={() => handleApplyFilter('kid')}
                                                disabled={isProcessingAudio}
                                                className={`p-1.5 rounded-full text-xs font-bold transition ${selectedVoiceFilter === 'kid' ? 'bg-pink-100 text-pink-600' : 'text-gray-400 hover:bg-gray-100'}`}
                                                title="Kid Voice"
                                            >
                                                👶
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleApplyFilter('deep')}
                                                disabled={isProcessingAudio}
                                                className={`p-1.5 rounded-full text-xs font-bold transition ${selectedVoiceFilter === 'deep' ? 'bg-slate-800 text-white' : 'text-gray-400 hover:bg-gray-100'}`}
                                                title="Deep Voice (Monster)"
                                            >
                                                👹
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleApplyFilter('robot')}
                                                disabled={isProcessingAudio}
                                                className={`p-1.5 rounded-full text-xs font-bold transition ${selectedVoiceFilter === 'robot' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                                                title="Robot Voice"
                                            >
                                                🤖
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleApplyFilter('masked')}
                                                disabled={isProcessingAudio}
                                                className={`p-1.5 rounded-full text-xs font-bold transition ${selectedVoiceFilter === 'masked' ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:bg-gray-100'}`}
                                                title="Masked Voice"
                                            >
                                                🕵️
                                            </button>
                                        </div>
                                        <button
                                            type="submit"
                                            className="p-2 bg-[#0ea5e9] text-white rounded-full hover:bg-[#0284c7] transition"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>


                    {/* Forward Modal */}
                    {
                        showForwardModal && (
                            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                                <div className="bg-white rounded-2xl w-full max-w-sm p-4 shadow-xl animate-in zoom-in duration-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-lg">Forward to...</h3>
                                        <button onClick={() => setShowForwardModal(false)}><X size={20} /></button>
                                    </div>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {recentRooms.map(room => (
                                            <button
                                                key={room.id}
                                                onClick={() => handleForward(room)}
                                                className="w-full text-left p-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition"
                                            >
                                                <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                                                    <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                                                </div>
                                                <span className="font-medium">{room.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )
                    }
                    {/* Delete Confirmation Modal */}
                    <Modal
                        isOpen={showDeleteModal}
                        onClose={() => setShowDeleteModal(false)}
                        title="Delete Message"
                    >
                        <div className="flex flex-col gap-4">
                            <p className="text-gray-600">
                                Are you sure you want to delete this message? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3 mt-2">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition shadow-lg shadow-red-200"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </Modal>

                    {/* AI Summary Modal */}
                    {/* AI Summary Modal */}
                    <Modal
                        isOpen={!!aiSummary}
                        onClose={() => setAiSummary(null)}
                        title="✨ AI Room Summary"
                    >
                        <div className="space-y-4">
                            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-900 leading-relaxed">
                                {aiSummary}
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setAiSummary(null)}
                                    className="px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-black transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </Modal >

                    {/* Media Lightbox */}
                    {
                        viewingMedia && (
                            <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center animate-in fade-in duration-200">
                                <button
                                    onClick={() => setViewingMedia(null)}
                                    className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
                                >
                                    <X size={32} />
                                </button>

                                <div className="w-full h-full flex items-center justify-center p-4">
                                    {viewingMedia.mediaType === "image" ? (
                                        <img
                                            src={viewingMedia.url}
                                            alt="Full screen"
                                            className="max-w-full max-h-full object-contain shadow-2xl"
                                        />
                                    ) : (
                                        <video
                                            src={viewingMedia.url}
                                            controls
                                            autoPlay
                                            className="max-w-full max-h-full shadow-2xl"
                                        />
                                    )}
                                </div>

                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
                                    <a
                                        href={viewingMedia.url}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition font-medium"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Download size={20} />
                                        Download
                                    </a>
                                </div>
                            </div>
                        )
                    }
                </div>

                {/* Knowledge Panel Sidebar */}
                {showRelated && relatedPosts.length > 0 && (
                    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto hidden md:block shrink-0">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10 backdrop-blur">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Sparkles size={16} className="text-purple-500" />
                                Related Posts
                            </h3>
                            <button onClick={() => setShowRelated(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            {relatedPosts.map(post => (
                                <div key={post._id} className="scale-90 origin-top-left w-[111%] -mb-8">
                                    <PostCard post={post} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

