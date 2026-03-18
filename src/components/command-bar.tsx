"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Sparkles, History, Copy, Zap, ArrowRight, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: 'generate' | 'history') => void;
  onRefine: () => void;
  lastCaption: string | null;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onRefine,
  lastCaption
}) => {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const ACTIONS = [
    { 
      id: 'goto-vibespace', 
      label: 'Go to Vibespace', 
      icon: Sparkles, 
      category: 'Navigation',
      onSelect: () => onNavigate('generate')
    },
    { 
      id: 'goto-vault', 
      label: 'Open Neural Vault', 
      icon: History, 
      category: 'Navigation',
      onSelect: () => onNavigate('history')
    },
    { 
      id: 'refine-captions', 
      label: 'Trigger Neural Refinement', 
      icon: Zap, 
      category: 'Actions',
      onSelect: () => onRefine()
    },
    { 
      id: 'copy-last', 
      label: 'Copy Last Generation', 
      icon: Copy, 
      category: 'Actions',
      onSelect: () => {
        if (lastCaption) navigator.clipboard.writeText(lastCaption);
      },
      disabled: !lastCaption
    }
  ].filter(action => action.label.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % ACTIONS.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + ACTIONS.length) % ACTIONS.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        ACTIONS[selectedIndex]?.onSelect();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, ACTIONS, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-primary/20 shadow-2xl">
        <DialogTitle className="sr-only">Command Menu</DialogTitle>
        <DialogDescription className="sr-only">
          Search for commands and navigate through the application.
        </DialogDescription>
        <div className="flex items-center border-b border-border/50 px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <Input 
            autoFocus
            placeholder="Type a command or search..." 
            className="border-none shadow-none focus-visible:ring-0 text-lg h-10 bg-transparent px-0"
            value={search}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex items-center gap-1.5 ml-4">
            <kbd className="px-2 py-1 bg-muted rounded border border-border text-[10px] font-mono text-muted-foreground shadow-sm">ESC</kbd>
          </div>
        </div>
        
        <ScrollArea className="max-h-[400px]">
          <div className="p-2">
            {ACTIONS.length > 0 ? (
              <div className="space-y-4 py-2">
                {['Navigation', 'Actions'].map(category => {
                  const catActions = ACTIONS.filter(a => a.category === category);
                  if (catActions.length === 0) return null;
                  
                  return (
                    <div key={category} className="space-y-1">
                      <p className="px-3 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">{category}</p>
                      {catActions.map((action, idx) => {
                        const globalIdx = ACTIONS.indexOf(action);
                        const isSelected = globalIdx === selectedIndex;
                        const Icon = action.icon;
                        
                        return (
                          <button
                            key={action.id}
                            disabled={action.disabled}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all text-left group",
                              isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 translate-x-1" : "hover:bg-muted text-foreground",
                              action.disabled && "opacity-50 grayscale pointer-events-none"
                            )}
                            onClick={() => {
                              action.onSelect();
                              onClose();
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn("p-1.5 rounded-lg", isSelected ? "bg-white/20" : "bg-primary/10 text-primary")}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <span className="text-sm font-semibold">{action.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {isSelected && <CornerDownLeft className="h-4 w-4 opacity-70" />}
                                {!isSelected && <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center space-y-2">
                <Search className="h-10 w-10 text-muted-foreground/20 mx-auto" />
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">No matching commands</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-3 border-t border-border/50 bg-muted/30 flex justify-between items-center px-6">
          <div className="flex gap-4">
             <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border text-[9px] font-mono text-muted-foreground shadow-sm">↑↓</kbd>
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">Navigate</span>
             </div>
             <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border text-[9px] font-mono text-muted-foreground shadow-sm">ENTER</kbd>
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">Select</span>
             </div>
          </div>
          <p className="text-[9px] text-muted-foreground font-mono">VIBEWORDS_SHELL v1.0.4</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
