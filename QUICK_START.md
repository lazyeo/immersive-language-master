# Quick Start Guide

## Immediate Testing (No Icons)

If you want to test the extension immediately without creating icon files:

1. **Rename manifest files:**
   ```bash
   mv manifest.json manifest-with-icons.json
   mv manifest-no-icons.json manifest.json
   ```

2. **Load in Chrome:**
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked" and select this folder

3. **Test immediately:**
   - Extension icon will appear (default Chrome icon)
   - Click to open popup and take vocabulary test
   - Go to YouTube and test subtitle filtering

## With Icons (Recommended)

### Create Simple Icon Files:

**Option 1: Use online icon generators**
- Go to https://favicon.io/ or similar
- Create simple 🎧 or 📚 emoji icons
- Download 16x16, 48x48, and 128x128 sizes
- Save as `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`

**Option 2: Use placeholder images**
```bash
mkdir icons
# Create colored squares as placeholder icons
# Use any image editor to create simple 16x16, 48x48, 128x128 PNG files
```

## Testing Checklist

### ✅ Basic Setup
- [ ] Extension loads without errors
- [ ] Popup opens when clicking extension icon
- [ ] Vocabulary assessment works
- [ ] Settings can be changed

### ✅ YouTube Testing  
- [ ] Go to any English YouTube video
- [ ] Enable captions/subtitles
- [ ] Extension filters subtitles (shows some words as "___")
- [ ] Highlighted words show translation on hover
- [ ] Words are added to learning list

### ✅ Netflix Testing
- [ ] Go to Netflix (requires subscription)
- [ ] Play English content with subtitles
- [ ] Subtitle filtering works
- [ ] Translation hover works

### ✅ Learning Features
- [ ] Review words in popup
- [ ] Pronunciation works (requires audio permissions)
- [ ] Progress tracking updates
- [ ] Settings are saved between sessions

## Common First-Time Issues

### Extension Won't Load
```
Error: Could not load icon 'icons/icon16.png'
```
**Solution:** Use `manifest-no-icons.json` version

### Subtitles Not Filtered
```
Console: "COCA word data loaded: 100 words"
```
**Solution:** This is normal - extension is working

### No Translation on Hover
```
Shows: "[word的中文释义]"
```
**Solution:** This is expected - using placeholder translations

## Expected Behavior

### Vocabulary Assessment
- 25 random words from different difficulty levels
- Calculates vocabulary level (1000-5000+ words)
- Saves result for subtitle filtering

### Subtitle Filtering
- Words within your level → hidden as "___"
- Words above your level → shown and highlighted
- Hover shows placeholder Chinese translation
- Words added to learning list automatically

### Learning Progress
- Learning words counter increases as you watch
- Review words shows accumulated vocabulary
- Progress persists across browser sessions

## Next Steps

Once basic testing works:
1. Create proper icon files for better UI
2. Integrate real translation API
3. Expand COCA word database
4. Add more video platforms
5. Implement spaced repetition

## Troubleshooting

### Check Browser Console
```javascript
// Open DevTools (F12) and check for errors
// Look for messages like:
"English Listening Assistant: Initializing YouTube manager"
"COCA word data loaded: 100 words"
"Subtitle detected: [text]"
```

### Reset Extension Data
```javascript
// In browser console:
chrome.storage.local.clear()
// Reload extension to start fresh
```

### Test with Different Videos
- Try multiple YouTube videos
- Use videos with clear, slow English
- Verify subtitles are actually available
- Test with educational content (often has good subtitles)

## Performance Notes

- First load may be slower (loading COCA data)
- Subtitle processing happens in real-time
- Memory usage should be reasonable (<50MB)
- Works best with stable internet connection

Enjoy improving your English listening skills! 🎧📚