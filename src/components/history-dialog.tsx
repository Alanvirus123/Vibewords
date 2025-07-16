
"use client";

import React from 'react';
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Trash2, RefreshCcw, Image as ImageIcon, Video, Images } from "lucide-react";
import type { HistoryEntry } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface HistoryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  history: HistoryEntry[];
  onLoadHistory: (entry: HistoryEntry) => void;
  onClearHistory: () => void;
}

const MediaThumbnail: React.FC<{ entry: HistoryEntry }> = ({ entry }) => {
    let Icon;
    let hint = "media thumbnail";
    switch (entry.mediaType) {
        case 'image': Icon = ImageIcon; hint="image thumbnail"; break;
        case 'video': Icon = Video; hint="video thumbnail"; break;
        case 'image_collection': Icon = Images; hint="image collection"; break;
        default: Icon = ImageIcon;
    }

    if (entry.mediaSrcs && entry.mediaSrcs[0]) {
        if (entry.mediaType === 'video') {
            return (
                <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                    <Video className="w-8 h-8 text-muted-foreground" />
                </div>
            );
        }
        return (
            <Image
                src={entry.mediaSrcs[0]}
                alt="Media thumbnail from history"
                width={64}
                height={64}
                className="w-16 h-16 rounded-md object-cover bg-muted"
                data-ai-hint={hint}
            />
        );
    }
    
    return (
      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
    )
};


export const HistoryDialog: React.FC<HistoryDialogProps> = ({ isOpen, onOpenChange, history, onLoadHistory, onClearHistory }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="View generation history">
          <History className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generation History</DialogTitle>
          <DialogDescription>
            Review your past sessions. You can reload a session to continue refining it.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <ScrollArea className="h-96 pr-4">
            {history.length > 0 ? (
              <div className="space-y-4">
                {history.map(entry => (
                  <div key={entry.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card/50">
                    <MediaThumbnail entry={entry} />
                    <div className="flex-grow">
                      <p className="font-semibold text-sm">
                        {entry.mediaType === 'image_collection' 
                          ? `${entry.mediaSrcs.length} Images` 
                          : entry.mediaType.charAt(0).toUpperCase() + entry.mediaType.slice(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onLoadHistory(entry)} aria-label="Reload session">
                      <RefreshCcw className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Your history is empty.</p>
                <p className="text-xs text-muted-foreground">Generated captions will appear here.</p>
              </div>
            )}
          </ScrollArea>
        </div>
        <DialogFooter className="mt-4">
            {history.length > 0 && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" /> Clear History
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your
                            entire session history.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            onClearHistory();
                        }}>
                            Continue
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
