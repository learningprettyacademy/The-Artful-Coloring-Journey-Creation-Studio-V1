export type PublicationSize = 'Square (12x12)' | 'Portrait (8.5x11)' | 'Landscape (11x8.5)' | 'Custom';

export interface WizardState {
  productType: string;
  theme: string;
  targetAudience: string;
  artStyle: string;
  publicationSize: PublicationSize;
  customDimensions?: string;
  generateImagesNow: boolean;
}

export enum AppStep {
  WELCOME = 0,
  PRODUCT_TYPE = 1,
  THEME = 2,
  AUDIENCE = 3,
  STYLE = 4,
  SIZE = 5,
  DASHBOARD = 6
}

export interface GeneratedPage {
  id: string;
  name: string;
  description: string;
  imagePrompt: string;
  isCover: boolean;
  renderMode?: 'color' | 'line_art'; // New field to strictly control output style
}

export interface ProjectPlan {
  projectTitle: string;
  concept: string;
  colorPaletteSuggestions: string[];
  pages: GeneratedPage[];
  monetizationStrategies: string[];
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  type: 'cover' | 'coloring_page' | 'sticker' | 'divider' | 'mockup';
  loading: boolean;
  aspectRatio?: "1:1" | "3:4" | "4:3" | "16:9" | "9:16";
}

export interface SavedProject {
  id: string;
  timestamp: number;
  wizardState: WizardState;
  plan: ProjectPlan;
  images: GeneratedImage[];
  pages: GeneratedPage[];
}

export type AppView = 'dashboard' | 'mockups' | 'prompts' | 'library' | 'projects';