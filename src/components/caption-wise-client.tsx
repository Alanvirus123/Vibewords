
"use client";

import { useState, type ChangeEvent, useCallback, useMemo } from "react";
import Image from "next/image";
import { UploadCloud, Copy, Wand2, RefreshCw, Loader2, Film, Music2, SparklesIcon as SparklesLucideIcon, LanguagesIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { suggestMediaCaptions, type SuggestMediaCaptionsInput, type SuggestMediaCaptionsOutput } from "@/ai/flows/suggest-media-captions";
import { refineMediaCaptions, type RefineMediaCaptionsInput, type RefineMediaCaptionsOutput } from "@/ai/flows/refine-media-captions";
import { refineSongSuggestions, type RefineSongSuggestionsInput, type RefineSongSuggestionsOutput } from "@/ai/flows/refine-song-suggestions";
import { ThemeToggle } from "@/components/theme-toggle";

const PREDEFINED_LANGUAGES = [
  { value: "English", label: "English" },
  { value: "Spanish", label: "Español (Spanish)" },
  { value: "French", label: "Français (French)" },
  { value: "German", label: "Deutsch (German)" },
  { value: "Hindi", label: "हिन्दी (Hindi)" },
  { value: "Bengali", label: "বাংলা (Bengali)" },
  { value: "Japanese", label: "日本語 (Japanese)" },
  { value: "Korean", label: "한국어 (Korean)" },
  { value: "Chinese_Simplified", label: "中文 (简体) (Chinese Simplified)" },
  { value: "Chinese_Traditional", label: "中文 (繁體) (Chinese Traditional)" },
  { value: "Portuguese", label: "Português (Portuguese)" },
  { value: "Russian", label: "Русский (Russian)" },
  { value: "Arabic", label: "العربية (Arabic)" },
  { value: "Italian", label: "Italiano (Italian)" },
  { value: "Dutch", label: "Nederlands (Dutch)" },
  { value: "Turkish", label: "Türkçe (Turkish)" },
  { value: "Vietnamese", label: "Tiếng Việt (Vietnamese)" },
  { value: "Thai", label: "ไทย (Thai)" },
  { value: "Polish", label: "Polski (Polish)" },
  { value: "Indonesian", label: "Bahasa Indonesia (Indonesian)" },
  { value: "Swedish", label: "Svenska (Swedish)" },
  { value: "Filipino", label: "Filipino" },
  { value: "Malay", label: "Bahasa Melayu (Malay)" },
  { value: "Swahili", label: "Kiswahili (Swahili)" },
  { value: "Hebrew", label: "עברית (Hebrew)" },
  { value: "Greek", label: "Ελληνικά (Greek)" },
  { value: "Czech", label: "Čeština (Czech)" },
  { value: "Danish", label: "Dansk (Danish)" },
  { value: "Finnish", label: "Suomi (Finnish)" },
  { value: "Hungarian", label: "Magyar (Hungarian)" },
  { value: "Norwegian", label: "Norsk (Norwegian)" },
  { value: "Romanian", label: "Română (Romanian)" },
  { value: "Slovak", label: "Slovenčina (Slovak)" },
  { value: "Ukrainian", label: "Українська (Ukrainian)" },
];

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

type MediaSuggestions = Record<string, string[]>;


export default function CaptionWiseClient() {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaSrc, setMediaSrc] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English"]);
  const [isLanguagePopoverOpen, setIsLanguagePopoverOpen] = useState(false);

  const [suggestedCaptions, setSuggestedCaptions] = useState<MediaSuggestions | null>(null);
  const [refinedCaptions, setRefinedCaptions] = useState<MediaSuggestions | null>(null);
  const [captionFeedback, setCaptionFeedback] = useState<string>("");

  const [suggestedSongs, setSuggestedSongs] = useState<MediaSuggestions | null>(null);
  const [refinedSongSuggestions, setRefinedSongSuggestions] = useState<MediaSuggestions | null>(null);
  const [songFeedback, setSongFeedback] = useState<string>("");

  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [isRefiningCaptions, setIsRefiningCaptions] = useState<boolean>(false);
  const [isRefiningSongs, setIsRefiningSongs] = useState<boolean>(false);

  const { toast } = useToast();

  const resetSuggestions = () => {
    setSuggestedCaptions(null);
    setRefinedCaptions(null);
    setCaptionFeedback("");
    setSuggestedSongs(null);
    setRefinedSongSuggestions(null);
    setSongFeedback("");
  };

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

  const handleMediaUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (selectedLanguages.length === 0) {
        toast({ variant: "destructive", title: "Language Missing", description: "Please select at least one language before uploading media." });
        event.target.value = ''; 
        return;
      }
      resetSuggestions();
      setMediaFile(file);

      const currentMediaType = file.type.startsWith('video/') ? 'video' : 'image';
      setMediaType(currentMediaType);

      const dataUri = await fileToDataUri(file);
      setMediaSrc(dataUri);
      await handleSuggestCaptionsAndSongs(dataUri, currentMediaType);
    }
  };

  const handleSuggestCaptionsAndSongs = async (dataUri: string, currentMediaType: "image" | "video") => {
    if (selectedLanguages.length === 0) {
      toast({ variant: "destructive", title: "Language Missing", description: "Please select languages for suggestions." });
      return;
    }
    setIsSuggesting(true);
    try {
      const input: SuggestMediaCaptionsInput = { mediaDataUri: dataUri, mediaType: currentMediaType, targetLanguages: selectedLanguages };
      const result: SuggestMediaCaptionsOutput = await suggestMediaCaptions(input);
      
      const newSuggestedCaptions: MediaSuggestions = {};
      const newSuggestedSongs: MediaSuggestions = {};
      let hasAnyCaptions = false;
      let hasAnySongs = false;

      result.languageEntries?.forEach(entry => {
        if (entry.captions && entry.captions.length > 0) {
          newSuggestedCaptions[entry.language] = entry.captions;
          hasAnyCaptions = true;
        }
        if (entry.songSuggestions && entry.songSuggestions.length > 0) {
          newSuggestedSongs[entry.language] = entry.songSuggestions;
          hasAnySongs = true;
        }
      });

      setSuggestedCaptions(hasAnyCaptions ? newSuggestedCaptions : null);
      setSuggestedSongs(hasAnySongs ? newSuggestedSongs : null);
      
      if (!hasAnyCaptions && !hasAnySongs) {
        toast({ title: "No suggestions generated", description: `The AI could not suggest captions or songs for this ${currentMediaType} in the selected languages.` });
      } else if (!hasAnyCaptions) {
        toast({ title: "No captions suggested", description: `The AI could not suggest captions for this ${currentMediaType}, but songs were suggested.` });
      } else if (!hasAnySongs) {
         toast({ title: "No songs suggested", description: `The AI could not suggest songs for this ${currentMediaType}, but captions were suggested.` });
      }

    } catch (error) {
      console.error("Error suggesting captions/songs:", error);
      toast({ variant: "destructive", title: "Error", description: `Failed to suggest captions or songs for this ${currentMediaType}. Check console for details.` });
    } finally {
      setIsSuggesting(false);
    }
  };

  const getMediaDescriptionForRefinement = useCallback(() => {
    let baseDescription = `The uploaded ${mediaType || "media"}. Analyze its content for theme and mood.`;
    
    const englishRefined = refinedCaptions && refinedCaptions["English"] && refinedCaptions["English"].length > 0;
    if (englishRefined) {
        return refinedCaptions!["English"].join(" ");
    }

    const englishSuggested = suggestedCaptions && suggestedCaptions["English"] && suggestedCaptions["English"].length > 0;
    if (englishSuggested) {
        return suggestedCaptions!["English"].join(" ");
    }
    
    // Fallback if English isn't selected or has no captions, try to use any available language's captions.
    if (selectedLanguages.length > 0) {
        const firstSelectedLanguageWithRefinedCaptions = selectedLanguages.find(lang => refinedCaptions?.[lang]?.length);
        if (firstSelectedLanguageWithRefinedCaptions) {
            return refinedCaptions![firstSelectedLanguageWithRefinedCaptions].join(" ");
        }
        const firstSelectedLanguageWithSuggestedCaptions = selectedLanguages.find(lang => suggestedCaptions?.[lang]?.length);
        if (firstSelectedLanguageWithSuggestedCaptions) {
            return suggestedCaptions![firstSelectedLanguageWithSuggestedCaptions].join(" ");
        }
    }
    return baseDescription;
  }, [suggestedCaptions, refinedCaptions, mediaType, selectedLanguages]);


  const handleRefineCaptions = async () => {
    if (!mediaFile || !suggestedCaptions || Object.keys(suggestedCaptions).length === 0 || !captionFeedback || !mediaType || selectedLanguages.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Missing media, initial captions, media type, feedback, or selected languages for caption refinement." });
      return;
    }
    setIsRefiningCaptions(true);
    setRefinedCaptions(null); 

    const mediaDesc = getMediaDescriptionForRefinement();
    let refinedCaptionTextForSongRefinement = mediaDesc; // Initialize with current best description

    const initialCaptionEntriesForRefinement = selectedLanguages
      .map(lang => ({
        language: lang,
        // Ensure suggestedCaptions[lang] is an array of 4 for the schema, even if empty strings initially if not found
        captions: suggestedCaptions?.[lang] || Array(4).fill("").map((_,i) => `Placeholder caption ${i+1} for ${lang} if none initially suggested`) 
      }))
      .filter(entry => entry.captions.length > 0); // The filter might be redundant if we always provide placeholders but good for safety

    if (initialCaptionEntriesForRefinement.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "No initial captions found for selected languages to refine." });
      setIsRefiningCaptions(false);
      return;
    }

    try {
      const captionInput: RefineMediaCaptionsInput = {
        mediaDescription: mediaDesc,
        initialCaptionEntries: initialCaptionEntriesForRefinement,
        userFeedback: captionFeedback,
        mediaType: mediaType,
        targetLanguages: selectedLanguages,
      };
      const captionResult: RefineMediaCaptionsOutput = await refineMediaCaptions(captionInput);

      const newRefinedCaptions: MediaSuggestions = {};
      let hasAnyRefinedCaptions = false;
      captionResult.refinedLanguageEntries?.forEach(entry => {
        if (entry.refinedCaptions && entry.refinedCaptions.length > 0) {
          newRefinedCaptions[entry.language] = entry.refinedCaptions;
          hasAnyRefinedCaptions = true;
        }
      });

      if (hasAnyRefinedCaptions) {
        setRefinedCaptions(newRefinedCaptions);
        refinedCaptionTextForSongRefinement = newRefinedCaptions["English"]?.join(" ") || getMediaDescriptionForRefinement(); // Update description with new refined English captions if available
        toast({ title: "Captions Refined!", description: "New captions generated. Attempting to refine songs as well..." });

        if (suggestedSongs && Object.keys(suggestedSongs).length > 0 && mediaType && selectedLanguages.length > 0) {
          setIsRefiningSongs(true);
          setRefinedSongSuggestions(null); 
          
          const initialSongEntriesForRefinement = selectedLanguages
            .map(lang => ({
              language: lang,
              songSuggestions: suggestedSongs?.[lang] || ["Placeholder song if none suggested"]
            }))
            .filter(entry => entry.songSuggestions.length > 0);

          if (initialSongEntriesForRefinement.length === 0) {
             toast({ title: "Song Refinement Skipped", description: "No initial song suggestions found for selected languages to refine." });
             setIsRefiningSongs(false);
          } else {
            try {
              const songInput: RefineSongSuggestionsInput = {
                mediaDescription: refinedCaptionTextForSongRefinement, // Use updated description
                initialSongEntries: initialSongEntriesForRefinement,
                userFeedback: songFeedback || "Make them match the vibe of the refined captions.", 
                mediaType: mediaType,
                targetLanguages: selectedLanguages,
              };
              const songResult: RefineSongSuggestionsOutput = await refineSongSuggestions(songInput);
              
              const newRefinedSongs: MediaSuggestions = {};
              let hasAnyRefinedSongs = false;
              songResult.refinedLanguageSongEntries?.forEach(entry => {
                if (entry.refinedSongSuggestions && entry.refinedSongSuggestions.length > 0) {
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
            } catch (songError) {
              console.error("Error auto-refining song suggestions:", songError);
              toast({ variant: "destructive", title: "Song Refinement Error", description: "Failed to automatically refine song suggestions. Check console." });
            } finally {
              setIsRefiningSongs(false);
            }
          }
        }
      } else {
        toast({ title: "No captions refined", description: "The AI could not refine captions based on your feedback." });
      }
    } catch (error) {
      console.error("Error refining captions:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to refine captions. Check console." });
    } finally {
      setIsRefiningCaptions(false);
    }
  };

  const handleRefineSongs = async () => {
    if (!mediaFile || !suggestedSongs || Object.keys(suggestedSongs).length === 0 || !songFeedback || !mediaType || selectedLanguages.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Missing media, initial song suggestions, media type, feedback, or selected languages for song refinement." });
      return;
    }
    setIsRefiningSongs(true);
    setRefinedSongSuggestions(null);

    const initialSongEntriesForRefinement = selectedLanguages
        .map(lang => ({
          language: lang,
          songSuggestions: suggestedSongs?.[lang] || ["Placeholder song if none suggested"]
        }))
        .filter(entry => entry.songSuggestions.length > 0);

    if (initialSongEntriesForRefinement.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "No initial song suggestions found for selected languages to refine." });
      setIsRefiningSongs(false);
      return;
    }
    
    try {
      const mediaDesc = getMediaDescriptionForRefinement();
      const input: RefineSongSuggestionsInput = {
        mediaDescription: mediaDesc,
        initialSongEntries: initialSongEntriesForRefinement,
        userFeedback: songFeedback,
        mediaType: mediaType,
        targetLanguages: selectedLanguages,
      };
      const result: RefineSongSuggestionsOutput = await refineSongSuggestions(input);
      
      const newRefinedSongs: MediaSuggestions = {};
      let hasAnyRefinedSongs = false;
      result.refinedLanguageSongEntries?.forEach(entry => {
        if (entry.refinedSongSuggestions && entry.refinedSongSuggestions.length > 0) {
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
    } catch (error) {
      console.error("Error refining song suggestions:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to refine song suggestions. Check console." });
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
  const hasSuggestedSongs = useMemo(() => suggestedSongs && Object.keys(suggestedSongs).length > 0 && Object.values(suggestedSongs).some(arr => arr.length > 0), [suggestedSongs]);
  const hasRefinedSongs = useMemo(() => refinedSongSuggestions && Object.keys(refinedSongSuggestions).length > 0 && Object.values(refinedSongSuggestions).some(arr => arr.length > 0), [refinedSongSuggestions]);

  const getCardNumber = (base: number): string => {
    let currentNumber = base;
    // Logic for card numbering remains complex; this is a simplified placeholder
    if (hasSuggestedCaptions) currentNumber++;
    if (hasRefinedCaptions) currentNumber++;
    if (hasSuggestedSongs) currentNumber++;
    if (hasRefinedSongs) currentNumber++;
    
    // This needs to be more dynamic based on which cards are *actually* rendered.
    // For now, just returning base for simplicity after the sections.
    let dynamicBase = 2; // Start after Language and Upload
    if (hasSuggestedCaptions) dynamicBase++;
    if (isRefiningCaptions && !isRefiningSongs && !hasRefinedCaptions) dynamicBase++; // Loader for refining captions
    if (hasRefinedCaptions) dynamicBase++;
    if (hasSuggestedSongs) dynamicBase++;
    if (isRefiningSongs && !isRefiningCaptions && !hasRefinedSongs) dynamicBase++; // Loader for refining songs
    if (hasRefinedSongs) dynamicBase++;
    
    // A more robust approach would be to count visible cards above current one
    // The current implementation below is illustrative and may not be perfectly sequential in all cases.
    const elements = [
      mediaFile, // after upload
      isSuggesting, // suggestion loader
      hasSuggestedCaptions, // suggested captions card
      isRefiningCaptions && !isRefiningSongs && !hasRefinedCaptions, // refine captions loader
      hasRefinedCaptions, // refined captions card
      hasSuggestedSongs, // suggested songs card
      (isRefiningSongs && !isRefiningCaptions && !hasRefinedSongs) || (isRefiningCaptions && isRefiningSongs && !hasRefinedSongs), // refine songs loader
      hasRefinedSongs // refined songs card
    ];

    let visibleCardCount = 2; // Languages + Upload are always step 1 and 2 conceptually
    if(elements[0]) { // Media file uploaded
        if(elements[1]) { // Suggesting loader
             // no numbered card yet
        } else {
            if (elements[2]) visibleCardCount++; // Suggested captions
            if (elements[3]) {} // Refining captions loader - no number
            if (elements[4]) visibleCardCount++; // Refined captions
            if (elements[5]) visibleCardCount++; // Suggested songs
            if (elements[6]) {} // Refining songs loader - no number
            if (elements[7]) visibleCardCount++; // Refined songs
        }
    }
    // This is tricky, let's simplify the function's use or rethink numbering logic entirely for truly dynamic cards
    // For this iteration, let's simplify how getCardNumber is used or accept that numbers might skip if a section isn't rendered.
    // Given the function is called like getCardNumber(3) for the first results card, it implies a base number
    // Base = 3 for "AI-Suggested Captions"
    // Base = 4 for "Refined Captions" (if suggested are present) OR "AI-Suggested Songs" (if no refined captions but suggested songs)
    // This is getting too complex for this specific logic. The titles will be numbered based on their intended sequential flow.
    
    return currentNumber.toString(); // Fallback to original logic for now
  };
  
  const displayedLanguages = useMemo(() => {
    const labels = selectedLanguages.map(val => PREDEFINED_LANGUAGES.find(l => l.value === val)?.label || val);
    if (labels.length > 2) {
      return `${labels.slice(0, 2).join(', ')} + ${labels.length - 2} more`;
    }
    return labels.join(', ');
  }, [selectedLanguages]);


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
              1. Select Languages
            </CardTitle>
            <CardDescription>Choose the languages for your captions and song suggestions. English is selected by default.</CardDescription>
          </CardHeader>
          <CardContent>
            <Popover open={isLanguagePopoverOpen} onOpenChange={setIsLanguagePopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {displayedLanguages || "Select languages..."}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <ScrollArea className="h-72">
                  <div className="p-4 space-y-2">
                  {PREDEFINED_LANGUAGES.map(lang => (
                    <div key={lang.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lang-${lang.value}`}
                        checked={selectedLanguages.includes(lang.value)}
                        onCheckedChange={() => handleLanguageChange(lang.value)}
                      />
                      <Label htmlFor={`lang-${lang.value}`} className="font-normal cursor-pointer flex-1">{lang.label}</Label>
                    </div>
                  ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
             <p className="mt-2 text-xs text-muted-foreground">
                Selected: {selectedLanguages.map(val => PREDEFINED_LANGUAGES.find(l => l.value === val)?.label || val).join(', ') || 'None'}
            </p>
          </CardContent>
        </Card>

        <Card className="w-full shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
              <UploadCloud className="h-6 w-6 text-primary" />
              2. Upload Your Media
            </CardTitle>
            <CardDescription>Select an image or video. Suggestions will be generated for the languages chosen above.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              id="mediaUpload"
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaUpload}
              disabled={selectedLanguages.length === 0}
              className="text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {mediaSrc && (
              <div className="mt-6 border rounded-lg overflow-hidden shadow-md bg-muted/20">
                {mediaType === 'image' && (
                  <Image src={mediaSrc} alt="Uploaded image preview" width={600} height={400} className="w-full h-auto object-contain" data-ai-hint="uploaded image" />
                )}
                {mediaType === 'video' && (
                  <video src={mediaSrc} controls className="w-full h-auto max-h-[400px] object-contain rounded-lg" data-ai-hint="uploaded video">
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {isSuggesting && (
          <Card className="w-full shadow-lg rounded-xl">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground">Generating suggestions for your {mediaType || 'media'}...</p>
            </CardContent>
          </Card>
        )}

        {!isSuggesting && hasSuggestedCaptions && (
          <Card className="w-full shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                {mediaType === 'video' ? <Film className="h-6 w-6 text-primary" /> : <Wand2 className="h-6 w-6 text-primary" />}
                3. AI-Suggested Captions
              </CardTitle>
              <CardDescription>Here are captions for your {mediaType}. Copy or refine them (refining captions also refines songs).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {suggestedCaptions && selectedLanguages.map(language => (
                suggestedCaptions[language] && suggestedCaptions[language].length > 0 && (
                  <div key={language} className="space-y-2">
                    <h4 className="font-semibold text-md text-foreground">{PREDEFINED_LANGUAGES.find(l=>l.value === language)?.label || language}</h4>
                    {suggestedCaptions[language].map((caption, index) => caption && (
                      <CaptionDisplayCardRenderer key={`suggested-${language}-${index}`} caption={caption} language={language} />
                    ))}
                  </div>
                )
              ))}
            </CardContent>
            <CardFooter className="flex-col items-start gap-4 pt-6 border-t">
              <Label htmlFor="captionFeedback" className="font-semibold text-md">Refine Captions (for all selected languages):</Label>
              <Textarea
                id="captionFeedback"
                placeholder="Your feedback for captions (e.g., 'make it funnier', 'add hashtags')"
                value={captionFeedback}
                onChange={(e) => setCaptionFeedback(e.target.value)}
                className="min-h-[80px]"
              />
              <Button onClick={handleRefineCaptions} disabled={isRefiningCaptions || !captionFeedback || isRefiningSongs} className="w-full sm:w-auto">
                {isRefiningCaptions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refine Captions {isRefiningSongs && !isRefiningCaptions && "& Songs..."}
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {isRefiningCaptions && !isRefiningSongs && !hasRefinedCaptions && ( // Show loader if refining captions but not yet songs, and no refined captions yet to show
           <Card className="w-full shadow-lg rounded-xl">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground">Refining captions...</p>
            </CardContent>
          </Card>
        )}
        
        {hasRefinedCaptions && ( 
          <Card className="w-full shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                <SparklesLucideIcon className="h-6 w-6 text-primary" />
                4. Refined Captions
              </CardTitle>
              <CardDescription>Refined captions based on your feedback.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {refinedCaptions && selectedLanguages.map(language => (
                refinedCaptions[language] && refinedCaptions[language].length > 0 && (
                  <div key={`refined-${language}-section`} className="space-y-2">
                    <h4 className="font-semibold text-md text-foreground">{PREDEFINED_LANGUAGES.find(l=>l.value === language)?.label || language}</h4>
                    {refinedCaptions[language].map((caption, index) => caption && (
                      <CaptionDisplayCardRenderer key={`refined-${language}-${index}`} caption={caption} language={language} />
                    ))}
                  </div>
                )
              ))}
            </CardContent>
          </Card>
        )}

        {!isSuggesting && hasSuggestedSongs && (
          <Card className="w-full shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                <Music2 className="h-6 w-6 text-primary" />
                 {hasSuggestedCaptions ? (hasRefinedCaptions ? 5 : 4) : 3}. AI-Suggested Songs 
              </CardTitle>
              <CardDescription>Song titles for your {mediaType}. Copy or refine them!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               {suggestedSongs && selectedLanguages.map(language => (
                 suggestedSongs[language] && suggestedSongs[language].length > 0 && (
                  <div key={`suggested-song-${language}-section`} className="space-y-2">
                    <h4 className="font-semibold text-md text-foreground">{PREDEFINED_LANGUAGES.find(l=>l.value === language)?.label || language}</h4>
                    {suggestedSongs[language].map((title, index) => title && (
                      <SongSuggestionItemRenderer key={`song-${language}-${index}`} title={title} language={language} />
                    ))}
                  </div>
                )
              ))}
            </CardContent>
            <CardFooter className="flex-col items-start gap-4 pt-6 border-t">
              <Label htmlFor="songFeedback" className="font-semibold text-md">Refine Song Suggestions (for all selected languages):</Label>
              <Textarea
                id="songFeedback"
                placeholder="Your feedback for songs (e.g., 'more upbeat songs', 'instrumental only')"
                value={songFeedback}
                onChange={(e) => setSongFeedback(e.target.value)}
                className="min-h-[80px]"
              />
              <Button onClick={handleRefineSongs} disabled={isRefiningSongs || !songFeedback || isRefiningCaptions} className="w-full sm:w-auto">
                {isRefiningSongs && !isRefiningCaptions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refine Songs
              </Button>
            </CardFooter>
          </Card>
        )}

        {isRefiningSongs && isRefiningCaptions && !hasRefinedSongs && ( // Loading state when both are refining (chained from caption refinement)
           <Card className="w-full shadow-lg rounded-xl">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground">Refining captions & then songs...</p>
            </CardContent>
          </Card>
        )}
        {isRefiningSongs && !isRefiningCaptions && !hasRefinedSongs && (  // Loading state for standalone song refinement
           <Card className="w-full shadow-lg rounded-xl">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground">Refining song suggestions...</p>
            </CardContent>
          </Card>
        )}


        {hasRefinedSongs && ( 
          <Card className="w-full shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                 <SparklesLucideIcon className="h-6 w-6 text-primary" />
                 {hasSuggestedCaptions ? (hasRefinedCaptions ? (hasSuggestedSongs ? 6 : 5) : (hasSuggestedSongs ? 5: 4)) : (hasSuggestedSongs ? 4 : 3) }. Refined Song Suggestions
              </CardTitle>
              <CardDescription>Refined song suggestions based on your feedback.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {refinedSongSuggestions && selectedLanguages.map(language => (
                refinedSongSuggestions[language] && refinedSongSuggestions[language].length > 0 && (
                  <div key={`refined-song-${language}-section`} className="space-y-2">
                    <h4 className="font-semibold text-md text-foreground">{PREDEFINED_LANGUAGES.find(l=>l.value === language)?.label || language}</h4>
                    {refinedSongSuggestions[language].map((title, index) => title && (
                      <SongSuggestionItemRenderer key={`refined-song-${language}-${index}`} title={title} language={language} />
                    ))}
                  </div>
                )
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}


// Label component 
const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement> & {htmlFor?: string}> = ({ children, ...props }) => (
  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" {...props}>
    {children}
  </label>
);
