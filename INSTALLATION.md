# Installation and Testing Guide

**Version**: 1.1.0 (Improved)  
**Last Updated**: 2024-12-19  
**Status**: Ready for production use

## Prerequisites

- Google Chrome browser (version 88 or higher)
- Basic understanding of Chrome extension loading
- For Netflix: Active Netflix subscription (for testing Netflix features)

## Installation Steps

### 1. Prepare the Extension Files

Ensure you have all the required files in your extension directory:

```
english-listening-assistant/
├── manifest.json                   # v1.1.0 Improved
├── background.js                   # Service worker
├── popup/
│   ├── popup.html                  # Interface structure
│   ├── popup.js                    # Assessment & settings
│   └── popup-improved.css          # Modern green theme
├── content-scripts/
│   ├── youtube-improved.js         # YouTube processor (active)
│   ├── netflix-improved.js         # Netflix processor (active)
│   └── subtitle-overlay.js         # Common utilities
├── data/
│   ├── coca-5000.json             # 5000 COCA frequency words
│   └── assessment-words.json       # 55 assessment words
├── styles/
│   └── overlay-improved.css        # Subtitle styling (active)
└── docs/                          # Project documentation
    ├── PROJECT_OVERVIEW.md        # Architecture guide
    └── DEVELOPMENT_PLAN.md        # Development workflow
```

**Note**: The current version (v1.1.0) uses the `-improved` files as the active implementation.

### 2. Current Version Status

**✅ Ready to Use**: The current `manifest.json` is already configured for v1.1.0 Improved.

**📁 File Versions**:
- **Active**: `manifest.json` (v1.1.0) - Uses improved scripts and styles
- **Legacy**: Various backup versions available for reference

**🖼️ Icons**: The extension currently works without custom icons (uses Chrome defaults)

### 3. Load the Extension

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked" button
5. Select the extension directory folder
6. The extension should appear in your extensions list

### 4. Verify Installation

- Look for the extension icon in the Chrome toolbar
- Click the icon to open the popup interface
- Check for any error messages in the Chrome DevTools console

## Testing the Extension

### 1. Initial Setup Test

1. **Click the extension icon**
   - The popup should open showing the vocabulary assessment section
   - Current level should show "Not Assessed"

2. **Take the vocabulary test**
   - Click "Take Vocabulary Test"
   - You should see 25 vocabulary questions
   - Progress bar should update as you answer questions
   - After completion, your vocabulary level should be displayed

### 2. YouTube Testing

1. **Go to YouTube** (youtube.com)
2. **Play an English video with subtitles**
   - Enable captions/subtitles if not already on
   - The extension should detect subtitles automatically
3. **Verify subtitle filtering**
   - Unknown words should be highlighted
   - Known words should be replaced with "___"
   - Hover over highlighted words to see translations

### 3. Netflix Testing

1. **Go to Netflix** (netflix.com)
2. **Play an English video with subtitles**
   - Enable subtitles in the video player
3. **Verify subtitle filtering works**
   - Similar behavior to YouTube
   - Extension should handle Netflix's dynamic content

### 4. Settings Testing

1. **Open extension popup**
2. **Test different settings:**
   - Toggle translation hover on/off
   - Change subtitle font size (small/medium/large)
   - Change subtitle position (top/center/bottom)
3. **Verify changes take effect immediately**

## Troubleshooting

### Common Issues

#### Extension Won't Load
- **Check file paths**: Ensure all referenced files exist
- **Check manifest.json**: Validate JSON syntax
- **Check permissions**: Ensure host permissions are correct

#### Subtitles Not Detected
- **Check console**: Open DevTools and look for error messages
- **Verify subtitle selectors**: YouTube/Netflix may have changed their HTML structure
- **Test with different videos**: Some videos may not have subtitles

#### Vocabulary Assessment Not Working
- **Check data files**: Ensure `assessment-words.json` is properly formatted
- **Check fetch permissions**: Data files need to be accessible to the extension

#### Translation Hover Not Working
- **Check event listeners**: Ensure mouse events are properly attached
- **Check CSS**: Verify tooltip styling is applied

### Debug Mode

1. **Open Chrome DevTools** (F12)
2. **Check Console tab** for JavaScript errors
3. **Check Network tab** for failed resource loading
4. **Use Sources tab** to debug content scripts

### Extension Permissions

The extension requires these permissions:
- `storage`: To save user preferences and vocabulary progress
- `activeTab`: To interact with the current tab
- `scripting`: To inject content scripts
- Host permissions for YouTube and Netflix domains

## Advanced Testing

### Performance Testing
- Test with long videos to ensure memory usage is reasonable
- Test rapid subtitle changes to verify performance
- Monitor CPU usage during subtitle processing

### Cross-Platform Testing
- Test on different operating systems (Windows, macOS, Linux)
- Test with different screen resolutions
- Test with different Chrome versions

### Edge Cases
- Test with videos that have no subtitles
- Test with non-English subtitles
- Test with very fast or very slow subtitle display
- Test navigation between different videos

## Known Limitations

1. **Icon Files**: Currently using placeholder references - real icons needed for production
2. **Translation API**: Currently using placeholder translations - real API integration needed
3. **Subtitle Selectors**: May need updates if YouTube/Netflix change their HTML structure
4. **Performance**: Large vocabulary comparisons may be slow on older devices

## Next Steps for Production

1. Create proper icon files (16x16, 48x48, 128x128 pixels)
2. Integrate with a real translation API (Google Translate, etc.)
3. Add error handling for network failures
4. Implement caching for better performance
5. Add user feedback mechanisms
6. Consider publishing to Chrome Web Store

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all files are present and properly formatted
3. Test with a clean Chrome profile
4. Check Chrome version compatibility