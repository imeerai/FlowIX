# FlowIX

FlowIX is an AI-powered website builder. Users can create projects from prompts,
edit generated files, preview them, and publish projects.

## Features

- User registration, login, logout, and session-based authentication
- Strong password and user input validation
- AI-generated website project planning and source files
- In-browser project file explorer and code editing
- Live website preview with Sandpack
- AI chat-based project revisions
- Project autosave, version tracking, and generation progress
- Project publishing with public preview URLs
- Project export as a downloadable archive
- Per-user project ownership and protected project routes
- API rate limiting, secure cookies, CORS controls, and security headers
- User-friendly handling for offline, timeout, and server errors

## Technology Stack

### Frontend

- React 19
- Vite
- Tailwind CSS 4
- React Router
- Axios
- Sandpack React for live previews
- Lucide React for icons

### Backend

- Node.js with Express 5
- MongoDB with Mongoose
- JSON Web Tokens with HTTP-only cookies
- bcrypt password hashing
- Zod schemas for AI response validation
- OpenRouter through the AI SDK for website generation
- Helmet for security headers
- CORS and express-rate-limit for API protection

## Project Structure

- `client/` - React and Vite frontend
- `server/` - Express API, MongoDB models, authentication, and AI services
- `server/tests/` - security and input-validation tests

## Requirements

- Node.js 20 or newer
- MongoDB database
- OpenRouter API key for AI generation

## Local Setup

Install dependencies in both applications:

```bash
cd server
npm install

cd ../client
npm install
```

Create `server/.env` locally. Never commit this file:

```env
NODE_ENV=development
PORT=5000
MONGO_URL=mongodb://127.0.0.1:27017/flowix
JWT_SECRET=replace-with-a-random-secret-at-least-32-characters-long
ORIGINS=http://localhost:5173
OPENROUTER_API_KEY=your-server-side-key
OPENROUTER_MODEL=openrouter/free
AI_MAX_CONCURRENCY=6
```

The frontend can use an optional `client/.env.local` file:

```env
VITE_BASE_URL=http://localhost:5000
```

Vite exposes `VITE_*` values to the browser. Never put API keys, database URLs,
JWT secrets, or private tokens in `client/.env*`.

Start the API and frontend in separate terminals:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

Open `http://localhost:5173` in a browser.

## Tests and Builds

Run server security tests:

```bash
cd server
npm test
```

Build the production frontend:

```bash
cd client
npm run build
```

The current test suite covers project limits, invalid project IDs, registration
validation, password strength rules, and prompt bounds.

## Security Notes

- Keep all API keys and secrets in environment variables managed by the server.
- Use a strong, unique `JWT_SECRET` in production.
- Set `ORIGINS` to the exact production frontend URL or URLs. Do not use `*`.
- Run production traffic over HTTPS so secure session cookies are enabled.
- Passwords are hashed before storage and are excluded from normal database queries.
- Authenticated project routes verify both the session and project owner.
- Helmet security headers, CORS restrictions, JSON body limits, and API rate
  limits are enabled on the server.
- User names, email addresses, passwords, prompts, project IDs, and file sizes
  are validated at the API boundary.
- Client-facing errors are generic and do not expose provider, database, or
  stack-trace details.
- Do not log tokens, passwords, prompts, generated source, API responses, or
  full provider errors in production.

## GitHub Push Checklist

Before pushing changes:

```bash
cd server && npm test
cd ../client && npm run build
cd ..
git status
```

Commit source code and tests. Do not commit:

- `.env`, `.env.*`, or any file containing real credentials
- `node_modules/`
- `dist/`
- logs or local database dumps

The repository `.gitignore` protects these files. If a secret was ever pushed,
rotate it immediately; deleting the file alone does not make the old secret
safe.
