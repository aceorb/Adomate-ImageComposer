export interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  opacity: number;
  alignment: 'left' | 'center' | 'right';
  rotation: number;
  scaleX: number;
  scaleY: number;
  zIndex: number;
  lineHeight: number;
  // Bonus features
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  letterSpacing?: number;
}

export interface CanvasState {
  backgroundImage: string | null;
  textLayers: TextLayer[];
  canvasWidth: number;
  canvasHeight: number;
}

export interface HistoryState {
  states: CanvasState[];
  currentIndex: number;
}

export interface GoogleFont {
  family: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: Record<string, string>;
}

export interface GoogleFontsResponse {
  kind: string;
  items: GoogleFont[];
}