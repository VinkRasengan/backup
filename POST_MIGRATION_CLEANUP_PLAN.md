# Post-Migration Cleanup Plan

## Overview
After the monolith to microservices migration, several areas need cleanup:
1. Remove mock data services from client
2. Clean up duplicated authentication middleware across services
3. Remove mock API fallbacks and unused code
4. Update import statements and references
5. Clean up development/testing artifacts

## 🎯 Phase 1: Mock Data Services Removal

### Files to Remove:
- `client/src/services/mockAPI.js` - Complete mock API service
- `client/src/services/mockPostsService.js` - Mock posts data service
- `client/src/services/mockCommentsService.js` - Mock comments service
- `client/src/utils/seedFirestore.js` - Client-side Firestore seeding

### Files to Update:
- Remove mock service imports from components
- Remove mock fallback logic from API services
- Update error handling to use proper microservice endpoints

## 🎯 Phase 2: Duplicated Middleware Cleanup

### Duplicated AuthMiddleware locations:
- `shared/middleware/auth.js` (main version)
- `services/*/shared/middleware/auth.js` (8 duplicates)

### Action:
- Keep the main shared version
- Remove duplicates from individual services
- Update import paths to use shared version

## 🎯 Phase 3: Development Artifacts Cleanup

### Scripts to Review:
- `scripts/firebase/init-firestore.js` - Development seeding
- `scripts/firebase/seed-firestore-data.js` - Sample data creation
- `scripts/add-sample-posts.js` - Test data scripts
- `scripts/seed-database.js` - Database seeding

### Action:
- Keep essential migration scripts
- Remove development-only seeding scripts
- Update documentation

## 🎯 Phase 4: API Service Cleanup

### Files to Update:
- Remove mock fallback patterns
- Clean up unused imports
- Update error handling for microservices
- Remove development-mode conditionals

## 🚀 Execution Priority

### High Priority (Start Immediately):
1. Remove mock services from client
2. Update component imports
3. Remove mock fallbacks from API calls

### Medium Priority (After client cleanup):
1. Clean up duplicated middleware
2. Remove development artifacts
3. Update documentation

### Low Priority (Ongoing):
1. Code optimization
2. Performance improvements
3. Additional refactoring

## ⚠️ Cautions

1. **Test thoroughly** after each cleanup phase
2. **Backup critical files** before major changes
3. **Update tests** to reflect API changes
4. **Verify microservice endpoints** are working
5. **Check production builds** after cleanup

## 📝 Progress Tracking

- [ ] Phase 1: Mock Data Services Removal
- [ ] Phase 2: Duplicated Middleware Cleanup  
- [ ] Phase 3: Development Artifacts Cleanup
- [ ] Phase 4: API Service Cleanup
- [ ] Final testing and verification
