// English Listening Assistant - Sidebar JavaScript
// Enhanced sidebar interface for Chrome Side Panel API

class SidebarManager {
    constructor() {
        this.currentQuestion = 0;
        this.totalQuestions = 25;
        this.knownWords = 0;
        this.assessmentWords = [];
        this.learningWords = [];
        this.currentTab = 'vocabulary';
        this.currentStudyIndex = 0;
        
        // Subtitle timeline properties
        this.subtitleTimeline = [];
        this.currentSubtitleIndex = -1;
        this.isConnectedToVideo = false;
        this.activeTabId = null;
        this.filterMode = 'all';
        
        // Multi-tab session management
        this.tabSessions = new Map(); // tabId -> session data
        this.currentSessionId = null;
        
        this.initializeSidebar();
    }

    async initializeSidebar() {
        await this.loadSettings();
        await this.loadLearningProgress();
        this.setupEventListeners();
        this.setupTabNavigation();
        this.setupSubtitleFeatures();
        this.updateUI();
        
        console.log('🎧 ELA: Sidebar initialized successfully');
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get([
                'vocabularyLevel',
                'isFirstTime',
                'showTranslationOnHover',
                'subtitlePosition',
                'fontSize',
                'displayMode',
                'immersiveMode',
                'knownWords',
                'learningWords',
                'extensionEnabled',
                'lastAssessmentDate',
                // Translation settings
                'translationEnabled',
                'translationProvider',
                'translationLanguage',
                'googleTranslateApiKey',
                'deeplApiKey',
                'claudeApiKey',
                'openaiApiKey',
                'xaiApiKey',
                'geminiApiKey',
                // New Tab settings
                'newTabEnabled',
                'newTabLearningToggle'
            ]);

            this.settings = {
                vocabularyLevel: result.vocabularyLevel || null,
                isFirstTime: result.isFirstTime !== false,
                showTranslationOnHover: result.showTranslationOnHover !== false,
                subtitlePosition: result.subtitlePosition || 'bottom',
                fontSize: result.fontSize || 'medium',
                displayMode: result.displayMode || 'hideKnown',
                immersiveMode: result.immersiveMode !== false,
                knownWords: result.knownWords || [],
                learningWords: result.learningWords || [],
                extensionEnabled: result.extensionEnabled !== false,
                lastAssessmentDate: result.lastAssessmentDate,
                // Translation settings
                translationEnabled: result.translationEnabled !== false,
                translationProvider: result.translationProvider || 'google',
                translationLanguage: result.translationLanguage || 'zh-CN',
                apiKeys: {
                    google: result.googleTranslateApiKey || '',
                    deepl: result.deeplApiKey || '',
                    claude: result.claudeApiKey || '',
                    openai: result.openaiApiKey || '',
                    xai: result.xaiApiKey || '',
                    gemini: result.geminiApiKey || ''
                },
                // New Tab settings
                newTabEnabled: result.newTabEnabled !== false,
                newTabLearningToggle: result.newTabLearningToggle !== false
            };
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            vocabularyLevel: null,
            isFirstTime: true,
            showTranslationOnHover: true,
            subtitlePosition: 'bottom',
            fontSize: 'medium',
            displayMode: 'hideKnown',
            immersiveMode: false,
            knownWords: [],
            learningWords: [],
            extensionEnabled: true,
            lastAssessmentDate: null
        };
    }

    async loadLearningProgress() {
        this.learningWords = this.settings.learningWords || [];
        // Update stats display
        document.getElementById('wordsLearning').textContent = this.learningWords.length;
        document.getElementById('wordsKnown').textContent = this.settings.knownWords.length;
    }

    setupTabNavigation() {
        const navTabs = document.querySelectorAll('.nav-tab');
        const tabContents = document.querySelectorAll('.tab-content');

        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                // Update active tab
                navTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update active content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                });
                
                const targetContent = document.getElementById(targetTab + 'Tab');
                if (targetContent) {
                    targetContent.classList.add('active');
                }
                
                this.currentTab = targetTab;
            });
        });
    }

    setupEventListeners() {
        // Assessment button
        document.getElementById('startAssessmentBtn').addEventListener('click', 
            () => this.startAssessment());

        // Quiz buttons
        document.getElementById('knowBtn').addEventListener('click', 
            () => this.answerQuestion(true));
        document.getElementById('unknownBtn').addEventListener('click', 
            () => this.answerQuestion(false));

        // Settings
        document.getElementById('showTranslationToggle').addEventListener('change', 
            (e) => this.updateSetting('showTranslationOnHover', e.target.checked));
        document.getElementById('fontSizeSelect').addEventListener('change', 
            (e) => this.updateSetting('fontSize', e.target.value));
        document.getElementById('positionSelect').addEventListener('change', 
            (e) => this.updateSetting('subtitlePosition', e.target.value));
        document.getElementById('displayModeSelect').addEventListener('change', 
            (e) => this.updateSetting('displayMode', e.target.value));
        document.getElementById('immersiveModeToggle').addEventListener('change', 
            (e) => this.updateSetting('immersiveMode', e.target.checked));
        
        // New Tab settings
        document.getElementById('newTabLearningToggle').addEventListener('change', 
            (e) => this.updateSetting('newTabLearningToggle', e.target.checked));
        document.getElementById('newTabEnabled').addEventListener('change', 
            (e) => this.updateNewTabSetting(e.target.checked));
        document.getElementById('openNewTabPreview').addEventListener('click', 
            () => this.openNewTabPreview());
        document.getElementById('resetNewTabSettings').addEventListener('click', 
            () => this.resetNewTabSettings());

        // Learning section
        document.getElementById('reviewWordsBtn').addEventListener('click', 
            () => this.showStudyMode());

        // Study mode buttons
        if (document.getElementById('pronounceBtn')) {
            document.getElementById('pronounceBtn').addEventListener('click', 
                () => this.pronounceWord());
        }
        if (document.getElementById('nextWordBtn')) {
            document.getElementById('nextWordBtn').addEventListener('click', 
                () => this.nextStudyWord());
        }
        if (document.getElementById('backToProgressBtn')) {
            document.getElementById('backToProgressBtn').addEventListener('click', 
                () => this.hideStudyMode());
        }
        
        // Extension toggle
        document.getElementById('extensionToggle').addEventListener('change', 
            (e) => this.toggleExtension(e.target.checked));

        // Translation settings
        document.getElementById('translationEnabled').addEventListener('change', 
            (e) => this.updateTranslationSetting('translationEnabled', e.target.checked));
        document.getElementById('translationProvider').addEventListener('change', 
            (e) => this.updateTranslationProvider(e.target.value));
        document.getElementById('translationLanguage').addEventListener('change', 
            (e) => this.updateTranslationSetting('translationLanguage', e.target.value));
        document.getElementById('showTranslationOnHover').addEventListener('change', 
            (e) => this.updateTranslationSetting('showTranslationOnHover', e.target.checked));
        document.getElementById('saveTranslationSettings').addEventListener('click', 
            () => this.saveTranslationSettings());
    }

    updateUI() {
        // Update vocabulary level display
        const levelDisplay = document.getElementById('currentLevel');
        if (this.settings.vocabularyLevel) {
            levelDisplay.textContent = `${this.settings.vocabularyLevel} words`;
            levelDisplay.style.color = '#28a745';
        } else {
            levelDisplay.textContent = 'Not Assessed';
            levelDisplay.style.color = '#dc3545';
        }

        // Update settings UI
        document.getElementById('showTranslationToggle').checked = this.settings.showTranslationOnHover;
        document.getElementById('fontSizeSelect').value = this.settings.fontSize;
        document.getElementById('positionSelect').value = this.settings.subtitlePosition;
        document.getElementById('displayModeSelect').value = this.settings.displayMode;
        document.getElementById('immersiveModeToggle').checked = this.settings.immersiveMode;
        
        // Update translation settings UI
        document.getElementById('translationEnabled').checked = this.settings.translationEnabled;
        document.getElementById('translationProvider').value = this.settings.translationProvider;
        document.getElementById('translationLanguage').value = this.settings.translationLanguage;
        document.getElementById('showTranslationOnHover').checked = this.settings.showTranslationOnHover;
        
        // Update API key fields
        document.getElementById('deeplApiKey').value = this.settings.apiKeys.deepl;
        document.getElementById('claudeApiKey').value = this.settings.apiKeys.claude;
        document.getElementById('openaiApiKey').value = this.settings.apiKeys.openai;
        document.getElementById('xaiApiKey').value = this.settings.apiKeys.xai;
        document.getElementById('geminiApiKey').value = this.settings.apiKeys.gemini;
        
        // Update API key visibility
        this.updateApiKeyVisibility(this.settings.translationProvider);
        
        // Update extension toggle
        const extensionEnabled = this.settings.extensionEnabled;
        document.getElementById('extensionToggle').checked = extensionEnabled;
        document.getElementById('toggleLabel').textContent = extensionEnabled ? 'ON' : 'OFF';
        
        // Update new tab settings UI
        document.getElementById('newTabEnabled').checked = this.settings.newTabEnabled;
        document.getElementById('newTabLearningToggle').checked = this.settings.newTabLearningToggle;

        // Show/hide review button based on learning words
        const reviewBtn = document.getElementById('reviewWordsBtn');
        if (this.learningWords.length > 0) {
            reviewBtn.style.display = 'block';
        } else {
            reviewBtn.style.display = 'none';
        }
    }

    async startAssessment() {
        try {
            // Generate assessment words from data file
            this.assessmentWords = await this.generateAssessmentWords();
            this.currentQuestion = 0;
            this.knownWords = 0;

            // Show quiz interface
            document.getElementById('assessmentStatus').style.display = 'none';
            document.getElementById('assessmentQuiz').style.display = 'block';

            this.showNextQuestion();
        } catch (error) {
            console.error('Error starting assessment:', error);
            this.showNotification('Error loading assessment. Please try again.', 'error');
        }
    }

    async generateAssessmentWords() {
        try {
            // Load assessment words from data file
            const response = await fetch(chrome.runtime.getURL('data/assessment-words.json'));
            const assessmentData = await response.json();
            
            // Sort by difficulty level and select a good distribution
            const easyWords = assessmentData.filter(w => w.level <= 2500);
            const mediumWords = assessmentData.filter(w => w.level > 2500 && w.level <= 3500);
            const hardWords = assessmentData.filter(w => w.level > 3500);
            
            // Create balanced selection: 8 easy, 10 medium, 7 hard
            const selectedWords = [
                ...this.shuffleArray(easyWords).slice(0, 8),
                ...this.shuffleArray(mediumWords).slice(0, 10),
                ...this.shuffleArray(hardWords).slice(0, 7)
            ];
            
            // Shuffle the final selection and extract just the words
            return this.shuffleArray(selectedWords).map(item => item.word);
        } catch (error) {
            console.error('Error loading assessment words:', error);
            // Fallback to simple word list
            const fallbackWords = [
                'abundant', 'acquire', 'adequate', 'adjacent', 'advocate',
                'appreciate', 'arbitrary', 'behalf', 'bulk', 'capable',
                'colleague', 'comprehensive', 'concentrate', 'conflict', 'consent',
                'constitute', 'contemporary', 'contradict', 'controversial', 'criteria',
                'demonstrate', 'derive', 'domestic', 'eliminate', 'emerge'
            ];
            return this.shuffleArray(fallbackWords).slice(0, this.totalQuestions);
        }
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    showNextQuestion() {
        if (this.currentQuestion >= this.totalQuestions) {
            this.completeAssessment();
            return;
        }

        const word = this.assessmentWords[this.currentQuestion];
        document.getElementById('questionWord').textContent = word;
        
        // Update progress
        const progress = ((this.currentQuestion + 1) / this.totalQuestions) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('progressText').textContent = 
            `Question ${this.currentQuestion + 1} of ${this.totalQuestions}`;
    }

    answerQuestion(knows) {
        if (knows) {
            this.knownWords++;
        }
        
        this.currentQuestion++;
        this.showNextQuestion();
    }

    async completeAssessment() {
        // Calculate vocabulary level based on known words
        const vocabularyLevel = Math.round((this.knownWords / this.totalQuestions) * 5000);
        
        // Save results
        await this.updateSetting('vocabularyLevel', vocabularyLevel);
        await this.updateSetting('lastAssessmentDate', new Date().toISOString());
        await this.updateSetting('isFirstTime', false);

        // Hide quiz and show results
        document.getElementById('assessmentQuiz').style.display = 'none';
        document.getElementById('assessmentStatus').style.display = 'block';
        
        // Update UI
        this.updateUI();

        // Show success message
        this.showNotification(`Assessment complete! Your vocabulary level: ${vocabularyLevel} words`, 'success');
    }

    async updateSetting(key, value) {
        this.settings[key] = value;
        await chrome.storage.local.set({ [key]: value });
        
        // Notify content scripts of setting changes
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'SETTINGS_UPDATED',
                    settings: this.settings
                });
            }
        } catch (error) {
            // Tab might not have content script injected
            console.log('Could not notify content script:', error);
        }
    }

    showStudyMode() {
        if (this.learningWords.length === 0) {
            this.showNotification('No words to study. Watch some videos to build your learning list!', 'info');
            return;
        }

        // Show study mode within the learning tab
        document.getElementById('studyMode').style.display = 'block';
        this.currentStudyIndex = 0;
        this.showStudyWord();
    }

    hideStudyMode() {
        document.getElementById('studyMode').style.display = 'none';
    }

    async toggleExtension(enabled) {
        // Update settings
        this.settings.extensionEnabled = enabled;
        await this.updateSetting('extensionEnabled', enabled);
        
        // Update UI
        document.getElementById('toggleLabel').textContent = enabled ? 'ON' : 'OFF';
        
        // Notify content scripts
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'TOGGLE_EXTENSION',
                    enabled: enabled
                });
            }
        } catch (error) {
            console.log('Could not notify content script:', error);
        }
        
        // Show notification
        this.showNotification(
            enabled ? 'Extension enabled' : 'Extension disabled', 
            enabled ? 'success' : 'info'
        );
    }

    showStudyWord() {
        if (this.currentStudyIndex >= this.learningWords.length) {
            this.completeStudySession();
            return;
        }

        const word = this.learningWords[this.currentStudyIndex];
        document.getElementById('studyWord').textContent = word;
        document.getElementById('studyDefinition').textContent = 'Loading definition...';
        document.getElementById('studyProgress').textContent = 
            `${this.currentStudyIndex + 1} / ${this.learningWords.length} words`;

        // In a real implementation, fetch definition from dictionary API
        setTimeout(() => {
            document.getElementById('studyDefinition').textContent = 
                `Definition for "${word}" would appear here.`;
        }, 500);
    }

    pronounceWord() {
        const word = document.getElementById('studyWord').textContent;
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        }
    }

    nextStudyWord() {
        this.currentStudyIndex++;
        this.showStudyWord();
    }

    completeStudySession() {
        this.showNotification('Study session complete!', 'success');
        this.hideStudyMode();
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Listen for messages from the background script or content scripts
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.type) {
                case 'UPDATE_LEARNING_WORDS':
                    this.learningWords = request.words || [];
                    this.loadLearningProgress();
                    this.updateUI();
                    break;
                    
                case 'SIDEBAR_REFRESH':
                    this.loadSettings().then(() => {
                        this.loadLearningProgress();
                        this.updateUI();
                    });
                    break;
            }
            
            return true;
        });
    }

    // ========== Subtitle Timeline Features ==========

    setupSubtitleFeatures() {
        // Setup subtitle timeline controls
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterMode = btn.dataset.mode;
                this.updateSubtitleDisplay();
            });
        });

        // Setup action buttons
        document.getElementById('refreshSubtitles')?.addEventListener('click', () => {
            this.requestSubtitleRefresh();
        });

        document.getElementById('clearSubtitles')?.addEventListener('click', () => {
            this.clearSubtitleTimeline();
        });

        // Listen for messages from content scripts
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleContentScriptMessage(message, sender);
        });

        // Check for active tab
        this.checkActiveVideoTab();
        
        // Listen for tab changes
        this.setupTabChangeListener();
    }

    async checkActiveVideoTab() {
        try {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (activeTab && (activeTab.url.includes('youtube.com') || activeTab.url.includes('netflix.com'))) {
                this.switchToTab(activeTab.id, activeTab.url);
                this.updateConnectionStatus(true);
                this.requestSubtitleData();
            } else {
                this.updateConnectionStatus(false);
                this.currentSessionId = null;
            }
        } catch (error) {
            console.error('🎧 ELA: Error checking active tab:', error);
            this.updateConnectionStatus(false);
        }
    }

    switchToTab(tabId, url) {
        // Save current session if exists
        if (this.currentSessionId && this.activeTabId) {
            this.saveCurrentSession();
        }

        this.activeTabId = tabId;
        this.currentSessionId = `${tabId}_${this.getVideoIdFromUrl(url)}`;

        // Load session data if exists
        if (this.tabSessions.has(this.currentSessionId)) {
            this.loadSession(this.currentSessionId);
        } else {
            // Create new session
            this.createNewSession(this.currentSessionId, url);
        }

        console.log('🎧 ELA: Switched to session:', this.currentSessionId);
    }

    getVideoIdFromUrl(url) {
        if (url.includes('youtube.com')) {
            const match = url.match(/[?&]v=([^&]+)/);
            return match ? match[1] : 'unknown';
        } else if (url.includes('netflix.com')) {
            const match = url.match(/watch\/(\d+)/);
            return match ? match[1] : 'unknown';
        }
        return 'unknown';
    }

    createNewSession(sessionId, url) {
        const session = {
            id: sessionId,
            url: url,
            platform: url.includes('youtube.com') ? 'youtube' : 'netflix',
            subtitles: [],
            currentIndex: -1,
            createdAt: Date.now(),
            lastActive: Date.now()
        };

        this.tabSessions.set(sessionId, session);
        this.subtitleTimeline = [];
        this.currentSubtitleIndex = -1;
        this.updateSubtitleDisplay();
    }

    saveCurrentSession() {
        if (this.currentSessionId && this.tabSessions.has(this.currentSessionId)) {
            const session = this.tabSessions.get(this.currentSessionId);
            session.subtitles = [...this.subtitleTimeline];
            session.currentIndex = this.currentSubtitleIndex;
            session.lastActive = Date.now();
        }
    }

    loadSession(sessionId) {
        const session = this.tabSessions.get(sessionId);
        if (session) {
            this.subtitleTimeline = [...session.subtitles];
            this.currentSubtitleIndex = session.currentIndex;
            session.lastActive = Date.now();
            this.updateSubtitleDisplay();
            this.updateSubtitleCount();
        }
    }

    updateConnectionStatus(connected) {
        this.isConnectedToVideo = connected;
        const statusElement = document.getElementById('connectionStatus');
        const statusText = statusElement?.querySelector('.status-text');
        
        if (statusElement && statusText) {
            if (connected) {
                statusElement.classList.remove('disconnected');
                statusElement.classList.add('connected');
                statusText.textContent = '已连接到视频页面';
            } else {
                statusElement.classList.remove('connected');
                statusElement.classList.add('disconnected');
                statusText.textContent = '未连接到视频页面';
            }
        }
    }

    async requestSubtitleData() {
        if (!this.activeTabId) return;

        try {
            const response = await chrome.tabs.sendMessage(this.activeTabId, {
                type: 'GET_SUBTITLE_TIMELINE'
            });

            if (response && response.subtitles) {
                this.subtitleTimeline = response.subtitles;
                this.updateSubtitleDisplay();
                this.updateSubtitleCount();
            }
        } catch (error) {
            console.log('🎧 ELA: No subtitle data available yet');
        }
    }

    requestSubtitleRefresh() {
        if (!this.activeTabId) return;

        chrome.tabs.sendMessage(this.activeTabId, {
            type: 'REFRESH_SUBTITLES'
        }).catch(() => {
            console.log('🎧 ELA: Could not refresh subtitles');
        });
    }

    handleContentScriptMessage(message, sender) {
        // Only process messages from the currently active tab
        if (sender.tab && sender.tab.id !== this.activeTabId) {
            return;
        }

        switch (message.type) {
            case 'SUBTITLE_TIMELINE_UPDATE':
                if (message.subtitles) {
                    this.subtitleTimeline = message.subtitles;
                    this.updateSubtitleDisplay();
                    this.updateSubtitleCount();
                    this.saveCurrentSession();
                }
                break;

            case 'CURRENT_SUBTITLE_UPDATE':
                if (typeof message.index === 'number') {
                    this.currentSubtitleIndex = message.index;
                    this.highlightCurrentSubtitle();
                    this.saveCurrentSession();
                }
                break;

            case 'PLAYBACK_TIME_UPDATE':
                if (message.currentTime !== undefined && message.duration !== undefined) {
                    this.updatePlaybackTime(message.currentTime, message.duration);
                }
                break;
        }
    }

    updateSubtitleDisplay() {
        const timeline = document.getElementById('subtitleTimeline');
        if (!timeline) return;

        timeline.innerHTML = '';

        if (this.subtitleTimeline.length === 0) {
            timeline.innerHTML = `
                <li class="empty-state">
                    <div class="empty-icon">📺</div>
                    <div class="empty-title">等待字幕数据</div>
                    <div class="empty-desc">请在YouTube或Netflix页面播放有字幕的视频</div>
                </li>
            `;
            return;
        }

        let itemsToShow = this.subtitleTimeline;

        // Filter based on mode
        if (this.filterMode === 'unknown') {
            itemsToShow = this.subtitleTimeline.filter(item => 
                this.hasUnknownWords(item.cleanText || item.text)
            );
        }

        itemsToShow.forEach((item, index) => {
            const li = document.createElement('li');
            li.dataset.index = item.index || index;
            li.dataset.startTime = item.startTime;

            li.innerHTML = `
                <div class="subtitle-time">${this.formatTime(item.startTime)} → ${this.formatTime(item.endTime)}</div>
                <div class="subtitle-text">${this.processSubtitleText(item.text)}</div>
            `;

            li.addEventListener('click', () => {
                this.jumpToSubtitle(item.startTime, item.index || index);
            });

            timeline.appendChild(li);
        });
    }

    processSubtitleText(text) {
        const words = text.split(/\s+/);
        return words.map(word => {
            const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
            const isUnknown = this.learningWords.includes(cleanWord);
            const isKnown = this.settings.knownWords?.includes(cleanWord);

            let className = 'subtitle-word';
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

    hasUnknownWords(text) {
        const words = text.split(/\s+/);
        return words.some(word => {
            const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
            return this.learningWords.includes(cleanWord);
        });
    }

    jumpToSubtitle(startTime, index) {
        if (!this.activeTabId) return;

        chrome.tabs.sendMessage(this.activeTabId, {
            type: 'JUMP_TO_TIME',
            time: startTime,
            index: index
        }).catch(() => {
            console.log('🎧 ELA: Could not jump to subtitle');
        });
    }

    highlightCurrentSubtitle() {
        const timeline = document.getElementById('subtitleTimeline');
        if (!timeline) return;

        // Remove previous highlight
        const previousCurrent = timeline.querySelector('li.current');
        if (previousCurrent) {
            previousCurrent.classList.remove('current');
        }

        // Add new highlight
        const items = timeline.querySelectorAll('li');
        const currentItem = Array.from(items).find(item => 
            parseInt(item.dataset.index) === this.currentSubtitleIndex
        );

        if (currentItem) {
            currentItem.classList.add('current');
            currentItem.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }
    }

    updateSubtitleCount() {
        const countElement = document.getElementById('subtitleCount');
        if (countElement) {
            countElement.textContent = `${this.subtitleTimeline.length} 条字幕`;
        }
    }

    updatePlaybackTime(currentTime, duration) {
        const currentTimeElement = document.getElementById('currentTime');
        const totalTimeElement = document.getElementById('totalTime');

        if (currentTimeElement) {
            currentTimeElement.textContent = this.formatTime(currentTime);
        }
        if (totalTimeElement) {
            totalTimeElement.textContent = this.formatTime(duration);
        }
    }

    clearSubtitleTimeline() {
        this.subtitleTimeline = [];
        this.currentSubtitleIndex = -1;
        this.updateSubtitleDisplay();
        this.updateSubtitleCount();
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    setupTabChangeListener() {
        // Listen for tab activation changes
        chrome.tabs.onActivated.addListener((activeInfo) => {
            this.handleTabChange(activeInfo.tabId);
        });

        // Listen for tab updates (URL changes)
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.active && 
                (tab.url.includes('youtube.com') || tab.url.includes('netflix.com'))) {
                this.handleTabChange(tabId, tab.url);
            }
        });
    }

    async handleTabChange(tabId, url = null) {
        try {
            if (!url) {
                const tab = await chrome.tabs.get(tabId);
                url = tab.url;
            }

            if (url && (url.includes('youtube.com') || url.includes('netflix.com'))) {
                this.switchToTab(tabId, url);
                this.updateConnectionStatus(true);
                this.requestSubtitleData();
            } else if (tabId === this.activeTabId) {
                // Current tab switched to non-video page
                this.updateConnectionStatus(false);
            }
        } catch (error) {
            console.log('🎧 ELA: Tab change handling error:', error);
        }
    }

    // ========== Translation Settings Methods ==========

    updateTranslationProvider(provider) {
        this.settings.translationProvider = provider;
        this.updateApiKeyVisibility(provider);
        chrome.storage.local.set({ translationProvider: provider });
        this.notifyContentScripts();
    }

    updateTranslationSetting(key, value) {
        this.settings[key] = value;
        chrome.storage.local.set({ [key]: value });
        this.notifyContentScripts();
    }

    updateApiKeyVisibility(provider) {
        const apiKeyGroups = [
            'deeplApiKeyGroup', 'claudeApiKeyGroup', 'openaiApiKeyGroup', 
            'xaiApiKeyGroup', 'geminiApiKeyGroup'
        ];
        
        // Hide all API key groups
        apiKeyGroups.forEach(groupId => {
            const group = document.getElementById(groupId);
            if (group) group.style.display = 'none';
        });
        
        // Show the relevant API key group
        const providerMapping = {
            'deepl': 'deeplApiKeyGroup',
            'claude': 'claudeApiKeyGroup',
            'chatgpt': 'openaiApiKeyGroup',
            'xai': 'xaiApiKeyGroup',
            'gemini': 'geminiApiKeyGroup'
        };
        
        const relevantGroup = providerMapping[provider];
        if (relevantGroup) {
            const group = document.getElementById(relevantGroup);
            if (group) group.style.display = 'block';
        }
    }

    async saveTranslationSettings() {
        try {
            // Collect API keys
            const apiKeys = {
                deepl: document.getElementById('deeplApiKey').value,
                claude: document.getElementById('claudeApiKey').value,
                openai: document.getElementById('openaiApiKey').value,
                xai: document.getElementById('xaiApiKey').value,
                gemini: document.getElementById('geminiApiKey').value
            };

            // Update settings
            this.settings.apiKeys = apiKeys;

            // Save to storage
            await chrome.storage.local.set({
                translationEnabled: this.settings.translationEnabled,
                translationProvider: this.settings.translationProvider,
                translationLanguage: this.settings.translationLanguage,
                showTranslationOnHover: this.settings.showTranslationOnHover,
                deeplApiKey: apiKeys.deepl,
                claudeApiKey: apiKeys.claude,
                openaiApiKey: apiKeys.openai,
                xaiApiKey: apiKeys.xai,
                geminiApiKey: apiKeys.gemini
            });

            // Notify content scripts
            this.notifyContentScripts();

            // Show success message
            this.showNotification('翻译设置已保存', 'success');
        } catch (error) {
            console.error('Error saving translation settings:', error);
            this.showNotification('保存翻译设置失败', 'error');
        }
    }

    async notifyContentScripts() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'TRANSLATION_SETTINGS_UPDATED',
                    settings: this.settings
                });
            }
        } catch (error) {
            console.log('Could not notify content script about translation settings:', error);
        }
    }

    // ========== New Tab Settings Methods ==========

    async updateNewTabSetting(enabled) {
        try {
            this.settings.newTabEnabled = enabled;
            await chrome.storage.local.set({ newTabEnabled: enabled });
            
            // Update UI feedback
            const statusText = enabled ? 'New Tab Dashboard enabled' : 'New Tab Dashboard disabled';
            this.showNotification(statusText, enabled ? 'success' : 'info');
            
            console.log('🎧 ELA: New Tab setting updated:', enabled);
        } catch (error) {
            console.error('Error updating new tab setting:', error);
            this.showNotification('Failed to update New Tab setting', 'error');
        }
    }

    openNewTabPreview() {
        try {
            // Open the new tab dashboard in a new tab for preview
            chrome.tabs.create({ 
                url: chrome.runtime.getURL('newtab/newtab.html'),
                active: true 
            });
            
            this.showNotification('New Tab preview opened', 'info');
            console.log('🎧 ELA: New Tab preview opened');
        } catch (error) {
            console.error('Error opening new tab preview:', error);
            this.showNotification('Failed to open preview', 'error');
        }
    }

    async resetNewTabSettings() {
        try {
            // Reset new tab related settings to defaults
            const defaultSettings = {
                newTabEnabled: true,
                newTabLearningToggle: true
            };

            // Update local settings
            Object.assign(this.settings, defaultSettings);
            
            // Save to storage
            await chrome.storage.local.set(defaultSettings);
            
            // Update UI
            document.getElementById('newTabEnabled').checked = defaultSettings.newTabEnabled;
            document.getElementById('newTabLearningToggle').checked = defaultSettings.newTabLearningToggle;
            
            this.showNotification('New Tab settings reset to default', 'success');
            console.log('🎧 ELA: New Tab settings reset to default');
        } catch (error) {
            console.error('Error resetting new tab settings:', error);
            this.showNotification('Failed to reset settings', 'error');
        }
    }
}

// Initialize sidebar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const sidebarManager = new SidebarManager();
    sidebarManager.setupMessageListener();
    
    console.log('🎧 ELA: Sidebar initialized in Chrome Side Panel');
});

// Add notification animations via CSS-in-JS for better encapsulation
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(notificationStyles);