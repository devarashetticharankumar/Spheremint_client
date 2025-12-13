import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Mic, MicOff, PhoneOff, Users, Volume2, Shield, Signal } from "lucide-react";
import { useStore } from "../store/useStore";
import api from "../lib/api";

export default function VoiceRoom() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user } = useStore();
    const [peers, setPeers] = useState([]); // Array of { socketId, user, stream, isSpeaking }
    const [isMuted, setIsMuted] = useState(false);
    const [roomDetails, setRoomDetails] = useState(null);
    const [activeSpeakerId, setActiveSpeakerId] = useState(null);

    const socketRef = useRef();
    const peersRef = useRef({}); // { socketId: RTCPeerConnection }
    const localStreamRef = useRef();
    const audioContextRef = useRef();
    const analysersRef = useRef({}); // { socketId: AnalyserNode }

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const res = await api.get(`/rooms/${roomId}`);
                setRoomDetails(res.data);
            } catch (err) {
                console.error("Failed to fetch room", err);
            }
        };
        fetchRoom();
    }, [roomId]);

    useEffect(() => {
        socketRef.current = io("http://localhost:5001", {
            auth: { token: localStorage.getItem("token") },
        });

        // Audio Context for visualizer
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

        const initVoice = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
                localStreamRef.current = stream;

                // Analyze local audio
                analyzeAudio(stream, "local");

                socketRef.current.emit("join-voice-room", roomId);

                socketRef.current.on("all-voice-users", (users) => {
                    users.forEach(({ socketId, user: peerUser }) => {
                        if (!peersRef.current[socketId]) {
                            const peer = createPeer(socketId, stream);
                            peersRef.current[socketId] = peer;
                            setPeers(prev => {
                                if (prev.some(p => p.socketId === socketId)) return prev;
                                return [...prev, { socketId, user: peerUser }];
                            });
                        }
                    });
                });

                socketRef.current.on("voice-offer-received", ({ signal, from, user: peerUser }) => {
                    if (!peersRef.current[from]) {
                        const peer = addPeer(signal, from, stream);
                        peersRef.current[from] = peer;
                        setPeers(prev => {
                            if (prev.some(p => p.socketId === from)) return prev;
                            return [...prev, { socketId: from, user: peerUser }];
                        });
                    }
                });

                socketRef.current.on("voice-answer-received", ({ signal, from }) => {
                    const peer = peersRef.current[from];
                    if (peer) {
                        peer.setRemoteDescription(new RTCSessionDescription(signal));
                    }
                });

                socketRef.current.on("voice-ice-candidate-received", ({ candidate, from }) => {
                    const peer = peersRef.current[from];
                    if (peer) {
                        peer.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                });

                // Handle peer disconnect
                socketRef.current.on("user-disconnected", (socketId) => {
                    if (peersRef.current[socketId]) {
                        peersRef.current[socketId].close();
                        delete peersRef.current[socketId];
                    }
                    setPeers(prev => prev.filter(p => p.socketId !== socketId));
                });

            } catch (err) {
                console.error("Failed to get local stream", err);
            }
        };

        initVoice();

        return () => {
            socketRef.current.disconnect();
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            Object.values(peersRef.current).forEach(peer => peer.close());
        };
    }, [roomId]);

    const analyzeAudio = (stream, id) => {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analysersRef.current[id] = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkAudio = () => {
            if (!analyser) return;
            analyser.getByteFrequencyData(dataArray);
            const sum = dataArray.reduce((a, b) => a + b, 0);
            const average = sum / dataArray.length;

            if (average > 10) { // Threshold
                setActiveSpeakerId(id);
                // Reset after a short delay if silence follows
                setTimeout(() => setActiveSpeakerId(null), 500);
            }

            requestAnimationFrame(checkAudio);
        };
        checkAudio();
    };

    const createPeer = (userToCall, stream) => {
        const peer = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });

        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        peer.onicecandidate = (e) => {
            if (e.candidate) {
                socketRef.current.emit("voice-ice-candidate", {
                    to: userToCall,
                    candidate: e.candidate
                });
            }
        };

        peer.onnegotiationneeded = async () => {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            socketRef.current.emit("voice-offer", {
                userToCall,
                signal: offer
            });
        };

        peer.ontrack = (e) => {
            const remoteStream = e.streams[0];
            const audio = document.createElement("audio");
            audio.srcObject = remoteStream;
            audio.autoplay = true;
            document.body.appendChild(audio);

            checkAudioActivity(remoteStream, userToCall);
        };

        return peer;

        return peer;
    };

    const addPeer = (incomingSignal, callerID, stream) => {
        const peer = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });

        peer.onicecandidate = (e) => {
            if (e.candidate) {
                socketRef.current.emit("voice-ice-candidate", {
                    to: callerID,
                    candidate: e.candidate
                });
            }
        };

        peer.ontrack = (e) => {
            const remoteStream = e.streams[0];
            const audio = document.createElement("audio");
            audio.srcObject = remoteStream;
            audio.autoplay = true;
            document.body.appendChild(audio);

            checkAudioActivity(remoteStream, callerID);
        };

        peer.setRemoteDescription(new RTCSessionDescription(incomingSignal));
        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        peer.createAnswer().then(answer => {
            peer.setLocalDescription(answer);
            socketRef.current.emit("voice-answer", {
                to: callerID,
                signal: answer
            });
        });

        return peer;
    };

    const checkAudioActivity = (stream, id) => {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        // Note: Don't connect to destination here, the <audio> tag handles output

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const check = () => {
            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            if (avg > 10) {
                setActiveSpeakerId(id);
                setTimeout(() => setActiveSpeakerId(null), 500);
            }
            requestAnimationFrame(check);
        };
        check();
    };




    const leaveRoom = () => {
        navigate("/rooms");
    };

    const [reactions, setReactions] = useState([]); // { id, emoji, userAvatar }
    const [raisedHands, setRaisedHands] = useState(new Set()); // Set of specific socketIds

    // ... (keep existing effects)

    useEffect(() => {
        if (!socketRef.current) return;

        socketRef.current.on("voice-reaction-received", ({ socketId, emoji }) => {
            // Find user avatar if possible
            const peer = peersRef.current[socketId] || peers.find(p => p.socketId === socketId);
            // Use a default or the peer's avatar
            const avatar = "https://i.imgur.com/6vbOq2C.png"; // Placeholder if not found easily in ref structure

            const newReaction = {
                id: Date.now() + Math.random(),
                emoji,
                socketId
            };
            setReactions(prev => [...prev, newReaction]);

            // Remove reaction after animation
            setTimeout(() => {
                setReactions(prev => prev.filter(r => r.id !== newReaction.id));
            }, 3000);
        });

        socketRef.current.on("hand-raised-update", ({ socketId, isRaised }) => {
            setRaisedHands(prev => {
                const newSet = new Set(prev);
                if (isRaised) newSet.add(socketId);
                else newSet.delete(socketId);
                return newSet;
            });
        });

        socketRef.current.on("voice-mute-update", ({ socketId, isMuted }) => {
            setPeers(prev => prev.map(p => {
                if (p.socketId === socketId) return { ...p, isMuted };
                return p;
            }));
        });

        return () => {
            socketRef.current?.off("voice-reaction-received");
            socketRef.current?.off("hand-raised-update");
            socketRef.current?.off("voice-mute-update");
        };
    }, [peers]);

    const sendReaction = (emoji) => {
        socketRef.current.emit("voice-reaction", { roomId, emoji });
    };

    const toggleHandRaise = () => {
        const isRaised = !raisedHands.has(socketRef.current.id);
        socketRef.current.emit("raise-hand", { roomId, isRaised });
        // Optimistic update
        setRaisedHands(prev => {
            const newSet = new Set(prev);
            if (isRaised) newSet.add(socketRef.current.id);
            else newSet.delete(socketRef.current.id);
            return newSet;
        });
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const isNowMuted = !isMuted;
            localStreamRef.current.getAudioTracks()[0].enabled = !isNowMuted;
            setIsMuted(isNowMuted);
            socketRef.current.emit("voice-mute-change", { roomId, isMuted: isNowMuted });
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col relative overflow-hidden">
            {/* Floating Reactions Overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                {reactions.map(r => (
                    <div
                        key={r.id}
                        className="absolute bottom-20 left-1/2 text-4xl animate-float-up opacity-0"
                        style={{ left: `${50 + (Math.random() * 40 - 20)}%` }} // Randomize horizontal start slightly
                    >
                        {r.emoji}
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="p-6 flex justify-between items-center bg-slate-800/50 backdrop-blur-md sticky top-0 z-10 border-b border-white/5">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        {roomDetails?.name || "Voice Room"}
                        {roomDetails?.isVoice && <span className="bg-red-500 text-xs px-2 py-0.5 rounded-full animate-pulse">LIVE</span>}
                    </h1>
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                        <Users size={14} /> {peers.length + 1} listening
                    </p>
                </div>
                <div onClick={leaveRoom} className="p-2 hover:bg-white/10 rounded-full cursor-pointer transition">
                    <PhoneOff className="text-red-400" />
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 p-6 overflow-y-auto z-10">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">

                    {/* Me */}
                    <div className="flex flex-col items-center">
                        <div className={`relative w-24 h-24 rounded-full p-1 transition-all duration-300 ${activeSpeakerId === "local" ? "bg-gradient-to-tr from-purple-500 to-pink-500 scale-105 shadow-xl shadow-purple-500/20" : "bg-slate-700"}`}>
                            <img
                                src={user?.avatar || "https://i.imgur.com/6vbOq2C.png"}
                                alt="Me"
                                className="w-full h-full rounded-full object-cover border-4 border-slate-900"
                            />
                            {/* Hand Raised Indicator */}
                            {raisedHands.has(socketRef.current?.id) && (
                                <div className="absolute -top-2 -right-2 bg-yellow-500 text-black p-1.5 rounded-full border-2 border-slate-900 animate-bounce">
                                    ✋
                                </div>
                            )}
                            {isMuted && (
                                <div className="absolute bottom-0 right-0 bg-slate-800 p-1.5 rounded-full border-2 border-slate-900">
                                    <MicOff size={14} className="text-red-400" />
                                </div>
                            )}
                        </div>
                        <div className="mt-3 text-center">
                            <p className="font-bold flex items-center justify-center gap-1">
                                You
                                <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">Host</span>
                            </p>
                            <p className="text-xs text-slate-500">@{user?.username || "user"}</p>
                        </div>
                    </div>

                    {/* Peers */}
                    {peers.map((peer) => (
                        <div key={peer.socketId} className="flex flex-col items-center animate-fade-in">
                            <div className={`relative w-24 h-24 rounded-full p-1 transition-all duration-300 ${activeSpeakerId === peer.socketId ? "bg-gradient-to-tr from-green-400 to-emerald-600 scale-105 shadow-xl shadow-green-500/20" : "bg-slate-700"}`}>
                                <img
                                    src={peer.user?.avatar || "https://i.imgur.com/6vbOq2C.png"}
                                    alt={peer.user?.name}
                                    className="w-full h-full rounded-full object-cover border-4 border-slate-900"
                                />
                                {raisedHands.has(peer.socketId) && (
                                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-black p-1.5 rounded-full border-2 border-slate-900 animate-bounce">
                                        ✋
                                    </div>
                                )}
                                {peer.isMuted && (
                                    <div className="absolute bottom-0 right-0 bg-slate-800 p-1.5 rounded-full border-2 border-slate-900">
                                        <MicOff size={14} className="text-red-400" />
                                    </div>
                                )}
                            </div>
                            <div className="mt-3 text-center">
                                <p className="font-bold">{peer.user?.name || "User"}</p>
                                <p className="text-xs text-slate-500">@{peer.user?.username || "listener"}</p>
                            </div>
                        </div>
                    ))}

                </div>
            </div>

            {/* Footer Controls */}
            <div className="bg-slate-800 p-6 pb-8 border-t border-white/5 flex flex-col items-center gap-4 shadow-2xl z-30">

                {/* Reaction Bar */}
                <div className="flex gap-4 mb-2">
                    {['❤️', '🔥', '😂', '👏', '😮', '🎉'].map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => sendReaction(emoji)}
                            className="text-2xl hover:scale-125 transition-transform active:scale-95"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>

                <div className="flex justify-center items-center gap-8 w-full">
                    <button
                        onClick={toggleHandRaise}
                        className={`p-4 rounded-full transition ${raisedHands.has(socketRef.current?.id) ? 'bg-yellow-500/20 text-yellow-500' : 'bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white'}`}
                        title="Raise Hand"
                    >
                        ✋
                    </button>

                    <button
                        onClick={toggleMute}
                        className={`p-6 rounded-full transition-all duration-300 shadow-lg ${isMuted ? "bg-red-500 hover:bg-red-600 shadow-red-500/30" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30"} text-white scale-110`}
                    >
                        {isMuted ? <MicOff size={32} /> : <Mic size={32} />}
                    </button>

                    <button
                        onClick={leaveRoom}
                        className="p-4 rounded-full bg-slate-700 hover:bg-red-500/20 text-slate-400 hover:text-red-500 transition"
                        title="Leave Room"
                    >
                        <PhoneOff size={24} />
                    </button>

                    {roomDetails?.creator === user?._id && (
                        <button
                            onClick={async () => {
                                if (window.confirm("Are you sure you want to end this space? This will delete the room for everyone.")) {
                                    try {
                                        await api.delete(`/rooms/${roomId}`);
                                        navigate("/rooms");
                                    } catch (err) {
                                        console.error("Failed to delete room", err);
                                    }
                                }
                            }}
                            className="absolute right-6 p-4 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 transition"
                            title="End Space"
                        >
                            <Shield size={24} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
