import { useState, useEffect, useRef } from "react";
import api from "../lib/api";
import { useStore } from "../store/useStore";
import { Image, Video, X, Send, Smile, BarChart2, MapPin, Palette, Hourglass, Mic, StopCircle, Wand2 } from "lucide-react";

import toast from "react-hot-toast";
import MoodSelector, { MOODS } from "./MoodSelector";
import ThoughtMatchModal from "./ThoughtMatchModal";
import LinkPreviewCard from "./LinkPreviewCard";
import { applyVoiceDistortion } from "../utils/audioFilters";

const THEMES = [
  { name: "Default", from: "#ffffff", to: "#ffffff", text: "#1f2937" },
  { name: "Ocean", from: "#e0f2fe", to: "#0ea5e9", text: "#0c4a6e" },
  { name: "Sunset", from: "#ffedd5", to: "#f97316", text: "#7c2d12" },
  { name: "Lavender", from: "#f3e8ff", to: "#a855f7", text: "#581c87" },
  { name: "Mint", from: "#d1fae5", to: "#10b981", text: "#064e3b" },
  { name: "Midnight", from: "#1e1b4b", to: "#312e81", text: "#ffffff" },
  { name: "Rose", from: "#ffe4e6", to: "#f43f5e", text: "#881337" },
];

// Simple Image Compression Utility
const compressImage = async (file) => {
  if (!file.type.startsWith("image/")) return file; // Skip videos
  if (file.size < 1024 * 1024) return file; // Skip if < 1MB

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const scaleSize = MAX_WIDTH / img.width;

        // Only resize if wider than MAX_WIDTH
        if (scaleSize < 1) {
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback
          }
        }, "image/jpeg", 0.7); // 70% quality
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

import EmojiPicker from "emoji-picker-react";

export default function CreatePost() {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]); // Array of { file, type, preview } (For main/single post)

  // Multi-Card State
  const [isMultiPost, setIsMultiPost] = useState(false);
  const [cards, setCards] = useState([{ id: 1, text: "", files: [], memeMode: false, textAlignment: "center" }]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Thought Match State
  const [matches, setMatches] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [currentPostId, setCurrentPostId] = useState(null);

  // Identity Mask State
  const [anonymous, setAnonymous] = useState(false);


  // Link Preview State
  const [linkPreview, setLinkPreview] = useState(null);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // URL Detection
  const detectUrl = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
  };



  // Fetch Link Preview Effect
  useEffect(() => {
    if (isMultiPost) return; // Disable for multipost for now to keep it simple

    const url = detectUrl(text);
    if (url && url !== previewUrl) {
      setPreviewUrl(url);
      fetchLinkPreview(url);
    } else if (!url && linkPreview) {
      setLinkPreview(null);
      setPreviewUrl(null);
    }
  }, [text, isMultiPost]);

  const fetchLinkPreview = async (url) => {
    try {
      setIsFetchingPreview(true);
      const { data } = await api.post("/link-preview", { url });
      if (data.title || data.image) {
        setLinkPreview(data);
      }
    } catch (error) {
      console.error("Failed to fetch link preview", error);
    } finally {
      setIsFetchingPreview(false);
    }
  };

  const removeLinkPreview = () => {
    setLinkPreview(null);
    setPreviewUrl(null); // Prevent refetching same URL until text changes
  };


  const handleMemeModeToggle = () => {
    const updatedCards = [...cards];
    updatedCards[activeCardIndex].memeMode = !updatedCards[activeCardIndex].memeMode;
    setCards(updatedCards);
  };

  const handleAlignmentChange = (alignment) => {
    const updatedCards = [...cards];
    updatedCards[activeCardIndex].textAlignment = alignment;
    setCards(updatedCards);
  };

  const handleLayoutChange = (layout) => {
    const updatedCards = [...cards];
    updatedCards[activeCardIndex].layout = layout;
    setCards(updatedCards);
  };

  const handleStyleChange = (key, value) => {
    const updatedCards = [...cards];
    updatedCards[activeCardIndex][key] = value;
    setCards(updatedCards);
  };

  const moveCard = (index, direction) => {
    // direction: -1 (left), 1 (right)
    if ((index === 0 && direction === -1) || (index === cards.length - 1 && direction === 1)) return;
    const newCards = [...cards];
    // Swap
    [newCards[index], newCards[index + direction]] = [newCards[index + direction], newCards[index]];
    setCards(newCards);
    if (activeCardIndex === index) setActiveCardIndex(index + direction);
    else if (activeCardIndex === index + direction) setActiveCardIndex(index);
  };

  const duplicateCard = (index) => {
    if (cards.length >= 10) return toast.error("Max 10 cards allowed");
    const cardToClone = cards[index];
    const newCard = {
      ...cardToClone,
      id: Date.now(),
      files: [...cardToClone.files] // Shallow copy files array
    };
    const newCards = [...cards];
    newCards.splice(index + 1, 0, newCard); // Insert after
    setCards(newCards);
    setActiveCardIndex(index + 1);
  };



  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [selectedMood, setSelectedMood] = useState("neutral");
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [visibility, setVisibility] = useState("public"); // "public" | "followers" | "whisper"
  const [location, setLocation] = useState(null); // { latitude, longitude }

  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  // Time Capsule State
  const [isTimeCapsule, setIsTimeCapsule] = useState(false);
  const [unlockDate, setUnlockDate] = useState("");

  // Voice Ripple State
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const { loadPosts, user } = useStore();

  const [isDistorted, setIsDistorted] = useState(false);

  const handleVoiceDistortion = async () => {
    if (!audioBlob) return;
    const loadingToast = toast.loading("Distorting voice...");
    try {
      const distortedBlob = await applyVoiceDistortion(audioBlob);
      setAudioBlob(distortedBlob);
      setAudioPreview(URL.createObjectURL(distortedBlob));
      setIsDistorted(true);
      toast.success("Voice hidden! 🕵️‍♂️", { id: loadingToast });
    } catch (err) {
      toast.error("Failed to distort voice", { id: loadingToast });
    }
  };

  // Cleanup Audio Preview
  useEffect(() => {
    return () => {
      // if (audioPreview) URL.revokeObjectURL(audioPreview); // React 18 strict mode double invoke fix: Don't revoke immediately or it breaks 
    };
  }, [audioPreview]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioPreview(URL.createObjectURL(blob));
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop()); // Stop mic
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      toast.success("Recording... 🎙️");
    } catch (err) {
      toast.error("Microphone access denied");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const removeAudio = () => {
    setAudioBlob(null);
    setAudioPreview(null);
    setIsDistorted(false);
  };

  const handleFile = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    // Helper to process files
    const processFiles = (fileList) => fileList.map((file) => ({
      file,
      type: file.type.startsWith("image/") ? "image" : "video",
      preview: URL.createObjectURL(file),
    }));

    const newFiles = processFiles(selectedFiles);

    if (isMultiPost) {
      const updatedCards = [...cards];
      const currentFiles = updatedCards[activeCardIndex].files;
      if (currentFiles.length + newFiles.length > 4) {
        toast.error("Max 4 files per card");
        return;
      }
      updatedCards[activeCardIndex].files = [...currentFiles, ...newFiles];
      setCards(updatedCards);
    } else {
      if (files.length + newFiles.length > 4) {
        toast.error("Maximum 4 media files allowed");
        return;
      }
      setFiles((prev) => [...prev, ...newFiles]);
    }

    e.target.value = ""; // Reset input
  };

  const removeFile = (index) => {
    if (isMultiPost) {
      const updatedCards = [...cards];
      updatedCards[activeCardIndex].files = updatedCards[activeCardIndex].files.filter((_, i) => i !== index);
      setCards(updatedCards);
    } else {
      setFiles((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleCardTextChange = (val) => {
    const updatedCards = [...cards];
    updatedCards[activeCardIndex].text = val;
    setCards(updatedCards);
  };

  const addCard = () => {
    if (cards.length >= 10) return toast.error("Max 10 cards allowed");
    setCards([...cards, { id: Date.now(), text: "", files: [] }]);
    setActiveCardIndex(cards.length); // Switch to new card
  };

  const removeCard = (index) => {
    if (cards.length <= 1) return; // Cannot delete last card
    const newCards = cards.filter((_, i) => i !== index);
    setCards(newCards);
    if (activeCardIndex >= newCards.length) setActiveCardIndex(newCards.length - 1);
  };

  const onEmojiClick = (emojiObject) => {
    if (isMultiPost) {
      handleCardTextChange(cards[activeCardIndex].text + emojiObject.emoji);
    } else {
      setText((prev) => prev + emojiObject.emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const addOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const removeOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const submit = async () => {
    // --- UPLOAD LOGIC ---
    const uploadMedia = async (fileList) => {
      if (!fileList || fileList.length === 0) return [];
      const uploadPromises = fileList.map(async (item) => {
        let fileToUpload = item.file;
        try {
          fileToUpload = await compressImage(item.file);
        } catch (e) {
          console.error("Compression failed, using original", e);
        }

        const { data } = await api.post("/posts/upload-url", {
          fileName: fileToUpload.name,
          fileType: fileToUpload.type,
        });
        await fetch(data.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": fileToUpload.type },
          body: fileToUpload,
        });
        return { url: data.imageUrl, mediaType: item.type };
      });
      return Promise.all(uploadPromises);
    };

    let postData;
    const loadingToast = toast.loading("Creating post...");

    if (isMultiPost) {
      if (cards.every(c => !c.text.trim() && c.files.length === 0)) {
        toast.dismiss(loadingToast);
        return;
      }

      const processedCards = await Promise.all(cards.map(async (card) => {
        let cardMedia = [];
        if (card.files.length > 0) {
          cardMedia = await uploadMedia(card.files);
        }
        return {
          text: card.text,
          media: cardMedia,
          memeMode: card.memeMode || false,
          textAlignment: card.textAlignment || 'center',
          layout: card.layout || 'standard',
          fontFamily: card.fontFamily || 'sans',
          fontSize: card.fontSize || 'medium',
          fontWeight: card.fontWeight || 'normal',
          fontStyle: card.fontStyle || 'normal'
        };
      }));

      postData = {
        cards: processedCards,
        visibility,
        latitude: location?.latitude,
        longitude: location?.longitude,
        theme: { gradientFrom: selectedTheme?.from, gradientTo: selectedTheme?.to, textColor: selectedTheme?.text }
      };

    } else {
      // Single Post Submit
      if (!text.trim() && files.length === 0 && !pollQuestion.trim() && !audioBlob) return;

      // Single Post Validation
      const wordCount = text.trim().split(/\s+/).length;
      if (wordCount > 150) { toast.error("Post cannot exceed 150 words"); return; }

      // Time Capsule Validation
      if (isTimeCapsule && !unlockDate) {
        toast.error("Please select an unlock date for your Time Capsule!");
        return;
      }

      let media = [];
      let audioUrl = null;

      if (files.length > 0) {
        setUploading(true);
        try {
          media = await uploadMedia(files);
        } catch (err) {
          toast.error("Upload failed", { id: loadingToast });
          setUploading(false);
          return;
        }
      }

      // Upload Audio if present
      if (audioBlob) {
        setUploading(true);
        try {
          const audioFile = new File([audioBlob], "voice_ripple.webm", { type: "audio/webm" });
          const uploadedAudio = await uploadMedia([{ file: audioFile, type: "audio" }]);
          if (uploadedAudio && uploadedAudio.length > 0) {
            audioUrl = uploadedAudio[0].url; // Actually works because uploadMedia returns [{url, mediaType}] but we need to check if it handles type 'audio' correctly? 
            // uploadMedia checks type.startsWith("image/") ? "image" : "video". 
            // Wait, I need to check uploadMedia helper inside the component.
          }
        } catch (err) {
          console.error("Audio Upload Failed", err);
          toast.error("Audio upload failed", { id: loadingToast });
          setUploading(false);
          return;
        }
      }

      postData = {
        text: text.trim() || "",
        media,
        image: media.find((m) => m.mediaType === "image")?.url || null,
        video: media.find((m) => m.mediaType === "video")?.url || null,
        audio: audioUrl, // Add audio URL
        isVoiceRipple: !!audioUrl, // Flag as Voice Ripple if audio exists
        poll: showPoll ? {
          question: pollQuestion,
          options: pollOptions.map(text => ({ text, votes: [] }))
        } : null,
        mood: selectedMood,
        anonymous, // Identity Mask
        visibility,
        latitude: location?.latitude,
        longitude: location?.longitude,
        linkPreview,
        // Time Capsule Data
        isLocked: isTimeCapsule,
        unlockCondition: isTimeCapsule ? 'time' : undefined,
        unlockDate: isTimeCapsule ? new Date(unlockDate) : undefined
      };
    }


    try {
      const res = await api.post("/posts", postData);

      // Auto-Reset Form
      setCards([{ id: 1, text: "", files: [] }]);
      setActiveCardIndex(0);
      setIsMultiPost(false);
      setFiles([]);
      setText("");
      setShowPoll(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setSelectedMood("neutral");
      setShowMoodSelector(false);
      setSelectedTheme(THEMES[0]);
      setShowThemeSelector(false);
      setLinkPreview(null); // Reset preview
      setPreviewUrl(null);
      setIsTimeCapsule(false);
      setUnlockDate("");
      setAnonymous(false);
      removeAudio(); // Reset audio
      loadPosts();
      toast.success("Post created successfully!", { id: loadingToast });

      // Check for Thought Matches
      if (res.data.thoughtMatches && res.data.thoughtMatches.length > 0) {
        setMatches(res.data.thoughtMatches);
        setCurrentPostId(res.data._id);
        setShowMatchModal(true);
      }
    } catch (err) {
      toast.error("Failed to create post", { id: loadingToast });
    }
  };

  return (
    <div className="clean-card p-4 mb-6 relative">
      {/* Toggle Mode */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => { setIsMultiPost(!isMultiPost); if (!isMultiPost) { setShowPoll(false); } }}
          className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded transition ${isMultiPost ? "bg-indigo-100 text-indigo-600" : "text-gray-400 hover:bg-gray-100"}`}
        >
          {isMultiPost ? "🃏 Multi-Card Mode" : "Switch to Multi-Card 🃏"}
        </button>
      </div>
      <div className="flex gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-[#0ea5e9] to-blue-600 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user?.name?.[0]?.toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">

          {isMultiPost && (
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 w-full max-w-[calc(100vw-60px)] sm:max-w-full no-scrollbar snap-x snap-mandatory">
              {cards.map((card, idx) => (
                <div key={card.id} className="relative flex-shrink-0 group">
                  <button
                    onClick={() => setActiveCardIndex(idx)}
                    className={`w-16 h-20 rounded-lg border-2 flex flex-col items-center justify-center text-xs font-medium transition ${activeCardIndex === idx ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
                      }`}
                  >
                    <span>Card {idx + 1}</span>
                    {card.files.length > 0 && <span className="text-[10px]">📷 {card.files.length}</span>}
                  </button>
                  {cards.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeCard(idx); }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={8} />
                    </button>
                  )}
                </div>
              ))}
              {cards.length < 10 && (
                <button
                  onClick={addCard}
                  className="w-16 h-20 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50 transition"
                >
                  <span className="text-xl">+</span>
                </button>
              )}
            </div>
          )}

          {isMultiPost && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 px-1 gap-2">
              <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">Card {activeCardIndex + 1}</span>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">

                {(cards[activeCardIndex].files.length > 0) && (
                  <button
                    onClick={handleMemeModeToggle}
                    className={`text-xs font-bold px-2 py-1 rounded-md transition flex items-center gap-1 ${cards[activeCardIndex].memeMode ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                  >
                    <span className="text-lg">Aa</span>
                    {cards[activeCardIndex].memeMode ? "Overlay On" : "Text Overlay"}
                  </button>
                )}

                {/* Alignment Controls */}
                <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                  {['top', 'center', 'bottom'].map(align => (
                    <button
                      key={align}
                      onClick={() => handleAlignmentChange(align)}
                      className={`p-1 rounded ${cards[activeCardIndex].textAlignment === align ? 'bg-white shadow text-black' : 'text-gray-400 hover:text-gray-600'}`}
                      title={`Align ${align}`}
                    >
                      {align === 'top' && <div className="w-3 h-3 flex flex-col justify-start border border-current rounded"><div className="w-full h-1 bg-current"></div></div>}
                      {align === 'center' && <div className="w-3 h-3 flex flex-col justify-center border border-current rounded"><div className="w-full h-1 bg-current"></div></div>}
                      {align === 'bottom' && <div className="w-3 h-3 flex flex-col justify-end border border-current rounded"><div className="w-full h-1 bg-current"></div></div>}
                    </button>
                  ))}
                </div>

                {/* Styling Controls */}
                <div className="flex bg-gray-100 rounded-lg p-1 gap-1 ml-2">
                  {/* BOLD */}
                  <button onClick={() => handleStyleChange('fontWeight', cards[activeCardIndex].fontWeight === 'bold' ? 'normal' : 'bold')} className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold ${cards[activeCardIndex].fontWeight === 'bold' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>B</button>
                  {/* ITALIC */}
                  <button onClick={() => handleStyleChange('fontStyle', cards[activeCardIndex].fontStyle === 'italic' ? 'normal' : 'italic')} className={`w-7 h-7 flex items-center justify-center rounded text-xs italic ${cards[activeCardIndex].fontStyle === 'italic' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>I</button>

                  <div className="w-px bg-gray-300 mx-1"></div>

                  {/* FONT SIZE */}
                  <button onClick={() => handleStyleChange('fontSize', 'small')} className={`w-7 h-7 flex items-center justify-center rounded text-[10px] ${cards[activeCardIndex].fontSize === 'small' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>A</button>
                  <button onClick={() => handleStyleChange('fontSize', 'medium')} className={`w-7 h-7 flex items-center justify-center rounded text-xs ${(!cards[activeCardIndex].fontSize || cards[activeCardIndex].fontSize === 'medium') ? 'bg-white shadow text-black' : 'text-gray-500'}`}>A</button>
                  <button onClick={() => handleStyleChange('fontSize', 'large')} className={`w-7 h-7 flex items-center justify-center rounded text-sm font-bold ${cards[activeCardIndex].fontSize === 'large' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>A</button>

                  <div className="w-px bg-gray-300 mx-1"></div>

                  {/* FONT FAMILY */}
                  <select
                    value={cards[activeCardIndex].fontFamily || 'sans'}
                    onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                    className="bg-transparent text-xs text-gray-600 outline-none w-16"
                  >
                    <option value="sans">Sans</option>
                    <option value="serif">Serif</option>
                    <option value="mono">Mono</option>
                    <option value="handwritten">Hand</option>
                  </select>
                </div>

                {/* Layout Controls (Only if media exists) */}
                {(cards[activeCardIndex].files.length > 0) && (
                  <div className="flex bg-gray-100 rounded-lg p-1 gap-1 ml-2">
                    <button onClick={() => handleLayoutChange('standard')} className={`p-1 rounded ${!cards[activeCardIndex].layout || cards[activeCardIndex].layout === 'standard' ? 'bg-white shadow text-black' : 'text-gray-400'}`} title="Standard">
                      <div className="w-3 h-3 flex flex-col gap-0.5"><div className="w-full h-1.5 bg-current rounded-sm"></div><div className="w-full h-1 bg-current opacity-50 rounded-sm"></div></div>
                    </button>
                    <button onClick={() => handleLayoutChange('split_left')} className={`p-1 rounded ${cards[activeCardIndex].layout === 'split_left' ? 'bg-white shadow text-black' : 'text-gray-400'}`} title="Split Left">
                      <div className="w-3 h-3 flex gap-0.5"><div className="h-full w-1 bg-current opacity-50 rounded-sm"></div><div className="h-full w-2 bg-current rounded-sm"></div></div>
                    </button>
                    <button onClick={() => handleLayoutChange('split_right')} className={`p-1 rounded ${cards[activeCardIndex].layout === 'split_right' ? 'bg-white shadow text-black' : 'text-gray-400'}`} title="Split Right">
                      <div className="w-3 h-3 flex gap-0.5"><div className="h-full w-2 bg-current rounded-sm"></div><div className="h-full w-1 bg-current opacity-50 rounded-sm"></div></div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {isMultiPost && activeCardIndex !== null && (
            <div className="flex gap-2 justify-end mb-2">
              <button onClick={() => moveCard(activeCardIndex, -1)} disabled={activeCardIndex === 0} className="text-gray-400 hover:text-blue-500 disabled:opacity-20"><span className="text-lg">⬅️</span></button>
              <button onClick={() => duplicateCard(activeCardIndex)} className="text-xs text-blue-500 font-bold hover:bg-blue-50 px-2 rounded">Duplicate</button>
              <button onClick={() => moveCard(activeCardIndex, 1)} disabled={activeCardIndex === cards.length - 1} className="text-gray-400 hover:text-blue-500 disabled:opacity-20"><span className="text-lg">➡️</span></button>
            </div>
          )}

          <textarea
            value={isMultiPost ? cards[activeCardIndex].text : text}
            onChange={(e) => isMultiPost ? handleCardTextChange(e.target.value) : setText(e.target.value)}
            placeholder={isMultiPost ? `Card ${activeCardIndex + 1} text...` : "What's on your mind?"}
            style={isMultiPost ? {
              background: `linear-gradient(to bottom right, ${selectedTheme.from}, ${selectedTheme.to})`,
              color: selectedTheme.text,
              fontFamily: cards[activeCardIndex].fontFamily === 'mono' ? 'monospace' : cards[activeCardIndex].fontFamily === 'serif' ? 'serif' : cards[activeCardIndex].fontFamily === 'handwritten' ? 'cursive' : 'sans-serif',
              fontWeight: cards[activeCardIndex].fontWeight,
              fontStyle: cards[activeCardIndex].fontStyle
            } : {}}
            className={`w-full resize-none outline-none text-lg text-gray-700 placeholder-gray-400 min-h-[60px] ${isMultiPost ? "p-4 rounded-xl border border-black/5 shadow-inner transition-all duration-300" : ""}`}
            rows="2"
          />

          {(isMultiPost ? cards[activeCardIndex].files : files).length > 0 && (
            <div className={`grid gap-2 mt-2 ${(isMultiPost ? cards[activeCardIndex].files : files).length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {(isMultiPost ? cards[activeCardIndex].files : files).map((item, index) => (
                <div key={index} className="relative rounded-xl overflow-hidden h-40 bg-gray-100">
                  {item.type === "image" ? (
                    <img src={item.preview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <video src={item.preview} controls className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-full hover:bg-black transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showPoll && !isMultiPost && (
            <div className="mt-3 border border-gray-200 rounded-xl p-3 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full bg-transparent font-medium text-gray-900 placeholder-gray-500 outline-none"
                />
                <button onClick={() => setShowPoll(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0ea5e9]"
                    />
                    {pollOptions.length > 2 && (
                      <button onClick={() => removeOption(index)} className="text-gray-400 hover:text-red-500">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <button
                    onClick={addOption}
                    className="text-sm text-[#0ea5e9] font-medium hover:underline pl-1"
                  >
                    + Add option
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Link Preview Display */}
      {!isMultiPost && (
        <div className="mt-2">
          {isFetchingPreview && (
            <div className="text-xs text-gray-400 animate-pulse">
              Fetching link preview...
            </div>
          )}
          <LinkPreviewCard preview={linkPreview} onRemove={removeLinkPreview} />
        </div>
      )}

      {/* Audio Preview */}
      {audioPreview && !isMultiPost && (
        <div className={`mt-3 p-3 border rounded-xl flex flex-wrap items-center justify-between animate-fade-in-down transition-colors gap-2 ${isDistorted ? "bg-gray-900 border-purple-900/50" : "bg-blue-50 border-blue-100"
          }`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all ${isDistorted ? "bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.5)]" : "bg-blue-500"
              }`}>
              {isDistorted ? <Wand2 size={16} /> : <Mic size={16} />}
            </div>
            <audio src={audioPreview} controls className="h-8 w-32 sm:w-48" />

            {!isDistorted && (
              <button
                onClick={handleVoiceDistortion}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-lg hover:brightness-110 transition shadow-sm"
                title="Apply Whisper Mode (Deep Voice)"
              >
                <Wand2 size={12} />
                <span className="hidden sm:inline">Whisper Mode 🪄</span>
              </button>
            )}

            {isDistorted && (
              <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/50 text-purple-300 text-[10px] font-bold rounded uppercase tracking-wider">
                Voice Masked
              </span>
            )}
          </div>
          <button onClick={removeAudio} className={`p-1 transition ${isDistorted ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-red-500"}`}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Recording Indicator */}
      {recording && !isMultiPost && (
        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-pulse">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-red-600 font-medium text-sm">Recording Voice Ripple...</span>
        </div>
      )}

      {/* Time Capsule Inputs */}
      {isTimeCapsule && !isMultiPost && (
        <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl animate-fade-in-down">
          <div className="flex items-center gap-2 mb-2 text-indigo-700 font-medium text-sm">
            <Hourglass size={16} />
            <span>Time Capsule: When should this unlock?</span>
          </div>
          <input
            type="datetime-local"
            value={unlockDate}
            onChange={(e) => setUnlockDate(e.target.value)}
            className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>
      )}


      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mt-4 pt-4 border-t border-gray-100 gap-4">
        <div className="flex flex-wrap gap-3 sm:gap-4 relative w-full sm:w-auto">
          <label className="cursor-pointer flex items-center gap-2 text-gray-500 hover:text-[#0ea5e9] transition font-medium text-sm">
            <Image size={20} />
            <span className="hidden sm:inline">Media</span>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFile}
              className="hidden"
              disabled={(isMultiPost ? cards[activeCardIndex].files : files).length >= 4}
            />
          </label>
          <button
            onClick={() => setShowPoll(!showPoll)}
            className={`flex items-center gap-2 transition font-medium text-sm ${showPoll ? "text-[#0ea5e9]" : "text-gray-500 hover:text-[#0ea5e9]"}`}
            disabled={(isMultiPost ? cards[activeCardIndex].files : files).length > 0 || isMultiPost}
          >
            <BarChart2 size={20} />
            <span className="hidden sm:inline">Poll</span>
          </button>

          <button
            onClick={() => setAnonymous(!anonymous)}
            className={`flex items-center gap-2 transition font-medium text-sm ${anonymous ? "text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg" : "text-gray-500 hover:text-indigo-600"}`}
            title="Wear Identity Mask"
          >
            {anonymous ? (
              <>
                <span className="text-xl">🎭</span>
                <span className="hidden sm:inline">Mask On</span>
              </>
            ) : (
              <>
                <span className="text-xl grayscale opacity-50">🎭</span>
                <span className="hidden sm:inline">Mask Off</span>
              </>
            )}
          </button>

          <button
            onClick={() => setVisibility(visibility === "public" ? "followers" : "public")}
            className={`flex items-center gap-2 transition font-medium text-sm ${visibility === "followers" ? "text-purple-600 bg-purple-50 px-2 py-1 rounded-lg" : "text-gray-500 hover:text-purple-600"}`}
            title="Toggle Visibility"
          >
            {visibility === "public" ? (
              <>
                <span className="text-gray-500">🌎</span>
                <span className="hidden sm:inline">Public</span>
              </>
            ) : visibility === "followers" ? (
              <>
                <span className="text-purple-600">🔒</span>
                <span className="hidden sm:inline">Followers</span>
              </>
            ) : (
              <>
                <span className="text-emerald-600">📍</span>
                <span className="hidden sm:inline">Whisper</span>
              </>
            )}
          </button>

          {isMultiPost && (
            <div className="relative">
              <button
                onClick={() => setShowThemeSelector(!showThemeSelector)}
                className={`flex items-center gap-2 transition font-medium text-sm ${showThemeSelector ? "text-pink-600 bg-pink-50" : "text-gray-500 hover:text-pink-600"} rounded-lg px-2 py-1`}
              >
                <Palette size={20} />
                <span className="hidden sm:inline">Theme</span>
              </button>
              {showThemeSelector && (
                <div className="absolute top-10 left-0 bg-white border border-gray-100 shadow-xl rounded-xl p-3 grid grid-cols-4 gap-2 w-64 z-50">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.name}
                      onClick={() => { setSelectedTheme(theme); setShowThemeSelector(false); }}
                      className={`w-10 h-10 rounded-full border-2 transition ${selectedTheme.name === theme.name ? "border-black scale-110" : "border-gray-200 hover:scale-105"}`}
                      style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
                      title={theme.name}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {!isMultiPost && (
            <button
              onClick={() => { setIsTimeCapsule(!isTimeCapsule); if (!isTimeCapsule) setUnlockDate(""); }}
              className={`flex items-center gap-2 transition font-medium text-sm ${isTimeCapsule ? "text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg" : "text-gray-500 hover:text-indigo-600"}`}
              title="Create Time Capsule"
            >
              <Hourglass size={20} />
              <span className="hidden sm:inline">Capsule</span>
            </button>
          )}

          <button
            onClick={() => {
              if (location) {
                setLocation(null);
                toast.success("Location removed");
              } else {
                if (!navigator.geolocation) {
                  toast.error("Geolocation is not supported by your browser");
                  return;
                }
                toast.loading("Getting location...", { id: "geo" });
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    setLocation({
                      latitude: position.coords.latitude,
                      longitude: position.coords.longitude
                    });
                    // Do NOT force whisper mode anymore
                    // setVisibility("whisper"); 
                    toast.success("Location added! 📍", { id: "geo" });
                  },
                  (error) => {
                    if (error.code === 1) {
                      toast.error("Location blocked. Click the 🔒 icon in address bar to allow.", { id: "geo", duration: 5000 });
                    } else {
                      toast.error("Unable to retrieve location. Please try again.", { id: "geo" });
                    }
                  }
                );
              }
            }}
            className={`flex items-center gap-2 transition font-medium text-sm ${location ? "text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg" : "text-gray-500 hover:text-emerald-600"}`}
            title="Attach Location"
          >
            <MapPin size={20} className={location ? "fill-current" : ""} />
            <span className="hidden sm:inline">{location ? "Location Set" : "Location"}</span>
          </button>

          {!isMultiPost && (
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`flex items-center gap-2 transition font-medium text-sm ${recording ? "text-red-600 animate-pulse bg-red-50 px-2 py-1 rounded-lg" : (audioBlob ? "text-blue-600 bg-blue-50 px-2 py-1 rounded-lg" : "text-gray-500 hover:text-red-600")}`}
              disabled={!!audioBlob && !recording} // Disable if already recorded (must delete first)
              title="Record Voice Ripple"
            >
              {recording ? <StopCircle size={20} /> : <Mic size={20} />}
              <span className="hidden sm:inline">{recording ? "Stop Rec" : (audioBlob ? "Recorded" : "Voice")}</span>
            </button>
          )}


          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="flex items-center gap-2 text-gray-500 hover:text-yellow-500 transition font-medium text-sm"
          >
            <Smile size={20} />
            <span className="hidden sm:inline">Emoji</span>
          </button>

          <button
            onClick={() => setShowMoodSelector(!showMoodSelector)}
            className={`flex items-center gap-2 transition font-medium text-sm ${selectedMood !== "neutral" ? "text-purple-600 bg-purple-50 px-2 py-1 rounded-lg" : "text-gray-500 hover:text-purple-600"}`}
          >
            {selectedMood !== "neutral" ? (
              <>
                {(() => {
                  const MoodIcon = MOODS.find(m => m.id === selectedMood)?.icon;
                  return MoodIcon ? <MoodIcon size={18} /> : <Smile size={18} />;
                })()}
                <span className="capitalize hidden sm:inline">{selectedMood}</span>
              </>
            ) : (
              <>
                <span className="text-lg">🌈</span>
                <span className="hidden sm:inline">Mood</span>
              </>
            )}
          </button>

          {showMoodSelector && (
            <div className="absolute top-10 left-0 z-50 bg-white shadow-xl rounded-xl border border-gray-100 p-2 w-[300px]">
              <MoodSelector selectedMood={selectedMood} onSelect={(m) => { setSelectedMood(m); setShowMoodSelector(false); }} />
            </div>
          )}

          {showEmojiPicker && (
            <div className="absolute top-10 left-0 z-50 shadow-xl rounded-xl">
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </div>
          )}
        </div>

        <button
          onClick={submit}
          disabled={uploading || (isMultiPost ? cards.every(c => !c.text.trim() && c.files.length === 0) : (!text.trim() && files.length === 0))}
          className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {uploading ? (
            "Posting..."
          ) : (
            <>
              Post <Send size={16} />
            </>
          )}
        </button>
      </div>

      {
        showMatchModal && (
          <ThoughtMatchModal
            matches={matches}
            onClose={() => setShowMatchModal(false)}
            postId={currentPostId}
          />
        )
      }
    </div >
  );
}
