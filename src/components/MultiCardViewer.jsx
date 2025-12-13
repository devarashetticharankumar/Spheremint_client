import { useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import MediaCarousel from "./MediaCarousel"; // Reuse for zooming images

export default function MultiCardViewer({ cards, theme }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [showFullMedia, setShowFullMedia] = useState(false);
    const [fullMediaIndex, setFullMediaIndex] = useState(0);
    const [activeMediaList, setActiveMediaList] = useState([]);

    if (!cards || cards.length === 0) return null;

    const nextCard = (e) => {
        e.stopPropagation();
        if (activeIndex < cards.length - 1) setActiveIndex(activeIndex + 1);
    };

    const prevCard = (e) => {
        e.stopPropagation();
        if (activeIndex > 0) setActiveIndex(activeIndex - 1);
    };

    const openMedia = (mediaList, index) => {
        setActiveMediaList(mediaList);
        setFullMediaIndex(index);
        setShowFullMedia(true);
    };

    return (
        <div className="relative mb-4 group/carousel">
            {/* CARD CONTAINER */}
            <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 relative aspect-[4/5] sm:aspect-[16/10] w-full max-w-full"
                style={theme ? {
                    background: `linear-gradient(to bottom right, ${theme.gradientFrom || '#ffffff'}, ${theme.gradientTo || '#ffffff'})`,
                } : {}}
            >

                {/* CONTENT */}
                <div className="absolute inset-0 flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
                    {cards.map((card, idx) => (
                        <div key={idx} className={`w-full h-full flex-shrink-0 flex flex-col overflow-y-auto ${theme ? 'bg-transparent' : 'bg-white'}`}>
                            {/* MEDIA AREA */}
                            {card.media && card.media.length > 0 ? (
                                <div className={`w-full ${card.layout === 'split_left' || card.layout === 'split_right'
                                    ? "h-full flex " + (card.layout === 'split_left' ? "flex-row-reverse" : "flex-row")
                                    : (card.text && !card.memeMode ? "h-[60%]" : "h-full")
                                    } bg-black/5 relative`}>

                                    {/* Media Content */}
                                    <div className={`${card.layout?.startsWith('split') ? "w-1/2 h-full" : "w-full h-full"}`}>
                                        {card.media.length === 1 ? (
                                            <MediaItem item={card.media[0]} onClick={() => openMedia(card.media, 0)} />
                                        ) : (
                                            <div className="grid grid-cols-2 h-full">
                                                {card.media.slice(0, 4).map((m, i) => (
                                                    <div key={i} className="relative overflow-hidden border-white border-[0.5px]">
                                                        <MediaItem item={m} onClick={() => openMedia(card.media, i)} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Text Content for Split Layout */}
                                    {card.layout?.startsWith('split') && card.text && (
                                        <div className={`w-1/2 p-4 flex flex-col justify-center items-center text-center ${theme ? 'bg-transparent' : 'bg-white'}`}>
                                            <p className="whitespace-pre-wrap" style={{
                                                color: theme?.textColor || '#1f2937',
                                                fontFamily: card.fontFamily === 'mono' ? 'monospace' : card.fontFamily === 'serif' ? 'serif' : card.fontFamily === 'handwritten' ? 'cursive' : 'sans-serif',
                                                fontWeight: card.fontWeight || 'normal',
                                                fontStyle: card.fontStyle || 'normal',
                                                fontSize: card.fontSize === 'small' ? '0.875rem' : card.fontSize === 'large' ? '1.25rem' : card.fontSize === 'huge' ? '1.5rem' : '1rem'
                                            }}>
                                                {card.text}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // TEXT ONLY CENTERED
                                !card.text && <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">Empty Card</div>
                            )}

                            {/* TEXT AREA (Standard Layout Only) */}
                            {card.text && !card.layout?.startsWith('split') && (
                                <div className={
                                    card.memeMode
                                        ? "absolute inset-0 flex items-center justify-center p-6 text-center z-10 pointer-events-none"
                                        : `p-6 flex-1 flex flex-col ${theme ? 'bg-transparent' : 'bg-white'} ${!card.media || card.media.length === 0 ? "h-full" : ""} ${card.textAlignment === 'top' ? 'justify-start' : card.textAlignment === 'bottom' ? 'justify-end' : 'justify-center'} items-center text-center`
                                }>
                                    <p className={
                                        card.memeMode
                                            ? "text-3xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight stroke-black whitespace-pre-wrap"
                                            : `leading-relaxed whitespace-pre-wrap ${!card.media || card.media.length === 0 ? "text-xl sm:text-2xl" : "text-base"}`
                                    }
                                        style={{
                                            color: !card.memeMode ? (theme?.textColor || '#1f2937') : undefined,
                                            textShadow: card.memeMode ? '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' : undefined,
                                            fontFamily: card.fontFamily === 'mono' ? 'monospace' : card.fontFamily === 'serif' ? 'serif' : card.fontFamily === 'handwritten' ? 'cursive' : 'sans-serif',
                                            fontWeight: card.fontWeight || 'normal',
                                            fontStyle: card.fontStyle || 'normal',
                                            fontSize: card.memeMode ? undefined : (card.fontSize === 'small' ? '0.875rem' : card.fontSize === 'large' ? (card.media ? '1.25rem' : '1.5rem') : card.fontSize === 'huge' ? (card.media ? '1.5rem' : '2.25rem') : (card.media ? '1rem' : '1.25rem'))
                                        }}
                                    >
                                        {card.text}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* NAVIGATION BUTTONS */}
                {activeIndex > 0 && (
                    <button
                        onClick={prevCard}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-lg opacity-0 group-hover/carousel:opacity-100 transition"
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}
                {activeIndex < cards.length - 1 && (
                    <button
                        onClick={nextCard}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-lg opacity-0 group-hover/carousel:opacity-100 transition"
                    >
                        <ChevronRight size={20} />
                    </button>
                )}

                {/* PAGE INDICATOR CONTENT */}
                <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                    {activeIndex + 1}/{cards.length}
                </div>

                {/* DOTS INDICATOR */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {cards.map((_, i) => (
                        <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIndex ? "bg-white w-3" : "bg-white/50"}`}
                        />
                    ))}
                </div>
            </div>

            <MediaCarousel
                isOpen={showFullMedia}
                onClose={() => setShowFullMedia(false)}
                media={activeMediaList}
                initialIndex={fullMediaIndex}
            />
        </div>
    );
}

const MediaItem = ({ item, onClick }) => {
    if (item.mediaType === 'image') {
        return <img src={item.url} className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition" onClick={onClick} />;
    }
    return <video src={item.url} className="w-full h-full object-cover" controls />;
};
