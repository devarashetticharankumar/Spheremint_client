import { useState, useRef, useEffect } from "react"; // Added useRef, useEffect
import { useStore } from "../store/useStore";
import { Send, Reply, Smile, Mic, Square, Trash2, Play, Pause } from "lucide-react"; // Added icons
import EmojiPicker from "emoji-picker-react";
import api from "../lib/api"; // Added api import
import toast from "react-hot-toast"; // Added toast

const AudioPlayer = ({ src }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    const togglePlay = () => {
        if (audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    return (
        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 mt-1 w-fit">
            <button
                onClick={togglePlay}
                className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[#0ea5e9] shadow-sm hover:scale-105 transition"
            >
                {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
            </button>
            <div className="flex items-center gap-1">
                {[1, 2, 3, 2, 1].map((h, i) => (
                    <div key={i} className={`w-1 bg-[#0ea5e9]/50 rounded-full ${isPlaying ? "animate-pulse" : ""}`} style={{ height: `${h * 4}px` }} />
                ))}
            </div>
            <audio
                ref={audioRef}
                src={src}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
            />
        </div>
    );
};

export default function CommentSection({ post }) {
    const { addComment, replyToComment, user } = useStore();
    const [text, setText] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null); // { commentId, userName }
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);

    // Recording Logic
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

            // Auto-stop after 3 seconds (Mic Drop!)
            let timeLeft = 0;
            timerRef.current = setInterval(() => {
                timeLeft++;
                setRecordingTime(timeLeft);
                if (timeLeft >= 3) {
                    stopRecording();
                }
            }, 1000);

        } catch (err) {
            console.error("Failed to start recording:", err);
            toast.error("Microphone access denied");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const discardRecording = () => {
        setAudioBlob(null);
        setRecordingTime(0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim() && !audioBlob) return; // Allow submission if audio exists

        let audioUrl = null;

        if (audioBlob) {
            try {
                const fileName = `mic_drop_${Date.now()}.webm`;
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
                toast.error("Failed to upload audio");
                return;
            }
        }

        // Modified addComment to accept audioURL (need to update store action or pass object)
        // Since we didn't update the store `addComment` signature yet, let's assume we can pass an object or we modify store now.
        // Wait, typical useStore pattern is `addComment: async (postId, text) => ...`
        // I need to update useStore.js too to handle 3rd arg or object.
        // For now, I'll assume I update store next or passed an object if supported. 
        // Let's modify the call to pass an object if possible or update the store file.
        // I'll update store.js in the next step. For now, calling with 3 arguments.

        if (replyingTo) {
            // Replies usually don't support audio in this simplified spec? 
            // "Attach as comment/reaction". Let's assume top-level comments for now for Mic Drop.
            await replyToComment(post._id, replyingTo.commentId, text);
            setReplyingTo(null);
        } else {
            // Using 3rd arg for audio
            await addComment(post._id, text, audioUrl);
        }

        setText("");
        setAudioBlob(null);
        setShowEmojiPicker(false);
    };

    const onEmojiClick = (emojiObject) => {
        setText((prev) => prev + emojiObject.emoji);
    };

    return (
        <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
            {/* Comments List */}
            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                {post.comments?.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-2">No comments yet. Be the first!</p>
                )}

                {post.comments?.map((comment) => (
                    <div key={comment._id} className="group">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                {comment.user?.name?.[0] || "U"}
                            </div>
                            <div className="flex-1">
                                <div className="bg-gray-50 rounded-2xl px-4 py-2 inline-block">
                                    <p className="text-xs font-bold text-gray-900">{comment.user?.name || "Unknown"}</p>
                                    {comment.audio ? (
                                        <div className="mt-1">
                                            {comment.text && <p className="text-sm text-gray-800 mb-1">{comment.text}</p>}
                                            <AudioPlayer src={comment.audio} />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-800">{comment.text}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 mt-1 ml-2">
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <button
                                        onClick={() => setReplyingTo({ commentId: comment._id, userName: comment.user?.name })}
                                        className="text-xs font-bold text-gray-500 hover:text-[#0ea5e9] transition flex items-center gap-1"
                                    >
                                        Reply
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Replies */}
                        {comment.replies?.length > 0 && (
                            <div className="ml-11 mt-2 space-y-3 pl-3 border-l-2 border-gray-100">
                                {comment.replies.map((reply) => (
                                    <div key={reply._id} className="flex gap-3">
                                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                                            {reply.user?.name?.[0] || "U"}
                                        </div>
                                        <div>
                                            <div className="bg-gray-50 rounded-2xl px-3 py-1.5 inline-block">
                                                <p className="text-xs font-bold text-gray-900">{reply.user?.name || "Unknown"}</p>
                                                <p className="text-sm text-gray-800">{reply.text}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                {replyingTo && (
                    <div className="absolute -top-8 left-0 right-0 bg-[#0ea5e9]/10 text-[#0ea5e9] text-xs px-3 py-1 rounded-t-lg flex justify-between items-center">
                        <span>Replying to <b>{replyingTo.userName}</b></span>
                        <button onClick={() => setReplyingTo(null)} className="hover:text-red-500 font-bold">✕</button>
                    </div>
                )}

                {!isRecording && !audioBlob && (
                    <div className="w-8 h-8 bg-gradient-to-br from-[#0ea5e9] to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {user?.name?.[0] || "U"}
                    </div>
                )}

                {/* Text Input (Hidden when recording or audio blob exists for clean UI, or keep it?) */}
                {/* User might want to add text with audio. Let's keep it but handle layout. */}
                {!isRecording && !audioBlob && (
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                        className={`flex-1 bg-gray-100 border-none rounded-full py-2.5 px-4 text-sm focus:ring-2 focus:ring-[#0ea5e9]/20 outline-none transition ${replyingTo ? "rounded-tl-none" : ""}`}
                    />
                )}

                {/* Recording UI */}
                {isRecording && (
                    <div className="flex-1 bg-red-50 rounded-full py-2.5 px-4 flex items-center justify-between text-red-600 animate-pulse">
                        <span className="text-sm font-bold flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-600 rounded-full"></div> Recording... {recordingTime}s
                        </span>
                        <button type="button" onClick={stopRecording}>
                            <Square size={16} fill="currentColor" />
                        </button>
                    </div>
                )}

                {/* Audio Preview UI */}
                {audioBlob && (
                    <div className="flex-1 bg-gray-100 rounded-full py-2 px-4 flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">🎤 Audio recorded</span>
                        <button type="button" onClick={discardRecording} className="text-gray-400 hover:text-red-500">
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}

                <div className="relative flex items-center gap-1">
                    {!isRecording && !audioBlob && (
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="p-2 text-gray-400 hover:text-[#0ea5e9] transition"
                        >
                            <Smile size={20} />
                        </button>
                    )}

                    {showEmojiPicker && (
                        <div className="absolute bottom-12 right-0 z-50 shadow-xl rounded-xl">
                            <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} />
                        </div>
                    )}

                    {!text.trim() && !isRecording && !audioBlob && !replyingTo && (
                        <button
                            type="button"
                            onClick={startRecording}
                            className="p-2 text-gray-400 hover:text-red-500 transition hover:bg-red-50 rounded-full"
                            title="Mic Drop (3s limit)"
                        >
                            <Mic size={20} />
                        </button>
                    )}
                </div>

                {(text.trim() || audioBlob) && (
                    <button
                        type="submit"
                        className="p-2 bg-[#0ea5e9] text-white rounded-full hover:bg-[#0284c7] transition"
                    >
                        <Send size={16} />
                    </button>
                )}
            </form>
        </div>
    );
}
