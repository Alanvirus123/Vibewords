
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { askAiAssistant, type AskAiAssistantInput } from "@/ai/flows/ai-assistant";
import type { MediaSuggestions } from "@/lib/types";

interface AiAssistantProps {
  mediaType: 'image' | 'video' | 'image_collection' | null;
  mediaVibe: string | null;
  suggestedCaptions: MediaSuggestions | null;
  suggestedSongs: MediaSuggestions | null;
  captionFeedback: string;
  songFeedback: string;
  selectedTone: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  mediaType,
  mediaVibe,
  suggestedCaptions,
  suggestedSongs,
  captionFeedback,
  songFeedback,
  selectedTone,
}) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom whenever a new message is added
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);

    try {
      const input: AskAiAssistantInput = {
        question: query,
        appContext: {
          hasMedia: !!mediaType,
          mediaType: mediaType,
          mediaVibe: mediaVibe,
          suggestedCaptions: suggestedCaptions,
          suggestedSongs: suggestedSongs,
          captionRefinement: {
            feedback: captionFeedback,
            tone: selectedTone,
          },
          songRefinement: {
            feedback: songFeedback,
          },
        },
      };

      const result = await askAiAssistant(input);
      const assistantMessage: ChatMessage = { role: 'assistant', content: result.answer };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error("Error asking AI Assistant:", error);
      toast({
        variant: "destructive",
        title: "Assistant Error",
        description: "Could not get a response from the AI assistant. " + (error.message || ""),
      });
      // Optionally remove the user message on error or add an error message to the chat
      setMessages(prev => [...prev, {role: 'assistant', content: "Sorry, I encountered an error. Please try again."}]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>AI Assistant</DialogTitle>
        <DialogDescription>
          Ask anything about your current session or for general social media advice.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col h-[60vh]">
        <ScrollArea className="flex-grow p-4 border rounded-md" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
                <div className="text-center text-muted-foreground pt-8">
                    <p>Welcome! How can I help you?</p>
                    <p className="text-xs mt-2">e.g., "Suggest a funnier caption" or "What makes a good hashtag?"</p>
                </div>
            ) : (
                messages.map((message, index) => (
                <div
                    key={index}
                    className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                >
                    <div
                    className={`max-w-md rounded-lg px-4 py-2 ${
                        message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                </div>
                ))
            )}
             {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-md rounded-lg px-4 py-2 bg-muted text-muted-foreground flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2"/>
                  <span>Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask for help or advice..."
            disabled={isLoading}
            className="flex-grow"
          />
          <Button type="submit" disabled={isLoading || !query.trim()} size="icon" aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
};
