
"use client";

import { useState, type ChangeEvent, useCallback } from "react";
import Image from "next/image";
import { UploadCloud, Copy, Wand2, RefreshCw, Loader2, Film, Music2, SparklesIcon as SparklesLucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { suggestMediaCaptions, type SuggestMediaCaptionsInput, type SuggestMediaCaptionsOutput } from "@/ai/flows/suggest-media-captions";
import { refineMediaCaptions, type RefineMediaCaptionsInput, type RefineMediaCaptionsOutput } from "@/ai/flows/refine-media-captions";
import { refineSongSuggestions, type RefineSongSuggestionsInput, type RefineSongSuggestionsOutput } from "@/ai/flows/refine-song-suggestions";
import { ThemeToggle } from "@/components/theme-toggle";

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

interface MultiLanguageCaptions {
  english: string[];
  hindi: string[];
  bengali: string[];
}

interface SongSuggestions {
  english: string[];
  hindi: string[];
  bengali: string[];
}

export default function CaptionWiseClient() {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaSrc, setMediaSrc] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  
  const [suggestedCaptions, setSuggestedCaptions] = useState<MultiLanguageCaptions | null>(null);
  const [refinedCaptions, setRefinedCaptions] = useState<MultiLanguageCaptions | null>(null);
  const [captionFeedback, setCaptionFeedback] = useState<string>("");

  const [suggestedSongs, setSuggestedSongs] = useState<SongSuggestions | null>(null);
  const [refinedSongSuggestions, setRefinedSongSuggestions] = useState<SongSuggestions | null>(null);
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

  const handleMediaUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
    setIsSuggesting(true);
    try {
      const input: SuggestMediaCaptionsInput = { mediaDataUri: dataUri, mediaType: currentMediaType };
      const result: SuggestMediaCaptionsOutput = await suggestMediaCaptions(input);
      setSuggestedCaptions(result.captions || null);
      setSuggestedSongs(result.songSuggestions || null);
      
      const hasCaptions = result.captions && 
                          (result.captions.english?.length > 0 || 
                           result.captions.hindi?.length > 0 || 
                           result.captions.bengali?.length > 0);
      const hasSongs = result.songSuggestions && 
                       (result.songSuggestions.english?.length > 0 || 
                        result.songSuggestions.hindi?.length > 0 || 
                        result.songSuggestions.bengali?.length > 0);

      if (!hasCaptions && !hasSongs) {
        toast({ title: "No suggestions generated", description: `The AI could not suggest captions or songs for this ${currentMediaType}.` });
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

  const handleRefineCaptions = async () => {
    if (!mediaFile || !suggestedCaptions || !captionFeedback || !mediaType) {
      toast({ variant: "destructive", title: "Error", description: "Missing media, initial captions, media type, or feedback for caption refinement." });
      return;
    }
    setIsRefiningCaptions(true);
    setRefinedCaptions(null); // Clear previous refined captions

    let refinedCaptionTextForSongRefinement = "";

    try {
      const captionInput: RefineMediaCaptionsInput = {
        mediaDescription: suggestedCaptions?.english?.join(" ") || "The uploaded media.",
        initialCaptions: suggestedCaptions,
        userFeedback: captionFeedback,
        mediaType: mediaType,
      };
      const captionResult: RefineMediaCaptionsOutput = await refineMediaCaptions(captionInput);

      if (captionResult.refinedCaptions && (captionResult.refinedCaptions.english?.length > 0 || captionResult.refinedCaptions.hindi?.length > 0 || captionResult.refinedCaptions.bengali?.length > 0)) {
        setRefinedCaptions(captionResult.refinedCaptions);
        refinedCaptionTextForSongRefinement = captionResult.refinedCaptions.english?.join(" ") || "";
        toast({ title: "Captions Refined!", description: "New captions generated. Attempting to refine songs as well..." });

        if (suggestedSongs && mediaType) {
          setIsRefiningSongs(true);
          setRefinedSongSuggestions(null); 
          try {
            const songInput: RefineSongSuggestionsInput = {
              mediaDescription: refinedCaptionTextForSongRefinement || "The uploaded media with refined captions.",
              initialSongSuggestions: suggestedSongs,
              userFeedback: songFeedback, 
              mediaType: mediaType,
            };
            const songResult: RefineSongSuggestionsOutput = await refineSongSuggestions(songInput);
            setRefinedSongSuggestions(songResult.refinedSongSuggestions || null);
            const refinedSongsExist = songResult.refinedSongSuggestions && 
                                      (songResult.refinedSongSuggestions.english?.length > 0 || 
                                       songResult.refinedSongSuggestions.hindi?.length > 0 || 
                                       songResult.refinedSongSuggestions.bengali?.length > 0);
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
    if (!mediaFile || !suggestedSongs || !songFeedback || !mediaType) {
      toast({ variant: "destructive", title: "Error", description: "Missing media, initial song suggestions, media type, or feedback for song refinement." });
      return;
    }
    setIsRefiningSongs(true);
    setRefinedSongSuggestions(null);
    try {
      const mediaDescription = refinedCaptions?.english?.join(" ") || suggestedCaptions?.english?.join(" ") || "The uploaded media.";
      const input: RefineSongSuggestionsInput = {
        mediaDescription,
        initialSongSuggestions: suggestedSongs,
        userFeedback: songFeedback,
        mediaType: mediaType,
      };
      const result: RefineSongSuggestionsOutput = await refineSongSuggestions(input);
      setRefinedSongSuggestions(result.refinedSongSuggestions || null);
      const refinedExist = result.refinedSongSuggestions && (result.refinedSongSuggestions.english?.length > 0 || result.refinedSongSuggestions.hindi?.length > 0 || result.refinedSongSuggestions.bengali?.length > 0)
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

  const CaptionDisplayCard: React.FC<{ caption: string; language: string }> = ({ caption, language }) => (
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

  const SongSuggestionItem: React.FC<{ title: string; language: string }> = ({ title, language }) => (
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

  const hasSuggestedCaptions = suggestedCaptions && (suggestedCaptions.english?.length > 0 || suggestedCaptions.hindi?.length > 0 || suggestedCaptions.bengali?.length > 0);
  const hasRefinedCaptions = refinedCaptions && (refinedCaptions.english?.length > 0 || refinedCaptions.hindi?.length > 0 || refinedCaptions.bengali?.length > 0);
  const hasSuggestedSongs = suggestedSongs && (suggestedSongs.english.length > 0 || suggestedSongs.hindi.length > 0 || suggestedSongs.bengali.length > 0);
  const hasRefinedSongs = refinedSongSuggestions && (refinedSongSuggestions.english.length > 0 || refinedSongSuggestions.hindi.length > 0 || refinedSongSuggestions.bengali.length > 0);


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
              <UploadCloud className="h-6 w-6 text-primary" />
              1. Upload Your Media
            </CardTitle>
            <CardDescription>Select an image or video from your device to get caption and song suggestions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              id="mediaUpload"
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaUpload}
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
                2. AI-Suggested Captions
              </CardTitle>
              <CardDescription>Here are some captions suggested for your {mediaType}. Copy your favorite or refine them (refining captions will also refine songs based on the new captions and your song feedback).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestedCaptions?.english?.map((caption, index) => caption && (
                <CaptionDisplayCard key={`suggested-en-${index}`} caption={caption} language="English" />
              ))}
              {suggestedCaptions?.hindi?.map((caption, index) => caption && (
                <CaptionDisplayCard key={`suggested-hi-${index}`} caption={caption} language="Hindi" />
              ))}
              {suggestedCaptions?.bengali?.map((caption, index) => caption && (
                <CaptionDisplayCard key={`suggested-bn-${index}`} caption={caption} language="Bengali" />
              ))}
            </CardContent>
            <CardFooter className="flex-col items-start gap-4 pt-6 border-t">
              <Label htmlFor="captionFeedback" className="font-semibold text-md">Refine Captions:</Label>
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
                <SparklesIcon className="h-6 w-6 text-primary" />
                3. Refined Captions
              </CardTitle>
              <CardDescription>Here are the captions refined based on your feedback.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {refinedCaptions?.english?.map((caption, index) => caption && (
                <CaptionDisplayCard key={`refined-en-${index}`} caption={caption} language="English" />
              ))}
              {refinedCaptions?.hindi?.map((caption, index) => caption && (
                <CaptionDisplayCard key={`refined-hi-${index}`} caption={caption} language="Hindi" />
              ))}
              {refinedCaptions?.bengali?.map((caption, index) => caption && (
                <CaptionDisplayCard key={`refined-bn-${index}`} caption={caption} language="Bengali" />
              ))}
            </CardContent>
          </Card>
        )}

        {!isSuggesting && hasSuggestedSongs && (
          <Card className="w-full shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                <Music2 className="h-6 w-6 text-primary" />
                {hasRefinedCaptions ? '4' : '3'}. AI-Suggested Songs
              </CardTitle>
              <CardDescription>Here are some song titles suggested for your {mediaType}. Copy or refine them!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestedSongs?.english?.map((title, index) => title && (
                <SongSuggestionItem key={`song-en-${index}`} title={title} language="English" />
              ))}
              {suggestedSongs?.hindi?.map((title, index) => title && (
                <SongSuggestionItem key={`song-hi-${index}`} title={title} language="Hindi" />
              ))}
              {suggestedSongs?.bengali?.map((title, index) => title && (
                <SongSuggestionItem key={`song-bn-${index}`} title={title} language="Bengali" />
              ))}
            </CardContent>
            <CardFooter className="flex-col items-start gap-4 pt-6 border-t">
              <Label htmlFor="songFeedback" className="font-semibold text-md">Refine Song Suggestions:</Label>
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

        {isRefiningSongs && ( 
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
                 <SparklesIcon className="h-6 w-6 text-primary" />
                {(hasRefinedCaptions && hasSuggestedSongs) ? '5' : ((hasRefinedCaptions || hasSuggestedSongs) ? '4' : '3')}. Refined Song Suggestions
              </CardTitle>
              <CardDescription>Here are the song suggestions refined based on your feedback.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {refinedSongSuggestions?.english?.map((title, index) => title && (
                <SongSuggestionItem key={`refined-song-en-${index}`} title={title} language="English" />
              ))}
              {refinedSongSuggestions?.hindi?.map((title, index) => title && (
                <SongSuggestionItem key={`refined-song-hi-${index}`} title={title} language="Hindi" />
              ))}
              {refinedSongSuggestions?.bengali?.map((title, index) => title && (
                <SongSuggestionItem key={`refined-song-bn-${index}`} title={title} language="Bengali" />
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

// SparklesIcon - using inline SVG as it's not in lucide-react's default export
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

// Label component for use with Textarea
const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ children, ...props }) => (
  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" {...props}>
    {children}
  </label>
);
