# Deployment Guide

## Vercel Deployment

This project is optimized for deployment on Vercel. Follow these steps:

### 1. Prepare for Deployment

```bash
# Ensure all dependencies are installed
npm install

# Run final build test
npm run build

# Commit all changes
git add .
git commit -m "Prepare for deployment"
```

### 2. Deploy to Vercel

#### Option A: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Option B: GitHub Integration
1. Push code to GitHub repository
2. Connect repository to Vercel dashboard
3. Configure build settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### 3. Environment Variables (Optional)

Add to Vercel environment variables:
- `NEXT_PUBLIC_GOOGLE_FONTS_API_KEY`: Your Google Fonts API key (optional)

### 4. Domain Configuration

- **Custom Domain**: Configure in Vercel dashboard
- **SSL**: Automatically provided by Vercel
- **CDN**: Global CDN included

## Build Optimization

### Performance Features
- **Static Optimization**: Pages pre-rendered at build time
- **Image Optimization**: Next.js automatic image optimization
- **Font Optimization**: Google Fonts with display=swap
- **Code Splitting**: Automatic by Next.js

### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer
```

## Testing Checklist

### Pre-Deployment Testing
- [x] Build succeeds without errors
- [x] All core features functional
- [x] Error boundaries work correctly
- [x] Mobile responsiveness (though desktop-focused)
- [x] Cross-browser compatibility

### Post-Deployment Testing
- [ ] Production URL accessible
- [ ] PNG upload works in production
- [ ] Google Fonts load correctly
- [ ] Export functionality works
- [ ] Autosave persists across sessions
- [ ] Performance metrics acceptable

## Monitoring

### Performance Metrics
- **Lighthouse Score**: Target 90+ for Performance
- **Core Web Vitals**: Monitor LCP, FID, CLS
- **Bundle Size**: Monitor JavaScript payload

### Error Tracking
- Browser console for client-side errors
- Vercel Analytics for performance monitoring
- Custom error boundaries capture React errors

## Rollback Strategy

If issues arise:
1. **Rollback via Vercel**: Use deployment history
2. **Hotfix**: Push critical fixes to trigger new deployment
3. **Maintenance Mode**: Temporary static page if needed

## Production Notes

- Google Fonts API works without key (with rate limits)
- localStorage works across all modern browsers
- Canvas API supported in all target browsers
- No server-side functionality required