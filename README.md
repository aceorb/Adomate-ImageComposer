# Adomate - Image Text Composer(Sebastian)

A professional image text overlay editor built with Next.js and Konva.js. Create stunning text compositions on PNG images with advanced typography controls, interactive transformations, and seamless export functionality.

## 🚀 Setup and Run Instructions

### Prerequisites
- Node.js 18+ and npm
- Modern web browser with Canvas support

### Installation & Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables** (optional)
   ```bash
   # Create .env.local for Google Fonts API key (optional for enhanced fonts)
   echo "NEXT_PUBLIC_GOOGLE_FONTS_API_KEY=your_api_key_here" > .env.local
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```
   Application will be available at [http://localhost:4000](http://localhost:4000)

4. **Build for production**
   ```bash
   npm run build
   npm run start
   ```

## Architecture

### Technology Stack & Trade-offs

#### **Canvas Framework: Konva.js**
- **Choice**: Konva.js + react-konva for canvas manipulation
- **Trade-offs**: 
  - **Pros**: Excellent performance, built-in transformations, comprehensive event system
  - **Cons**: SSR complexity (requires dynamic imports), larger bundle size than pure Canvas API
  - **Alternative considered**: Fabric.js (more features but heavier, harder React integration)

#### **Framework: Next.js 15**
- **Choice**: Next.js with App Router + TypeScript
- **Trade-offs**:
  - **Pros**: Type safety, modern React features, optimized builds
  - **Cons**: Konva SSR issues requiring client-side only components
  - **SSR Solution**: Dynamic imports with `ssr: false` for canvas components

#### **State Management: Local State + Custom Hooks**
- **Choice**: React useState + custom hooks instead of Redux/Zustand
- **Trade-offs**:
  - **Pros**: Simpler architecture, no external dependencies, easier debugging
  - **Cons**: More complex prop drilling, manual state synchronization
  - **Pattern**: Functional setState to prevent stale closure issues

#### **Typography: Google Fonts API**
- **Choice**: Google Fonts integration with dynamic loading
- **Trade-offs**:
  - **Pros**: 1000+ fonts, reliable CDN, automatic optimization
  - **Cons**: External dependency, requires internet connection
  - **Fallback**: System fonts when API unavailable

### Component Architecture

```
ImageTextComposer (Main Container)
├── LeftToolbar (Scrollable Sidebar)
│   ├── ImageUpload (PNG file handling)
│   ├── TextToolsPanel (Typography controls)
│   ├── LayersPanel (Layer management)
│   ├── HistoryPanel (Undo/redo)
│   ├── AutosaveIndicator (Save status)
│   └── ExportPanel (PNG export)
└── CanvasEditor (Konva canvas wrapper)
    ├── Background Image Layer
    ├── Text Nodes (interactive)
    └── Transformer (resize/rotate handles)
```

### State Flow
1. **React State** ↔ **Konva Canvas** (bidirectional sync)
2. **User Actions** → **State Updates** → **History Recording**
3. **Undo/Redo** → **History Restoration** → **Canvas Rebuild**
4. **Auto-save** → **localStorage** → **Mount Restoration**

## 🎯 Bonus Features Implemented

## ⚠️ Known Limitations

### Technical Constraints
- **Desktop Only**: No mobile/touch optimization (design choice for professional use)
- **PNG Format Only**: Single format support for upload/export simplicity
- **SSR Incompatible**: Canvas components require client-side rendering
- **Memory Usage**: Large images (>10MB) may impact performance

### Feature Scope
- **Single Selection**: No multi-select or group operations
- **Font Upload**: No custom font file support (Google Fonts only)
- **Layer Effects**: Limited to shadows (no gradients, patterns, or filters)
- **Collaboration**: No real-time editing or cloud sync

### Browser Requirements
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Canvas Support**: Requires HTML5 Canvas and modern JavaScript features
- **Local Storage**: Autosave requires localStorage support

**Built with Next.js 15, TypeScript, Konva.js, and Tailwind CSS**