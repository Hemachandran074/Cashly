# Tech Context — Stack, Setup & Constraints

## 1. Stack (as specified)
| Layer | Technology | Role |
|---|---|---|
| Mobile app | React Native + TypeScript | Cross-platform UI, Android-first |
| Native Android | Kotlin | SMS receiver, permissions, background processing (later phase) |
| Backend | Python + FastAPI | REST APIs, auth verification, sync, business logic |
| Cloud DB | Supabase (PostgreSQL) | Accounts, transactions, categories, history; also Auth |
| Local DB | SQLite + SQLCipher | Encrypted offline storage |
| Client state | React Query + Zustand | Server-state cache, UI state |
| Caching | Redis | See open question below |
| Fonts | Delight (primary), Lora (secondary) | Typography |

## 2. Confirmed Environment Choices
- **Auth:** Supabase Auth, email + password.
- **Database:** user's **own Supabase project** (URL + anon key supplied by the user; service-role key only for the backend).
- **Currency:** INR (₹), stored as integer paise.
- **Timezone:** phone's timezone; stored as UTC + offset + local date.
- **SMS:** paste-SMS flow now; native auto-read later in an installed Android build.

## 3. Build Strategy: Expo Go vs Dev Build
- **Phase 1–3** run in **Expo Go** (fast preview): UI, onboarding, manual entry, paste-SMS parsing, analytics, calendar.
- Expo Go **cannot** run custom native code or SQLCipher. These need an **Expo development build (prebuild / EAS)**:
  - Kotlin SMS `BroadcastReceiver` + permission module
  - SQLCipher encrypted local DB
- Plan: until the dev build exists, local persistence uses `expo-sqlite` behind the repository interface, and the Supabase backend is the durable store. Swapping in SQLCipher later should not touch UI code.

## 4. Planned Project Structure
```
money-tracker/
├── memory-bank/              # these six files
├── mobile/                   # Expo + React Native + TypeScript
│   ├── app/                  # expo-router screens
│   ├── src/
│   │   ├── features/         # auth, onboarding, transactions, review, exchange, people, analytics, calendar, settings
│   │   ├── components/       # shared UI primitives
│   │   ├── theme/            # tokens, fonts
│   │   ├── db/               # local DB + repositories
│   │   ├── api/              # API client + React Query hooks
│   │   ├── sms/              # parser (pure TS) + native bridge
│   │   ├── store/            # Zustand stores
│   │   └── utils/            # money, dates, timezone helpers
│   └── android/modules/sms/  # Kotlin module (dev build phase)
├── backend/                  # FastAPI
│   ├── app/{routers,services,repositories,schemas,core}
│   └── tests/
└── supabase/
    ├── migrations/           # SQL schema + RLS policies
    └── seed/                 # system categories
```

## 5. Key Libraries (proposed)
- **Mobile:** expo, expo-router, @tanstack/react-query, zustand, react-native-reanimated, react-native-svg, victory-native or react-native-gifted-charts, expo-font, expo-secure-store, @supabase/supabase-js, date-fns + date-fns-tz, zod, react-hook-form.
- **Backend:** fastapi, uvicorn, pydantic v2, supabase-py or asyncpg/psycopg, python-jose or PyJWT (verify Supabase JWT), pytest, httpx.
- **Testing:** Jest + React Native Testing Library (parser, money, date utils), pytest (API + business rules).

## 6. Environment Variables
```
# mobile (public)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_BASE_URL=

# backend (secret)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
```
Never commit real values; provide `.env.example` only.

## 7. Platform & Policy Constraints
- **Google Play SMS policy:** `READ_SMS` / `RECEIVE_SMS` are restricted permissions; for Play Store release the app must qualify under an allowed use case and complete the permission declaration. Side-loaded / personal use is unaffected. Track this before any public release.
- Android 13+ runtime permission flow for SMS; handle "denied" and "don't ask again".
- iOS: no SMS reading; manual entry and paste only.
- Offline-capable: all core flows work without network, sync when online.

## 8. Fonts
- **Delight** is the primary font and **Lora** the secondary. Lora is available from Google Fonts. Delight must be supplied by the user (font files) or confirmed if it refers to a specific licensed/free family; until then a clean geometric sans fallback is used so the theme can swap it in via a single token.

## 9. Open Technical Questions
1. **Redis:** the spec lists "(Redis) React Query + Zustand" under caching. Redis is a server-side cache; proposed treatment is optional and deferred, with React Query as the active cache. Confirm.
2. **Delight font files:** confirm source/files.
3. **Reference screenshots:** the Home Dashboard and Calendar images were not available to me, only the written description; confirm or re-upload for pixel-level matching.
4. **Hosting for FastAPI** (local during development; deployment target later).
