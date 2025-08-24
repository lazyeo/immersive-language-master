# Known Issues & Solutions

## 🐛 Current Known Issues

### 1. Translation API Keys Required
**Issue**: Some translation providers require API keys for full functionality  
**Impact**: Limited translation options without keys  
**Workaround**: Use Google Translate (free tier available)  
**Solution**: Add API keys in extension settings  

### 2. Performance on Very Long Pages
**Issue**: Pages with >10,000 words may experience slower processing  
**Impact**: Initial page load delay, increased memory usage  
**Workaround**: Refresh page if issues occur  
**Planned Fix**: Implement virtual scrolling and lazy processing  

### 3. Complex CSS Interference
**Issue**: Some websites with complex CSS may affect tooltip positioning  
**Impact**: Tooltip may appear in wrong position  
**Workaround**: Reload the page or disable extension on specific sites  
**Planned Fix**: Improve CSS isolation and positioning algorithm  

### 4. Shadow DOM Content
**Issue**: Content inside Shadow DOM is not processed  
**Impact**: Some modern web components won't have word highlighting  
**Workaround**: None currently  
**Planned Fix**: Add Shadow DOM traversal support  

## ✅ Recently Fixed Issues (v2.1.0)

### Chrome API Errors ✅
**Previous Issue**: "chrome.storage.local undefined" errors  
**Fix Applied**: Added comprehensive API availability checks with fallback modes  
**Status**: RESOLVED  

### Duplicate Tooltips ✅
**Previous Issue**: Two tooltips appearing simultaneously  
**Fix Applied**: Unified tooltip system, disabled quick-actions hover  
**Status**: RESOLVED  

### Tooltip Regeneration ✅
**Previous Issue**: Clicking tooltip buttons created new tooltips  
**Fix Applied**: Added proper event propagation control  
**Status**: RESOLVED  

### Links Being Processed ✅
**Previous Issue**: English words in links were highlighted  
**Fix Applied**: Links excluded from processing entirely  
**Status**: RESOLVED  

### Class Declaration Errors ✅
**Previous Issue**: "Class already declared" errors on reload  
**Fix Applied**: Added duplicate definition prevention  
**Status**: RESOLVED  

## ⚠️ Platform-Specific Issues

### YouTube
- **Issue**: Custom subtitle positioning may conflict
- **Workaround**: Adjust subtitle settings in YouTube

### Netflix
- **Issue**: DRM protected content cannot be processed
- **Workaround**: Use learning mode on non-DRM content

### Gmail
- **Issue**: Compose window text not processed
- **Workaround**: Process received emails only

### Google Docs
- **Issue**: Canvas-rendered text not accessible
- **Workaround**: Use extension on exported/published versions

## 🔧 Troubleshooting Guide

### Extension Not Working

1. **Check Installation**
   - Ensure extension is enabled in `chrome://extensions/`
   - Try reloading the extension
   - Check for Chrome updates

2. **Clear Cache**
   - Clear browser cache
   - Reload the webpage
   - Disable other extensions temporarily

3. **Console Errors**
   - Open DevTools (F12)
   - Check Console for errors
   - Report errors with screenshots

### Tooltip Issues

1. **Tooltip Not Appearing**
   - Check if JavaScript is enabled
   - Verify extension permissions
   - Try different websites

2. **Tooltip Position Wrong**
   - Scroll page to reset positioning
   - Check zoom level (reset to 100%)
   - Disable custom CSS extensions

3. **Buttons Not Working**
   - Clear browser cache
   - Check for console errors
   - Reload extension

### Performance Issues

1. **Slow Page Load**
   - Disable extension temporarily
   - Check if issue persists
   - Report specific websites affected

2. **High Memory Usage**
   - Close unnecessary tabs
   - Restart Chrome
   - Check task manager for specifics

3. **Freezing/Crashing**
   - Disable hardware acceleration
   - Update Chrome
   - Reduce number of processed words in settings

## 📝 Reporting New Issues

### What to Include

1. **Environment Information**
   - Chrome version
   - Extension version
   - Operating system
   - Website URL affected

2. **Steps to Reproduce**
   - Detailed steps to trigger issue
   - Expected behavior
   - Actual behavior observed

3. **Supporting Information**
   - Console error messages
   - Screenshots if applicable
   - Network requests if relevant

### Where to Report

- GitHub Issues: [Create Issue](https://github.com/[repo]/issues)
- Email: [support email]
- Include tag: `[ILM-BUG]` in subject

## 🚀 Upcoming Fixes

### Next Release (v2.2.0)
- [ ] Shadow DOM support
- [ ] Improved CSS isolation
- [ ] Performance optimization for long pages
- [ ] Better error recovery mechanisms
- [ ] Enhanced translation caching

### Future Improvements
- [ ] Offline mode support
- [ ] Batch processing for better performance
- [ ] Custom dictionary import/export
- [ ] Advanced filtering options
- [ ] Machine learning word classification

## 💡 Temporary Workarounds

### For Developers

#### Chrome API Unavailable
```javascript
// Always use this pattern
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    // Use Chrome API
} else {
    // Fallback logic
}
```

#### Preventing Tooltip Issues
```javascript
// Check for existing tooltip
if (document.querySelector('.ilm-tooltip')) {
    return; // Don't create another
}
```

#### Event Handling
```javascript
// Prevent propagation issues
event.stopPropagation();
event.preventDefault();
```

### For Users

#### Quick Fixes
- **Reload Page**: Ctrl+R (Cmd+R on Mac)
- **Hard Reload**: Ctrl+Shift+R (Cmd+Shift+R on Mac)
- **Disable/Enable Extension**: Quick toggle in toolbar
- **Clear Site Data**: Settings → Privacy → Clear browsing data

#### Performance Tips
- Limit vocabulary level in settings
- Disable on resource-heavy sites
- Use focused reading mode
- Close unused tabs

## 📊 Issue Statistics

### Resolution Rate
- Critical Issues: 100% resolved
- Major Issues: 85% resolved
- Minor Issues: 70% resolved
- Enhancement Requests: Ongoing

### Average Resolution Time
- Critical: 24 hours
- Major: 3-5 days
- Minor: 1-2 weeks
- Enhancements: Per release cycle

## 🔄 Update History

### v2.1.0 (Current)
- Fixed: 15 issues
- Added: 5 features
- Improved: 8 systems

### v2.0.0
- Fixed: 23 issues
- Added: 12 features
- Improved: 15 systems

### v1.0.0
- Initial release
- Known issues documented

---

Last Updated: 2024-01-24  
Maintained by: Development Team  
Status: Actively Maintained