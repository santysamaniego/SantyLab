export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrls: string[];
  imageCaptions?: string[]; // Specific description for each image index
  techStack: string[];
  demoUrl?: string;
  createdAt: number;
  showInCarousel?: boolean;
  showInGrid?: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  isAdmin: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'admin' | 'ai' | 'system';
  text: string;
  timestamp: number;
  userName?: string; // For guest users
}

export interface ChatSession {
  id: string;
  userId?: string; // Null if guest
  guestName?: string; // Set if guest
  messages: ChatMessage[];
  lastUpdated: number;
  isReadByAdmin: boolean;
}

export enum AppState {
  LOADING,
  READY,
  ERROR
}