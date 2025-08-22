// Immersive Language Master - Simplified Word Card Component
// 🚀 OPTIMIZED: Streamlined UI with progressive disclosure for better UX

class SimplifiedWordCard {
    constructor() {
        this.currentWord = null;
        this.isExpanded = false;
        this.translationCache = new Map();
        this.setupCardElement();
        this.setupEventListeners();
    }

    setupCardElement() {
        // Remove any existing card
        const existingCard = document.querySelector('.ilm-simplified-card');
        if (existingCard) {
            existingCard.remove();
        }

        // Create simplified card structure
        this.cardElement = document.createElement('div');
        this.cardElement.className = 'ilm-simplified-card';
        this.cardElement.innerHTML = `
            <div class="card-content">
                <!-- Primary Information Layer -->
                <div class="word-primary">
                    <h3 class="word-title" id="cardWordTitle">feature</h3>
                    <p class="word-translation" id="cardWordTranslation">特征，功能</p>
                </div>
                
                <!-- Quick Actions Layer -->
                <div class="word-actions">
                    <button class="btn-primary" id="markKnownBtn" title="Mark as Known (K)">
                        ✓ 我知道了
                    </button>
                    <button class="btn-secondary" id="moreInfoBtn" title="More Information (I)">
                        详细信息
                    </button>
                </div>
                
                <!-- Expandable Details Layer -->
                <div class="word-details" id="cardWordDetails" data-expanded="false">
                    <div class="details-content">
                        <div class="pronunciation-section">
                            <button class="pronunciation-btn" id="pronunciationBtn">
                                🔊 <span id="cardPronunciation">/ˈfiːtʃər/</span>
                            </button>
                        </div>
                        
                        <div class="examples-section">
                            <h4>Examples:</h4>
                            <ul id="cardExamples">
                                <li>This is a new feature in the app.</li>
                                <li>The main feature of this design is simplicity.</li>
                            </ul>
                        </div>
                        
                        <div class="etymology-section" id="cardEtymology" style="display: none;">
                            <h4>Word Origin:</h4>
                            <p>From Latin 'factura' meaning 'a making, formation'</p>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Operations Overlay -->
                <div class="quick-overlay" id="quickOverlay" style="display: none;">
                    <div class="quick-actions">
                        <button class="quick-btn known" title="Known (K)" data-action="known">✓</button>
                        <button class="quick-btn translate" title="Translate (T)" data-action="translate">译</button>
                        <button class="quick-btn close" title="Close (Esc)" data-action="close">×</button>
                    </div>
                </div>
            </div>
            
            <!-- Loading State -->
            <div class="loading-state" id="cardLoading" style="display: none;">
                <div class="loading-spinner"></div>
                <p>Loading translation...</p>
            </div>
        `;

        // Add to page (initially hidden)
        document.body.appendChild(this.cardElement);
        this.hideCard();
    }

    setupEventListeners() {
        // Primary action buttons
        this.cardElement.querySelector('#markKnownBtn').addEventListener('click', () => {
            this.markWordAsKnown();
        });

        this.cardElement.querySelector('#moreInfoBtn').addEventListener('click', () => {
            this.toggleDetails();
        });

        // Pronunciation button
        this.cardElement.querySelector('#pronunciationBtn').addEventListener('click', () => {
            this.playPronunciation();
        });

        // Quick overlay actions
        this.cardElement.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Click outside to close
        this.cardElement.addEventListener('click', (e) => {
            if (e.target === this.cardElement) {
                this.hideCard();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.isVisible()) return;

            switch(e.key.toLowerCase()) {
                case 'k':
                    e.preventDefault();
                    this.markWordAsKnown();
                    break;
                case 't':
                    e.preventDefault();
                    this.showQuickTranslation();
                    break;
                case 'i':
                    e.preventDefault();
                    this.toggleDetails();
                    break;
                case 'escape':
                    e.preventDefault();
                    this.hideCard();
                    break;
            }
        });
    }

    // 🚀 NEW: Show word card with progressive disclosure
    async showWord(word, element) {
        this.currentWord = word;
        this.currentElement = element;
        
        // Position near the clicked word
        this.positionCard(element);
        
        // Show basic information immediately
        this.showBasicInfo(word);
        
        // Load translation asynchronously
        await this.loadTranslation(word);
        
        // Show the card
        this.showCard();
    }

    showBasicInfo(word) {
        this.cardElement.querySelector('#cardWordTitle').textContent = word;
        this.cardElement.querySelector('#cardWordTranslation').textContent = 'Loading...';
        
        // Reset expanded state
        this.isExpanded = false;
        this.cardElement.querySelector('#cardWordDetails').dataset.expanded = 'false';
    }

    async loadTranslation(word) {
        try {
            this.showLoading(true);
            
            // Check cache first
            if (this.translationCache.has(word)) {
                const cachedData = this.translationCache.get(word);
                this.displayTranslation(cachedData);
                return;
            }

            // Load translation via service
            let translationData;
            if (window.ilmTranslationService) {
                translationData = await window.ilmTranslationService.translateWord(word);
            } else {
                // Fallback translation
                translationData = {
                    translation: '翻译加载中...',
                    pronunciation: '',
                    examples: [],
                    etymology: ''
                };
            }

            // Cache the result
            this.translationCache.set(word, translationData);
            
            // Display the translation
            this.displayTranslation(translationData);
            
        } catch (error) {
            console.error('Translation loading failed:', error);
            this.displayTranslation({
                translation: '翻译加载失败',
                pronunciation: '',
                examples: [],
                etymology: ''
            });
        } finally {
            this.showLoading(false);
        }
    }

    displayTranslation(data) {
        this.cardElement.querySelector('#cardWordTranslation').textContent = 
            data.translation || '暂无翻译';
        
        if (data.pronunciation) {
            this.cardElement.querySelector('#cardPronunciation').textContent = data.pronunciation;
        }

        // Update examples
        const examplesList = this.cardElement.querySelector('#cardExamples');
        examplesList.innerHTML = '';
        if (data.examples && data.examples.length > 0) {
            data.examples.slice(0, 3).forEach(example => {
                const li = document.createElement('li');
                li.textContent = example;
                examplesList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No examples available';
            examplesList.appendChild(li);
        }

        // Update etymology if available
        if (data.etymology) {
            const etymologySection = this.cardElement.querySelector('#cardEtymology');
            etymologySection.querySelector('p').textContent = data.etymology;
            etymologySection.style.display = 'block';
        }
    }

    toggleDetails() {
        this.isExpanded = !this.isExpanded;
        const details = this.cardElement.querySelector('#cardWordDetails');
        details.dataset.expanded = this.isExpanded.toString();
        
        // Update button text
        const btn = this.cardElement.querySelector('#moreInfoBtn');
        btn.textContent = this.isExpanded ? '收起信息' : '详细信息';
    }

    markWordAsKnown() {
        if (!this.currentWord) return;

        // Mark in word processor
        if (window.ilmWordProcessor) {
            window.ilmWordProcessor.markWordAsKnown(this.currentWord);
        }

        // Update the original element
        if (this.currentElement) {
            this.currentElement.classList.remove('ilm-word-learning', 'ilm-word-unknown');
            this.currentElement.classList.add('ilm-word-known');
        }

        // Show success feedback
        this.showSuccessFeedback();

        // Hide card after short delay
        setTimeout(() => {
            this.hideCard();
        }, 1000);
    }

    handleQuickAction(action) {
        switch(action) {
            case 'known':
                this.markWordAsKnown();
                break;
            case 'translate':
                this.showQuickTranslation();
                break;
            case 'close':
                this.hideCard();
                break;
        }
    }

    showQuickTranslation() {
        // Toggle quick overlay
        const overlay = this.cardElement.querySelector('#quickOverlay');
        overlay.style.display = overlay.style.display === 'none' ? 'flex' : 'none';
    }

    positionCard(element) {
        const rect = element.getBoundingClientRect();
        const cardRect = this.cardElement.getBoundingClientRect();
        
        // Position below the word, centered
        let left = rect.left + (rect.width / 2) - (cardRect.width / 2);
        let top = rect.bottom + 10;
        
        // Ensure card stays within viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        if (left < 10) left = 10;
        if (left + cardRect.width > viewportWidth - 10) {
            left = viewportWidth - cardRect.width - 10;
        }
        
        if (top + cardRect.height > viewportHeight - 10) {
            top = rect.top - cardRect.height - 10;
        }
        
        this.cardElement.style.left = `${left}px`;
        this.cardElement.style.top = `${top}px`;
    }

    showCard() {
        this.cardElement.style.display = 'block';
        // Trigger animation
        setTimeout(() => {
            this.cardElement.classList.add('visible');
        }, 10);
    }

    hideCard() {
        this.cardElement.classList.remove('visible');
        setTimeout(() => {
            this.cardElement.style.display = 'none';
            this.currentWord = null;
            this.currentElement = null;
        }, 200);
    }

    isVisible() {
        return this.cardElement.style.display !== 'none';
    }

    showLoading(show) {
        const loading = this.cardElement.querySelector('#cardLoading');
        loading.style.display = show ? 'flex' : 'none';
    }

    showSuccessFeedback() {
        const btn = this.cardElement.querySelector('#markKnownBtn');
        const originalText = btn.textContent;
        btn.textContent = '✓ 已掌握！';
        btn.classList.add('success');
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('success');
        }, 1500);
    }

    playPronunciation() {
        if (!this.currentWord) return;
        
        // Use browser's speech synthesis
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(this.currentWord);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        }
    }
}

// Global instance
window.ilmSimplifiedWordCard = new SimplifiedWordCard();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimplifiedWordCard;
}