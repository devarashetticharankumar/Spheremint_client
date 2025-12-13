import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import ThreeGlobe from "../components/ThreeGlobe";
import { Loader } from "lucide-react";
import api from "../lib/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Sphere3D() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Fetch real users from API
                const resUsers = await api.get("/users/all");
                const realUsers = resUsers.data || [];

                // Fetch moments from API
                const resMoments = await api.get("/posts/moments");
                const realMoments = resMoments.data.moments || [];

                // Transform users to include random positions if not present
                const mappedUsers = realUsers.map(u => ({
                    ...u,
                    lat: u.lat || (Math.random() * 180 - 90),
                    lng: u.lng || (Math.random() * 360 - 180),
                    type: 'user'
                }));

                // Transform moments to standard format, using their real location if available
                const mappedMoments = realMoments.map(m => ({
                    ...m,
                    lat: m.location?.coordinates[1] || (Math.random() * 180 - 90),
                    lng: m.location?.coordinates[0] || (Math.random() * 360 - 180),
                    type: 'moment'
                }));

                setUsers([...mappedUsers, ...mappedMoments]);
            } catch (err) {
                console.error("Failed to fetch users", err);
                toast.error("Failed to load Sphere data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, []);

    return (
        <div className="w-full h-[calc(100vh-64px)] bg-gray-900 relative">
            {/* Overlay UI */}
            <div className="absolute top-4 left-4 z-10 text-white">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                    The Sphere
                </h1>
                <p className="text-gray-400 text-sm max-w-xs mt-1">
                    Spin the globe to discover people across the SphereMint universe. Click a node to visit.
                </p>
            </div>

            <div className="absolute bottom-6 left-6 z-10 flex gap-4 text-xs font-mono text-gray-500">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0ea5e9]"></span> Online
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#a855f7]"></span> Offline
                </div>
            </div>

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center text-white z-20">
                    <Loader className="animate-spin" size={32} />
                </div>
            )}

            <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                <Suspense fallback={null}>
                    <ThreeGlobe users={users} navigate={navigate} />
                </Suspense>
            </Canvas>
        </div>
    );
}
