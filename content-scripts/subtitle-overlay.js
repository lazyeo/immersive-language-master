// English Listening Assistant - Subtitle Overlay Manager
// Common functionality for subtitle overlays across different platforms

class SubtitleOverlayManager {
    constructor() {
        this.settings = {};
        this.isOverlayActive = false;
        this.currentSubtitle = null;
        this.learningWords = new Set();
        
        this.initializeOverlay();
    }

    async initializeOverlay() {
        await this.loadSettings();
        this.setupKeyboardShortcuts();
        this.setupMessageListener();
        
        console.log('Subtitle Overlay Manager initialized');
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get([
                'vocabularyLevel',
                'showTranslationOnHover',
                'subtitlePosition',
                'fontSize',
                'learningWords'
            ]);

            this.settings = {
                vocabularyLevel: result.vocabularyLevel || 3000,
                showTranslationOnHover: result.showTranslationOnHover !== false,
                subtitlePosition: result.subtitlePosition || 'bottom',
                fontSize: result.fontSize || 'medium',
                learningWords: result.learningWords || []
            };

            // Convert array to Set safely
            this.learningWords = new Set(Array.isArray(this.settings.learningWords) ? this.settings.learningWords : []);
        } catch (error) {
            console.error('Error loading overlay settings:', error);
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + Shift + E: Toggle extension
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'E') {
                event.preventDefault();
                this.toggleExtension();
            }
            
            // Ctrl/Cmd + Shift + S: Show study mode
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
                event.preventDefault();
                this.showStudyMode();
            }
            
            // Ctrl/Cmd + Shift + H: Toggle translation hover
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'H') {
                event.preventDefault();
                this.toggleTranslationHover();
            }
        });
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.type) {
                case 'SHOW_STUDY_MODAL':
                    this.showStudyModal(request.words);
                    break;
                    
                case 'UPDATE_LEARNING_WORDS':
                    this.learningWords = new Set(request.words);
                    break;
                    
                case 'SETTINGS_UPDATED':
                    this.settings = { ...this.settings, ...request.settings };
                    this.updateOverlaySettings();
                    break;
                    
                default:
                    break;
            }
            
            return true;
        });
    }

    async toggleExtension() {
        // Get current extension state from storage
        const result = await chrome.storage.local.get(['extensionEnabled']);
        const currentState = result.extensionEnabled !== false; // Default to true
        const newState = !currentState;
        
        // Update storage
        await chrome.storage.local.set({ extensionEnabled: newState });
        
        // Show indicator
        this.showLearningIndicator(newState ? 'Extension Activated' : 'Extension Deactivated');
        
        // Send message to all content scripts (same as popup does)
        chrome.runtime.sendMessage({
            type: 'TOGGLE_EXTENSION',
            enabled: newState
        }).catch(() => {
            // Background script might not be ready, try direct content script communication
            window.postMessage({
                type: 'ELA_TOGGLE_EXTENSION',
                enabled: newState
            }, '*');
        });
        
        console.log('🎧 ELA: Extension toggled via keyboard shortcut:', newState ? 'ON' : 'OFF');
    }

    toggleTranslationHover() {
        this.settings.showTranslationOnHover = !this.settings.showTranslationOnHover;
        
        // Save setting
        chrome.storage.local.set({ showTranslationOnHover: this.settings.showTranslationOnHover });
        
        this.showLearningIndicator(
            this.settings.showTranslationOnHover ? 
            'Translation hover enabled' : 
            'Translation hover disabled'
        );
    }

    showLearningIndicator(message, duration = 2000) {
        // Remove existing indicator
        const existing = document.getElementById('ela-learning-indicator');
        if (existing) {
            existing.remove();
        }
        
        // Create new indicator
        const indicator = document.createElement('div');
        indicator.id = 'ela-learning-indicator';
        indicator.className = 'ela-learning-indicator';
        indicator.textContent = message;
        
        document.body.appendChild(indicator);
        
        // Auto-remove after duration
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, duration);
    }

    showStudyMode() {
        if (this.learningWords.size === 0) {
            this.showLearningIndicator('No new words to study');
            return;
        }
        
        this.showStudyModal(Array.from(this.learningWords));
    }

    showStudyModal(words) {
        // Remove existing modal
        this.hideStudyModal();
        
        // Create modal overlay
        const modal = document.createElement('div');
        modal.id = 'ela-study-modal';
        modal.className = 'ela-study-modal';
        
        // Create modal content
        const content = document.createElement('div');
        content.className = 'ela-study-content';
        
        // Header
        const header = document.createElement('h2');
        header.textContent = `Study ${words.length} New Words`;
        content.appendChild(header);
        
        // Word list
        const wordList = document.createElement('ul');
        wordList.className = 'word-list';
        
        words.forEach((word, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'word-item';
            
            const wordSpan = document.createElement('span');
            wordSpan.className = 'word-text';
            wordSpan.textContent = word;
            
            const definitionSpan = document.createElement('span');
            definitionSpan.className = 'word-definition';
            definitionSpan.textContent = 'Loading definition...';
            
            // Add pronunciation button
            const pronounceBtn = document.createElement('button');
            pronounceBtn.className = 'ela-btn ela-btn-secondary';
            pronounceBtn.textContent = '🔊';
            pronounceBtn.onclick = () => this.pronounceWord(word);
            
            listItem.appendChild(wordSpan);
            listItem.appendChild(definitionSpan);
            listItem.appendChild(pronounceBtn);
            wordList.appendChild(listItem);
            
            // Load definition asynchronously
            this.getWordDefinition(word).then(definition => {
                definitionSpan.textContent = definition;
            });
        });
        
        content.appendChild(wordList);
        
        // Control buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'margin-top: 20px; text-align: center;';
        
        const studyBtn = document.createElement('button');
        studyBtn.className = 'ela-btn ela-btn-primary';
        studyBtn.textContent = 'Start Studying';
        studyBtn.style.marginRight = '10px';
        studyBtn.onclick = () => {
            this.hideStudyModal();
            this.startInteractiveStudy(words);
        };
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'ela-btn ela-btn-secondary';
        closeBtn.textContent = 'Close';
        closeBtn.onclick = () => this.hideStudyModal();
        
        buttonContainer.appendChild(studyBtn);
        buttonContainer.appendChild(closeBtn);
        content.appendChild(buttonContainer);
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideStudyModal();
            }
        });
    }

    hideStudyModal() {
        const modal = document.getElementById('ela-study-modal');
        if (modal) {
            modal.remove();
        }
    }

    async getWordDefinition(word) {
        // Placeholder implementation
        // In a real implementation, this would call a dictionary API
        const definitions = {
            'example': 'a thing characteristic of its kind or illustrating a general rule',
            'important': 'of great significance or value',
            'necessary': 'required to be done, achieved, or present',
            'available': 'able to be used or obtained',
            'different': 'not the same as another or each other'
        };
        
        return definitions[word.toLowerCase()] || `Definition for "${word}"`;
    }

    pronounceWord(word) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        }
    }

    startInteractiveStudy(words) {
        let currentIndex = 0;
        
        const showNextWord = () => {
            if (currentIndex >= words.length) {
                this.showLearningIndicator('Study session complete!', 3000);
                return;
            }
            
            const word = words[currentIndex];
            this.showWordStudyCard(word, () => {
                currentIndex++;
                setTimeout(showNextWord, 500);
            });
        };
        
        showNextWord();
    }

    showWordStudyCard(word, onNext) {
        // Create a temporary study card
        const card = document.createElement('div');
        card.className = 'ela-study-card';
        card.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10003;
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            text-align: center;
            max-width: 400px;
            width: 90%;
        `;
        
        const wordElement = document.createElement('h2');
        wordElement.textContent = word;
        wordElement.style.cssText = 'margin-bottom: 15px; color: #333; font-size: 28px;';
        
        const pronounceBtn = document.createElement('button');
        pronounceBtn.className = 'ela-btn ela-btn-secondary';
        pronounceBtn.textContent = '🔊 Pronounce';
        pronounceBtn.style.marginBottom = '20px';
        pronounceBtn.onclick = () => this.pronounceWord(word);
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'ela-btn ela-btn-primary';
        nextBtn.textContent = 'Next Word';
        nextBtn.onclick = () => {
            card.remove();
            onNext();
        };
        
        card.appendChild(wordElement);
        card.appendChild(pronounceBtn);
        card.appendChild(document.createElement('br'));
        card.appendChild(nextBtn);
        
        document.body.appendChild(card);
        
        // Auto-advance after 3 seconds
        setTimeout(() => {
            if (card.parentNode) {
                card.remove();
                onNext();
            }
        }, 3000);
    }

    updateOverlaySettings() {
        // Update any active overlays with new settings
        const customSubtitle = document.getElementById('ela-custom-subtitle');
        if (customSubtitle) {
            this.applySubtitleStyling(customSubtitle);
        }
    }

    applySubtitleStyling(element) {
        const position = this.settings.subtitlePosition;
        const fontSize = this.settings.fontSize;
        
        // Apply font size
        const fontSizes = {
            small: '14px',
            medium: '18px',
            large: '24px'
        };
        element.style.fontSize = fontSizes[fontSize];
        
        // Reset position styles
        element.style.top = '';
        element.style.bottom = '';
        element.style.transform = 'translateX(-50%)';
        
        // Apply position
        switch (position) {
            case 'top':
                element.style.top = '10%';
                break;
            case 'center':
                element.style.top = '50%';
                element.style.transform = 'translate(-50%, -50%)';
                break;
            case 'bottom':
            default:
                element.style.bottom = '15%';
                break;
        }
    }

    hideAllOverlays() {
        // Hide all extension overlays
        const overlays = [
            'ela-custom-subtitle',
            'ela-tooltip',
            'ela-learning-indicator',
            'ela-progress-overlay',
            'ela-study-modal'
        ];
        
        overlays.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.remove();
            }
        });
    }

    // Public API for other content scripts
    getSettings() {
        return this.settings;
    }

    isActive() {
        return this.isOverlayActive;
    }

    addToLearningList(words) {
        words.forEach(word => this.learningWords.add(word));
        
        // Update storage
        chrome.storage.local.set({ 
            learningWords: Array.from(this.learningWords) 
        });
    }
}

// Initialize overlay manager
const overlayManager = new SubtitleOverlayManager();

// Make it globally available for other content scripts
window.elaOverlayManager = overlayManager;