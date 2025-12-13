import { useRef, useMemo, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars, Text, Html } from "@react-three/drei";
import * as THREE from "three";

// Helper function to convert lat/lng to 3D position
function getPosition(lat, lng, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return [x, y, z];
}

function UserNode({ user, radius, navigate }) {
    const [hovered, setHovered] = useState(false);

    // Generate random lat/lng if not provided (for dummy data)
    const lat = user.lat || (Math.random() * 180 - 90);
    const lng = user.lng || (Math.random() * 360 - 180);
    const position = useMemo(() => getPosition(lat, lng, radius), [lat, lng, radius]);
    const isMoment = user.type === 'moment';
    const color = isMoment ? "#ef4444" : (user.isOnline ? "#0ea5e9" : "#a855f7"); // Red for moments

    return (
        <group position={position}>
            {/* Node Point */}
            <mesh
                onClick={() => isMoment ? navigate(`/post/${user._id}`) : navigate(`/profile/${user._id}`)}
                onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
                onPointerOut={() => { document.body.style.cursor = 'auto'; setHovered(false); }}
            >
                <sphereGeometry args={[hovered ? 0.08 : 0.05, 16, 16]} />
                <meshStandardMaterial
                    color={hovered ? "#ffffff" : color}
                    emissive={color}
                    emissiveIntensity={hovered ? 2 : 0.5}
                />
            </mesh>

            {/* Connection Line to Center (optional aesthetic) */}
            <line>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={2}
                        array={new Float32Array([0, 0, 0, -position[0] * 0.1, -position[1] * 0.1, -position[2] * 0.1])}
                        itemSize={3}
                    />
                </bufferGeometry>
                <lineBasicMaterial color={color} opacity={0.2} transparent />
            </line>

            {/* Label (only visible when hovered) */}
            {hovered && (
                <Html distanceFactor={10}>
                    <div className="bg-white/90 backdrop-blur-md p-2 rounded-lg shadow-xl text-xs whitespace-nowrap pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-10px] border border-white/50">
                        {user.type === 'moment' ? (
                            <>
                                <div className="font-bold text-gray-900">Moment by {user.user?.name}</div>
                                <div className="text-gray-500 truncate max-w-[150px]">{user.text || "Shared a moment"}</div>
                            </>
                        ) : (
                            <>
                                <div className="font-bold text-gray-900">{user.name}</div>
                                <div className="text-gray-500">@{user.username}</div>
                            </>
                        )}
                    </div>
                </Html>
            )}
        </group>
    );
}

export default function ThreeGlobe({ users = [], navigate }) {
    const globeRef = useRef();

    // Auto-rotate the globe slowly
    useFrame(() => {
        if (globeRef.current) {
            globeRef.current.rotation.y += 0.001;
        }
    });

    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            <group ref={globeRef}>
                {/* The Planet Surface */}
                <mesh>
                    <sphereGeometry args={[2, 64, 64]} />
                    <meshStandardMaterial
                        map={useLoader(THREE.TextureLoader, '/earth_texture.png')}
                        roughness={0.7}
                        metalness={0.1}
                    />
                </mesh>

                {/* Wireframe Overlay for "Tech" look */}
                <mesh>
                    <sphereGeometry args={[2.01, 32, 32]} />
                    <meshBasicMaterial color="#0ea5e9" wireframe={true} transparent opacity={0.15} />
                </mesh>

                {/* Atmosphere Glow */}
                <mesh scale={[2.1, 2.1, 2.1]}>
                    <sphereGeometry args={[1, 64, 64]} />
                    <meshBasicMaterial
                        color="#4f46e5"
                        transparent
                        opacity={0.05}
                        side={THREE.BackSide}
                    />
                </mesh>

                {/* User Nodes */}
                {users.map((user, i) => (
                    <UserNode key={user._id || i} user={user} radius={2.05} navigate={navigate} />
                ))}
            </group>

            <OrbitControls
                enablePan={false}
                enableZoom={true}
                minDistance={3}
                maxDistance={8}
                autoRotate={false}
                enableDamping={true}
            />
        </>
    );
}
