/**
 * Spaced Repetition Learning System
 * Implements SuperMemo 2 algorithm for optimal vocabulary retention
 */

class SpacedRepetitionSystem {
    constructor() {
        this.DEFAULT_EASE_FACTOR = 2.5;
        this.MIN_EASE_FACTOR = 1.3;
        this.EASE_BONUS = 0.15;
        this.EASE_PENALTY = 0.2;
    }

    /**
     * Calculate next review interval using SuperMemo 2 algorithm
     * @param {Object} wordData - Word learning data
     * @param {number} wordData.repetitions - Number of successful repetitions
     * @param {number} wordData.easeFactor - Current ease factor (default 2.5)
     * @param {number} wordData.interval - Last interval in days
     * @param {number} quality - Quality of recall (0-5, where 0-2 is fail, 3-5 is pass)
     * @returns {Object} Updated learning data with next review date
     */
    calculateNextReview(wordData, quality) {
        let { repetitions = 0, easeFactor = this.DEFAULT_EASE_FACTOR, interval = 1 } = wordData;
        
        // Calculate new ease factor
        const newEaseFactor = this.calculateEaseFactor(easeFactor, quality);
        
        // Calculate next interval
        let nextInterval;
        if (quality < 3) {
            // Failed recall - reset to beginning
            repetitions = 0;
            nextInterval = 1;
        } else {
            // Successful recall
            repetitions++;
            if (repetitions === 1) {
                nextInterval = 1;
            } else if (repetitions === 2) {
                nextInterval = 6;
            } else {
                nextInterval = Math.round(interval * newEaseFactor);
            }
        }
        
        // Calculate next review date
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);
        
        return {
            repetitions,
            easeFactor: newEaseFactor,
            interval: nextInterval,
            nextReviewDate: nextReviewDate.toISOString(),
            lastReviewDate: new Date().toISOString(),
            quality
        };
    }

    /**
     * Calculate new ease factor based on quality of recall
     * @param {number} currentEaseFactor - Current ease factor
     * @param {number} quality - Quality of recall (0-5)
     * @returns {number} New ease factor
     */
    calculateEaseFactor(currentEaseFactor, quality) {
        // SuperMemo 2 formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        let newEaseFactor = currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        
        // Ensure ease factor doesn't go below minimum
        return Math.max(this.MIN_EASE_FACTOR, newEaseFactor);
    }

    /**
     * Get words due for review
     * @param {Object} wordDatabase - Database of all words with learning data
     * @param {Date} currentDate - Current date (defaults to now)
     * @returns {Array} Array of words due for review
     */
    getWordsForReview(wordDatabase, currentDate = new Date()) {
        const dueWords = [];
        
        for (const [word, data] of Object.entries(wordDatabase)) {
            if (data.nextReviewDate) {
                const reviewDate = new Date(data.nextReviewDate);
                if (reviewDate <= currentDate) {
                    dueWords.push({
                        word,
                        ...data,
                        overdueDays: Math.floor((currentDate - reviewDate) / (1000 * 60 * 60 * 24))
                    });
                }
            }
        }
        
        // Sort by overdue days (most overdue first) and then by ease factor (hardest first)
        return dueWords.sort((a, b) => {
            if (a.overdueDays !== b.overdueDays) {
                return b.overdueDays - a.overdueDays;
            }
            return a.easeFactor - b.easeFactor;
        });
    }

    /**
     * Initialize word for spaced repetition
     * @param {string} word - The word to track
     * @returns {Object} Initial learning data
     */
    initializeWord(word) {
        return {
            word,
            repetitions: 0,
            easeFactor: this.DEFAULT_EASE_FACTOR,
            interval: 1,
            nextReviewDate: new Date().toISOString(),
            lastReviewDate: null,
            totalReviews: 0,
            successfulReviews: 0,
            averageQuality: 0,
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Record a review session
     * @param {Object} wordData - Current word data
     * @param {number} quality - Quality of recall (0-5)
     * @returns {Object} Updated word data
     */
    recordReview(wordData, quality) {
        const updatedData = this.calculateNextReview(wordData, quality);
        
        // Update statistics
        updatedData.totalReviews = (wordData.totalReviews || 0) + 1;
        if (quality >= 3) {
            updatedData.successfulReviews = (wordData.successfulReviews || 0) + 1;
        }
        updatedData.averageQuality = 
            ((wordData.averageQuality || 0) * (wordData.totalReviews || 0) + quality) / 
            updatedData.totalReviews;
        
        return updatedData;
    }

    /**
     * Get learning statistics for a word
     * @param {Object} wordData - Word learning data
     * @returns {Object} Statistics object
     */
    getWordStatistics(wordData) {
        if (!wordData) return null;
        
        const successRate = wordData.totalReviews > 0 
            ? (wordData.successfulReviews / wordData.totalReviews * 100).toFixed(1)
            : 0;
        
        const masteryLevel = this.calculateMasteryLevel(wordData);
        const nextReviewIn = this.getTimeUntilReview(wordData.nextReviewDate);
        
        return {
            word: wordData.word,
            masteryLevel,
            successRate: `${successRate}%`,
            totalReviews: wordData.totalReviews || 0,
            nextReviewIn,
            easeFactor: wordData.easeFactor?.toFixed(2) || this.DEFAULT_EASE_FACTOR,
            currentInterval: wordData.interval || 1,
            averageQuality: wordData.averageQuality?.toFixed(1) || 0
        };
    }

    /**
     * Calculate mastery level based on learning data
     * @param {Object} wordData - Word learning data
     * @returns {string} Mastery level
     */
    calculateMasteryLevel(wordData) {
        const { repetitions = 0, easeFactor = this.DEFAULT_EASE_FACTOR, interval = 1 } = wordData;
        
        if (interval >= 180) return 'Mastered';
        if (interval >= 60) return 'Well Known';
        if (interval >= 21) return 'Familiar';
        if (interval >= 7) return 'Learning';
        if (repetitions > 0) return 'Introduced';
        return 'New';
    }

    /**
     * Get human-readable time until next review
     * @param {string} nextReviewDate - ISO date string
     * @returns {string} Human-readable time string
     */
    getTimeUntilReview(nextReviewDate) {
        if (!nextReviewDate) return 'Not scheduled';
        
        const now = new Date();
        const reviewDate = new Date(nextReviewDate);
        const diffMs = reviewDate - now;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        if (diffDays < 7) return `Due in ${diffDays} days`;
        if (diffDays < 30) return `Due in ${Math.floor(diffDays / 7)} weeks`;
        return `Due in ${Math.floor(diffDays / 30)} months`;
    }

    /**
     * Get review schedule forecast
     * @param {Object} wordData - Word learning data
     * @param {number} futureReviews - Number of future reviews to forecast
     * @returns {Array} Array of forecasted review dates
     */
    getForecast(wordData, futureReviews = 5) {
        const forecast = [];
        let currentData = { ...wordData };
        
        for (let i = 0; i < futureReviews; i++) {
            // Simulate perfect recall (quality = 4)
            currentData = this.calculateNextReview(currentData, 4);
            forecast.push({
                reviewNumber: i + 1,
                date: currentData.nextReviewDate,
                interval: currentData.interval,
                easeFactor: currentData.easeFactor.toFixed(2)
            });
        }
        
        return forecast;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpacedRepetitionSystem;
}