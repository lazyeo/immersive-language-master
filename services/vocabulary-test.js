/**
 * Vocabulary Test System
 * Comprehensive testing system with multiple test types and difficulty adaptation
 */

class VocabularyTestSystem {
    constructor() {
        this.testTypes = {
            RECOGNITION: 'recognition',      // Multiple choice - English to Translation
            PRODUCTION: 'production',        // Fill in the blank
            LISTENING: 'listening',         // Audio to text
            CONTEXT: 'context',            // Word in context
            SPELLING: 'spelling',          // Type the word
            SYNONYM: 'synonym',            // Find synonyms
            ANTONYM: 'antonym'             // Find antonyms
        };
        
        this.difficultyLevels = {
            EASY: 1,
            MEDIUM: 2,
            HARD: 3,
            EXPERT: 4
        };
        
        this.currentTest = null;
        this.testHistory = [];
        this.adaptiveDifficulty = true;
    }

    /**
     * Create a new vocabulary test
     * @param {Array} words - Array of word objects to test
     * @param {Object} options - Test configuration options
     * @returns {Object} Test session object
     */
    createTest(words, options = {}) {
        const defaultOptions = {
            testType: this.testTypes.RECOGNITION,
            questionCount: Math.min(20, words.length),
            timeLimit: null, // in seconds, null for unlimited
            difficulty: this.difficultyLevels.MEDIUM,
            adaptive: true,
            includeReview: true,
            shuffleQuestions: true
        };
        
        const testConfig = { ...defaultOptions, ...options };
        
        // Select words for test based on spaced repetition priority
        const selectedWords = this.selectWordsForTest(words, testConfig.questionCount);
        
        // Generate questions based on test type
        const questions = this.generateQuestions(selectedWords, testConfig);
        
        // Create test session
        this.currentTest = {
            id: this.generateTestId(),
            startTime: Date.now(),
            config: testConfig,
            questions: testConfig.shuffleQuestions ? this.shuffleArray(questions) : questions,
            currentQuestionIndex: 0,
            answers: [],
            score: 0,
            timeSpent: 0,
            status: 'in_progress'
        };
        
        return this.currentTest;
    }

    /**
     * Select words for test based on priority
     * @param {Array} words - Available words
     * @param {number} count - Number of words to select
     * @returns {Array} Selected words
     */
    selectWordsForTest(words, count) {
        // Priority scoring for word selection
        const scoredWords = words.map(word => {
            let priority = 0;
            
            // Higher priority for words due for review
            if (word.nextReviewDate && new Date(word.nextReviewDate) <= new Date()) {
                priority += 30;
            }
            
            // Higher priority for words with lower mastery
            priority += (100 - (word.masteryLevel || 0)) / 2;
            
            // Higher priority for recently failed words
            if (word.lastTestResult === false) {
                priority += 20;
            }
            
            // Add some randomness
            priority += Math.random() * 10;
            
            return { ...word, testPriority: priority };
        });
        
        // Sort by priority and select top words
        return scoredWords
            .sort((a, b) => b.testPriority - a.testPriority)
            .slice(0, count);
    }

    /**
     * Generate questions based on test type
     * @param {Array} words - Words to test
     * @param {Object} config - Test configuration
     * @returns {Array} Generated questions
     */
    generateQuestions(words, config) {
        const questions = [];
        
        for (const word of words) {
            let question;
            
            switch (config.testType) {
                case this.testTypes.RECOGNITION:
                    question = this.createRecognitionQuestion(word, words);
                    break;
                case this.testTypes.PRODUCTION:
                    question = this.createProductionQuestion(word);
                    break;
                case this.testTypes.CONTEXT:
                    question = this.createContextQuestion(word);
                    break;
                case this.testTypes.SPELLING:
                    question = this.createSpellingQuestion(word);
                    break;
                case this.testTypes.SYNONYM:
                    question = this.createSynonymQuestion(word, words);
                    break;
                case this.testTypes.ANTONYM:
                    question = this.createAntonymQuestion(word, words);
                    break;
                default:
                    question = this.createRecognitionQuestion(word, words);
            }
            
            question.difficulty = this.calculateQuestionDifficulty(word, config.difficulty);
            questions.push(question);
        }
        
        return questions;
    }

    /**
     * Create a recognition (multiple choice) question
     * @param {Object} word - Target word
     * @param {Array} allWords - All available words for distractors
     * @returns {Object} Question object
     */
    createRecognitionQuestion(word, allWords) {
        const distractors = this.selectDistractors(word, allWords, 3);
        const options = this.shuffleArray([word.translation, ...distractors]);
        
        return {
            id: this.generateQuestionId(),
            type: this.testTypes.RECOGNITION,
            word: word.word,
            prompt: `What is the meaning of "${word.word}"?`,
            options: options,
            correctAnswer: word.translation,
            wordData: word,
            hint: word.context ? this.generateHint(word.context) : null
        };
    }

    /**
     * Create a production (fill in the blank) question
     * @param {Object} word - Target word
     * @returns {Object} Question object
     */
    createProductionQuestion(word) {
        const sentence = word.context || this.generateSentenceWithBlank(word);
        const blankedSentence = sentence.replace(
            new RegExp(`\\b${word.word}\\b`, 'gi'),
            '_____'
        );
        
        return {
            id: this.generateQuestionId(),
            type: this.testTypes.PRODUCTION,
            word: word.word,
            prompt: 'Fill in the blank:',
            sentence: blankedSentence,
            translation: word.translation,
            correctAnswer: word.word,
            wordData: word,
            hint: `First letter: ${word.word[0].toUpperCase()}`
        };
    }

    /**
     * Create a context question
     * @param {Object} word - Target word
     * @returns {Object} Question object
     */
    createContextQuestion(word) {
        const contexts = this.generateContexts(word);
        const correctContext = contexts.find(c => c.isCorrect);
        
        return {
            id: this.generateQuestionId(),
            type: this.testTypes.CONTEXT,
            word: word.word,
            prompt: `Which sentence uses "${word.word}" correctly?`,
            options: contexts.map(c => c.sentence),
            correctAnswer: correctContext.sentence,
            wordData: word,
            hint: word.translation
        };
    }

    /**
     * Create a spelling question
     * @param {Object} word - Target word
     * @returns {Object} Question object
     */
    createSpellingQuestion(word) {
        return {
            id: this.generateQuestionId(),
            type: this.testTypes.SPELLING,
            word: word.word,
            prompt: `Spell the word that means: ${word.translation}`,
            audioHint: this.generateAudioHint(word.word),
            correctAnswer: word.word,
            wordData: word,
            hint: `${word.word.length} letters, starts with "${word.word[0]}"`
        };
    }

    /**
     * Create a synonym question
     * @param {Object} word - Target word
     * @param {Array} allWords - All available words
     * @returns {Object} Question object
     */
    createSynonymQuestion(word, allWords) {
        const synonyms = this.findSynonyms(word, allWords);
        const distractors = this.selectDistractors(word, allWords, 3 - synonyms.length);
        const options = this.shuffleArray([...synonyms, ...distractors]);
        
        return {
            id: this.generateQuestionId(),
            type: this.testTypes.SYNONYM,
            word: word.word,
            prompt: `Which word is similar in meaning to "${word.word}"?`,
            options: options,
            correctAnswer: synonyms[0] || word.word, // Fallback if no synonyms found
            wordData: word,
            hint: word.translation
        };
    }

    /**
     * Create an antonym question
     * @param {Object} word - Target word
     * @param {Array} allWords - All available words
     * @returns {Object} Question object
     */
    createAntonymQuestion(word, allWords) {
        const antonyms = this.findAntonyms(word, allWords);
        const distractors = this.selectDistractors(word, allWords, 3 - antonyms.length);
        const options = this.shuffleArray([...antonyms, ...distractors]);
        
        return {
            id: this.generateQuestionId(),
            type: this.testTypes.ANTONYM,
            word: word.word,
            prompt: `Which word is opposite in meaning to "${word.word}"?`,
            options: options,
            correctAnswer: antonyms[0] || null,
            wordData: word,
            hint: word.translation
        };
    }

    /**
     * Submit answer for current question
     * @param {string} answer - User's answer
     * @returns {Object} Result of answer submission
     */
    submitAnswer(answer) {
        if (!this.currentTest || this.currentTest.status !== 'in_progress') {
            return { success: false, error: 'No active test' };
        }
        
        const currentQuestion = this.currentTest.questions[this.currentTest.currentQuestionIndex];
        const isCorrect = this.checkAnswer(answer, currentQuestion);
        const timeSpent = Date.now() - this.currentTest.startTime;
        
        // Record answer
        const answerRecord = {
            questionId: currentQuestion.id,
            userAnswer: answer,
            correctAnswer: currentQuestion.correctAnswer,
            isCorrect: isCorrect,
            timeSpent: timeSpent,
            hintsUsed: currentQuestion.hintsUsed || 0
        };
        
        this.currentTest.answers.push(answerRecord);
        
        // Update score
        if (isCorrect) {
            this.currentTest.score++;
        }
        
        // Adaptive difficulty adjustment
        if (this.currentTest.config.adaptive) {
            this.adjustDifficulty(isCorrect);
        }
        
        // Move to next question or complete test
        this.currentTest.currentQuestionIndex++;
        
        if (this.currentTest.currentQuestionIndex >= this.currentTest.questions.length) {
            this.completeTest();
        }
        
        return {
            success: true,
            isCorrect: isCorrect,
            correctAnswer: currentQuestion.correctAnswer,
            explanation: this.generateExplanation(currentQuestion, isCorrect),
            progress: {
                current: this.currentTest.currentQuestionIndex,
                total: this.currentTest.questions.length,
                score: this.currentTest.score
            }
        };
    }

    /**
     * Check if answer is correct
     * @param {string} userAnswer - User's answer
     * @param {Object} question - Question object
     * @returns {boolean} Whether answer is correct
     */
    checkAnswer(userAnswer, question) {
        const normalizedUser = this.normalizeAnswer(userAnswer);
        const normalizedCorrect = this.normalizeAnswer(question.correctAnswer);
        
        switch (question.type) {
            case this.testTypes.SPELLING:
                // Exact match required for spelling
                return normalizedUser === normalizedCorrect;
            
            case this.testTypes.PRODUCTION:
                // Allow minor variations for production
                return this.fuzzyMatch(normalizedUser, normalizedCorrect);
            
            default:
                // Standard comparison
                return normalizedUser === normalizedCorrect;
        }
    }

    /**
     * Normalize answer for comparison
     * @param {string} answer - Answer to normalize
     * @returns {string} Normalized answer
     */
    normalizeAnswer(answer) {
        if (!answer) return '';
        return answer.toString().toLowerCase().trim();
    }

    /**
     * Fuzzy match for production questions
     * @param {string} userAnswer - User's answer
     * @param {string} correctAnswer - Correct answer
     * @returns {boolean} Whether answers match with tolerance
     */
    fuzzyMatch(userAnswer, correctAnswer) {
        // Check for exact match first
        if (userAnswer === correctAnswer) return true;
        
        // Check for minor typos (Levenshtein distance)
        const distance = this.levenshteinDistance(userAnswer, correctAnswer);
        const threshold = Math.floor(correctAnswer.length * 0.2); // 20% tolerance
        
        return distance <= threshold;
    }

    /**
     * Calculate Levenshtein distance between two strings
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} Edit distance
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    /**
     * Complete the current test
     */
    completeTest() {
        if (!this.currentTest) return;
        
        this.currentTest.status = 'completed';
        this.currentTest.endTime = Date.now();
        this.currentTest.totalTime = this.currentTest.endTime - this.currentTest.startTime;
        
        // Calculate final statistics
        const stats = this.calculateTestStatistics();
        this.currentTest.statistics = stats;
        
        // Save to history
        this.testHistory.push(this.currentTest);
        
        // Limit history to last 100 tests
        if (this.testHistory.length > 100) {
            this.testHistory = this.testHistory.slice(-100);
        }
    }

    /**
     * Calculate test statistics
     * @returns {Object} Test statistics
     */
    calculateTestStatistics() {
        const test = this.currentTest;
        const totalQuestions = test.questions.length;
        const correctAnswers = test.score;
        const incorrectAnswers = totalQuestions - correctAnswers;
        const accuracy = (correctAnswers / totalQuestions * 100).toFixed(1);
        const averageTime = Math.floor(test.totalTime / totalQuestions / 1000);
        
        // Analyze by word difficulty
        const difficultyBreakdown = {
            easy: { correct: 0, total: 0 },
            medium: { correct: 0, total: 0 },
            hard: { correct: 0, total: 0 },
            expert: { correct: 0, total: 0 }
        };
        
        test.questions.forEach((question, index) => {
            const answer = test.answers[index];
            const difficulty = this.getDifficultyName(question.difficulty);
            
            difficultyBreakdown[difficulty].total++;
            if (answer && answer.isCorrect) {
                difficultyBreakdown[difficulty].correct++;
            }
        });
        
        return {
            totalQuestions,
            correctAnswers,
            incorrectAnswers,
            accuracy: `${accuracy}%`,
            averageTimePerQuestion: `${averageTime}s`,
            totalTime: `${Math.floor(test.totalTime / 1000)}s`,
            difficultyBreakdown,
            grade: this.calculateGrade(accuracy)
        };
    }

    /**
     * Calculate grade based on accuracy
     * @param {number} accuracy - Test accuracy percentage
     * @returns {string} Letter grade
     */
    calculateGrade(accuracy) {
        if (accuracy >= 95) return 'A+';
        if (accuracy >= 90) return 'A';
        if (accuracy >= 85) return 'B+';
        if (accuracy >= 80) return 'B';
        if (accuracy >= 75) return 'C+';
        if (accuracy >= 70) return 'C';
        if (accuracy >= 65) return 'D+';
        if (accuracy >= 60) return 'D';
        return 'F';
    }

    /**
     * Get difficulty name from level
     * @param {number} level - Difficulty level
     * @returns {string} Difficulty name
     */
    getDifficultyName(level) {
        const names = ['easy', 'medium', 'hard', 'expert'];
        return names[level - 1] || 'medium';
    }

    /**
     * Generate explanation for answer
     * @param {Object} question - Question object
     * @param {boolean} isCorrect - Whether answer was correct
     * @returns {string} Explanation text
     */
    generateExplanation(question, isCorrect) {
        if (isCorrect) {
            return `Correct! "${question.word}" means "${question.wordData.translation}".`;
        } else {
            return `The correct answer is "${question.correctAnswer}". "${question.word}" means "${question.wordData.translation}".`;
        }
    }

    /**
     * Adjust difficulty based on performance
     * @param {boolean} isCorrect - Whether last answer was correct
     */
    adjustDifficulty(isCorrect) {
        if (!this.currentTest || !this.currentTest.config.adaptive) return;
        
        // Track recent performance
        const recentAnswers = this.currentTest.answers.slice(-5);
        const recentCorrect = recentAnswers.filter(a => a.isCorrect).length;
        const recentAccuracy = recentCorrect / recentAnswers.length;
        
        // Adjust difficulty for remaining questions
        const remainingQuestions = this.currentTest.questions.slice(
            this.currentTest.currentQuestionIndex
        );
        
        if (recentAccuracy >= 0.8 && this.currentTest.config.difficulty < this.difficultyLevels.EXPERT) {
            // Increase difficulty
            this.currentTest.config.difficulty++;
            remainingQuestions.forEach(q => {
                q.difficulty = Math.min(q.difficulty + 1, this.difficultyLevels.EXPERT);
            });
        } else if (recentAccuracy <= 0.4 && this.currentTest.config.difficulty > this.difficultyLevels.EASY) {
            // Decrease difficulty
            this.currentTest.config.difficulty--;
            remainingQuestions.forEach(q => {
                q.difficulty = Math.max(q.difficulty - 1, this.difficultyLevels.EASY);
            });
        }
    }

    /**
     * Get current question
     * @returns {Object|null} Current question or null
     */
    getCurrentQuestion() {
        if (!this.currentTest || this.currentTest.status !== 'in_progress') {
            return null;
        }
        
        return this.currentTest.questions[this.currentTest.currentQuestionIndex] || null;
    }

    /**
     * Use hint for current question
     * @returns {Object} Hint information
     */
    useHint() {
        const currentQuestion = this.getCurrentQuestion();
        if (!currentQuestion) {
            return { success: false, error: 'No active question' };
        }
        
        currentQuestion.hintsUsed = (currentQuestion.hintsUsed || 0) + 1;
        
        return {
            success: true,
            hint: currentQuestion.hint,
            hintsUsed: currentQuestion.hintsUsed,
            penaltyApplied: currentQuestion.hintsUsed > 1
        };
    }

    /**
     * Skip current question
     * @returns {Object} Skip result
     */
    skipQuestion() {
        if (!this.currentTest || this.currentTest.status !== 'in_progress') {
            return { success: false, error: 'No active test' };
        }
        
        // Record as incorrect
        this.submitAnswer(null);
        
        return {
            success: true,
            message: 'Question skipped'
        };
    }

    /**
     * Helper methods
     */
    
    selectDistractors(word, allWords, count) {
        // Select similar words as distractors
        const distractors = allWords
            .filter(w => w.word !== word.word)
            .filter(w => w.difficulty === word.difficulty || Math.abs(w.difficulty - word.difficulty) <= 1)
            .map(w => w.translation)
            .slice(0, count);
        
        // Add random words if not enough similar ones
        while (distractors.length < count) {
            const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
            if (randomWord.word !== word.word && !distractors.includes(randomWord.translation)) {
                distractors.push(randomWord.translation);
            }
        }
        
        return distractors;
    }
    
    generateHint(context) {
        // Extract first few words of context as hint
        const words = context.split(' ').slice(0, 5).join(' ');
        return `Context: "${words}..."`;
    }
    
    generateSentenceWithBlank(word) {
        // Generate a simple sentence with the word
        const templates = [
            `The ${word.word} is very important.`,
            `I need to ${word.word} this task.`,
            `This is a ${word.word} example.`,
            `We should ${word.word} carefully.`
        ];
        
        return templates[Math.floor(Math.random() * templates.length)];
    }
    
    generateContexts(word) {
        // Generate correct and incorrect usage contexts
        return [
            { sentence: `The ${word.word} was clearly visible.`, isCorrect: true },
            { sentence: `I ${word.word} to the store yesterday.`, isCorrect: false },
            { sentence: `This ${word.word} is broken.`, isCorrect: false }
        ];
    }
    
    generateAudioHint(word) {
        // Placeholder for audio generation
        return `[Audio pronunciation of "${word}"]`;
    }
    
    findSynonyms(word, allWords) {
        // Simple synonym finding - would be enhanced with actual synonym database
        return [];
    }
    
    findAntonyms(word, allWords) {
        // Simple antonym finding - would be enhanced with actual antonym database
        return [];
    }
    
    calculateQuestionDifficulty(word, baseDifficulty) {
        // Adjust question difficulty based on word characteristics
        let difficulty = baseDifficulty;
        
        if (word.masteryLevel < 30) {
            difficulty = Math.max(this.difficultyLevels.EASY, difficulty - 1);
        } else if (word.masteryLevel > 70) {
            difficulty = Math.min(this.difficultyLevels.EXPERT, difficulty + 1);
        }
        
        return difficulty;
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    generateTestId() {
        return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    generateQuestionId() {
        return `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VocabularyTestSystem;
}