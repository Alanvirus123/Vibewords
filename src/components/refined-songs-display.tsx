
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SparklesIcon as SparklesLucideIcon } from "lucide-react";
import type { MediaSuggestions, LanguageOption } from './caption-wise-client';

interface RefinedSongsDisplayProps {
  refinedSongSuggestions: MediaSuggestions | null; // Contains refined songs for selected SONG languages
  selectedLanguages: string[]; // These are the SONG-specific languages
  PREDEFINED_LANGUAGES: LanguageOption[];
  SongSuggestionItemRenderer: React.FC<{ title: string; language: string }>;
}

const RefinedSongsDisplay: React.FC<RefinedSongsDisplayProps> = ({
  refinedSongSuggestions,
  selectedLanguages, // This prop now represents selected SONG languages
  PREDEFINED_LANGUAGES,
  SongSuggestionItemRenderer,
}) => {
  return (
    <Card className="w-full shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
          <SparklesIcon className="h-6 w-6 text-primary" />
          7. Refined Song Suggestions
        </CardTitle>
        <CardDescription>Refined song suggestions based on your feedback, for your selected song languages.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Iterate over selected SONG languages to display relevant refined songs */}
        {refinedSongSuggestions && selectedLanguages.map(language => (
          refinedSongSuggestions[language] && refinedSongSuggestions[language].length > 0 && (
            <div key={`refined-song-${language}-section`} className="space-y-2">
              <h4 className="font-semibold text-md text-foreground">{PREDEFINED_LANGUAGES.find(l => l.value === language)?.label || language}</h4>
              {refinedSongSuggestions[language].map((title, index) => title && (
                <SongSuggestionItemRenderer key={`refined-song-${language}-${index}`} title={title} language={language} />
              ))}
            </div>
          )
        ))}
      </CardContent>
    </Card>
  );
};

export default RefinedSongsDisplay;
