
export type MediaSuggestions = Record<string, string[]>;
export type LanguageOption = { value: string; label: string };

export interface StoredUserDetails {
  name: string;
  email: string;
  phone: string;
}

export interface GenerationHistoryItem {
    id: string;
    userEmail: string;
    timestamp: string; // ISO string
    mediaSrcs: string[];
    mediaType: 'image' | 'video' | 'image_collection';
    vibe: string | null;
    suggestions: {
      captions: MediaSuggestions | null;
      songs: MediaSuggestions | null;
      hashtags: MediaSuggestions | null;
    };
  }
