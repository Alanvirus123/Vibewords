
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Music2 } from "lucide-react";
import type { MediaSuggestions, LanguageOption } from '@/lib/types';

interface SuggestedSongsDisplayProps {
  mediaType: "image" | "video" | "image_collection" | null;
  suggestedSongs: MediaSuggestions | null; // Contains songs for ALL initially selected languages
  songFeedback: string;
  setSongFeedback: (value: string) => void;
  artistPreference: string;
  setArtistPreference: (value: string) => void;
  handleRefineSongs: () => Promise<void>;
  isRefiningCaptions: boolean;
  isRefiningSongs: boolean;
  selectedLanguages: string[]; // These are the SONG-specific languages for display/refinement
  PREDEFINED_LANGUAGES: LanguageOption[];
  SongSuggestionItemRenderer: React.FC<{ title: string; language: string }>;
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
  selectedLanguages, // This prop now represents selected SONG languages
  PREDEFINED_LANGUAGES,
  SongSuggestionItemRenderer,
}) => {
  const getMediaTypeName = () => {
    if (mediaType === 'image_collection') return 'your images';
    if (mediaType === 'video') return 'your video';
    return 'your image';
  }

  return (
    <Card className="w-full shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
          <Music2 className="h-6 w-6 text-primary" />
          5. AI-Suggested Songs 
        </CardTitle>
        <CardDescription>Song titles for {getMediaTypeName()} in your selected song languages. Copy or refine them!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Iterate over selected SONG languages to display relevant songs */}
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
        <div className="w-full space-y-2">
          <Label htmlFor="songFeedback" className="font-semibold text-md">Refine Song Suggestions (for selected song languages):</Label>
          <Textarea
            id="songFeedback"
            placeholder="Your feedback for songs (e.g., 'more upbeat songs', 'instrumental only')"
            value={songFeedback}
            onChange={(e) => setSongFeedback(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
        <div className="w-full space-y-2">
          <Label htmlFor="artistPreference" className="font-semibold text-md">Artist/Genre Preferences (Optional):</Label>
          <Input
            id="artistPreference"
            placeholder="e.g., Taylor Swift, instrumental piano, 80s rock"
            value={artistPreference}
            onChange={(e) => setArtistPreference(e.target.value)}
          />
        </div>
        <Button onClick={handleRefineSongs} disabled={isRefiningSongs || !songFeedback || isRefiningCaptions} className="w-full sm:w-auto">
          {isRefiningSongs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {isRefiningSongs ? "Refining..." : "Refine Songs"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SuggestedSongsDisplay;
