
"use client";

import React, { useState, type ChangeEvent, useMemo, Suspense, useEffect, useCallback } from "react";
import { UploadCloud, Copy, Loader2, Sparkles, HelpCircle, Music2, Volume2, RefreshCw, ClipboardPaste, ExternalLink, LogOut, LayoutDashboard, Settings, History, FileText } from "lucide-react";
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
import type { MediaSuggestions, LanguageOption, SocialPlatform, SongSuggestion, SongSuggestionsMap } from '@/lib/types';
import { AiAssistant } from "@/components/ai-assistant";
import { cn } from "@/lib/utils";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";

const SuggestedCaptionsDisplay = React.lazy(() => import('@/components/suggested-captions-display'));
const RefinedCaptionsDisplay = React.lazy(() => import('@/components/refined-captions-display'));
const SuggestedSongsDisplay = React.lazy(() => import('@/components/suggested-songs-display'));
const RefinedSongsDisplay = React.lazy(() => import('@/components/refined-songs-display'));

const PREDEFINED_LANGUAGES: LanguageOption[] = [
  { value: "Afrikaans", label: "Afrikaans" },
  { value: "Bengali", label: "বাংলা (Bengali)" },
  { value: "Chinese_Simplified", label: "中文 (简体)" },
  { value: "English", label: "English" },
  { value: "French", label: "Français" },
  { value: "German", label: "Deutsch" },
  { value: "Hindi", label: "हिन्दी (Hindi)" },
  { value: "Japanese", label: "日本語" },
  { value: "Korean", label: "한국어" },
  { value: "Spanish", label: "Español" },
].sort((a, b) => a.label.localeCompare(b.label));

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  "Instagram", "TikTok", "LinkedIn", "X", "Facebook", "Threads", "YouTube", "WhatsApp"
];

const PLATFORM_LIMITS: Record<string, number> = {
  "X": 280,
  "Threads": 500,
  "Instagram": 2200,
  "LinkedIn": 3000,
  "TikTok": 4000,
  "Facebook": 5000,
  "YouTube": 5000,
  "WhatsApp": 700 
};

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
  <Card className="w-full glass-card">
    <CardContent className="p-12 flex flex-col items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground animate-pulse">Syncing AI nodes...</p>
    </CardContent>
  </Card>
);

export default function CaptionWiseClient() {
  const { toast } = useToast();
  const auth = useAuth();
  const { user } = useUser();
  
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
  
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);
  const [playingCaption, setPlayingCaption] = useState<string | null>(null);

  const hasRefinedCaptions = useMemo(() => {
    return refinedCaptions && Object.keys(refinedCaptions).length > 0;
  }, [refinedCaptions]);

  const hasRefinedSongSuggestions = useMemo(() => {
    return refinedSongSuggestions && Object.keys(refinedSongSuggestions).length > 0;
  }, [refinedSongSuggestions]);

  const minPlatformLimit = useMemo(() => {
    const limits = selectedPlatforms.map(p => PLATFORM_LIMITS[p] || 2200);
    return Math.min(...limits);
  }, [selectedPlatforms]);

  const resetAll = useCallback(() => {
    setSuggestedCaptions(null);
    setRefinedCaptions(null);
    setCaptionFeedback("");
    setSuggestedSongs(null);
    setRefinedSongSuggestions(null);
    setSongFeedback("");
    setVibe(null);
    setMediaFiles(null);
    setMediaSrcs(null);
    setMediaType(null);
  }, []);

  const processMediaFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    resetAll();
    
    const uploadedFiles = Array.from(files);
    let currentMediaType: AppMediaType = uploadedFiles.length > 1 ? 'image_collection' : (uploadedFiles[0].type.startsWith('image/') ? 'image' : 'video');
    
    setMediaFiles(uploadedFiles);
    setMediaType(currentMediaType);
    setIsSuggesting(true);

    try {
      const dataUris = await Promise.all(uploadedFiles.map(file => fileToDataUri(file)));
      setMediaSrcs(dataUris);

      const vibeResult = await analyzeMediaVibe({ mediaDataUris: dataUris, mediaType: currentMediaType });
      setVibe(vibeResult.vibe);

      const result = await suggestMediaCaptions({ 
        mediaDataUris: dataUris, 
        mediaType: currentMediaType, 
        targetLanguages: [...new Set([...selectedLanguages, ...selectedSongLanguages])].slice(0, MAX_LANGUAGES_PER_REQUEST),
        targetPlatforms: selectedPlatforms
      });
      
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
      toast({ variant: "destructive", title: "AI Error", description: error.message || "Model timeout." });
      resetAll();
    } finally {
      setIsSuggesting(false);
    }
  }, [selectedLanguages, selectedSongLanguages, selectedPlatforms, toast, resetAll]);

  const handleMediaUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) processMediaFiles(Array.from(event.target.files));
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      const pastedFiles: File[] = [];
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            pastedFiles.push(new File([blob], `pasted-${Date.now()}.png`, { type }));
          }
        }
      }
      if (pastedFiles.length > 0) processMediaFiles(pastedFiles);
    } catch (err) {
      toast({ variant: "destructive", title: "Clipboard Error", description: "Access denied." });
    }
  };

  const handleLogout = () => signOut(auth);

  const handleRefineCaptions = async () => {
    if (!suggestedCaptions || !captionFeedback || isRefiningCaptions) return;
    setIsRefiningCaptions(true);
    try {
      const initialCaptionEntries = Object.entries(suggestedCaptions).map(([lang, caps]) => ({
        language: lang,
        captions: caps as [string, string, string, string]
      }));

      const result = await refineMediaCaptions({
        mediaDataUris: mediaSrcs || [],
        mediaType: mediaType || 'image',
        mediaDescription: vibe || "",
        initialCaptionEntries,
        userFeedback: captionFeedback,
        tone: selectedTone,
        targetLanguages: selectedLanguages,
        targetPlatforms: selectedPlatforms
      });

      const newRefinedCaptions: MediaSuggestions = {};
      result.refinedLanguageEntries.forEach(entry => {
        newRefinedCaptions[entry.language] = entry.refinedCaptions;
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
    if (!suggestedSongs || !songFeedback || isRefiningSongs) return;
    setIsRefiningSongs(true);
    try {
      const initialSongEntries = Object.entries(suggestedSongs).map(([lang, songs]) => ({
        language: lang,
        songSuggestions: songs
      }));

      const result = await refineSongSuggestions({
        mediaDataUris: mediaSrcs || [],
        mediaType: mediaType || 'image',
        mediaDescription: vibe || "",
        initialSongEntries,
        userFeedback: songFeedback,
        artistPreference: artistPreference || undefined,
        targetLanguages: selectedSongLanguages
      });

      const newRefinedSongs: SongSuggestionsMap = {};
      result.refinedLanguageSongEntries.forEach(entry => {
        newRefinedSongs[entry.language] = entry.refinedSongSuggestions;
      });
      setRefinedSongSuggestions(newRefinedSongs);
      toast({ title: "Audio Vibes Updated!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Refinement Error", description: error.message });
    } finally {
      setIsRefiningSongs(false);
    }
  };

  const handlePlayAudio = async (text: string) => {
    if (playingCaption === text) { activeAudio?.pause(); setPlayingCaption(null); return; }
    setPlayingCaption(text);
    try {
        const { audioDataUri } = await textToSpeech({ text });
        const audio = new Audio(audioDataUri);
        setActiveAudio(audio);
        audio.play();
        audio.onended = () => { setPlayingCaption(null); setActiveAudio(null); };
    } catch (e) { setPlayingCaption(null); }
  }

  const CaptionDisplayCardRenderer = ({ caption, language }: { caption: string; language: string }) => {
    const isOverLimit = caption.length > minPlatformLimit;
    const hashtags = suggestedHashtags?.[language] || [];
    const fullText = `${caption}\n\n${hashtags.join(' ')}`;

    return (
      <div className="p-4 border rounded-xl bg-card hover:border-primary/50 transition-all shadow-sm group">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-grow space-y-2">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{language}</span>
            <p className="text-sm leading-relaxed text-foreground/90">{caption}</p>
          </div>
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => handlePlayAudio(caption)} disabled={playingCaption === caption}>
                {playingCaption === caption ? <Loader2 className="h-3 w-3 animate-spin" /> : <Volume2 className="h-4 w-4" />}
             </Button>
             <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-primary/10" 
                title="Copy full post (caption + hashtags)"
                onClick={() => navigator.clipboard.writeText(fullText).then(() => toast({ title: "Full Post Copied!" }))}
             >
                <FileText className="h-4 w-4" />
             </Button>
             <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => navigator.clipboard.writeText(caption).then(() => toast({ title: "Caption Copied!" }))}>
                <Copy className="h-4 w-4" />
             </Button>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", isOverLimit ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
                {caption.length} / {minPlatformLimit} chars
            </span>
            <div className="flex gap-1">
                {selectedPlatforms.map(p => (
                    <span key={p} className="text-[9px] font-semibold text-muted-foreground uppercase">{p}</span>
                ))}
            </div>
        </div>
      </div>
    );
  };

  const SongSuggestionItemRenderer = ({ song, language }: { song: SongSuggestion; language: string }) => (
    <div className="p-4 border rounded-xl bg-card hover:border-primary/50 transition-all shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{language}</span>
          <h5 className="text-sm font-bold text-foreground">{song.title} <span className="font-normal text-muted-foreground">/ {song.artist}</span></h5>
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(`${song.title} by ${song.artist}`).then(() => toast({ title: "Copied!" }))}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground italic mb-4 line-clamp-2">{song.description}</p>
      <div className="flex gap-2">
         <Button variant="secondary" size="sm" className="h-8 text-[10px] font-bold" asChild>
           <a href={`https://open.spotify.com/search/${encodeURIComponent(`${song.title} ${song.artist}`)}`} target="_blank" rel="noopener noreferrer">
              <Music2 className="h-3 w-3 mr-2" /> SPOTIFY
           </a>
         </Button>
         <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold" asChild>
           <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.title} ${song.artist}`)}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-2" /> YOUTUBE
           </a>
         </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-lg flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-[hsl(var(--app-title))]">VibeWords</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full border border-border/50 text-[10px] font-bold text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  {user.isAnonymous ? "GUEST MODE" : user.email?.toUpperCase()}
              </div>
          )}
          <ThemeToggle />
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full"><HelpCircle className="h-5 w-5" /></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl bg-background border-primary/20">
              <AiAssistant
                mediaType={mediaType} vibe={vibe} suggestedCaptions={suggestedCaptions}
                suggestedSongs={suggestedSongs} captionFeedback={captionFeedback}
                songFeedback={songFeedback} selectedTone={selectedTone}
              />
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-destructive" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </nav>

      <div className="flex-grow flex flex-col container mx-auto max-w-4xl p-6 gap-8">
        <main className="flex-grow space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-dashed border-primary/20 bg-primary/5 hover:border-primary/50 transition-all cursor-pointer group h-full">
              <label htmlFor="media-upload" className="block p-8 text-center space-y-4 cursor-pointer">
                <div className="inline-flex p-4 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">DATA INGESTION</h3>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Images, Videos, or Collections</p>
                </div>
                <Input type="file" id="media-upload" accept="image/*,video/*" multiple onChange={handleMediaUpload} disabled={isSuggesting} className="hidden" />
                <Button variant="secondary" size="sm" className="w-full text-[10px] font-bold" onClick={handlePasteFromClipboard} disabled={isSuggesting}>
                  <ClipboardPaste className="h-3 w-3 mr-2" /> PASTE FROM CLIPBOARD
                </Button>
              </label>
            </Card>

            <Card className="border-border/50 shadow-xl overflow-hidden h-full">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-sm font-bold tracking-widest flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  CONFIGURATION
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <PlatformSelector
                  allPlatforms={SOCIAL_PLATFORMS}
                  selectedPlatforms={selectedPlatforms}
                  onPlatformChange={(p) => setSelectedPlatforms(prev => prev.includes(p) ? (prev.length > 1 ? prev.filter(x => x !== p) : prev) : [...prev, p])}
                  description="Optimize AI generation for your channels."
                />
                
                <Tabs defaultValue="captions" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-9">
                    <TabsTrigger value="captions" className="text-[10px] font-bold uppercase">Captions</TabsTrigger>
                    <TabsTrigger value="songs" className="text-[10px] font-bold uppercase">Audio</TabsTrigger>
                  </TabsList>
                  <TabsContent value="captions" className="pt-4 space-y-4">
                    <LanguageSelector
                      allLanguages={PREDEFINED_LANGUAGES}
                      selectedLanguages={selectedLanguages}
                      onLanguageChange={(l) => setSelectedLanguages(prev => prev.includes(l) ? (prev.length > 1 ? prev.filter(x => x !== l) : prev) : [...prev, l])}
                      description="Generation Languages"
                    />
                  </TabsContent>
                  <TabsContent value="songs" className="pt-4">
                     <LanguageSelector
                      allLanguages={PREDEFINED_LANGUAGES}
                      selectedLanguages={selectedSongLanguages}
                      onLanguageChange={(l) => setSelectedSongLanguages(prev => prev.includes(l) ? (prev.length > 1 ? prev.filter(x => x !== l) : prev) : [...prev, l])}
                      description="Song Vibe Languages"
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {mediaSrcs && mediaSrcs.length > 0 && (
            <Card className="border-border/50 overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4">
                <CardHeader className="py-3 px-4 bg-muted/50 border-b flex flex-row items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Assets</span>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive hover:bg-destructive/10" onClick={resetAll}>DISCARD</Button>
                </CardHeader>
                <CardContent className="p-3">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {mediaSrcs.map((src, idx) => (
                            <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-white/10 shadow-inner">
                                 {mediaType === 'video' ? <video src={src} className="w-full h-full object-cover" /> : <img src={src} alt="Preview" className="w-full h-full object-cover" />}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
          )}

          {isSuggesting && (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
                <div className="relative">
                    <div className="h-20 w-20 rounded-full border-2 border-primary/20 animate-ping absolute inset-0" />
                    <div className="h-20 w-20 rounded-full border-t-2 border-primary animate-spin" />
                    <Sparkles className="h-10 w-10 text-primary absolute inset-0 m-auto" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold tracking-tight uppercase">Processing Media</h2>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Optimizing for {selectedPlatforms.join(' + ')}</p>
                </div>
            </div>
          )}

          {!isSuggesting && (
            <div className="space-y-6">
              {vibe && (
                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-4 shadow-sm">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                    <History className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">SCENE ANALYSIS</h4>
                    <p className="text-sm font-medium leading-relaxed italic opacity-80">"{vibe}"</p>
                  </div>
                </div>
              )}

              <div className="space-y-8">
                {suggestedCaptions && (
                  <Suspense fallback={<LoadingFallback />}>
                    <SuggestedCaptionsDisplay
                        mediaType={mediaType} suggestedCaptions={suggestedCaptions}
                        captionFeedback={captionFeedback} setCaptionFeedback={setCaptionFeedback}
                        handleRefineCaptions={handleRefineCaptions} isRefiningCaptions={isRefiningCaptions}
                        isRefiningSongs={isRefiningSongs} selectedLanguages={selectedLanguages} 
                        PREDEFINED_LANGUAGES={PREDEFINED_LANGUAGES} CaptionDisplayCardRenderer={CaptionDisplayCardRenderer}
                        selectedTone={selectedTone} setSelectedTone={setSelectedTone} tones={TONES}
                    />
                  </Suspense>
                )}

                {hasRefinedCaptions && (
                  <Suspense fallback={<LoadingFallback />}>
                    <RefinedCaptionsDisplay
                        refinedCaptions={refinedCaptions} selectedLanguages={selectedLanguages} 
                        PREDEFINED_LANGUAGES={PREDEFINED_LANGUAGES} CaptionDisplayCardRenderer={CaptionDisplayCardRenderer}
                    />
                  </Suspense>
                )}

                {suggestedSongs && (
                  <Suspense fallback={<LoadingFallback />}>
                    <SuggestedSongsDisplay
                        mediaType={mediaType} suggestedSongs={suggestedSongs}
                        songFeedback={songFeedback} setSongFeedback={setSongFeedback}
                        artistPreference={artistPreference} setArtistPreference={setArtistPreference}
                        handleRefineSongs={handleRefineSongs} isRefiningCaptions={isRefiningCaptions}
                        isRefiningSongs={isRefiningSongs} selectedLanguages={selectedSongLanguages} 
                        PREDEFINED_LANGUAGES={PREDEFINED_LANGUAGES} SongSuggestionItemRenderer={SongSuggestionItemRenderer}
                    />
                  </Suspense>
                )}

                {hasRefinedSongSuggestions && (
                  <Suspense fallback={<LoadingFallback />}>
                    <RefinedSongsDisplay
                        refinedSongSuggestions={refinedSongSuggestions} selectedLanguages={selectedSongLanguages}
                        PREDEFINED_LANGUAGES={PREDEFINED_LANGUAGES} SongSuggestionItemRenderer={SongSuggestionItemRenderer}
                    />
                  </Suspense>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
      
      <footer className="h-14 border-t border-border/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-auto">
        VIBEWORDS // ENTERPRISE AI CONTENT SUITE
      </footer>
    </div>
  );
}
