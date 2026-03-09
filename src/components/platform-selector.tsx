
"use client";

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, ChevronDown, Share2 } from "lucide-react";

interface PlatformSelectorProps {
  allPlatforms: string[];
  selectedPlatforms: string[];
  onPlatformChange: (platformValue: string) => void;
  description: string;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  allPlatforms,
  selectedPlatforms,
  onPlatformChange,
  description,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const displayedPlatforms = useMemo(() => {
    if (selectedPlatforms.length > 2) {
      return `${selectedPlatforms.slice(0, 2).join(', ')} + ${selectedPlatforms.length - 2} more`;
    }
    return selectedPlatforms.join(', ') || "Select platforms...";
  }, [selectedPlatforms]);

  const filteredPlatforms = useMemo(() => {
    if (!searchTerm) {
      return allPlatforms;
    }
    return allPlatforms.filter(p => 
      p.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allPlatforms]);
  
  const uniqueIdPrefix = `platform-sel`;

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold flex items-center gap-2">
        <Share2 className="h-4 w-4" />
        Target Platforms
      </Label>
      <p className="text-xs text-muted-foreground">{description}</p>
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between h-auto py-2 px-3 min-h-[40px]">
              <span className="truncate">{displayedPlatforms}</span>
              <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
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
                  placeholder="Search platforms..."
                  className="w-full pl-8 pr-2 py-1 h-9 rounded-md border"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="h-48"> 
              <div className="p-2 space-y-1"> 
              {filteredPlatforms.map(platform => (
                <div key={`${uniqueIdPrefix}-${platform}`} className="flex items-center space-x-2 p-1 hover:bg-accent rounded-md"> 
                  <Checkbox
                    id={`${uniqueIdPrefix}-${platform}`}
                    checked={selectedPlatforms.includes(platform)}
                    onCheckedChange={() => onPlatformChange(platform)}
                  />
                  <Label htmlFor={`${uniqueIdPrefix}-${platform}`} className="font-normal cursor-pointer flex-1 text-sm">{platform}</Label> 
                </div>
              ))}
              {filteredPlatforms.length === 0 && (
                <p className="p-2 text-sm text-muted-foreground text-center">No platforms found.</p>
              )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
    </div>
  );
};
