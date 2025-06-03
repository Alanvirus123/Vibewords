
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, Music2 } from "lucide-react";
import type { MediaSuggestions, LanguageOption } from './caption-wise-client';

interface SuggestedSongsDisplayProps {
  mediaType: "image" | "video" | null;
  suggestedSongs: MediaSuggestions | null;
  songFeedback: string;
  setSongFeedback: (value: string) => void;
  handleRefineSongs: () => Promise<void>;
  isRefiningCaptions: boolean;
  isRefiningSongs: boolean;
  selectedLanguages: string[];
  PREDEFINED_LANGUAGES: LanguageOption[];
  SongSuggestionItemRenderer: React.FC<{ title: string; language: string }>;
}

const SuggestedSongsDisplay: React.FC<SuggestedSongsDisplayProps> = ({
  mediaType,
  suggestedSongs,
  songFeedback,
  setSongFeedback,
  handleRefineSongs,
  isRefiningCaptions,
  isRefiningSongs,
  selectedLanguages,
  PREDEFINED_LANGUAGES,
  SongSuggestionItemRenderer,
}) => {
  return (
    <Card className="w-full shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
          <Music2 className="h-6 w-6 text-primary" />
          5. AI-Suggested Songs 
        </CardTitle>
        <CardDescription>Song titles for your {mediaType}. Copy or refine them!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestedSongs && selectedLanguages.map(language => (
          suggestedSongs[language] && suggestedSongs[language].length > 0 && (
            <div key={`suggested-song-${language}-section`} className="space-y-2">
              <h4 className="font-semibold text-md text-foreground">{PREDEFINED_LANGUAGES.find(l => l.value === language)?.label || language}</h4>
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
  );
};

export default SuggestedSongsDisplay;
