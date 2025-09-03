# Vida Smart Coach - Testing Documentation

## Overview

This document provides comprehensive information about the testing infrastructure implemented for the Vida Smart Coach platform. The testing system covers frontend components, backend integration, AI coach functionality, WhatsApp webhook integration, gamification system, and end-to-end user journeys.

## Testing Stack

- **Test Runner**: Vitest (optimized for Vite projects)
- **Testing Library**: React Testing Library
- **Mocking**: MSW (Mock Service Worker) for API mocking
- **Environment**: jsdom for DOM simulation
- **Coverage**: Built-in Vitest coverage reporting

## Test Structure

```
src/test/
├── setup.js                     # Test environment setup
├── mocks/
│   ├── server.js                # MSW server setup
│   └── handlers.js              # API mock handlers
├── utils/
│   ├── test-utils.jsx           # Custom render utilities
│   └── database-helpers.js      # Database mock helpers
├── components/
│   ├── auth/                    # Authentication tests
│   ├── client/                  # Client component tests
│   └── admin/                   # Admin component tests
├── integration/
│   ├── gamification.test.js     # Gamification system tests
│   ├── whatsapp-webhook.test.js # WhatsApp integration tests
│   ├── daily-checkins.test.js   # Daily check-in tests
│   └── ai-coach.test.js         # AI coach integration tests
├── e2e/
│   └── user-journey.test.jsx    # End-to-end user flow tests
└── performance/
    └── load-testing.test.js     # Performance and load tests
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- gamification.test.js

# Run tests matching pattern
npm test -- --grep "authentication"
```

### Test Categories

#### 1. Component Tests
Tests individual React components in isolation:
- Authentication components (login, signup, profile)
- Client dashboard components (chat, check-ins, rewards)
- Admin components (AI config, user management)

#### 2. Integration Tests
Tests system integrations and business logic:
- **Gamification System**: Points calculation, level progression, badge awards, streak tracking
- **WhatsApp Webhook**: Message processing, AI response generation, Evolution API integration
- **Daily Check-ins**: Data validation, wellness score calculation, streak tracking
- **AI Coach**: OpenAI integration, conversation context, emergency detection

#### 3. End-to-End Tests
Tests complete user journeys:
- User registration and profile creation
- Login and dashboard access
- Daily check-in submission
- AI chat interactions
- Gamification point accumulation

#### 4. Performance Tests
Tests system performance and scalability:
- Concurrent user handling
- Large message volume processing
- Memory usage optimization
- API rate limiting
- Database connection pooling

## Test Data and Mocking

### Supabase Mocking
The test suite uses comprehensive mocking for Supabase operations:
- Authentication (signup, login, logout)
- Database operations (CRUD operations)
- Real-time subscriptions
- Row Level Security policies

### External API Mocking
Mock implementations for external services:
- **OpenAI API**: Mocked chat completions for AI coach responses
- **Evolution API**: Mocked WhatsApp message sending
- **Webhook endpoints**: Simulated webhook payloads

### Test Data Helpers
Utility functions for creating test data:
- `createTestUser()`: Creates mock user data
- `createTestProfile()`: Creates mock user profile
- `createTestGamification()`: Creates mock gamification data
- `createTestCheckIn()`: Creates mock daily check-in data
- `createTestConversation()`: Creates mock chat conversation

## Key Test Scenarios

### Authentication Flow
```javascript
// Test user signup
const response = await signUp('test@example.com', 'password123', {})
expect(response.user).toBeDefined()
expect(response.error).toBeNull()

// Test automatic profile creation
const profile = await fetchUserProfile(response.user.id)
expect(profile.role).toBe('client')
```

### Gamification System
```javascript
// Test points calculation
const basePoints = 10
const streakBonus = currentStreak * 2
const totalPoints = basePoints + streakBonus
expect(totalPoints).toBe(expectedPoints)

// Test level progression
const currentLevel = Math.floor(totalPoints / 100) + 1
expect(currentLevel).toBe(expectedLevel)
```

### WhatsApp Integration
```javascript
// Test message processing
const webhookPayload = {
  event: 'messages.upsert',
  data: {
    message: { conversation: 'Hello AI Coach!' },
    key: { fromMe: false }
  }
}
const processed = processWebhookMessage(webhookPayload)
expect(processed.messageContent).toBe('Hello AI Coach!')
```

### AI Coach Integration
```javascript
// Test AI response generation
const userMessage = 'How can I improve my diet?'
const aiResponse = await generateAIResponse(userMessage, userProfile)
expect(aiResponse).toContain('nutrition')
```

## Coverage Requirements

The test suite aims for comprehensive coverage:
- **Components**: >90% coverage for all React components
- **Business Logic**: 100% coverage for critical functions
- **Integration Points**: Complete coverage of external API interactions
- **User Flows**: Coverage of all major user journeys

## Continuous Integration

Tests are integrated into the CI/CD pipeline:
- All tests must pass before merging
- Coverage reports are generated for each PR
- Performance benchmarks are tracked
- Integration tests run against staging environment

## Best Practices

### Writing Tests
1. **Arrange, Act, Assert**: Structure tests clearly
2. **Descriptive Names**: Use clear, descriptive test names
3. **Single Responsibility**: Each test should verify one behavior
4. **Mock External Dependencies**: Isolate units under test
5. **Test Edge Cases**: Include error conditions and boundary cases

### Maintaining Tests
1. **Keep Tests Updated**: Update tests when functionality changes
2. **Refactor Test Code**: Apply same quality standards as production code
3. **Remove Obsolete Tests**: Clean up tests for removed features
4. **Document Complex Tests**: Add comments for complex test scenarios

### Performance Considerations
1. **Parallel Execution**: Tests run in parallel for speed
2. **Efficient Mocking**: Use lightweight mocks
3. **Cleanup**: Properly clean up test data and mocks
4. **Selective Running**: Run only relevant tests during development

## Troubleshooting

### Common Issues

#### Test Timeouts
```javascript
// Increase timeout for slow operations
it('should handle slow operation', async () => {
  // Test implementation
}, 10000) // 10 second timeout
```

#### Mock Issues
```javascript
// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
  resetMocks()
})
```

#### Environment Issues
```javascript
// Check test environment setup
expect(process.env.NODE_ENV).toBe('test')
```

### Debugging Tests
1. Use `console.log()` for debugging (remove before committing)
2. Use `screen.debug()` to inspect rendered DOM
3. Use `--reporter=verbose` for detailed test output
4. Use `--run` to disable watch mode for debugging

## Future Enhancements

### Planned Improvements
1. **Visual Regression Testing**: Screenshot comparison for UI components
2. **API Contract Testing**: Validate API responses against schemas
3. **Accessibility Testing**: Automated a11y testing
4. **Cross-browser Testing**: Test compatibility across browsers
5. **Mobile Testing**: Test responsive design and mobile interactions

### Monitoring and Metrics
1. **Test Execution Time**: Track and optimize slow tests
2. **Flaky Test Detection**: Identify and fix unreliable tests
3. **Coverage Trends**: Monitor coverage changes over time
4. **Test Quality Metrics**: Measure test effectiveness

## Contributing

When adding new features:
1. Write tests before implementing features (TDD)
2. Ensure all tests pass locally before pushing
3. Add integration tests for new external dependencies
4. Update this documentation for significant changes
5. Follow existing test patterns and conventions

For questions or issues with the testing infrastructure, please refer to the project maintainers or create an issue in the repository.
