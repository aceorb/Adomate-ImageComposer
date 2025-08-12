# Adomate - Image Text Composer

A professional, desktop-only image text overlay editor built with Next.js and TypeScript. Create stunning text overlays on PNG images with advanced typography controls, real-time editing, and seamless export functionality.

![Adomate Screenshot](https://via.placeholder.com/800x400/f3f4f6/374151?text=Adomate+Screenshot)

## ✨ Features

### Core Functionality
- **PNG Image Upload**: Drag & drop or click to upload PNG images with aspect ratio preservation
- **Advanced Text Editor**: Create multiple text layers with comprehensive typography controls
- **Real-time Canvas**: Interactive editing with Fabric.js-powered canvas
- **Export System**: Download designs as PNG with original image dimensions preserved

### Typography Controls
- **50+ Google Fonts**: Extensive font library with instant loading
- **Text Properties**: Font size, weight, color, opacity, alignment
- **Multi-line Support**: Line breaks with adjustable line height
- **Advanced Features**: Letter spacing and text shadows

### Professional Tools
- **Layer Management**: Reorder, duplicate, and delete text layers
- **Transform Controls**: Drag, resize, rotate with visual handles
- **Undo/Redo**: 25-step history with keyboard shortcuts (Ctrl+Z/Ctrl+Y)
- **Snap & Nudge**: Arrow key nudging (1px/10px) with snap-to-center guides

### User Experience
- **Autosave**: Automatic localStorage backup every 2 seconds
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Loading States**: Visual indicators for all async operations
- **Keyboard Shortcuts**: Power-user friendly with intuitive controls

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd adomate_nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional)
   ```bash
   # Create .env.local for Google Fonts API key (optional)
   echo "NEXT_PUBLIC_GOOGLE_FONTS_API_KEY=your_api_key_here" > .env.local
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production
```bash
npm run build
npm run start
```

## 🏗️ Architecture

### Technology Stack
- **Framework**: Next.js 15 with TypeScript
- **Canvas**: Fabric.js 6.7 for interactive editing
- **Styling**: Tailwind CSS 4 for responsive design
- **Icons**: Lucide React for consistent iconography
- **Fonts**: Google Fonts API integration

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with error boundary
│   ├── page.tsx           # Main editor interface
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ImageUpload.tsx    # PNG upload with validation
│   ├── CanvasEditor.tsx   # Fabric.js canvas wrapper
│   ├── TextToolsPanel.tsx # Typography controls
│   ├── LayersPanel.tsx    # Layer management
│   ├── HistoryPanel.tsx   # Undo/redo interface
│   ├── ExportPanel.tsx    # PNG export functionality
│   ├── AutosaveIndicator.tsx # Autosave status
│   ├── ErrorBoundary.tsx  # Error handling
│   └── LoadingOverlay.tsx # Loading states
├── hooks/                 # Custom React hooks
│   ├── useGoogleFonts.ts  # Font loading logic
│   ├── useCanvasHistory.ts # History management
│   └── useLocalStorage.ts # Persistent storage
├── types/                 # TypeScript definitions
│   ├── index.ts          # Core interfaces
│   └── fabric.d.ts       # Fabric.js extensions
└── utils/                # Utility functions
```

### Key Design Decisions

#### Canvas Architecture
- **Fabric.js Integration**: Chose Fabric.js for robust canvas manipulation with built-in transform controls
- **State Synchronization**: Two-way binding between React state and Fabric.js objects
- **Event Handling**: Custom event system for seamless canvas-React communication

#### State Management
- **Local State**: React useState for UI state and text layer management  
- **History System**: Custom undo/redo with 25-step circular buffer
- **Persistence**: localStorage integration with automatic backup/restore

#### Performance Optimizations
- **Font Loading**: Lazy-loaded Google Fonts with caching
- **Canvas Rendering**: Optimized re-renders with Fabric.js requestRenderAll
- **Image Processing**: Client-side PNG export maintaining original dimensions

## 📋 Usage Guide

### Basic Workflow
1. **Upload Image**: Drag & drop a PNG file or click to browse
2. **Add Text**: Click "Add Text Layer" to create editable text
3. **Customize**: Use the text tools panel to adjust typography
4. **Transform**: Drag, resize, or rotate text with handles
5. **Layer Management**: Reorder layers in the layers panel
6. **Export**: Click "Export as PNG" to download your design

### Keyboard Shortcuts
- `Ctrl+Z` / `Cmd+Z`: Undo
- `Ctrl+Y` / `Cmd+Y`: Redo  
- `Arrow Keys`: Nudge selected object by 1px
- `Shift + Arrow Keys`: Nudge selected object by 10px

### Advanced Features
- **Text Shadows**: Enable in Advanced Features section with customizable blur, offset, and color
- **Letter Spacing**: Fine-tune character spacing from -5px to +20px
- **Multi-line Text**: Use Enter key in text content for line breaks

## ⚠️ Known Limitations

### Technical Constraints
- **Desktop Only**: Optimized for desktop browsers, no mobile/touch support
- **PNG Only**: Currently supports PNG format for upload and export
- **Browser Compatibility**: Requires modern browser with Canvas support

### Feature Limitations  
- **Font Upload**: Custom font upload not implemented (uses Google Fonts only)
- **Layer Effects**: Limited to text shadows (no gradients, patterns, or advanced effects)
- **Multi-select**: Single object selection only
- **Collaboration**: No real-time collaboration or cloud sync

### Performance Notes
- Large images (>5MB) may cause slower rendering
- Complex text with multiple shadows may impact export speed
- History is limited to browser session (no cross-session persistence)

## 🎯 Bonus Features Implemented

✅ **Text Shadow**: Customizable color, blur, and offset controls  
✅ **Letter Spacing**: Precise character spacing adjustment  
✅ **Enhanced UI**: Advanced features panel with collapsible sections  
✅ **Error Handling**: Comprehensive error boundaries and user feedback  
✅ **Loading States**: Visual indicators throughout the application

### Potential Future Enhancements
- Custom font upload (TTF/OTF/WOFF)
- Multi-select with group transforms
- Smart spacing hints between layers
- Curved text along paths
- Layer lock/unlock functionality
- Advanced export options (JPEG, SVG)

## 🧪 Testing

### Manual Testing Checklist
- [ ] PNG upload with various file sizes and dimensions
- [ ] Text layer creation, editing, and deletion
- [ ] Transform controls (drag, resize, rotate)
- [ ] Undo/redo functionality
- [ ] Export with original image dimensions
- [ ] Browser refresh preserves design (autosave)
- [ ] Error handling for invalid files
- [ ] Keyboard shortcuts work correctly

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 📄 License

This project is part of the Adomate coding assignment. All rights reserved.

## 🤝 Contributing

This is a coding challenge submission. For feedback or questions, please contact the development team.

---

**Built with ❤️ using Next.js, TypeScript, and Fabric.js**