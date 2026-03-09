
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Sparkles as SparklesLucideIcon } from "lucide-react";
import type { SongSuggestionsMap, LanguageOption, SongSuggestion } from '@/lib/types';

interface RefinedSongsDisplayProps {
  refinedSongSuggestions: SongSuggestionsMap | null;
  selectedLanguages: string[];
  PREDEFINED_LANGUAGES: LanguageOption[];
  SongSuggestionItemRenderer: React.FC<{ song: SongSuggestion; language: string }>;
}

const RefinedSongsDisplay: React.FC<RefinedSongsDisplayProps> = ({
  refinedSongSuggestions,
  selectedLanguages,
  SongSuggestionItemRenderer,
}) => {
  return (
    <Card className="w-full shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
          <SparklesLucideIcon className="h-6 w-6 text-primary" />
          Refined Song Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {refinedSongSuggestions && selectedLanguages.map(language => (
          refinedSongSuggestions[language] && (
            <div key={`refined-song-${language}`} className="space-y-2">
              <h4 className="font-semibold text-md text-foreground">{language}</h4>
              {refinedSongSuggestions[language].map((song, index) => (
                <SongSuggestionItemRenderer key={`ref-${language}-${index}`} song={song} language={language} />
              ))}
            </div>
          )
        ))}
      </CardContent>
    </Card>
  );
};

export default RefinedSongsDisplay;
