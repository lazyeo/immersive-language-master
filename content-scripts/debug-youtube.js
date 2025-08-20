// Debug version of YouTube content script
console.log('🎧 ELA Debug: YouTube script loaded');

// Simple test to verify script injection
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎧 ELA Debug: DOM loaded');
    
    // Add a visible indicator that the script is working
    const indicator = document.createElement('div');
    indicator.id = 'ela-debug-indicator';
    indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #ff0000;
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 10000;
        font-size: 12px;
        font-family: Arial, sans-serif;
    `;
    indicator.textContent = '🎧 ELA Active (Debug)';
    document.body.appendChild(indicator);
    
    console.log('🎧 ELA Debug: Indicator added');
});

// Check for subtitles every 2 seconds
setInterval(() => {
    const subtitles = document.querySelectorAll('.ytp-caption-segment');
    const container = document.querySelector('.ytp-caption-window-container');
    
    console.log('🎧 ELA Debug: Subtitle check:', {
        segments: subtitles.length,
        container: !!container,
        url: window.location.href
    });
    
    if (subtitles.length > 0) {
        console.log('🎧 ELA Debug: Subtitle text:', Array.from(subtitles).map(s => s.textContent));
    }
}, 2000);

console.log('🎧 ELA Debug: Monitoring started');