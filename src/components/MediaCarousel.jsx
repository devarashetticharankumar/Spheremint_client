import { X, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useEffect, useState } from "react";

export default function MediaCarousel({ isOpen, onClose, media, initialIndex = 0 }) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen, initialIndex]);

    if (!isOpen || !media || media.length === 0) return null;

    const handleNext = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % media.length);
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
    };

    const currentMedia = media[currentIndex];

    return (
        <div
            className="fixed inset-0 z-[100] flex flex-col bg-black animate-in fade-in duration-300"
            onClick={onClose}
        >
            {/* Header Controls */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/60 to-transparent">
                <button
                    onClick={onClose}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
                >
                    <X size={28} />
                </button>

                <div className="text-white/90 font-medium text-sm bg-black/30 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                    {currentIndex + 1} / {media.length}
                </div>

                <div className="w-10"></div> {/* Spacer for centering */}
            </div>

            {/* Main Content */}
            <div
                className="flex-1 relative flex items-center justify-center overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Navigation Arrows */}
                {media.length > 1 && (
                    <>
                        <button
                            onClick={handlePrev}
                            className="absolute left-4 p-3 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full transition z-10 border border-white/5"
                        >
                            <ChevronLeft size={32} />
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-4 p-3 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full transition z-10 border border-white/5"
                        >
                            <ChevronRight size={32} />
                        </button>
                    </>
                )}

                {/* Media Display */}
                <div className="w-full h-full flex items-center justify-center p-4">
                    {currentMedia.mediaType === "image" ? (
                        <img
                            src={currentMedia.url}
                            alt={`Media ${currentIndex + 1}`}
                            className="max-w-full max-h-full object-contain shadow-2xl"
                        />
                    ) : (
                        <video
                            src={currentMedia.url}
                            controls
                            autoPlay
                            className="max-w-full max-h-full object-contain shadow-2xl"
                        />
                    )}
                </div>
            </div>

            {/* Thumbnails Strip */}
            {media.length > 1 && (
                <div
                    className="h-24 bg-black/90 backdrop-blur-md border-t border-white/10 flex items-center justify-center gap-2 px-4 overflow-x-auto z-50"
                    onClick={(e) => e.stopPropagation()}
                >
                    {media.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border-2 ${index === currentIndex
                                    ? "border-[#0ea5e9] opacity-100 scale-105"
                                    : "border-transparent opacity-50 hover:opacity-80"
                                }`}
                        >
                            {item.mediaType === "image" ? (
                                <img
                                    src={item.url}
                                    alt={`Thumbnail ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                                    <video
                                        src={item.url}
                                        className="w-full h-full object-cover opacity-50"
                                    />
                                    <Play size={16} className="absolute text-white fill-current" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
