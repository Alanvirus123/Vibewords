
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
  { value: "Portuguese", label: "Português (Portuguese)" },
  { value: "Russian", label: "Русский (Russian)" },
  { value: "Arabic", label: "العربية (Arabic)" },
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
      if (newSelection.length === 0) { // Ensure at least one language is selected
        toast({ variant: "destructive", title: "Selection Error", description: "At least one language must be selected." });
        return prev; // or return ["English"] to enforce a default
      }
      return newSelection;
    });
  };

  const handleMediaUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (selectedLanguages.length === 0) {
        toast({ variant: "destructive", title: "Language Missing", description: "Please select at least one language before uploading media." });
        event.target.value = ''; // Clear the file input
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
      
      setSuggestedCaptions(result.captions && Object.keys(result.captions).length > 0 ? result.captions : null);
      setSuggestedSongs(result.songSuggestions && Object.keys(result.songSuggestions).length > 0 ? result.songSuggestions : null);
      
      const hasCaptions = result.captions && Object.values(result.captions).some(arr => arr.length > 0);
      const hasSongs = result.songSuggestions && Object.values(result.songSuggestions).some(arr => arr.length > 0);

      if (!hasCaptions && !hasSongs) {
        toast({ title: "No suggestions generated", description: `The AI could not suggest captions or songs for this ${currentMediaType} in the selected languages.` });
      } else if (!hasCaptions) {
        toast({ title: "No captions suggested", description: `The AI could not suggest captions for this ${currentMediaType}, but songs were suggested.` });
      } else if (!hasSongs) {
         toast({ title: "No songs suggested", description: `The AI could not suggest songs for this ${currentMediaType}, but captions were suggested.` });
      }

    } catch (error) {
      console.error("Error suggesting captions/songs:", error);
      toast({ variant: "destructive", title: "Error", description: `Failed to suggest captions or songs for this ${currentMediaType}.` });
    } finally {
      setIsSuggesting(false);
    }
  };

  const getMediaDescriptionForRefinement = useCallback(() => {
    if (refinedCaptions && refinedCaptions["English"] && refinedCaptions["English"].length > 0) {
      return refinedCaptions["English"].join(" ");
    }
    if (suggestedCaptions && suggestedCaptions["English"] && suggestedCaptions["English"].length > 0) {
      return suggestedCaptions["English"].join(" ");
    }
    return `The uploaded ${mediaType || "media"}.`;
  }, [suggestedCaptions, refinedCaptions, mediaType]);


  const handleRefineCaptions = async () => {
    if (!mediaFile || !suggestedCaptions || Object.keys(suggestedCaptions).length === 0 || !captionFeedback || !mediaType || selectedLanguages.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Missing media, initial captions, media type, feedback, or selected languages for caption refinement." });
      return;
    }
    setIsRefiningCaptions(true);
    setRefinedCaptions(null); 

    const mediaDesc = getMediaDescriptionForRefinement();
    let refinedCaptionTextForSongRefinement = "";

    try {
      const captionInput: RefineMediaCaptionsInput = {
        mediaDescription: mediaDesc,
        initialCaptions: suggestedCaptions,
        userFeedback: captionFeedback,
        mediaType: mediaType,
        targetLanguages: selectedLanguages,
      };
      const captionResult: RefineMediaCaptionsOutput = await refineMediaCaptions(captionInput);

      if (captionResult.refinedCaptions && Object.keys(captionResult.refinedCaptions).length > 0 && Object.values(captionResult.refinedCaptions).some(arr => arr.length > 0)) {
        setRefinedCaptions(captionResult.refinedCaptions);
        refinedCaptionTextForSongRefinement = captionResult.refinedCaptions["English"]?.join(" ") || mediaDesc;
        toast({ title: "Captions Refined!", description: "New captions generated. Attempting to refine songs as well..." });

        if (suggestedSongs && Object.keys(suggestedSongs).length > 0 && mediaType && selectedLanguages.length > 0) {
          setIsRefiningSongs(true);
          setRefinedSongSuggestions(null); 
          try {
            const songInput: RefineSongSuggestionsInput = {
              mediaDescription: refinedCaptionTextForSongRefinement,
              initialSongSuggestions: suggestedSongs,
              userFeedback: songFeedback || "Make them match the vibe of the refined captions.", // Provide default feedback if song feedback is empty
              mediaType: mediaType,
              targetLanguages: selectedLanguages,
            };
            const songResult: RefineSongSuggestionsOutput = await refineSongSuggestions(songInput);
            setRefinedSongSuggestions(songResult.refinedSongSuggestions && Object.keys(songResult.refinedSongSuggestions).length > 0 ? songResult.refinedSongSuggestions : null);
            
            const refinedSongsExist = songResult.refinedSongSuggestions && Object.values(songResult.refinedSongSuggestions).some(arr => arr.length > 0);
            if (!refinedSongsExist) {
              toast({ title: "No songs automatically refined", description: "The AI could not refine song suggestions based on the new captions and song feedback." });
            } else {
              toast({ title: "Song Suggestions Also Refined!", description: "New song suggestions generated using refined captions and your song feedback." });
            }
          } catch (songError) {
            console.error("Error auto-refining song suggestions:", songError);
            toast({ variant: "destructive", title: "Song Refinement Error", description: "Failed to automatically refine song suggestions." });
          } finally {
            setIsRefiningSongs(false);
          }
        }
      } else {
        toast({ title: "No captions refined", description: "The AI could not refine captions based on your feedback." });
      }
    } catch (error) {
      console.error("Error refining captions:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to refine captions." });
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
    try {
      const mediaDesc = getMediaDescriptionForRefinement();
      const input: RefineSongSuggestionsInput = {
        mediaDescription: mediaDesc,
        initialSongSuggestions: suggestedSongs,
        userFeedback: songFeedback,
        mediaType: mediaType,
        targetLanguages: selectedLanguages,
      };
      const result: RefineSongSuggestionsOutput = await refineSongSuggestions(input);
      setRefinedSongSuggestions(result.refinedSongSuggestions && Object.keys(result.refinedSongSuggestions).length > 0 ? result.refinedSongSuggestions : null);
      const refinedExist = result.refinedSongSuggestions && Object.values(result.refinedSongSuggestions).some(arr => arr.length > 0);
      if (!refinedExist) {
        toast({ title: "No songs refined", description: "The AI could not refine song suggestions based on your feedback." });
      } else {
        toast({ title: "Song Suggestions Refined!", description: "New song suggestions generated based on your feedback." });
      }
    } catch (error) {
      console.error("Error refining song suggestions:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to refine song suggestions." });
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
        <p className="text-xs text-muted-foreground font-semibold">{language}</p>
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
        <p className="text-xs text-muted-foreground">{language}</p>
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

  const getCardNumber = (base: number) => {
    let currentNumber = base;
    if (hasRefinedCaptions) currentNumber++;
    if (hasSuggestedSongs) currentNumber++;
    if (hasRefinedSongs && base > 2) currentNumber++; // a bit hacky, adjust if more cards before refined songs
    return currentNumber;
  };
  
  const displayedLanguages = useMemo(() => {
    if (selectedLanguages.length > 3) {
      return `${selectedLanguages.slice(0, 3).join(', ')} + ${selectedLanguages.length - 3} more`;
    }
    return selectedLanguages.join(', ');
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
                Selected: {selectedLanguages.length > 0 ? selectedLanguages.join(', ') : 'None'}
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
              {suggestedCaptions && Object.entries(suggestedCaptions).map(([language, captions]) => (
                captions && captions.length > 0 && (
                  <div key={language} className="space-y-2">
                    <h4 className="font-semibold text-md text-foreground">{language}</h4>
                    {captions.map((caption, index) => caption && (
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
                Refine Captions {isRefiningSongs && "& Songs..."}
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {isRefiningCaptions && !isRefiningSongs && ( 
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
                {getCardNumber(3)}. Refined Captions
              </CardTitle>
              <CardDescription>Refined captions based on your feedback.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {refinedCaptions && Object.entries(refinedCaptions).map(([language, captions]) => (
                captions && captions.length > 0 && (
                  <div key={language} className="space-y-2">
                    <h4 className="font-semibold text-md text-foreground">{language}</h4>
                    {captions.map((caption, index) => caption && (
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
                {hasRefinedCaptions ? '4' : '4'}. AI-Suggested Songs 
              </CardTitle>
              <CardDescription>Song titles for your {mediaType}. Copy or refine them!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               {suggestedSongs && Object.entries(suggestedSongs).map(([language, songs]) => (
                songs && songs.length > 0 && (
                  <div key={language} className="space-y-2">
                    <h4 className="font-semibold text-md text-foreground">{language}</h4>
                    {songs.map((title, index) => title && (
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
                {isRefiningSongs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refine Songs
              </Button>
            </CardFooter>
          </Card>
        )}

        {isRefiningSongs && !isRefiningCaptions && (  // Show this only if songs are being refined independently or after captions
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
                 {getCardNumber(4)}. Refined Song Suggestions
              </CardTitle>
              <CardDescription>Refined song suggestions based on your feedback.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {refinedSongSuggestions && Object.entries(refinedSongSuggestions).map(([language, songs]) => (
                songs && songs.length > 0 && (
                  <div key={language} className="space-y-2">
                    <h4 className="font-semibold text-md text-foreground">{language}</h4>
                    {songs.map((title, index) => title && (
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


// Label component (already defined, but ensure it's available or imported from ui/label if separate)
const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement> & {htmlFor?: string}> = ({ children, ...props }) => (
  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" {...props}>
    {children}
  </label>
);

// SparklesIcon (already defined)
const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2L9.17 8.17L2 10l6.17 4.83L6.83 22L12 17.33L17.17 22l-1.5-7.17L22 10l-7.17-1.17L12 2z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

