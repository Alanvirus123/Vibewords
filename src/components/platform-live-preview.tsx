"use client";

import React from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Instagram, Twitter, Linkedin, Facebook, Youtube, AlertTriangle, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformLivePreviewProps {
  caption: string;
  hashtags?: string[];
  platform: string;
  limit: number;
}

const PLATFORM_ICONS: Record<string, any> = {
  "Instagram": Instagram,
  "X": Twitter,
  "LinkedIn": Linkedin,
  "Facebook": Facebook,
  "YouTube": Youtube,
  "Threads": Instagram, // Closest match
  "TikTok": Smartphone,
  "WhatsApp": Smartphone
};

export const PlatformLivePreview: React.FC<PlatformLivePreviewProps> = ({
  caption,
  hashtags = [],
  platform,
  limit
}) => {
  const isOverLimit = caption.length > limit;
  const Icon = PLATFORM_ICONS[platform] || Smartphone;
  const fullContent = `${caption}\n\n${hashtags.join(' ')}`;

  return (
    <div className="space-y-6 py-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {platform} Live Preview
        </DialogTitle>
        <DialogDescription>
          Visualize how your content will appear to your audience.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
        {/* Mobile Mockup */}
        <div className="relative w-[300px] h-[600px] bg-zinc-900 rounded-[3rem] border-[8px] border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-2xl z-20" />
          
          <div className="p-4 pt-10 flex-grow flex flex-col">
             <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="h-2 w-20 bg-zinc-800 rounded-full" />
                  <div className="h-1.5 w-12 bg-zinc-800/50 rounded-full" />
                </div>
             </div>

             <div className="aspect-square w-full bg-zinc-800 rounded-xl mb-4 flex items-center justify-center">
                <Smartphone className="h-12 w-12 text-zinc-700 opacity-20" />
             </div>

             <ScrollArea className="flex-grow pr-2">
                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
                  {fullContent}
                </p>
             </ScrollArea>
             
             <div className="h-10 border-t border-zinc-800 mt-2 flex items-center justify-around">
                <div className="h-1 w-8 bg-zinc-800 rounded-full" />
                <div className="h-1 w-8 bg-zinc-800 rounded-full" />
                <div className="h-1 w-8 bg-zinc-800 rounded-full" />
             </div>
          </div>
        </div>

        {/* Status Panel */}
        <div className="flex-grow max-w-xs space-y-6">
          <div className="p-4 rounded-2xl bg-muted/50 border space-y-4">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Diagnostic Summary</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Character Count</span>
                <span className={cn("font-bold", isOverLimit ? "text-destructive" : "text-primary")}>
                  {caption.length} / {limit}
                </span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-500", isOverLimit ? "bg-destructive" : "bg-primary")}
                  style={{ width: `${Math.min((caption.length / limit) * 100, 100)}%` }}
                />
              </div>
            </div>

            {isOverLimit && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-[10px] text-destructive font-medium leading-tight">
                  This caption exceeds the recommended limit for {platform}. It may be truncated in feeds.
                </p>
              </div>
            )}

            {!isOverLimit && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex gap-2">
                <Badge className="bg-primary hover:bg-primary h-4 px-1">OK</Badge>
                <p className="text-[10px] text-primary font-medium leading-tight">
                  Optimal length detected. Content will display fully across most devices.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
