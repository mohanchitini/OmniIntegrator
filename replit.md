# Trello ⇆ Zoho Cliq AI Integrator

## Overview

This is a full-stack integration system that connects Trello with Zoho Cliq, providing real-time bidirectional synchronization, AI-powered task insights, and a comprehensive dashboard. The system enables users to manage Trello cards directly from Zoho Cliq through bot commands, receive automated notifications, and gain AI-driven productivity analytics.

The platform consists of three main components:
1. **Backend Sync Server** - Node.js/Express API with real-time webhook handling
2. **AI Microservice** - Python FastAPI service for intelligent task analysis
3. **Zoho Cliq Extension** - Bot interface, slash commands, and dashboard widget

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture (Node.js + Express)

**Core Framework**: Express.js REST API with middleware-based request processing

**Database Layer**: 
- ORM: Prisma Client for type-safe database operations
- Storage: SQLite for development (designed to migrate to PostgreSQL for production)
- Schema includes: Users, TrelloTokens, CliqTokens, TrelloBoards, TrelloLists, TrelloCards, SyncLogs, and AIInsights

**Authentication & Authorization**:
- JWT-based token authentication for API endpoints
- OAuth 2.0 flow for both Trello and Zoho Cliq integrations
- Token storage with user association in database
- Auth middleware for protected routes (`/server/middleware/auth.js`)

**API Structure**:
- Modular route handlers organized by domain (auth, trello, cliq, sync)
- Controllers handle business logic separate from routing
- Services encapsulate external API interactions
- RESTful endpoints following `/api/{domain}/{action}` pattern

**Webhook Handling**:
- Trello webhook endpoint for real-time card updates
- Zoho Cliq webhook endpoints for bot messages and commands
- Signature verification for webhook security (HMAC-SHA256 for Cliq, SHA1 for Trello)

**Real-Time Sync Engine**:
- Bidirectional sync between Trello and database
- Cron-based scheduled synchronization using node-cron
- Event-driven updates via webhooks
- Sync status tracking and logging in database

**Error Handling & Logging**:
- Winston logger with file-based persistence (error.log, combined.log)
- Console logging for development environment
- Structured logging with timestamps and service metadata

### AI Microservice Architecture (Python + FastAPI)

**Framework**: FastAPI for async Python REST API

**AI Integration**:
- OpenAI API integration for natural language processing
- Conditional AI enablement based on API key availability
- Fallback mechanisms when AI is disabled

**Core AI Capabilities**:
1. Text summarization for card descriptions
2. Task extraction from natural language
3. Priority analysis based on card metadata
4. Productivity analytics across card collections

**API Design**:
- POST endpoints for AI operations (/summarize, /extract_tasks, /priority, /analytics)
- Request/response validation using Pydantic models
- CORS enabled for cross-origin requests from frontend

### Frontend Architecture (Zoho Cliq Extension)

**Extension Components**:
- Bot handler for conversational interactions
- Slash commands for direct actions (/trello connect, /trello boards, etc.)
- Dashboard widget with real-time data visualization

**Dashboard Widget**:
- Vanilla JavaScript SPA with fetch-based API communication
- Kanban-style board visualization
- Analytics cards showing task metrics
- Auto-refresh functionality for live updates
- CSS Grid and Flexbox for responsive layout

**Communication Pattern**:
- Widget communicates with backend via REST API
- Bot/commands trigger webhook callbacks to backend
- Backend sends proactive messages to Cliq using Cliq API

### Data Flow Architecture

**Trello → System**:
1. User authorizes Trello OAuth
2. Webhook registered for board/card events
3. Changes trigger webhook → backend processes → database update
4. Optional: AI analysis triggered for new/updated cards
5. Notification sent to Zoho Cliq

**Zoho Cliq → System**:
1. User sends bot message or slash command
2. Cliq triggers webhook to backend
3. Backend processes command, queries Trello API if needed
4. Response formatted and sent back to Cliq
5. Database updated if state changes

**Scheduled Sync**:
1. Cron job triggers periodic full sync
2. Backend fetches all boards/lists/cards from Trello
3. Database updated with latest state
4. Sync logs created for audit trail

### Security Architecture

**Token Management**:
- OAuth tokens stored encrypted in database
- Separate token records for Trello and Cliq per user
- JWT secrets for API authentication

**Webhook Security**:
- HMAC signature verification for Zoho Cliq webhooks
- SHA1 hash verification for Trello webhooks
- Utility functions in `/server/utils/verifySignature.js`

**API Security**:
- Bearer token authentication on protected endpoints
- CORS middleware for cross-origin request control
- Environment variable management for secrets

**Production Readiness Notes**:
- Current implementation lacks CSRF/state validation in OAuth flows
- Rate limiting not implemented
- Token rotation mechanisms not present
- These should be added before production deployment

## External Dependencies

### Third-Party APIs

**Trello API** (https://api.trello.com/1):
- Authentication: OAuth 1.0a with API key + token
- Used for: Board/list/card operations, webhook registration
- Rate limits: 300 requests per 10 seconds per token
- Integration: `/server/services/trelloService.js`

**Zoho Cliq API** (https://cliq.zoho.com/api/v2):
- Authentication: OAuth 2.0 with access tokens
- Used for: Sending messages, bot interactions, user data
- Integration: `/server/services/cliqService.js`

**OpenAI API**:
- Authentication: API key (sk-* format)
- Used for: Text summarization, task extraction, priority analysis
- Conditional usage based on API key presence
- Integration: `/ai-service/main.py`

### Node.js Dependencies

**Core Framework**:
- `express` - Web application framework
- `cors` - Cross-origin resource sharing
- `body-parser` - Request body parsing middleware

**Database & ORM**:
- `@prisma/client` - Prisma ORM client
- `prisma` - Prisma CLI (dev dependency)

**Authentication & Security**:
- `jsonwebtoken` - JWT token generation/verification
- `crypto` - Native Node.js crypto for signature verification

**HTTP Client**:
- `axios` - Promise-based HTTP client for external API calls

**Utilities**:
- `dotenv` - Environment variable management
- `winston` - Logging framework
- `node-cron` - Cron job scheduler
- `nodemon` - Development auto-restart (dev dependency)

### Python Dependencies

**Framework**:
- `fastapi` - Modern Python web framework
- `uvicorn` - ASGI server
- `pydantic` - Data validation using Python type hints

**AI/ML**:
- `openai` - Official OpenAI Python client

**Utilities**:
- `python-dotenv` - Environment variable loading
- `httpx` - Async HTTP client

### Database

**Development**: SQLite (file-based, no external service)
**Production Recommendation**: PostgreSQL (requires migration)

Prisma schema supports both, configured via DATABASE_URL environment variable.

### Environment Configuration

Required environment variables:
- `TRELLO_CLIENT_ID` - Trello API key
- `TRELLO_CALLBACK_URL` - OAuth callback URL
- `ZOHO_CLIQ_CLIENT_ID` - Cliq OAuth client ID
- `ZOHO_CLIQ_CLIENT_SECRET` - Cliq OAuth secret
- `ZOHO_CLIQ_REDIRECT_URI` - Cliq OAuth callback
- `JWT_SECRET` - Secret for JWT signing
- `AI_API_KEY` - OpenAI API key (optional)
- `AI_SERVICE_URL` - Python AI service endpoint
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - Database connection string