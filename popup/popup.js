// English Listening Assistant - Popup JavaScript
// Handles vocabulary assessment, settings, and learning interface

class PopupManager {
    constructor() {
        this.currentQuestion = 0;
        this.totalQuestions = 25;
        this.knownWords = 0;
        this.assessmentWords = [];
        this.learningWords = [];
        
        this.initializePopup();
    }

    async initializePopup() {
        await this.loadSettings();
        await this.loadLearningProgress();
        this.setupEventListeners();
        this.updateUI();
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
                'lastAssessmentDate'
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
                lastAssessmentDate: result.lastAssessmentDate
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
            lastAssessmentDate: null
        };
    }

    async loadLearningProgress() {
        this.learningWords = this.settings.learningWords || [];
        // Update stats display
        document.getElementById('wordsLearning').textContent = this.learningWords.length;
        document.getElementById('wordsKnown').textContent = this.settings.knownWords.length;
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

        // Review words button
        document.getElementById('reviewWordsBtn').addEventListener('click', 
            () => this.showStudyMode());

        // Study mode buttons
        document.getElementById('pronounceBtn').addEventListener('click', 
            () => this.pronounceWord());
        document.getElementById('nextWordBtn').addEventListener('click', 
            () => this.nextStudyWord());
        document.getElementById('backToMainBtn').addEventListener('click', 
            () => this.showMainSections());
        
        // Extension toggle
        document.getElementById('extensionToggle').addEventListener('change', 
            (e) => this.toggleExtension(e.target.checked));
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
        
        // Update extension toggle
        const extensionEnabled = this.settings.extensionEnabled !== false; // Default to true
        document.getElementById('extensionToggle').checked = extensionEnabled;
        document.getElementById('toggleLabel').textContent = extensionEnabled ? 'ON' : 'OFF';

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
            chrome.tabs.sendMessage(tab.id, {
                type: 'SETTINGS_UPDATED',
                settings: this.settings
            });
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

        // Hide other sections and show study mode
        document.getElementById('vocabularySection').style.display = 'none';
        document.getElementById('learningSection').style.display = 'none';
        document.getElementById('settingsSection').style.display = 'none';
        document.getElementById('studySection').style.display = 'block';

        this.currentStudyIndex = 0;
        this.showStudyWord();
    }

    showMainSections() {
        // Show all main sections and hide study mode
        document.getElementById('vocabularySection').style.display = 'block';
        document.getElementById('learningSection').style.display = 'block';
        document.getElementById('settingsSection').style.display = 'block';
        document.getElementById('studySection').style.display = 'none';
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
        this.exitStudyMode();
    }

    exitStudyMode() {
        // Show all sections again
        document.getElementById('vocabularySection').style.display = 'block';
        document.getElementById('learningSection').style.display = 'block';
        document.getElementById('settingsSection').style.display = 'block';
        document.getElementById('studySection').style.display = 'none';
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 4px;
            color: white;
            font-size: 12px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        // Set color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };
        notification.style.background = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);