# ASG Nexus — Project TODO

## Phase 2: Database Schema & Architecture
- [x] Design and push full database schema (personas, memories, messages, posts, comments, etc.)

## Phase 3: Backend Core
- [x] AI persona CRUD routes (create, read, update, delete)
- [x] Knowledge import & chunking (text/document upload → memory store)
- [x] Long-term memory system (semantic search via cosine similarity)
- [x] Multi-turn conversation with memory injection
- [x] End-to-end encrypted chat (key exchange + message encryption)
- [x] Chat message routes (user↔persona, persona↔persona, user↔user)

## Phase 4: Backend Features
- [x] Moments/feed post CRUD routes
- [x] AI auto-comment engine (persona scans feed and generates comments)
- [x] Feedback loop: comments/posts → persona memory alignment
- [x] ASG security firewall integration (prompt screening)
- [x] Persona social graph data API

## Phase 5: Frontend Core
- [x] Global design system (dark elegant theme, typography, color palette)
- [x] Landing page with hero, features, CTA
- [x] Navigation layout (sidebar + top bar)
- [x] Persona management page (create, edit, list, delete)
- [x] Knowledge import UI (file upload, text paste)
- [x] Persona detail page (stats, memory viewer, alignment score)

## Phase 6: Frontend Features
- [x] Chat interface (encrypted messaging, real-time feel)
- [x] Moments feed page (post creation, timeline, reactions)
- [x] AI auto-comment display and controls
- [x] Social graph visualization (force-directed canvas graph)
- [x] Memory alignment dashboard

## Phase 7: Polish & Testing
- [x] Vitest unit tests (security firewall, encryption, auth)
- [x] Loading states, empty states, error handling
- [x] Responsive design polish
- [x] Save checkpoint

## Phase 8: GitHub
- [x] Create new GitHub repository (asg-nexus)
- [x] Push full project code
- [x] Write comprehensive README.md with deployment docs

## i18n & Public Release
- [x] Create i18n context with language toggle (zh/en)
- [x] Create zh and en locale files (full coverage)
- [x] Integrate i18n into AppLayout (language switcher button)
- [x] Integrate i18n into Home page
- [x] Integrate i18n into Personas page
- [x] Integrate i18n into PersonaDetail page
- [x] Integrate i18n into Chat page
- [x] Integrate i18n into Feed page
- [x] Integrate i18n into Graph page
- [x] Make GitHub repository public
- [x] Push i18n changes to GitHub

## v1.1.0 Features
- [x] Socket.io WebSocket server integration (server-side)
- [x] Real-time chat message delivery via WebSocket
- [x] Live AI persona typing indicators
- [x] User profile page (avatar upload, bio, alignment history)
- [x] Avatar upload to S3 storage
- [x] Persona marketplace / discovery page
- [x] Follow/unfollow persona functionality
- [x] Marketplace search and filter
- [x] World-class English README (badges, architecture diagram, feature showcase)
- [x] Update all inline docs and commit messages to English
- [x] Full bug testing and fixes
- [x] Tag v1.1.0 and push to GitHub
