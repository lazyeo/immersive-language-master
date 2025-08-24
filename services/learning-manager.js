// Immersive Language Master - Learning Management Service
// Smart bookmarking, progress tracking, and spaced repetition system with SuperMemo 2 algorithm

// Prevent duplicate class definition
if (typeof LearningManager === 'undefined') {

class LearningManager {
    constructor() {
        this.initializeData();
        this.setupEventListeners();
        this.spacedRepetitionSystem = null; // Will be initialized after data load
    }

    async initializeData() {
        try {
            // Check if chrome.storage API is available
            if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
                console.warn('⚠️ ILM: Chrome storage API not available, using default data');
                this.initializeDefaultData();
                return;
            }

            // Load existing learning data
            const result = await chrome.storage.local.get([
                'learningRecords',
                'bookmarkedWords',
                'studySessions',
                'learningPreferences',
                'reviewQueue',
                'streakData',
                'learningGoals',
                'spacedRepetitionData'
            ]);

            // Initialize data structures with proper array checks
            this.learningRecords = new Map(Array.isArray(result.learningRecords) ? result.learningRecords : []);
            this.bookmarkedWords = new Map(Array.isArray(result.bookmarkedWords) ? result.bookmarkedWords : []);
            this.studySessions = result.studySessions || [];
            this.reviewQueue = result.reviewQueue || [];
            this.streakData = result.streakData || this.getDefaultStreakData();
            this.learningGoals = result.learningGoals || this.getDefaultGoals();
            this.spacedRepetitionData = new Map(Array.isArray(result.spacedRepetitionData) ? result.spacedRepetitionData : []);
            
            // Initialize SuperMemo 2 spaced repetition system
            this.initializeSpacedRepetition();
            
            this.preferences = {
                reviewInterval: result.learningPreferences?.reviewInterval || 'daily',
                dailyGoal: result.learningPreferences?.dailyGoal || 20,
                difficulty: result.learningPreferences?.difficulty || 'adaptive',
                notifications: result.learningPreferences?.notifications !== false,
                autoBookmark: result.learningPreferences?.autoBookmark !== false,
                spacedRepetition: result.learningPreferences?.spacedRepetition !== false
            };

            console.log('📚 Learning Manager initialized:', {
                records: this.learningRecords.size,
                bookmarks: this.bookmarkedWords.size,
                sessions: this.studySessions.length
            });

        } catch (error) {
            console.error('❌ Learning Manager initialization failed:', error);
            this.initializeDefaultData();
        }
    }

    initializeDefaultData() {
        this.learningRecords = new Map();
        this.bookmarkedWords = new Map();
        this.studySessions = [];
        this.reviewQueue = [];
        this.streakData = this.getDefaultStreakData();
        this.learningGoals = this.getDefaultGoals();
        this.spacedRepetitionData = new Map();
        this.preferences = {
            reviewInterval: 'daily',
            dailyGoal: 20,
            difficulty: 'adaptive',
            notifications: true,
            autoBookmark: true,
            spacedRepetition: true
        };
        this.initializeSpacedRepetition();
    }

    getDefaultStreakData() {
        return {
            current: 0,
            longest: 0,
            lastStudyDate: null,
            weeklyStreak: 0,
            monthlyStreak: 0
        };
    }

    getDefaultGoals() {
        return {
            daily: { target: 20, completed: 0 },
            weekly: { target: 100, completed: 0 },
            monthly: { target: 400, completed: 0 }
        };
    }

    /**
     * Add word to bookmarks with comprehensive metadata
     * @param {string} word - Word to bookmark
     * @param {Object} context - Context information
     * @returns {Promise<Object>} Bookmark result
     */
    async bookmarkWord(word, context = {}) {
        try {
            const timestamp = Date.now();
            const bookmarkId = this.generateBookmarkId(word, timestamp);
            
            const bookmarkData = {
                id: bookmarkId,
                word: word.toLowerCase(),
                originalCase: context.originalCase || word,
                timestamp: timestamp,
                source: context.source || 'manual',
                url: context.url || window.location.href,
                context: context.sentence || '',
                translation: context.translation || '',
                difficulty: context.difficulty || 'unknown',
                cefrLevel: context.cefrLevel || 'B1',
                category: context.category || 'general',
                tags: context.tags || [],
                studyCount: 0,
                lastStudied: null,
                masteryLevel: 0, // 0-100 scale
                nextReview: this.calculateNextReview(0), // Initial review in 1 day
                status: 'bookmarked', // bookmarked, learning, reviewing, mastered
                notes: context.notes || '',
                examples: context.examples || [],
                relatedWords: context.relatedWords || [],
                pronunciation: context.pronunciation || null
            };

            this.bookmarkedWords.set(bookmarkId, bookmarkData);
            
            // Add to review queue if spaced repetition is enabled
            if (this.preferences.spacedRepetition) {
                this.addToReviewQueue(bookmarkData);
            }

            // Update learning record
            await this.updateLearningRecord(word, 'bookmarked', context);
            
            // Save to storage
            await this.saveData();

            // Update daily goal progress
            this.updateGoalProgress('daily', 1);

            console.log('📖 Word bookmarked:', word, bookmarkData);
            
            return {
                success: true,
                bookmarkId: bookmarkId,
                data: bookmarkData,
                message: `"${word}" added to bookmarks`
            };

        } catch (error) {
            console.error('❌ Bookmark creation failed:', error);
            return {
                success: false,
                error: error.message,
                message: `Failed to bookmark "${word}"`
            };
        }
    }

    /**
     * Update learning record for a word
     * @param {string} word - Word being learned
     * @param {string} action - Action taken (viewed, bookmarked, studied, etc.)
     * @param {Object} context - Additional context
     */
    async updateLearningRecord(word, action, context = {}) {
        const wordKey = word.toLowerCase();
        const timestamp = Date.now();
        
        let record = this.learningRecords.get(wordKey) || {
            word: wordKey,
            firstEncounter: timestamp,
            totalEncounters: 0,
            studySessions: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            averageResponseTime: 0,
            lastSeen: timestamp,
            contexts: [],
            actions: [],
            masteryScore: 0,
            learningPhase: 'encountering' // encountering, learning, reviewing, mastered
        };

        // Update counters
        record.totalEncounters++;
        record.lastSeen = timestamp;
        
        if (action === 'studied') {
            record.studySessions++;
        }
        
        if (action === 'correct') {
            record.correctAnswers++;
            record.masteryScore = Math.min(100, record.masteryScore + 5);
        }
        
        if (action === 'incorrect') {
            record.incorrectAnswers++;
            record.masteryScore = Math.max(0, record.masteryScore - 3);
        }

        // Add action to history
        record.actions.push({
            action: action,
            timestamp: timestamp,
            context: context.source || 'unknown',
            url: context.url || window.location.href
        });

        // Limit action history to last 50 actions
        if (record.actions.length > 50) {
            record.actions = record.actions.slice(-50);
        }

        // Update learning phase based on mastery score
        record.learningPhase = this.determineLearningPhase(record);

        this.learningRecords.set(wordKey, record);
        
        // Auto-save periodically
        if (this.learningRecords.size % 10 === 0) {
            await this.saveData();
        }
    }

    /**
     * Determine learning phase based on record data
     * @param {Object} record - Learning record
     * @returns {string} Learning phase
     */
    determineLearningPhase(record) {
        if (record.masteryScore >= 80 && record.studySessions >= 5) {
            return 'mastered';
        } else if (record.masteryScore >= 50 && record.studySessions >= 3) {
            return 'reviewing';
        } else if (record.studySessions >= 1) {
            return 'learning';
        } else {
            return 'encountering';
        }
    }

    /**
     * Initialize SuperMemo 2 spaced repetition system
     */
    initializeSpacedRepetition() {
        // Dynamically load the SpacedRepetitionSystem if available
        if (typeof SpacedRepetitionSystem !== 'undefined') {
            this.spacedRepetitionSystem = new SpacedRepetitionSystem();
        } else {
            // Fallback to simple implementation if module not loaded
            this.spacedRepetitionSystem = {
                calculateNextReview: (wordData, quality) => {
                    return this.fallbackCalculateNextReview(wordData, quality);
                },
                initializeWord: (word) => {
                    return {
                        word,
                        repetitions: 0,
                        easeFactor: 2.5,
                        interval: 1,
                        nextReviewDate: new Date().toISOString(),
                        lastReviewDate: null,
                        totalReviews: 0,
                        successfulReviews: 0
                    };
                },
                getWordsForReview: (database) => {
                    return this.fallbackGetWordsForReview(database);
                }
            };
        }
    }

    /**
     * Fallback calculation for next review (simple spaced repetition)
     */
    fallbackCalculateNextReview(wordData, quality) {
        const wasCorrect = quality >= 3;
        let nextInterval = wordData.interval || 1;
        
        if (wasCorrect) {
            nextInterval = Math.ceil(nextInterval * 2.5);
        } else {
            nextInterval = 1;
        }
        
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);
        
        return {
            ...wordData,
            interval: nextInterval,
            nextReviewDate: nextReviewDate.toISOString(),
            lastReviewDate: new Date().toISOString()
        };
    }

    /**
     * Fallback method to get words for review
     */
    fallbackGetWordsForReview(database) {
        const now = new Date();
        const dueWords = [];
        
        for (const [word, data] of database.entries()) {
            if (data.nextReviewDate && new Date(data.nextReviewDate) <= now) {
                dueWords.push({ word, ...data });
            }
        }
        
        return dueWords;
    }

    /**
     * Calculate next review date using SuperMemo 2 algorithm
     * @param {number} currentInterval - Current interval in days
     * @param {number} masteryLevel - Mastery level (0-100)
     * @param {boolean} wasCorrect - Whether last answer was correct
     * @returns {number} Next review timestamp
     */
    calculateNextReview(currentInterval, masteryLevel = 0, wasCorrect = true) {
        // Convert to quality score for SuperMemo 2 (0-5 scale)
        let quality;
        if (!wasCorrect) {
            quality = 2; // Failed
        } else if (masteryLevel >= 80) {
            quality = 5; // Perfect
        } else if (masteryLevel >= 60) {
            quality = 4; // Good
        } else {
            quality = 3; // Pass
        }
        
        // Get word data from spaced repetition system
        const wordData = {
            interval: currentInterval,
            repetitions: Math.floor(masteryLevel / 20),
            easeFactor: 2.5 - (100 - masteryLevel) * 0.01
        };
        
        const result = this.spacedRepetitionSystem.calculateNextReview(wordData, quality);
        
        // Convert back to timestamp
        return new Date(result.nextReviewDate).getTime();
    }

    /**
     * Add word to review queue
     * @param {Object} bookmarkData - Bookmark data
     */
    addToReviewQueue(bookmarkData) {
        const reviewItem = {
            id: bookmarkData.id,
            word: bookmarkData.word,
            nextReview: bookmarkData.nextReview,
            priority: this.calculateReviewPriority(bookmarkData),
            type: 'vocabulary'
        };

        this.reviewQueue.push(reviewItem);
        
        // Sort queue by priority and next review time
        this.reviewQueue.sort((a, b) => {
            if (a.nextReview !== b.nextReview) {
                return a.nextReview - b.nextReview;
            }
            return b.priority - a.priority;
        });
    }

    /**
     * Calculate review priority based on various factors
     * @param {Object} bookmarkData - Bookmark data
     * @returns {number} Priority score (0-100)
     */
    calculateReviewPriority(bookmarkData) {
        let priority = 50; // Base priority
        
        // Higher priority for difficult words
        if (bookmarkData.difficulty === 'Advanced' || bookmarkData.difficulty === 'Expert') {
            priority += 20;
        }
        
        // Higher priority for recently bookmarked words
        const daysSinceBookmark = (Date.now() - bookmarkData.timestamp) / (24 * 60 * 60 * 1000);
        if (daysSinceBookmark < 3) {
            priority += 15;
        }
        
        // Lower priority for words with high mastery
        priority -= bookmarkData.masteryLevel * 0.3;
        
        // Higher priority for words from recent contexts
        const learningRecord = this.learningRecords.get(bookmarkData.word);
        if (learningRecord && learningRecord.totalEncounters > 1) {
            priority += 10;
        }

        return Math.max(0, Math.min(100, priority));
    }

    /**
     * Get words due for review
     * @param {number} limit - Maximum number of words to return
     * @returns {Array} Words due for review
     */
    getWordsForReview(limit = 20) {
        const now = Date.now();
        const dueWords = this.reviewQueue
            .filter(item => item.nextReview <= now)
            .slice(0, limit)
            .map(item => {
                const bookmark = this.bookmarkedWords.get(item.id);
                const learningRecord = this.learningRecords.get(item.word);
                
                return {
                    ...bookmark,
                    learningRecord: learningRecord,
                    reviewPriority: item.priority
                };
            });

        return dueWords;
    }

    /**
     * Mark word as studied with result
     * @param {string} wordId - Word bookmark ID
     * @param {boolean} correct - Whether answer was correct
     * @param {number} responseTime - Response time in milliseconds
     * @returns {Promise<Object>} Study result
     */
    async studyWord(wordId, correct, responseTime = 0) {
        try {
            const bookmark = this.bookmarkedWords.get(wordId);
            if (!bookmark) {
                throw new Error('Bookmark not found');
            }

            // Update bookmark data
            bookmark.studyCount++;
            bookmark.lastStudied = Date.now();
            
            if (correct) {
                bookmark.masteryLevel = Math.min(100, bookmark.masteryLevel + 8);
                bookmark.status = bookmark.masteryLevel >= 80 ? 'mastered' : 'learning';
            } else {
                bookmark.masteryLevel = Math.max(0, bookmark.masteryLevel - 5);
                bookmark.status = 'learning';
            }

            // Calculate next review
            const currentInterval = this.getCurrentInterval(bookmark);
            bookmark.nextReview = this.calculateNextReview(currentInterval, bookmark.masteryLevel, correct);

            // Update learning record
            await this.updateLearningRecord(
                bookmark.word, 
                correct ? 'correct' : 'incorrect',
                { responseTime: responseTime }
            );

            // Update review queue
            this.updateReviewQueue(wordId, bookmark);

            // Record study session
            await this.recordStudySession({
                wordId: wordId,
                word: bookmark.word,
                correct: correct,
                responseTime: responseTime,
                masteryLevel: bookmark.masteryLevel
            });

            // Update goals and streaks
            this.updateGoalProgress('daily', 1);
            this.updateStreak();

            await this.saveData();

            return {
                success: true,
                masteryLevel: bookmark.masteryLevel,
                nextReview: bookmark.nextReview,
                message: correct ? 'Correct! Well done!' : 'Keep practicing!'
            };

        } catch (error) {
            console.error('❌ Study word failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get current interval for a word in days
     * @param {Object} bookmark - Bookmark data
     * @returns {number} Current interval in days
     */
    getCurrentInterval(bookmark) {
        if (!bookmark.lastStudied) return 0;
        
        const daysSinceLastStudy = (Date.now() - bookmark.lastStudied) / (24 * 60 * 60 * 1000);
        return Math.floor(daysSinceLastStudy);
    }

    /**
     * Update review queue after study session
     * @param {string} wordId - Word ID
     * @param {Object} bookmark - Updated bookmark data
     */
    updateReviewQueue(wordId, bookmark) {
        const queueIndex = this.reviewQueue.findIndex(item => item.id === wordId);
        
        if (queueIndex !== -1) {
            this.reviewQueue[queueIndex].nextReview = bookmark.nextReview;
            this.reviewQueue[queueIndex].priority = this.calculateReviewPriority(bookmark);
            
            // Re-sort queue
            this.reviewQueue.sort((a, b) => {
                if (a.nextReview !== b.nextReview) {
                    return a.nextReview - b.nextReview;
                }
                return b.priority - a.priority;
            });
        }
    }

    /**
     * Record study session
     * @param {Object} sessionData - Session data
     */
    async recordStudySession(sessionData) {
        const session = {
            id: this.generateSessionId(),
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0],
            ...sessionData
        };

        this.studySessions.push(session);
        
        // Keep only last 1000 sessions
        if (this.studySessions.length > 1000) {
            this.studySessions = this.studySessions.slice(-1000);
        }
    }

    /**
     * Update goal progress
     * @param {string} period - Period (daily, weekly, monthly)
     * @param {number} amount - Amount to add
     */
    updateGoalProgress(period, amount) {
        if (this.learningGoals[period]) {
            this.learningGoals[period].completed += amount;
        }
    }

    /**
     * Update learning streak
     */
    updateStreak() {
        const today = new Date().toISOString().split('T')[0];
        const lastStudyDate = this.streakData.lastStudyDate;
        
        if (lastStudyDate !== today) {
            if (lastStudyDate === this.getYesterday()) {
                // Continue streak
                this.streakData.current++;
            } else {
                // Reset streak
                this.streakData.current = 1;
            }
            
            this.streakData.lastStudyDate = today;
            this.streakData.longest = Math.max(this.streakData.longest, this.streakData.current);
        }
    }

    /**
     * Get yesterday's date string
     * @returns {string} Yesterday's date in YYYY-MM-DD format
     */
    getYesterday() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    }

    /**
     * Get learning statistics
     * @returns {Object} Comprehensive learning statistics
     */
    getLearningStatistics() {
        const stats = {
            overview: {
                totalBookmarks: this.bookmarkedWords.size,
                totalStudySessions: this.studySessions.length,
                currentStreak: this.streakData.current,
                longestStreak: this.streakData.longest
            },
            mastery: {
                mastered: 0,
                learning: 0,
                reviewing: 0,
                bookmarked: 0
            },
            difficulty: {
                basic: 0,
                elementary: 0,
                intermediate: 0,
                advanced: 0,
                expert: 0
            },
            recent: {
                todayStudied: 0,
                weekStudied: 0,
                monthStudied: 0
            },
            goals: this.learningGoals
        };

        // Calculate mastery distribution
        for (const bookmark of this.bookmarkedWords.values()) {
            stats.mastery[bookmark.status]++;
            stats.difficulty[bookmark.difficulty.toLowerCase()]++;
        }

        // Calculate recent activity
        const now = Date.now();
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

        for (const session of this.studySessions) {
            if (session.timestamp > oneDayAgo) {
                stats.recent.todayStudied++;
            }
            if (session.timestamp > oneWeekAgo) {
                stats.recent.weekStudied++;
            }
            if (session.timestamp > oneMonthAgo) {
                stats.recent.monthStudied++;
            }
        }

        return stats;
    }

    /**
     * Generate unique bookmark ID
     * @param {string} word - Word
     * @param {number} timestamp - Timestamp
     * @returns {string} Unique ID
     */
    generateBookmarkId(word, timestamp) {
        return `bookmark_${word}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate unique session ID
     * @returns {string} Unique session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Save data to Chrome storage
     */
    async saveData() {
        try {
            // Check if chrome.storage API is available
            if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
                console.warn('⚠️ ILM: Chrome storage API not available, data will not persist');
                return;
            }

            await chrome.storage.local.set({
                learningRecords: Array.from(this.learningRecords.entries()),
                bookmarkedWords: Array.from(this.bookmarkedWords.entries()),
                studySessions: this.studySessions,
                learningPreferences: this.preferences,
                reviewQueue: this.reviewQueue,
                streakData: this.streakData,
                learningGoals: this.learningGoals,
                spacedRepetitionData: Array.from(this.spacedRepetitionData.entries())
            });
        } catch (error) {
            console.error('❌ Failed to save learning data:', error);
        }
    }

    /**
     * Setup event listeners for background sync
     */
    setupEventListeners() {
        // Save data periodically
        setInterval(() => {
            this.saveData();
        }, 60000); // Every minute

        // Reset daily goals at midnight
        this.scheduleGoalReset();
    }

    /**
     * Schedule daily goal reset
     */
    scheduleGoalReset() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const msUntilMidnight = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            this.resetDailyGoals();
            // Schedule next reset
            this.scheduleGoalReset();
        }, msUntilMidnight);
    }

    /**
     * Reset daily goals
     */
    resetDailyGoals() {
        this.learningGoals.daily.completed = 0;
        this.saveData();
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.LearningManager = LearningManager;
}

// Initialize global instance
if (typeof window !== 'undefined' && !window.ilmLearningManager) {
    window.ilmLearningManager = new LearningManager();
}

} // End of LearningManager class definition check