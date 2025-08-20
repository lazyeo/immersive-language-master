# English Listening Assistant - Development Plan

**Document Version**: 3.0  
**Last Updated**: 2024-12-19  
**Planning Cycle**: Sprint-based Development  
**Review Frequency**: Weekly

## 🎯 Development Methodology

### Planning Process
1. **Pre-Development**: Update this plan document with proposed changes
2. **Discussion Phase**: Review requirements and technical approach
3. **Implementation**: Execute according to plan with progress tracking
4. **Post-Development**: Update all documentation with latest changes
5. **Review**: Validate implementation against plan requirements

### Documentation Update Protocol
- **Before Each Sprint**: Update development plan with new requirements
- **During Development**: Track progress in TODO lists and commit messages
- **After Completion**: Update PROJECT_OVERVIEW.md with new architecture details
- **Regular Maintenance**: Weekly review of documentation accuracy

## 📋 Current Sprint Status

### Sprint 6: Smart Word Splitting & New Tab Dashboard ✅ COMPLETED
**Duration**: Completed 2024-12-19  
**Objective**: Implement smart word splitting and comprehensive learning ecosystem

**Completed Tasks**:
- [x] Implemented smart word splitting for concatenated subtitle words
- [x] Created comprehensive New Tab learning dashboard
- [x] Integrated multi-provider translation service (6 providers)
- [x] Added configurable new tab settings with preview/reset functionality
- [x] Enhanced Chrome Side Panel with advanced features
- [x] Deployed cross-platform smart processing (YouTube + Netflix)
- [x] Added real-time subtitle timeline in side panel
- [x] Implemented translation API management with secure storage
- [x] Created personalized vocabulary review system

**Technical Achievements**:
- Dictionary-based smart word splitting eliminates concatenation issues
- Multi-interface ecosystem with Chrome Side Panel + New Tab Dashboard
- 6-provider translation system with automatic fallback
- Configurable new tab replacement with user controls
- Real-time subtitle timeline with click-to-jump functionality
- Comprehensive settings management across all interfaces

### Sprint 5: Independent Subtitle System ✅ COMPLETED
**Duration**: Completed 2024-12-17  
**Objective**: Implement YouTube independent subtitle system and research Netflix solutions

**Completed Tasks**:
- [x] Implemented YouTube independent subtitle fetching via `ytInitialPlayerResponse`
- [x] Created comprehensive subtitle parsers (SRV3 XML, WebVTT, Generic XML)
- [x] Added time-based subtitle synchronization (200ms polling)
- [x] Researched Netflix subtitle extraction solutions (GitHub analysis)
- [x] Integrated independent system with existing processing pipeline
- [x] Added proper fallback to DOM-based detection
- [x] Implemented format auto-detection and parsing

**Technical Achievements**:
- YouTube subtitles work without manual caption activation
- Multi-format subtitle parser supporting SRV3, WebVTT, XML
- Real-time synchronization with video playback
- Comprehensive Netflix research identifying viable implementation paths
- Seamless integration with existing vocabulary processing system

### Sprint 4: Interactive Learning Enhancement ✅ COMPLETED
**Duration**: Completed 2024-12-19  
**Objective**: Fix subtitle issues and add interactive learning features

**Completed Tasks**:
- [x] Fixed subtitle duplication and timing issues
- [x] Eliminated subtitle container flashing/jittering  
- [x] Added click-to-mark-known functionality for green words
- [x] Added hover reveal for hidden words with click-to-learn
- [x] Unified vocabulary management system
- [x] Redesigned UI with green color scheme (avoiding blue)
- [x] Expanded popup width from 380px to 480px
- [x] Enhanced Netflix subtitle support

**Technical Achievements**:
- Stable subtitle container with improved polling (200ms)
- Time-based deduplication for subtitle processing
- Interactive word elements with event handlers
- Improved CSS with modern design patterns
- Better error handling and debugging support

## 🚀 Upcoming Sprints

### Sprint 7: Advanced Analytics & Performance Optimization 📋 PLANNED
**Start Date**: TBD  
**Duration**: 2-3 weeks  
**Priority**: High  

**Objectives**:
- Implement spaced repetition learning algorithm
- Add comprehensive analytics dashboard
- Optimize performance across all components
- Enhance user behavior analytics

**Planned Tasks**:
- [ ] Design and implement spaced repetition scheduling algorithm
- [ ] Create comprehensive learning analytics dashboard
- [ ] Add vocabulary export/import functionality (CSV/JSON)
- [ ] Implement learning streak tracking and gamification
- [ ] Add performance monitoring and optimization
- [ ] Create user behavior analytics system
- [ ] Implement advanced progress visualization
- [ ] Add study session scheduling and reminders

**Technical Requirements**:
- Advanced data analytics engine
- Spaced repetition algorithm implementation
- Export/import file handling system
- Performance monitoring infrastructure
- Chart visualization components
- Data compression and optimization
- User behavior tracking (privacy-compliant)
- Cross-session data synchronization

### Sprint 8: Netflix Independent Subtitles (Deferred) 📋 BACKLOG
**Start Date**: Q1 2025  
**Duration**: 3-4 weeks  
**Priority**: Medium  

**Objectives**:
- Implement Netflix independent subtitle system using research findings
- Add advanced subtitle extraction capabilities
- Enhance cross-platform subtitle processing

**Planned Tasks**:
- [ ] Implement Netflix subtitle extraction using Tithen-Firion approach
- [ ] Create JSON.parse hijacking for subtitle metadata interception
- [ ] Add network request interception for subtitle URL access
- [ ] Implement Falcor cache access for Netflix video metadata
- [ ] Add WebVTT, DFXP, IMSC1.1 format support
- [ ] Create universal subtitle processor
- [ ] Add cross-platform subtitle synchronization

**Technical Requirements**:
- Netflix network request interception system
- JSON parsing override mechanisms
- CORS handling for external subtitle URLs
- Multi-format subtitle parser enhancement
- Universal subtitle processing architecture

### Sprint 9: Platform Expansion & AI Integration 📋 BACKLOG
**Start Date**: Q1 2025  
**Duration**: 3-4 weeks  
**Priority**: Medium

**Objectives**:
- Add support for additional video platforms
- Implement AI-powered learning recommendations
- Create universal content processor

**Planned Tasks**:
- [ ] Add Amazon Prime Video support
- [ ] Add Hulu subtitle processing
- [ ] Implement AI-powered difficulty assessment
- [ ] Create personalized learning path recommendations
- [ ] Add podcast transcript support
- [ ] Implement web article reading mode
- [ ] Create universal content detection system

**Technical Requirements**:
- Multi-platform subtitle detection
- AI/ML integration for personalization
- Universal content processing architecture
- Cross-platform compatibility system


## 🔧 Technical Debt & Improvements

### High Priority Technical Debt
1. **Advanced Analytics Implementation**
   - Current: Basic progress tracking
   - Target: Comprehensive learning analytics with spaced repetition
   - Include: Learning velocity, retention rates, personalized recommendations

2. **Performance Optimization**
   - Current: Good performance across all components
   - Target: Further optimization for large vocabulary sets
   - Include: Web workers, advanced caching, algorithm optimization

3. **Netflix Independent Subtitles**
   - Current: DOM-based processing with smart word splitting
   - Target: Independent subtitle system like YouTube
   - Include: Network interception, metadata extraction, multi-format support

### Medium Priority Improvements
1. **UI/UX Enhancements**
   - Add dark mode support
   - Implement accessibility features
   - Create mobile-responsive design

2. **Advanced Learning Features**
   - Word pronunciation audio
   - Context-based examples
   - Grammar pattern recognition

3. **Data Management**
   - Cloud sync capabilities
   - Backup/restore functionality
   - Cross-device synchronization

## 📊 Feature Roadmap

### Version 1.3.0 - Smart Features & Translation Integration ✅ COMPLETED
**Released**: December 2024
- ✅ Smart word splitting system
- ✅ Multi-provider translation integration (6 providers)
- ✅ New Tab learning dashboard
- ✅ Chrome Side Panel interface
- ✅ Configurable features with preview/reset
- ✅ Real-time subtitle timeline

### Version 1.4.0 - Advanced Analytics
**Target**: January 2025
- Spaced repetition learning algorithm
- Comprehensive analytics dashboard
- Learning progress visualization
- Vocabulary export/import functionality
- Performance optimization
- User behavior analytics

### Version 1.5.0 - Netflix Independent Subtitles
**Target**: February 2025
- Netflix independent subtitle system
- Advanced subtitle extraction
- Multi-format subtitle support
- Universal subtitle processor

### Version 1.6.0 - Platform Expansion  
**Target**: March 2025
- Additional streaming platforms
- AI-powered learning recommendations
- Web article reading mode
- Cross-platform compatibility

### Version 2.0.0 - Advanced AI Features
**Target**: Q2 2025
- AI-powered difficulty assessment
- Personalized learning paths
- Context-aware translations
- Advanced speech recognition integration

## 🔍 Quality Assurance Plan

### Testing Strategy
1. **Automated Testing**
   - Unit tests for core vocabulary logic
   - Integration tests for subtitle processing
   - Performance benchmarks
   - Cross-browser compatibility tests

2. **Manual Testing Protocol**
   - Feature acceptance testing
   - User experience validation
   - Accessibility compliance checking
   - Performance monitoring

3. **User Feedback Integration**
   - Beta testing program
   - Feedback collection system
   - Issue tracking and resolution
   - Feature request prioritization

### Performance Benchmarks
- **Subtitle Detection**: <200ms latency
- **Memory Usage**: <100MB peak
- **CPU Usage**: <5% average during video playback
- **Storage Efficiency**: <10MB local data footprint

## 📈 Success Metrics

### User Engagement
- Daily active users
- Session duration
- Feature adoption rates
- Vocabulary learning progress

### Technical Performance
- Error rates and crash frequency
- API response times
- Resource usage optimization
- Platform compatibility scores

### Educational Effectiveness
- Vocabulary retention rates
- Learning progression analytics
- User satisfaction scores
- Long-term engagement metrics

## 🚨 Risk Management

### Technical Risks
1. **Platform Changes**: YouTube/Netflix may modify their HTML structure
   - **Mitigation**: Robust selector fallback chains, regular monitoring
   
2. **API Dependencies**: Translation services may change or become unavailable
   - **Mitigation**: Multiple API provider support, offline fallbacks

3. **Performance Issues**: Large vocabulary databases may impact performance
   - **Mitigation**: Lazy loading, efficient caching, web workers

### Business Risks
1. **Chrome Store Policies**: Extension policies may change
   - **Mitigation**: Regular policy compliance reviews, alternative distribution

2. **Competition**: Similar products may enter the market
   - **Mitigation**: Focus on unique features, user experience excellence

## 🔄 Maintenance Schedule

### Weekly Tasks
- [ ] Update documentation for any code changes
- [ ] Review and prioritize user feedback
- [ ] Monitor platform compatibility
- [ ] Update project overview with current status

### Monthly Tasks
- [ ] Comprehensive testing across all supported platforms
- [ ] Performance benchmark analysis
- [ ] Security audit and dependency updates
- [ ] Roadmap review and adjustment

### Quarterly Tasks
- [ ] Major feature planning sessions
- [ ] Architecture review and optimization
- [ ] User research and feature validation
- [ ] Long-term strategy alignment

---

## 📋 Change Log Template

### When Adding New Features:
1. Update this DEVELOPMENT_PLAN.md with new requirements
2. Create detailed technical specifications
3. Update PROJECT_OVERVIEW.md architecture section
4. Track implementation progress
5. Document final implementation details

### When Fixing Bugs:
1. Document the issue in this plan
2. Specify the fix approach
3. Update affected system documentation
4. Verify fix completeness

### When Modifying Architecture:
1. Update PROJECT_OVERVIEW.md immediately
2. Revise this plan's technical requirements
3. Update API documentation
4. Validate system integration points

---

## 📚 Netflix Subtitle Extraction Research Results

### Research Summary (Completed 2024-12-17)

**GitHub Repository Analysis**: Conducted comprehensive analysis of 10+ Netflix subtitle extraction projects

**Key Technical Approaches Identified**:

1. **Network Request Interception** (Most Advanced - Tithen-Firion)
   - Hijack `JSON.parse()` to intercept subtitle track metadata
   - Override `XMLHttpRequest.prototype.open()` and `window.fetch()`
   - Access `netflix.falcorCache.videos` for video metadata
   - Support for WebVTT, DFXP, IMSC1.1 formats
   - 40,818+ active installations

2. **DOM-Based with Adapter Pattern** (Most Stable - dual-captions)
   - Intercept caption file requests directly
   - Use adapter pattern for UI change resilience
   - Long-term compatibility focus
   - No internal API dependencies

3. **Hybrid Approaches**
   - Content script injection for real-time processing
   - Multiple selector fallback chains
   - CSS manipulation for subtitle styling

**Implementation Recommendations**:
- **Priority 1**: Implement Tithen-Firion approach for maximum functionality
- **Priority 2**: Maintain DOM fallback for stability
- **Priority 3**: Add adapter pattern for future Netflix UI changes

**Technical Specifications for Sprint 6**:
- JSON parsing hooks for subtitle metadata extraction
- Network request interception for subtitle URL access
- CORS-enabled fetch for external subtitle retrieval
- Falcor cache integration for video metadata
- Format detection and parsing (WebVTT, DFXP, IMSC1.1)

---

**Next Review Date**: 2024-12-26  
**Plan Owner**: Development Team  
**Stakeholders**: Project maintainers, user community

---

## 🎯 Sprint 6 Detailed Results

### Smart Word Splitting Implementation
**Problem Addressed**: User reported concatenated subtitle words ("ifyou" instead of "if you")

**Solution Implemented**:
- Dictionary-based word separation algorithm
- Common English word pattern recognition
- Cross-platform deployment (YouTube + Netflix)
- Performance optimization with <5ms processing overhead

**Technical Details**:
- `smartSplitWords()` method in both content scripts
- Uses comprehensive English word database for pattern matching
- Fallback handling for edge cases
- Integrated with existing subtitle processing pipeline

### New Tab Learning Dashboard
**Problem Addressed**: User requested fragmented time English learning solution

**Solution Implemented**:
- Complete new tab replacement with learning dashboard
- Personalized vocabulary review system
- Progress tracking and visualization
- Quick action buttons for common tasks
- Recent activity timeline

**Technical Details**:
- `newtab/` directory with complete dashboard implementation
- `LearningDashboard` class managing all functionality
- Chrome URL override in manifest.json
- Responsive design with CSS Grid and Flexbox
- Integration with Chrome storage API

### Multi-Provider Translation System
**Problem Addressed**: Need for reliable, high-quality translations

**Solution Implemented**:
- 6-provider translation system (Google, DeepL, Claude, ChatGPT, xAI, Gemini)
- Automatic fallback between providers
- API key management and secure storage
- Real-time translation integration
- Multi-language support

**Technical Details**:
- `services/translation-service.js` coordinator
- Provider-specific implementation methods
- Error handling and fallback logic
- Integration with sidebar settings interface
- Secure API key storage using Chrome storage API

### Configuration System Enhancement
**Problem Addressed**: User requested optional, configurable new tab feature

**Solution Implemented**:
- Complete new tab configuration system
- Enable/disable toggle with immediate effect
- Preview mode for testing dashboard
- Reset to defaults functionality
- Settings persistence across browser sessions

**Technical Details**:
- `updateNewTabSetting()`, `openNewTabPreview()`, `resetNewTabSettings()` methods
- Settings integration with Chrome storage API
- UI feedback and notification system
- Smart redirection when disabled

### Results Summary
Sprint 6 successfully addressed all user-reported issues and implemented a comprehensive learning ecosystem that transforms the extension from a simple subtitle filter into a complete English learning platform.