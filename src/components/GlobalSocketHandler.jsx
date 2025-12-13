import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useStore } from "../store/useStore";
import ThoughtMatchModal from "./ThoughtMatchModal";
import toast from "react-hot-toast";

export default function GlobalSocketHandler() {
    const { user } = useStore();
    const [matches, setMatches] = useState([]);
    const [postId, setPostId] = useState(null);

    useEffect(() => {
        if (!user) return;

        const SOCKET_URL = import.meta.env.VITE_APP_API_URL?.replace("/api", "") || "http://localhost:5001";
        // Using a separate socket connection for global events to avoid conflicts with page-specific sockets
        const socket = io(SOCKET_URL, {
            auth: { token: localStorage.getItem("token") },
        });

        socket.on("connect", () => {
            // console.log("Global socket connected");
        });

        socket.on("thought-match-found", (data) => {
            console.log("Thought match received:", data);
            setMatches(data.matches);
            setPostId(data.postId);
            // Play a subtle sound?
            const audio = new Audio("/notification.mp3"); // If exists, or skip
            // audio.play().catch(() => {}); 
        });

        socket.on("new-trending-room", (room) => {
            toast((t) => (
                <div onClick={() => {
                    toast.dismiss(t.id);
                    window.location.href = `/rooms/${room._id}`;
                }} className="cursor-pointer">
                    <p className="font-bold">🔥 New Live Cluster!</p>
                    <p className="text-sm">#{room.name} is trending. Click to join.</p>
                </div>
            ), { duration: 5000, icon: '🚀' });
        });

        return () => socket.disconnect();
    }, [user]);

    return (
        <div className="z-[9999] relative">
            <ThoughtMatchModal
                matches={matches}
                postId={postId}
                onClose={() => setMatches([])}
            />
        </div>
    );
}
