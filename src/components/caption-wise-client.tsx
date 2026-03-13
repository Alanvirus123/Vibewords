
"use client";

import React, { useState, type ChangeEvent, useMemo, Suspense, useEffect, useCallback } from "react";
import { UploadCloud, Copy, Loader2, Sparkles, Share2, HelpCircle, Music2, Volume2, RefreshCw, Video, Download, ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { suggestMediaCaptions, type SuggestMediaCaptionsInput } from "@/ai/flows/suggest-media-captions";
import { refineMediaCaptions, type RefineMediaCaptionsInput } from "@/ai/flows/refine-media-captions";
import { refineSongSuggestions, type RefineSongSuggestionsInput } from "@/ai/flows/refine-song-suggestions";
import { textToSpeech } from "@/ai/flows/text-to-speech";
import { analyzeMediaVibe } from "@/ai/flows/analyze-media-vibe";
import { generateVideo } from "@/ai/flows/generate-video";
import { ThemeToggle } from "@/components/theme-toggle";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { LanguageSelector } from './language-selector';
import { PlatformSelector } from './platform-selector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MediaSuggestions, LanguageOption, SocialPlatform, SongSuggestion, SongSuggestionsMap } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AiAssistant } from "@/components/ai-assistant";
import { Textarea } from "./ui/textarea";

const SuggestedCaptionsDisplay = React.lazy(() => import('@/components/suggested-captions-display'));
const RefinedCaptionsDisplay = React.lazy(() => import('@/components/refined-captions-display'));
const SuggestedSongsDisplay = React.lazy(() => import('@/components/suggested-songs-display'));
const RefinedSongsDisplay = React.lazy(() => import('@/components/refined-songs-display'));

const PREDEFINED_LANGUAGES: LanguageOption[] = [
  { value: "Afrikaans", label: "Afrikaans" },
  { value: "Albanian", label: "Shqip (Albanian)" },
  { value: "Amharic", label: "አማርኛ (Amharic)" },
  { value: "Arabic", label: "العربية (Arabic)" },
  { value: "Armenian", label: "Հայերেন (Armenian)" },
  { value: "Assamese", label: "অসমীয়া (Assamese)" },
  { value: "Azerbaijani", label: "Azərbaycanca (Azerbaijani)" },
  { value: "Basque", label: "Euskara (Basque)" },
  { value: "Bengali", label: "বাংলা (Bengali)" },
  { value: "Bhojpuri", label: "ভোজপুরী (Bhojpuri)" },
  { value: "Bodo", label: "বর' (Bodo)" },
  { value: "Bosnian", label: "Bosanski (Bosnian)" },
  { value: "Bulgarian", label: "Български (Bulgarian)" },
  { value: "Catalan", label: "Català (Catalan)" },
  { value: "Chinese_Simplified", label: "中文 (简体) (Chinese Simplified)" },
  { value: "Chinese_Traditional", label: "中文 (繁體) (Chinese Traditional)" },
  { value: "Croatian", label: "Hrvatski (Croatian)" },
  { value: "Czech", label: "Čeština (Czech)" },
  { value: "Danish", label: "Dansk (Danish)" },
  { value: "Dogri", label: "डोगरी (Dogri)" },
  { value: "Dutch", label: "Nederlands (Dutch)" },
  { value: "English", label: "English" },
  { value: "Esperanto", label: "Esperanto" },
  { value: "Estonian", label: "Eesti (Estonian)" },
  { value: "Finnish", label: "Suomi (Finnish)" },
  { value: "French", label: "Français (French)" },
  { value: "Galician", label: "Galego (Galician)" },
  { value: "Georgian", label: "ქართული (Georgian)" },
  { value: "German", label: "Deutsch (German)" },
  { value: "Greek", label: "Ελληνικά (Greek)" },
  { value: "Gujarati", label: "ગુજરાતી (Gujarati)" },
  { value: "Hebrew", label: "עבריত (Hebrew)" },
  { value: "Hindi", label: "हिन्दी (Hindi)" },
  { value: "Hungarian", label: "Magyar (Hungarian)" },
  { value: "Icelandic", label: "Íslenska (Icelandic)" },
  { value: "Indonesian", label: "Bahasa Indonesia (Indonesian)" },
  { value: "Irish", label: "Gaeilge (Irish)" },
  { value: "Italian", label: "Italiano (Italian)" },
  { value: "Japanese", label: "日本語 (Japanese)" },
  { value: "Kannada", label: "ಕನ್ನಡ (Kannada)" },
  { value: "Kashmiri", label: "کأشُر (Kashmiri)" },
  { value: "Kazakh", label: "Қазақ (Kazakh)" },
  { value: "Khmer", label: "ខ្মែর (Khmer)" },
  { value: "Konkani", label: "कोंকণী (Konkani)" },
  { value: "Korean", label: "한국어 (Korean)" },
  { value: "Kyrgyz", label: "Кыргызча (Kyrgyz)" },
  { value: "Lao", label: "ລາວ (Lao)" },
  { value: "Latvian", label: "Latviešu (Latvian)" },
  { value: "Lithuanian", label: "Lietuvių (Lithuanian)" },
  { value: "Macedonian", label: "Македонски (Macedonian)" },
  { value: "Maithili", label: "मैথিলে (Maithili)" },
  { value: "Malay", label: "Bahasa Melayu (Malay)" },
  { value: "Malayalam", label: "മലയാളം (Malayalam)" },
  { value: "Maltese", label: "Malti (Maltese)" },
  { value: "Manipuri", label: "মৈতৈলোন (Manipuri)" },
  { value: "Marathi", label: "मराठी (Marathi)" },
  { value: "Mongolian", label: "Монгол (Mongolian)" },
  { value: "Nepali", label: "नेपाली (Nepali)" },
  { value: "Norwegian", label: "Norsk (Norwegian)" },
  { value: "Odia", label: "ଓଡ଼ିଆ (Odia)" },
  { value: "Pashto", label: "پښتو (Pashto)" },
  { value: "Persian", label: "فارسی (Persian)" },
  { value: "Polish", label: "Polski (Polish)" },
  { value: "Portuguese", label: "Português (Portuguese)" },
  { value: "Punjabi", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { value: "Romanian", label: "Română (Romanian)" },
  { value: "Russian", label: "Русский (Russian)" },
  { value: "Sanskrit", label: "संस्कृतम् (Sanskrit)" },
  { value: "Santali", label: "संताली (Santali)" },
  { value: "Serbian", label: "Српски (Serbian)" },
  { value: "Sindhi", label: "سنڌي (Sindhi)" },
  { value: "Sinhala", label: "සිංහල (Sinhala)" },
  { value: "Slovak", label: "Slovenčina (Slovak)" },
  { value: "Slovenian", label: "Slovenščina (Slovenian)" },
  { value: "Somali", label: "Soomaali (Somali)" },
  { value: "Spanish", label: "Español (Spanish)" },
  { value: "Swahili", label: "Kiswahili (Swahili)" },
  { value: "Swedish", label: "Svenska (Swedish)" },
  { value: "Tagalog", label: "Tagalog" },
  { value: "Tajik", label: "Тоҷикӣ (Tajik)" },
  { value: "Tamil", label: "தமிழ் (Tamil)" },
  { value: "Telugu", label: "తెలుగు (Telugu)" },
  { value: "Thai", label: "ไทย (Thai)" },
  { value: "Turkish", label: "Türkçe (Turkish)" },
  { value: "Turkmen", label: "Türkmençe (Turkmen)" },
  { value: "Ukrainian", label: "Українська (Ukrainian)" },
  { value: "Urdu", label: "اردو (Urdu)" },
  { value: "Uzbek", label: "O'zbekcha (Uzbek)" },
  { value: "Vietnamese", label: "Tiếng Việt (Vietnamese)" },
  { value: "Welsh", label: "Cymraeg (Welsh)" },
  { value: "Zulu", label: "isiZulu (Zulu)" },
].sort((a, b) => a.label.localeCompare(b.label));

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  "Instagram", "TikTok", "LinkedIn", "X", "Facebook", "Threads", "Pinterest", "YouTube"
];

const TONES = ["Default", "Funny", "Professional", "Inspirational", "Casual", "Poetic", "Witty", "Sarcastic"];
const MAX_LANGUAGES_PER_REQUEST = 15;

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

type AppMediaType = 'image' | 'video' | 'image_collection';

const LoadingFallback = () => (
  <Card className="w-full shadow-lg rounded-xl">
    <CardContent className="p-6 flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
      <p className="text-muted-foreground">Loading section...</p>
    </CardContent>
  </Card>
);

export default function CaptionWiseClient() {
  const { toast } = useToast();
  
  const [mediaFiles, setMediaFiles] = useState<File[] | null>(null);
  const [mediaSrcs, setMediaSrcs] = useState<string[] | null>(null);
  const [mediaType, setMediaType] = useState<AppMediaType | null>(null);
  const [vibe, setVibe] = useState<string | null>(null);
  
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English"]);
  const [selectedSongLanguages, setSelectedSongLanguages] = useState<string[]>(["English"]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram"]);

  const [suggestedCaptions, setSuggestedCaptions] = useState<MediaSuggestions | null>(null);
  const [refinedCaptions, setRefinedCaptions] = useState<MediaSuggestions | null>(null);
  const [captionFeedback, setCaptionFeedback] = useState<string>("");
  const [selectedTone, setSelectedTone] = useState<string>("Default");

  const [suggestedSongs, setSuggestedSongs] = useState<SongSuggestionsMap | null>(null);
  const [refinedSongSuggestions, setRefinedSongSuggestions] = useState<SongSuggestionsMap | null>(null);
  const [songFeedback, setSongFeedback] = useState<string>("");
  const [artistPreference, setArtistPreference] = useState<string>("");

  const [suggestedHashtags, setSuggestedHashtags] = useState<MediaSuggestions | null>(null);

  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [isRefiningCaptions, setIsRefiningCaptions] = useState<boolean>(false);
  const [isRefiningSongs, setIsRefiningSongs] = useState<boolean>(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);
  const [playingCaption, setPlayingCaption] = useState<string | null>(null);

  const hasRefinedCaptions = useMemo(() => {
    return refinedCaptions && Object.keys(refinedCaptions).length > 0;
  }, [refinedCaptions]);

  const hasRefinedSongSuggestions = useMemo(() => {
    return refinedSongSuggestions && Object.keys(refinedSongSuggestions).length > 0;
  }, [refinedSongSuggestions]);

  const resetSuggestions = useCallback(() => {
    setSuggestedCaptions(null);
    setRefinedCaptions(null);
    setCaptionFeedback("");
    setSuggestedSongs(null);
    setRefinedSongSuggestions(null);
    setSongFeedback("");
    setArtistPreference("");
    setSuggestedHashtags(null);
    setSelectedTone("Default");
    setVibe(null);
    setGeneratedVideoUrl(null);
  }, []);

  const resetMedia = useCallback(() => {
      setMediaFiles(null);
      setMediaSrcs(null);
      setMediaType(null);
  }, []);
  
  const resetAll = useCallback(() => {
    resetSuggestions();
    resetMedia();
  }, [resetSuggestions, resetMedia]);

  const handleLanguageChange = (languageValue: string) => {
    setSelectedLanguages(prev => {
      const newSelection = prev.includes(languageValue)
        ? prev.filter(lang => lang !== languageValue)
        : [...prev, languageValue];
      if (newSelection.length === 0) { 
        toast({ variant: "destructive", title: "Selection Error", description: "At least one language must be selected." });
        return prev; 
      }
      return newSelection;
    });
  };

  const handleSongLanguageChange = (languageValue: string) => {
    setSelectedSongLanguages(prev => {
      const newSelection = prev.includes(languageValue)
        ? prev.filter(lang => lang !== languageValue)
        : [...prev, languageValue];
      if (newSelection.length === 0) {
        toast({ variant: "destructive", title: "Selection Error", description: "At least one song language must be selected." });
        return prev;
      }
      return newSelection;
    });
  }

  const handlePlatformChange = (platformValue: string) => {
    setSelectedPlatforms(prev => {
      const newSelection = prev.includes(platformValue)
        ? prev.filter(p => p !== platformValue)
        : [...prev, platformValue];
      if (newSelection.length === 0) {
        toast({ variant: "destructive", title: "Selection Error", description: "At least one platform must be selected." });
        return prev;
      }
      return newSelection;
    });
  }

  const processMediaFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    resetAll();
    
    const uploadedFiles = Array.from(files);
    let currentMediaType: AppMediaType;

    if (uploadedFiles.length > 1) { 
      currentMediaType = 'image_collection'; 
    } else { 
      const singleFile = uploadedFiles[0];
      currentMediaType = singleFile.type.startsWith('image/') ? 'image' : 'video';
    }
    
    setMediaFiles(uploadedFiles);
    setMediaType(currentMediaType);
    setIsSuggesting(true);

    try {
      const dataUris = await Promise.all(uploadedFiles.map(file => fileToDataUri(file)));
      setMediaSrcs(dataUris);

      const vibeResult = await analyzeMediaVibe({ mediaDataUris: dataUris, mediaType: currentMediaType });
      setVibe(vibeResult.vibe);

      const targetLanguagesForSuggestions = [...new Set([...selectedLanguages, ...selectedSongLanguages])];
      
      const input: SuggestMediaCaptionsInput = { 
        mediaDataUris: dataUris, 
        mediaType: currentMediaType, 
        targetLanguages: targetLanguagesForSuggestions.slice(0, MAX_LANGUAGES_PER_REQUEST),
        targetPlatforms: selectedPlatforms
      };

      const result = await suggestMediaCaptions(input);
      
      const newSuggestedCaptions: MediaSuggestions = {};
      const newSuggestedSongs: SongSuggestionsMap = {};
      const newSuggestedHashtags: MediaSuggestions = {};
      
      result.languageEntries?.forEach((entry) => {
        if (entry.language) {
          if (entry.captions?.length > 0) newSuggestedCaptions[entry.language] = entry.captions;
          if (entry.songSuggestions?.length > 0) newSuggestedSongs[entry.language] = entry.songSuggestions;
          if (entry.hashtags?.length > 0) newSuggestedHashtags[entry.language] = entry.hashtags;
        }
      });
      
      setSuggestedCaptions(newSuggestedCaptions);
      setSuggestedSongs(newSuggestedSongs);
      setSuggestedHashtags(newSuggestedHashtags);

    } catch (error: any) {
      console.error("Error during media processing:", error);
      toast({ 
        variant: "destructive", 
        title: "Processing Error", 
        description: error.message || "An unexpected response was received."
      });
      resetAll();
    } finally {
      setIsSuggesting(false);
    }
  }, [selectedLanguages, selectedSongLanguages, selectedPlatforms, toast, resetAll]);

  const handleMediaUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    processMediaFiles(Array.from(files));
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (!navigator.clipboard?.read) {
        toast({ variant: "destructive", title: "Compatibility Issue", description: "Your browser doesn't support reading the clipboard directly. Try using Ctrl+V or long-pressing." });
        return;
      }

      const clipboardItems = await navigator.clipboard.read();
      const pastedFiles: File[] = [];

      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            const ext = type.split('/')[1] || 'png';
            const file = new File([blob], `pasted-image-${Date.now()}.${ext}`, { type });
            pastedFiles.push(file);
          }
        }
      }

      if (pastedFiles.length > 0) {
        toast({ title: "Image Pasted", description: `Processing ${pastedFiles.length} image(s) from clipboard.` });
        processMediaFiles(pastedFiles);
      } else {
        toast({ variant: "destructive", title: "No Image Found", description: "No image was found in your clipboard. Make sure you've copied an image recently." });
      }
    } catch (err) {
      console.error("Failed to read clipboard:", err);
      toast({ variant: "destructive", title: "Clipboard Error", description: "Could not access clipboard. Please ensure you've given permission." });
    }
  };

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      
      const pastedFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) pastedFiles.push(file);
        }
      }

      if (pastedFiles.length > 0) {
        toast({ 
          title: "Image Pasted", 
          description: `Processing ${pastedFiles.length} image(s) from clipboard.` 
        });
        processMediaFiles(pastedFiles);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [processMediaFiles, toast]);

  const handleRefineCaptions = async () => {
    if (!mediaSrcs || !mediaType || !captionFeedback) return;
    setIsRefiningCaptions(true);

    const languagesToRefine = selectedLanguages.slice(0, MAX_LANGUAGES_PER_REQUEST);
    const initialCaptionEntries = languagesToRefine.map(lang => ({
        language: lang,
        captions: (refinedCaptions && refinedCaptions[lang]) || (suggestedCaptions && suggestedCaptions[lang]) || [],
    }));

    try {
      const captionInput: RefineMediaCaptionsInput = {
        mediaDataUris: mediaSrcs,
        mediaType: mediaType,
        mediaDescription: vibe || "User uploaded media.",
        initialCaptionEntries,
        userFeedback: captionFeedback,
        tone: selectedTone === 'Default' ? undefined : selectedTone,
        targetLanguages: languagesToRefine,
        targetPlatforms: selectedPlatforms,
      };
      const result = await refineMediaCaptions(captionInput);
      
      const newRefinedCaptions: MediaSuggestions = { ...refinedCaptions };
      result.refinedLanguageEntries?.forEach((entry) => {
        if (entry.language && entry.refinedCaptions?.length > 0) newRefinedCaptions[entry.language] = entry.refinedCaptions;
      });

      setRefinedCaptions(newRefinedCaptions);
      toast({ title: "Captions Refined!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Refinement Error", description: error.message });
    } finally {
      setIsRefiningCaptions(false);
    }
  };

  const handleRefineSongs = async () => {
    if (!mediaSrcs || !mediaType || !songFeedback) return;
    setIsRefiningSongs(true);

    const languagesToRefine = selectedSongLanguages.slice(0, MAX_LANGUAGES_PER_REQUEST);
    const initialSongEntries = languagesToRefine.map(lang => ({
      language: lang,
      songSuggestions: (refinedSongSuggestions && refinedSongSuggestions[lang]) || (suggestedSongs && suggestedSongs[lang]) || [],
    }));

    try {
      const songInput: RefineSongSuggestionsInput = {
        mediaDataUris: mediaSrcs,
        mediaType: mediaType,
        mediaDescription: vibe || "User uploaded media.",
        initialSongEntries,
        userFeedback: songFeedback,
        artistPreference: artistPreference || undefined,
        targetLanguages: languagesToRefine,
      };
      const result = await refineSongSuggestions(songInput);

      const newRefinedSongs: SongSuggestionsMap = { ...refinedSongSuggestions };
      result.refinedLanguageSongEntries?.forEach((entry) => {
        if (entry.language && entry.refinedSongSuggestions?.length > 0) {
          newRefinedSongs[entry.language] = entry.refinedSongSuggestions;
        }
      });

      setRefinedSongSuggestions(newRefinedSongs);
      toast({ title: "Songs Refined!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Refinement Error", description: error.message });
    } finally {
      setIsRefiningSongs(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!mediaSrcs || mediaSrcs.length === 0) return;
    setIsGeneratingVideo(true);
    setGeneratedVideoUrl(null);

    try {
      const result = await generateVideo({ 
        imageDataUri: mediaSrcs[0], 
        prompt: `Animate this media with a ${vibe || 'cinematic'} vibe.` 
      });
      setGeneratedVideoUrl(result.videoDataUri);
      toast({ title: "Video Generated!", description: "Your AI video is ready." });
    } catch (error: any) {
      console.error("Video generation error:", error);
      toast({ 
        variant: "destructive", 
        title: "Video Error", 
        description: "Could not generate video. The AI servers might be busy." 
      });
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handlePlayAudio = async (caption: string) => {
    if (playingCaption === caption) {
        activeAudio?.pause();
        setPlayingCaption(null);
        return;
    }
    setPlayingCaption(caption); 
    if (activeAudio) activeAudio.pause();
    try {
        const { audioDataUri } = await textToSpeech({ text: caption });
        const audio = new Audio(audioDataUri);
        setActiveAudio(audio);
        audio.play();
        audio.onended = () => { setPlayingCaption(null); setActiveAudio(null); };
    } catch (error) {
        toast({ variant: "destructive", title: "Audio Error", description: "Could not play audio."});
        setPlayingCaption(null);
    }
  }

  const handleCopyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => toast({ title: "Copied!", description: `${type} copied.` }));
  };

  const CaptionDisplayCardRenderer = ({ caption, language }: { caption: string; language: string }) => (
    <div className="p-3 border rounded-md bg-card flex justify-between items-center gap-2 shadow-sm">
      <div className="flex-grow">
        <p className="text-xs text-muted-foreground font-semibold">{language}</p>
        <p className="text-sm text-card-foreground">{caption}</p>
      </div>
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={() => handlePlayAudio(caption)} disabled={playingCaption === caption}>
            {playingCaption === caption ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => handleCopyText(caption, `Caption`)}>
            <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const SongSuggestionItemRenderer = ({ song, language }: { song: SongSuggestion; language: string }) => (
    <div className="p-3 border rounded-md bg-card flex justify-between items-center gap-2 shadow-sm">
      <div className="flex-grow">
        <p className="text-xs text-muted-foreground">{language}</p>
        <p className="text-sm font-bold text-card-foreground">{song.title} <span className="font-normal text-muted-foreground">by {song.artist}</span></p>
        <p className="text-xs text-muted-foreground mt-1 italic">{song.description}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={() => handleCopyText(`${song.title} by ${song.artist}`, `Song`)}>
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center antialiased">
      <header className="w-full flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[hsl(var(--app-title))]">VibeWords</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon"><HelpCircle className="h-5 w-5" /></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <AiAssistant
                mediaType={mediaType}
                vibe={vibe}
                suggestedCaptions={suggestedCaptions}
                suggestedSongs={null}
                captionFeedback={captionFeedback}
                songFeedback={songFeedback}
                selectedTone={selectedTone}
              />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="w-full max-w-2xl flex flex-col gap-8">
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-6 w-6 text-primary" />
              1. Choose Your Target
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <PlatformSelector
              allPlatforms={SOCIAL_PLATFORMS}
              selectedPlatforms={selectedPlatforms}
              onPlatformChange={handlePlatformChange}
              description="Choose target platforms for optimization."
            />
            
            <Tabs defaultValue="captions">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="captions">Captions</TabsTrigger>
                <TabsTrigger value="songs">Songs</TabsTrigger>
              </TabsList>
              <TabsContent value="captions" className="pt-4">
                <LanguageSelector
                  allLanguages={PREDEFINED_LANGUAGES}
                  selectedLanguages={selectedLanguages}
                  onLanguageChange={handleLanguageChange}
                  onBulkSelect={setSelectedLanguages}
                  description={`Choose languages for your platform captions.`}
                />
              </TabsContent>
              <TabsContent value="songs" className="pt-4">
                 <LanguageSelector
                  allLanguages={PREDEFINED_LANGUAGES}
                  selectedLanguages={selectedSongLanguages}
                  onLanguageChange={handleSongLanguageChange}
                  onBulkSelect={setSelectedSongLanguages}
                  description={`Choose languages for song ideas.`}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="w-full shadow-lg border-2 border-dashed border-muted hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadCloud className="h-6 w-6 text-primary" />
              2. Upload or Paste Content
            </CardTitle>
            <CardDescription>Upload files, or simply **paste an image** from your clipboard anywhere!</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6 gap-4">
             <Input type="file" id="media-upload" accept="image/*,video/*" multiple onChange={handleMediaUpload} disabled={isSuggesting} className="hidden" />
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <Label htmlFor="media-upload" className="w-full">
                    <Button variant="outline" className="w-full py-12 flex flex-col gap-2 h-auto border-dashed hover:bg-primary/5 hover:border-primary/40" asChild disabled={isSuggesting}>
                    <div className="cursor-pointer">
                        <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                        <span className="text-lg font-medium">Browse Files</span>
                        <span className="text-xs text-muted-foreground">Select images or videos</span>
                    </div>
                    </Button>
                </Label>

                <Button 
                    variant="outline" 
                    className="w-full py-12 flex flex-col gap-2 h-auto border-dashed hover:bg-primary/5 hover:border-primary/40" 
                    onClick={handlePasteFromClipboard}
                    disabled={isSuggesting}
                >
                    <ClipboardPaste className="h-10 w-10 text-muted-foreground mb-2" />
                    <span className="text-lg font-medium">Paste Image</span>
                    <span className="text-xs text-muted-foreground">From your clipboard</span>
                </Button>
             </div>
             
             {mediaSrcs && mediaSrcs.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mt-6">
                    {mediaSrcs.map((src, idx) => (
                        <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border shadow-sm group">
                             {mediaType === 'video' ? (
                                <video src={src} className="w-full h-full object-cover" />
                             ) : (
                                <img src={src} alt="Preview" className="w-full h-full object-cover" />
                             )}
                        </div>
                    ))}
                </div>
             )}
          </CardContent>
        </Card>

        {mediaType === 'image' && mediaSrcs && (
           <Card className="w-full shadow-lg overflow-hidden">
             <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Video className="h-5 w-5 text-primary" />
                  3. AI Video Generation (Optional)
                </CardTitle>
                <CardDescription>Convert your image into a cinematic 5-second video.</CardDescription>
             </CardHeader>
             <CardContent className="pt-6">
                {!generatedVideoUrl && (
                   <Button 
                    onClick={handleGenerateVideo} 
                    disabled={isGeneratingVideo} 
                    className="w-full h-12 text-lg font-semibold"
                    variant="secondary"
                  >
                    {isGeneratingVideo ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                    {isGeneratingVideo ? "Creating Magic..." : "Generate AI Video"}
                  </Button>
                )}
                {isGeneratingVideo && (
                   <div className="mt-4 flex flex-col items-center gap-2 py-4 animate-pulse">
                      <p className="text-sm text-muted-foreground italic">Generating cinematic motion. This usually takes 30-60 seconds...</p>
                   </div>
                )}
                {generatedVideoUrl && (
                  <div className="mt-2 space-y-4">
                    <div className="rounded-lg overflow-hidden border shadow-inner bg-black aspect-video">
                      <video src={generatedVideoUrl} controls className="w-full h-full" autoPlay loop muted />
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <a href={generatedVideoUrl} download="vibewords-video.mp4">
                        <Download className="mr-2 h-4 w-4" /> Download AI Video
                      </a>
                    </Button>
                  </div>
                )}
             </CardContent>
           </Card>
        )}

        {isSuggesting && (
          <div className="flex flex-col items-center gap-4 py-8 animate-pulse">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p>Processing for {selectedPlatforms.join(' & ')}...</p>
          </div>
        )}

        {vibe && !isSuggesting && (
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="italic">{vibe}</p>
          </div>
        )}

        {!isSuggesting && suggestedCaptions && (
           <Suspense fallback={<LoadingFallback />}>
            <SuggestedCaptionsDisplay
                mediaType={mediaType}
                suggestedCaptions={suggestedCaptions}
                captionFeedback={captionFeedback}
                setCaptionFeedback={setCaptionFeedback}
                handleRefineCaptions={handleRefineCaptions}
                isRefiningCaptions={isRefiningCaptions}
                isRefiningSongs={isRefiningSongs}
                selectedLanguages={selectedLanguages} 
                PREDEFINED_LANGUAGES={PREDEFINED_LANGUAGES}
                CaptionDisplayCardRenderer={CaptionDisplayCardRenderer}
                selectedTone={selectedTone}
                setSelectedTone={setSelectedTone}
                tones={TONES}
            />
           </Suspense>
        )}

        {hasRefinedCaptions && (
          <Suspense fallback={<LoadingFallback />}>
            <RefinedCaptionsDisplay
                refinedCaptions={refinedCaptions}
                selectedLanguages={selectedLanguages} 
                PREDEFINED_LANGUAGES={PREDEFINED_LANGUAGES}
                CaptionDisplayCardRenderer={CaptionDisplayCardRenderer}
            />
          </Suspense>
        )}

        {!isSuggesting && suggestedSongs && (
          <Suspense fallback={<LoadingFallback />}>
            <SuggestedSongsDisplay
                mediaType={mediaType}
                suggestedSongs={suggestedSongs}
                songFeedback={songFeedback}
                setSongFeedback={setSongFeedback}
                artistPreference={artistPreference}
                setArtistPreference={setArtistPreference}
                handleRefineSongs={handleRefineSongs} 
                isRefiningCaptions={isRefiningCaptions}
                isRefiningSongs={isRefiningSongs}
                selectedLanguages={selectedSongLanguages} 
                PREDEFINED_LANGUAGES={PREDEFINED_LANGUAGES}
                SongSuggestionItemRenderer={SongSuggestionItemRenderer}
            />
          </Suspense>
        )}

        {hasRefinedSongSuggestions && (
          <Suspense fallback={<LoadingFallback />}>
            <RefinedSongsDisplay
                refinedSongSuggestions={refinedSongSuggestions}
                selectedLanguages={selectedSongLanguages}
                PREDEFINED_LANGUAGES={PREDEFINED_LANGUAGES}
                SongSuggestionItemRenderer={SongSuggestionItemRenderer}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
}
