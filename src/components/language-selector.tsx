
"use client";

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, ChevronDown } from "lucide-react";
import type { LanguageOption } from '@/lib/types';

interface LanguageSelectorProps {
  allLanguages: LanguageOption[];
  selectedLanguages: string[];
  onLanguageChange: (languageValue: string) => void;
  description: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  allLanguages,
  selectedLanguages,
  onLanguageChange,
  description,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const displayedLanguages = useMemo(() => {
    const labels = selectedLanguages.map(val => allLanguages.find(l => l.value === val)?.label || val);
    if (labels.length > 2) {
      return `${labels.slice(0, 2).join(', ')} + ${labels.length - 2} more`;
    }
    return labels.join(', ') || "Select languages...";
  }, [selectedLanguages, allLanguages]);

  const filteredLanguages = useMemo(() => {
    if (!searchTerm) {
      return allLanguages;
    }
    return allLanguages.filter(lang => 
      lang.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lang.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allLanguages]);
  
  const uniqueIdPrefix = `lang-sel-${description.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{description}</p>
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {displayedLanguages}
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[--radix-popover-trigger-width] p-0"
            side="bottom"
            align="start"
            sideOffset={8}
          >
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search languages..."
                  className="w-full pl-8 pr-2 py-1 h-9 rounded-md border"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="h-60"> 
              <div className="p-2 space-y-1"> 
              {filteredLanguages.map(lang => (
                <div key={`${uniqueIdPrefix}-${lang.value}`} className="flex items-center space-x-2 p-1 hover:bg-accent rounded-md"> 
                  <Checkbox
                    id={`${uniqueIdPrefix}-${lang.value}`}
                    checked={selectedLanguages.includes(lang.value)}
                    onCheckedChange={() => onLanguageChange(lang.value)}
                  />
                  <Label htmlFor={`${uniqueIdPrefix}-${lang.value}`} className="font-normal cursor-pointer flex-1 text-sm">{lang.label}</Label> 
                </div>
              ))}
              {filteredLanguages.length === 0 && (
                <p className="p-2 text-sm text-muted-foreground text-center">No languages found.</p>
              )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
         <p className="mt-2 text-xs text-muted-foreground">
            Selected: {selectedLanguages.map(val => allLanguages.find(l => l.value === val)?.label || val).join(', ') || 'None'}
        </p>
    </div>
  );
};

    