import { Smile, Coffee, Flame, Heart, Laugh, Circle, Film, Tv, Newspaper, Trophy } from "lucide-react";

export const MOODS = [
    { id: "neutral", label: "All", icon: Circle, color: "text-gray-500", bg: "bg-gray-100", border: "border-gray-200" },
    { id: "happy", label: "Happy", icon: Smile, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" },
    { id: "calm", label: "Calm", icon: Coffee, color: "text-teal-500", bg: "bg-teal-50", border: "border-teal-200" },
    { id: "motivation", label: "Motivated", icon: Flame, color: "text-red-500", bg: "bg-red-50", border: "border-red-200" },
    { id: "romantic", label: "Romantic", icon: Heart, color: "text-pink-500", bg: "bg-pink-50", border: "border-pink-200" },
    { id: "funny", label: "Funny", icon: Laugh, color: "text-lime-600", bg: "bg-lime-50", border: "border-lime-200" },
    { id: "movies", label: "Movies", icon: Film, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
    { id: "entertainment", label: "Entertainment", icon: Tv, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
    { id: "news", label: "News", icon: Newspaper, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    { id: "sports", label: "Sports", icon: Trophy, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
];

export default function MoodSelector({ selectedMood, onSelect }) {
    return (
        <div className="flex gap-2 p-2 overflow-x-auto no-scrollbar pb-2">
            {MOODS.map((m) => {
                const isSelected = selectedMood === m.id;
                const Icon = m.icon;
                return (
                    <button
                        key={m.id}
                        onClick={() => onSelect(m.id)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-all whitespace-nowrap
                            ${isSelected
                                ? `${m.bg} ${m.border} ${m.color} ring-2 ring-offset-1 ring-${m.color.split("-")[1]}-300`
                                : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                            }
                        `}
                    >
                        <Icon size={16} className={isSelected ? "" : "text-gray-400"} />
                        {m.label}
                    </button>
                );
            })}
        </div>
    );
}
