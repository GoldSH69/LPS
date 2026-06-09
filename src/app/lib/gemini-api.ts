// Client-side Gemini API integration using direct fetch

export interface MusicAnalysisResult {
  genre: string;
  mood: string;
  bpm: number;
  instruments: string[];
  vocal: string;
  structure: string;
  production: string;
  reason: {
    genre: string;
    bpm: string;
    instruments: string;
    vocal?: string;
    structure?: string;
  };
  use_cases: string[];
  similar_prompts: string[];
}

export interface PromptScoreBreakdown {
  total: number;
  genre: number;
  mood: number;
  tempo: number;
  instruments: number;
  vocals: number;
  structure: number;
  atmosphere: number;
  production: number;
  strengths: string[];
  improvements: string[];
}

export interface DoctorAnalysisResult {
  critique: string;
  missing: string[];
  improvedPrompt: string;
}

export interface StyleConversionResult {
  genre: string;
  vocal: string;
  instruments: string[];
  vibe: string;
  tempoFeel: string;
}

const FALLBACK_MODELS = [
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro"
];

async function callGemini(apiKey: string, prompt: string, model: string = "gemini-3.5-flash", jsonMode: boolean = false): Promise<string> {
  if (!apiKey) {
    throw new Error("Gemini API Key가 설정되지 않았습니다. 우측 상단 설정 아이콘을 클릭하여 API Key를 등록해 주세요.");
  }

  // Create a fallback queue beginning with the preferred model, then other models in sequential order
  const queue = [model, ...FALLBACK_MODELS.filter(m => m !== model)];
  let lastError: any = null;

  for (const currentModel of queue) {
    try {
      console.log(`Gemini API 호출 시도 모델: ${currentModel}`);
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: jsonMode
          ? {
              responseMimeType: "application/json",
            }
          : undefined,
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `HTTP error! status: ${response.status}`;
        throw new Error(`[${currentModel}] 호출 실패: ${errorMessage}`);
      }

      const responseData = await response.json();
      const text = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error(`[${currentModel}] API가 빈 응답을 반환했습니다.`);
      }

      console.log(`Gemini API 호출 성공 모델: ${currentModel}`);
      return text;
    } catch (error: any) {
      console.warn(`모델 ${currentModel} 호출 실패, 다음 모델 시도 중...`, error.message);
      lastError = error;
    }
  }

  throw new Error(`Gemini API 모든 모델 호출에 실패했습니다. 마지막 오류: ${lastError?.message}`);
}

// 1. AI Idea Generator
export async function generateMusicIdea(apiKey: string, ideaText: string, model: string = "gemini-3.5-flash"): Promise<MusicAnalysisResult> {
  const prompt = `당신은 세계 최고 수준의 음악 프로듀서이자 구글 Lyria 프롬프트 엔지니어입니다.
사용자의 아이디어(감정, 상황, 장소, 스토리 등)를 분석하여 구글 Lyria 음악 생성 모델에 최적화된 음악적 속성을 추천하세요.

사용자 아이디어: "${ideaText}"

반드시 다음 JSON 스키마 형식으로만 응답해야 합니다. 추가 설명이나 코드 블록 기호(예: \`\`\`json) 없이 순수 JSON 문자열만 반환하세요:
{
  "genre": "추천 장르 및 구체적인 시대/스타일 설명 (예: '1990s boom-bap hip-hop')",
  "mood": "추천 분위기 및 정서 형용사 (예: 'nostalgic and bittersweet')",
  "bpm": 70 ~ 180 사이의 정수 숫자,
  "instruments": ["악기 목록 (구체적인 질감 묘사 포함, 최소 3개)", "예: 'warm nylon-string acoustic guitar'"],
  "vocal": "추천 보컬 스타일, 언어 및 음색 (예: 'airy, breathy female vocals singing in Korean')",
  "structure": "곡의 기본 구조 및 흐름 추천 (예: 'Intro - Verse - Chorus - Outro')",
  "production": "믹싱 스타일 및 오디오 질감 (예: 'warm analog tape warmth, vinyl crackles')",
  "reason": {
    "genre": "장르 추천 이유 설명 (초보자도 이해하기 쉬운 묘사형으로 한국어 작성)",
    "bpm": "BPM 추천 이유 설명 (한국어 작성)",
    "instruments": "악기 구성 추천 이유 설명 (한국어 작성)",
    "vocal": "보컬 추천 이유 설명 (한국어 작성)",
    "structure": "구조 추천 이유 설명 (한국어 작성)"
  },
  "use_cases": ["이 음악이 어울리는 상황/조건 목록 (최대 4개)"],
  "similar_prompts": ["유사한 분위기를 자아낼 수 있는 다른 시적 상황 묘사 (한국어, 최소 3개)"]
}`;

  const jsonText = await callGemini(apiKey, prompt, model, true);
  return JSON.parse(jsonText.trim()) as MusicAnalysisResult;
}

// 2. Prompt Optimizer (Building the Lyria Prompt)
export async function optimizePrompt(
  apiKey: string,
  params: {
    genre: string;
    mood: string;
    bpm: number;
    instruments: string[];
    vocal: string;
    structure: string;
    production: string;
    customLyrics?: string;
  },
  model: string = "gemini-3.5-flash"
): Promise<string> {
  const instrumentsStr = params.instruments.join(", ");
  const lyricsSection = params.customLyrics ? `\nLyrics:\n${params.customLyrics}` : "";

  const prompt = `당신은 구글 Lyria 프롬프트 최적화 엔진입니다.
제시된 음악적 설정값들을 결합하여, Google Lyria (특히 Lyria 3 Pro) 음악 생성 모델에 입력 시 최상의 음악을 완성해낼 수 있는 '영문 프롬프트'를 빌드하고 최적화해 주세요.

구글 Lyria의 표준 가이드라인 구조는 다음과 같습니다:
[Genre & Style] + [Mood & Emotion] + [Instrumentation] + [Tempo & Rhythm] + [Vocal Style & Language] + [Structure] + [Lyrics]

설정 파라미터:
- Genre & Style: ${params.genre}
- Mood & Emotion: ${params.mood}
- Tempo & Rhythm: ${params.bpm} BPM
- Instrumentation: ${instrumentsStr}
- Vocal Style & Language: ${params.vocal}
- Structure: ${params.structure}
- Production / Audio Quality: ${params.production}
${lyricsSection ? `- Custom Lyrics:\n${params.customLyrics}` : ""}

[규칙]
1. 프롬프트는 영어로만 작성되어야 합니다.
2. 단순히 단어들을 나열하지 말고, 리리아 모델이 음악적 연출을 상상할 수 있게 하는 한 편의 세련되고 구체적인 묘사글(Full Descriptive Sentences) 형태로 구성하세요.
3. 구글 Lyria의 6단계 프레임워크가 프롬프트 내에 골고루 반영되도록 하세요.
4. 가사(Lyrics)가 있다면, Lyrics: 섹션을 하단에 배치하고, Lyria 3 Pro 규격에 맞춰 [Intro], [Verse 1], [Chorus], [Outro] 같은 구조 마커를 가사 앞에 붙여주세요.
5. 응답으로 오직 생성된 '최종 영문 프롬프트' 텍스트만 출력하세요. 설명글이나 따옴표 등을 붙이지 마세요.`;

  const optimizedText = await callGemini(apiKey, prompt, model, false);
  return optimizedText.trim();
}

// 3. Prompt Quality Analyzer
export async function analyzePromptQuality(apiKey: string, finalPrompt: string, model: string = "gemini-3.5-flash"): Promise<PromptScoreBreakdown> {
  const prompt = `당신은 구글 Lyria 프롬프트 감리사입니다.
제시된 프롬프트가 구글 Lyria (Lyria 3 Pro) 음악 생성 가이드라인에 얼마나 부합하는지 100점 만점으로 평가해 주세요.

분석 대상 프롬프트:
"${finalPrompt}"

구글 Lyria 평가지표 (총 100점 만점):
- Genre & Style 명확성 (10점)
- Mood & Emotion 상세 묘사 (10점)
- Tempo & Rhythm 구체성 (10점)
- Instruments 구성 및 질감 묘사 (20점)
- Vocal Style & Language 정보 (10점)
- Structure (곡 구조) 명시 (15점)
- Atmosphere (공간감 및 배경 소리) (10점)
- Production & Mixing 스타일 (15점)

반드시 다음 JSON 스키마 형식으로만 응답해야 합니다. 추가 설명이나 코드 블록 기호 없이 순수 JSON 문자열만 반환하세요:
{
  "total": 전체 총합 점수 (정수),
  "genre": 장르 점수 (0-10),
  "mood": 분위기 점수 (0-10),
  "tempo": 템포 점수 (0-10),
  "instruments": 악기 점수 (0-20),
  "vocals": 보컬 점수 (0-10),
  "structure": 구조 점수 (0-15),
  "atmosphere": 공간감 점수 (0-10),
  "production": 프로덕션 점수 (0-15),
  "strengths": ["프롬프트의 강점 요약 (한국어, 최소 2개)"],
  "improvements": ["이 프롬프트에서 보완하면 Lyria 생성 품질이 극대화될 개선 제안 (한국어, 최소 2개)"]
}`;

  const jsonText = await callGemini(apiKey, prompt, model, true);
  return JSON.parse(jsonText.trim()) as PromptScoreBreakdown;
}

// 4. Prompt Doctor
export async function runPromptDoctor(apiKey: string, rawPrompt: string, model: string = "gemini-3.5-flash"): Promise<DoctorAnalysisResult> {
  const prompt = `당신은 프롬프트 닥터(Prompt Doctor)입니다.
사용자가 작성한 기존 음악 프롬프트를 분석하여 구글 Lyria 규격 관점에서 무엇이 부족하고 비어있는지 진단하고, 고품질의 구글 Lyria 최적화 프롬프트로 고쳐주세요.

사용자 입력 프롬프트:
"${rawPrompt}"

반드시 다음 JSON 스키마 형식으로만 응답해야 합니다. 추가 설명이나 코드 블록 기호 없이 순수 JSON 문자열만 반환하세요:
{
  "critique": "현재 프롬프트에서 누락되거나 아쉬운 점에 대한 상세 진단 (한국어 작성, 예: '장르와 악기 묘사는 훌륭하지만 곡의 공간감과 보컬 스타일 묘사가 빠져 있습니다.')",
  "missing": ["누락된 핵심 리리아 요소 목록 (예: 'Vocal Style', 'Space Ambience', 'Mix Texture')"],
  "improvedPrompt": "누락된 요소를 자연스럽게 채워 넣어 구글 Lyria 표준 프레임워크 규격으로 확장한 최종 영문 프롬프트"
}`;

  const jsonText = await callGemini(apiKey, prompt, model, true);
  return JSON.parse(jsonText.trim()) as DoctorAnalysisResult;
}

// 5. Style Converter
export async function convertStyle(apiKey: string, styleKeyword: string, model: string = "gemini-3.5-flash"): Promise<StyleConversionResult> {
  const prompt = `당신은 음악 스타일 변환기(Style Converter)입니다.
사용자가 입력한 유명 아티스트의 이름이나 특정 곡의 느낌(Vibe) 키워드를 분석하여, 구글 Lyria가 가장 잘 이해할 수 있는 구체적인 장르 및 음악적 장치(악기, 보컬, 속도감)로 변환해 주세요.

아티스트/스타일 키워드: "${styleKeyword}"

반드시 다음 JSON 스키마 형식으로만 응답해야 합니다. 추가 설명이나 코드 블록 기호 없이 순수 JSON 문자열만 반환하세요:
{
  "genre": "해당 아티스트 느낌을 내기 위한 구체적 음악 장르 (영어 묘사, 예: 'Minimalist modern K-pop with deep house grooves')",
  "vocal": "그 아티스트 특유의 보컬 톤과 가창 스타일 묘사 (영어 묘사, 예: 'airy, soft female vocals with light vocal harmony')",
  "instruments": ["핵심 악기 및 시그니처 사운드 목록 (영어, 최소 3개)"],
  "vibe": "곡의 정서적인 뉘앙스 및 분위기 (영어, 예: 'dreamy, chill, futuristic')",
  "tempoFeel": "템포 및 리듬 스타일 (영어, 예: 'mid-tempo, relaxed 110 BPM groove')"
}`;

  const jsonText = await callGemini(apiKey, prompt, model, true);
  return JSON.parse(jsonText.trim()) as StyleConversionResult;
}

// 6. Playlist Generation Interface & Functions
export interface PlaylistTrack {
  trackNumber: number;
  title: string;
  description: string;
  musicPrompt: string;
  imagePrompt: string;
  videoPrompt: string;
  thumbnailCaption: {
    ko: string;
    en: string;
    ja: string;
  };
  scenes: {
    sceneNumber: number;
    description: string;
    captions: {
      ko: string;
      en: string;
      ja: string;
    };
  }[];
}

export interface PlaylistResult {
  playlistTitle: string;
  overallConcept: string;
  flowStrategy: string;
  youtubeMetadata: {
    title: string;
    description: string;
    hashtags: string[];
    tags: string[];
  };
  tracks: PlaylistTrack[];
}

export async function generatePlaylist(
  apiKey: string,
  concept: string,
  flowOption: string,
  model: string = "gemini-3.5-flash"
): Promise<PlaylistResult> {
  const prompt = `당신은 세계 최고의 음악 감독이자 비주얼 프롬프트 디자이너, 다국어 영상 콘텐츠 프로듀서입니다.
사용자가 입력한 플레이리스트 대주제와 곡 흐름 전략을 바탕으로 총 10곡으로 구성된 프리미엄 음악 플레이리스트와 각 트랙별 사운드/이미지/동영상 프롬프트 및 다국어 자막을 생성해 주세요.

- 대주제(Concept): "${concept}"
- 흐름 옵션(Flow Option): "${flowOption}"

[지침]
1. 장르는 Google Lyria 음악 모델의 강점을 극대화하는 묘사를 포함하여 영문으로 작성해야 합니다.
2. 각 곡에 앨범 아트용 'Google Imagen 2' 이미지 프롬프트(영문)를 생성하세요. 썸네일 아트에 어울리는 visual art, digital illustration, realistic photography 등의 스타일 묘사를 명시하세요.
3. 각 곡에 배경 비디오/루프용 'Google Veo 3' 동영상 프롬프트(영문)를 생성하세요. 씬의 부드러운 움직임(cinematic loop video, slow panning, warm light leak)을 묘사하세요.
4. 각 곡의 썸네일에 들어갈 타이틀 자막(thumbnailCaption) 및 씬(Scene)별 영상 자막(scenes - 총 3개 씬)을 한국어, 영어, 일본어 3개 국어로 생성해 주세요.
5. 왜 이 10곡을 선택했고 어떻게 유기적으로 감정선/에너지를 이어지게 구성했는지 그 전략적 기획서(flowStrategy)를 상세하게 한국어로 작성해 주세요.
6. 유튜브 업로드 시 활용할 트렌디하고 조회수를 극대화할 수 있는 유튜브 메타데이터(youtubeMetadata: 제목, 상세 더보기 설명란 텍스트, 해시태그 목록, 추천 태그 검색어 목록)를 한국어 중심으로 일괄 생성하세요. 설명란(description)에는 수록곡 목록의 기획/해설이 정갈하게 포함되어야 합니다.

반드시 다음 JSON 스키마 형식으로만 응답해야 합니다. 추가 설명이나 코드 블록 기호 없이 순수 JSON 문자열만 반환하세요:
{
  "playlistTitle": "플레이리스트 전체 타이틀 (한글/영문 병기)",
  "overallConcept": "전체 기획 컨셉 및 무드 설명 (한국어)",
  "flowStrategy": "플레이리스트 구성 흐름 및 기획 전략 사유 (한국어, 매우 자세하게 작성)",
  "youtubeMetadata": {
    "title": "추천 유튜브 영상 제목 (클릭을 유도하는 감성적인 문구)",
    "description": "추천 유튜브 상세 설명란 텍스트 (곡 해설 및 기획 방향 포함)",
    "hashtags": ["추천 해시태그 (#로 시작, 5개 이상)"],
    "tags": ["추천 유튜브 검색어 및 키워드 태그 (10개 이상)"]
  },
  "tracks": [
    {
      "trackNumber": 1,
      "title": "영문 곡 제목 (English Title)",
      "description": "한글 곡 설명 (Korean Description, 이 곡이 주는 정서와 연출 의도)",
      "musicPrompt": "구글 Lyria 표준 6단계 프레임워크를 엄격히 준수한 완성형 영문 음악 프롬프트",
      "imagePrompt": "Google Imagen 2 썸네일 생성용 영문 프롬프트",
      "videoPrompt": "Google Veo 3 배경 비디오 루프 생성용 영문 프롬프트",
      "thumbnailCaption": {
        "ko": "한글 썸네일 자막",
        "en": "영어 썸네일 자막",
        "ja": "일본어 썸네일 자막"
      },
      "scenes": [
        {
          "sceneNumber": 1,
          "description": "1번 씬 비주얼 묘사 (영어)",
          "captions": {
            "ko": "1번 씬 한글 자막",
            "en": "1번 씬 영어 자막",
            "ja": "1번 씬 일본어 자막"
          }
        },
        {
          "sceneNumber": 2,
          "description": "2번 씬 비주얼 묘사 (영어)",
          "captions": {
            "ko": "2번 씬 한글 자막",
            "en": "2번 씬 영어 자막",
            "ja": "2번 씬 일본어 자막"
          }
        },
        {
          "sceneNumber": 3,
          "description": "3번 씬 비주얼 묘사 (영어)",
          "captions": {
            "ko": "3번 씬 한글 자막",
            "en": "3번 씬 영어 자막",
            "ja": "3번 씬 일본어 자막"
          }
        }
      ]
    }
  ]
}`;

  const jsonText = await callGemini(apiKey, prompt, model, true);
  return JSON.parse(jsonText.trim()) as PlaylistResult;
}

export async function regenerateSingleTrack(
  apiKey: string,
  params: {
    playlistTitle: string;
    playlistConcept: string;
    flowStrategy: string;
    trackNumber: number;
    userFeedback: string;
    previousTrack?: { title: string; musicPrompt: string; description: string };
    nextTrack?: { title: string; musicPrompt: string; description: string };
  },
  model: string = "gemini-3.5-flash"
): Promise<PlaylistTrack> {
  const prevContext = params.previousTrack
    ? `- 이전 트랙 (#${params.trackNumber - 1}): 제목: "${params.previousTrack.title}", 음악 프롬프트: "${params.previousTrack.musicPrompt}", 설명: "${params.previousTrack.description}"`
    : "- 이전 트랙 없음 (플레이리스트 첫 트랙)";
  const nextContext = params.nextTrack
    ? `- 다음 트랙 (#${params.trackNumber + 1}): 제목: "${params.nextTrack.title}", 음악 프롬프트: "${params.nextTrack.musicPrompt}", 설명: "${params.nextTrack.description}"`
    : "- 다음 트랙 없음 (플레이리스트 마지막 트랙)";

  const prompt = `당신은 세계 최고의 음악 감독이자 다국어 비디오 콘텐츠 프로듀서입니다.
현재 진행 중인 10곡 음악 플레이리스트에서 특정 번호의 트랙 한 곡만 부분 갱신하려 합니다.
전체 플레이리스트의 기획 전략과 전후 트랙의 감정선 연결을 자연스럽게 유지하면서, 사용자의 세부 조정 피드백을 수용하여 해당 트랙을 새로 작성해 주세요.

플레이리스트 컨텍스트:
- 플레이리스트 제목: "${params.playlistTitle}"
- 전체 기획 컨셉: "${params.playlistConcept}"
- 흐름 배치 전략: "${params.flowStrategy}"

대상 트랙:
- 갱신할 트랙 번호: #${params.trackNumber}
- 사용자 조정 피드백: "${params.userFeedback}"

인접 트랙 정보:
${prevContext}
${nextContext}

[지침]
1. 장르는 Google Lyria 음악 모델의 강점을 극대화하는 묘사를 포함하여 영문으로 작성해야 합니다.
2. Imagen 2 이미지 및 Veo 3 비디오 프롬프트는 썸네일과 유튜브 루프 비디오 제작에 어울리도록 영문으로 작성합니다.
3. 자막 정보(thumbnailCaption, scenes - 총 3개)는 한국어, 영어, 일본어 3개 국어를 모두 제공해야 합니다.
4. 이전 트랙과 다음 트랙 사이에서 흐름이 끊기지 않는 자연스러운 교두보 역할을 수행하도록 음악의 속도와 분위기 연결을 고려하세요.

반드시 다음 JSON 스키마 형식으로만 응답해야 합니다. 추가 설명이나 코드 블록 기호 없이 순수 JSON 문자열만 반환하세요:
{
  "trackNumber": ${params.trackNumber},
  "title": "새로 조정된 영문 곡 제목 (English Title)",
  "description": "새로 조정된 한글 곡 설명 (Korean Description)",
  "musicPrompt": "구글 Lyria 표준 6단계 프레임워크를 준수한 완성형 영문 음악 프롬프트",
  "imagePrompt": "Google Imagen 2 썸네일 생성용 영문 프롬프트",
  "videoPrompt": "Google Veo 3 배경 비디오 루프 생성용 영문 프롬프트",
  "thumbnailCaption": {
    "ko": "조정된 한글 썸네일 자막",
    "en": "조정된 영어 썸네일 자막",
    "ja": "조정된 일본어 썸네일 자막"
  },
  "scenes": [
    {
      "sceneNumber": 1,
      "description": "1번 씬 비주얼 묘사 (영어)",
      "captions": {
        "ko": "1번 씬 한글 자막",
        "en": "1번 씬 영어 자막",
        "ja": "1번 씬 일본어 자막"
      }
    },
    {
      "sceneNumber": 2,
      "description": "2번 씬 비주얼 묘사 (영어)",
      "captions": {
        "ko": "2번 씬 한글 자막",
        "en": "2번 씬 영어 자막",
        "ja": "2번 씬 일본어 자막"
      }
    },
    {
      "sceneNumber": 3,
      "description": "3번 씬 비주얼 묘사 (영어)",
      "captions": {
        "ko": "3번 씬 한글 자막",
        "en": "3번 씬 영어 자막",
        "ja": "3번 씬 일본어 자막"
      }
    }
  ]
}`;

  const jsonText = await callGemini(apiKey, prompt, model, true);
  return JSON.parse(jsonText.trim()) as PlaylistTrack;
}

