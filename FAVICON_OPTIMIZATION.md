# Favicon Optimization Instructions

The favicon.png file is currently 317 KiB, which is too large. To optimize it:

## Steps to Optimize:

1. **Resize the image**: The favicon is displayed at maximum 112x112px, but the source is 1024x1024px. Resize to 256x256px or 128x128px.

2. **Convert to WebP format** (recommended):
   - Use an online tool like https://squoosh.app/ or https://convertio.co/
   - Or use ImageMagick: `magick favicon.png -resize 256x256 favicon.webp`
   - Or use Sharp (Node.js): `sharp('favicon.png').resize(256, 256).webp().toFile('favicon.webp')`

3. **Optimize PNG** (if keeping PNG format):
   - Use tools like TinyPNG, ImageOptim, or pngquant
   - Target size: < 20 KiB

4. **Update the code** to use the optimized image:
   - Replace `/favicon.png` with `/favicon.webp` in:
     - `src/pages/Landing.tsx`
     - `src/components/ui/footer-section.tsx`
     - `src/components/AppLayout.tsx`
     - `index.html` (favicon links)

5. **Create multiple sizes** for better performance:
   - favicon-16.png (16x16)
   - favicon-32.png (32x32)
   - favicon-64.png (64x64)
   - favicon-128.png (128x128)
   - favicon-256.png (256x256)

6. **Use srcset** for responsive images:
   ```html
   <img 
     src="/favicon-64.png" 
     srcset="/favicon-32.png 32w, /favicon-64.png 64w, /favicon-128.png 128w"
     sizes="(max-width: 640px) 32px, (max-width: 1024px) 48px, 56px"
     alt="Resbonder Logo"
   />
   ```

## Quick Fix (Manual):

1. Open `public/favicon.png` in an image editor
2. Resize to 256x256px
3. Export as WebP with 80% quality
4. Replace the file in `public/` directory
5. Update references in code if needed

## Expected Results:

- File size: < 20 KiB (down from 317 KiB)
- Format: WebP (better compression)
- Display size: Matches actual rendered size
- Performance: Faster page load, better LCP score

