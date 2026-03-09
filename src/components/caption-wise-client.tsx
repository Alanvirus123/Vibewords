"use client";

import React, { useState, type ChangeEvent, useMemo, Suspense } from "react";
import { UploadCloud, Copy, Loader2, Sparkles, Share2, HelpCircle, Music2, Hash, Text, Volume2, RefreshCw, AlertTriangle } from "lucide-react";
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
import { ThemeToggle } from "@/components/theme-toggle";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { LanguageSelector } from './language-selector';
import { PlatformSelector } from './platform-selector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MediaSuggestions, LanguageOption, SocialPlatform } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  { value: "Armenian", label: "Հայերեն (Armenian)" },
  { value: "Assamese", label: "অসমীয়া (Assamese)" },
  { value: "Azerbaijani", label: "Azərbaycanca (Azerbaijani)" },
  { value: "Basque", label: "Euskara (Basque)" },
  { value: "Bengali", label: "বাংলা (Bengali)" },
  { value: "Bhojpuri", label: "भोजपुरी (Bhojpuri)" },
  { value: "Bodo", label: "बर' (Bodo)" },
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
  { value: "Hebrew", label: "עברית (Hebrew)" },
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
  { value: "Khmer", label: "ខ្មែរ (Khmer)" },
  { value: "Konkani", label: "कोंकणी (Konkani)" },
  { value: "Korean", label: "한국어 (Korean)" },
  { value: "Kyrgyz", label: "Кыргызча (Kyrgyz)" },
  { value: "Lao", label: "ລາວ (Lao)" },
  { value: "Latvian", label: "Latviešu (Latvian)" },
  { value: "Lithuanian", label: "Lietuvių (Lithuanian)" },
  { value: "Macedonian", label: "Македонски (Macedonian)" },
  { value: "Maithili", label: "मैथिली (Maithili)" },
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

  const [suggestedSongs, setSuggestedSongs] = useState<MediaSuggestions | null>(null);
  const [refinedSongSuggestions, setRefinedSongSuggestions] = useState<MediaSuggestions | null>(null);
  const [songFeedback, setSongFeedback] = useState<string>("");
  const [artistPreference, setArtistPreference] = useState<string>("");

  const [suggestedHashtags, setSuggestedHashtags] = useState<MediaSuggestions | null>(null);

  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [isRefiningCaptions, setIsRefiningCaptions] = useState<boolean>(false);
  const [isRefiningSongs, setIsRefiningSongs] = useState<boolean>(false);
  
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);
  const [playingCaption, setPlayingCaption] = useState<string | null>(null);

  const hasRefinedCaptions = useMemo(() => {
    return refinedCaptions && Object.keys(refinedCaptions).length > 0;
  }, [refinedCaptions]);

  const hasRefinedSongSuggestions = useMemo(() => {
    return refinedSongSuggestions && Object.keys(refinedSongSuggestions).length > 0;
  }, [refinedSongSuggestions]);

  const resetSuggestions = () => {
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
  }

  const resetMedia = () => {
      setMediaFiles(null);
      setMediaSrcs(null);
      setMediaType(null);
  }
  
  const resetAll = () => {
    resetSuggestions();
    resetMedia();
  }

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

  const handleMediaUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

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
      
      if (targetLanguagesForSuggestions.length > MAX_LANGUAGES_PER_REQUEST) {
        toast({
          variant: "destructive",
          title: "Too Many Languages",
          description: `Processing all languages at once might time out. Limiting to the first ${MAX_LANGUAGES_PER_REQUEST} for better reliability.`
        });
      }

      const input: SuggestMediaCaptionsInput = { 
        mediaDataUris: dataUris, 
        mediaType: currentMediaType, 
        targetLanguages: targetLanguagesForSuggestions.slice(0, MAX_LANGUAGES_PER_REQUEST),
        targetPlatforms: selectedPlatforms
      };

      const result = await suggestMediaCaptions(input);
      
      const newSuggestedCaptions: MediaSuggestions = {};
      const newSuggestedSongs: MediaSuggestions = {};
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
        description: error.message || "An unexpected response was received from the server. Try selecting fewer languages."
      });
      resetAll();
    } finally {
      setIsSuggesting(false);
    }
  };

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
      toast({ 
        variant: "destructive", 
        title: "Refinement Error", 
        description: error.message || "Could not refine captions. Try providing simpler feedback."
      });
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

      const newRefinedSongs: MediaSuggestions = { ...refinedSongSuggestions };
      result.refinedLanguageSongEntries?.forEach((entry) => {
        if (entry.language && entry.refinedSongSuggestions?.length > 0) {
          newRefinedSongs[entry.language] = entry.refinedSongSuggestions;
        }
      });

      setRefinedSongSuggestions(newRefinedSongs);
      toast({ title: "Songs Refined!" });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Refinement Error", 
        description: error.message || "Could not refine songs. Try selecting fewer song languages."
      });
    } finally {
      setIsRefiningSongs(false);
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

  const SongSuggestionItemRenderer = ({ title, language }: { title: string; language: string }) => (
    <div className="p-3 border rounded-md bg-card flex justify-between items-center gap-2 shadow-sm">
      <div className="flex-grow">
        <p className="text-xs text-muted-foreground">{language}</p>
        <p className="text-sm text-card-foreground">{title}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={() => handleCopyText(title, `Song`)}>
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
                suggestedSongs={suggestedSongs}
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
            <CardDescription>Select the platforms and languages for your post content.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <PlatformSelector
                allPlatforms={SOCIAL_PLATFORMS}
                selectedPlatforms={selectedPlatforms}
                onPlatformChange={handlePlatformChange}
                description="Choose one or more platforms to optimize for."
              />
            </div>
            
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
                  description={`Choose languages for your platform captions (Max ${MAX_LANGUAGES_PER_REQUEST} for AI stability).`}
                />
              </TabsContent>
              <TabsContent value="songs" className="pt-4">
                 <LanguageSelector
                  allLanguages={PREDEFINED_LANGUAGES}
                  selectedLanguages={selectedSongLanguages}
                  onLanguageChange={handleSongLanguageChange}
                  onBulkSelect={setSelectedSongLanguages}
                  description={`Choose languages for song ideas (Max ${MAX_LANGUAGES_PER_REQUEST} for AI stability).`}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadCloud className="h-6 w-6 text-primary" />
              2. Upload Content
            </CardTitle>
          </CardHeader>
          <CardContent>
             <Input type="file" accept="image/*,video/*" multiple onChange={handleMediaUpload} disabled={isSuggesting} />
          </CardContent>
        </Card>

        {isSuggesting && (
          <div className="flex flex-col items-center gap-4 py-8 bg-muted/20 rounded-xl border border-dashed animate-pulse">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-semibold">Tailoring for {selectedPlatforms.join(' & ')}...</p>
              <p className="text-sm text-muted-foreground">Generating {selectedLanguages.length} linguistic variations. This might take a minute.</p>
            </div>
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

        {!isSuggesting && suggestedHashtags && (
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center gap-2"><Hash className="h-5 w-5 text-primary" /> Hashtags for {selectedPlatforms.join(', ')}</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {Object.values(suggestedHashtags).flat().slice(0, 30).map((tag, i) => (
                <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => handleCopyText(tag, 'Hashtag')}>{tag}</Badge>
              ))}
            </CardContent>
          </Card>
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