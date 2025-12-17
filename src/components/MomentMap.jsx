import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../lib/api";
import { useNavigate } from "react-router-dom";
import { Mic, Volume2, Lock } from "lucide-react";

// Fix for default Leaflet icons in React
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Custom Icon Generator
// Custom Icon Generator
const createCustomIcon = (avatarUrl) => {
    return L.divIcon({
        className: "custom-marker",
        html: `<div class="w-12 h-12 rounded-full border-2 border-white shadow-[0_0_15px_rgba(14,165,233,0.6)] overflow-hidden bg-white transform hover:scale-110 transition-transform duration-300">
                     <img src="${avatarUrl}" class="w-full h-full object-cover" />
                   </div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        popupAnchor: [0, -24],
    });
};

const createVoiceIcon = (avatarUrl) => {
    return L.divIcon({
        className: "voice-marker",
        html: `<div class="relative w-12 h-12 flex items-center justify-center">
                 <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
                 <div class="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-pulse delay-75"></div>
                 <div class="w-10 h-10 rounded-full border-2 border-white bg-blue-500 overflow-hidden flex items-center justify-center relative z-10 shadow-lg">
                     <img src="${avatarUrl}" class="w-full h-full object-cover opacity-80" />
                     <div class="absolute inset-0 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                     </div>
                 </div>
               </div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        popupAnchor: [0, -24],
    });
};

export default function MomentMap() {
    const [moments, setMoments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMoments();

        // Track User Location
        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    setUserLocation({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    });
                },
                (err) => console.error(err),
                { enableHighAccuracy: true }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    const fetchMoments = async () => {
        try {
            const res = await api.get("/posts/moments");
            setMoments(res.data.moments);
        } catch (err) {
            console.error("Failed to fetch map data", err);
        } finally {
            setLoading(false);
        }
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // in metres
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-black/90">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#0ea5e9]"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#0ea5e9] text-xs font-bold">MAP</div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-64px)] w-full relative z-0 bg-[#1a1a1a]">
            <MapContainer
                center={[20, 0]}
                zoom={2.5}
                minZoom={2}
                scrollWheelZoom={true}
                className="h-full w-full outline-none"
                style={{ height: "100%", width: "100%" }}
            >
                {/* Dark Theme Map Tiles */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {moments.map((moment) => {
                    const isVoice = moment.isVoiceRipple || (moment.audio && !moment.image && !moment.video);
                    const isLocked = moment.isLocked;

                    // Simple distance check if user location exists
                    let distance = null;
                    if (userLocation && moment.location) {
                        distance = calculateDistance(
                            userLocation.latitude, userLocation.longitude,
                            moment.location.coordinates[1], moment.location.coordinates[0]
                        );
                    }

                    // Audio Logic
                    const maxDistance = 500; // 500 meters max range
                    const volume = distance !== null
                        ? (Math.max(0, 1 - (distance / maxDistance)))
                        : 0; // Default to 0 if no location yet

                    return (
                        <Marker
                            key={moment._id}
                            position={[
                                moment.location.coordinates[1],
                                moment.location.coordinates[0],
                            ]}
                            icon={isVoice ? createVoiceIcon(moment.user.avatar || `https://ui-avatars.com/api/?name=${moment.user.name}&background=random`) : createCustomIcon(moment.user.avatar || `https://ui-avatars.com/api/?name=${moment.user.name}&background=random`)}
                        >
                            <Popup className="custom-popup" closeButton={false}>
                                <div className="min-w-[240px] p-1">
                                    <div
                                        className="flex items-center gap-3 mb-3 cursor-pointer group"
                                        onClick={() => navigate(`/profile/${moment.user._id}`)}
                                    >
                                        <div className="relative">
                                            <img
                                                src={moment.user.avatar || `https://ui-avatars.com/api/?name=${moment.user.name}&background=random`}
                                                className="w-10 h-10 rounded-full object-cover border border-gray-100 group-hover:border-[#0ea5e9] transition-colors"
                                            />
                                            <div className="absolute -bottom-1 -right-1 bg-[#0ea5e9] text-[10px] text-white px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                                                {isVoice ? <Mic size={8} /> : "LIVE"}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="font-bold text-gray-800 text-base group-hover:text-[#0ea5e9] transition-colors block">
                                                {moment.user.name}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {distance !== null ? `${Math.round(distance)}m away` : 'Just now'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* VOICE RIPPLE UI */}
                                    {isVoice && moment.audio && (
                                        <div className="mb-3 rounded-xl bg-blue-50 p-3 border border-blue-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                                                    <Mic size={14} /> Voice Ripple
                                                </div>
                                                {distance !== null && distance > maxDistance && (
                                                    <div className="text-xs text-red-500 font-medium">Too far to hear</div>
                                                )}
                                            </div>

                                            <audio
                                                src={moment.audio}
                                                controls
                                                className="w-full h-8"
                                                onPlay={(e) => {
                                                    // Dynamic Volume Adjustment
                                                    e.target.volume = Math.min(1, Math.max(0, volume));
                                                    if (volume < 0.1) {
                                                        // toast.error("Too far away! Move closer to hear clearly.");
                                                    }
                                                }}
                                            />
                                            {distance !== null && (
                                                <div className="w-full bg-gray-200 h-1 mt-2 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-blue-500 h-full transition-all duration-500"
                                                        style={{ width: `${volume * 100}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* REGULAR IMAGE POST UI */}
                                    {moment.image && !isVoice && (
                                        <div
                                            className="mb-3 rounded-xl overflow-hidden h-32 w-full bg-gray-100 cursor-pointer shadow-sm relative group"
                                            onClick={() => navigate(`/post/${moment._id}`)}
                                        >
                                            <img src={moment.image} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                        </div>
                                    )}

                                    {/* TEXT CONTENT */}
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3 font-medium leading-relaxed px-1">
                                        {isVoice ? (moment.text || "Left a voice note here.") : (moment.text || (moment.cards && moment.cards[0]?.text) || "Shared a moment")}
                                    </p>

                                    <button
                                        onClick={() => navigate(`/post/${moment._id}`)}
                                        className="w-full bg-[#0ea5e9]/10 text-[#0ea5e9] hover:bg-[#0ea5e9] hover:text-white text-xs font-bold py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                                    >
                                        View Full Post <span>→</span>
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Premium Overlay Title */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center pointer-events-none">
                <div className="bg-black/40 backdrop-blur-md border border-white/10 px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0ea5e9]"></span>
                    </span>
                    <h1 className="text-lg font-bold text-white tracking-wide">
                        Moment Map <span className="font-normal text-white/60 text-sm ml-1">Live</span>
                    </h1>
                </div>
            </div>

            {/* Footer gradient for depth */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none z-[999]" />
        </div>
    );
}
