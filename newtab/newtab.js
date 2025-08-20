// English Learning Dashboard - New Tab JavaScript

class LearningDashboard {
    constructor() {
        this.settings = {};
        this.learningWords = [];
        this.knownWords = [];
        this.dailyStats = {};
        this.reviewWords = [];
        this.currentReviewIndex = 0;
        this.reviewModal = null;
        
        this.init();
    }

    async init() {
        console.log('🎧 ELA: Learning Dashboard initializing...');
        
        await this.loadData();
        this.setupUI();
        this.setupEventListeners();
        this.updateGreeting();
        this.updateStats();
        this.loadWordCards();
        this.loadRecentActivity();
        
        console.log('🎧 ELA: Learning Dashboard initialized');
    }

    async loadData() {
        try {
            const result = await chrome.storage.local.get([
                'learningWords',
                'knownWords',
                'vocabularyLevel',
                'dailyStats',
                'studyStreak',
                'lastStudyDate',
                'newTabEnabled',
                'recentLearning'
            ]);

            this.learningWords = result.learningWords || [];
            this.knownWords = result.knownWords || [];
            this.vocabularyLevel = result.vocabularyLevel || 0;
            this.dailyStats = result.dailyStats || {
                wordsEncountered: 0,
                wordsLearned: 0,
                studyTime: 0,
                lastUpdated: new Date().toDateString()
            };
            this.studyStreak = result.studyStreak || 0;
            this.lastStudyDate = result.lastStudyDate;
            this.newTabEnabled = result.newTabEnabled !== false; // Default to true
            this.recentLearning = result.recentLearning || [];

            // Check if daily stats need reset
            const today = new Date().toDateString();
            if (this.dailyStats.lastUpdated !== today) {
                this.dailyStats = {
                    wordsEncountered: 0,
                    wordsLearned: 0,
                    studyTime: 0,
                    lastUpdated: today
                };
                await chrome.storage.local.set({ dailyStats: this.dailyStats });
            }
        } catch (error) {
            console.error('🎧 ELA: Error loading dashboard data:', error);
        }
    }

    setupUI() {
        // Set today's date
        document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    setupEventListeners() {
        // Quick review buttons
        document.getElementById('startQuickReview').addEventListener('click', () => {
            this.startQuickReview();
        });

        document.getElementById('refreshWords').addEventListener('click', () => {
            this.loadWordCards();
        });

        // Action buttons
        document.getElementById('openVocabularyTest').addEventListener('click', () => {
            this.openSidePanel();
        });

        document.getElementById('openSettings').addEventListener('click', () => {
            this.openSidePanel();
        });

        document.getElementById('disableNewTab').addEventListener('click', () => {
            this.disableNewTab();
        });

        document.getElementById('viewAllHistory').addEventListener('click', () => {
            this.openSidePanel();
        });

        // Review modal events
        document.getElementById('closeReviewModal').addEventListener('click', () => {
            this.closeReviewModal();
        });

        document.getElementById('knowWordBtn').addEventListener('click', () => {
            this.markWordAsKnown();
        });

        document.getElementById('dontKnowWordBtn').addEventListener('click', () => {
            this.markWordAsUnknown();
        });

        document.getElementById('nextWordBtn').addEventListener('click', () => {
            this.nextReviewWord();
        });

        // Close modal on background click
        document.getElementById('reviewModal').addEventListener('click', (e) => {
            if (e.target.id === 'reviewModal') {
                this.closeReviewModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('reviewModal').style.display !== 'none') {
                this.closeReviewModal();
            }
        });
    }

    updateGreeting() {
        const hour = new Date().getHours();
        let greeting = 'Good morning! Ready to learn?';
        
        if (hour >= 12 && hour < 18) {
            greeting = 'Good afternoon! Keep up the great work!';
        } else if (hour >= 18) {
            greeting = 'Good evening! Time for some learning!';
        }

        document.getElementById('greeting').textContent = greeting;
    }

    updateStats() {
        // Update header stats
        document.getElementById('wordsLearning').textContent = this.learningWords.length;
        document.getElementById('wordsKnown').textContent = this.knownWords.length;
        document.getElementById('studyStreak').textContent = this.studyStreak;

        // Update today's progress
        document.getElementById('todayStudyTime').textContent = this.dailyStats.studyTime;
        document.getElementById('todayWordsEncountered').textContent = this.dailyStats.wordsEncountered;
        document.getElementById('todayWordsLearned').textContent = this.dailyStats.wordsLearned;
        document.getElementById('vocabularyLevel').textContent = this.vocabularyLevel;
    }

    loadWordCards() {
        const container = document.getElementById('wordCards');
        
        if (this.learningWords.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📖</div>
                    <p>No words to review yet.</p>
                    <p class="empty-hint">Watch videos with subtitles to start building your vocabulary!</p>
                </div>
            `;
            return;
        }

        // Show up to 5 words for quick review
        const wordsToShow = this.learningWords.slice(0, 5);
        container.innerHTML = '';

        wordsToShow.forEach((word, index) => {
            const wordCard = document.createElement('div');
            wordCard.className = 'word-card';
            wordCard.innerHTML = `
                <div class="word-info">
                    <h3>${word}</h3>
                    <div class="word-translation" id="translation-${index}">Loading...</div>
                </div>
                <div class="word-difficulty difficulty-medium">Review</div>
            `;

            wordCard.addEventListener('click', () => {
                this.startWordReview(word);
            });

            container.appendChild(wordCard);

            // Load translation
            this.getTranslation(word).then(translation => {
                const translationEl = document.getElementById(`translation-${index}`);
                if (translationEl) {
                    translationEl.textContent = translation;
                }
            });
        });
    }

    loadRecentActivity() {
        const container = document.getElementById('recentList');
        
        if (!this.recentLearning || this.recentLearning.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No recent learning activity.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        
        // Show up to 5 recent activities
        const recentItems = this.recentLearning.slice(0, 5);
        
        recentItems.forEach(item => {
            const recentItem = document.createElement('div');
            recentItem.className = 'recent-item';
            recentItem.innerHTML = `
                <div class="recent-icon">${this.getActivityIcon(item.type)}</div>
                <div class="recent-info">
                    <div class="recent-word">${item.word || item.text}</div>
                    <div class="recent-time">${this.formatTime(item.timestamp)}</div>
                </div>
            `;
            container.appendChild(recentItem);
        });
    }

    getActivityIcon(type) {
        switch (type) {
            case 'learned': return '✅';
            case 'encountered': return '👀';
            case 'reviewed': return '📚';
            case 'mastered': return '🎯';
            default: return '📝';
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
        return `${Math.floor(diff / 86400000)} days ago`;
    }

    async getTranslation(word) {
        // Try to use the translation service if available
        if (window.translationService) {
            try {
                const result = await window.translationService.translate(word);
                if (result && result.text && !result.error) {
                    return result.text;
                }
            } catch (error) {
                console.log('Translation service error:', error);
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
            'understand': '理解',
            'beautiful': '美丽的',
            'interesting': '有趣的',
            'difficult': '困难的',
            'necessary': '必要的',
            'possible': '可能的'
        };
        
        return translations[word.toLowerCase()] || `[${word}的释义]`;
    }

    startQuickReview() {
        if (this.learningWords.length === 0) {
            this.showNotification('No words to review yet!', 'info');
            return;
        }

        // Prepare review words (up to 10)
        this.reviewWords = this.shuffleArray([...this.learningWords]).slice(0, 10);
        this.currentReviewIndex = 0;

        this.showReviewModal();
    }

    startWordReview(word) {
        this.reviewWords = [word];
        this.currentReviewIndex = 0;
        this.showReviewModal();
    }

    async showReviewModal() {
        const modal = document.getElementById('reviewModal');
        modal.style.display = 'flex';

        if (this.currentReviewIndex >= this.reviewWords.length) {
            this.completeReview();
            return;
        }

        const word = this.reviewWords[this.currentReviewIndex];
        document.getElementById('reviewWord').textContent = word;
        document.getElementById('reviewProgressText').textContent = 
            `Word ${this.currentReviewIndex + 1} of ${this.reviewWords.length}`;

        // Load translation
        const translation = await this.getTranslation(word);
        document.getElementById('reviewTranslation').textContent = translation;
    }

    closeReviewModal() {
        document.getElementById('reviewModal').style.display = 'none';
    }

    async markWordAsKnown() {
        const word = this.reviewWords[this.currentReviewIndex];
        
        // Move from learning to known
        this.learningWords = this.learningWords.filter(w => w !== word);
        if (!this.knownWords.includes(word)) {
            this.knownWords.push(word);
        }

        // Update storage
        await chrome.storage.local.set({
            learningWords: this.learningWords,
            knownWords: this.knownWords
        });

        // Add to recent activity
        await this.addRecentActivity('mastered', word);

        // Update daily stats
        this.dailyStats.wordsLearned++;
        await chrome.storage.local.set({ dailyStats: this.dailyStats });

        this.nextReviewWord();
    }

    async markWordAsUnknown() {
        // Keep in learning list, just move to next
        this.nextReviewWord();
    }

    nextReviewWord() {
        this.currentReviewIndex++;
        if (this.currentReviewIndex >= this.reviewWords.length) {
            this.completeReview();
        } else {
            this.showReviewModal();
        }
    }

    async completeReview() {
        this.closeReviewModal();
        this.showNotification('Review completed! Great job!', 'success');
        
        // Refresh the dashboard
        await this.loadData();
        this.updateStats();
        this.loadWordCards();
        this.loadRecentActivity();
    }

    async addRecentActivity(type, word) {
        const activity = {
            type,
            word,
            timestamp: Date.now()
        };

        this.recentLearning.unshift(activity);
        
        // Keep only last 50 activities
        if (this.recentLearning.length > 50) {
            this.recentLearning = this.recentLearning.slice(0, 50);
        }

        await chrome.storage.local.set({ recentLearning: this.recentLearning });
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    async openSidePanel() {
        try {
            await chrome.sidePanel.open({ windowId: window.id });
        } catch (error) {
            // Fallback: try to open extension page
            chrome.tabs.create({ url: chrome.runtime.getURL('sidebar/sidebar.html') });
        }
    }

    async disableNewTab() {
        try {
            await chrome.storage.local.set({ newTabEnabled: false });
            
            // Redirect to chrome://newtab/
            window.location.href = 'chrome://newtab/';
        } catch (error) {
            console.error('Error disabling new tab:', error);
        }
    }

    showNotification(message, type = 'info') {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: ${type === 'success' ? '#48bb78' : '#38b2ac'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            font-weight: 500;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Check if new tab is enabled before initializing
chrome.storage.local.get(['newTabEnabled']).then(result => {
    if (result.newTabEnabled !== false) {
        // Initialize the dashboard
        document.addEventListener('DOMContentLoaded', () => {
            new LearningDashboard();
        });
    } else {
        // Redirect to default new tab
        window.location.href = 'chrome://newtab/';
    }
});

// CSS animations
const animationCSS = `
@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}
`;

const style = document.createElement('style');
style.textContent = animationCSS;
document.head.appendChild(style);