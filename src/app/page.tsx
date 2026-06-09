"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Settings,
  HelpCircle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Search,
  Trash2,
  Star,
  Activity,
  Heart,
  Volume2,
  Info,
  Layers,
  Music,
  User,
  Sliders,
  Award
} from "lucide-react";
import {
  generateMusicIdea,
  optimizePrompt,
  analyzePromptQuality,
  runPromptDoctor,
  convertStyle,
  MusicAnalysisResult,
  PromptScoreBreakdown,
  DoctorAnalysisResult,
  StyleConversionResult
} from "./lib/gemini-api";

// 3-level explanations for the Beginner Learning System
interface OptionDetail {
  title: string;
  technical: string;
  beginner: string;
  feel: string;
}

const OPTION_DETAILS: Record<string, OptionDetail> = {
  genre: {
    title: "Genre (장르)",
    technical: "곡의 역사적, 문화적 계보를 규정하고 고유의 악기 편성과 비트 패턴을 가지는 음악적 분류 카테고리입니다.",
    beginner: "음악의 전체적인 스타일과 성격을 의미하며, 어떤 종류의 노래인지를 나타냅니다.",
    feel: "LoFi는 방 안에서 공부할 때의 차분함, EDM은 페스티벌의 짜릿한 축제, Pop은 길거리 카페에서 흘러나오는 친근한 대중성을 떠올리게 합니다."
  },
  mood: {
    title: "Mood (분위기)",
    technical: "화성학적 코드 진행, 선율적 다이내믹, 사운드 톤이 청중에게 불러일으키는 정신적 감정 상태입니다.",
    beginner: "음악이 전해주는 정서적인 감정과 느낌(예: 기쁨, 슬픔, 신남 등)입니다.",
    feel: "Nostalgic은 서랍 속 옛 사진을 볼 때의 아련함, Triumphant는 경기가 끝나고 트로피를 들어올릴 때의 웅장함, Chill은 일요일 오후 침대에 누워있을 때의 평화로움입니다."
  },
  bpm: {
    title: "Tempo & BPM (템포/속도)",
    technical: "BPM(Beats Per Minute)은 1분당 비트의 개수를 의미하며, 곡의 물리적 속도를 정의하는 척도입니다.",
    beginner: "음악이 흘러가는 빠르기입니다. 숫자가 클수록 신나고 빠릅니다.",
    feel: "70 BPM은 새벽 가로등 아래를 터덜터덜 걷는 차분함, 100 BPM은 상쾌한 아침 출근길의 가벼운 발걸음, 130 BPM 이상은 심장을 요동치게 만드는 피트니스 클럽의 에너지입니다."
  },
  instruments: {
    title: "Instruments (악기 구성)",
    technical: "물리적 발음 원리 및 디지털 신호 처리를 통해 개별 파트의 음향적 톤과 질감을 생성하는 악기군 편성입니다.",
    beginner: "곡을 풍성하게 채워주는 소리들의 종류(피아노, 통기타, 드럼 등)입니다.",
    feel: "Upright Piano는 나무 건반을 직접 누르는 듯한 서정적인 느낌, Nylon Acoustic Guitar는 손끝으로 퉁기는 따뜻한 통기타 선율, 808 Bass는 가슴을 강하게 때리는 묵직한 클럽 사운드입니다."
  },
  vocals: {
    title: "Vocals (보컬 스타일)",
    technical: "가창자의 성대 음색 특성, 가성/진성 표현법, 다이내믹 범위 및 노래가 불리는 언어 장벽을 정의합니다.",
    beginner: "노래를 부르는 사람의 목소리 스타일과 성별, 느낌입니다.",
    feel: "Airy는 귀에 대고 부드럽게 속삭이는 숨소리 섞인 목소리, Raspy는 오랜 연륜이 묻어나는 매력적인 허스키 톤, Soulful은 가슴 깊은 곳에서 뽑아내는 시원시원한 가창력입니다."
  },
  structure: {
    title: "Structure (곡 구조)",
    technical: "곡의 형식(Form)으로 소절의 대비와 긴장-이완의 흐름을 설계하는 구성 프레임입니다.",
    beginner: "노래가 진행되는 전개 순서(시작부, 절, 후렴, 마무리 등)입니다.",
    feel: "Intro는 노래 시작 전 심장 소리를 고조시키고, Verse는 조용하게 이야기를 풀어가며, Chorus에서 웅장하게 터진 후, Outro에서 깊은 여운을 주며 사라지는 연출입니다."
  },
  production: {
    title: "Production (믹싱 및 질감)",
    technical: "음장감 제어(Reverb, Delay) 및 다이내믹스 보정, 믹싱 질감 처리를 통해 곡의 현대성이나 오디오 스타일을 완성합니다.",
    beginner: "소리의 공간감이나 울림, 음질의 깔끔함 등 마지막 마무리 단장의 형태입니다.",
    feel: "Analog Tape Warmth는 옛날 라디오/테이프에서 흘러나오는 듯 따뜻하고 먼지 낀 포근함, Clean Digital은 흠집 하나 없는 최신 스마트폰 음원처럼 맑음, Space Reverb는 거대한 성당 안에서 노래가 울려퍼지는 듯한 신비함입니다."
  }
};

// Preset lists
interface Preset {
  name: string;
  genre: string;
  mood: string;
  bpm: number;
  instruments: string[];
  vocal: string;
  structure: string;
  production: string;
  lyrics: string;
  reason: string;
}

const PRESETS: Record<string, Preset> = {
  lofiStudy: {
    name: "LoFi Study (공부용 로파이)",
    genre: "chill modern lo-fi hip-hop track",
    mood: "peaceful, focused and nostalgic",
    bpm: 78,
    instruments: ["warm electric piano chords", "subtle vinyl crackle noise", "laid-back acoustic boom-bap drum beat", "smooth bass guitar"],
    vocal: "no vocals, purely instrumental",
    structure: "Intro - Loop - Outro",
    production: "analog tape saturation, soft lowpass filter, cozy bedroom atmosphere",
    lyrics: "",
    reason: "학습에 방해되지 않는 차분한 리듬과 따뜻한 일렉트릭 피아노를 조합하여 고도의 집중력을 발휘할 수 있는 공부방 무드를 형성했습니다."
  },
  tokyoRain: {
    name: "Tokyo Rain (도쿄 비 오는 밤)",
    genre: "melancholic ambient jazz fusion",
    mood: "dreamy, nostalgic and cozy late-night vibe",
    bpm: 65,
    instruments: ["upright piano", "real rain and thunder ambience", "gentle brush drum snare", "soft double bass"],
    vocal: "breathy, whispery female vocals in Japanese",
    structure: "Intro - Verse 1 - Chorus - Outro",
    production: "spacious reverb, warm intimate mix, wide stereo image",
    lyrics: "[Intro]\n(Sound of rain on window)\n\n[Verse 1]\n도쿄의 밤거리에 비가 내리고\n우리는 우산 아래 서로를 밀어내네\n\n[Chorus]\n오, 떨어지는 빗방울 속에\n희미해져 가는 그대의 온기",
    reason: "실제 비 소리와 조화를 이루는 업라이트 피아노 선율, 그리고 속삭이는 듯한 일본어 여성 보컬을 구성해 쓸쓸하면서도 포근한 밤거리를 표현했습니다."
  },
  summerDrive: {
    name: "Summer Drive (여름 해안 드라이브)",
    genre: "retro synthwave pop",
    mood: "energetic, nostalgic and euphoric summer vibe",
    bpm: 118,
    instruments: ["classic 1980s analog synthesizers", "driving synth bassline", "punchy linndrum machine beat", "bright electric guitar accents"],
    vocal: "reverb-drenched, high-pitched male vocals in English",
    structure: "Intro - Verse - Chorus - Bridge - Chorus - Outro",
    production: "gated reverb on snare, stereo delay, bright and crisp production",
    lyrics: "",
    reason: "80년대 신시사이저 소리와 시원하게 질주하는 드럼 비트를 통해 여름날 붉은 노을을 등지고 해안 도로를 달리는 상쾌함을 선사합니다."
  },
  epicTrailer: {
    name: "Epic Trailer (웅장한 트레일러)",
    genre: "orchestral cinematic film score",
    mood: "tense, powerful, dark and triumphant",
    bpm: 130,
    instruments: ["massive staccato string ensemble", "heroic French horn choir", "booming orchestral percussion and taiko drums", "haunting choir swells"],
    vocal: "epic cinematic choir chanting in Latin",
    structure: "Intro - Build Up - Climax - Outro",
    production: "massive hall reverb, heavy sub-bass impacts, master compression for maximum loudness",
    lyrics: "",
    reason: "스타카토로 몰아치는 현악기 군단과 거대한 브라스 사운드를 조화시켜 블록버스터 영화 예고편의 팽팽한 긴장감과 승리의 웅장함을 빌드업합니다."
  },
  cafeJazz: {
    name: "Cafe Jazz (오후의 햇살 카페)",
    genre: "classic Brazilian bossa nova",
    mood: "happy, relaxed and breezy afternoon vibe",
    bpm: 88,
    instruments: ["warm nylon-string acoustic guitar", "soft acoustic shaker and bongo rhythm", "gentle jazz flute melody", "upright bass"],
    vocal: "warm and intimate female lead vocals in Korean",
    structure: "Intro - Verse - Chorus - Verse - Chorus - Outro",
    production: "clean acoustic mixing, warm room ambience, natural vocal dynamics",
    lyrics: "[Intro]\n(Acoustic guitar gentle picking)\n\n[Verse 1]\n창가에 스며든 오후의 따뜻한 햇살\n커피 향 가득한 이곳에서\n\n[Chorus]\n우리의 속삭임은 바람이 되어 흐르고\n조용한 미소 속에 쉬어가네",
    reason: "부드럽고 리드미컬한 어쿠스틱 나일론 기타 연주와 속삭이듯 친근한 한국어 여성 보컬이 조화를 이루어 아늑한 일요일 카페의 햇살을 느끼게 합니다."
  }
};

interface HistoryItem {
  id: string;
  timestamp: string;
  idea: string;
  prompt: string;
  score: number;
  favorite: boolean;
  params: {
    genre: string;
    mood: string;
    bpm: number;
    instruments: string[];
    vocal: string;
    structure: string;
    production: string;
    lyrics: string;
  };
}

export default function Home() {
  // App States
  const [apiKey, setApiKey] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-flash");
  const [activeTab, setActiveTab] = useState<"builder" | "doctor" | "converter" | "history">("builder");
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [showApiKeyWarning, setShowApiKeyWarning] = useState<boolean>(false);

  // Builder States
  const [ideaInput, setIdeaInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Configurable Music Parameters
  const [genre, setGenre] = useState<string>("");
  const [mood, setMood] = useState<string>("");
  const [bpm, setBpm] = useState<number>(100);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [vocal, setVocal] = useState<string>("");
  const [structure, setStructure] = useState<string>("");
  const [production, setProduction] = useState<string>("");
  const [customLyrics, setCustomLyrics] = useState<string>("");

  // AI Output States
  const [aiReasons, setAiReasons] = useState<Record<string, string>>({});
  const [useCases, setUseCases] = useState<string[]>([]);
  const [similarPrompts, setSimilarPrompts] = useState<string[]>([]);
  const [finalPrompt, setFinalPrompt] = useState<string>("");
  const [promptScore, setPromptScore] = useState<PromptScoreBreakdown | null>(null);

  // Active Tooltip Detail State (Beginner System)
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Prompt Doctor States
  const [doctorRawPrompt, setDoctorRawPrompt] = useState<string>("");
  const [doctorCritique, setDoctorCritique] = useState<string>("");
  const [doctorMissing, setDoctorMissing] = useState<string[]>([]);
  const [doctorImproved, setDoctorImproved] = useState<string>("");
  const [doctorLoading, setDoctorLoading] = useState<boolean>(false);
  const [doctorCopied, setDoctorCopied] = useState<boolean>(false);

  // Style Converter States
  const [converterKeyword, setConverterKeyword] = useState<string>("");
  const [converterResult, setConverterResult] = useState<StyleConversionResult | null>(null);
  const [converterLoading, setConverterLoading] = useState<boolean>(false);
  const [converterPrompt, setConverterPrompt] = useState<string>("");
  const [converterCopied, setConverterCopied] = useState<boolean>(false);

  // Local History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Initialize and Load Local Storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("lps_gemini_api_key") || "";
      const savedModel = localStorage.getItem("lps_gemini_model") || "gemini-2.5-flash";
      const savedHistory = localStorage.getItem("lps_history") || "[]";
      setApiKey(savedKey);
      setSelectedModel(savedModel);
      setHistory(JSON.parse(savedHistory));

      if (!savedKey) {
        setShowApiKeyWarning(true);
        setSettingsOpen(true);
      }
    }
  }, []);

  // Handle outside click to close tooltip
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setActiveTooltip(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save Settings Helper
  const saveSettings = (key: string, model: string) => {
    setApiKey(key);
    setSelectedModel(model);
    localStorage.setItem("lps_gemini_api_key", key);
    localStorage.setItem("lps_gemini_model", model);
    setSettingsOpen(false);
    setShowApiKeyWarning(false);
  };

  // Add Item to History
  const addToHistory = (promptText: string, scoreVal: number, ideaVal: string) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleString("ko-KR"),
      idea: ideaVal || "자율 빌더 조립",
      prompt: promptText,
      score: scoreVal,
      favorite: false,
      params: {
        genre,
        mood,
        bpm,
        instruments: selectedInstruments,
        vocal,
        structure,
        production,
        lyrics: customLyrics
      }
    };
    const updatedHistory = [newItem, ...history.slice(0, 19)];
    setHistory(updatedHistory);
    localStorage.setItem("lps_history", JSON.stringify(updatedHistory));
  };

  // Delete from History
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem("lps_history", JSON.stringify(updated));
  };

  // Toggle Favorite in History
  const toggleFavoriteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.map((item) => {
      if (item.id === id) {
        return { ...item, favorite: !item.favorite };
      }
      return item;
    });
    setHistory(updated);
    localStorage.setItem("lps_history", JSON.stringify(updated));
  };

  // Load from History
  const loadHistoryItem = (item: HistoryItem) => {
    setGenre(item.params.genre);
    setMood(item.params.mood);
    setBpm(item.params.bpm);
    setSelectedInstruments(item.params.instruments);
    setVocal(item.params.vocal);
    setStructure(item.params.structure);
    setProduction(item.params.production);
    setCustomLyrics(item.params.lyrics);
    setFinalPrompt(item.prompt);
    setIdeaInput(item.idea);
    setActiveTab("builder");
    // Trigger analyzer locally with current state
    if (apiKey) {
      setIsLoading(true);
      analyzePromptQuality(apiKey, item.prompt, selectedModel)
        .then((score) => {
          setPromptScore(score);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  };

  // Load Smart Preset Helper
  const loadPreset = (key: keyof typeof PRESETS) => {
    const preset = PRESETS[key];
    setGenre(preset.genre);
    setMood(preset.mood);
    setBpm(preset.bpm);
    setSelectedInstruments(preset.instruments);
    setVocal(preset.vocal);
    setStructure(preset.structure);
    setProduction(preset.production);
    setCustomLyrics(preset.lyrics);
    setAiReasons({
      genre: preset.reason,
      bpm: "프리셋 기본 템포 매핑",
      instruments: "프리셋 시그니처 사운드 적용"
    });
    setUseCases([preset.name, "프리셋 감성"]);
    setFinalPrompt("");
    setPromptScore(null);
  };

  // Mood Map clicking handler (Valence & Energy)
  const handleMoodMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100; // 0 to 100
    const y = (1 - (e.clientY - rect.top) / rect.height) * 100; // 0 to 100

    let recommendedGenre = "";
    let recommendedMood = "";
    let recommendedBpm = 100;
    let recommendedInstruments: string[] = [];
    let recommendedVocal = "";
    let recommendedProduction = "";

    if (x >= 50 && y >= 50) {
      // Quadrant 1: High Energy, High Valence (Happy, Energetic)
      recommendedGenre = "uplifting dance pop";
      recommendedMood = "energetic, bright and joyful";
      recommendedBpm = 124;
      recommendedInstruments = ["punchy electronic drums", "bright acoustic guitar", "uplifting piano chords", "warm synth chords"];
      recommendedVocal = "clear and powerful female vocals in English";
      recommendedProduction = "clean digital master, wide stereofield, crisp high-end";
    } else if (x < 50 && y >= 50) {
      // Quadrant 2: High Energy, Low Valence (Angry, Intense, Melancholic Rock)
      recommendedGenre = "intense alternative rock / modern metal";
      recommendedMood = "dark, aggressive, powerful and suspenseful";
      recommendedBpm = 138;
      recommendedInstruments = ["heavy distorted electric guitars", "pounding acoustic drum kit", "overdriven bass guitar"];
      recommendedVocal = "raspy, emotive male rock vocals in Korean";
      recommendedProduction = "raw garage-style mix, heavy compression, aggressive dynamics";
    } else if (x < 50 && y < 50) {
      // Quadrant 3: Low Energy, Low Valence (Sad, Melancholic, Soft)
      recommendedGenre = "slow cinematic ambient / sad piano ballad";
      recommendedMood = "melancholic, somber, quiet and reflective";
      recommendedBpm = 68;
      recommendedInstruments = ["soft felt piano keys", "slow emotional cello notes", "ambient pad synthesizers"];
      recommendedVocal = "whispery, delicate female vocal in Korean";
      recommendedProduction = "deep spacious reverb, analog tape hiss, intimate stereo width";
    } else {
      // Quadrant 4: Low Energy, High Valence (Calm, Peaceful, Cozy)
      recommendedGenre = "cozy bossa nova / warm acoustic folk";
      recommendedMood = "chill, peaceful, relaxed and cozy";
      recommendedBpm = 85;
      recommendedInstruments = ["warm nylon acoustic guitar", "soft acoustic shaker", "subtle double bass plucks"];
      recommendedVocal = "warm, mellow male vocals in English";
      recommendedProduction = "clean organic acoustic mix, warm room ambience";
    }

    setGenre(recommendedGenre);
    setMood(recommendedMood);
    setBpm(recommendedBpm);
    setSelectedInstruments(recommendedInstruments);
    setVocal(recommendedVocal);
    setStructure("Intro - Verse - Chorus - Outro");
    setProduction(recommendedProduction);
    setAiReasons({
      genre: `무드 맵 좌표(에너지: ${Math.round(y)}%, 밝기: ${Math.round(x)}%)를 분석하여 최적의 사운드를 설계했습니다.`,
      bpm: `지정된 에너지 레벨에 맞춰 동작하기 적합한 ${recommendedBpm} BPM으로 설정했습니다.`,
      instruments: "조합된 정서에 가장 잘 부응하는 시그니처 사운드 편성입니다."
    });
    setUseCases(["무드맵 추천 상황"]);
    setFinalPrompt("");
    setPromptScore(null);
  };

  // Helper instrument toggle
  const toggleInstrument = (inst: string) => {
    if (selectedInstruments.includes(inst)) {
      setSelectedInstruments(selectedInstruments.filter((i) => i !== inst));
    } else {
      setSelectedInstruments([...selectedInstruments, inst]);
    }
  };

  // Main flow A: AI Idea Generator
  const handleAnalyzeIdea = async () => {
    if (!apiKey) {
      setSettingsOpen(true);
      return;
    }
    if (!ideaInput.trim()) return;

    setIsLoading(true);
    setFinalPrompt("");
    setPromptScore(null);

    try {
      const result = await generateMusicIdea(apiKey, ideaInput, selectedModel);
      setGenre(result.genre);
      setMood(result.mood);
      setBpm(result.bpm);
      setSelectedInstruments(result.instruments);
      setVocal(result.vocal);
      setStructure(result.structure);
      setProduction(result.production);
      setAiReasons(result.reason);
      setUseCases(result.use_cases);
      setSimilarPrompts(result.similar_prompts);
    } catch (error: any) {
      alert(error.message || "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // Main flow: Builder -> Optimize & Analyze
  const handleOptimizePrompt = async () => {
    if (!apiKey) {
      setSettingsOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const optimized = await optimizePrompt(
        apiKey,
        {
          genre,
          mood,
          bpm,
          instruments: selectedInstruments,
          vocal,
          structure,
          production,
          customLyrics
        },
        selectedModel
      );

      setFinalPrompt(optimized);

      // Instantly run quality analyzer
      const score = await analyzePromptQuality(apiKey, optimized, selectedModel);
      setPromptScore(score);

      // Automatically add to history log
      addToHistory(optimized, score.total, ideaInput);
    } catch (error: any) {
      alert(error.message || "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // Flow C: Prompt Doctor execution
  const handleDoctorSubmit = async () => {
    if (!apiKey) {
      setSettingsOpen(true);
      return;
    }
    if (!doctorRawPrompt.trim()) return;

    setDoctorLoading(true);
    setDoctorCritique("");
    setDoctorImproved("");
    try {
      const result = await runPromptDoctor(apiKey, doctorRawPrompt, selectedModel);
      setDoctorCritique(result.critique);
      setDoctorMissing(result.missing);
      setDoctorImproved(result.improvedPrompt);
    } catch (error: any) {
      alert(error.message || "닥터 처방 중 오류가 발생했습니다.");
    } finally {
      setDoctorLoading(false);
    }
  };

  // Flow Style Converter execution
  const handleConverterSubmit = async () => {
    if (!apiKey) {
      setSettingsOpen(true);
      return;
    }
    if (!converterKeyword.trim()) return;

    setConverterLoading(true);
    setConverterResult(null);
    setConverterPrompt("");
    try {
      const result = await convertStyle(apiKey, converterKeyword, selectedModel);
      setConverterResult(result);

      // Auto-generate optimized prompt description based on style conversion
      const draftPrompt = await optimizePrompt(
        apiKey,
        {
          genre: result.genre,
          mood: result.vibe,
          bpm: parseInt(result.tempoFeel) || 100,
          instruments: result.instruments,
          vocal: result.vocal,
          structure: "Intro - Verse - Chorus - Outro",
          production: "clean and polished style reminiscent of modern high-fidelity recordings"
        },
        selectedModel
      );
      setConverterPrompt(draftPrompt);
    } catch (error: any) {
      alert(error.message || "스타일 변환 중 오류가 발생했습니다.");
    } finally {
      setConverterLoading(false);
    }
  };

  // Copy to Clipboard
  const copyToClipboard = (text: string, setCopiedFn: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopiedFn(true);
    setTimeout(() => setCopiedFn(false), 2000);
  };

  // Tooltip Helper
  const toggleTooltip = (optionKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveTooltip(activeTooltip === optionKey ? null : optionKey);
  };

  return (
    <div className="relative min-h-screen pb-12 overflow-x-hidden">
      {/* Background ambient glowing spheres */}
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>

      {/* HEADER SECTION */}
      <header className="w-full py-5 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between border-b border-slate-200/80 bg-white/40 backdrop-blur-md sticky top-0 z-30">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500 text-white shadow-md shadow-indigo-200">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              Lyria Prompt Studio <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600">LPS</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            생각만 입력하세요. AI가 음악 프로듀서처럼 구글 Lyria 프롬프트를 빌드합니다.
          </p>
        </div>

        {/* Global Configuration Controls */}
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white/70 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => {
                const m = e.target.value;
                setSelectedModel(m);
                localStorage.setItem("lps_gemini_model", m);
              }}
              className="bg-transparent font-medium text-indigo-600 focus:outline-none cursor-pointer"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            </select>
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium border shadow-sm transition-all focus:outline-none ${
              apiKey
                ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
            }`}
          >
            <Settings size={14} className={apiKey ? "text-slate-500" : "text-amber-500 animate-spin-slow"} />
            {apiKey ? "API 설정 완료" : "Gemini API Key 등록 필요"}
            <span className={`w-2 h-2 rounded-full ${apiKey ? "bg-emerald-500" : "bg-amber-500 animate-ping"}`}></span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        {/* Navigation Tabs bar */}
        <div className="flex items-center gap-2 p-1 bg-slate-200/50 backdrop-blur rounded-xl max-w-lg mb-8 mx-auto shadow-inner">
          <button
            onClick={() => setActiveTab("builder")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "builder" ? "bg-white text-indigo-600 shadow" : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <Sparkles size={14} />
            프롬프트 빌더
          </button>
          <button
            onClick={() => setActiveTab("doctor")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "doctor" ? "bg-white text-indigo-600 shadow" : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <Activity size={14} />
            프롬프트 닥터
          </button>
          <button
            onClick={() => setActiveTab("converter")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "converter" ? "bg-white text-indigo-600 shadow" : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <Music size={14} />
            스타일 변환기
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "history" ? "bg-white text-indigo-600 shadow" : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <Search size={14} />
            히스토리
            {history.length > 0 && (
              <span className="bg-indigo-100 text-indigo-600 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {history.length}
              </span>
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: AI PROMPT BUILDER */}
        {/* ========================================================================= */}
        {activeTab === "builder" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUMN 1: AI Idea Generator + Presets + Mood Map (Span 4) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Box 1: AI Idea Input */}
              <div className="glass-panel p-5 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles size={16} className="text-indigo-500" />
                    AI 아이디어 분석기
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 font-semibold">자동화</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  떠오르는 이미지, 감정, 상황을 한 문장으로 편하게 적어보세요. AI가 장르, 템포, 악기를 자동 추천합니다.
                </p>
                <textarea
                  value={ideaInput}
                  onChange={(e) => setIdeaInput(e.target.value)}
                  placeholder="예: 비 내리는 도쿄의 쓸쓸한 가을 밤 골목길을 나홀로 우산 없이 산책하는 슬픈 고독한 느낌"
                  className="w-full h-24 p-3 text-xs bg-white/80 border border-slate-200 rounded-lg focus-ring resize-none placeholder-slate-400"
                ></textarea>
                <button
                  onClick={handleAnalyzeIdea}
                  disabled={isLoading || !ideaInput.trim()}
                  className="w-full mt-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-md shadow-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      AI로 음악 구성 분석 및 세팅
                    </>
                  )}
                </button>
              </div>

              {/* Box 2: Smart Presets */}
              <div className="glass-panel p-5 flex flex-col">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-3">
                  <Volume2 size={16} className="text-indigo-500" />
                  스마트 프리셋
                </h2>
                <div className="flex flex-col gap-2">
                  {Object.entries(PRESETS).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => loadPreset(key as keyof typeof PRESETS)}
                      className="w-full text-left p-2.5 bg-white/70 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20 rounded-lg text-xs transition-all flex items-center justify-between group"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 group-hover:text-indigo-600">{value.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[240px]">
                          {value.genre} / {value.bpm} BPM
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        불러오기 &rarr;
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Box 3: Mood Map */}
              <div className="glass-panel p-5 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Activity size={16} className="text-indigo-500" />
                    무드 맵 (Mood Map)
                  </h2>
                </div>
                <p className="text-[10px] text-slate-400 mb-3">맵의 4사분면 격자를 마우스로 클릭하면 무드가 즉각 세팅됩니다.</p>

                {/* Mood Map Interactive Area */}
                <div
                  onClick={handleMoodMapClick}
                  className="relative w-full h-48 border border-slate-200 rounded-lg bg-slate-50/50 hover:bg-slate-50 cursor-crosshair overflow-hidden transition-colors"
                >
                  {/* Axis indicators */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-[1px] bg-slate-200"></div>
                    <div className="h-full w-[1px] bg-slate-200"></div>
                  </div>

                  {/* Corner tag labels */}
                  <span className="absolute top-2 left-2 text-[9px] font-bold text-slate-400 bg-white/90 px-1 rounded pointer-events-none">격렬함 (High Energy)</span>
                  <span className="absolute top-2 right-2 text-[9px] font-bold text-slate-400 bg-white/90 px-1 rounded pointer-events-none">활기참 (Happy/Bright)</span>
                  <span className="absolute bottom-2 left-2 text-[9px] font-bold text-slate-400 bg-white/90 px-1 rounded pointer-events-none">우울함 (Sad/Melancholy)</span>
                  <span className="absolute bottom-2 right-2 text-[9px] font-bold text-slate-400 bg-white/90 px-1 rounded pointer-events-none">차분함 (Calm/Peaceful)</span>

                  {/* Gradient Background elements representing quadrants */}
                  <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-rose-500/5 pointer-events-none"></div>
                  <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-amber-500/5 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-indigo-500/5 pointer-events-none"></div>
                  <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-emerald-500/5 pointer-events-none"></div>

                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-500/20 border border-indigo-500 rounded-full pointer-events-none animate-ping"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-600 rounded-full pointer-events-none"></div>
                </div>
              </div>
            </div>

            {/* COLUMN 2: Option Customization (Span 4) */}
            <div className="lg:col-span-4 glass-panel p-6 flex flex-col gap-4 relative">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Sliders size={16} className="text-indigo-500" />
                  옵션 상세 조정
                </h2>
                <span className="text-[10px] text-slate-400 font-semibold">초보자용 가이드 ? 아이콘 포함</span>
              </div>

              {/* Form Option 1: Genre */}
              <div className="flex flex-col gap-1 relative">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    음악 장르 (Genre)
                    <button
                      onClick={(e) => toggleTooltip("genre", e)}
                      className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-500 transition-colors"
                      title="장르 설명 보기"
                    >
                      <HelpCircle size={13} />
                    </button>
                  </span>
                </label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="예: 1990s hip-hop, lo-fi synthwave, cinematic orchestral"
                  className="w-full p-2.5 text-xs bg-white/70 border border-slate-200 rounded-lg focus-ring"
                />
              </div>

              {/* Form Option 2: Mood */}
              <div className="flex flex-col gap-1 relative">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    곡 분위기 (Mood)
                    <button
                      onClick={(e) => toggleTooltip("mood", e)}
                      className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-500 transition-colors"
                      title="분위기 설명 보기"
                    >
                      <HelpCircle size={13} />
                    </button>
                  </span>
                </label>
                <input
                  type="text"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  placeholder="예: nostalgic, triumphant, quiet, bittersweet"
                  className="w-full p-2.5 text-xs bg-white/70 border border-slate-200 rounded-lg focus-ring"
                />
              </div>

              {/* Form Option 3: BPM */}
              <div className="flex flex-col gap-1 relative">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    템포 및 속도 (BPM: {bpm})
                    <button
                      onClick={(e) => toggleTooltip("bpm", e)}
                      className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-500 transition-colors"
                      title="템포 설명 보기"
                    >
                      <HelpCircle size={13} />
                    </button>
                  </span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="60"
                    max="180"
                    value={bpm}
                    onChange={(e) => setBpm(parseInt(e.target.value))}
                    className="flex-1 accent-indigo-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                  />
                  <input
                    type="number"
                    min="60"
                    max="180"
                    value={bpm}
                    onChange={(e) => setBpm(Math.max(60, Math.min(180, parseInt(e.target.value) || 100)))}
                    className="w-14 p-1 text-center text-xs bg-white border border-slate-200 rounded focus-ring"
                  />
                </div>
              </div>

              {/* Form Option 4: Instruments */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    악기 구성 (Instruments)
                    <button
                      onClick={(e) => toggleTooltip("instruments", e)}
                      className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-500 transition-colors"
                      title="악기 설명 보기"
                    >
                      <HelpCircle size={13} />
                    </button>
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {["felt piano", "acoustic guitar", "synth strings", "electric keyboard", "brush snare", "vinyl crackle", "flute solo", "sub bass"].map(
                    (inst) => {
                      const selected = selectedInstruments.includes(inst);
                      return (
                        <button
                          key={inst}
                          onClick={() => toggleInstrument(inst)}
                          className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                            selected
                              ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {inst}
                        </button>
                      );
                    }
                  )}
                </div>
                {/* Manual tag addition input */}
                <input
                  type="text"
                  placeholder="추가 악기를 쉼표로 입력해보세요 (예: electric guitar, ambient pad)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = e.currentTarget.value.trim();
                      if (val) {
                        const newTags = val.split(",").map((s) => s.trim()).filter((s) => s && !selectedInstruments.includes(s));
                        setSelectedInstruments([...selectedInstruments, ...newTags]);
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                  className="w-full mt-1 p-2 text-[10px] bg-white/70 border border-slate-200 border-dashed rounded-lg focus-ring placeholder-slate-400"
                />
              </div>

              {/* Form Option 5: Vocals */}
              <div className="flex flex-col gap-1 relative">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    보컬 스타일 (Vocals)
                    <button
                      onClick={(e) => toggleTooltip("vocals", e)}
                      className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-500 transition-colors"
                      title="보컬 설명 보기"
                    >
                      <HelpCircle size={13} />
                    </button>
                  </span>
                </label>
                <input
                  type="text"
                  value={vocal}
                  onChange={(e) => setVocal(e.target.value)}
                  placeholder="예: airy female vocals in Korean, soulful raspy male vocals"
                  className="w-full p-2.5 text-xs bg-white/70 border border-slate-200 rounded-lg focus-ring"
                />
              </div>

              {/* Form Option 6: Structure */}
              <div className="flex flex-col gap-1 relative">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    곡의 구조 (Structure)
                    <button
                      onClick={(e) => toggleTooltip("structure", e)}
                      className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-500 transition-colors"
                      title="곡 구조 설명 보기"
                    >
                      <HelpCircle size={13} />
                    </button>
                  </span>
                </label>
                <input
                  type="text"
                  value={structure}
                  onChange={(e) => setStructure(e.target.value)}
                  placeholder="예: Intro - Verse - Chorus - Outro"
                  className="w-full p-2.5 text-xs bg-white/70 border border-slate-200 rounded-lg focus-ring"
                />
              </div>

              {/* Form Option 7: Production */}
              <div className="flex flex-col gap-1 relative">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    오디오 믹스 및 가공 (Production)
                    <button
                      onClick={(e) => toggleTooltip("production", e)}
                      className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-500 transition-colors"
                      title="가공 설명 보기"
                    >
                      <HelpCircle size={13} />
                    </button>
                  </span>
                </label>
                <input
                  type="text"
                  value={production}
                  onChange={(e) => setProduction(e.target.value)}
                  placeholder="예: analog tape warmth, spacious hall reverb, clean digital master"
                  className="w-full p-2.5 text-xs bg-white/70 border border-slate-200 rounded-lg focus-ring"
                />
              </div>

              {/* Form Option 8: Lyrics */}
              <div className="flex flex-col gap-1 relative">
                <label className="text-xs font-bold text-slate-700">가사 본문 (선택사항 - Lyria 3 Pro용)</label>
                <textarea
                  value={customLyrics}
                  onChange={(e) => setCustomLyrics(e.target.value)}
                  placeholder="[Intro] (악기 연주)\n[Verse 1]\n빗속을 걸어가요 슬픈 멜로디 속에..."
                  className="w-full h-20 p-2.5 text-xs bg-white/70 border border-slate-200 rounded-lg focus-ring resize-none placeholder-slate-400"
                ></textarea>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                onClick={handleOptimizePrompt}
                disabled={isLoading}
                className="w-full mt-3 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Sparkles size={14} />
                    최적화된 Lyria 프롬프트 생성
                  </>
                )}
              </button>

              {/* POPUP OVERLAY TOOLTIP CARD (Beginner Guide System) */}
              {activeTooltip && OPTION_DETAILS[activeTooltip] && (
                <div
                  ref={tooltipRef}
                  className="absolute inset-x-6 top-16 bg-white/95 border border-indigo-200 rounded-xl p-5 shadow-xl shadow-indigo-100 z-20 backdrop-blur-md animate-fade-in flex flex-col gap-3.5"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-indigo-50">
                    <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                      <Info size={14} />
                      {OPTION_DETAILS[activeTooltip].title}
                    </span>
                    <button
                      onClick={() => setActiveTooltip(null)}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                    >
                      닫기
                    </button>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 bg-indigo-50 px-1.5 py-0.2 rounded block w-fit mb-0.5">🎓 전문 이론 설명</span>
                      <p className="text-xs text-slate-700 leading-normal font-medium">{OPTION_DETAILS[activeTooltip].technical}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.2 rounded block w-fit mb-0.5">🌱 초보자용 비유 설명</span>
                      <p className="text-xs text-slate-700 leading-normal font-semibold">{OPTION_DETAILS[activeTooltip].beginner}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.2 rounded block w-fit mb-0.5">🎧 소리/상황 직관 느낌</span>
                      <p className="text-xs text-slate-600 leading-normal italic font-medium">{OPTION_DETAILS[activeTooltip].feel}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* COLUMN 3: AI Output & Prompt & Quality Analysis (Span 4) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Box 1: Why Recommended & Similar Use Cases */}
              {(Object.keys(aiReasons).length > 0 || useCases.length > 0) && (
                <div className="glass-panel p-5 flex flex-col gap-3">
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Info size={16} className="text-indigo-500" />
                    AI 추천 이유 및 상황
                  </h2>

                  {/* Reasons list */}
                  {Object.keys(aiReasons).length > 0 && (
                    <div className="flex flex-col gap-2 border-b border-slate-100 pb-3">
                      {aiReasons.genre && (
                        <div className="text-xs">
                          <span className="font-bold text-slate-700">장르 추천: </span>
                          <span className="text-slate-600">{aiReasons.genre}</span>
                        </div>
                      )}
                      {aiReasons.bpm && (
                        <div className="text-xs">
                          <span className="font-bold text-slate-700">속도 추천: </span>
                          <span className="text-slate-600">{aiReasons.bpm}</span>
                        </div>
                      )}
                      {aiReasons.instruments && (
                        <div className="text-xs">
                          <span className="font-bold text-slate-700">악기 추천: </span>
                          <span className="text-slate-600">{aiReasons.instruments}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recommended conditions tags */}
                  {useCases.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400">추천 어울리는 조건:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {useCases.map((useCase, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md font-semibold border border-emerald-100">
                            ✓ {useCase}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Box 2: Final Prompt Output Container */}
              <div className="glass-panel p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Music size={16} className="text-indigo-500" />
                    최종 생성 프롬프트
                  </h2>
                  {finalPrompt && (
                    <button
                      onClick={() => copyToClipboard(finalPrompt, setCopied)}
                      className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 text-[10px] font-semibold"
                    >
                      {copied ? (
                        <>
                          <Check size={12} className="text-emerald-500" />
                          복사 완료
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          복사
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="min-h-24 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 select-all overflow-y-auto max-h-48 leading-relaxed whitespace-pre-wrap">
                  {finalPrompt || (
                    <span className="text-slate-400 italic">왼쪽에서 옵션을 조정하고 아래 &apos;프롬프트 생성&apos; 버튼을 누르시면 여기에 완성된 구글 Lyria 규격의 영어 프롬프트가 표시됩니다.</span>
                  )}
                </div>
              </div>

              {/* Box 3: Prompt Quality Analyzer (Score card) */}
              {promptScore && (
                <div className="glass-panel p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Award size={16} className="text-indigo-500" />
                      프롬프트 품질 점수 (Score)
                    </h2>
                    <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded text-xs">
                      <span>{promptScore.total}점</span>
                    </div>
                  </div>

                  {/* Circular visual score representation */}
                  <div className="flex items-center justify-center py-2">
                    <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-4 border-indigo-100">
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin-slow"></div>
                      <span className="text-2xl font-black text-slate-800 tracking-tight">{promptScore.total}</span>
                    </div>
                  </div>

                  {/* Score details grid breakdown */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                    <div className="flex justify-between p-1 border-b border-slate-50">
                      <span>장르 명확성:</span>
                      <span className="font-bold text-slate-800">{promptScore.genre}/10</span>
                    </div>
                    <div className="flex justify-between p-1 border-b border-slate-50">
                      <span>분위기 묘사:</span>
                      <span className="font-bold text-slate-800">{promptScore.mood}/10</span>
                    </div>
                    <div className="flex justify-between p-1 border-b border-slate-50">
                      <span>템포 지명:</span>
                      <span className="font-bold text-slate-800">{promptScore.tempo}/10</span>
                    </div>
                    <div className="flex justify-between p-1 border-b border-slate-50">
                      <span>악기 다채로움:</span>
                      <span className="font-bold text-slate-800">{promptScore.instruments}/20</span>
                    </div>
                    <div className="flex justify-between p-1 border-b border-slate-50">
                      <span>보컬 정보:</span>
                      <span className="font-bold text-slate-800">{promptScore.vocals}/10</span>
                    </div>
                    <div className="flex justify-between p-1 border-b border-slate-50">
                      <span>곡의 구조화:</span>
                      <span className="font-bold text-slate-800">{promptScore.structure}/15</span>
                    </div>
                    <div className="flex justify-between p-1 border-b border-slate-50">
                      <span>배경 공간감:</span>
                      <span className="font-bold text-slate-800">{promptScore.atmosphere}/10</span>
                    </div>
                    <div className="flex justify-between p-1 border-b border-slate-50">
                      <span>마감 음향질감:</span>
                      <span className="font-bold text-slate-800">{promptScore.production}/15</span>
                    </div>
                  </div>

                  {/* Strengths & Improvements */}
                  <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-500 block mb-0.5">✓ 프롬프트 강점</span>
                      <ul className="list-disc list-inside text-xs text-slate-600 flex flex-col gap-0.5">
                        {promptScore.strengths.map((str, i) => (
                          <li key={i}>{str}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-amber-500 block mb-0.5">✓ 개선할 포인트</span>
                      <ul className="list-disc list-inside text-xs text-slate-600 flex flex-col gap-0.5">
                        {promptScore.improvements.map((imp, i) => (
                          <li key={i}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Similar ideas prompts list */}
              {similarPrompts.length > 0 && (
                <div className="glass-panel p-5 flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-700">이런 아이디어는 어떠세요? (유사 상황 추천)</span>
                  <div className="flex flex-col gap-1.5 mt-1">
                    {similarPrompts.map((sim, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setIdeaInput(sim);
                        }}
                        className="w-full text-left p-2 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded text-xs text-slate-600 transition-colors font-medium truncate"
                      >
                        {sim}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PROMPT DOCTOR */}
        {/* ========================================================================= */}
        {activeTab === "doctor" && (
          <div className="max-w-3xl mx-auto glass-panel p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-1.5 border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Activity size={18} className="text-indigo-500" />
                Prompt Doctor (프롬프트 종합 진단)
              </h2>
              <p className="text-xs text-slate-500">
                작성 중이던 투박한 음악 프롬프트를 입력해 주세요. 누락된 구글 리리아 가이드라인 핵심 요소를 찾아 보완하고 최적의 완성문으로 개선해 드립니다.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700">기존 음악 프롬프트 입력</label>
              <textarea
                value={doctorRawPrompt}
                onChange={(e) => setDoctorRawPrompt(e.target.value)}
                placeholder="예: Happy acoustic song with guitar"
                className="w-full h-28 p-3 text-xs bg-white/80 border border-slate-200 rounded-lg focus-ring resize-none"
              ></textarea>
            </div>

            <button
              onClick={handleDoctorSubmit}
              disabled={doctorLoading || !doctorRawPrompt.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {doctorLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Sparkles size={14} />
                  프롬프트 정밀 진단 및 처방 받기
                </>
              )}
            </button>

            {/* Doctor analysis report results */}
            {(doctorCritique || doctorImproved) && (
              <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
                <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-lg flex flex-col gap-2.5">
                  <h3 className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                    <Info size={14} />
                    진단 및 분석 리포트
                  </h3>
                  <p className="text-xs text-slate-700 leading-normal">{doctorCritique}</p>

                  {/* Missing elements tags */}
                  {doctorMissing.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 self-center">누락된 리리아 규칙:</span>
                      {doctorMissing.map((m, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-md font-semibold">
                          ✗ {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800">치료 및 개선된 최종 프롬프트 (Improved Prompt)</h3>
                    <button
                      onClick={() => copyToClipboard(doctorImproved, setDoctorCopied)}
                      className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 text-[10px] font-semibold"
                    >
                      {doctorCopied ? (
                        <>
                          <Check size={12} className="text-emerald-500" />
                          복사 완료
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          복사
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 select-all leading-relaxed whitespace-pre-wrap">
                    {doctorImproved}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: STYLE CONVERTER */}
        {/* ========================================================================= */}
        {activeTab === "converter" && (
          <div className="max-w-3xl mx-auto glass-panel p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-1.5 border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Music size={18} className="text-indigo-500" />
                Style Converter (유명 아티스트 느낌 변환기)
              </h2>
              <p className="text-xs text-slate-500">
                특정 가수 이름이나 시그니처 멜로디의 아티스트 느낌(예: 뉴진스, 콜드플레이, 잔나비 등)을 입력해 주세요. 구글 리리아의 고유 연주 톤과 구체적 악기 묘사로 자동 변환하여 프롬프트를 조립해 드립니다.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700">원하는 아티스트 또는 곡 스타일 입력</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={converterKeyword}
                  onChange={(e) => setConverterKeyword(e.target.value)}
                  placeholder="예: 뉴진스 (NewJeans) 느낌의 청량한 이지리스닝"
                  className="flex-1 p-2.5 text-xs bg-white/80 border border-slate-200 rounded-lg focus-ring"
                />
                <button
                  onClick={handleConverterSubmit}
                  disabled={converterLoading || !converterKeyword.trim()}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-md shadow-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {converterLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      변환
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Conversion Result output */}
            {converterResult && (
              <div className="flex flex-col gap-5 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-lg flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-indigo-500">장르 치환 (Genre)</span>
                    <span className="text-xs font-bold text-slate-800 leading-normal">{converterResult.genre}</span>
                  </div>

                  <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-lg flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-indigo-500">보컬 매핑 (Vocal)</span>
                    <span className="text-xs font-bold text-slate-800 leading-normal">{converterResult.vocal}</span>
                  </div>

                  <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-lg flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-indigo-500">핵심 시그니처 사운드 (Signature Sound)</span>
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {converterResult.instruments.map((inst, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 bg-white border border-indigo-100 text-indigo-600 rounded font-semibold">
                          {inst}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-lg flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-indigo-500">감성 및 속도감 (Vibe & Tempo)</span>
                    <span className="text-xs font-bold text-slate-800 leading-normal">
                      {converterResult.vibe} ({converterResult.tempoFeel})
                    </span>
                  </div>
                </div>

                {/* Final Converter Prompt Output */}
                {converterPrompt && (
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-800">조립 완료된 구글 Lyria 음악 프롬프트</h3>
                      <button
                        onClick={() => copyToClipboard(converterPrompt, setConverterCopied)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 text-[10px] font-semibold"
                      >
                        {converterCopied ? (
                          <>
                            <Check size={12} className="text-emerald-500" />
                            복사 완료
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            복사
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 select-all leading-relaxed whitespace-pre-wrap">
                      {converterPrompt}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: HISTORY & ARCHIVE */}
        {/* ========================================================================= */}
        {activeTab === "history" && (
          <div className="max-w-4xl mx-auto glass-panel p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                  <Search size={18} className="text-indigo-500" />
                  프롬프트 보관소 (History)
                </h2>
                <p className="text-xs text-slate-500">
                  최근 생성되거나 조정된 프롬프트 히스토리를 최대 20개까지 관리하고 원클릭으로 다시 편집할 수 있습니다.
                </p>
              </div>

              {/* Search bar inside history */}
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="아이디어 또는 키워드 검색..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/70 border border-slate-200 rounded-lg focus-ring"
                />
                <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
              </div>
            </div>

            {/* History List */}
            {history.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center gap-3">
                <Music size={32} className="text-slate-300" />
                <p className="text-xs text-slate-400">보관된 프롬프트 히스토리가 없습니다. 빌더 탭에서 프롬프트를 먼저 생성해보세요.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                {history
                  .filter(
                    (item) =>
                      item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.idea.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => loadHistoryItem(item)}
                      className="p-4 bg-white/70 border border-slate-100 hover:border-indigo-150 hover:bg-indigo-50/10 rounded-xl transition-all cursor-pointer flex flex-col md:flex-row items-start justify-between gap-4 group"
                    >
                      <div className="flex-1 flex flex-col gap-2">
                        {/* Upper info row */}
                        <div className="flex flex-wrap items-center gap-2 text-[10px]">
                          <span className="font-semibold text-slate-400">{item.timestamp}</span>
                          <span className="bg-slate-100 text-slate-500 font-semibold px-2 py-0.2 rounded-md">
                            {item.params.genre || "사용자 맞춤"}
                          </span>
                          <span className="bg-indigo-50 text-indigo-600 font-bold px-1.5 py-0.2 rounded">
                            {item.score}점
                          </span>
                        </div>

                        {/* User idea text */}
                        <div className="text-xs font-bold text-slate-700">
                          <span className="text-indigo-400 font-extrabold mr-1">Idea:</span>
                          {item.idea}
                        </div>

                        {/* Final prompt preview */}
                        <p className="text-[11px] font-mono text-slate-500 leading-normal line-clamp-2 bg-slate-50/70 p-2 rounded border border-slate-100/50">
                          {item.prompt}
                        </p>
                      </div>

                      {/* Control buttons */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          onClick={(e) => toggleFavoriteItem(item.id, e)}
                          className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${
                            item.favorite ? "text-amber-500" : "text-slate-400 hover:text-slate-600"
                          }`}
                          title={item.favorite ? "즐겨찾기 해제" : "즐겨찾기 등록"}
                        >
                          <Star size={14} fill={item.favorite ? "currentColor" : "none"} />
                        </button>
                        <button
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL DIALOG: GEMINI API CONFIGURATION SETTINGS */}
      {/* ========================================================================= */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 md:p-8 shadow-2xl border border-slate-100 flex flex-col gap-5 animate-scale-up">
            <div className="flex flex-col gap-1 border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Settings size={18} className="text-indigo-500 animate-spin-slow" />
                Gemini API 연결 설정
              </h2>
              <p className="text-xs text-slate-500">
                구글 AI 스튜디오에서 발급받은 무료 API Key를 입력하여 음악 프로듀서 AI 엔진을 활성화하세요.
              </p>
            </div>

            {/* Warning info note for client keys */}
            {showApiKeyWarning && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs leading-normal flex items-start gap-2">
                <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">API Key가 필요합니다: </span>
                  LPS는 서버가 없는 깃허브 페이지에 안전하게 동작할 수 있게끔 본인의 무료 API Key를 사용합니다. 입력된 키는 외부로 유출되지 않으며 오직 구글의 공식 API 통신에만 사용됩니다.
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Gemini API Key</label>
                <input
                  type="password"
                  defaultValue={apiKey}
                  placeholder="AIzaSy..."
                  id="apiKeyInput"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus-ring font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">추천 모델 (Model Selection)</label>
                <select
                  id="modelSelect"
                  defaultValue={selectedModel}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus-ring cursor-pointer"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (가장 빠름 - 권장)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (더 정밀함)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (하위 호환)</option>
                </select>
              </div>

              <div className="text-[10px] text-slate-400">
                🔑 API Key가 없으신가요?{" "}
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-500 font-bold hover:underline"
                >
                  Google AI Studio
                </a>
                에서 무료로 발급받으실 수 있습니다.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              {!showApiKeyWarning && (
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  취소
                </button>
              )}
              <button
                onClick={() => {
                  const key = (document.getElementById("apiKeyInput") as HTMLInputElement).value.trim();
                  const model = (document.getElementById("modelSelect") as HTMLSelectElement).value;
                  saveSettings(key, model);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-100 transition-colors"
              >
                설정 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
