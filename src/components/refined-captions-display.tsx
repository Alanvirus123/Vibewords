
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SparklesIcon as SparklesLucideIcon } from "lucide-react";
import type { MediaSuggestions, LanguageOption } from './caption-wise-client';

interface RefinedCaptionsDisplayProps {
  refinedCaptions: MediaSuggestions | null;
  selectedLanguages: string[]; // These are the languages for CAPTIONS
  PREDEFINED_LANGUAGES: LanguageOption[];
  CaptionDisplayCardRenderer: React.FC<{ caption: string; language: string }>;
}

const RefinedCaptionsDisplay: React.FC<RefinedCaptionsDisplayProps> = ({
  refinedCaptions,
  selectedLanguages, // Used for iterating and displaying relevant caption languages
  PREDEFINED_LANGUAGES,
  CaptionDisplayCardRenderer,
}) => {
  return (
    <Card className="w-full shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
          <SparklesLucideIcon className="h-6 w-6 text-primary" />
          6. Refined Captions
        </CardTitle>
        <CardDescription>Refined captions based on your feedback.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {refinedCaptions && selectedLanguages.map(language => (
          refinedCaptions[language] && refinedCaptions[language].length > 0 && (
            <div key={`refined-${language}-section`} className="space-y-2">
              <h4 className="font-semibold text-md text-foreground">{PREDEFINED_LANGUAGES.find(l => l.value === language)?.label || language}</h4>
              {refinedCaptions[language].map((caption, index) => caption && (
                <CaptionDisplayCardRenderer key={`refined-${language}-${index}`} caption={caption} language={language} />
              ))}
            </div>
          )
        ))}
      </CardContent>
    </Card>
  );
};

export default RefinedCaptionsDisplay;
