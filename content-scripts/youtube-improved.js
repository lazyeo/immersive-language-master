// English Listening Assistant - YouTube Content Script (Improved Version)
console.log('🎧 ELA: YouTube script starting...');

class YouTubeSubtitleManager {
    constructor() {
        this.isActive = false;
        this.isExtensionEnabled = true; // Extension toggle state
        this.vocabularyLevel = 3000;
        this.settings = {};
        this.currentSubtitles = [];
        this.unknownWords = new Set();
        this.knownWords = new Set();
        this.observer = null;
        this.lastSubtitleText = '';
        this.lastSubtitleTime = 0;
        this.cocaWords = null;
        this.customSubtitleContainer = null;
        
        // Independent subtitle system
        this.independentSubtitles = null;
        this.subtitleTrackUrl = null;
        this.currentVideoId = null;
        this.isUsingIndependentSubtitles = false;
        this.independentSyncInterval = null;
        this.lastIndependentSubtitle = null;
        
        // Immersive mode system
        this.isImmersiveModeActive = false;
        this.immersiveOverlay = null;
        this.immersiveToolbar = null;
        this.immersiveStats = null;
        this.immersiveDictionary = null;
        this.immersiveTimer = null;
        
        // Advanced learning statistics
        this.sessionStartTime = null;
        this.sessionWordsEncountered = new Set();
        this.sessionWordsLearned = new Set();
        this.dailyStats = {
            wordsEncountered: 0,
            wordsLearned: 0,
            studyTime: 0,
            lastUpdated: new Date().toDateString()
        };
        
        // Sidebar mode system
        this.sidebarMode = false;
        this.sidebarElement = null;
        this.sidebarToggleButton = null;
        this.subtitleTimeline = [];
        this.currentSubtitleIndex = -1;
        
        console.log('🎧 ELA: YouTube manager constructed');
        this.initializeManager();
    }

    async initializeManager() {
        console.log('🎧 ELA: Initializing YouTube manager');
        
        try {
            await this.loadSettings();
            await this.loadCocaData();
            await this.loadDailyStats();
            
            console.log('🎧 ELA: Settings loaded:', this.settings);
            
            // Research independent subtitle access
            this.researchSubtitleAccess();
            
            this.addDebugIndicator();
            this.startWatching();
            this.setupNavigationListener();
            
            // Check for immersive mode activation
            this.checkImmersiveModeActivation();
            
            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Initialize sidebar
            this.initializeSidebar();
            
            chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
            
            // Setup sidebar communication
            this.setupSidebarCommunication();
            
            // Listen for window messages as backup communication
            window.addEventListener('message', (event) => {
                if (event.source === window && event.data.type === 'ELA_TOGGLE_EXTENSION') {
                    this.handleMessage({
                        type: 'TOGGLE_EXTENSION',
                        enabled: event.data.enabled
                    });
                }
            });
            
            console.log('🎧 ELA: YouTube manager initialized successfully');
        
        // Perform compatibility check
        this.performCompatibilityCheck();
        } catch (error) {
            console.error('🎧 ELA: Error initializing manager:', error);
            this.showNotification('ELA初始化失败，请刷新页面重试', 'error');
        }
    }

    researchSubtitleAccess() {
        console.log('🔬 ELA: Researching independent subtitle access methods...');
        
        // Method 1: Check YouTube's global data objects
        if (window.ytInitialData) {
            console.log('🔬 ELA: Found ytInitialData');
            this.analyzeYouTubeData(window.ytInitialData);
        }
        
        if (window.ytInitialPlayerResponse) {
            console.log('🔬 ELA: Found ytInitialPlayerResponse');
            this.analyzePlayerResponse(window.ytInitialPlayerResponse);
        }
        
        // Method 2: Monitor network requests (would need webRequest permission)
        console.log('🔬 ELA: Network request interception would require additional permissions');
        
        // Method 3: Check if video element has accessible track information
        const video = document.querySelector('video');
        if (video) {
            console.log('🔬 ELA: Video element found, checking tracks:', video.textTracks.length);
            for (let i = 0; i < video.textTracks.length; i++) {
                const track = video.textTracks[i];
                console.log(`🔬 ELA: Track ${i}:`, {
                    kind: track.kind,
                    label: track.label,
                    language: track.language,
                    mode: track.mode,
                    cues: track.cues ? track.cues.length : 'null'
                });
            }
        }
    }

    analyzeYouTubeData(data) {
        try {
            // Look for subtitle-related data in YouTube's initial data
            const searchForSubtitles = (obj, path = '') => {
                if (!obj || typeof obj !== 'object') return;
                
                for (const key in obj) {
                    if (typeof key === 'string' && 
                        (key.toLowerCase().includes('caption') || 
                         key.toLowerCase().includes('subtitle') ||
                         key.toLowerCase().includes('timedtext'))) {
                        console.log(`🔬 ELA: Found subtitle-related key at ${path}.${key}:`, obj[key]);
                    }
                    
                    if (typeof obj[key] === 'object' && path.split('.').length < 5) {
                        searchForSubtitles(obj[key], path ? `${path}.${key}` : key);
                    }
                }
            };
            
            searchForSubtitles(data);
        } catch (error) {
            console.log('🔬 ELA: Error analyzing YouTube data:', error);
        }
    }

    analyzePlayerResponse(response) {
        try {
            if (response.captions && response.captions.playerCaptionsTracklistRenderer) {
                const tracks = response.captions.playerCaptionsTracklistRenderer.captionTracks;
                console.log('🔬 ELA: Found caption tracks:', tracks?.length || 0);
                
                if (tracks) {
                    // Look for English subtitle track
                    const englishTrack = tracks.find(track => 
                        track.languageCode === 'en' || 
                        track.languageCode === 'en-US' ||
                        track.name?.simpleText?.toLowerCase().includes('english')
                    );
                    
                    if (englishTrack && englishTrack.baseUrl) {
                        console.log('🎯 ELA: Found English subtitle track:', englishTrack.name?.simpleText);
                        this.subtitleTrackUrl = englishTrack.baseUrl;
                        this.initializeIndependentSubtitles();
                    } else {
                        // Fallback to first available track
                        const firstTrack = tracks.find(track => track.baseUrl);
                        if (firstTrack) {
                            console.log('🎯 ELA: Using first available track:', firstTrack.name?.simpleText);
                            this.subtitleTrackUrl = firstTrack.baseUrl;
                            this.initializeIndependentSubtitles();
                        }
                    }
                    
                    tracks.forEach((track, index) => {
                        console.log(`🔬 ELA: Caption Track ${index}:`, {
                            languageCode: track.languageCode,
                            name: track.name?.simpleText,
                            baseUrl: track.baseUrl ? 'Available' : 'None'
                        });
                    });
                }
            }
        } catch (error) {
            console.log('🔬 ELA: Error analyzing player response:', error);
        }
    }

    async initializeIndependentSubtitles() {
        if (!this.subtitleTrackUrl) {
            console.log('🔬 ELA: No subtitle track URL available');
            return;
        }

        try {
            console.log('🔄 ELA: Fetching independent subtitles from:', this.subtitleTrackUrl);
            
            const response = await fetch(this.subtitleTrackUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const subtitleData = await response.text();
            console.log('✅ ELA: Successfully fetched subtitle data:', subtitleData.length, 'characters');
            
            // Parse subtitle data based on format
            this.independentSubtitles = this.parseSubtitleData(subtitleData);
            
            if (this.independentSubtitles && this.independentSubtitles.length > 0) {
                console.log('🎯 ELA: Parsed', this.independentSubtitles.length, 'subtitle entries');
                this.isUsingIndependentSubtitles = true;
                
                // Start monitoring video time for independent subtitles
                this.startIndependentSubtitleSync();
            } else {
                console.log('⚠️ ELA: Failed to parse subtitle data or no entries found');
            }
            
        } catch (error) {
            console.error('❌ ELA: Error fetching independent subtitles:', error);
            this.isUsingIndependentSubtitles = false;
        }
    }

    parseSubtitleData(data) {
        try {
            // Detect format by content
            if (data.includes('<transcript>')) {
                // YouTube SRV3 XML format
                return this.parseSRV3Format(data);
            } else if (data.includes('WEBVTT')) {
                // WebVTT format
                return this.parseWebVTTFormat(data);
            } else if (data.includes('<?xml')) {
                // Generic XML subtitle format
                return this.parseXMLFormat(data);
            } else {
                console.log('🔬 ELA: Unknown subtitle format, attempting generic parse');
                return this.parseGenericFormat(data);
            }
        } catch (error) {
            console.error('❌ ELA: Error parsing subtitle data:', error);
            return [];
        }
    }

    parseSRV3Format(data) {
        const subtitles = [];
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, 'text/xml');
            const textElements = xmlDoc.querySelectorAll('text');
            
            textElements.forEach(element => {
                const start = parseFloat(element.getAttribute('start')) || 0;
                const dur = parseFloat(element.getAttribute('dur')) || 0;
                const text = element.textContent?.trim();
                
                if (text && text.length > 0) {
                    subtitles.push({
                        start: start,
                        end: start + dur,
                        text: text.replace(/\n/g, ' ').trim()
                    });
                }
            });
            
            console.log('🔬 ELA: Parsed SRV3 format:', subtitles.length, 'entries');
        } catch (error) {
            console.error('❌ ELA: Error parsing SRV3 format:', error);
        }
        
        return subtitles.sort((a, b) => a.start - b.start);
    }

    parseWebVTTFormat(data) {
        const subtitles = [];
        try {
            const lines = data.split('\n');
            let currentEntry = null;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // Skip empty lines and headers
                if (!line || line.startsWith('WEBVTT') || line.startsWith('NOTE')) {
                    continue;
                }
                
                // Time code line (e.g., "00:00:01.000 --> 00:00:03.000")
                if (line.includes('-->')) {
                    const [startTime, endTime] = line.split('-->').map(t => t.trim());
                    currentEntry = {
                        start: this.parseTimeCode(startTime),
                        end: this.parseTimeCode(endTime),
                        text: ''
                    };
                } else if (currentEntry) {
                    // Text line
                    if (currentEntry.text) {
                        currentEntry.text += ' ';
                    }
                    currentEntry.text += line;
                    
                    // Check if next line is empty or another time code (end of entry)
                    if (i + 1 >= lines.length || !lines[i + 1].trim() || lines[i + 1].includes('-->')) {
                        if (currentEntry.text.trim()) {
                            subtitles.push(currentEntry);
                        }
                        currentEntry = null;
                    }
                }
            }
            
            console.log('🔬 ELA: Parsed WebVTT format:', subtitles.length, 'entries');
        } catch (error) {
            console.error('❌ ELA: Error parsing WebVTT format:', error);
        }
        
        return subtitles.sort((a, b) => a.start - b.start);
    }

    parseTimeCode(timeStr) {
        // Parse time code like "00:01:23.456" or "01:23.456"
        const parts = timeStr.split(':');
        let seconds = 0;
        
        if (parts.length === 3) {
            // HH:MM:SS.mmm
            seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
        } else if (parts.length === 2) {
            // MM:SS.mmm
            seconds = parseInt(parts[0]) * 60 + parseFloat(parts[1]);
        } else {
            // SS.mmm
            seconds = parseFloat(parts[0]);
        }
        
        return seconds;
    }

    parseXMLFormat(data) {
        const subtitles = [];
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, 'text/xml');
            
            // Try common XML subtitle element names
            const elements = xmlDoc.querySelectorAll('p, subtitle, text, caption');
            
            elements.forEach(element => {
                const text = element.textContent?.trim();
                if (!text) return;
                
                // Try to extract timing from various attribute names
                const startAttr = element.getAttribute('begin') || 
                                element.getAttribute('start') || 
                                element.getAttribute('t');
                const endAttr = element.getAttribute('end') || 
                              element.getAttribute('dur');
                
                if (startAttr) {
                    const start = parseFloat(startAttr) || 0;
                    let end = start + 3; // Default 3 second duration
                    
                    if (endAttr) {
                        end = element.getAttribute('end') ? parseFloat(endAttr) : start + parseFloat(endAttr);
                    }
                    
                    subtitles.push({
                        start: start,
                        end: end,
                        text: text.replace(/\n/g, ' ').trim()
                    });
                }
            });
            
            console.log('🔬 ELA: Parsed XML format:', subtitles.length, 'entries');
        } catch (error) {
            console.error('❌ ELA: Error parsing XML format:', error);
        }
        
        return subtitles.sort((a, b) => a.start - b.start);
    }

    parseGenericFormat(data) {
        console.log('🔬 ELA: Attempting generic parse of unknown format');
        // For unknown formats, just log the first 500 characters for analysis
        console.log('🔬 ELA: Data sample:', data.substring(0, 500));
        return [];
    }

    startIndependentSubtitleSync() {
        if (this.independentSyncInterval) {
            clearInterval(this.independentSyncInterval);
        }
        
        console.log('🔄 ELA: Starting independent subtitle synchronization');
        
        this.independentSyncInterval = setInterval(() => {
            if (!this.isUsingIndependentSubtitles || !this.independentSubtitles) {
                return;
            }
            
            const video = document.querySelector('video');
            if (!video) return;
            
            const currentTime = video.currentTime;
            
            // Find current subtitle based on video time
            const currentSubtitle = this.independentSubtitles.find(sub => 
                currentTime >= sub.start && currentTime <= sub.end
            );
            
            if (currentSubtitle && currentSubtitle.text !== this.lastIndependentSubtitle) {
                console.log('🎯 ELA: Independent subtitle:', currentSubtitle.text);
                this.lastIndependentSubtitle = currentSubtitle.text;
                
                // Process the subtitle through our existing system
                this.processSubtitle(currentSubtitle.text, null);
            } else if (!currentSubtitle && this.lastIndependentSubtitle) {
                // No subtitle at current time, clear display
                this.hideCustomSubtitles();
                this.lastIndependentSubtitle = null;
            }
        }, 200); // Check every 200ms for smooth synchronization
    }

    addDebugIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'ela-status-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        `;
        indicator.textContent = '🎧 ELA Active';
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.style.opacity = '0';
                indicator.style.transition = 'opacity 0.5s';
                setTimeout(() => indicator.remove(), 500);
            }
        }, 3000);
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get([
                'vocabularyLevel',
                'showTranslationOnHover',
                'subtitlePosition',
                'fontSize',
                'displayMode',
                'immersiveMode',
                'knownWords',
                'learningWords',
                'extensionEnabled'
            ]);

            this.settings = {
                vocabularyLevel: result.vocabularyLevel || 2000,
                showTranslationOnHover: result.showTranslationOnHover !== false,
                subtitlePosition: result.subtitlePosition || 'bottom',
                fontSize: result.fontSize || 'medium',
                displayMode: result.displayMode || 'hideKnown',
                immersiveMode: result.immersiveMode !== false,
                knownWords: new Set(result.knownWords || []),
                learningWords: new Set(result.learningWords || []),
                extensionEnabled: result.extensionEnabled !== false // Default to true
            };

            this.vocabularyLevel = this.settings.vocabularyLevel;
            this.isExtensionEnabled = this.settings.extensionEnabled;
            // Convert array to Set safely
            this.knownWords = new Set(Array.isArray(this.settings.knownWords) ? this.settings.knownWords : []);
            console.log('🎧 ELA: Vocabulary level set to:', this.vocabularyLevel);
        } catch (error) {
            console.error('🎧 ELA: Error loading settings:', error);
            this.settings = { 
                vocabularyLevel: 2000, 
                showTranslationOnHover: true, 
                subtitlePosition: 'bottom', 
                fontSize: 'medium',
                displayMode: 'hideKnown',
                immersiveMode: false,
                knownWords: new Set(),
                learningWords: new Set()
            };
        }
    }

    async loadCocaData() {
        try {
            if (!this.cocaWords) {
                const response = await fetch(chrome.runtime.getURL('data/coca-5000.json'));
                this.cocaWords = await response.json();
                console.log('🎧 ELA: COCA word data loaded:', this.cocaWords.length, 'words');
            }
        } catch (error) {
            console.error('🎧 ELA: Error loading COCA data:', error);
            this.cocaWords = [];
        }
    }

    async loadDailyStats() {
        try {
            const result = await chrome.storage.local.get(['dailyStats']);
            const stored = result.dailyStats;
            
            if (stored && stored.lastUpdated === new Date().toDateString()) {
                this.dailyStats = stored;
            } else {
                // Reset daily stats for new day
                this.dailyStats = {
                    wordsEncountered: 0,
                    wordsLearned: 0,
                    studyTime: 0,
                    lastUpdated: new Date().toDateString()
                };
                await this.saveDailyStats();
            }
            
            console.log('🎧 ELA: Daily stats loaded:', this.dailyStats);
        } catch (error) {
            console.error('🎧 ELA: Error loading daily stats:', error);
        }
    }

    async saveDailyStats() {
        try {
            await chrome.storage.local.set({ dailyStats: this.dailyStats });
        } catch (error) {
            console.error('🎧 ELA: Error saving daily stats:', error);
        }
    }

    setupNavigationListener() {
        let lastUrl = location.href;
        const observer = new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                if (url.includes('/watch')) {
                    setTimeout(() => {
                        console.log('🎧 ELA: Video change detected, restarting...');
                        this.onVideoChange();
                    }, 2000);
                }
            }
        });
        observer.observe(document, { subtree: true, childList: true });
    }

    onVideoChange() {
        this.stopWatching();
        this.resetSubtitleState();
        this.startWatching();
    }

    resetSubtitleState() {
        this.currentSubtitles = [];
        this.lastSubtitleText = '';
        this.lastSubtitleTime = 0;
        this.lastIndependentSubtitle = null;
        this.isUsingIndependentSubtitles = false;
        this.hideCustomSubtitles();
        
        // Clean up all intervals to prevent memory leaks
        if (this.independentSyncInterval) {
            clearInterval(this.independentSyncInterval);
            this.independentSyncInterval = null;
        }
        
        // Clean up immersive mode if active to prevent memory leaks
        if (this.isImmersiveModeActive) {
            this.deactivateImmersiveMode();
        }
    }

    startWatching() {
        if (this.isActive) return;
        
        this.isActive = true;
        console.log('🎧 ELA: Starting to watch for subtitles');
        
        setTimeout(() => {
            this.setupSubtitleMonitoring();
        }, 1000);
    }

    stopWatching() {
        if (!this.isActive) return;
        
        this.isActive = false;
        
        // Clean up all observers and intervals to prevent memory leaks
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        
        if (this.independentSyncInterval) {
            clearInterval(this.independentSyncInterval);
            this.independentSyncInterval = null;
        }
        
        // Clean up immersive mode timers
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        console.log('🎧 ELA: Stopped watching YouTube with full cleanup');
    }

    setupSubtitleMonitoring() {
        console.log('🎧 ELA: Setting up subtitle monitoring');
        this.startPolling();
        this.monitorSubtitleContainer();
    }

    startPolling() {
        this.pollingInterval = setInterval(() => {
            this.checkForSubtitles();
        }, 200); // Reduced to 200ms for better responsiveness
    }

    checkForSubtitles() {
        // Skip if extension is disabled
        if (!this.isExtensionEnabled) {
            this.hideCustomSubtitles();
            return;
        }
        
        // If using independent subtitles, let the sync method handle it
        if (this.isUsingIndependentSubtitles) {
            return;
        }
        
        // Only check for subtitles when captions are actually enabled
        const captionsButton = document.querySelector('.ytp-subtitles-button');
        if (captionsButton && captionsButton.getAttribute('aria-pressed') !== 'true') {
            this.hideCustomSubtitles();
            return;
        }

        const subtitleElements = document.querySelectorAll('.ytp-caption-segment');
        
        if (subtitleElements.length > 0) {
            // Get only the most recent/visible subtitle line
            let currentText = '';
            
            // Look for the last non-empty subtitle element (usually the current one)
            for (let i = subtitleElements.length - 1; i >= 0; i--) {
                const element = subtitleElements[i];
                const text = element.textContent?.trim();
                if (text && text.length > 0) {
                    currentText = text;
                    break;
                }
            }
            
            // If no recent subtitle found, try the first one
            if (!currentText && subtitleElements[0]) {
                currentText = subtitleElements[0].textContent?.trim() || '';
            }

            // Get current video time to avoid duplicate processing
            const video = document.querySelector('video');
            const currentTime = video ? Math.floor(video.currentTime * 10) : 0; // 0.1s precision

            if (currentText && 
                (currentText !== this.lastSubtitleText || 
                 Math.abs(currentTime - this.lastSubtitleTime) > 5)) { // Allow small time differences
                
                console.log('🎧 ELA: New subtitle:', currentText);
                this.lastSubtitleText = currentText;
                this.lastSubtitleTime = currentTime;
                this.processSubtitle(currentText, subtitleElements[0]);
            }
        } else {
            // Only hide if we're not already hidden
            if (document.getElementById('ela-custom-subtitle')) {
                this.hideCustomSubtitles();
            }
        }
    }

    monitorSubtitleContainer() {
        const container = document.querySelector('.ytp-caption-window-container');
        if (container) {
            this.observer = new MutationObserver((mutations) => {
                // Only process if mutations actually changed subtitle content
                let shouldCheck = false;
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList' || 
                        (mutation.type === 'characterData' && mutation.target.textContent)) {
                        shouldCheck = true;
                    }
                });
                
                if (shouldCheck) {
                    this.checkForSubtitles();
                }
            });

            this.observer.observe(container, {
                childList: true,
                subtree: true,
                characterData: true
            });
        }
    }

    async processSubtitle(text, originalElement) {
        try {
            // Apply smart word splitting first
            const smartSplitText = this.smartSplitWords(text);
            const words = this.extractWords(smartSplitText);
            const unknownWords = await this.identifyUnknownWords(words);
            
            if (words.length > 0) {
                // Use the smart split text for display
                this.showFilteredSubtitle(smartSplitText, unknownWords, originalElement);
                
                // Add unknown words to learning list
                unknownWords.forEach(word => this.unknownWords.add(word));
                
                if (unknownWords.length > 0) {
                    await this.updateLearningList();
                }
            }
        } catch (error) {
            console.error('🎧 ELA: Error processing subtitle:', error);
        }
    }

    extractWords(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);
    }

    // Improved word splitting that handles common word concatenations
    smartSplitWords(text) {
        // First normalize spaces and punctuation
        let normalizedText = text
            .replace(/[^\w\s']/g, ' ')  // Keep apostrophes for contractions
            .replace(/\s+/g, ' ')       // Normalize multiple spaces
            .trim();

        // Handle common concatenations with basic dictionary matching
        const commonWords = new Set([
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
            'my', 'your', 'his', 'her', 'its', 'our', 'their',
            'am', 'is', 'are', 'was', 'were', 'be', 'being', 'been',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might',
            'the', 'a', 'an', 'and', 'or', 'but', 'if', 'when', 'where', 'what', 'who', 'why', 'how',
            'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'out', 'off', 'over', 'under',
            'this', 'that', 'these', 'those', 'here', 'there', 'now', 'then',
            'all', 'any', 'some', 'no', 'not', 'only', 'just', 'even', 'also'
        ]);

        // Split by spaces first
        const words = normalizedText.split(/\s+/);
        const result = [];

        for (const word of words) {
            if (word.length <= 4 || word.includes("'")) {
                // Short words or contractions, likely correct as is
                result.push(word);
                continue;
            }

            // Check for potential concatenations
            let splitFound = false;
            
            // Try splitting at common word boundaries (2-4 chars from start)
            for (let i = 2; i <= Math.min(4, word.length - 2); i++) {
                const prefix = word.substring(0, i);
                const suffix = word.substring(i);
                
                if (commonWords.has(prefix.toLowerCase()) && suffix.length >= 2) {
                    result.push(prefix, suffix);
                    splitFound = true;
                    console.log(`🔧 ELA: Split "${word}" → "${prefix}" + "${suffix}"`);
                    break;
                }
            }
            
            // Try splitting from the end (common suffixes)
            if (!splitFound) {
                for (let i = word.length - 2; i >= Math.max(2, word.length - 4); i--) {
                    const prefix = word.substring(0, i);
                    const suffix = word.substring(i);
                    
                    if (commonWords.has(suffix.toLowerCase()) && prefix.length >= 2) {
                        result.push(prefix, suffix);
                        splitFound = true;
                        console.log(`🔧 ELA: Split "${word}" → "${prefix}" + "${suffix}"`);
                        break;
                    }
                }
            }

            if (!splitFound) {
                result.push(word);
            }
        }

        return result.join(' ');
    }

    async identifyUnknownWords(words) {
        const unknownWords = [];
        
        for (const word of words) {
            const isKnown = await this.isWordKnown(word);
            if (!isKnown) {
                unknownWords.push(word);
            }
        }
        
        return unknownWords;
    }

    async isWordKnown(word) {
        // Check manually marked words first
        if (this.knownWords.has(word)) {
            return true;
        }
        
        // Check COCA frequency data
        if (this.cocaWords && this.cocaWords.length > 0) {
            const wordData = this.cocaWords.find(w => w.word === word);
            if (wordData) {
                return wordData.rank <= this.vocabularyLevel;
            }
        }
        
        // Fallback for very common words
        const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'];
        return commonWords.includes(word);
    }

    showFilteredSubtitle(originalText, unknownWords, originalElement) {
        this.hideOriginalSubtitles();
        
        let displayText, knownWords;
        if (this.settings.displayMode === 'showAll') {
            // Show all words mode: identify known words separately
            const allWords = this.extractWords(originalText);
            knownWords = allWords.filter(word => !unknownWords.includes(word));
            displayText = originalText; // Show original text
        } else {
            // Hide known words mode (original behavior)
            displayText = this.createFilteredText(originalText, unknownWords);
            knownWords = [];
        }
        
        this.showCustomSubtitle(displayText, unknownWords, originalText, knownWords);
    }

    createFilteredText(originalText, unknownWords) {
        const words = originalText.split(/\s+/);
        return words.map(word => {
            const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
            if (unknownWords.includes(cleanWord)) {
                return word;
            }
            return '___';
        }).join(' ');
    }

    showCustomSubtitle(text, unknownWords, originalText, knownWords = []) {
        this.hideCustomSubtitles();
        
        // Create stable container
        if (!this.customSubtitleContainer) {
            this.customSubtitleContainer = document.createElement('div');
            this.customSubtitleContainer.id = 'ela-subtitle-container';
            this.customSubtitleContainer.style.cssText = `
                position: fixed;
                left: 50%;
                transform: translateX(-50%);
                z-index: 9999;
                pointer-events: auto;
                ${this.getPositionStyles()}
            `;
            document.body.appendChild(this.customSubtitleContainer);
        }

        // Clear and rebuild content
        this.customSubtitleContainer.innerHTML = '';
        
        const subtitleDiv = document.createElement('div');
        subtitleDiv.className = 'ela-subtitle-improved';
        
        const words = text.split(/\s+/);
        const originalWords = originalText.split(/\s+/);
        
        
        words.forEach((word, index) => {
            const span = document.createElement('span');
            span.className = 'ela-word';
            
            const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
            const originalWord = originalWords[index] || word;
            
            if (word === '___') {
                // Hidden word - show on hover (hideKnown mode)
                span.className = 'ela-hidden-word';
                span.textContent = '___';
                span.dataset.word = cleanWord;
                span.dataset.originalWord = originalWord;
                this.addHiddenWordHover(span, originalWord, cleanWord);
            } else if (unknownWords.includes(cleanWord)) {
                // Unknown word - shown and interactive
                span.className = this.settings.displayMode === 'showAll' ? 'ela-unknown-word-highlight' : 'ela-unknown-word';
                span.textContent = word;
                span.dataset.word = cleanWord;
                this.addUnknownWordInteraction(span, cleanWord);
            } else if (this.settings.displayMode === 'showAll' && knownWords.includes(cleanWord)) {
                // Known word in showAll mode - faded appearance
                span.className = 'ela-known-word';
                span.textContent = word;
                span.dataset.word = cleanWord;
                this.addKnownWordInteraction(span, cleanWord);
            } else {
                // Regular word
                span.textContent = word;
            }
            
            subtitleDiv.appendChild(span);
            
            if (index < words.length - 1) {
                subtitleDiv.appendChild(document.createTextNode(' '));
            }
        });
        
        this.customSubtitleContainer.appendChild(subtitleDiv);
    }

    getPositionStyles() {
        const position = this.settings.subtitlePosition;
        const fontSize = this.settings.fontSize;
        
        const fontSizes = {
            small: '16px',
            medium: '20px',
            large: '26px'
        };
        
        let positionStyle = '';
        switch (position) {
            case 'top':
                positionStyle = 'top: 15%;';
                break;
            case 'center':
                positionStyle = 'top: 50%; transform: translate(-50%, -50%);';
                break;
            case 'bottom':
            default:
                positionStyle = 'bottom: 15%;';
                break;
        }
        
        return `
            ${positionStyle}
            font-size: ${fontSizes[fontSize]};
        `;
    }

    addUnknownWordInteraction(element, word) {
        // Show translation on hover
        element.addEventListener('mouseenter', async () => {
            const translation = await this.getTranslation(word);
            this.showTooltip(element, translation, 'unknown');
        });
        
        element.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
        
        // Click to mark as known
        element.addEventListener('click', async () => {
            await this.markWordAsKnown(word);
            this.showTooltip(element, '已标记为认识', 'success');
            setTimeout(() => this.hideTooltip(), 1500);
        });
    }

    addHiddenWordHover(element, originalWord, cleanWord) {
        element.addEventListener('mouseenter', async () => {
            const translation = await this.getTranslation(cleanWord);
            this.showTooltip(element, `${originalWord} - ${translation}`, 'hidden');
        });
        
        element.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
        
        // Click to mark as unknown (add to learning list)
        element.addEventListener('click', async () => {
            await this.markWordAsUnknown(cleanWord);
            this.showTooltip(element, '已添加到学习列表', 'learning');
            setTimeout(() => this.hideTooltip(), 1500);
        });
    }

    addKnownWordInteraction(element, word) {
        // Show translation on hover for known words too
        element.addEventListener('mouseenter', async () => {
            const translation = await this.getTranslation(word);
            this.showTooltip(element, translation, 'known');
        });
        
        element.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
        
        // Click to mark as unknown (move to learning list)
        element.addEventListener('click', async () => {
            await this.markWordAsUnknown(word);
            this.showTooltip(element, '已添加到学习列表', 'learning');
            setTimeout(() => this.hideTooltip(), 1500);
        });
    }

    async getTranslation(word) {
        try {
            // Use the translation service if available
            if (window.translationService) {
                const result = await window.translationService.translate(word);
                if (result && result.text && !result.error) {
                    return result.text;
                }
            }
            
            // Fallback to basic dictionary
            const translations = {
                'example': '例子',
                'important': '重要的',
                'different': '不同的',
                'technology': '技术',
                'education': '教育',
                'information': '信息',
                'development': '发展',
                'experience': '经验',
                'opportunity': '机会',
                'understand': '理解'
            };
            
            return translations[word] || `[${word}的释义]`;
        } catch (error) {
            console.error('🌐 Translation error:', error);
            return `[${word}的释义]`;
        }
    }

    showTooltip(element, text, type = 'default') {
        this.hideTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.id = 'ela-tooltip';
        tooltip.className = `ela-tooltip ela-tooltip-${type}`;
        tooltip.textContent = text;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 8) + 'px';
    }

    hideTooltip() {
        const tooltip = document.getElementById('ela-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    async markWordAsKnown(word) {
        this.knownWords.add(word);
        this.unknownWords.delete(word);
        
        await chrome.storage.local.set({ 
            knownWords: Array.from(this.knownWords),
            learningWords: Array.from(this.unknownWords)
        });
        
        console.log('🎧 ELA: Marked as known:', word);
    }

    async markWordAsUnknown(word) {
        this.unknownWords.add(word);
        this.knownWords.delete(word);
        
        await chrome.storage.local.set({ 
            knownWords: Array.from(this.knownWords),
            learningWords: Array.from(this.unknownWords)
        });
        
        console.log('🎧 ELA: Added to learning list:', word);
    }

    hideOriginalSubtitles() {
        const containers = document.querySelectorAll('.ytp-caption-window-container');
        containers.forEach(container => {
            container.style.display = 'none';
        });
    }

    showOriginalSubtitles() {
        const containers = document.querySelectorAll('.ytp-caption-window-container');
        containers.forEach(container => {
            container.style.display = '';
        });
    }

    hideCustomSubtitles() {
        if (this.customSubtitleContainer) {
            this.customSubtitleContainer.remove();
            this.customSubtitleContainer = null;
        }
        this.hideTooltip();
    }

    async updateLearningList() {
        try {
            const learningWords = Array.from(this.unknownWords);
            await chrome.storage.local.set({ learningWords });
            
            chrome.runtime.sendMessage({
                type: 'ADD_TO_LEARNING_LIST',
                words: learningWords
            });
        } catch (error) {
            console.error('🎧 ELA: Error updating learning list:', error);
        }
    }

    handleMessage(request, sender, sendResponse) {
        switch (request.type) {
            case 'SETTINGS_UPDATED':
                this.settings = { ...this.settings, ...request.settings };
                this.vocabularyLevel = this.settings.vocabularyLevel;
                
                // Update display mode if changed
                if (request.settings.displayMode) {
                    console.log('🎧 ELA: Display mode updated to:', request.settings.displayMode);
                }
                
                if (this.customSubtitleContainer) {
                    this.customSubtitleContainer.style.cssText = `
                        position: fixed;
                        left: 50%;
                        transform: translateX(-50%);
                        z-index: 9999;
                        pointer-events: auto;
                        ${this.getPositionStyles()}
                    `;
                }
                break;
                
            case 'TOGGLE_EXTENSION':
                this.isExtensionEnabled = request.enabled;
                console.log('🎧 ELA: Extension toggled:', request.enabled ? 'ON' : 'OFF');
                
                if (!request.enabled) {
                    // Disable: stop processing and hide custom subtitles
                    this.hideCustomSubtitles();
                    if (this.independentSyncInterval) {
                        clearInterval(this.independentSyncInterval);
                        this.independentSyncInterval = null;
                    }
                    console.log('🎧 ELA: YouTube custom subtitles hidden');
                } else {
                    // Enable: restart if not already active
                    if (!this.isActive) {
                        this.startWatching();
                    }
                    // Restart independent subtitle sync if available
                    if (this.isUsingIndependentSubtitles && this.independentSubtitles) {
                        this.startIndependentSubtitleSync();
                    }
                    console.log('🎧 ELA: YouTube extension re-enabled');
                }
                break;
                
            case 'TRANSLATION_SETTINGS_UPDATED':
                // Update translation service settings
                if (window.translationService) {
                    window.translationService.settings = {
                        ...window.translationService.settings,
                        provider: request.settings.translationProvider,
                        targetLanguage: request.settings.translationLanguage,
                        enabled: request.settings.translationEnabled,
                        showOnHover: request.settings.showTranslationOnHover,
                        apiKeys: request.settings.apiKeys
                    };
                    console.log('🌐 Translation settings updated:', window.translationService.settings);
                }
                break;
        }
        
        return true;
    }

    // Keyboard Shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl+Shift+I to toggle immersive mode
            if (event.ctrlKey && event.shiftKey && event.key === 'I') {
                event.preventDefault();
                this.toggleImmersiveMode();
            }
            
            // Escape key to exit immersive mode
            if (event.key === 'Escape' && this.isImmersiveModeActive) {
                event.preventDefault();
                this.deactivateImmersiveMode();
            }
            
            // Ctrl+Shift+S to toggle stats (when in immersive mode)
            if (event.ctrlKey && event.shiftKey && event.key === 'S' && this.isImmersiveModeActive) {
                event.preventDefault();
                this.toggleImmersiveStats();
            }
            
            // Ctrl+Shift+B to toggle sidebar
            if (event.ctrlKey && event.shiftKey && event.key === 'B') {
                event.preventDefault();
                this.toggleSidebar();
            }
        });
        
        console.log('🎯 ELA: Keyboard shortcuts setup - Ctrl+Shift+I (toggle), Esc (exit), Ctrl+Shift+S (stats)');
    }

    toggleImmersiveMode() {
        if (this.isImmersiveModeActive) {
            this.deactivateImmersiveMode();
        } else if (this.settings.immersiveMode) {
            this.activateImmersiveMode();
        } else {
            this.showNotification('请先在设置中启用沉浸模式', 'info');
        }
    }

    // Immersive Mode Methods
    checkImmersiveModeActivation() {
        // Only activate if immersive mode is enabled in settings
        if (!this.settings.immersiveMode) {
            return;
        }

        // Check if we're on a video page
        if (window.location.pathname === '/watch') {
            console.log('🎯 ELA: Video detected, checking immersive mode activation');
            
            // Auto-activate immersive mode or show prompt
            setTimeout(() => {
                this.showImmersiveModePrompt();
            }, 3000); // Wait 3 seconds for page to fully load
        }
    }

    showImmersiveModePrompt() {
        if (this.isImmersiveModeActive) {
            return; // Already active
        }

        const prompt = document.createElement('div');
        prompt.id = 'ela-immersive-prompt';
        prompt.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10001;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 4px 20px rgba(40, 167, 69, 0.3);
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        
        prompt.innerHTML = `
            <div style="margin-bottom: 12px;">
                <strong>🎯 沉浸学习模式</strong>
            </div>
            <div style="margin-bottom: 15px; font-size: 13px; opacity: 0.9;">
                启用增强学习界面，获得更佳的英语学习体验？
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="ela-activate-immersive" style="
                    background: white;
                    color: #28a745;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                ">启用</button>
                <button id="ela-dismiss-immersive" style="
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                ">稍后</button>
            </div>
        `;

        document.body.appendChild(prompt);

        // Add event listeners
        document.getElementById('ela-activate-immersive').addEventListener('click', () => {
            this.activateImmersiveMode();
            prompt.remove();
        });

        document.getElementById('ela-dismiss-immersive').addEventListener('click', () => {
            prompt.remove();
        });

        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (prompt.parentNode) {
                prompt.remove();
            }
        }, 10000);
    }

    activateImmersiveMode() {
        if (this.isImmersiveModeActive) {
            return;
        }

        console.log('🎯 ELA: Activating immersive mode');
        this.isImmersiveModeActive = true;
        
        // Start learning session
        this.startLearningSession();
        
        this.createImmersiveOverlay();
        this.createImmersiveToolbar();
        this.createImmersiveStats();
        this.createImmersiveDictionary();
        this.createImmersiveTimer();
        
        // Add immersive mode class to body for enhanced styling
        document.body.classList.add('ela-immersive-mode');
        
        // Show activation notification
        this.showNotification('🎯 沉浸学习模式已激活', 'success');
    }

    deactivateImmersiveMode() {
        if (!this.isImmersiveModeActive) {
            return;
        }

        console.log('🎯 ELA: Deactivating immersive mode');
        this.isImmersiveModeActive = false;
        
        // End learning session
        this.endLearningSession();
        
        // Remove immersive elements
        if (this.immersiveOverlay) {
            this.immersiveOverlay.remove();
            this.immersiveOverlay = null;
        }
        
        if (this.immersiveToolbar) {
            this.immersiveToolbar.remove();
            this.immersiveToolbar = null;
        }
        
        if (this.immersiveStats) {
            this.immersiveStats.remove();
            this.immersiveStats = null;
        }
        
        if (this.immersiveDictionary) {
            this.immersiveDictionary.remove();
            this.immersiveDictionary = null;
        }
        
        if (this.immersiveTimer) {
            this.immersiveTimer.remove();
            this.immersiveTimer = null;
        }
        
        // Remove immersive mode class
        document.body.classList.remove('ela-immersive-mode');
        
        this.showNotification('沉浸学习模式已关闭', 'info');
    }

    createImmersiveOverlay() {
        // This creates a semi-transparent overlay that enhances the learning environment
        this.immersiveOverlay = document.createElement('div');
        this.immersiveOverlay.id = 'ela-immersive-overlay';
        this.immersiveOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 9998;
            pointer-events: none;
            background: linear-gradient(
                to bottom,
                rgba(0, 0, 0, 0.1) 0%,
                rgba(0, 0, 0, 0.05) 20%,
                rgba(0, 0, 0, 0.02) 40%,
                rgba(0, 0, 0, 0.05) 80%,
                rgba(0, 0, 0, 0.1) 100%
            );
        `;
        
        document.body.appendChild(this.immersiveOverlay);
    }

    createImmersiveToolbar() {
        // Create floating learning toolbar
        this.immersiveToolbar = document.createElement('div');
        this.immersiveToolbar.id = 'ela-immersive-toolbar';
        this.immersiveToolbar.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 10000;
            background: rgba(45, 45, 45, 0.95);
            backdrop-filter: blur(10px);
            color: white;
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: move;
        `;
        
        this.immersiveToolbar.innerHTML = `
            <span style="font-weight: 600;">🎯 沉浸模式</span>
            <div style="display: flex; gap: 6px;">
                <button id="ela-toggle-stats" style="
                    background: rgba(40, 167, 69, 0.8);
                    color: white;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 11px;
                    cursor: pointer;
                ">统计</button>
                <button id="ela-toggle-dictionary" style="
                    background: rgba(23, 162, 184, 0.8);
                    color: white;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 11px;
                    cursor: pointer;
                ">词典</button>
                <button id="ela-show-summary" style="
                    background: rgba(255, 193, 7, 0.8);
                    color: #212529;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 11px;
                    cursor: pointer;
                ">总结</button>
                <button id="ela-exit-immersive" style="
                    background: rgba(220, 53, 69, 0.8);
                    color: white;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 11px;
                    cursor: pointer;
                ">退出</button>
            </div>
        `;

        document.body.appendChild(this.immersiveToolbar);

        // Add event listeners
        document.getElementById('ela-toggle-stats').addEventListener('click', () => {
            this.toggleImmersiveStats();
        });

        document.getElementById('ela-toggle-dictionary').addEventListener('click', () => {
            this.toggleImmersiveDictionary();
        });

        document.getElementById('ela-show-summary').addEventListener('click', () => {
            this.showCurrentSessionSummary();
        });

        document.getElementById('ela-exit-immersive').addEventListener('click', () => {
            this.deactivateImmersiveMode();
        });

        // Make toolbar draggable
        this.makeElementDraggable(this.immersiveToolbar);
    }

    createImmersiveStats() {
        // Create learning statistics panel
        this.immersiveStats = document.createElement('div');
        this.immersiveStats.id = 'ela-immersive-stats';
        this.immersiveStats.style.cssText = `
            position: fixed;
            top: 80px;
            left: 20px;
            z-index: 10000;
            background: rgba(45, 45, 45, 0.95);
            backdrop-filter: blur(10px);
            color: white;
            padding: 16px;
            border-radius: 12px;
            font-size: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            min-width: 200px;
            display: none;
        `;
        
        this.updateImmersiveStats();
        document.body.appendChild(this.immersiveStats);
    }

    updateImmersiveStats() {
        if (!this.immersiveStats) return;

        const unknownWordsCount = this.unknownWords.size;
        const knownWordsCount = this.knownWords.size;
        const sessionEncountered = this.sessionWordsEncountered.size;
        const sessionLearned = this.sessionWordsLearned.size;
        
        let sessionDuration = 0;
        if (this.sessionStartTime) {
            sessionDuration = Math.floor((new Date() - this.sessionStartTime) / 1000 / 60);
        }
        
        this.immersiveStats.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 12px; color: #20c997;">📊 学习统计</div>
            
            <div style="margin-bottom: 16px;">
                <div style="font-weight: 500; margin-bottom: 8px; color: #ffc107;">当前会话</div>
                <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>学习时长:</span>
                        <span style="color: #20c997;">${sessionDuration} 分钟</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>遇到词汇:</span>
                        <span style="color: #17a2b8;">${sessionEncountered} 个</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>新学词汇:</span>
                        <span style="color: #28a745;">${sessionLearned} 个</span>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 16px;">
                <div style="font-weight: 500; margin-bottom: 8px; color: #ffc107;">今日统计</div>
                <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>学习时长:</span>
                        <span style="color: #20c997;">${this.dailyStats.studyTime} 分钟</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>遇到词汇:</span>
                        <span style="color: #17a2b8;">${this.dailyStats.wordsEncountered} 个</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>新学词汇:</span>
                        <span style="color: #28a745;">${this.dailyStats.wordsLearned} 个</span>
                    </div>
                </div>
            </div>
            
            <div>
                <div style="font-weight: 500; margin-bottom: 8px; color: #ffc107;">总体数据</div>
                <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>学习中词汇:</span>
                        <span style="color: #fd7e14;">${unknownWordsCount}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>已掌握词汇:</span>
                        <span style="color: #28a745;">${knownWordsCount}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>词汇等级:</span>
                        <span style="color: #17a2b8;">${this.vocabularyLevel}</span>
                    </div>
                </div>
            </div>
        `;
    }

    toggleImmersiveStats() {
        if (!this.immersiveStats) return;

        if (this.immersiveStats.style.display === 'none') {
            this.updateImmersiveStats();
            this.immersiveStats.style.display = 'block';
        } else {
            this.immersiveStats.style.display = 'none';
        }
    }

    toggleImmersiveDictionary() {
        if (!this.immersiveDictionary) return;

        if (this.immersiveDictionary.style.display === 'none') {
            this.immersiveDictionary.style.display = 'block';
        } else {
            this.immersiveDictionary.style.display = 'none';
        }
    }

    showCurrentSessionSummary() {
        if (!this.sessionStartTime) {
            this.showNotification('还未开始学习会话', 'info');
            return;
        }

        const sessionDuration = Math.floor((new Date() - this.sessionStartTime) / 1000 / 60);
        this.showSessionSummary(sessionDuration, false); // false = don't auto-close
    }

    makeElementDraggable(element) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        element.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === element || element.contains(e.target)) {
                isDragging = true;
                element.style.cursor = 'grabbing';
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                element.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        }

        function dragEnd() {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'move';
            }
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10002;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 500;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Advanced Learning Tools
    startLearningSession() {
        this.sessionStartTime = new Date();
        this.sessionWordsEncountered.clear();
        this.sessionWordsLearned.clear();
        console.log('📚 ELA: Learning session started');
    }

    endLearningSession() {
        if (!this.sessionStartTime) return;

        const sessionDuration = Math.floor((new Date() - this.sessionStartTime) / 1000 / 60); // minutes
        this.dailyStats.studyTime += sessionDuration;
        this.dailyStats.wordsEncountered += this.sessionWordsEncountered.size;
        this.dailyStats.wordsLearned += this.sessionWordsLearned.size;

        this.saveDailyStats();
        
        // Show session summary
        this.showSessionSummary(sessionDuration);
        
        console.log('📚 ELA: Learning session ended', {
            duration: sessionDuration,
            wordsEncountered: this.sessionWordsEncountered.size,
            wordsLearned: this.sessionWordsLearned.size
        });
    }

    showSessionSummary(duration, autoClose = true) {
        const summary = document.createElement('div');
        summary.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10003;
            background: rgba(45, 45, 45, 0.98);
            backdrop-filter: blur(15px);
            color: white;
            padding: 24px;
            border-radius: 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            text-align: center;
            min-width: 300px;
            animation: scaleIn 0.3s ease;
        `;

        summary.innerHTML = `
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #20c997;">
                🎉 学习会话完成
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between;">
                    <span>学习时长:</span>
                    <span style="color: #ffc107;">${duration} 分钟</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>遇到词汇:</span>
                    <span style="color: #17a2b8;">${this.sessionWordsEncountered.size} 个</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>新学词汇:</span>
                    <span style="color: #28a745;">${this.sessionWordsLearned.size} 个</span>
                </div>
            </div>
            <button id="ela-close-summary" style="
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
            ">确定</button>
        `;

        document.body.appendChild(summary);

        document.getElementById('ela-close-summary').addEventListener('click', () => {
            summary.remove();
        });

        // Auto-close after 10 seconds
        setTimeout(() => {
            if (summary.parentNode) {
                summary.remove();
            }
        }, 10000);
    }

    createImmersiveDictionary() {
        this.immersiveDictionary = document.createElement('div');
        this.immersiveDictionary.id = 'ela-immersive-dictionary';
        this.immersiveDictionary.style.cssText = `
            position: fixed;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            z-index: 10000;
            background: rgba(45, 45, 45, 0.95);
            backdrop-filter: blur(10px);
            color: white;
            padding: 16px;
            border-radius: 12px;
            font-size: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            width: 250px;
            max-height: 400px;
            overflow-y: auto;
            display: none;
        `;

        this.immersiveDictionary.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 12px; color: #20c997;">📖 快速词典</div>
            <div id="ela-dictionary-content" style="display: flex; flex-direction: column; gap: 8px;">
                <div style="text-align: center; color: #adb5bd; padding: 20px;">
                    点击任意单词查看释义
                </div>
            </div>
        `;

        document.body.appendChild(this.immersiveDictionary);
    }

    createImmersiveTimer() {
        this.immersiveTimer = document.createElement('div');
        this.immersiveTimer.id = 'ela-immersive-timer';
        this.immersiveTimer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            background: rgba(45, 45, 45, 0.95);
            backdrop-filter: blur(10px);
            color: white;
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            cursor: pointer;
        `;

        this.updateTimer();
        document.body.appendChild(this.immersiveTimer);

        // Update timer every second
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);

        // Click to toggle display format
        this.immersiveTimer.addEventListener('click', () => {
            this.toggleTimerFormat();
        });
    }

    updateTimer() {
        if (!this.immersiveTimer || !this.sessionStartTime) return;

        const elapsed = new Date() - this.sessionStartTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        this.immersiveTimer.innerHTML = `
            ⏱️ ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}
        `;
    }

    toggleTimerFormat() {
        // Future enhancement: toggle between different timer formats
        this.showNotification('计时器格式切换', 'info');
    }

    trackWordEncounter(word) {
        if (this.isImmersiveModeActive) {
            this.sessionWordsEncountered.add(word);
            if (this.immersiveStats && this.immersiveStats.style.display !== 'none') {
                this.updateImmersiveStats();
            }
        }
    }

    trackWordLearned(word) {
        if (this.isImmersiveModeActive) {
            this.sessionWordsLearned.add(word);
            if (this.immersiveStats && this.immersiveStats.style.display !== 'none') {
                this.updateImmersiveStats();
            }
        }
    }

    showWordInDictionary(word, translation) {
        if (!this.immersiveDictionary) return;

        this.immersiveDictionary.style.display = 'block';
        const content = document.getElementById('ela-dictionary-content');
        
        content.innerHTML = `
            <div style="border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 12px; margin-bottom: 12px;">
                <div style="font-size: 16px; font-weight: 600; color: #20c997; margin-bottom: 4px;">
                    ${word}
                </div>
                <div style="color: #ffc107; font-size: 13px;">
                    ${translation}
                </div>
            </div>
            <div style="text-align: center;">
                <button id="ela-close-dictionary" style="
                    background: rgba(220, 53, 69, 0.8);
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 11px;
                    cursor: pointer;
                ">关闭</button>
            </div>
        `;

        document.getElementById('ela-close-dictionary').addEventListener('click', () => {
            this.immersiveDictionary.style.display = 'none';
        });

        // Auto-close after 5 seconds
        setTimeout(() => {
            if (this.immersiveDictionary && this.immersiveDictionary.style.display === 'block') {
                this.immersiveDictionary.style.display = 'none';
            }
        }, 5000);
    }

    performCompatibilityCheck() {
        const issues = [];
        
        // Check Chrome extension APIs
        if (!chrome || !chrome.storage) {
            issues.push('Chrome storage API not available');
        }
        
        if (!chrome || !chrome.runtime) {
            issues.push('Chrome runtime API not available');
        }
        
        // Check required DOM features
        if (!document.querySelector) {
            issues.push('querySelector not supported');
        }
        
        if (!window.MutationObserver) {
            issues.push('MutationObserver not supported');
        }
        
        // Check for YouTube-specific elements
        const playerCheck = setTimeout(() => {
            const video = document.querySelector('video');
            if (!video) {
                issues.push('Video element not found');
            }
            
            const ytPlayer = document.querySelector('#movie_player, .html5-video-player');
            if (!ytPlayer) {
                issues.push('YouTube player not detected');
            }
            
            if (issues.length > 0) {
                console.warn('🎧 ELA: Compatibility issues detected:', issues);
                this.showNotification(`兼容性问题: ${issues.length}个`, 'warning');
            } else {
                console.log('🎧 ELA: YouTube compatibility check passed ✅');
            }
        }, 3000);
        
        // Clear timeout to prevent memory leak
        setTimeout(() => clearTimeout(playerCheck), 5000);
    }

    // ========== Sidebar Mode System ==========

    initializeSidebar() {
        console.log('🎧 ELA: Initializing sidebar');
        this.createSidebarToggleButton();
        this.createSidebarElement();
    }

    createSidebarToggleButton() {
        if (this.sidebarToggleButton) {
            this.sidebarToggleButton.remove();
        }

        this.sidebarToggleButton = document.createElement('button');
        this.sidebarToggleButton.className = 'ela-sidebar-toggle';
        this.sidebarToggleButton.innerHTML = '📝';
        this.sidebarToggleButton.title = '切换字幕侧边栏';
        
        this.sidebarToggleButton.addEventListener('click', () => {
            this.toggleSidebar();
        });

        document.body.appendChild(this.sidebarToggleButton);
    }

    createSidebarElement() {
        if (this.sidebarElement) {
            this.sidebarElement.remove();
        }

        this.sidebarElement = document.createElement('div');
        this.sidebarElement.className = 'ela-subtitle-sidebar';
        this.sidebarElement.innerHTML = `
            <div class="ela-sidebar-header">
                <span>字幕时间轴</span>
                <button class="ela-sidebar-close">×</button>
            </div>
            <div class="ela-sidebar-content">
                <ul class="ela-subtitle-timeline" id="ela-timeline"></ul>
            </div>
            <div class="ela-sidebar-controls">
                <button class="ela-sidebar-button active" data-mode="all">显示全部</button>
                <button class="ela-sidebar-button" data-mode="unknown">仅生词</button>
                <button class="ela-sidebar-button" data-mode="context">上下文</button>
            </div>
        `;

        // Add event listeners
        const closeBtn = this.sidebarElement.querySelector('.ela-sidebar-close');
        closeBtn.addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Control buttons
        const controlButtons = this.sidebarElement.querySelectorAll('.ela-sidebar-button');
        controlButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                controlButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateTimelineDisplay(btn.dataset.mode);
            });
        });

        document.body.appendChild(this.sidebarElement);
    }

    toggleSidebar() {
        this.sidebarMode = !this.sidebarMode;
        
        if (this.sidebarMode) {
            this.sidebarElement.classList.add('visible');
            this.sidebarToggleButton.classList.add('active');
            this.sidebarToggleButton.innerHTML = '×';
            
            // Hide video subtitles when sidebar is open
            if (this.customSubtitleContainer) {
                this.customSubtitleContainer.style.display = 'none';
            }
            
            // Load subtitle timeline
            this.loadSubtitleTimeline();
            
        } else {
            this.sidebarElement.classList.remove('visible');
            this.sidebarToggleButton.classList.remove('active');
            this.sidebarToggleButton.innerHTML = '📝';
            
            // Show video subtitles when sidebar is closed
            if (this.customSubtitleContainer) {
                this.customSubtitleContainer.style.display = 'block';
            }
        }
    }

    async loadSubtitleTimeline() {
        console.log('🎧 ELA: Loading subtitle timeline');
        
        // Try to get subtitles from independent system first
        if (this.independentSubtitles && this.independentSubtitles.length > 0) {
            this.subtitleTimeline = this.independentSubtitles.map((sub, index) => ({
                index,
                startTime: sub.startTime,
                endTime: sub.endTime,
                text: sub.text,
                cleanText: sub.text.replace(/<[^>]*>/g, ''), // Remove HTML tags
                processedText: this.processSubtitleText(sub.text.replace(/<[^>]*>/g, ''))
            }));
        } else {
            // Fallback to current subtitle collection
            this.subtitleTimeline = [];
        }
        
        this.updateTimelineDisplay('all');
        this.startTimelineSync();
    }

    processSubtitleText(text) {
        // Apply smart word splitting first
        const smartSplitText = this.smartSplitWords(text);
        const words = smartSplitText.split(/\s+/);
        
        return words.map(word => {
            const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
            const isUnknown = this.unknownWords.has(cleanWord) || 
                            (this.cocaWords && this.cocaWords[cleanWord] && this.cocaWords[cleanWord] > this.vocabularyLevel);
            const isKnown = this.knownWords.has(cleanWord);
            
            let className = 'ela-sidebar-word';
            if (isUnknown) {
                className += ' unknown';
            } else if (isKnown) {
                className += ' known';
            } else {
                className += ' hidden';
            }
            
            return `<span class="${className}" data-word="${cleanWord}">${word}</span>`;
        }).join(' ');
    }

    updateTimelineDisplay(mode) {
        const timeline = document.getElementById('ela-timeline');
        if (!timeline) return;
        
        timeline.innerHTML = '';
        
        let itemsToShow = this.subtitleTimeline;
        
        // Filter based on mode
        if (mode === 'unknown') {
            itemsToShow = this.subtitleTimeline.filter(item => 
                this.hasUnknownWords(item.cleanText)
            );
        }
        
        itemsToShow.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'ela-subtitle-item';
            li.dataset.index = item.index;
            li.dataset.startTime = item.startTime;
            
            li.innerHTML = `
                <div class="ela-subtitle-time">${this.formatTime(item.startTime)} → ${this.formatTime(item.endTime)}</div>
                <div class="ela-subtitle-text">${item.processedText}</div>
                <div class="ela-sidebar-autoscroll"></div>
            `;
            
            // Add click listener for time jumping
            li.addEventListener('click', () => {
                this.jumpToTime(item.startTime);
                this.highlightCurrentSubtitle(item.index);
            });
            
            timeline.appendChild(li);
        });
    }

    hasUnknownWords(text) {
        const words = text.split(/\s+/);
        return words.some(word => {
            const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
            return this.unknownWords.has(cleanWord) || 
                   (this.cocaWords && this.cocaWords[cleanWord] && this.cocaWords[cleanWord] > this.vocabularyLevel);
        });
    }

    jumpToTime(timeInSeconds) {
        const video = document.querySelector('video');
        if (video) {
            video.currentTime = timeInSeconds;
            console.log('🎧 ELA: Jumped to time:', timeInSeconds);
        }
    }

    startTimelineSync() {
        if (this.timelineSyncInterval) {
            clearInterval(this.timelineSyncInterval);
        }
        
        this.timelineSyncInterval = setInterval(() => {
            if (this.sidebarMode) {
                this.syncTimelineWithVideo();
            }
        }, 500);
    }

    syncTimelineWithVideo() {
        const video = document.querySelector('video');
        if (!video) return;
        
        const currentTime = video.currentTime;
        let currentIndex = -1;
        
        // Find current subtitle
        for (let i = 0; i < this.subtitleTimeline.length; i++) {
            const item = this.subtitleTimeline[i];
            if (currentTime >= item.startTime && currentTime <= item.endTime) {
                currentIndex = i;
                break;
            }
        }
        
        if (currentIndex !== this.currentSubtitleIndex) {
            this.currentSubtitleIndex = currentIndex;
            this.highlightCurrentSubtitle(currentIndex);
        }
    }

    highlightCurrentSubtitle(index) {
        const timeline = document.getElementById('ela-timeline');
        if (!timeline) return;
        
        // Remove previous highlight
        const previousCurrent = timeline.querySelector('.ela-subtitle-item.current');
        if (previousCurrent) {
            previousCurrent.classList.remove('current');
        }
        
        // Add new highlight
        const items = timeline.querySelectorAll('.ela-subtitle-item');
        const currentItem = Array.from(items).find(item => 
            parseInt(item.dataset.index) === index
        );
        
        if (currentItem) {
            currentItem.classList.add('current');
            
            // Auto-scroll to current item
            currentItem.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // ========== Sidebar Communication ==========

    setupSidebarCommunication() {
        // Enhanced message handler for sidebar communication
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.type) {
                case 'GET_SUBTITLE_TIMELINE':
                    sendResponse({
                        subtitles: this.subtitleTimeline,
                        currentIndex: this.currentSubtitleIndex
                    });
                    break;

                case 'JUMP_TO_TIME':
                    if (typeof message.time === 'number') {
                        this.jumpToTime(message.time);
                        if (typeof message.index === 'number') {
                            this.currentSubtitleIndex = message.index;
                            this.highlightCurrentSubtitle(message.index);
                        }
                    }
                    break;

                case 'REFRESH_SUBTITLES':
                    this.loadSubtitleTimeline();
                    break;
            }
            return true;
        });

        // Send updates to sidebar
        setInterval(() => {
            this.sendSidebarUpdate();
        }, 1000);
    }

    sendSidebarUpdate() {
        const video = document.querySelector('video');
        if (!video) return;

        // Send timeline update
        chrome.runtime.sendMessage({
            type: 'SUBTITLE_TIMELINE_UPDATE',
            subtitles: this.subtitleTimeline
        }).catch(() => {});

        // Send current subtitle update
        chrome.runtime.sendMessage({
            type: 'CURRENT_SUBTITLE_UPDATE',
            index: this.currentSubtitleIndex
        }).catch(() => {});

        // Send playback time update
        chrome.runtime.sendMessage({
            type: 'PLAYBACK_TIME_UPDATE',
            currentTime: video.currentTime,
            duration: video.duration || 0
        }).catch(() => {});
    }
}

console.log('🎧 ELA: Creating YouTube manager...');
const manager = new YouTubeSubtitleManager();