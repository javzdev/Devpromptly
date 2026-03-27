export interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  role: 'user' | 'moderator' | 'admin';
  isActive: boolean;
  favorites: string[];
  stats: {
    promptsCreated: number;
    totalRatings: number;
    averageRating: number;
  };
  preferences?: {
    showNSFW: boolean;
  };
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  prompts?: Prompt[];
}

export interface Prompt {
  _id: string;
  title: string;
  description: string;
  prompt: string;
  category: PromptCategory;
  aiTool: AITool;
  tags: string[];
  isNSFW: boolean;
  images?: string[];
  author: User | string;
  ratings: {
    average: number;
    count: number;
    distribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
  favorites: number;
  views: number;
  status: 'pending' | 'approved' | 'rejected';
  featured: boolean;
  moderatedBy?: User | string;
  moderatedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type PromptCategory = 
  | 'text-generation'
  | 'image-generation'
  | 'code-generation'
  | 'audio-generation'
  | 'video-generation'
  | 'data-analysis'
  | 'translation'
  | 'other';

export type AITool =
  // Text & Chat
  | 'ChatGPT' | 'Claude' | 'Gemini' | 'Grok' | 'Perplexity' | 'Llama' | 'Mistral' | 'DeepSeek'
  // Image
  | 'Midjourney' | 'DALL-E' | 'Stable Diffusion' | 'Flux' | 'Firefly' | 'Ideogram' | 'Leonardo AI'
  // Code
  | 'GitHub Copilot' | 'Cursor' | 'CodeLlama' | 'Tabnine' | 'Codeium'
  // Writing & Marketing
  | 'Jasper' | 'Copy.ai' | 'Writesonic'
  // Video & Audio
  | 'Sora' | 'Runway' | 'ElevenLabs' | 'Udio' | 'Suno'
  // Other
  | 'Other';

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  [key: string]: T[] | any;
  prompts?: T[];
  users?: T[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

export interface SearchFilters {
  category?: PromptCategory;
  aiTool?: AITool;
  search?: string;
  sort?: 'newest' | 'rating' | 'favorites' | 'views';
  featured?: boolean;
  page?: number;
  limit?: number;
}

export interface AdminStats {
  pendingPrompts: number;
  approvedPrompts: number;
  rejectedPrompts: number;
  activeUsers: number;
  inactiveUsers: number;
  avgRating: number;
  totalUsers?: number;
  totalPrompts?: number;
  recentActivity: {
    prompts: any[];
    users: any[];
  };
}

export interface CreatePromptData {
  title: string;
  description: string;
  prompt: string;
  category: PromptCategory;
  aiTool: AITool;
  tags: string[];
}
