
"use client";

import React, { useState, type ChangeEvent, useCallback, useMemo, Suspense, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UploadCloud, Copy, RefreshCw, Loader2, Film, Music2, Sparkles as SparklesLucideIcon, LanguagesIcon, Edit3, ImagePlus, Images, LogOut, User, Text, Music, Hash, Feather, HelpCircle, History, Image as ImageIcon, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { suggestMediaCaptions, type SuggestMediaCaptionsInput, type SuggestMediaCaptionsOutput, type LanguageSuggestionEntry } from "@/ai/flows/suggest-media-captions";
import { refineMediaCaptions, type RefineMediaCaptionsInput, type RefineMediaCaptionsOutput, type RefinedLanguageCaptionEntry } from "@/ai/flows/refine-media-captions";
import { refineSongSuggestions, type RefineSongSuggestionsInput, type RefineSongSuggestionsOutput, type RefinedLanguageSongEntry } from "@/ai/flows/refine-song-suggestions";
import { analyzeMediaVibe, type AnalyzeMediaVibeInput, type AnalyzeMediaVibeOutput } from "@/ai/flows/analyze-media-vibe";
import { textToSpeech } from "@/ai/flows/text-to-speech";
import { ThemeToggle } from "@/components/theme-toggle";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LanguageSelector } from './language-selector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MediaSuggestions, LanguageOption, StoredUserDetails, GenerationHistoryItem } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AiAssistant } from "@/components/ai-assistant";
import { Textarea } from "./ui/textarea";
import { saveUser, saveGeneration, getGenerations } from '@/services/firebase';
import { HistoryDialog } from "@/components/history-dialog";

const SuggestedCaptionsDisplay = React.lazy(() => import('@/components/suggested-captions-display'));
const RefinedCaptionsDisplay = React.lazy(() => import('@/components/refined-captions-display'));
const SuggestedSongsDisplay = React.lazy(() => import('@/components/suggested-songs-display'));
const RefinedSongsDisplay = React.lazy(() => import('@/components/refined-songs-display'));


const PREDEFINED_LANGUAGES: LanguageOption[] = [
  { value: "Arabic", label: "العربية (Arabic)" },
  { value: "Assamese", label: "অসমীয়া (Assamese)" },
  { value: "Bengali", label: "বাংলা (Bengali)" },
  { value: "Bodo", label: "बोड़ो (Bodo)" },
  { value: "Chinese_Simplified", label: "中文 (简体) (Chinese Simplified)" },
  { value: "Chinese_Traditional", label: "中文 (繁體) (Chinese Traditional)" },
  { value: "Czech", label: "Čeština (Czech)" },
  { value: "Danish", label: "Dansk (Danish)" },
  { value: "Dogri", label: "डोगरी (Dogri)" },
  { value: "Dutch", label: "Nederlands (Dutch)" },
  { value: "English", label: "English" },
  { value: "Filipino", label: "Filipino" },
  { value: "Finnish", label: "Suomi (Finnish)" },
  { value: "French", label: "Français (French)" },
  { value: "German", label: "Deutsch (German)" },
  { value: "Greek", label: "Ελληνικά (Greek)" },
  { value: "Gujarati", label: "ગુજરાતી (Gujarati)" },
  { value: "Hebrew", label: "עברית (Hebrew)" },
  { value: "Hindi", label: "हिन्दी (Hindi)" },
  { value: "Hungarian", label: "Magyar (Hungarian)" },
  { value: "Indonesian", label: "Bahasa Indonesia (Indonesian)" },
  { value: "Italian", label: "Italiano (Italian)" },
  { value: "Japanese", label: "日本語 (Japanese)" },
  { value: "Kannada", label: "ಕನ್ನಡ (Kannada)" },
  { value: "Kashmiri", label: "कश्मीरी / كشميري (Kashmiri)" },
  { value: "Konkani", label: "कोंकणी (Konkani)" },
  { value: "Korean", label: "한국어 (Korean)" },
  { value: "Maithili", label: "मैथिली (Maithili)" },
  { value: "Malay", label: "Bahasa Melayu (Malay)" },
  { value: "Malayalam", label: "മലയാളം (Malayalam)" },
  { value: "Manipuri", label: "মৈতৈলোন্ (Manipuri / Meitei)" },
  { value: "Marathi", label: "मराठी (Marathi)" },
  { value: "Nepali", label: "नेपाली (Nepali)" },
  { value: "Norwegian", label: "Norsk (Norsk)" },
  { value: "Odia", label: "ଓଡ଼ିଆ (Odia)" },
  { value: "Polish", label: "Polski (Polish)" },
  { value: "Portuguese", label: "Português (Portuguese)" },
  { value: "Punjabi", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { value: "Romanian", label: "Română (Romanian)" },
  { value: "Russian", label: "Русский (Russian)" },
  { value: "Sanskrit", label: "संस्कृतम् (Sanskrit)" },
  { value: "Santhali", label: "संताली / ᱥᱟᱱᱛᱟᱲᱤ (Santhali)" },
  { value: "Sindhi", label: "सिन्धी / سنڌي (Sindhi)" },
  { value: "Slovak", label: "Slovenčina (Slovak)" },
  { value: "Spanish", label: "Español (Spanish)" },
  { value: "Swahili", label: "Kiswahili (Swahili)" },
  { value: "Swedish", "label": "Svenska (Swedish)" },
  { value: "Tamil", label: "தமிழ் (Tamil)" },
  { value: "Telugu", label: "తెలుగు (Telugu)" },
  { value: "Thai", label: "ไทย (Thai)" },
  { value: "Turkish", label: "Türkçe (Turkish)" },
  { value: "Ukrainian", label: "Українська (Ukrainian)" },
  { value: "Urdu", label: "اردو (Urdu)" },
  { value: "Vietnamese", label: "Tiếng Việt (Vietnamese)" },
].sort((a, b) => a.label.localeCompare(b.label));

const TONES = ["Default", "Funny", "Professional", "Inspirational", "Casual", "Poetic", "Witty", "Sarcastic"];

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
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
  const router = useRouter();
  const { toast } = useToast();
  
  const [mediaFiles, setMediaFiles] = useState<File[] | null>(null);
  const [mediaSrcs, setMediaSrcs] = useState<string[] | null>(null);
  const [mediaType, setMediaType] = useState<AppMediaType | null>(null);
  
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English"]);
  const [selectedSongLanguages, setSelectedSongLanguages] = useState<string[]>(["English"]);

  const [suggestedCaptions, setSuggestedCaptions] = useState<MediaSuggestions | null>(null);
  const [refinedCaptions, setRefinedCaptions] = useState<MediaSuggestions | null>(null);
  const [captionFeedback, setCaptionFeedback] = useState<string>("");
  const [selectedTone, setSelectedTone] = useState<string>("Default");

  const [suggestedSongs, setSuggestedSongs] = useState<MediaSuggestions | null>(null);
  const [refinedSongSuggestions, setRefinedSongSuggestions] = useState<MediaSuggestions | null>(null);
  const [songFeedback, setSongFeedback] = useState<string>("");
  const [artistPreference, setArtistPreference] = useState<string>("");

  const [suggestedHashtags, setSuggestedHashtags] = useState<MediaSuggestions | null>(null);

  const [mediaVibe, setMediaVibe] = useState<string | null>(null);
  const [isAnalyzingVibe, setIsAnalyzingVibe] = useState<boolean>(false);

  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [isRefiningCaptions, setIsRefiningCaptions]_useState<boolean>(false);
  const [isRefiningSongs, setIsRefiningSongs] = useState<boolean>(false);
  
  const [userDetails, setUserDetails] = useState<StoredUserDetails | null>(null);
  
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);
  const [playingCaption, setPlayingCaption] = useState<string | null>(null);


  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('caption-wise-user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserDetails(parsedUser);
        saveUser(parsedUser); // Save to Firestore on initial load
      }
    } catch (error) {
      console.error("Could not parse data from localStorage:", error);
    }
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('caption-wise-user');
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.replace('/login');
    } catch (error) {
      console.error("Could not access localStorage to log out:", error);
      toast({
        variant: "destructive",
        title: "Logout Error",
        description: "Could not log out. Please clear your site data manually.",
      });
    }
  };
  
  const resetSuggestions = () => {
    setSuggestedCaptions(null);
    setRefinedCaptions(null);
    setCaptionFeedback("");
    setSuggestedSongs(null);
    setRefinedSongSuggestions(null);
    setSongFeedback("");
    setArtistPreference("");
    setMediaVibe(null);
    setSuggestedHashtags(null);
    setSelectedTone("Default");
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
        toast({ variant: "destructive", title: "Selection Error", description: "At least one language must be selected for captions." });
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
        toast({ variant: "destructive", title: "Selection Error", description: "At least one language must be selected for songs." });
        return prev; 
      }
      return newSelection;
    });
  };
  
  const handleMediaUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      if (event.target) event.target.value = '';
      return;
    }

    if (selectedLanguages.length === 0 || selectedSongLanguages.length === 0) {
      toast({ variant: "destructive", title: "Language(s) Missing", description: "Please select at least one language for captions and songs before uploading." });
      if (event.target) event.target.value = ''; 
      return;
    }
    
    resetAll(); 
    
    const uploadedFiles = Array.from(files);
    let filesToProcess = uploadedFiles;
    let currentMediaType: AppMediaType;

    if (filesToProcess.length > 1) { 
      const allImages = filesToProcess.every(file => file.type.startsWith('image/'));
      if (!allImages) {
        toast({ variant: "destructive", title: "Invalid File Mix", description: "If uploading multiple files (2-50), all must be images." });
        if (event.target) event.target.value = '';
        return; 
      }
      if (filesToProcess.length > 50) {
        toast({ title: "Too Many Images", description: `You selected ${filesToProcess.length} images. The maximum is 50. Processing the first 50.` });
        filesToProcess = filesToProcess.slice(0, 50);
      }
      currentMediaType = 'image_collection'; 
    } else if (filesToProcess.length === 1) { 
      const singleFile = filesToProcess[0];
      if (singleFile.type.startsWith('image/')) {
        currentMediaType = 'image'; 
      } else if (singleFile.type.startsWith('video/')) {
        currentMediaType = 'video'; 
      } else {
        toast({ variant: "destructive", title: "Invalid File Type", description: "Please select an image file (up to 50 if multiple) or a single video file." });
        if (event.target) event.target.value = '';
        resetMedia();
        return; 
      }
    } else { 
      if (event.target) event.target.value = '';
      resetMedia();
      return; 
    }
    
    setMediaFiles(filesToProcess);
    setMediaType(currentMediaType);

    try {
      const dataUris = await Promise.all(filesToProcess.map(file => fileToDataUri(file)));
      setMediaSrcs(dataUris);
      handleVibeAnalysis(dataUris, currentMediaType); // Call vibe analysis first
      await handleSuggestCaptionsAndSongs(dataUris, currentMediaType, [...new Set([...selectedLanguages, ...selectedSongLanguages])]);
    } catch (error: any) {
      console.error("Error during media processing or initial AI suggestion phase:", error);
      let description = "Could not process the uploaded files.";
       if (error?.message?.toLowerCase().includes("failed to fetch")) {
        description = "The server had an issue processing your request, possibly due to request size. Please try fewer/smaller files."
      } else if (error?.message) {
        description = `File processing error: ${error.message}.`;
      }
      toast({ variant: "destructive", title: "File Processing Error", description });
      resetAll();
      if (event.target) event.target.value = '';
    }
  };

  const handleVibeAnalysis = async (dataUris: string[], currentMediaType: AppMediaType) => {
    setIsAnalyzingVibe(true);
    setMediaVibe(null);
    try {
      const input: AnalyzeMediaVibeInput = { mediaDataUris: dataUris, mediaType: currentMediaType };
      const result = await analyzeMediaVibe(input);
      setMediaVibe(result.vibe);
    } catch (error) {
      console.error("Error analyzing media vibe:", error);
      toast({ variant: "destructive", title: "Vibe Analysis Failed", description: "Could not analyze the media's vibe." });
    } finally {
      setIsAnalyzingVibe(false);
    }
  };

  const handleSuggestCaptionsAndSongs = async (dataUris: string[], currentMediaType: AppMediaType, targetLanguagesForSuggestions: string[]) => {
    if (targetLanguagesForSuggestions.length === 0) {
      toast({ variant: "destructive", title: "Language Missing", description: "Please select languages for suggestions." });
      return;
    }
    setIsSuggesting(true);
    resetSuggestions();

    try {
      const input: SuggestMediaCaptionsInput = { mediaDataUris: dataUris, mediaType: currentMediaType, targetLanguages: targetLanguagesForSuggestions };
      const result: SuggestMediaCaptionsOutput = await suggestMediaCaptions(input);
      
      const newSuggestedCaptions: MediaSuggestions = {};
      const newSuggestedSongs: MediaSuggestions = {};
      const newSuggestedHashtags: MediaSuggestions = {};
      
      result.languageEntries?.forEach((entry: LanguageSuggestionEntry) => {
        if (entry.language) {
          if (entry.captions?.length > 0) newSuggestedCaptions[entry.language] = entry.captions;
          if (entry.songSuggestions?.length > 0) newSuggestedSongs[entry.language] = entry.songSuggestions;
          if (entry.hashtags?.length > 0) newSuggestedHashtags[entry.language] = entry.hashtags;
        }
      });
      
      setSuggestedCaptions(Object.keys(newSuggestedCaptions).length > 0 ? newSuggestedCaptions : null);
      setSuggestedSongs(Object.keys(newSuggestedSongs).length > 0 ? newSuggestedSongs : null);
      setSuggestedHashtags(Object.keys(newSuggestedHashtags).length > 0 ? newSuggestedHashtags : null);
      
      // Save to history
      if (userDetails?.email && (Object.keys(newSuggestedCaptions).length > 0 || Object.keys(newSuggestedSongs).length > 0)) {
        const historyItem: Omit<GenerationHistoryItem, 'id' | 'timestamp'> = {
            userEmail: userDetails.email,
            mediaSrcs: dataUris,
            mediaType: currentMediaType,
            vibe: mediaVibe,
            suggestions: {
                captions: newSuggestedCaptions,
                songs: newSuggestedSongs,
                hashtags: newSuggestedHashtags,
            },
        };
        await saveGeneration(historyItem);
      }

    } catch (error: any) {
      console.error("Error suggesting captions/songs:", error);
      toast({ variant: "destructive", title: "Suggestion Error", description: `Failed to get suggestions. ${error.message}` });
    } finally {
      setIsSuggesting(false);
    }
  };

  const getMediaDescriptionForRefinementFlow = useCallback((): string => {
    if (mediaType === 'image_collection') return "A collection of user-uploaded images.";
    if (mediaType === 'image') return "A user-uploaded image.";
    if (mediaType === 'video') return "A user-uploaded video.";
    return "User-uploaded media.";
  }, [mediaType]);

  const prepareCaptionsForRefinement = useCallback((lang: string): string[] => {
    const placeholders = ["Please refine this caption.", "Consider this alternative.", "Add more detail here.", "How about this style?"];
    // Use refined if available, otherwise fall back to initial suggestions.
    const sourceCaptions = (refinedCaptions && refinedCaptions[lang]) || (suggestedCaptions && suggestedCaptions[lang]);
    
    if (!sourceCaptions || sourceCaptions.length === 0) return placeholders;

    let captions = [...sourceCaptions];
    while (captions.length < 4) captions.push(captions[captions.length - 1] || placeholders[captions.length]);
    return captions.slice(0, 4);
  }, [refinedCaptions, suggestedCaptions]);

  const prepareSongsForRefinement = useCallback((lang: string): string[] => {
      const placeholders = ["Please suggest a song.", "Please suggest another song."];
      // Use refined if available, otherwise fall back to initial suggestions.
      const sourceSongs = (refinedSongSuggestions && refinedSongSuggestions[lang]) || (suggestedSongs && suggestedSongs[lang]);
      
      if (!sourceSongs || sourceSongs.length === 0) return placeholders;

      let songs = [...sourceSongs];
      while (songs.length < 2) songs.push(songs[songs.length - 1] || placeholders[songs.length]);
      return songs.slice(0, 2);
  }, [refinedSongSuggestions, suggestedSongs]);


  const handleRefineCaptions = async () => {
    const hasAnyCaptionsToRefine = (suggestedCaptions && Object.values(suggestedCaptions).some(c => c?.length > 0)) || (refinedCaptions && Object.values(refinedCaptions).some(c => c?.length > 0));
    if (!mediaSrcs || !mediaType || !hasAnyCaptionsToRefine || !captionFeedback || selectedLanguages.length === 0) {
      toast({ variant: 'destructive', title: 'Refinement Error', description: 'Missing media, initial captions, feedback, or selected languages.' });
      return;
    }
    setIsRefiningCaptions(true);
    setRefinedCaptions(null);

    const initialCaptionEntries = selectedLanguages.map(lang => ({
        language: lang,
        captions: prepareCaptionsForRefinement(lang),
    }));

    try {
      const captionInput: RefineMediaCaptionsInput = {
        mediaDataUris: mediaSrcs,
        mediaType: mediaType,
        mediaDescription: getMediaDescriptionForRefinementFlow(),
        initialCaptionEntries,
        userFeedback: captionFeedback,
        tone: selectedTone === 'Default' ? undefined : selectedTone,
        targetLanguages: selectedLanguages,
      };
      const captionResult = await refineMediaCaptions(captionInput);

      const newRefinedCaptions: MediaSuggestions = {};
      captionResult.refinedLanguageEntries?.forEach((entry: RefinedLanguageCaptionEntry) => {
        if (entry.language && entry.refinedCaptions?.length > 0) newRefinedCaptions[entry.language] = entry.refinedCaptions;
      });

      if (Object.keys(newRefinedCaptions).length > 0) {
        setRefinedCaptions(newRefinedCaptions);
        toast({ title: "Captions Refined!", description: "New captions generated. Now auto-refining songs..." });
        await handleAutoRefineSongs();
      } else {
        toast({ title: "No captions refined", description: "The AI could not refine captions based on your feedback." });
      }
    } catch (error: any) {
      console.error("Error refining captions:", error);
      toast({ variant: "destructive", title: "Caption Refinement Error", description: `Failed to refine captions. ${error.message}` });
    } finally {
      setIsRefiningCaptions(false);
    }
  };
  
  const handleAutoRefineSongs = async () => {
    const hasSongs = (suggestedSongs && Object.keys(suggestedSongs).length > 0) || (refinedSongSuggestions && Object.keys(refinedSongSuggestions).length > 0);
    if (!mediaSrcs || !mediaType || !hasSongs || selectedSongLanguages.length === 0) {
        return; // Don't auto-refine if there's nothing to work with
    }
    setIsRefiningSongs(true);
    setRefinedSongSuggestions(null);
    
    const initialSongEntries = selectedSongLanguages.map(lang => ({
        language: lang,
        songSuggestions: prepareSongsForRefinement(lang),
    }));

    try {
        const songInput: RefineSongSuggestionsInput = {
            mediaDataUris: mediaSrcs,
            mediaType: mediaType,
            mediaDescription: getMediaDescriptionForRefinementFlow(),
            initialSongEntries,
            userFeedback: songFeedback || "Make them match the vibe of the refined captions.", 
            artistPreference: artistPreference || undefined,
            targetLanguages: selectedSongLanguages,
        };
        const songResult = await refineSongSuggestions(songInput);
        
        const newRefinedSongs: MediaSuggestions = {};
        songResult.refinedLanguageSongEntries?.forEach((entry) => {
            if (entry.language && entry.refinedSongSuggestions?.length > 0) newRefinedSongs[entry.language] = entry.refinedSongSuggestions;
        });

        if (Object.keys(newRefinedSongs).length > 0) {
          setRefinedSongSuggestions(newRefinedSongs);
          toast({ title: "Songs Auto-Refined!", description: "New song suggestions generated to match your new captions." });
        } else {
          toast({ title: "Songs Not Auto-Refined", description: "Could not automatically refine songs." });
        }
    } catch(error: any) {
        console.error("Error auto-refining songs:", error);
        toast({ variant: "destructive", title: "Song Auto-Refine Error", description: `Failed to refine songs automatically. ${error.message}` });
    } finally {
        setIsRefiningSongs(false);
    }
  }

  const handleRefineSongs = async () => {
    const hasAnySongsToRefine = (suggestedSongs && Object.values(suggestedSongs).some(s => s?.length > 0)) || (refinedSongSuggestions && Object.values(refinedSongSuggestions).some(s => s?.length > 0));
    if (!mediaSrcs || !mediaType || !hasAnySongsToRefine || !songFeedback || selectedSongLanguages.length === 0) {
      toast({ variant: 'destructive', title: 'Refinement Error', description: 'Missing media, initial songs, feedback, or selected languages.' });
      return;
    }
    setIsRefiningSongs(true);
    setRefinedSongSuggestions(null);

    const initialSongEntries = selectedSongLanguages.map(lang => ({
        language: lang,
        songSuggestions: prepareSongsForRefinement(lang),
    }));
    
    try {
      const input: RefineSongSuggestionsInput = {
        mediaDataUris: mediaSrcs,
        mediaType: mediaType,
        mediaDescription: getMediaDescriptionForRefinementFlow(),
        initialSongEntries,
        userFeedback: songFeedback,
        artistPreference: artistPreference || undefined,
        targetLanguages: selectedSongLanguages,
      };
      const result = await refineSongSuggestions(input);
      
      const newRefinedSongs: MediaSuggestions = {};
      result.refinedLanguageSongEntries?.forEach((entry) => {
        if (entry.language && entry.refinedSongSuggestions?.length > 0) newRefinedSongs[entry.language] = entry.refinedSongSuggestions;
      });

      if (Object.keys(newRefinedSongs).length > 0) {
        setRefinedSongSuggestions(newRefinedSongs);
        toast({ title: "Song Suggestions Refined!", description: "New song suggestions generated based on your feedback." });
      } else {
        toast({ title: "No songs refined", description: "The AI could not refine song suggestions based on your feedback." });
      }
    } catch (error: any) {
      console.error("Error refining songs:", error);
      toast({ variant: "destructive", title: "Song Refinement Error", description: `Failed to refine songs. ${error.message}` });
    } finally {
      setIsRefiningSongs(false);
    }
  };


  const handleCopyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast({ title: "Copied!", description: `${type} copied to clipboard.` }))
      .catch(() => toast({ variant: "destructive", title: "Error", description: `Failed to copy ${type}.` }));
  };
  
  const handlePlayAudio = async (caption: string, language: string) => {
    if (playingCaption === caption) {
        activeAudio?.pause();
        setPlayingCaption(null);
        return;
    }
    
    setPlayingCaption(caption); // Indicate loading
    if (activeAudio) activeAudio.pause();

    try {
        const { audioDataUri } = await textToSpeech({ text: caption });
        const audio = new Audio(audioDataUri);
        setActiveAudio(audio);
        audio.play();
        audio.onended = () => {
            setPlayingCaption(null);
            setActiveAudio(null);
        };
    } catch (error: any) {
        console.error("Error with TTS:", error);
        toast({ variant: "destructive", title: "Audio Error", description: "Could not play audio for this caption."});
        setPlayingCaption(null);
    }
  }
  
  const handleOpenHistory = async () => {
    if (userDetails?.email) {
      const userHistory = await getGenerations(userDetails.email);
      setHistory(userHistory);
      setIsHistoryOpen(true);
    }
  };

  const handleLoadHistoryItem = (item: GenerationHistoryItem) => {
    resetAll();
    setMediaSrcs(item.mediaSrcs);
    setMediaType(item.mediaType);
    setMediaVibe(item.vibe);

    const captions = item.suggestions.captions || null;
    const songs = item.suggestions.songs || null;
    const hashtags = item.suggestions.hashtags || null;
    
    setSuggestedCaptions(captions);
    setSuggestedSongs(songs);
    setSuggestedHashtags(hashtags);

    if (captions) setSelectedLanguages(Object.keys(captions));
    if (songs) setSelectedSongLanguages(Object.keys(songs));

    setIsHistoryOpen(false);
    toast({ title: "History Loaded", description: "Previous session has been restored." });
  };


  const CaptionDisplayCardRenderer: React.FC<{ caption: string; language: string }> = ({ caption, language }) => (
    <div className="p-3 border rounded-md bg-card flex justify-between items-center gap-2 shadow-sm">
      <div className="flex-grow">
        <p className="text-xs text-muted-foreground font-semibold">{PREDEFINED_LANGUAGES.find(l=>l.value === language)?.label || language}</p>
        <p className="text-sm text-card-foreground">{caption}</p>
      </div>
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={() => handlePlayAudio(caption, language)} aria-label={`Listen to ${language} caption`} disabled={playingCaption === caption}>
            {playingCaption === caption ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => handleCopyText(caption, `${language} Caption`)} aria-label={`Copy ${language} caption`}>
            <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const SongSuggestionItemRenderer: React.FC<{ title: string; language: string }> = ({ title, language }) => (
    <div className="p-3 border rounded-md bg-card flex justify-between items-center gap-2 shadow-sm">
      <div className="flex-grow">
        <p className="text-xs text-muted-foreground">{PREDEFINED_LANGUAGES.find(l=>l.value === language)?.label || language}</p>
        <p className="text-sm text-card-foreground">{title}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={() => handleCopyText(title, `${language} song title`)} aria-label={`Copy ${language} song title`}>
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );

  const hasSuggestedCaptions = useMemo(() => suggestedCaptions && Object.keys(suggestedCaptions).length > 0 && Object.values(suggestedCaptions).some(arr => arr.length > 0), [suggestedCaptions]);
  const hasRefinedCaptions = useMemo(() => refinedCaptions && Object.keys(refinedCaptions).length > 0 && Object.values(refinedCaptions).some(arr => arr.length > 0), [refinedCaptions]);
  const hasSuggestedSongs = useMemo(() => suggestedSongs && Object.keys(suggestedSongs).length > 0 && selectedSongLanguages.some(lang => suggestedSongs[lang] && suggestedSongs[lang].length > 0), [suggestedSongs, selectedSongLanguages]);
  const hasRefinedSongs = useMemo(() => refinedSongSuggestions && Object.keys(refinedSongSuggestions).length > 0 && selectedSongLanguages.some(lang => refinedSongSuggestions[lang] && refinedSongSuggestions[lang].length > 0), [refinedSongSuggestions, selectedSongLanguages]);
  const hasSuggestedHashtags = useMemo(() => suggestedHashtags && Object.keys(suggestedHashtags).length > 0 && selectedLanguages.some(lang => suggestedHashtags[lang] && suggestedHashtags[lang].length > 0), [suggestedHashtags, selectedLanguages]);

  
  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center antialiased font-sans">
      <header className="w-full flex justify-between items-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-[hsl(var(--app-title))]">VibeWords</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open AI Assistant">
                <HelpCircle className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <AiAssistant
                mediaType={mediaType}
                mediaVibe={mediaVibe}
                suggestedCaptions={suggestedCaptions}
                suggestedSongs={suggestedSongs}
                captionFeedback={captionFeedback}
                songFeedback={songFeedback}
                selectedTone={selectedTone}
              />
            </DialogContent>
          </Dialog>
          <HistoryDialog
            isOpen={isHistoryOpen}
            onOpenChange={setIsHistoryOpen}
            history={history}
            onLoadHistory={handleLoadHistoryItem}
            onOpen={handleOpenHistory}
            PREDEFINED_LANGUAGES={PREDEFINED_LANGUAGES}
          />
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" aria-label="View user profile">
                <User className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>User Profile</DialogTitle>
                <DialogDescription>
                  This is the information you provided at login.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {userDetails ? (
                  <>
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">Name</Label>
                      <p id="name" className="text-lg font-semibold">{userDetails.name}</p>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p id="email" className="text-lg font-semibold">{userDetails.email}</p>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="phone" className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p id="phone" className="text-lg font-semibold">{userDetails.phone}</p>
                    </div>
                  </>
                ) : (
                  <p>Loading user data...</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="icon" onClick={handleLogout} aria-label="Log out">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="w-full max-w-2xl flex flex-col gap-8 items-center">
        <Card className="w-full shadow-lg rounded-xl">
           <CardHeader>
             <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
              <UploadCloud className="h-6 w-6 text-primary" />
              1. Upload Your Content
            </CardTitle>
            <CardDescription>Upload your own media to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="mediaUpload">Media File(s)</Label>
              <Input
                 id="mediaUpload"
                 type="file"
                 accept="image/*,video/*"
                 multiple 
                 onChange={handleMediaUpload}
                 disabled={selectedLanguages.length === 0 || selectedSongLanguages.length === 0}
                 className="text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
               />
               <p className="text-xs text-muted-foreground">Select 1-50 images, or a single video.</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="w-full shadow-lg rounded-xl">
          <CardHeader>
             <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
              <LanguagesIcon className="h-6 w-6 text-primary" />
              2. Select Languages
            </CardTitle>
            <CardDescription>Choose languages for captions and song suggestions.</CardDescription>
          </CardHeader>
          <CardContent>
             <Tabs defaultValue="captions" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="captions"><Text className="mr-2 h-4 w-4" />Captions & Hashtags</TabsTrigger>
                <TabsTrigger value="songs"><Music className="mr-2 h-4 w-4" />Songs</TabsTrigger>
              </TabsList>
              <TabsContent value="captions" className="pt-4">
                <LanguageSelector
                  allLanguages={PREDEFINED_LANGUAGES}
                  selectedLanguages={selectedLanguages}
                  onLanguageChange={handleLanguageChange}
                  description="For initial suggestions and refinement. English is default."
                />
              </TabsContent>
              <TabsContent value="songs" className="pt-4">
                 <LanguageSelector
                  allLanguages={PREDEFINED_LANGUAGES}
                  selectedLanguages={selectedSongLanguages}
                  onLanguageChange={handleSongLanguageChange}
                  description="For display and refinement. English is default."
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {(isSuggesting || mediaSrcs) && (
            <Card className="w-full shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                    <Images className="h-6 w-6 text-primary" />
                    3. Your Media & Vibe
                </CardTitle>
                <CardDescription>This is the content the AI will generate suggestions for.</CardDescription>
              </CardHeader>
              <CardContent>
                {mediaSrcs && mediaSrcs.length > 0 && (
                  <div className="mt-6 border rounded-lg overflow-hidden shadow-md bg-muted/20">
                    {mediaSrcs.length > 1 && mediaType === 'image_collection' ? (
                      <div className="flex space-x-2 overflow-x-auto p-2">
                        {mediaSrcs.map((src, index) => (
                          <Image 
                            key={index} 
                            src={src} 
                            alt={`Uploaded image ${index + 1}`} 
                            width={150} 
                            height={100} 
                            className="object-contain rounded-md h-24 w-auto" 
                            data-ai-hint="uploaded image" 
                          />
                        ))}
                      </div>
                    ) : mediaSrcs.length === 1 && mediaSrcs[0] && (
                      <>
                        {mediaType === 'image' && (
                          <Image src={mediaSrcs[0]} alt="Uploaded image preview" width={600} height={400} className="w-full h-auto object-contain" data-ai-hint="uploaded image" />
                        )}
                        {mediaType === 'video' && (
                          <video src={mediaSrcs[0]} controls className="w-full h-auto max-h-[400px] object-contain rounded-lg" data-ai-hint="uploaded video">
                            Your browser does not support the video tag.
                          </video>
                        )}
                      </>
                    )}
                     {(isAnalyzingVibe || mediaVibe) && (
                      <div className="p-4 bg-background border-t">
                        {isAnalyzingVibe && (
                           <div className="flex items-center text-sm text-muted-foreground">
                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                             Analyzing vibe...
                           </div>
                        )}
                        {mediaVibe && !isAnalyzingVibe && (
                          <div className="flex items-start text-sm">
                            <Feather className="h-5 w-5 mr-3 mt-0.5 text-primary"/>
                            <div>
                              <p className="font-semibold text-foreground">The Vibe</p>
                              <p className="text-muted-foreground">{mediaVibe}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
        )}

        {isSuggesting && (
          <Card className="w-full shadow-lg rounded-xl">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground">Generating suggestions for your {mediaType === 'image_collection' ? 'images' : mediaType || 'media'}...</p>
            </CardContent>
          </Card>
        )}

        {!isSuggesting && hasSuggestedCaptions && (
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
        
        {isRefiningCaptions && !hasRefinedCaptions && (
          <Card className="w-full shadow-lg rounded-xl">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground">Refining captions...</p>
            </CardContent>
          </Card>
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

        {!isSuggesting && hasSuggestedHashtags && (
           <Card className="w-full shadow-lg rounded-xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                    <Hash className="h-6 w-6 text-primary" />
                    5. AI-Suggested Hashtags
                </CardTitle>
                <CardDescription>Hashtags for your selected caption languages. Click to copy.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            {suggestedHashtags && selectedLanguages.map(language => (
                suggestedHashtags[language] && suggestedHashtags[language].length > 0 && (
                <div key={`hashtag-${language}-section`} className="space-y-2">
                    <h4 className="font-semibold text-md text-foreground">{PREDEFINED_LANGUAGES.find(l => l.value === language)?.label || language}</h4>
                    <div className="flex flex-wrap gap-2">
                    {suggestedHashtags[language].map((tag, index) => (
                       <Badge key={`hashtag-${language}-${index}`} variant="secondary" className="cursor-pointer hover:bg-primary/20" onClick={() => handleCopyText(tag, 'Hashtag')}>
                        {tag}
                       </Badge>
                    ))}
                    </div>
                </div>
                )
            ))}
            </CardContent>
           </Card>
        )}

        {!isSuggesting && hasSuggestedSongs && (
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
                selectedLanguages={selectedSongLanguages} _
                PREDEFINED_LANGUAGES={PREDEFINED_LANGUAGES}
                SongSuggestionItemRenderer={SongSuggestionItemRenderer}
            />
          </Suspense>
        )}

        {isRefiningSongs && !hasRefinedSongs && (
          <Card className="w-full shadow-lg rounded-xl">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground">Refining song suggestions...</p>
            </CardContent>
          </Card>
        )}


        {hasRefinedSongs && ( 
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
    
    

    

    

    

    
    