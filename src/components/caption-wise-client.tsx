"use client";

import { useState, type ChangeEvent, useCallback } from "react";
import Image from "next/image";
import { UploadCloud, Copy, Wand2, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { suggestImageCaptions, type SuggestImageCaptionsInput, type SuggestImageCaptionsOutput } from "@/ai/flows/suggest-image-captions";
import { refineCaptionSuggestions, type RefineCaptionSuggestionsInput, type RefineCaptionSuggestionsOutput } from "@/ai/flows/refine-caption-suggestions";
import { ThemeToggle } from "@/components/theme-toggle";

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function CaptionWiseClient() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [suggestedCaptions, setSuggestedCaptions] = useState<string[]>([]);
  const [refinedCaptions, setRefinedCaptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>("");
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);

  const { toast } = useToast();

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSuggestedCaptions([]);
      setRefinedCaptions([]);
      setFeedback("");
      setImageFile(file);
      const dataUri = await fileToDataUri(file);
      setImageSrc(dataUri);
      await handleSuggestCaptions(dataUri);
    }
  };

  const handleSuggestCaptions = async (dataUri: string) => {
    setIsSuggesting(true);
    try {
      const input: SuggestImageCaptionsInput = { photoDataUri: dataUri };
      const result: SuggestImageCaptionsOutput = await suggestImageCaptions(input);
      setSuggestedCaptions(result.captions || []);
      if (!result.captions || result.captions.length === 0) {
        toast({ title: "No captions suggested", description: "The AI could not suggest captions for this image." });
      }
    } catch (error) {
      console.error("Error suggesting captions:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to suggest captions." });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleRefineCaptions = async () => {
    if (!imageFile || suggestedCaptions.length === 0 || !feedback) {
      toast({ variant: "destructive", title: "Error", description: "Missing image, initial captions, or feedback for refinement." });
      return;
    }
    setIsRefining(true);
    try {
      const imageDescription = suggestedCaptions[0]; // Use first suggestion as proxy for image description
      const input: RefineCaptionSuggestionsInput = {
        imageDescription,
        initialCaptions: suggestedCaptions,
        userFeedback: feedback,
      };
      const result: RefineCaptionSuggestionsOutput = await refineCaptionSuggestions(input);
      setRefinedCaptions(result.refinedCaptions || []);
      if (!result.refinedCaptions || result.refinedCaptions.length === 0) {
        toast({ title: "No captions refined", description: "The AI could not refine captions based on your feedback." });
      } else {
        toast({ title: "Captions Refined!", description: "New captions generated based on your feedback." });
      }
    } catch (error) {
      console.error("Error refining captions:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to refine captions." });
    } finally {
      setIsRefining(false);
    }
  };

  const handleCopyCaption = (caption: string) => {
    navigator.clipboard.writeText(caption)
      .then(() => toast({ title: "Copied!", description: "Caption copied to clipboard." }))
      .catch(() => toast({ variant: "destructive", title: "Error", description: "Failed to copy caption." }));
  };

  const CaptionDisplayCard: React.FC<{ caption: string }> = ({ caption }) => (
    <div className="p-3 border rounded-md bg-card flex justify-between items-center gap-2 shadow-sm">
      <p className="text-sm text-card-foreground flex-grow">{caption}</p>
      <Button variant="ghost" size="icon" onClick={() => handleCopyCaption(caption)} aria-label="Copy caption">
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center antialiased font-sans">
      <header className="w-full flex justify-between items-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-[hsl(var(--app-title))]">CaptionWise</h1>
        <ThemeToggle />
      </header>

      <main className="w-full max-w-2xl flex flex-col gap-8 items-center">
        <Card className="w-full shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
              <UploadCloud className="h-6 w-6 text-primary" />
              1. Upload Your Image
            </CardTitle>
            <CardDescription>Select an image from your device to get caption suggestions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              id="imageUpload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {imageSrc && (
              <div className="mt-6 border rounded-lg overflow-hidden shadow-md">
                <Image src={imageSrc} alt="Uploaded preview" width={600} height={400} className="w-full h-auto object-contain" data-ai-hint="uploaded image" />
              </div>
            )}
          </CardContent>
        </Card>

        {isSuggesting && (
          <Card className="w-full shadow-lg rounded-xl">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground">Generating captions...</p>
            </CardContent>
          </Card>
        )}

        {!isSuggesting && suggestedCaptions.length > 0 && (
          <Card className="w-full shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                <Wand2 className="h-6 w-6 text-primary" />
                2. AI-Suggested Captions
              </CardTitle>
              <CardDescription>Here are some captions suggested by our AI. Copy your favorite or refine them!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestedCaptions.map((caption, index) => (
                <CaptionDisplayCard key={`suggested-${index}`} caption={caption} />
              ))}
            </CardContent>
            <CardFooter className="flex-col items-start gap-4 pt-6 border-t">
              <Label htmlFor="refineFeedback" className="font-semibold text-md">Refine Suggestions:</Label>
              <Textarea
                id="refineFeedback"
                placeholder="Your feedback (e.g., 'make it funnier', 'more professional', 'add emojis')"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[80px]"
              />
              <Button onClick={handleRefineCaptions} disabled={isRefining || !feedback} className="w-full sm:w-auto">
                {isRefining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refine Captions
              </Button>
            </CardFooter>
          </Card>
        )}

        {isRefining && (
           <Card className="w-full shadow-lg rounded-xl">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground">Refining captions...</p>
            </CardContent>
          </Card>
        )}
        
        {!isRefining && refinedCaptions.length > 0 && (
          <Card className="w-full shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                <SparklesIcon className="h-6 w-6 text-primary" />
                Refined Captions
              </CardTitle>
              <CardDescription>Here are the captions refined based on your feedback.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {refinedCaptions.map((caption, index) => (
                <CaptionDisplayCard key={`refined-${index}`} caption={caption} />
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

// SparklesIcon - using inline SVG as it's not in lucide-react's default export
const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2L9.17 8.17L2 10l6.17 4.83L6.83 22L12 17.33L17.17 22l-1.5-7.17L22 10l-7.17-1.17L12 2z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

// Label component for use with Textarea
// Using a simple label to avoid Form context complexity for this single use case
const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ children, ...props }) => (
  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" {...props}>
    {children}
  </label>
);
