
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, Edit3, Images, Film } from "lucide-react"; 
import type { MediaSuggestions, LanguageOption } from './caption-wise-client';

interface SuggestedCaptionsDisplayProps {
  mediaType: "image" | "video" | "image_collection" | null;
  suggestedCaptions: MediaSuggestions | null;
  captionFeedback: string;
  setCaptionFeedback: (value: string) => void;
  handleRefineCaptions: () => Promise<void>;
  isRefiningCaptions: boolean;
  isRefiningSongs: boolean;
  selectedLanguages: string[]; // These are the languages for CAPTIONS
  PREDEFINED_LANGUAGES: LanguageOption[];
  CaptionDisplayCardRenderer: React.FC<{ caption: string; language: string }>;
}

const SuggestedCaptionsDisplay: React.FC<SuggestedCaptionsDisplayProps> = ({
  mediaType,
  suggestedCaptions,
  captionFeedback,
  setCaptionFeedback,
  handleRefineCaptions,
  isRefiningCaptions,
  isRefiningSongs,
  selectedLanguages, // Used for iterating and displaying relevant caption languages
  PREDEFINED_LANGUAGES,
  CaptionDisplayCardRenderer,
}) => {
  const getMediaTypeIcon = () => {
    if (mediaType === 'image_collection') return <Images className="h-6 w-6 text-primary" />;
    if (mediaType === 'video') return <Film className="h-6 w-6 text-primary" />;
    return <Edit3 className="h-6 w-6 text-primary" />; 
  };
  
  const getMediaTypeName = () => {
    if (mediaType === 'image_collection') return 'your images';
    if (mediaType === 'video') return 'your video';
    return 'your image';
  }

  return (
    <Card className="w-full shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
          {getMediaTypeIcon()}
          4. AI-Suggested Captions
        </CardTitle>
        <CardDescription>Here are captions for {getMediaTypeName()}. Copy or refine them (refining captions also refines songs).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestedCaptions && selectedLanguages.map(language => (
          suggestedCaptions[language] && suggestedCaptions[language].length > 0 && (
            <div key={language} className="space-y-2">
              <h4 className="font-semibold text-md text-foreground">{PREDEFINED_LANGUAGES.find(l => l.value === language)?.label || language}</h4>
              {suggestedCaptions[language].map((caption, index) => caption && (
                <CaptionDisplayCardRenderer key={`suggested-${language}-${index}`} caption={caption} language={language} />
              ))}
            </div>
          )
        ))}
      </CardContent>
      <CardFooter className="flex-col items-start gap-4 pt-6 border-t">
        <Label htmlFor="captionFeedback" className="font-semibold text-md">Refine Captions (for all selected caption languages):</Label>
        <Textarea
          id="captionFeedback"
          placeholder="Your feedback for captions (e.g., 'make it funnier', 'add hashtags')"
          value={captionFeedback}
          onChange={(e) => setCaptionFeedback(e.target.value)}
          className="min-h-[80px]"
        />
        <Button onClick={handleRefineCaptions} disabled={isRefiningCaptions || !captionFeedback || isRefiningSongs} className="w-full sm:w-auto">
          {isRefiningCaptions && !isRefiningSongs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refine Captions {isRefiningSongs && !isRefiningCaptions && "& Songs..."}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SuggestedCaptionsDisplay;
