# 14Dev — LeetCode-Style Coding Platform

A full-stack coding practice platform with online code execution (Judge0), AI-powered tutoring (Google Gemini), video editorials (Cloudinary), discussions, achievements, leaderboards, and a LeetCode-inspired problem-solving interface.

---

## Project Overview

14Dev is a production-ready DSA (Data Structures & Algorithms) practice platform inspired by LeetCode. Users can browse coding problems, write solutions in JavaScript/Java/C++ in an in-browser Monaco editor, run their code against visible test cases, submit against hidden test cases (judged by Judge0), track their submission history, chat with an AI tutor, watch video editorials, participate in discussions, earn achievement badges, and compete on a global leaderboard.

The platform supports both email/password and Google OAuth authentication, with a polished dark-themed UI, resizable panels, keyboard shortcuts, and code autosave.

---

## Features

### Core
- **Online code execution** via Judge0 (JavaScript, Java, C++)
- **Monaco editor** with syntax highlighting, autocomplete, and custom dark theme
- **Run & Submit** against visible/hidden test cases
- **Submission history** with runtime, memory, and status tracking
- **AI chat tutor** powered by Google Gemini (DSA-focused system prompt)

### Authentication
- Email/password registration & login (bcrypt + JWT)
- Google OAuth 2.0 (Authorization Code flow, no passport dependency)
- JWT blocklist via Redis (token invalidation on logout)
- Role-based access control (user / admin)

### Problem Page (LeetCode-style)
- Resizable split panels (react-resizable-panels)
- Fullscreen editor toggle
- Keyboard shortcuts (Ctrl+Enter submit, Ctrl+Shift+Enter run, Alt+F fullscreen, Alt+S save, Alt+1-5 tabs)
- Code autosave to localStorage (per problem + language)
- Mobile-responsive stacked layout
- Framer Motion tab transitions

### User Engagement
- **Bookmark & Favorite** problems
- **Personal notes** per problem (CRUD)
- **Recently viewed** tracking (capped at 20)
- **Related problems** (same tag)
- **Discussions** with comments and upvotes (per problem, supports editorial-type)

### Gamification
- **15 achievement badges** across 4 categories (solved, difficulty, streak, special)
- **4 tiers** (bronze, silver, gold, platinum)
- **Streak milestones** (3, 7, 30, 100 days)
- **Global leaderboard** ranked by total solved
- **Activity graph** (GitHub-style heatmap, 90-day)

### Profile & Dashboard
- Full profile page with stats, activity graph, achievements, bookmarks, favorites, recently viewed
- Dashboard with daily challenge, recommended problems, recent submissions, upcoming contests
- Paginated global submission history

### Admin
- Create / update / delete problems (with reference solution validation via Judge0)
- Upload / delete video editorials (Cloudinary signed uploads)

### Security
- Helmet (HSTS, CSP, X-Frame-Options, etc.)
- Rate limiting (auth, OAuth, AI chat endpoints)
- Centralized error handler (production-safe error messages)
- Mass-assignment protection (field whitelisting)
- Reference solution gating (hidden until accepted submission)
- Admin role validated from DB, not stale JWT
- OAuth open-redirect prevention (env-var-only redirect URIs)
- Trust proxy configured for correct client IP detection behind reverse proxies

### Performance
- Route-level code splitting (React.lazy + Suspense) — 321 KB initial bundle
- Monaco editor loaded on-demand (only when visiting a problem)
- Memoization (useMemo/useCallback) on hot paths
- Axios 401 interceptor (auto-logout on expired JWT)
- Race-condition-safe data fetching (cancellation flags in useEffect)

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite 6 | Build tool & dev server |
| Redux Toolkit + React-Redux | State management (auth slice) |
| React Router 7 | Client-side routing |
| Tailwind CSS 4 + daisyUI 5 | Styling |
| @monaco-editor/react | In-browser code editor |
| react-hook-form + zod | Form validation |
| framer-motion | Animations |
| react-resizable-panels | Resizable split layout |
| lucide-react | Icons |
| axios | HTTP client |

### Backend
| Technology | Purpose |
|---|---|
| Express 5 | Web framework |
| Mongoose 8 | MongoDB ODM |
| Redis 5 | JWT token blocklist |
| jsonwebtoken | JWT auth |
| bcrypt | Password hashing |
| @google/genai | AI chat (Gemini 1.5 Flash) |
| cloudinary | Video editorial uploads |
| axios | Judge0 API client |
| helmet | HTTP security headers |
| express-rate-limit | Rate limiting |
| validator | Email/password validation |
| cookie-parser | Cookie parsing |
| dotenv | Environment variable loading |

### External Services
- **MongoDB Atlas** — primary database
- **Redis Cloud** — token blocklist
- **Judge0 CE (RapidAPI)** — code execution
- **Google Gemini API** — AI tutor
- **Cloudinary** — video hosting
- **Google OAuth 2.0** — social authentication

---

## Architecture

```
┌─────────────┐     ┌──────────────────────────────────────────────┐     ┌──────────────┐
│  Browser    │────▶│  Frontend (Vite + React)                     │────▶│  Backend     │
│  (SPA)      │◀────│  - React.lazy code splitting                 │◀────│  (Express)   │
└─────────────┘     │  - Redux (auth slice)                        │     └──────┬───────┘
                    │  - Axios client (401 interceptor)            │            │
                    │  - Monaco editor (on-demand)                 │            ├──────▶ MongoDB
                    └──────────────────────────────────────────────┘            ├──────▶ Redis
                                                                              ├──────▶ Judge0 API
                                                                              ├──────▶ Gemini API
                                                                              └──────▶ Cloudinary
```

### Request Flow
1. Browser loads the SPA (single HTML + JS chunks via React.lazy)
2. `checkAuth` thunk calls `GET /user/check` — if JWT cookie is valid, Redux hydrates
3. User navigates — lazy-loaded chunks fetch on first visit
4. API calls go through `axiosClient` (with 401 interceptor → auto-logout)
5. Code submissions go to `POST /submission/submit/:id` → backend calls Judge0 → stores result
6. JWT cookie is httpOnly, SameSite-configurable, blocklisted on logout via Redis

---

## Folder Structure

```
14Dev/
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── index.js                 # Express app entry point
│       ├── config/
│       │   ├── db.js                # MongoDB connection
│       │   ├── redis.js             # Redis client
│       │   └── cookieConfig.js      # Centralized cookie options
│       ├── middleware/
│       │   ├── userMiddleware.js    # JWT auth verification
│       │   ├── adminMiddleware.js   # Admin role check (from DB)
│       │   ├── rateLimiters.js      # Auth/OAuth/AI rate limiters
│       │   └── errorHandler.js      # Centralized error handler + asyncHandler
│       ├── models/
│       │   ├── user.js              # User (with problemSolved, bookmarks, favorites, recentlyViewed)
│       │   ├── problem.js           # Problem (test cases, startCode, referenceSolution)
│       │   ├── submission.js        # Submission (status, runtime, memory)
│       │   ├── solutionVideo.js     # Video editorial metadata
│       │   ├── userNote.js          # Per-user per-problem notes
│       │   ├── userBadge.js         # Awarded badge records
│       │   ├── badge.js             # Badge definitions (reserved)
│       │   └── discussion.js        # Discussions + embedded comments
│       ├── controllers/
│       │   ├── userAuthent.js       # Register, login, logout, adminRegister
│       │   ├── googleAuth.js        # Google OAuth Authorization Code flow
│       │   ├── userProblem.js       # Problem CRUD + getProblemById
│       │   ├── userSubmission.js    # Run & submit code (Judge0)
│       │   ├── userProfile.js       # Profile stats + dashboard
│       │   ├── userEngagement.js    # Bookmarks, favorites, notes, recently viewed
│       │   ├── achievements.js      # Badge definitions + awarding + leaderboard
│       │   ├── discussion.js        # Discussion CRUD + comments + upvotes
│       │   ├── solveDoubt.js        # AI chat (Gemini)
│       │   └── videoSection.js      # Cloudinary video upload/delete
│       ├── routes/
│       │   ├── userAuth.js          # /user (auth + profile + dashboard + achievements + leaderboard)
│       │   ├── googleAuth.js        # /user/auth/google + callback
│       │   ├── userEngagement.js    # /user/bookmarks, /favorites, /recentlyViewed, /notes
│       │   ├── problemCreator.js    # /problem (CRUD + list + solved)
│       │   ├── submit.js            # /submission (run + submit)
│       │   ├── aiChatting.js        # /ai/chat
│       │   ├── videoCreator.js      # /video (Cloudinary)
│       │   └── discussion.js        # /discussion (CRUD + comments + upvotes)
│       └── utils/
│           ├── validator.js         # Email/password validation
│           └── problemUtility.js    # Judge0 batch submit/poll (with 60s timeout)
│
├── frontend/
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json                  # SPA fallback
│   └── src/
│       ├── main.jsx                 # App entry (Provider + BrowserRouter)
│       ├── App.jsx                  # Routes (React.lazy + Suspense + ErrorBoundary)
│       ├── authSlice.js             # Redux auth slice (register, login, checkAuth, logout)
│       ├── store/
│       │   └── store.js             # configureStore + axios injectStore
│       ├── utils/
│       │   └── axiosClient.js       # Axios instance + 401 interceptor
│       ├── pages/
│       │   ├── Login.jsx            # Email/password + Google OAuth button
│       │   ├── Signup.jsx           # Registration + Google OAuth button
│       │   ├── Homepage.jsx         # Problem list with filters
│       │   ├── ProblemPage.jsx      # LeetCode-style problem solver
│       │   ├── Profile.jsx          # User profile + achievements + activity graph
│       │   ├── Dashboard.jsx        # Daily challenge + stats + recommended
│       │   ├── Leaderboard.jsx      # Global rankings
│       │   └── Admin.jsx            # Admin panel menu
│       ├── components/
│       │   ├── AdminPanel.jsx       # Create problem form
│       │   ├── AdminDelete.jsx      # Delete problem list
│       │   ├── AdminVideo.jsx       # Video upload/delete list
│       │   ├── AdminUpload.jsx      # Cloudinary video uploader
│       │   ├── SubmissionHistory.jsx # Per-problem submission list
│       │   ├── ChatAi.jsx           # AI chat interface
│       │   ├── Editorial.jsx        # Video player
│       │   ├── ActivityGraph.jsx    # GitHub-style heatmap
│       │   ├── Notes.jsx            # Per-problem notes CRUD
│       │   └── Discussions.jsx      # Discussion list + detail + create
│       └── index.css                # Tailwind + daisyUI + custom dark theme
│
├── README.md
├── DEPLOYMENT.md
└── FINAL_CHANGELOG.md
```

---

## Local Setup

### Prerequisites
- Node.js 18+ (tested on Node 24)
- MongoDB (Atlas or local)
- Redis (Cloud or local)
- RapidAPI account (for Judge0)
- Google Cloud account (for OAuth + Gemini)
- Cloudinary account (for video editorials)

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend (in a separate terminal)
cd frontend
npm install
```

### 2. Environment Setup

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your real credentials

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your backend URL
```

### 3. Database Setup

Create a MongoDB Atlas cluster (free tier M0 is sufficient):
1. Go to https://cloud.mongodb.com
2. Create a cluster
3. Create a database user
4. Whitelist your IP (or `0.0.0.0/0` for development)
5. Copy the connection string to `DB_CONNECT_STRING` in `.env`

No schema migrations needed — all collections auto-create on first insert.

### 4. Redis Setup

Create a Redis instance:
1. Go to https://redis.com (Redis Cloud free tier)
2. Create a database
3. Copy host, port, and password to `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASS` in `.env`

### 5. Authentication Setup

#### Email/Password
Already built-in. Just set `JWT_KEY` to a random hex string:
```bash
openssl rand -hex 32
```

#### Google OAuth
1. Go to https://console.cloud.google.com/apis/credentials
2. Create an OAuth consent screen (External type)
3. Create OAuth 2.0 Client ID (Web application)
4. Add Authorized redirect URIs:
   - `http://localhost:3000/user/auth/google/callback` (local dev)
   - `https://api.yourdomain.com/user/auth/google/callback` (production)
5. Copy Client ID and Client Secret to `.env`

### 6. Third-Party Services Setup

#### Judge0 (Code Execution)
1. Subscribe to Judge0 CE on RapidAPI: https://rapidapi.com/judge0-official/api/judge0-ce
2. Copy the X-RapidAPI-Key to `JUDGE0_KEY` in `.env`

#### Google Gemini (AI Chat)
1. Go to https://aistudio.google.com/app/apikey
2. Create an API key
3. Copy to `GEMINI_KEY` in `.env`

#### Cloudinary (Video Editorials)
1. Go to https://cloudinary.com
2. Create an account
3. Copy Cloud Name, API Key, and API Secret to `.env`

### 7. Run Locally

```bash
# Backend (terminal 1)
cd backend
npm start
# Server runs on http://localhost:3000

# Frontend (terminal 2)
cd frontend
npm run dev
# Vite dev server runs on http://localhost:5173
```

Open http://localhost:5173 in your browser.

---

## Environment Setup

See `.env.example` files in both `backend/` and `frontend/` for the complete list of environment variables with comments. All variables are documented with their purpose and example values.

**Critical production settings:**
- `NODE_ENV=production`
- `COOKIE_SECURE=true`
- `COOKIE_SAMESITE=none`
- `GOOGLE_REDIRECT_URI=https://api.yourdomain.com/user/auth/google/callback`
- `CLIENT_URL=https://app.yourdomain.com`

---

## Deployment Guide

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions including:
- Frontend deployment (Vercel/Netlify/static hosting)
- Backend deployment (Node.js hosting)
- MongoDB setup
- Redis setup
- Google OAuth setup
- Judge0 setup
- Production checklist
- Troubleshooting

---

## Screenshots

> **Note:** Screenshots are not included in the repository. Run the app locally to see:
> - Login/Signup pages with Google OAuth button
> - Homepage with problem list and filters
> - ProblemPage with resizable split panels, Monaco editor, and console
> - Profile page with activity graph and achievements
> - Dashboard with daily challenge and stats
> - Leaderboard with podium for top 3
> - Discussions tab with upvotes and comments

---

## Future Improvements

- **Contest system** — real timed contests (currently placeholder)
- **Problem test case editor** — let users add custom test cases
- **Code review** — peer-to-peer code review on submissions
- **Follow system** — follow other users, see their activity
- **Problem tags filtering** — multi-tag filter (currently single-tag)
- **Search** — full-text search across problems and discussions
- **Notifications** — in-app notifications for replies, badges, milestones
- **Dark/light theme toggle** — currently dark-only
- **Mobile app** — React Native or PWA
- **Test suite** — automated unit/integration tests (currently none)
- **TypeScript migration** — full type safety
- **CI/CD pipeline** — automated builds and deployments

---

## License

ISC

---

## Acknowledgments

Built as a production-readiness exercise across 19 development batches + 2 stabilization batches, fixing 38 audit bugs total.
