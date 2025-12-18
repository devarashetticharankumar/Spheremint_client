import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Float, Text, Trail } from "@react-three/drei";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";

// Helper for spherical distribution
const getOrbitPosition = (radius, angle, verticalOffset) => {
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    return [x, verticalOffset, z];
};

const MomentNode = ({ position, color, data, onClick }) => {
    const meshRef = useRef();
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
        // Subtle floating animation independent of orbit
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.01;
        }
    });

    return (
        <group position={position}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh
                    ref={meshRef}
                    onClick={(e) => { e.stopPropagation(); onClick(data); }}
                    onPointerOver={() => setHovered(true)}
                    onPointerOut={() => setHovered(false)}
                >
                    {/* Glowing Core */}
                    <sphereGeometry args={[hovered ? 0.8 : 0.5, 32, 32]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={hovered ? 3 : 1}
                        roughness={0.2}
                        metalness={0.8}
                    />
                </mesh>

                {/* Ring Halo */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.7, 0.75, 32]} />
                    <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
                </mesh>

                {/* Text Label (visible on hover) */}
                {hovered && (
                    <Text
                        position={[0, 1.2, 0]}
                        fontSize={0.3}
                        color="white"
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.02}
                        outlineColor="black"
                    >
                        {data.user?.name || "Anonymous"}
                    </Text>
                )}
            </Float>
        </group>
    );
};

const CentralSphere = () => {
    return (
        <group>
            {/* The Core Digital Planet */}
            <mesh>
                <sphereGeometry args={[8, 64, 64]} />
                <meshStandardMaterial
                    color="#000000"
                    roughness={0.1}
                    metalness={0.9}
                    wireframe={false}
                />
            </mesh>

            {/* Wireframe Overlay */}
            <mesh>
                <sphereGeometry args={[8.05, 32, 32]} />
                <meshBasicMaterial
                    color="#1e293b"
                    wireframe={true}
                    transparent
                    opacity={0.3}
                />
            </mesh>

            {/* Inner Glow */}
            <pointLight position={[0, 0, 0]} intensity={2} color="#4f46e5" distance={15} />
        </group>
    );
};

export default function LivingSphere({ posts, onSelectMoment }) {
    const groupRef = useRef();

    // Distribute posts into orbits
    // Inner: Friends/Close (mock logic for now: index 0-5)
    // Middle: Trending (index 6-15)
    // Outer: Random (index 15+)
    const orbitingMoments = useMemo(() => {
        return posts.map((post, i) => {
            let orbitRadius = 12; // Inner
            let speed = 0.2;
            let color = "#fbbf24"; // Gold

            if (i > 5 && i <= 15) {
                orbitRadius = 18; // Middle
                speed = 0.15;
                color = "#0ea5e9"; // Blue
            } else if (i > 15) {
                orbitRadius = 24; // Outer
                speed = 0.1;
                color = "#a855f7"; // Purple
            }

            // Scatter them around the circle
            const angle = (i / posts.length) * Math.PI * 2;
            const verticalOffset = (Math.random() - 0.5) * 8; // Random  height spread

            return {
                ...post,
                orbitRadius,
                baseAngle: angle,
                verticalOffset,
                speed,
                color
            };
        });
    }, [posts]);

    useFrame((state, delta) => {
        // Rotate the entire system slowly
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.05;
        }
    });

    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[50, 50, 50]} intensity={1} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            <group ref={groupRef}>
                <CentralSphere />

                {orbitingMoments.map((moment, i) => (
                    <group key={moment._id} rotation={[0, moment.baseAngle, 0]}>
                        {/* We rotate the group to place the node, then render the node at the radius distance */}
                        <MomentNode
                            position={[moment.orbitRadius, moment.verticalOffset, 0]}
                            color={moment.color}
                            data={moment}
                            onClick={onSelectMoment}
                        />
                    </group>
                ))}
            </group>

            <OrbitControls
                enablePan={false}
                minDistance={10}
                maxDistance={40}
                autoRotate={false}
                zoomSpeed={0.5}
            />
        </>
    );
}
