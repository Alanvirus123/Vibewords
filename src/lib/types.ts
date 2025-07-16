
export type MediaSuggestions = Record<string, string[]>;
export type LanguageOption = { value: string; label: string };

export interface HistoryEntry {
  id: string; // Unique ID, e.g., a timestamp
  timestamp: string; // ISO string for display
  mediaSrcs: string[];
  mediaType: "image" | "video" | "image_collection";
  suggestedCaptions: MediaSuggestions | null;
  suggestedSongs: MediaSuggestions | null;
  refinedCaptions: MediaSuggestions | null;
  refinedSongSuggestions: MediaSuggestions | null;
  captionFeedback: string;
  songFeedback: string;
  artistPreference: string;
  selectedLanguages: string[];
  selectedSongLanguages: string[];
}
