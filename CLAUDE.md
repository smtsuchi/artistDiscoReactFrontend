# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Artist Disco is a modern React 18 + TypeScript music discovery application that integrates with Spotify's API. Users can swipe through artists (Tinder-style) to discover new music within selected genres, with automatic playlist management and artist following features.

**Backend**: Requires the Express REST API backend at https://github.com/smtsuchi/artistDiscoExpressBackend

**Live Demo**: https://artist-disco-react-frontend.web.app/

**Tech Stack**: React 18, TypeScript 5, Vite 7, React Router v6, MUI v6, Context API

## Build & Development Commands

```bash
# Install dependencies
npm install

# Start development server with Vite (http://localhost:3000)
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Firebase Hosting
firebase deploy
```

## Environment Variables

Required environment variables (set in `.env` or hosting platform):

- `VITE_BACKEND_URL` - URL of the Express backend API
- `VITE_SPOTIFY_CLIENT_ID` - Spotify OAuth client ID
- `VITE_SPOTIFY_CLIENT_SECRET` - Spotify OAuth client secret

**Important**: All environment variables use `VITE_` prefix (not `REACT_APP_`)
**Access in code**: `import.meta.env.VITE_*` (not `process.env`)

Note: The redirect URI is hardcoded as `https://artist-disco-react-frontend.web.app/callback` (src/App.tsx:11)

## Architecture

### State Management Pattern

The application uses **React Context API** for global state management:

**AuthContext** (`src/contexts/AuthContext.tsx`):
- Manages Spotify authentication token (from cookies via `js-cookie`)
- Stores current user data (display name, user ID, email)
- Provides `useAuth()` hook for components
- Handles login/logout flows

**UserContext** (`src/contexts/UserContext.tsx`):
- Manages user settings (playlist preferences, auto-follow, auto-like)
- Stores selected genre categories and user's playlist ID
- Provides `useUser()` hook for components
- Handles settings updates and category management

Components access global state via custom hooks instead of prop drilling:
```typescript
const { token, isAuthenticated, logout } = useAuth();
const { userId, settings, updateSettings } = useUser();
```

### Data Flow

1. **Authentication**: Spotify OAuth flow redirects to `/callback` → `Callback` component fetches user data → App state updated
2. **Genre Selection**: `GenreSelect` component → calls `App.generateArtists()` → fetches from Spotify API or backend → redirects to `SwipePage` with artist buffer
3. **Swiping**: `SwipePage` maintains local artist deck → swipe right/left triggers Spotify API calls (follow, add to playlist, like tracks) → updates backend via REST API
4. **Artist Discovery Algorithm**: When user likes an artist, `getRelatedArtists()` fetches Spotify's related artists → filters out already-seen artists → adds new artists to deck

### Component Structure

All components are **functional components with TypeScript** and hooks.

- **Views** (`src/views/`): Page-level components (lazy-loaded)
  - `SwipePage.tsx` - Main swipe interface with artist cards (useState, useEffect, useCallback, useRef)
  - `Settings.tsx` - User preferences (auto-add to playlist, auto-follow, auto-like)
  - `IndividualCard.tsx` - Detailed artist view

- **Components** (`src/components/`): Reusable UI components
  - `GenreSelect.tsx` - Genre/playlist selection form with backend integration
  - `ArtistCards.tsx` - Individual swipeable artist card (uses `react-tinder-card`)
  - `Header.tsx`, `Footer.tsx` - Navigation and controls
  - `Login.tsx`, `Callback.tsx` - Authentication flow

- **Contexts** (`src/contexts/`): Global state providers
  - `AuthContext.tsx` - Authentication state and hooks
  - `UserContext.tsx` - User data and settings state

- **Types** (`src/types/`): TypeScript definitions
  - `index.ts` - Main type definitions (SpotifyArtist, UserSettings, etc.)
  - Type declarations for untyped libraries

### Key Dependencies

- **Build Tool**: Vite 7 (replaces Create React App)
- **Language**: TypeScript 5 with strict mode
- **Framework**: React 18.3 with concurrent features
- **Routing**: React Router v6 with `<Routes>`, `<Route>`, `useNavigate()`, `useLocation()`
- **Spotify Integration**: `react-spotify-api`, `react-spotify-auth` for OAuth and API access
- **UI**: MUI v6 (`@mui/material`, `@mui/icons-material`)
- **Interactions**: `react-tinder-card` for swipe gestures, `react-ticker` for scrolling text
- **State Persistence**: `js-cookie` for auth token, Context API with localStorage for user data

## Important Backend Integration Points

All backend calls use `VITE_BACKEND_URL` (accessed via `import.meta.env.VITE_BACKEND_URL`):

- `GET /userData/:user_id` - Fetch user profile and settings
- `POST /userData` - Create new user profile (also creates Spotify playlist)
- `GET /category/:user_id/:category_name` - Get saved artist buffer for genre
- `POST /category/:user_id` - Save new genre category with artist buffer
- `POST /atp/:user_id` - Update "add to playlist" setting
- `POST /fav/:user_id` - Update "favorite on like" setting
- `POST /follow/:user_id` - Update "follow on like" setting
- `GET /userData/settings/:user_id` - Get user settings

## Common Development Patterns

### Spotify API Calls

All Spotify API calls require authorization header:
```javascript
headers: {
  "Authorization": "Bearer " + Cookies.get('spotifyAuthToken')
}
```

Common endpoints used:
- `GET https://api.spotify.com/v1/me` - Current user profile
- `GET https://api.spotify.com/v1/artists/{id}/related-artists` - Related artists
- `GET https://api.spotify.com/v1/artists/{id}/top-tracks?market=US` - Artist's top tracks
- `POST https://api.spotify.com/v1/users/{user_id}/playlists` - Create playlist
- `PUT https://api.spotify.com/v1/me/following` - Follow artist
- `PUT https://api.spotify.com/v1/me/tracks` - Save tracks to library
- `POST https://api.spotify.com/v1/playlists/{playlist_id}/tracks` - Add tracks to playlist

### Handling Expired Tokens

When Spotify token expires, components call `this.reset()` which sets `access_token: 'expired'` in App state, triggering re-authentication.

### Genre/Category System

- Genres are Spotify playlist IDs (see `GenreSelect.js:75-95` for hardcoded list)
- First-time selection fetches from Spotify API and saves to backend
- Subsequent selections load saved artist buffer from backend
- The "buffer" is an array of artist IDs representing the discovery queue

## Deployment

Hosted on Firebase Hosting. Build output goes to `build/` directory. All routes rewrite to `/index.html` for client-side routing (see `firebase.json`).
