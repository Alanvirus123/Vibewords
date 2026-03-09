
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, Text } from "lucide-react"; 
import type { MediaSuggestions, LanguageOption } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SuggestedCaptionsDisplayProps {
  mediaType: "image" | "video" | "image_collection" | null;
  suggestedCaptions: MediaSuggestions | null;
  captionFeedback: string;
  setCaptionFeedback: (value: string) => void;
  handleRefineCaptions: () => Promise<void>;
  isRefiningCaptions: boolean;
  isRefiningSongs: boolean;
  selectedLanguages: string[]; 
  PREDEFINED_LANGUAGES: LanguageOption[];
  CaptionDisplayCardRenderer: React.FC<{ caption: string; language: string }>;
  selectedTone: string;
  setSelectedTone: (value: string) => void;
  tones: string[];
}

const SuggestedCaptionsDisplay: React.FC<SuggestedCaptionsDisplayProps> = ({
  mediaType,
  suggestedCaptions,
  captionFeedback,
  setCaptionFeedback,
  handleRefineCaptions,
  isRefiningCaptions,
  isRefiningSongs,
  selectedLanguages, 
  PREDEFINED_LANGUAGES,
  CaptionDisplayCardRenderer,
  selectedTone,
  setSelectedTone,
  tones,
}) => {
  return (
    <Card className="w-full shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
          <Text className="h-6 w-6 text-primary" />
          4. AI-Suggested Captions
        </CardTitle>
        <CardDescription>Tailored captions for your selected platform. Listen, copy, or refine them.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestedCaptions && selectedLanguages.map(language => (
          suggestedCaptions[language] && suggestedCaptions[language].length > 0 && (
            <div key={language} className="space-y-2">
              <h4 className="font-semibold text-md text-foreground">{language}</h4>
              {suggestedCaptions[language].map((caption, index) => caption && (
                <CaptionDisplayCardRenderer key={`suggested-${language}-${index}`} caption={caption} language={language} />
              ))}
            </div>
          )
        ))}
      </CardContent>
      <CardFooter className="flex-col items-start gap-4 pt-6 border-t">
        <div className="w-full space-y-2">
            <Label htmlFor="captionFeedback" className="font-semibold text-md">Refine for Your Audience:</Label>
            <Textarea
              id="captionFeedback"
              placeholder="e.g., 'Make it punchier for Instagram', 'Add more emojis'"
              value={captionFeedback}
              onChange={(e) => setCaptionFeedback(e.target.value)}
              className="min-h-[80px]"
            />
        </div>
        <div className="w-full space-y-2">
           <Label htmlFor="tone-selector" className="font-semibold text-md">Tone Override</Label>
           <Select value={selectedTone} onValueChange={setSelectedTone}>
            <SelectTrigger id="tone-selector" className="w-full">
              <SelectValue placeholder="Select a tone..." />
            </SelectTrigger>
            <SelectContent>
              {tones.map(tone => (
                <SelectItem key={tone} value={tone}>{tone}</SelectItem>
              ))}
            </SelectContent>
           </Select>
        </div>

        <Button onClick={handleRefineCaptions} disabled={isRefiningCaptions || !captionFeedback || isRefiningSongs} className="w-full sm:w-auto">
          {isRefiningCaptions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {isRefiningCaptions ? "Refining..." : "Refine Captions"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SuggestedCaptionsDisplay;
