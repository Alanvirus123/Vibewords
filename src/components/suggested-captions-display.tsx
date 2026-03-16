"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, Text, Zap } from "lucide-react"; 
import type { MediaSuggestions, LanguageOption } from '@/lib/types';

interface SuggestedCaptionsDisplayProps {
  mediaType: "image" | "video" | "image_collection" | null;
  suggestedCaptions: MediaSuggestions | null;
  captionFeedback: string;
  setCaptionFeedback: (value: string) => void;
  handleRefineCaptions: (quickPrompt?: string) => Promise<void>;
  isRefiningCaptions: boolean;
  isRefiningSongs: boolean;
  selectedLanguages: string[]; 
  PREDEFINED_LANGUAGES: LanguageOption[];
  CaptionDisplayCardRenderer: React.FC<{ caption: string; language: string; index?: number }>;
}

const QUICK_REFINES = [
  { label: "Shorten", prompt: "Make these much shorter and punchier" },
  { label: "Add Emojis", prompt: "Incorporate relevant emojis throughout" },
  { label: "Professional", prompt: "Rewrite for a LinkedIn-ready professional tone" },
  { label: "Viral Catchy", prompt: "Make them more catchy for viral potential" },
  { label: "Call to Action", prompt: "Add a strong call-to-action at the end" },
];

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
}) => {
  return (
    <Card className="w-full shadow-lg rounded-xl overflow-hidden border-border/50">
      <CardHeader className="bg-primary/5 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
          <Text className="h-6 w-6 text-primary" />
          AI-Suggested Captions
        </CardTitle>
        <CardDescription>Tailored captions for your selected platforms. Listen, copy, or refine them.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {suggestedCaptions && selectedLanguages.map((language, langIndex) => (
          suggestedCaptions[language] && suggestedCaptions[language].length > 0 && (
            <div key={language} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-grow bg-border/50" />
                <h4 className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest px-3">{language}</h4>
                <div className="h-px flex-grow bg-border/50" />
              </div>
              <div className="grid grid-cols-1 gap-3">
                {suggestedCaptions[language].map((caption, index) => caption && (
                  <CaptionDisplayCardRenderer 
                    key={`suggested-${language}-${index}`} 
                    caption={caption} 
                    language={language} 
                    index={langIndex * 4 + index}
                  />
                ))}
              </div>
            </div>
          )
        ))}
      </CardContent>
      <CardFooter className="flex-col items-start gap-4 pt-6 border-t bg-muted/30">
        <div className="w-full space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="captionFeedback" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Refine Output:</Label>
              <div className="flex gap-2">
                {QUICK_REFINES.map(preset => (
                  <Button 
                    key={preset.label}
                    variant="outline" 
                    size="sm" 
                    className="h-6 px-2 text-[8px] font-bold uppercase tracking-tighter hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleRefineCaptions(preset.prompt)}
                    disabled={isRefiningCaptions || isRefiningSongs}
                  >
                    <Zap className="h-2 w-2 mr-1" /> {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <Textarea
              id="captionFeedback"
              placeholder="e.g., 'Make it punchier for Instagram', 'Add more emojis'"
              value={captionFeedback}
              onChange={(e) => setCaptionFeedback(e.target.value)}
              className="min-h-[80px] bg-background border-border/50 focus:border-primary/50 transition-colors"
            />
        </div>
        <div className="w-full flex justify-end">
            <Button onClick={() => handleRefineCaptions()} disabled={isRefiningCaptions || !captionFeedback || isRefiningSongs} className="w-full sm:w-auto h-10 px-8 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95">
              {isRefiningCaptions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {isRefiningCaptions ? "REFINING NODES..." : "REFINE CAPTIONS"}
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default SuggestedCaptionsDisplay;