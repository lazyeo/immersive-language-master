// Immersive Language Master - Universal Content Processor
// Handles content processing for all websites with preview-study-practice methodology

class UniversalProcessor {
    constructor() {
        this.isEnabled = true;
        this.currentAnalysis = null;
        this.previewSystem = null;
        this.processedElements = new Set();
        this.observer = null;
        this.contentChangeTimeout = null;
        
        this.initializeProcessor();
    }

    async initializeProcessor() {
        try {
            // Check if Chrome extension APIs are available
            if (!this.isChromeAPIAvailable()) {
                console.warn('⚠️ ILM: Chrome extension APIs not available, using fallback mode');
                this.isEnabled = true; // Assume enabled in fallback mode
            } else {
                // Check if extension is enabled
                try {
                    const result = await chrome.storage.local.get(['extensionEnabled']);
                    this.isEnabled = result.extensionEnabled !== false;
                } catch (storageError) {
                    console.warn('⚠️ ILM: Chrome storage not available, assuming enabled');
                    this.isEnabled = true;
                }
            }

            if (!this.isEnabled) {
                console.log('🚫 ILM: Extension disabled, skipping initialization');
                return;
            }

            // 🚀 PERFORMANCE: Wait for page to be stable before processing
            await this.waitForPageStability();

            // Wait for dependencies to load
            await this.waitForDependencies();
            
            // Initialize preview system
            this.initializePreviewSystem();
            
            // Setup message listener first
            this.setupMessageListener();
            
            // 🚀 PERFORMANCE: Delayed content observation to avoid processing during page load
            setTimeout(() => {
                this.startContentObservation();
            }, 2000); // Wait 2 seconds after page load
            
            // 🚀 PERFORMANCE: Further delayed initial processing
            setTimeout(() => {
                this.processPageContent();
            }, 3000); // Wait 3 seconds for page to fully settle
            
            console.log('🌐 ILM: Universal Processor initialized successfully');
        } catch (error) {
            console.error('❌ ILM: Universal Processor initialization failed:', error);
        }
    }

    /**
     * Wait for page to be in a stable state before processing
     */
    async waitForPageStability() {
        // Wait for DOM to be ready
        if (document.readyState !== 'complete') {
            await new Promise(resolve => {
                if (document.readyState === 'complete') {
                    resolve();
                } else {
                    window.addEventListener('load', resolve, { once: true });
                }
            });
        }

        // Additional delay to let dynamic content settle
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    async waitForDependencies() {
        // Load core dependencies first
        await this.loadScript('services/translation-service.js');
        await this.loadScript('core/text-analyzer.js');
        await this.loadScript('core/word-processor.js');
        
        // Load learning management system
        await this.loadScript('services/learning-manager.js');
        await this.loadScript('components/learning-dashboard.js');

        // Wait for all components to be ready
        const maxWaitTime = 8000; // Increased timeout for more dependencies
        const startTime = Date.now();
        
        while (!window.ilmTextAnalyzer || !window.ilmWordProcessor || !window.ilmLearningManager) {
            if (Date.now() - startTime > maxWaitTime) {
                console.warn('⚠️ ILM: Some dependencies not loaded within timeout');
                break; // Continue with available dependencies
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    initializePreviewSystem() {
        this.previewSystem = new PreviewSystem();
    }

    /**
     * Start observing content changes for dynamic content
     */
    startContentObservation() {
        let pendingNodes = new Set(); // Track pending nodes to avoid duplicates
        
        this.observer = new MutationObserver((mutations) => {
            let shouldReprocess = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if added nodes contain text content
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 🚀 PERFORMANCE: Skip if already pending processing
                            if (pendingNodes.has(node)) return;
                            
                            // 🚀 PERFORMANCE: Skip if node already contains processed words
                            if (node.querySelector && node.querySelector('.ilm-word')) {
                                return; // Already processed
                            }
                            
                            // 🚀 PERFORMANCE: Skip ILM-generated elements
                            if (node.classList && (
                                node.classList.contains('ilm-tooltip') ||
                                node.classList.contains('ilm-preview-modal') ||
                                node.classList.contains('ilm-word') ||
                                node.classList.contains('ilm-feedback')
                            )) {
                                return; // Skip our own elements
                            }
                            
                            // 🚀 PERFORMANCE: Enhanced content validation
                            const textContent = node.textContent?.trim();
                            if (textContent && textContent.length > 150) { // Further increased threshold
                                // Check for actual English words
                                const words = textContent.split(/\s+/).filter(word => /^[a-zA-Z]{3,}$/.test(word));
                                if (words.length >= 10) { // Minimum word count
                                    pendingNodes.add(node);
                                    shouldReprocess = true;
                                }
                            }
                        }
                    });
                }
            });

            if (shouldReprocess) {
                // 🚀 PERFORMANCE: Longer debounce with rate limiting
                clearTimeout(this.contentChangeTimeout);
                this.contentChangeTimeout = setTimeout(() => {
                    this.processNewContent();
                    pendingNodes.clear(); // Clear pending set after processing
                }, 1500); // Further increased debounce
            }
        });

        // 🚀 PERFORMANCE: More selective observation
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false, // Don't observe attribute changes
            characterData: false // Don't observe text changes
        });
    }

    /**
     * Process page content and show preview if appropriate
     */
    async processPageContent() {
        try {
            // Skip if page is too simple or is a special page
            if (this.shouldSkipPage()) {
                return;
            }

            // 🚀 NEW: Show processing indicator
            this.showProcessingIndicator();

            // Update progress
            this.updateProgress('Analyzing content...', 30);

            // Analyze page content
            this.currentAnalysis = window.ilmTextAnalyzer.analyzePageContent();
            
            if (!this.currentAnalysis) {
                console.log('📄 ILM: No substantial content found for analysis');
                this.hideProcessingIndicator();
                return;
            }

            // Update progress
            this.updateProgress('Processing vocabulary...', 60);

            console.log('📊 ILM: Content analysis completed:', {
                wordCount: this.currentAnalysis.wordCount,
                unknownWords: this.currentAnalysis.unknownWords.length,
                difficulty: this.currentAnalysis.difficulty.level
            });

            // Check if preview should be shown
            if (this.shouldShowPreview(this.currentAnalysis)) {
                // Update progress
                this.updateProgress('Preparing preview...', 90);
                await this.showPreviewModal();
                this.hideProcessingIndicator();
            } else {
                // Process content directly without preview
                this.updateProgress('Completing setup...', 100);
                this.processContentDirectly();
                setTimeout(() => this.hideProcessingIndicator(), 500);
            }

        } catch (error) {
            console.error('❌ ILM: Page content processing failed:', error);
            this.hideProcessingIndicator();
        }
    }

    /**
     * Check if page should be skipped
     * @returns {boolean} True if page should be skipped
     */
    shouldSkipPage() {
        const url = window.location.href;
        
        // Skip special pages
        const skipPatterns = [
            'chrome://',
            'chrome-extension://',
            'moz-extension://',
            'about:',
            'file://',
            'data:',
            'javascript:'
        ];

        if (skipPatterns.some(pattern => url.startsWith(pattern))) {
            return true;
        }

        // Skip if content is too minimal
        const bodyText = document.body?.textContent?.trim();
        if (!bodyText || bodyText.length < 100) {
            return true;
        }

        // Skip if page is primarily non-English
        // (Simple heuristic - check for common English words)
        const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'];
        const words = bodyText.toLowerCase().split(/\s+/).slice(0, 100);
        const englishWordCount = words.filter(word => commonWords.includes(word)).length;
        
        if (englishWordCount < words.length * 0.1) { // Less than 10% common English words
            return true;
        }

        return false;
    }

    /**
     * Check if preview should be shown based on content analysis
     * @param {Object} analysis - Content analysis results
     * @returns {boolean} True if preview should be shown
     */
    shouldShowPreview(analysis) {
        // Show preview if there are significant unknown words (>5 and >10% of content)
        const unknownWordRatio = analysis.unknownWords.length / analysis.wordCount;
        
        return analysis.unknownWords.length >= 5 && unknownWordRatio >= 0.1;
    }

    /**
     * Show preview modal with unknown words
     */
    async showPreviewModal() {
        try {
            await this.previewSystem.showPreview(this.currentAnalysis);
        } catch (error) {
            console.error('❌ ILM: Preview modal failed:', error);
            // Fallback to direct processing
            this.processContentDirectly();
        }
    }

    /**
     * Process content directly without preview
     */
    processContentDirectly() {
        this.processTextContent(document.body);
    }

    /**
     * Process new content that was dynamically added
     */
    processNewContent() {
        // 🚀 PERFORMANCE: Smart content detection with multiple filters
        const newElements = document.querySelectorAll('p:not([data-ilm-processed]), div:not([data-ilm-processed]), span:not([data-ilm-processed]), article:not([data-ilm-processed]), section:not([data-ilm-processed])');
        
        let processed = 0;
        const maxProcessed = 15; // Reduced batch size for better performance
        
        newElements.forEach(element => {
            if (processed >= maxProcessed) return; // Prevent excessive processing
            
            // 🚀 PERFORMANCE: Multi-layered content validation
            const textContent = element.textContent?.trim();
            if (!textContent || textContent.length < 100) return; // Increased minimum length
            
            // Skip if element has special attributes indicating it shouldn't be processed
            if (element.dataset.noIlm === 'true' || element.classList.contains('no-ilm')) return;
            
            // Skip if element is likely navigation, ads, or UI elements
            const skipClasses = ['nav', 'menu', 'header', 'footer', 'sidebar', 'advertisement', 'ad', 'social', 'share'];
            if (skipClasses.some(cls => element.className.includes(cls))) return;
            
            // 🚀 PERFORMANCE: Enhanced duplicate detection
            if (element.querySelector('.ilm-word') || element.dataset.ilmProcessed) return;
            
            // Check if content has sufficient word density for language learning
            const words = textContent.split(/\s+/).filter(word => /^[a-zA-Z]+$/.test(word));
            if (words.length < 20) return; // Skip content with too few words
            
            this.processTextContent(element);
            processed++;
        });

        if (processed > 0) {
            console.log(`🚀 ILM: Processed ${processed} new elements`);
        }
    }

    /**
     * Process text content in an element
     * @param {HTMLElement} element - Element to process
     */
    processTextContent(element) {
        if (!element || !this.isEnabled) return;

        try {
            // Use word processor to handle text processing
            window.ilmWordProcessor.processTextContent(element, {
                showPreview: false,
                analysis: this.currentAnalysis
            });
        } catch (error) {
            console.error('❌ ILM: Text content processing failed:', error);
        }
    }

    /**
     * Setup message listener for communication with other parts of extension
     */
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.type) {
                case 'PROCESS_PAGE_CONTENT':
                    this.processPageContent();
                    sendResponse({ success: true });
                    break;
                    
                case 'TOGGLE_EXTENSION':
                    this.isEnabled = request.enabled;
                    if (!this.isEnabled) {
                        this.cleanup();
                    } else {
                        this.processPageContent();
                    }
                    sendResponse({ success: true });
                    break;
                    
                case 'SETTINGS_UPDATED':
                    this.handleSettingsUpdate(request.settings);
                    sendResponse({ success: true });
                    break;
                    
                case 'REQUEST_PREVIEW':
                    if (this.currentAnalysis) {
                        this.showPreviewModal();
                    }
                    sendResponse({ success: true });
                    break;
                    
                case 'GET_PAGE_ANALYSIS':
                    sendResponse({ 
                        analysis: this.currentAnalysis,
                        url: window.location.href
                    });
                    break;
            }
            
            return true; // Keep message channel open for async response
        });
    }

    /**
     * Handle settings update
     * @param {Object} settings - Updated settings
     */
    handleSettingsUpdate(settings) {
        // Update word processor settings
        if (window.ilmWordProcessor) {
            window.ilmWordProcessor.userSettings = { ...window.ilmWordProcessor.userSettings, ...settings };
            
            // Reprocess content if display settings changed
            if (settings.displayMode || settings.bionicReadingEnabled !== undefined) {
                window.ilmWordProcessor.reprocessAllContent();
            }
        }
    }

    /**
     * Add word to learning list from external trigger
     * @param {string} word - Word to add
     */
    async addWordToLearning(word) {
        if (window.ilmWordProcessor) {
            await window.ilmWordProcessor.markWordAsLearning(word);
        }
    }

    /**
     * Mark word as known from external trigger
     * @param {string} word - Word to mark as known
     */
    async markWordAsKnown(word) {
        if (window.ilmWordProcessor) {
            await window.ilmWordProcessor.markWordAsKnown(word);
        }
    }

    /**
     * Get current page statistics
     * @returns {Object} Page statistics
     */
    getPageStatistics() {
        return {
            url: window.location.href,
            title: document.title,
            analysis: this.currentAnalysis,
            processedElements: this.processedElements.size,
            timestamp: Date.now()
        };
    }

    /**
     * Clean up processor (remove all modifications)
     */
    cleanup() {
        // Stop observing
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        // Clear timeouts
        if (this.contentChangeTimeout) {
            clearTimeout(this.contentChangeTimeout);
        }

        // Clean up word processor
        if (window.ilmWordProcessor) {
            window.ilmWordProcessor.cleanup();
        }

        // Clean up preview system
        if (this.previewSystem) {
            this.previewSystem.cleanup();
        }

        // Hide processing indicator
        this.hideProcessingIndicator();

        this.processedElements.clear();
    }

    /**
     * Show processing indicator
     */
    showProcessingIndicator() {
        if (document.getElementById('ilm-processing-indicator')) {
            return; // Already showing
        }

        const indicator = document.createElement('div');
        indicator.id = 'ilm-processing-indicator';
        indicator.className = 'ilm-processing-indicator';
        indicator.innerHTML = `
            <div class="ilm-processing-content">
                <div class="ilm-processing-spinner"></div>
                <div class="ilm-processing-text">Preparing content analysis...</div>
                <div class="ilm-progress-bar">
                    <div class="ilm-progress-fill" style="width: 10%"></div>
                </div>
                <div class="ilm-processing-tip">This helps identify vocabulary for better learning</div>
            </div>
        `;
        
        document.body.appendChild(indicator);
        
        // Animate in
        requestAnimationFrame(() => {
            indicator.classList.add('ilm-processing-visible');
        });
    }

    /**
     * Update progress indicator
     * @param {string} message - Progress message
     * @param {number} percentage - Progress percentage (0-100)
     */
    updateProgress(message, percentage) {
        const indicator = document.getElementById('ilm-processing-indicator');
        if (!indicator) return;

        const textElement = indicator.querySelector('.ilm-processing-text');
        const fillElement = indicator.querySelector('.ilm-progress-fill');
        
        if (textElement) textElement.textContent = message;
        if (fillElement) fillElement.style.width = `${percentage}%`;
    }

    /**
     * Hide processing indicator
     */
    hideProcessingIndicator() {
        const indicator = document.getElementById('ilm-processing-indicator');
        if (indicator) {
            indicator.classList.remove('ilm-processing-visible');
            indicator.classList.add('ilm-processing-hiding');
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.remove();
                }
            }, 300);
        }
    }

    /**
     * Check if Chrome extension APIs are available
     * @returns {boolean} True if Chrome APIs are available
     */
    isChromeAPIAvailable() {
        return typeof chrome !== 'undefined' && 
               chrome.runtime && 
               chrome.runtime.getURL && 
               chrome.storage && 
               chrome.storage.local;
    }

    /**
     * Load external script file
     * @param {string} scriptPath - Path to script file relative to extension root
     * @returns {Promise} Promise that resolves when script is loaded
     */
    async loadScript(scriptPath) {
        if (!this.isChromeAPIAvailable()) {
            console.warn(`⚠️ ILM: Chrome APIs not available, skipping script load: ${scriptPath}`);
            return Promise.resolve(); // Resolve to continue without blocking
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL(scriptPath);
            
            script.onload = () => {
                script.remove(); // Remove script element after loading to keep DOM clean
                console.log(`✅ ILM: Loaded ${scriptPath}`);
                resolve();
            };
            
            script.onerror = () => {
                script.remove();
                console.error(`❌ ILM: Failed to load ${scriptPath}`);
                reject(new Error(`Failed to load ${scriptPath}`));
            };
            
            // Inject into page context
            (document.head || document.documentElement).appendChild(script);
        });
    }
}

/**
 * Preview System for showing vocabulary preview before reading
 */
class PreviewSystem {
    constructor() {
        this.previewModal = null;
        this.isVisible = false;
        this.currentWords = [];
    }

    /**
     * Show preview modal with unknown words
     * @param {Object} analysis - Content analysis results
     */
    async showPreview(analysis) {
        if (this.isVisible) return;

        try {
            this.currentWords = analysis.unknownWords.slice(0, 15); // Show top 15 unknown words
            this.createPreviewModal(analysis);
            this.isVisible = true;
        } catch (error) {
            console.error('❌ ILM: Preview creation failed:', error);
        }
    }

    /**
     * Create and display preview modal
     * @param {Object} analysis - Content analysis results
     */
    createPreviewModal(analysis) {
        // Create modal container
        this.previewModal = document.createElement('div');
        this.previewModal.className = 'ilm-preview-modal';
        this.previewModal.innerHTML = this.generatePreviewHTML(analysis);

        // Add to page
        document.body.appendChild(this.previewModal);

        // Setup event listeners
        this.setupPreviewEvents();

        // Show with animation
        setTimeout(() => {
            this.previewModal.classList.add('ilm-preview-visible');
        }, 10);
    }

    /**
     * Generate HTML for preview modal
     * @param {Object} analysis - Content analysis results
     * @returns {string} HTML content
     */
    generatePreviewHTML(analysis) {
        const difficulty = analysis.difficulty;
        const unknownWords = this.currentWords;

        return `
            <div class="ilm-preview-overlay"></div>
            <div class="ilm-preview-content">
                <div class="ilm-preview-header">
                    <h2>📚 Preview Mode - Study Before Reading</h2>
                    <button class="ilm-preview-close">&times;</button>
                </div>
                
                <div class="ilm-preview-stats">
                    <div class="ilm-stat">
                        <span class="ilm-stat-number">${analysis.wordCount}</span>
                        <span class="ilm-stat-label">Total Words</span>
                    </div>
                    <div class="ilm-stat">
                        <span class="ilm-stat-number">${unknownWords.length}</span>
                        <span class="ilm-stat-label">New Words</span>
                    </div>
                    <div class="ilm-stat">
                        <span class="ilm-stat-number">${analysis.readingTime}</span>
                        <span class="ilm-stat-label">Min Read</span>
                    </div>
                    <div class="ilm-stat">
                        <span class="ilm-stat-number difficulty-${difficulty.level.toLowerCase().replace(/\s+/g, '-')}">${difficulty.level}</span>
                        <span class="ilm-stat-label">Difficulty</span>
                    </div>
                </div>

                <div class="ilm-preview-words">
                    <h3>🎯 Words to Learn (${unknownWords.length})</h3>
                    <div class="ilm-word-grid">
                        ${unknownWords.map((wordInfo, index) => `
                            <div class="ilm-word-card" data-word="${wordInfo.word}" data-index="${index}">
                                <div class="ilm-word-main">${wordInfo.word}</div>
                                <div class="ilm-word-freq">Rank: ${wordInfo.vocabRank}</div>
                                <div class="ilm-word-translation">Loading...</div>
                                <div class="ilm-word-actions">
                                    <button class="ilm-word-know">Know</button>
                                    <button class="ilm-word-learn">Study</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="ilm-preview-actions">
                    <button class="ilm-btn ilm-btn-primary" id="ilm-start-reading">
                        ✨ Start Reading with Highlights
                    </button>
                    <button class="ilm-btn ilm-btn-secondary" id="ilm-skip-preview">
                        ⏭️ Skip Preview
                    </button>
                    <button class="ilm-btn ilm-btn-text" id="ilm-practice-words">
                        📝 Practice Words First
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners for preview modal
     */
    setupPreviewEvents() {
        // Close button
        this.previewModal.querySelector('.ilm-preview-close').addEventListener('click', () => {
            this.hidePreview();
        });

        // Overlay click to close
        this.previewModal.querySelector('.ilm-preview-overlay').addEventListener('click', () => {
            this.hidePreview();
        });

        // Action buttons
        this.previewModal.querySelector('#ilm-start-reading').addEventListener('click', () => {
            this.startReading();
        });

        this.previewModal.querySelector('#ilm-skip-preview').addEventListener('click', () => {
            this.skipPreview();
        });

        this.previewModal.querySelector('#ilm-practice-words').addEventListener('click', () => {
            this.startPractice();
        });

        // Word card interactions
        this.previewModal.querySelectorAll('.ilm-word-card').forEach(card => {
            const word = card.dataset.word;
            
            // Load translation
            this.loadWordTranslation(card, word);
            
            // Know button
            card.querySelector('.ilm-word-know').addEventListener('click', () => {
                this.markWordAsKnown(card, word);
            });
            
            // Learn button
            card.querySelector('.ilm-word-learn').addEventListener('click', () => {
                this.markWordAsLearning(card, word);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    /**
     * Load translation for word card
     * @param {HTMLElement} card - Word card element
     * @param {string} word - Word to translate
     */
    async loadWordTranslation(card, word) {
        try {
            const translation = await window.ilmWordProcessor.getWordTranslation(word);
            card.querySelector('.ilm-word-translation').textContent = translation;
        } catch (error) {
            card.querySelector('.ilm-word-translation').textContent = 'Translation unavailable';
        }
    }

    /**
     * Mark word as known from preview
     * @param {HTMLElement} card - Word card element
     * @param {string} word - Word to mark as known
     */
    async markWordAsKnown(card, word) {
        await window.ilmWordProcessor.markWordAsKnown(word);
        card.classList.add('ilm-word-known');
        card.querySelector('.ilm-word-actions').innerHTML = '<span class="ilm-word-status">✓ Known</span>';
    }

    /**
     * Mark word as learning from preview
     * @param {HTMLElement} card - Word card element
     * @param {string} word - Word to mark as learning
     */
    async markWordAsLearning(card, word) {
        await window.ilmWordProcessor.markWordAsLearning(word);
        card.classList.add('ilm-word-learning');
        card.querySelector('.ilm-word-actions').innerHTML = '<span class="ilm-word-status">📚 Learning</span>';
    }

    /**
     * Start reading with content processing
     */
    startReading() {
        this.hidePreview();
        
        // Process page content with highlighting
        setTimeout(() => {
            window.ilmUniversalProcessor.processContentDirectly();
        }, 300);
    }

    /**
     * Skip preview and read normally
     */
    skipPreview() {
        this.hidePreview();
    }

    /**
     * Start practice mode with typing exercises
     */
    startPractice() {
        // Hide preview modal
        this.hidePreview();
        
        // Create practice modal
        setTimeout(() => {
            this.createPracticeModal();
        }, 300);
    }

    /**
     * Create practice modal with typing exercises
     */
    createPracticeModal() {
        const practiceModal = document.createElement('div');
        practiceModal.className = 'ilm-practice-modal ilm-preview-modal';
        practiceModal.innerHTML = this.generatePracticeHTML();

        document.body.appendChild(practiceModal);
        this.practiceModal = practiceModal;

        // Setup practice events
        this.setupPracticeEvents();

        // Show with animation
        setTimeout(() => {
            practiceModal.classList.add('ilm-preview-visible');
            this.startTypingExercise();
        }, 10);
    }

    /**
     * Generate HTML for practice modal
     * @returns {string} Practice modal HTML
     */
    generatePracticeHTML() {
        return `
            <div class="ilm-preview-overlay"></div>
            <div class="ilm-preview-content">
                <div class="ilm-preview-header">
                    <h2>📝 Practice Mode - Word Spelling</h2>
                    <button class="ilm-preview-close">&times;</button>
                </div>
                
                <div class="ilm-practice-progress">
                    <div class="ilm-progress-bar">
                        <div class="ilm-progress-fill" style="width: 0%"></div>
                    </div>
                    <span class="ilm-progress-text">0 / ${this.currentWords.length}</span>
                </div>

                <div class="ilm-practice-content">
                    <div class="ilm-practice-word-display">
                        <div class="ilm-practice-definition"></div>
                        <div class="ilm-practice-hint"></div>
                        <div class="ilm-practice-audio">
                            <button class="ilm-audio-btn" title="Play pronunciation">🔊</button>
                        </div>
                    </div>

                    <div class="ilm-practice-input-area">
                        <input type="text" class="ilm-practice-input" placeholder="Type the word..." autocomplete="off" spellcheck="false">
                        <div class="ilm-practice-feedback"></div>
                    </div>

                    <div class="ilm-practice-word-progress">
                        <div class="ilm-practice-letters"></div>
                    </div>
                </div>

                <div class="ilm-practice-actions">
                    <button class="ilm-btn ilm-btn-secondary" id="ilm-practice-hint">💡 Hint</button>
                    <button class="ilm-btn ilm-btn-secondary" id="ilm-practice-skip">⏭️ Skip</button>
                    <button class="ilm-btn ilm-btn-primary" id="ilm-practice-submit">✓ Check</button>
                </div>

                <div class="ilm-practice-stats">
                    <div class="ilm-stat-item">
                        <span class="ilm-stat-label">Correct:</span>
                        <span class="ilm-stat-value" id="ilm-correct-count">0</span>
                    </div>
                    <div class="ilm-stat-item">
                        <span class="ilm-stat-label">Attempts:</span>
                        <span class="ilm-stat-value" id="ilm-attempt-count">0</span>
                    </div>
                    <div class="ilm-stat-item">
                        <span class="ilm-stat-label">Accuracy:</span>
                        <span class="ilm-stat-value" id="ilm-accuracy-rate">100%</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup practice modal event listeners
     */
    setupPracticeEvents() {
        // Close button
        this.practiceModal.querySelector('.ilm-preview-close').addEventListener('click', () => {
            this.hidePracticeModal();
        });

        // Overlay click to close
        this.practiceModal.querySelector('.ilm-preview-overlay').addEventListener('click', () => {
            this.hidePracticeModal();
        });

        // Practice input
        const input = this.practiceModal.querySelector('.ilm-practice-input');
        input.addEventListener('input', (e) => {
            this.handlePracticeInput(e.target.value);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.checkAnswer();
            }
        });

        // Action buttons
        this.practiceModal.querySelector('#ilm-practice-hint').addEventListener('click', () => {
            this.showHint();
        });

        this.practiceModal.querySelector('#ilm-practice-skip').addEventListener('click', () => {
            this.skipWord();
        });

        this.practiceModal.querySelector('#ilm-practice-submit').addEventListener('click', () => {
            this.checkAnswer();
        });

        // Audio button
        this.practiceModal.querySelector('.ilm-audio-btn').addEventListener('click', () => {
            this.playPronunciation();
        });

        // Initialize practice state
        this.practiceState = {
            currentIndex: 0,
            correctCount: 0,
            attemptCount: 0,
            hintsUsed: 0,
            startTime: Date.now()
        };
    }

    /**
     * Start typing exercise for current word
     */
    startTypingExercise() {
        if (this.practiceState.currentIndex >= this.currentWords.length) {
            this.completePractice();
            return;
        }

        const currentWord = this.currentWords[this.practiceState.currentIndex];
        const definitionEl = this.practiceModal.querySelector('.ilm-practice-definition');
        const hintEl = this.practiceModal.querySelector('.ilm-practice-hint');
        const lettersEl = this.practiceModal.querySelector('.ilm-practice-letters');
        const input = this.practiceModal.querySelector('.ilm-practice-input');

        // Load and display definition
        this.loadWordDefinition(currentWord.word).then(definition => {
            definitionEl.textContent = definition;
        });

        // Create letter placeholders
        lettersEl.innerHTML = currentWord.word.split('').map((letter, index) => 
            `<span class="ilm-letter-placeholder" data-index="${index}">_</span>`
        ).join('');

        // Clear previous state
        hintEl.textContent = '';
        input.value = '';
        input.focus();

        // Update progress
        this.updateProgress();
    }

    /**
     * Handle practice input typing
     * @param {string} value - Current input value
     */
    handlePracticeInput(value) {
        const currentWord = this.currentWords[this.practiceState.currentIndex];
        const lettersEl = this.practiceModal.querySelector('.ilm-practice-letters');
        const placeholders = lettersEl.querySelectorAll('.ilm-letter-placeholder');

        // Update letter placeholders
        placeholders.forEach((placeholder, index) => {
            const inputChar = value[index];
            const correctChar = currentWord.word[index];

            placeholder.textContent = inputChar || '_';
            placeholder.className = 'ilm-letter-placeholder';

            if (inputChar) {
                if (inputChar.toLowerCase() === correctChar.toLowerCase()) {
                    placeholder.classList.add('correct');
                } else {
                    placeholder.classList.add('incorrect');
                }
            }
        });

        // Auto-submit when word is complete and correct
        if (value.length === currentWord.word.length && 
            value.toLowerCase() === currentWord.word.toLowerCase()) {
            setTimeout(() => this.checkAnswer(), 300);
        }
    }

    /**
     * Check current answer
     */
    checkAnswer() {
        const input = this.practiceModal.querySelector('.ilm-practice-input');
        const feedback = this.practiceModal.querySelector('.ilm-practice-feedback');
        const currentWord = this.currentWords[this.practiceState.currentIndex];
        const answer = input.value.trim().toLowerCase();

        this.practiceState.attemptCount++;

        if (answer === currentWord.word.toLowerCase()) {
            // Correct answer
            this.practiceState.correctCount++;
            feedback.className = 'ilm-practice-feedback success';
            feedback.textContent = '✓ Correct!';

            // Mark word as known in the preview
            this.markWordAsKnown(null, currentWord.word);

            // Move to next word after delay
            setTimeout(() => {
                this.nextWord();
            }, 1000);
        } else {
            // Incorrect answer
            feedback.className = 'ilm-practice-feedback error';
            feedback.textContent = `✗ Try again! (Hint: starts with "${currentWord.word[0]}")`;
            
            // Clear input for retry
            setTimeout(() => {
                input.focus();
                input.select();
            }, 1000);
        }

        this.updateStats();
    }

    /**
     * Show hint for current word
     */
    showHint() {
        const currentWord = this.currentWords[this.practiceState.currentIndex];
        const hintEl = this.practiceModal.querySelector('.ilm-practice-hint');
        
        this.practiceState.hintsUsed++;

        // Show first half of the word
        const hintLength = Math.ceil(currentWord.word.length / 2);
        const hint = currentWord.word.slice(0, hintLength) + '_'.repeat(currentWord.word.length - hintLength);
        
        hintEl.textContent = `Hint: ${hint}`;
        hintEl.className = 'ilm-practice-hint visible';
    }

    /**
     * Skip current word
     */
    skipWord() {
        const currentWord = this.currentWords[this.practiceState.currentIndex];
        
        // Mark as learning instead of known
        this.markWordAsLearning(null, currentWord.word);
        
        this.nextWord();
    }

    /**
     * Move to next word
     */
    nextWord() {
        this.practiceState.currentIndex++;
        
        if (this.practiceState.currentIndex >= this.currentWords.length) {
            this.completePractice();
        } else {
            this.startTypingExercise();
        }
    }

    /**
     * Complete practice session
     */
    completePractice() {
        const accuracy = Math.round((this.practiceState.correctCount / this.practiceState.attemptCount) * 100);
        const timeSpent = Math.round((Date.now() - this.practiceState.startTime) / 1000);

        const resultHTML = `
            <div class="ilm-practice-results">
                <h3>🎉 Practice Complete!</h3>
                <div class="ilm-result-stats">
                    <div class="ilm-result-item">
                        <span class="ilm-result-number">${this.practiceState.correctCount}</span>
                        <span class="ilm-result-label">Words Learned</span>
                    </div>
                    <div class="ilm-result-item">
                        <span class="ilm-result-number">${accuracy}%</span>
                        <span class="ilm-result-label">Accuracy</span>
                    </div>
                    <div class="ilm-result-item">
                        <span class="ilm-result-number">${timeSpent}s</span>
                        <span class="ilm-result-label">Time</span>
                    </div>
                </div>
                <div class="ilm-practice-actions">
                    <button class="ilm-btn ilm-btn-primary" id="ilm-start-reading-final">
                        ✨ Start Reading Now
                    </button>
                    <button class="ilm-btn ilm-btn-secondary" id="ilm-practice-again">
                        🔄 Practice Again
                    </button>
                </div>
            </div>
        `;

        this.practiceModal.querySelector('.ilm-practice-content').innerHTML = resultHTML;

        // Setup result actions
        this.practiceModal.querySelector('#ilm-start-reading-final').addEventListener('click', () => {
            this.hidePracticeModal();
            setTimeout(() => {
                window.ilmUniversalProcessor.processContentDirectly();
            }, 300);
        });

        this.practiceModal.querySelector('#ilm-practice-again').addEventListener('click', () => {
            this.practiceState.currentIndex = 0;
            this.practiceState.correctCount = 0;
            this.practiceState.attemptCount = 0;
            this.practiceState.hintsUsed = 0;
            this.practiceState.startTime = Date.now();
            
            this.practiceModal.querySelector('.ilm-practice-content').innerHTML = this.generatePracticeContentHTML();
            this.startTypingExercise();
        });
    }

    /**
     * Load word definition for practice
     * @param {string} word - Word to get definition for
     * @returns {Promise<string>} Word definition
     */
    async loadWordDefinition(word) {
        try {
            const translation = await window.translationService.translate(word, { type: 'definition' });
            return translation.definition || `Definition of "${word}"`;
        } catch (error) {
            return `Definition of "${word}"`;
        }
    }

    /**
     * Play pronunciation for current word
     */
    playPronunciation() {
        const currentWord = this.currentWords[this.practiceState.currentIndex];
        
        // Use Web Speech API for pronunciation
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(currentWord.word);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        }
    }

    /**
     * Update practice progress
     */
    updateProgress() {
        const progressFill = this.practiceModal.querySelector('.ilm-progress-fill');
        const progressText = this.practiceModal.querySelector('.ilm-progress-text');
        
        const progress = (this.practiceState.currentIndex / this.currentWords.length) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${this.practiceState.currentIndex} / ${this.currentWords.length}`;
    }

    /**
     * Update practice statistics
     */
    updateStats() {
        const correctEl = this.practiceModal.querySelector('#ilm-correct-count');
        const attemptEl = this.practiceModal.querySelector('#ilm-attempt-count');
        const accuracyEl = this.practiceModal.querySelector('#ilm-accuracy-rate');

        correctEl.textContent = this.practiceState.correctCount;
        attemptEl.textContent = this.practiceState.attemptCount;
        
        const accuracy = this.practiceState.attemptCount > 0 ? 
            Math.round((this.practiceState.correctCount / this.practiceState.attemptCount) * 100) : 100;
        accuracyEl.textContent = `${accuracy}%`;
    }

    /**
     * Hide practice modal
     */
    hidePracticeModal() {
        if (!this.practiceModal) return;

        this.practiceModal.classList.remove('ilm-preview-visible');
        
        setTimeout(() => {
            if (this.practiceModal && this.practiceModal.parentNode) {
                this.practiceModal.remove();
            }
            this.practiceModal = null;
        }, 300);
    }

    /**
     * Handle keyboard shortcuts in preview
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
        if (!this.isVisible) return;

        switch (e.key) {
            case 'Escape':
                this.hidePreview();
                break;
            case 'Enter':
                if (e.ctrlKey || e.metaKey) {
                    this.startReading();
                }
                break;
        }
    }

    /**
     * Hide preview modal
     */
    hidePreview() {
        if (!this.isVisible || !this.previewModal) return;

        this.previewModal.classList.remove('ilm-preview-visible');
        
        setTimeout(() => {
            if (this.previewModal && this.previewModal.parentNode) {
                this.previewModal.remove();
            }
            this.previewModal = null;
            this.isVisible = false;
        }, 300);

        // Remove keyboard listener
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Clean up preview system
     */
    cleanup() {
        this.hidePreview();
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.UniversalProcessor = UniversalProcessor;
    window.PreviewSystem = PreviewSystem;
}

// Initialize global instance
if (typeof window !== 'undefined' && !window.ilmUniversalProcessor) {
    window.ilmUniversalProcessor = new UniversalProcessor();
}