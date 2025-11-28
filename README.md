# 🚀 AI-Powered Trello ⇆ Zoho Cliq Omni-Integrator

> **Full-stack integration system with real-time sync, AI-powered insights, and comprehensive dashboard**

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Zoho Cliq Extension](#zoho-cliq-extension)
- [Usage](#usage)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This is a **fully functional MVP** multi-module system that integrates Trello with Zoho Cliq, featuring:

- **Backend Sync Server**: Node.js + Express + Prisma + SQLite
- **AI Microservice**: Python FastAPI with OpenAI integration
- **Zoho Cliq Extension**: Bot + Commands + Dashboard Widget
- **Real-time Sync Engine**: Bidirectional data synchronization
- **AI-Powered Insights**: Task summarization, priority analysis, and productivity metrics

### ⚠️ Production Deployment Considerations

This system is a **working MVP foundation**. Before deploying to production, consider implementing:

- **Enhanced OAuth Security**: Add CSRF/state parameter validation for OAuth flows
- **Webhook Signature Verification**: Strengthen webhook signature verification for all incoming webhooks
- **Rate Limiting**: Implement API rate limiting to prevent abuse
- **Environment-Specific Configuration**: Separate dev/staging/production configurations
- **Error Monitoring**: Add comprehensive error tracking (e.g., Sentry)
- **Database Migration Strategy**: For production, consider PostgreSQL instead of SQLite
- **Token Rotation**: Implement automatic token refresh mechanisms
- **Comprehensive Testing**: Add unit tests, integration tests, and end-to-end tests

The current implementation provides a solid foundation with all core features working and can be used for development, testing, and demonstration purposes.

## ✨ Features

### 🔄 Real-Time Synchronization
- Automatic sync between Trello boards and Zoho Cliq
- Webhook-based updates
- Scheduled background sync every 5 minutes
- Comprehensive sync logging

### 🤖 AI-Powered Insights
- **Task Summarization**: AI-generated summaries for cards
- **Priority Analysis**: Automatic priority classification (High/Medium/Low)
- **Task Extraction**: Extract actionable tasks from text
- **Productivity Analytics**: Completion rates, urgent tasks, and trends

### 💬 Zoho Cliq Integration
- **Slash Commands**:
  - `/trello connect` - Connect Trello account
  - `/trello boards` - List all boards
  - `/trello create_card` - Create new cards
  - `/trello mytasks` - View active tasks
  - `/trello summary` - Get AI-powered summary
- **Interactive Dashboard Widget**:
  - Kanban board visualization
  - Real-time updates every 20 seconds
  - Priority heatmaps
  - Productivity scores

### 🔐 Authentication & Security
- OAuth 2.0 for Trello
- OAuth 2.0 for Zoho Cliq
- JWT-based session management
- Webhook signature verification
- Secure secret management

## 🏗️ Architecture

\`\`\`mermaid
graph TB
    subgraph "Frontend Layer"
        A[Zoho Cliq Extension]
        B[Dashboard Widget]
    end
    
    subgraph "Backend Layer"
        C[Express Server]
        D[Prisma ORM]
        E[SQLite Database]
    end
    
    subgraph "AI Layer"
        F[FastAPI Service]
        G[OpenAI API]
    end
    
    subgraph "External Services"
        H[Trello API]
        I[Zoho Cliq API]
    end
    
    A --> C
    B --> C
    C --> D
    D --> E
    C --> F
    F --> G
    C --> H
    C --> I
    
    H -.Webhooks.-> C
    I -.Commands.-> C
\`\`\`

## 📁 Project Structure

\`\`\`
.
├── server/                      # Backend Server (Node.js)
│   ├── app.js                  # Main application entry
│   ├── routes/                 # API route definitions
│   │   ├── auth.js            # Authentication routes
│   │   ├── trello.js          # Trello API routes
│   │   ├── cliq.js            # Zoho Cliq routes
│   │   └── sync.js            # Sync management routes
│   ├── controllers/            # Business logic controllers
│   │   ├── authController.js
│   │   ├── trelloController.js
│   │   ├── cliqController.js
│   │   └── aiController.js
│   ├── services/              # Service layer
│   │   ├── trelloService.js   # Trello API integration
│   │   ├── cliqService.js     # Zoho Cliq integration
│   │   ├── aiService.js       # AI service client
│   │   └── syncService.js     # Sync orchestration
│   ├── middleware/            # Express middleware
│   │   └── auth.js           # JWT authentication
│   ├── utils/                # Utility functions
│   │   ├── logger.js         # Winston logger
│   │   └── verifySignature.js # Webhook verification
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   └── package.json
│
├── ai-service/                 # AI Microservice (Python)
│   ├── main.py                # FastAPI application
│   └── requirements.txt
│
├── cliq-extension/            # Zoho Cliq Extension
│   ├── manifest.json         # Extension manifest
│   ├── bot/
│   │   └── bot.js           # Bot logic
│   ├── commands/            # Slash command handlers
│   │   ├── trello_connect.js
│   │   ├── trello_boards.js
│   │   ├── trello_create_card.js
│   │   ├── trello_mytasks.js
│   │   └── trello_summary.js
│   └── widgets/
│       └── dashboard/       # Dashboard widget
│           ├── index.html
│           ├── style.css
│           └── app.js
│
└── README.md
\`\`\`

## 🚀 Installation

### Prerequisites

- Node.js 20.x or higher
- Python 3.11 or higher
- npm or yarn
- Trello API credentials
- Zoho Cliq account with developer access
- OpenAI API key (optional, for AI features)

### Step 1: Clone and Install

\`\`\`bash
# Install backend dependencies
cd server
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Install AI service dependencies
cd ../ai-service
pip install -r requirements.txt
\`\`\`

### Step 2: Configure Environment Variables

Create environment variables (see Configuration section below):

\`\`\`bash
# Copy example and edit
cp .env.example .env
\`\`\`

### Step 3: Start Services

\`\`\`bash
# Terminal 1: Start backend server
cd server
npm start

# Terminal 2: Start AI microservice
cd ai-service
python main.py
\`\`\`

The services will be available at:
- Backend API: http://localhost:3000
- AI Service: http://localhost:8000

## ⚙️ Configuration

### Required Environment Variables

#### Backend Server (.env)

\`\`\`env
# Trello OAuth
TRELLO_CLIENT_ID=your_trello_client_id
TRELLO_CLIENT_SECRET=your_trello_client_secret
TRELLO_REDIRECT_URL=http://localhost:3000/api/auth/trello/callback

# Zoho Cliq OAuth
CLIQ_CLIENT_ID=your_cliq_client_id
CLIQ_CLIENT_SECRET=your_cliq_client_secret
CLIQ_REDIRECT_URL=http://localhost:3000/api/auth/cliq/callback
CLIQ_BOT_SECRET=your_cliq_bot_secret

# AI Service
AI_API_KEY=your_openai_api_key
AI_SERVICE_URL=http://localhost:8000

# Database
DATABASE_URL="file:./dev.db"

# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Security (Change in production!)
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
\`\`\`

### Setting Up Trello OAuth

1. Go to [Trello Power-Ups Admin](https://trello.com/power-ups/admin)
2. Create a new Power-Up
3. Get your API Key and Token
4. Set the redirect URL to match your environment

### Setting Up Zoho Cliq

1. Go to [Zoho Cliq Developer Console](https://cliq.zoho.com/company/bots)
2. Create a new extension
3. Configure OAuth scopes:
   - `ZohoCliq.Webhooks.CREATE`
   - `ZohoCliq.Bots.READ`
   - `ZohoCliq.Messages.CREATE`
4. Upload the extension from \`cliq-extension/\` folder
5. Install the extension to your Zoho Cliq workspace

### Getting OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Go to API Keys section
4. Create a new secret key
5. Add to \`AI_API_KEY\` environment variable

**Note**: The AI service works without OpenAI (using rule-based fallbacks), but AI features are limited.

## 📚 API Documentation

### Authentication Endpoints

#### Get Trello Auth URL
\`\`\`http
GET /api/auth/trello
\`\`\`

#### Trello Callback
\`\`\`http
POST /api/auth/trello/callback
Content-Type: application/json

{
  "token": "trello_access_token",
  "userId": "optional_user_id"
}
\`\`\`

#### Get Cliq Auth URL
\`\`\`http
GET /api/auth/cliq
\`\`\`

#### Cliq Callback
\`\`\`http
POST /api/auth/cliq/callback
Content-Type: application/json

{
  "code": "authorization_code",
  "userId": "optional_user_id"
}
\`\`\`

### Trello Endpoints

All Trello endpoints require JWT authentication via \`Authorization: Bearer <token>\` header.

#### Get Boards
\`\`\`http
GET /api/trello/boards
Authorization: Bearer <jwt_token>
\`\`\`

#### Get Lists
\`\`\`http
GET /api/trello/lists/:boardId
Authorization: Bearer <jwt_token>
\`\`\`

#### Get Cards
\`\`\`http
GET /api/trello/cards/:listId
Authorization: Bearer <jwt_token>
\`\`\`

#### Create Card
\`\`\`http
POST /api/trello/create_card
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "listId": "trello_list_id",
  "name": "Card Title",
  "description": "Card description",
  "dueDate": "2024-12-31"
}
\`\`\`

#### Sync Trello
\`\`\`http
POST /api/trello/sync
Authorization: Bearer <jwt_token>
\`\`\`

#### Get Dashboard Data
\`\`\`http
GET /api/trello/dashboard/:boardId
Authorization: Bearer <jwt_token>
\`\`\`

### Sync Endpoints

#### Start Sync
\`\`\`http
POST /api/sync/start
Authorization: Bearer <jwt_token>
\`\`\`

#### Get Sync Logs
\`\`\`http
GET /api/sync/logs?limit=50
Authorization: Bearer <jwt_token>
\`\`\`

#### Get Sync Status
\`\`\`http
GET /api/sync/status
Authorization: Bearer <jwt_token>
\`\`\`

### AI Service Endpoints

#### Summarize Text
\`\`\`http
POST http://localhost:8000/summarize
Content-Type: application/json

{
  "text": "Long text to summarize"
}
\`\`\`

#### Extract Tasks
\`\`\`http
POST http://localhost:8000/extract_tasks
Content-Type: application/json

{
  "text": "Text containing tasks"
}
\`\`\`

#### Analyze Priority
\`\`\`http
POST http://localhost:8000/priority
Content-Type: application/json

{
  "card": {
    "name": "Card title",
    "description": "Card description",
    "dueDate": "2024-12-31"
  }
}
\`\`\`

#### Generate Analytics
\`\`\`http
POST http://localhost:8000/analytics
Content-Type: application/json

{
  "cards": [
    {
      "id": "card1",
      "name": "Card 1",
      "closed": false
    }
  ]
}
\`\`\`

## 🎮 Zoho Cliq Extension

### Installation

1. Package the \`cliq-extension/\` folder as a ZIP file
2. Go to Zoho Cliq → Apps → Extensions
3. Click "Upload Extension"
4. Upload the ZIP file
5. Configure webhook URLs to point to your server
6. Install the extension to your workspace

### Available Commands

#### Connect Trello Account
\`\`\`
/trello connect
\`\`\`

#### List Trello Boards
\`\`\`
/trello boards
\`\`\`

#### Create New Card
\`\`\`
/trello create_card <list_id> <card_name>
\`\`\`

#### View My Tasks
\`\`\`
/trello mytasks
\`\`\`

#### Get AI Summary
\`\`\`
/trello summary
\`\`\`

### Dashboard Widget

The dashboard widget provides:

- **Kanban Board View**: Visual representation of your Trello boards
- **Real-time Updates**: Auto-refreshes every 20 seconds
- **AI Insights**:
  - Priority Heatmap
  - Productivity Score
  - Task Analytics
- **Quick Actions**: Click cards to open in Trello

## 💻 Development

### Running in Development Mode

\`\`\`bash
# Backend with auto-reload
cd server
npm run dev

# AI service with auto-reload
cd ai-service
uvicorn main:app --reload --port 8000
\`\`\`

### Database Management

\`\`\`bash
# Generate Prisma client after schema changes
npx prisma generate

# Create new migration
npx prisma migrate dev --name migration_name

# Open Prisma Studio (GUI for database)
npx prisma studio
\`\`\`

### Testing Webhooks Locally

Use [ngrok](https://ngrok.com/) to expose your local server:

\`\`\`bash
ngrok http 3000
\`\`\`

Update webhook URLs in:
- Trello webhook configuration
- Zoho Cliq extension manifest

## 🐛 Troubleshooting

### Backend Issues

**Issue**: Database connection errors
\`\`\`bash
# Solution: Reset database
cd server
rm dev.db
npx prisma migrate dev --name init
\`\`\`

**Issue**: Port already in use
\`\`\`bash
# Solution: Change port in environment variables
export PORT=3001
\`\`\`

### AI Service Issues

**Issue**: OpenAI API errors
\`\`\`bash
# Solution: Verify API key and check OpenAI status
# The service will fall back to rule-based methods
\`\`\`

**Issue**: Import errors in Python
\`\`\`bash
# Solution: Reinstall dependencies
cd ai-service
pip install -r requirements.txt --force-reinstall
\`\`\`

### Sync Issues

**Issue**: Sync not working
\`\`\`bash
# Solution: Check sync logs
GET /api/sync/logs

# Manually trigger sync
POST /api/sync/start
\`\`\`

### Zoho Cliq Extension Issues

**Issue**: Commands not responding
- Verify webhook URLs are accessible
- Check Zoho Cliq extension logs
- Ensure bot is properly installed

**Issue**: Dashboard not loading
- Check browser console for errors
- Verify API endpoints are accessible
- Check CORS configuration

## 📝 Database Schema

### Core Models

- **User**: User accounts and authentication
- **TrelloToken**: Trello OAuth tokens
- **CliqToken**: Zoho Cliq OAuth tokens
- **TrelloBoard**: Synced Trello boards
- **TrelloList**: Lists within boards
- **TrelloCard**: Individual cards
- **AIInsights**: AI-generated insights for cards
- **SyncLog**: Synchronization activity logs

## 🔐 Security Best Practices

1. **Never commit secrets**: Use environment variables
2. **Rotate tokens regularly**: Implement token refresh
3. **Verify webhooks**: Always verify signatures
4. **Use HTTPS in production**: Enable SSL/TLS
5. **Implement rate limiting**: Protect against abuse
6. **Audit logs**: Monitor sync and API activity

## 🚢 Deployment

### Production Checklist

- [ ] Update all environment variables
- [ ] Change JWT_SECRET and SESSION_SECRET
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Configure proper logging
- [ ] Set up monitoring
- [ ] Configure backup strategy for database
- [ ] Enable rate limiting
- [ ] Update CORS settings
- [ ] Configure proper error handling

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting section

---

**Built with ❤️ using Node.js, Python, Express, FastAPI, Prisma, and OpenAI**
