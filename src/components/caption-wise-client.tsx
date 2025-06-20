
"use client";

import React, { useState, type ChangeEvent, useCallback, useMemo, Suspense } from "react";
import Image from "next/image";
import { UploadCloud, Copy, RefreshCw, Loader2, Film, Music2, Sparkles as SparklesLucideIcon, LanguagesIcon, ChevronDown, Edit3, Search, ImagePlus, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { suggestMediaCaptions, type SuggestMediaCaptionsInput, type SuggestMediaCaptionsOutput, type LanguageSuggestionEntry } from "@/ai/flows/suggest-media-captions";
import { refineMediaCaptions, type RefineMediaCaptionsInput, type RefineMediaCaptionsOutput, type RefinedLanguageCaptionEntry } from "@/ai/flows/refine-media-captions";
import { refineSongSuggestions, type RefineSongSuggestionsInput, type RefineSongSuggestionsOutput, type RefinedLanguageSongEntry } from "@/ai/flows/refine-song-suggestions";
import { ThemeToggle } from "@/components/theme-toggle";

const SuggestedCaptionsDisplay = React.lazy(() => import('@/components/suggested-captions-display'));
const RefinedCaptionsDisplay = React.lazy(() => import('@/components/refined-captions-display'));
const SuggestedSongsDisplay = React.lazy(() => import('@/components/suggested-songs-display'));
const RefinedSongsDisplay = React.lazy(() => import('@/components/refined-songs-display'));


const PREDEFINED_LANGUAGES = [
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
  { value: "Swedish", label: "Svenska (Swedish)" },
  { value: "Tamil", label: "தமிழ் (Tamil)" },
  { value: "Telugu", label: "తెలుగు (Telugu)" },
  { value: "Thai", label: "ไทย (Thai)" },
  { value: "Turkish", label: "Türkçe (Turkish)" },
  { value: "Ukrainian", label: "Українська (Ukrainian)" },
  { value: "Urdu", label: "اردو (Urdu)" },
  { value: "Vietnamese", label: "Tiếng Việt (Vietnamese)" },
].sort((a, b) => a.label.localeCompare(b.label));


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

export type MediaSuggestions = Record<string, string[]>;
export type LanguageOption = { value: string; label: string };
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
  const [mediaFiles, setMediaFiles] = useState<File[] | null>(null);
  const [mediaSrcs, setMediaSrcs] = useState<string[] | null>(null);
  const [mediaType, setMediaType] = useState<AppMediaType | null>(null);
  
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English"]);
  const [isLanguagePopoverOpen, setIsLanguagePopoverOpen] = useState(false);
  const [languageSearchTerm, setLanguageSearchTerm] = useState("");

  const [selectedSongLanguages, setSelectedSongLanguages] = useState<string[]>(["English"]);
  const [isSongLanguagePopoverOpen, setIsSongLanguagePopoverOpen] = useState(false);
  const [songLanguageSearchTerm, setSongLanguageSearchTerm] = useState("");

  const [suggestedCaptions, setSuggestedCaptions] = useState<MediaSuggestions | null>(null);
  const [refinedCaptions, setRefinedCaptions] = useState<MediaSuggestions | null>(null);
  const [captionFeedback, setCaptionFeedback] = useState<string>("");

  const [suggestedSongs, setSuggestedSongs] = useState<MediaSuggestions | null>(null);
  const [refinedSongSuggestions, setRefinedSongSuggestions] = useState<MediaSuggestions | null>(null);
  const [songFeedback, setSongFeedback] = useState<string>("");
  const [artistPreference, setArtistPreference] = useState<string>("");

  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [isRefiningCaptions, setIsRefiningCaptions] = useState<boolean>(false);
  const [isRefiningSongs, setIsRefiningSongs] = useState<boolean>(false);

  const { toast } = useToast();

  const resetSuggestionsAndMedia = () => {
    setSuggestedCaptions(null);
    setRefinedCaptions(null);
    setCaptionFeedback("");
    setSuggestedSongs(null);
    setRefinedSongSuggestions(null);
    setSongFeedback("");
    setArtistPreference("");
    setMediaFiles(null);
    setMediaSrcs(null);
    setMediaType(null);
  };

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

    if (selectedLanguages.length === 0) {
      toast({ variant: "destructive", title: "Language Missing", description: "Please select at least one language for captions before uploading media." });
      if (event.target) event.target.value = ''; 
      return;
    }
    if (selectedSongLanguages.length === 0) {
      toast({ variant: "destructive", title: "Song Language Missing", description: "Please select at least one language for songs before uploading media." });
      if (event.target) event.target.value = '';
      return;
    }

    resetSuggestionsAndMedia(); 
    
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
        toast({ variant: "destructive", title: "Invalid File Type", description: "Please select an image file (up to 50 if multiple) or a single video file (up to 2GB)." });
        if (event.target) event.target.value = '';
        setMediaFiles(null); 
        setMediaSrcs(null);
        setMediaType(null);
        return; 
      }
    } else { 
      toast({ variant: "destructive", title: "No Processable Files", description: "No valid files were found in your selection." });
      if (event.target) event.target.value = '';
      setMediaFiles(null); 
      setMediaSrcs(null);
      setMediaType(null);
      return; 
    }
    
    setMediaFiles(filesToProcess);
    setMediaType(currentMediaType);

    try {
      const dataUris = await Promise.all(filesToProcess.map(file => fileToDataUri(file)));
      setMediaSrcs(dataUris);
      await handleSuggestCaptionsAndSongs(dataUris, currentMediaType, selectedLanguages);
    } catch (error: any) {
      console.error("Error during media processing or initial AI suggestion phase:", error);
      let description = "Could not process the uploaded files. The file(s) might be too large, corrupted, or the server encountered an issue.";
      if (error && error.message && (error.message.toLowerCase().includes("unexpected response") || error.message.toLowerCase().includes("failed to fetch"))) {
        description = "The server had an issue processing your request, possibly due to request size or network problem. Please try fewer/smaller files. Check console for details."
      } else if (error && error.message) {
        description = `File processing error: ${error.message}. Check console for details.`;
      }
      toast({ variant: "destructive", title: "File Processing Error", description });
      
      setMediaFiles(null);
      setMediaSrcs(null);
      setMediaType(null);
      setSuggestedCaptions(null);
      setRefinedCaptions(null);
      setSuggestedSongs(null);
      setRefinedSongSuggestions(null);
      setCaptionFeedback("");
      setSongFeedback("");
      setArtistPreference("");

      if (event.target) event.target.value = '';
    }
  };

  const handleSuggestCaptionsAndSongs = async (dataUris: string[], currentMediaType: AppMediaType, targetLanguagesForSuggestions: string[]) => {
    if (targetLanguagesForSuggestions.length === 0) {
      toast({ variant: "destructive", title: "Language Missing", description: "Please select languages for suggestions." });
      return;
    }
    setIsSuggesting(true);
    setSuggestedCaptions(null);
    setSuggestedSongs(null);

    try {
      const input: SuggestMediaCaptionsInput = { mediaDataUris: dataUris, mediaType: currentMediaType, targetLanguages: targetLanguagesForSuggestions };
      const result: SuggestMediaCaptionsOutput = await suggestMediaCaptions(input);
      
      const newSuggestedCaptions: MediaSuggestions = {};
      const newSuggestedSongs: MediaSuggestions = {};
      let hasAnyCaptions = false;
      let hasAnySongs = false;

      result.languageEntries?.forEach((entry: LanguageSuggestionEntry) => {
        if (entry.language && entry.captions && entry.captions.length > 0) {
          newSuggestedCaptions[entry.language] = entry.captions;
          hasAnyCaptions = true;
        }
        if (entry.language && entry.songSuggestions && entry.songSuggestions.length > 0) {
          newSuggestedSongs[entry.language] = entry.songSuggestions;
          hasAnySongs = true;
        }
      });

      setSuggestedCaptions(hasAnyCaptions ? newSuggestedCaptions : null);
      setSuggestedSongs(hasAnySongs ? newSuggestedSongs : null); 
      
      const mediaTypeName = currentMediaType === 'image_collection' ? 'images' : currentMediaType;
      if (!hasAnyCaptions && !hasAnySongs) {
        toast({ title: "No suggestions generated", description: `The AI could not suggest captions or songs for the uploaded ${mediaTypeName} in the selected languages.` });
      } else if (!hasAnyCaptions) {
        toast({ title: "No captions suggested", description: `The AI could not suggest captions for the ${mediaTypeName}, but songs were suggested.` });
      } else if (!hasAnySongs) {
         toast({ title: "No songs suggested", description: `The AI could not suggest songs for the ${mediaTypeName}, but captions were suggested.` });
      }

    } catch (error: any) {
      console.error("Error in handleSuggestCaptionsAndSongs calling suggestMediaCaptions flow:", error);
      const mediaTypeName = currentMediaType === 'image_collection' ? 'images' : currentMediaType || 'media';
      let description = `Failed to suggest captions or songs for the ${mediaTypeName}.`;
      if (error && error.message) {
        description += ` Server said: ${error.message}.`;
      }
      description += " Please check the console for full details.";
      toast({ variant: "destructive", title: "Suggestion Error", description });
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

  const prepareCaptionsForRefinement = (sourceCaptions: string[] | undefined): string[] => {
    const placeholders = ["Please refine this caption.", "Consider this alternative.", "Add more detail here.", "How about this style?"];
    let captions = sourceCaptions ? [...sourceCaptions] : [];
    
    if (captions.length === 0) return placeholders; 
    if (captions.length > 4) return captions.slice(0, 4);
    
    while (captions.length < 4) {
      captions.push(captions[captions.length - 1] || placeholders[captions.length % placeholders.length]);
    }
    return captions;
  };

  const prepareSongsForRefinement = (sourceSongs: string[] | undefined): string[] => {
    const placeholders = ["Please suggest a song.", "Please suggest another song."];
    let songs = sourceSongs ? [...sourceSongs] : [];

    if (songs.length === 0) return placeholders; 
    if (songs.length > 2) return songs.slice(0, 2);

    while (songs.length < 2) {
      songs.push(songs[songs.length - 1] || placeholders[songs.length % placeholders.length]);
    }
    return songs;
  };


  const handleRefineCaptions = async () => {
    if (!mediaSrcs || mediaSrcs.length === 0 || !suggestedCaptions || Object.keys(suggestedCaptions).length === 0 || !captionFeedback || !mediaType || selectedLanguages.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Missing media, initial captions, media type, feedback, or selected languages for caption refinement." });
      return;
    }
    setIsRefiningCaptions(true);
    setRefinedCaptions(null); 

    const mediaDesc = getMediaDescriptionForRefinementFlow();
    
    const initialCaptionEntriesForRefinement = selectedLanguages
      .map(lang => {
        const sourceCaptions = (refinedCaptions && refinedCaptions[lang] && refinedCaptions[lang].length > 0) 
                             ? refinedCaptions[lang] 
                             : suggestedCaptions?.[lang];
        const preparedCaptions = prepareCaptionsForRefinement(sourceCaptions);
        return { language: lang, captions: preparedCaptions };
      })
      .filter(entry => entry.captions.length === 4) as { language: string; captions: string[] }[];


    if (initialCaptionEntriesForRefinement.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "No valid initial captions found for selected languages to refine (must be 4 per language)." });
      setIsRefiningCaptions(false);
      return;
    }

    try {
      const captionInput: RefineMediaCaptionsInput = {
        mediaDataUris: mediaSrcs,
        mediaType: mediaType,
        mediaDescription: mediaDesc,
        initialCaptionEntries: initialCaptionEntriesForRefinement,
        userFeedback: captionFeedback,
        targetLanguages: selectedLanguages,
      };
      const captionResult: RefineMediaCaptionsOutput = await refineMediaCaptions(captionInput);

      const newRefinedCaptions: MediaSuggestions = {};
      let hasAnyRefinedCaptions = false;
      captionResult.refinedLanguageEntries?.forEach((entry: RefinedLanguageCaptionEntry) => {
        if (entry.language && entry.refinedCaptions && entry.refinedCaptions.length > 0) {
          newRefinedCaptions[entry.language] = entry.refinedCaptions;
          hasAnyRefinedCaptions = true;
        }
      });

      if (hasAnyRefinedCaptions) {
        setRefinedCaptions(newRefinedCaptions);
        toast({ title: "Captions Refined!", description: "New captions generated. Attempting to refine songs as well..." });

        if (suggestedSongs && Object.keys(suggestedSongs).length > 0 && mediaType && selectedSongLanguages.length > 0 && mediaSrcs && mediaSrcs.length > 0) {
          setIsRefiningSongs(true); 
          setRefinedSongSuggestions(null); 
          
          const songRefinementMediaDesc = getMediaDescriptionForRefinementFlow();

          const initialSongEntriesForSongRefinement = selectedSongLanguages
            .map(lang => {
              const sourceSongs = (refinedSongSuggestions && refinedSongSuggestions[lang] && refinedSongSuggestions[lang].length > 0) 
                                ? refinedSongSuggestions[lang] 
                                : suggestedSongs?.[lang];
              const preparedSongs = prepareSongsForRefinement(sourceSongs);
              return { language: lang, songSuggestions: preparedSongs };
            })
            .filter(entry => entry.songSuggestions.length === 2) as { language: string; songSuggestions: string[] }[];


          if (initialSongEntriesForSongRefinement.length === 0) {
             toast({ title: "Song Refinement Skipped", description: "No valid initial song suggestions found for selected song languages to refine (must be 2 per language)." });
             setIsRefiningSongs(false);
          } else {
            try {
              const songInput: RefineSongSuggestionsInput = {
                mediaDataUris: mediaSrcs,
                mediaType: mediaType,
                mediaDescription: songRefinementMediaDesc, 
                initialSongEntries: initialSongEntriesForSongRefinement,
                userFeedback: songFeedback || "Make them match the vibe of the refined captions.", 
                artistPreference: artistPreference,
                targetLanguages: selectedSongLanguages,
              };
              const songResult: RefineSongSuggestionsOutput = await refineSongSuggestions(songInput);
              
              const newRefinedSongs: MediaSuggestions = {};
              let hasAnyRefinedSongs = false;
              songResult.refinedLanguageSongEntries?.forEach((entry: RefinedLanguageSongEntry) => {
                if (entry.language && entry.refinedSongSuggestions && entry.refinedSongSuggestions.length > 0) {
                  newRefinedSongs[entry.language] = entry.refinedSongSuggestions;
                  hasAnyRefinedSongs = true;
                }
              });
              setRefinedSongSuggestions(hasAnyRefinedSongs ? newRefinedSongs : null);
              
              if (!hasAnyRefinedSongs) {
                toast({ title: "No songs automatically refined", description: "The AI could not refine song suggestions based on the new captions and song feedback." });
              } else {
                toast({ title: "Song Suggestions Also Refined!", description: "New song suggestions generated using refined captions and your song feedback." });
              }
            } catch (songError: any) {
              console.error("Error in handleRefineCaptions calling refineSongSuggestions flow (auto-refine):", songError);
              let description = "Failed to automatically refine song suggestions.";
              if (songError && songError.message) {
                description += ` Server said: ${songError.message}.`;
              }
              description += " Please check the console for full details.";
              toast({ variant: "destructive", title: "Song Refinement Error", description });
            } finally {
              setIsRefiningSongs(false); 
            }
          }
        }
      } else {
        toast({ title: "No captions refined", description: "The AI could not refine captions based on your feedback." });
      }
    } catch (error: any) {
      console.error("Error in handleRefineCaptions calling refineMediaCaptions flow:", error);
      let description = "Failed to refine captions.";
      if (error && error.message) {
        description += ` Server said: ${error.message}.`;
      }
      description += " Please check the console for full details.";
      toast({ variant: "destructive", title: "Caption Refinement Error", description });
    } finally {
      setIsRefiningCaptions(false); 
    }
  };

  const handleRefineSongs = async () => {
    if (!mediaSrcs || mediaSrcs.length === 0 || !suggestedSongs || Object.keys(suggestedSongs).length === 0 || !songFeedback || !mediaType || selectedSongLanguages.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Missing media, initial song suggestions, media type, feedback, or selected song languages for song refinement." });
      return;
    }
    setIsRefiningSongs(true);
    setRefinedSongSuggestions(null);

    const initialSongEntriesForRefinement = selectedSongLanguages
        .map(lang => {
          const sourceSongs = (refinedSongSuggestions && refinedSongSuggestions[lang] && refinedSongSuggestions[lang].length > 0) 
                            ? refinedSongSuggestions[lang] 
                            : suggestedSongs?.[lang];
          const preparedSongs = prepareSongsForRefinement(sourceSongs);
          return { language: lang, songSuggestions: preparedSongs };
        })
        .filter(entry => entry.songSuggestions.length === 2) as { language: string; songSuggestions: string[] }[];


    if (initialSongEntriesForRefinement.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "No valid initial song suggestions found for selected song languages to refine (must be 2 per language)." });
      setIsRefiningSongs(false);
      return;
    }
    
    try {
      const mediaDesc = getMediaDescriptionForRefinementFlow();
      const input: RefineSongSuggestionsInput = {
        mediaDataUris: mediaSrcs,
        mediaType: mediaType,
        mediaDescription: mediaDesc,
        initialSongEntries: initialSongEntriesForRefinement,
        userFeedback: songFeedback,
        artistPreference: artistPreference,
        targetLanguages: selectedSongLanguages,
      };
      const result: RefineSongSuggestionsOutput = await refineSongSuggestions(input);
      
      const newRefinedSongs: MediaSuggestions = {};
      let hasAnyRefinedSongs = false;
      result.refinedLanguageSongEntries?.forEach((entry: RefinedLanguageSongEntry) => {
        if (entry.language && entry.refinedSongSuggestions && entry.refinedSongSuggestions.length > 0) {
          newRefinedSongs[entry.language] = entry.refinedSongSuggestions;
          hasAnyRefinedSongs = true;
        }
      });
      setRefinedSongSuggestions(hasAnyRefinedSongs ? newRefinedSongs : null);

      if (!hasAnyRefinedSongs) {
        toast({ title: "No songs refined", description: "The AI could not refine song suggestions based on your feedback." });
      } else {
        toast({ title: "Song Suggestions Refined!", description: "New song suggestions generated based on your feedback." });
      }
    } catch (error: any) {
      console.error("Error in handleRefineSongs calling refineSongSuggestions flow:", error);
      let description = "Failed to refine song suggestions.";
      if (error && error.message) {
        description += ` Server said: ${error.message}.`;
      }
      description += " Please check the console for full details.";
      toast({ variant: "destructive", title: "Song Refinement Error", description });
    } finally {
      setIsRefiningSongs(false);
    }
  };


  const handleCopyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast({ title: "Copied!", description: `${type} copied to clipboard.` }))
      .catch(() => toast({ variant: "destructive", title: "Error", description: `Failed to copy ${type}.` }));
  };

  const CaptionDisplayCardRenderer: React.FC<{ caption: string; language: string }> = ({ caption, language }) => (
    <div className="p-3 border rounded-md bg-card flex justify-between items-center gap-2 shadow-sm">
      <div className="flex-grow">
        <p className="text-xs text-muted-foreground font-semibold">{PREDEFINED_LANGUAGES.find(l=>l.value === language)?.label || language}</p>
        <p className="text-sm text-card-foreground">{caption}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={() => handleCopyText(caption, `${language} Caption`)} aria-label={`Copy ${language} caption`}>
        <Copy className="h-4 w-4" />
      </Button>
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

  
  const displayedLanguages = useMemo(() => {
    const labels = selectedLanguages.map(val => PREDEFINED_LANGUAGES.find(l => l.value === val)?.label || val);
    if (labels.length > 2) {
      return `${labels.slice(0, 2).join(', ')} + ${labels.length - 2} more`;
    }
    return labels.join(', ') || "Select languages...";
  }, [selectedLanguages]);

  const displayedSongLanguages = useMemo(() => {
    const labels = selectedSongLanguages.map(val => PREDEFINED_LANGUAGES.find(l => l.value === val)?.label || val);
    if (labels.length > 2) {
      return `${labels.slice(0, 2).join(', ')} + ${labels.length - 2} more`;
    }
    return labels.join(', ') || "Select song languages...";
  }, [selectedSongLanguages]);


  const filteredLanguages = useMemo(() => {
    if (!languageSearchTerm) {
      return PREDEFINED_LANGUAGES;
    }
    return PREDEFINED_LANGUAGES.filter(lang => 
      lang.label.toLowerCase().includes(languageSearchTerm.toLowerCase()) ||
      lang.value.toLowerCase().includes(languageSearchTerm.toLowerCase())
    );
  }, [languageSearchTerm]);

  const filteredSongLanguages = useMemo(() => {
    if (!songLanguageSearchTerm) {
      return PREDEFINED_LANGUAGES;
    }
    return PREDEFINED_LANGUAGES.filter(lang => 
      lang.label.toLowerCase().includes(songLanguageSearchTerm.toLowerCase()) ||
      lang.value.toLowerCase().includes(songLanguageSearchTerm.toLowerCase())
    );
  }, [songLanguageSearchTerm]);


  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center antialiased font-sans">
      <header className="w-full flex justify-between items-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-[hsl(var(--app-title))]">VibeWords</h1>
        <ThemeToggle />
      </header>

      <main className="w-full max-w-2xl flex flex-col gap-8 items-center">
        <Card className="w-full shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
              <LanguagesIcon className="h-6 w-6 text-primary" />
              1. Select Languages (for Captions & Initial Suggestions)
            </CardTitle>
            <CardDescription>Choose languages for captions. Initial song suggestions will also be in these languages. English is default.</CardDescription>
          </CardHeader>
          <CardContent>
            <Popover open={isLanguagePopoverOpen} onOpenChange={setIsLanguagePopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {displayedLanguages}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[--radix-popover-trigger-width] p-0"
                side="bottom"
                align="start"
                sideOffset={8}
              >
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search languages..."
                      className="w-full pl-8 pr-2 py-1 h-9 rounded-md border"
                      value={languageSearchTerm}
                      onChange={(e) => setLanguageSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <ScrollArea className="h-60"> 
                  <div className="p-2 space-y-1"> 
                  {filteredLanguages.map(lang => (
                    <div key={lang.value} className="flex items-center space-x-2 p-1 hover:bg-accent rounded-md"> 
                      <Checkbox
                        id={`lang-${lang.value}`}
                        checked={selectedLanguages.includes(lang.value)}
                        onCheckedChange={() => handleLanguageChange(lang.value)}
                      />
                      <Label htmlFor={`lang-${lang.value}`} className="font-normal cursor-pointer flex-1 text-sm">{lang.label}</Label> 
                    </div>
                  ))}
                  {filteredLanguages.length === 0 && (
                    <p className="p-2 text-sm text-muted-foreground text-center">No languages found.</p>
                  )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
             <p className="mt-2 text-xs text-muted-foreground">
                Selected for captions: {selectedLanguages.map(val => PREDEFINED_LANGUAGES.find(l => l.value === val)?.label || val).join(', ') || 'None'}
            </p>
          </CardContent>
        </Card>

        <Card className="w-full shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
              <Music2 className="h-6 w-6 text-primary" />
              2. Select Song Languages (for Display & Refinement)
            </CardTitle>
            <CardDescription>Choose languages for song suggestions display and refinement. English is default.</CardDescription>
          </CardHeader>
          <CardContent>
            <Popover open={isSongLanguagePopoverOpen} onOpenChange={setIsSongLanguagePopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {displayedSongLanguages}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[--radix-popover-trigger-width] p-0"
                side="bottom"
                align="start"
                sideOffset={8}
              >
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search song languages..."
                      className="w-full pl-8 pr-2 py-1 h-9 rounded-md border"
                      value={songLanguageSearchTerm}
                      onChange={(e) => setSongLanguageSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <ScrollArea className="h-60"> 
                  <div className="p-2 space-y-1"> 
                  {filteredSongLanguages.map(lang => (
                    <div key={`song-lang-${lang.value}`} className="flex items-center space-x-2 p-1 hover:bg-accent rounded-md"> 
                      <Checkbox
                        id={`song-lang-${lang.value}`}
                        checked={selectedSongLanguages.includes(lang.value)}
                        onCheckedChange={() => handleSongLanguageChange(lang.value)}
                      />
                      <Label htmlFor={`song-lang-${lang.value}`} className="font-normal cursor-pointer flex-1 text-sm">{lang.label}</Label> 
                    </div>
                  ))}
                  {filteredSongLanguages.length === 0 && (
                    <p className="p-2 text-sm text-muted-foreground text-center">No song languages found.</p>
                  )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
             <p className="mt-2 text-xs text-muted-foreground">
                Selected for songs: {selectedSongLanguages.map(val => PREDEFINED_LANGUAGES.find(l => l.value === val)?.label || val).join(', ') || 'None'}
            </p>
          </CardContent>
        </Card>


        <Card className="w-full shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
              <UploadCloud className="h-6 w-6 text-primary" />
              3. Upload Your Media
            </CardTitle>
            <CardDescription>Select 1-50 images, or a single video (up to 2GB). Suggestions will be generated for the languages chosen in Step 1.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              id="mediaUpload"
              type="file"
              accept="image/*,video/*"
              multiple 
              onChange={handleMediaUpload}
              disabled={selectedLanguages.length === 0 || selectedSongLanguages.length === 0}
              className="text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
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
              </div>
            )}
          </CardContent>
        </Card>

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
            />
           </Suspense>
        )}
        
        {isRefiningCaptions && !isRefiningSongs && !hasRefinedCaptions && ( 
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
                selectedLanguages={selectedSongLanguages} 
                PREDEFINED_LANGUAGES={PREDEFINED_LANGUAGES}
                SongSuggestionItemRenderer={SongSuggestionItemRenderer}
            />
          </Suspense>
        )}

        {isRefiningSongs && isRefiningCaptions && !hasRefinedSongs && ( 
           <Card className="w-full shadow-lg rounded-xl">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground">Refining captions &amp; then songs...</p>
            </CardContent>
          </Card>
        )}
        {isRefiningSongs && !isRefiningCaptions && !hasRefinedSongs && ( 
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
