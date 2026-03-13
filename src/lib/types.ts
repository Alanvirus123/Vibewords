
export type SongSuggestion = {
  title: string;
  artist: string;
  description: string;
};

export type MediaSuggestions = Record<string, string[]>;
export type SongSuggestionsMap = Record<string, SongSuggestion[]>;
export type LanguageOption = { value: string; label: string };
export type SocialPlatform = 'Instagram' | 'TikTok' | 'LinkedIn' | 'X' | 'Facebook' | 'Threads' | 'Pinterest' | 'YouTube' | 'WhatsApp';
