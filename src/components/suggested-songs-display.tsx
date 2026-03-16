"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Music2 } from "lucide-react";
import type { SongSuggestionsMap, LanguageOption, SongSuggestion } from '@/lib/types';

interface SuggestedSongsDisplayProps {
  mediaType: "image" | "video" | "image_collection" | null;
  suggestedSongs: SongSuggestionsMap | null;
  songFeedback: string;
  setSongFeedback: (value: string) => void;
  artistPreference: string;
  setArtistPreference: (value: string) => void;
  handleRefineSongs: () => Promise<void>;
  isRefiningCaptions: boolean;
  isRefiningSongs: boolean;
  selectedLanguages: string[];
  PREDEFINED_LANGUAGES: LanguageOption[];
  SongSuggestionItemRenderer: React.FC<{ song: SongSuggestion; language: string; index?: number }>;
}

const SuggestedSongsDisplay: React.FC<SuggestedSongsDisplayProps> = ({
  mediaType,
  suggestedSongs,
  songFeedback,
  setSongFeedback,
  artistPreference,
  setArtistPreference,
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
          AI-Suggested Songs
        </CardTitle>
        <CardDescription>Multilingual song ideas with artist details and cultural vibes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestedSongs && selectedLanguages.map((language, langIndex) => (
          suggestedSongs[language] && (
            <div key={`suggested-song-${language}`} className="space-y-2">
              <h4 className="font-semibold text-md text-foreground">{language}</h4>
              {suggestedSongs[language].map((song, index) => (
                <SongSuggestionItemRenderer 
                    key={`${language}-${index}`} 
                    song={song} 
                    language={language} 
                    index={langIndex * 3 + index}
                />
              ))}
            </div>
          )
        ))}
      </CardContent>
      <CardFooter className="flex-col items-start gap-4 pt-6 border-t">
        <div className="w-full space-y-2">
          <Label htmlFor="songFeedback" className="font-semibold text-md">Refine Songs:</Label>
          <Textarea
            id="songFeedback"
            placeholder="e.g., 'more upbeat Bollywood tracks', 'Bengali folk fusion only'"
            value={songFeedback}
            onChange={(e) => setSongFeedback(e.target.value)}
          />
        </div>
        <Button onClick={handleRefineSongs} disabled={isRefiningSongs || !songFeedback || isRefiningCaptions} className="w-full">
          {isRefiningSongs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {isRefiningSongs ? "Refining Songs..." : "Refine Songs"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SuggestedSongsDisplay;