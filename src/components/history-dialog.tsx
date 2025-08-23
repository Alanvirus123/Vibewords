
"use client";

import React from 'react';
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Images, Film, Loader2 } from "lucide-react";
import type { GenerationHistoryItem, LanguageOption } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface HistoryDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    history: GenerationHistoryItem[];
    onLoadHistory: (item: GenerationHistoryItem) => void;
    onOpen: () => void;
    PREDEFINED_LANGUAGES: LanguageOption[];
}

export const HistoryDialog: React.FC<HistoryDialogProps> = ({ isOpen, onOpenChange, history, onLoadHistory, onOpen }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" onClick={onOpen} aria-label="View history">
                    <History className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Generation History</DialogTitle>
                    <DialogDescription>
                        Review and reload your past content generation sessions.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh] mt-4">
                    <div className="space-y-4 p-1">
                        {history.length === 0 ? (
                            <div className="text-center text-muted-foreground py-16">
                                <p>No history found.</p>
                                <p className="text-sm">Your generated content will appear here.</p>
                            </div>
                        ) : (
                            history.map(item => (
                                <div key={item.id} className="border rounded-lg p-4 flex flex-col sm:flex-row gap-4 hover:bg-muted/50 transition-colors">
                                    <div className="w-full sm:w-32 h-32 sm:h-auto flex-shrink-0 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                                        {item.mediaType === 'image' && item.mediaSrcs[0] && (
                                            <Image src={item.mediaSrcs[0]} alt="Generated content" width={128} height={128} className="object-cover w-full h-full" />
                                        )}
                                        {item.mediaType === 'image_collection' && (
                                            <Images className="h-12 w-12 text-muted-foreground" />
                                        )}
                                        {item.mediaType === 'video' && (
                                            <Film className="h-12 w-12 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-semibold text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                                        </p>
                                        <p className="font-bold text-lg text-card-foreground line-clamp-2">
                                            {item.vibe || "Vibe not analyzed"}
                                        </p>
                                        <div className="text-xs mt-2 space-y-1">
                                            {item.suggestions.captions && Object.keys(item.suggestions.captions).length > 0 && (
                                                <p>
                                                    <span className="font-semibold">Captions: </span> 
                                                    {Object.keys(item.suggestions.captions).map(lang => PREDEFINED_LANGUAGES.find(l => l.value === lang)?.label || lang).join(', ')}
                                                </p>
                                            )}
                                            {item.suggestions.songs && Object.keys(item.suggestions.songs).length > 0 && (
                                                <p>
                                                    <span className="font-semibold">Songs: </span> 
                                                    {Object.keys(item.suggestions.songs).map(lang => PREDEFINED_LANGUAGES.find(l => l.value === lang)?.label || lang).join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 self-center">
                                        <Button onClick={() => onLoadHistory(item)}>Load</Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
