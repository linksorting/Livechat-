# LiveChat Pro Backend

Production-style Node.js + Express + MongoDB backend for **LiveChat Pro**, a premium real-time customer support SaaS inspired by modern inbox tools.

## Stack

- Node.js + Express
- MongoDB + Mongoose
- Socket.IO for live events
- JWT authentication
- Multer for local file uploads

## What is included

- Secure auth with roles: Owner, Admin, Support Agent, Viewer
- Real-time inbox APIs for conversations and messages
- Public website widget APIs
- Visitor tracking and contact CRM-lite
- Team management, invites, presence, permissions
- Automation rules + simple chatbot flow schema
- Analytics, dashboard overview, recent activity
- Notification center
- Settings for widget, workspace, routing, business hours, branding
- Demo seed with realistic users, visitors, chats, replies, analytics-ready data

## Demo credentials after seeding

- Owner: `owner@livechatpro.demo`
- Admin: `admin@livechatpro.demo`
- Agent: `sophia@livechatpro.demo`
- Password: `Password123!`

## Setup

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

## Main API prefix

`/api/v1`

## Notable routes

### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Dashboard
- `GET /api/v1/dashboard/overview`

### Conversations
- `GET /api/v1/conversations`
- `GET /api/v1/conversations/:id`
- `POST /api/v1/conversations/:id/messages`
- `POST /api/v1/conversations/:id/notes`
- `PATCH /api/v1/conversations/:id/assign`
- `PATCH /api/v1/conversations/:id/status`
- `PATCH /api/v1/conversations/:id/meta`
- `POST /api/v1/conversations/:id/csat`

### Visitors / Contacts
- `GET /api/v1/visitors`
- `GET /api/v1/contacts`
- `POST /api/v1/contacts/merge`
- `GET /api/v1/contacts/export/csv`

### Settings / Team / Automation
- `GET /api/v1/settings/workspace`
- `GET /api/v1/team`
- `GET /api/v1/automation`

### Public widget
- `GET /api/v1/public/widget/:workspaceSlug/config`
- `POST /api/v1/public/widget/session`
- `POST /api/v1/public/widget/conversations/:conversationId/messages`
- `POST /api/v1/public/widget/track`

## Socket events

The backend emits and listens to:

- `conversation:joined`
- `conversation:typing`
- `conversation:read`
- `conversation:message:new`
- `conversation:updated`
- `notification:new`
- `visitor:activity`
- `agent:presence`

Recommended handshake auth:
- agents: `token`
- widget visitors: `visitorToken`, `workspaceId`

## Folder structure

```text
src/
  config/
  constants/
  controllers/
  middleware/
  models/
  realtime/
  routes/
  seeds/
  services/
  utils/
```

## Notes

- File uploads are stored locally under `/uploads`.
- Team invitation email sending is stubbed as a backend-ready placeholder.
- Chatbot flow builder is stored as structured JSON and can be connected to a frontend visual builder later.
- This backend is intentionally frontend-friendly and seeded to support polished demos right away.
