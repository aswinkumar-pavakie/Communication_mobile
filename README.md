# Communication Assistant - Mobile

React Native + Expo + TypeScript app for the English Communication and Placement Training
platform. Talks only to the Communication_backend REST API - never to Supabase directly.

## Status

Every screen below is wired to a **real** backend endpoint (not mock UI data) - the backend
itself uses mock AI providers until real STT/LLM/TTS keys are approved and added, but the
mobile↔backend integration is real end to end.

**Built:**
- Auth: login, register, token refresh (silent, via axios interceptor), logout
- Home / Dashboard: overall score, skill scores, today's activities, recommendations, recent activity
- Activities: list with tags, detail screen with **both** a text-response path and a
  voice-recording path (record → upload → transcript + score + spoken feedback playback)
- Progress: overall + per-skill scores, trend arrows, weekly activity, recent assessments
- Practice hub → Mock Interviews (full start → question-by-question → complete → result flow),
  Roleplay (chat session with an AI partner), Debate (pick a side, argue, get scored),
  Writing (submit, get scored feedback)
- Reports: list + detail (skill breakdown, strengths/weaknesses, recommended actions)
- Profile: account info + logout

**Not built yet:** AI general-chat coach screen (`POST /ai/conversation` has no UI yet),
voice recording is only wired into the Activities detail screen (not Interviews/Roleplay/Debate
yet - those are text-only for now).

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` (or just export the variable) and point it at your running
backend:

```bash
cp .env.example .env
# then edit EXPO_PUBLIC_API_URL
```

- **Physical device**: use your computer's LAN IP, e.g. `http://192.168.1.23:3000/api/v1`
  (never `localhost` - your phone can't reach your computer's loopback address)
- **Android emulator**: `http://10.0.2.2:3000/api/v1` (this is the default if you don't set
  the env var at all - it's Android's special alias back to the host machine)
- **iOS simulator / web**: `http://localhost:3000/api/v1` (the default otherwise)

Then start the dev server:

```bash
npx expo start
```

Scan the QR code with Expo Go (a **development build** is required once you actually record
audio, since `expo-audio` needs native code Expo Go doesn't ship - `npx expo run:ios` /
`npx expo run:android` to build one), or press `w` for web, `a`/`i` for a connected
emulator/simulator.

## Architecture

```
src/
  app/                  # Expo Router file-based routes
    (auth)/              login, register
    (app)/               guarded routes (redirects to /login if not authenticated)
      (tabs)/            home, activities, practice, progress, profile
      activities/[id]    activity detail (text or voice response)
      interviews/        list + full interview flow
      roleplay/          list + chat session
      debates/           list + chat session (with position picker)
      writing/           list + submission
      reports/           list + detail
  api/                  One file per backend domain - typed fetch functions
  lib/
    api-client.ts        axios instance, JWT attach + silent refresh-and-retry on 401
    storage.ts           SecureStore (native) / AsyncStorage (web) token storage
    query-client.ts      TanStack Query client
  context/auth-context.tsx  Auth state: user, login/register/logout, bootstraps from stored tokens
  components/ui/        Reusable primitives: Button, Card, TextField, ScoreBadge, ChatBubble, etc.
  components/voice-recorder-panel.tsx  expo-audio record → upload → playback flow
```

## Verified

- `npx tsc --noEmit` - clean
- `npx expo lint` - clean
- `npx expo-doctor` - 21/21 checks pass
- `npx expo export --platform web` - all 49 routes bundle with zero errors
