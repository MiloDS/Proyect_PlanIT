# PlanIt

**[English](#english) | [Español](#español)**

---

## English

Mobile app to discover activities and places based on location, weather, and personal preferences. University project built with React Native and Expo.

### Tech stack

- **React Native** 0.88 + **Expo** SDK 58
- **TypeScript**
- **React Navigation** (`native-stack` + `bottom-tabs`) for screen navigation
- **Supabase** (`@supabase/supabase-js`) for authentication (email/password and Google) and the database
- **AsyncStorage** (`@react-native-async-storage/async-storage`) to persist onboarding state, plus **expo-secure-store** and **expo-crypto** to keep the Supabase session encrypted (see "Security" below)
- **react-native-safe-area-context** for safe area handling (notch, navigation bar)
- **lucide-react-native** for icons
- **react-native-maps** for the Search map and **@react-native-community/datetimepicker** for plan dates (both included in Expo Go)
- **Open-Meteo** for the weather on Home (free, no API key)
- **expo-notifications** for plan reminders (local notifications, which work in Expo Go)
- **expo-image-picker**, **expo-image-manipulator** and **expo-file-system** for the profile photo (camera or gallery, cropped square and reduced to 512 px before uploading it to Supabase Storage)
- **expo-splash-screen** for the launch screen, which stays until the app knows whether there is a session. The logo (white pin with a check on the brand green, also in `assets/logo.png` for the sign-in screens) is provisional
- **expo-camera** to scan the QR of a plan, and **qrcode** with **react-native-svg** to draw it (only the core of `qrcode` that builds the QR matrix)
- **expo-image** for place, plan and profile photos: it keeps them in memory and on disk, so going back to a screen does not download them again, and fades them in
- **React Compiler** (`experiments.reactCompiler` in `app.json`), which memoizes components automatically so they only re-render when their data changes

### Project structure

```
PlanIt/
├── assets/                 # Illustrations, icons, splash screen
├── src/
│   ├── components/         # Reusable components (Button, InputField, BottomNavBar...)
│   ├── navigation/         # React Navigation setup
│   ├── screens/            # App screens
│   ├── services/           # Auth, profile, places, weather, recommendations, favorites, plans, reminders and location services, contexts and hooks
│   ├── styles/             # Colors and global styles
│   ├── types/              # Shared types (navigation, component props, auth, places, plans, weather)
│   └── utils/              # Utilities (Supabase client, form rules, messages, AsyncStorage, user data, dates, place icons, weather codes)
├── supabase/               # Migrations, RLS tests and the `places` Edge Function (Google Places)
├── .env.example            # Environment variables template
├── App.tsx
├── index.ts
├── app.json                # App configuration (name, icons, permissions, plugins)
├── app.config.ts           # Adds the Google Maps key from the environment when building
└── eas.json                # EAS Build profiles (preview = APK)
```

### Code organization

Following the course guide, each layer has one job:

- **Screens and components** (`src/screens`, `src/components`) show data and respond to the user; they don't hold business rules.
- **Services** (`src/services`) talk to Supabase, Google Places (through the Edge Function) and Open-Meteo.
- **Rules** (`src/utils/validation.ts`) check form data before it is sent: name, email, password, and a plan's title, date and places. Each function returns the error to show, or an empty string. The database checks the important rules again (RLS and constraints). The Surprise me ranking rules live in `src/utils/recommendations.ts`.
- **Messages** (`src/utils/messages.ts`) holds every success, warning and error message the app shows, so the wording stays consistent and changes in one place.

### Implemented screens

| Screen | Description |
|---|---|
| `IntroScreen` | Onboarding carousel (3 slides), swipe navigation, pagination dots, and start button |
| `LoginScreen` | Email/password login and Google login, field validation, "forgot password" link |
| `RegisterScreen` | Sign up with name, email, and password, or with Google |
| `ForgotPasswordScreen` | Recover the password with a code sent by email (email → code → new password) |
| `HomeScreen` | Greeting, current weather, "Surprise me" shortcut, and nearby places; pull down to refresh the location, weather and places |
| `SearchScreen` | Map with nearby places, category filters, text search, and "search this area" |
| `PlaceDetailScreen` | Photo, rating, distance, hours, price, description, amenities; save to favorites, add to a plan (a new one or an upcoming plan you organize) and share |
| `SurpriseMeScreen` | Preference form (activity, budget, distance, company) |
| `RecommendationsScreen` | Places that match the Surprise me preferences, ordered by rating, weather and company, with a note explaining the order |
| `PlansScreen` | Upcoming and past plans from Supabase (own and shared); pull down to refresh; join a plan with its code or by scanning its QR |
| `PlanDetailScreen` | Date, start and estimated end time, transport, budget per person, notes, the itinerary (arrival time at each place and travel time between them) and members; the plan code, which any member can share or show as a QR; the owner invites people by email, changes the code, removes guests, edits and deletes the plan; guests can leave |
| `CreatePlanScreen` | Plan organizer: name, date, start time, how the group travels, places in visiting order (nearby, favorites or search) with the time spent at each, travel times, estimated end time, budget per person and notes. Opens the new plan when saved; also edits an existing plan |
| `FavoritesScreen` | Favorite places and plans (All / Places / Plans); pull down to refresh |
| `ProfileScreen` | User data, settings menu, and logout |
| `EditProfileScreen` | Change the name and the photo other people see in your plans (the email is read-only) |
| `NotificationsScreen` | Turn plan reminders on or off and choose when they arrive |
| `HelpScreen` | Frequently asked questions and information about the app |

### Navigation flow

`AppNavigator` renders a different group of screens depending on the Supabase session (`AuthContext`):

1. **No session, first time opening the app** → `IntroScreen`, then `LoginScreen`.
2. **No session, onboarding already seen** → `LoginScreen` / `RegisterScreen` / `ForgotPasswordScreen`.
3. **Active session** → `MainTabs` (Home, Search, Plans, Favorites, Profile) plus `SurpriseMeScreen`, `RecommendationsScreen`, `PlaceDetailScreen`, `CreatePlanScreen`, `PlanDetailScreen` and the Profile settings screens (`EditProfileScreen`, `NotificationsScreen`, `HelpScreen`) on top of the tabs.

Logging in or out switches the group automatically; screens don't need to call `navigation.reset`. The one exception is password recovery: once the emailed code is verified Supabase already has a session, but `AuthContext.isRecoveringPassword` keeps the sign-in screens until the new password is saved. Leaving `ForgotPasswordScreen` before that signs the recovery session out.

### Security

- **Google sign-in uses PKCE** (`flowType: 'pkce'`, the flow recommended for mobile apps in RFC 8252). Google, through Supabase, returns a one-time code instead of the tokens, and only the installation that opened the browser can exchange it, because the verifier stays on the phone. Hermes has no WebCrypto, so `utils/webCrypto.ts` adds `getRandomValues` and `subtle.digest` from expo-crypto: the verifier comes from secure random numbers and the challenge is its SHA-256 hash (`s256`). `AuthService.completeOAuthRedirect` exchanges it; if Android brings the app back before the return link arrives, or Expo Go reloads the app while the browser is open, `AuthProvider` catches the link and finishes the sign-in. The exchange gives up after 20 seconds so the button never keeps loading.
- **In Expo Go the browser returns through `exp://<dev server>/--/auth/callback`.** Expo Go only opens `exp://` links, but some versions report themselves as an installed app and `Linking.createURL` then builds `planit://auth/callback`, which nothing on the phone opens, so Chrome stayed on the Google page. `AuthService` builds the `exp://` link itself when it runs in Expo Go; the APK keeps `planit://auth/callback`. In development the Expo terminal shows the line `Google: el navegador volverá a ...`.
- **The session is stored encrypted** (`utils/secureSessionStorage.ts`, the pattern from Supabase's Expo guide): an AES-256-GCM key lives in the Android Keystore through expo-secure-store, and only the encrypted text goes to AsyncStorage. Sessions saved before this change keep working and are encrypted on the next token refresh.
- **Android backups are off** (`android.allowBackup: false`), so the app data cannot be copied out through a backup.

The Intro is shown only once per install. To see it again during development, use **Profile → "Ver la Intro de nuevo (desarrollo)"**: it clears the onboarding flag, signs out and reloads the app. The option only exists in development builds (`__DEV__`).

### Installation

```bash
git clone https://github.com/MiloDS/Proyect_PlanIT.git
cd Proyect_PlanIT
npm install
```

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env` and fill in the project URL and the **anon/publishable** key (Project Settings → API). Never use the `service_role`/secret key in the app. `.env` is ignored by git.
3. In **Authentication → Sign In / Providers → Email**, keep the provider enabled. If **Confirm email** is on, new users must confirm their email before logging in.
4. Password recovery: the app asks for the code from the email, so in **Authentication → Emails → Templates → Reset Password** replace the link with the code, for example:
   - Subject: `Tu código para recuperar PlanIt`
   - Body: `<p>Escribe este código en PlanIt para crear una contraseña nueva:</p><h2>{{ .Token }}</h2><p>Si no lo pediste, ignora este correo.</p>`

   Without a custom SMTP server Supabase only delivers emails to members of the project's team, a few per hour. For anyone to receive the code (and the sign-up confirmation), set up an SMTP provider in **Authentication → Emails → SMTP Settings** (for example Brevo or Resend, both with a free tier).
5. Google login:
   1. In Google Cloud Console, create an OAuth client ID of type **Web application** with the authorized redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`.
   2. In Supabase → **Authentication → Sign In / Providers → Google**, enable it and paste the Client ID and Client Secret.
   3. In Supabase → **Authentication → URL Configuration → Redirect URLs**, add `exp://**` (Expo Go) and `planit://**` (development builds).
6. Database: open **SQL Editor** in Supabase and run each file in `supabase/migrations/` in order (or use the CLI: `npx supabase link --project-ref <project-ref>` and `npx supabase db push --remote`; without `--remote` the CLI targets a local Docker database). The migrations also create the `avatars` Storage bucket for profile photos.

### Database

Places come from the Google Places API, so the database only stores their `place_id`.

| Table | Content | Who can access it |
|---|---|---|
| `profiles` | Public name and avatar of each user (created automatically on sign up) | Read: any signed-in user. Update: the user themselves |
| `favorites` | Places saved by each user | Only the user themselves |
| `favorite_plans` | Plans saved by each user | Only the user themselves, and only for plans they belong to |
| `plans` | Plans (title, date, transport, budget per person, notes, invite code) | Read: plan members. Edit/delete: the owner |
| `plan_members` | Members of each plan (`owner` / `member`) | Read: plan members. Invite/remove: the owner. Any member can leave |
| `plan_places` | Places of each plan, their order and the time spent at each (`stay_minutes`) | Plan members |

The app creates plans with the `create_plan` function, which saves the plan and its places in a single transaction: `supabase.rpc('create_plan', { p_title, p_starts_at, p_place_ids, p_stay_minutes, p_transport_mode, p_budget_per_person, p_notes })` (`p_stay_minutes` follows the order of `p_place_ids`; the last four parameters are optional). It edits them with `update_plan` (`{ p_plan_id, ...the same parameters }`), which works the same way and only lets the owner through. `add_plan_place` (`{ p_plan_id, p_place_id, p_stay_minutes }`) adds a place at the end of a plan from the place detail screen and returns `false` if it was already there. Each plan has an 8-character `invite_code` (without 0, O, 1, I or L so it can be read out loud); `join_plan_by_code` (`{ p_code }`) adds whoever sends it as a guest and returns `{ plan_id, already_member }`, and `regenerate_plan_invite_code` (`{ p_plan_id }`) gives the plan a new code (owner only), so the old one stops working. The QR holds `PLANIT:XXXX-XXXX`, which the app's scanner reads and a phone camera shows as plain text. To invite someone to a plan by email, call `add_plan_member_by_email`: `supabase.rpc('add_plan_member_by_email', { p_plan_id, p_email })`. The person needs a PlanIt account with that email; they are added right away and see the plan in their plans list (there are no notifications yet).

Profile photos live in the public `avatars` Storage bucket, in a folder named after each user's id: anyone can see a photo through its URL (saved in `profiles.avatar_url`), but each person can only upload, list and delete files in their own folder. Every new photo gets a new file name so phones don't keep showing the old one from their cache, and the app deletes the previous files afterwards. Removing the photo shows the person's initials instead, and so does a photo that fails to load.

### Google Places

Home, Search, place details, Surprise me, favorites and plans use the Google Places API (New) through the `places` Supabase Edge Function (`supabase/functions/places/index.ts`). The API key stays in Supabase's secrets and never ships inside the app; only signed-in users can call the function. The function supports five actions: `nearby` (Nearby Search, the default), `text` (Text Search), `details` (Place Details for the detail screen), `lookup` (basic data for up to 20 saved place IDs) and `routes` (distance and travel time between the places of a plan, with the Google Routes API).

1. In Google Cloud Console, create a project, link a billing account, and enable **Places API (New)** and **Routes API**.
2. Create an API key and, under **API restrictions**, allow only **Places API (New)** and **Routes API**. Optionally cap the daily quota of both so a bug cannot run up costs. (To use a separate key for Routes, add it as the `GOOGLE_ROUTES_API_KEY` secret.)
3. In Supabase → **Edge Functions → Secrets**, add `GOOGLE_PLACES_API_KEY` with that key.
4. Deploy the function, keeping **Verify JWT** enabled:
   - CLI: `npx supabase login`, `npx supabase link --project-ref <project-ref>` and `npx supabase functions deploy places`.
   - Or in Supabase → **Edge Functions → Deploy a new function → Via Editor**, name it `places` and paste the contents of `index.ts`.

Each Home load makes 1 Nearby Search plus up to 10 photo requests; each Search or Surprise me query makes 1 Nearby or Text Search plus up to 20 photos; opening a place makes 1 Place Details request; each travel time between two places of a plan makes 1 Compute Routes request (basic tier, without live traffic), and the app keeps the ones already calculated in memory, so reordering or reopening a plan only asks for the new ones. While the app is open, places already shown are kept in memory so favorites and plan covers don't request them again (Google's terms don't allow storing Places data on the device or in the database). If the user denies location access, the app searches around the center of Medellín. When a place has no photo, or its photo fails to load (an expired link, no connection), the app shows the icon of its category instead of an empty box.

The map works in Expo Go without extra setup. The APK needs its own Google Maps key, which `app.config.ts` reads from `GOOGLE_MAPS_ANDROID_API_KEY` (see "Building the APK").

### Weather

The weather card on Home uses the [Open-Meteo](https://open-meteo.com) forecast API, which needs no API key, so the app calls it directly (`src/services/weatherService.ts`). It sends the location rounded to two decimals (about 1 km) and keeps each result in memory for 15 minutes, which is how often Open-Meteo updates the current weather. Open-Meteo's free API is for non-commercial use and its data is licensed under CC BY 4.0, so the card credits it; a commercial release would need one of its paid plans.

### Surprise me

`RecommendationsService` (`src/services/recommendationsService.ts`) looks for places of the chosen activities within the distance, keeps the ones within the budget, and orders them with the rules in `src/utils/recommendations.ts`. Each place gets a score:

- its Google rating (0 to 5);
- **+2 / −2 for the weather** (Open-Meteo, the same cached call as Home): with rain or at night, places under a roof (museums, cafés, restaurants, cinemas, malls) go up and outdoor ones (parks, zoos) go down; on a clear day it's the other way around. Cloudy or foggy weather doesn't change the order, and if the weather can't be loaded the list still appears without it;
- **+1 for the company**: cafés, libraries and museums alone; restaurants, cafés and spas as a couple; bars, night clubs and bowling with friends; parks, zoos and museums with family. With family, bars, pubs, night clubs and casinos are left out.

The screen shows a note explaining how the weather and the company changed the order. If it rains and every result is outdoors, the note says so instead of promising a roof.

### Plan reminders

In **Profile → Notificaciones** each person can turn on a reminder before their plans (30 minutes, 1 hour, 3 hours or 1 day before). They are local notifications scheduled on the phone with `expo-notifications` (`src/services/planReminders.ts`), so they arrive with the app closed and need no server; the preference is stored on the device. Reminders are rescheduled every time the app loads plans (on startup, in Mis planes and in a plan's detail), so changes made by other members are picked up; leaving or deleting a plan and signing out cancel them, and tapping a reminder opens the plan.

Local notifications work in Expo Go. Push notifications don't (that would need a development build), which is why the app hides the two warnings `expo-notifications` prints about them in Expo Go (`src/utils/devWarnings.ts`).

### Running the app

```bash
npx expo start
```

From there you can open the project on:
- Android: `npx expo start --android` (emulator or Expo Go)
- iOS: `npx expo start --ios` (simulator or Expo Go)

If you run into cache issues after installing new dependencies or changing `.env`:

```bash
npx expo start -c
```

### Building the APK

The APK is built in the cloud with [EAS Build](https://docs.expo.dev/build/introduction/), using the `preview` profile in `eas.json` (an installable `.apk` for internal distribution; `production` makes the `.aab` for Google Play). `app.config.ts` takes `app.json` and adds the Google Maps key from the environment, because `.env` is not uploaded.

1. **Google Maps key** (the map in Search; Expo Go uses its own). In Google Cloud, enable **Maps SDK for Android**, create an API key and, under API restrictions, allow only that API. Add it to your local `.env` (never committed):
   ```
   GOOGLE_MAPS_ANDROID_API_KEY=your-maps-key
   ```
2. **EAS account.** The project is already linked to EAS under the `mukkanos-team` account (`owner` and `extra.eas.projectId` in `app.json`; the ID is not a secret), so you only need to be a member of that team. Install the CLI and sign in with your Expo account:
   ```bash
   npm install --global eas-cli
   eas login
   ```
3. **Variables in EAS.** Upload the three variables of `.env` to the `preview` environment (the `EXPO_PUBLIC_` ones as plain text, since they end up inside the app anyway; the Maps key as sensitive):
   ```bash
   eas env:push preview --path .env
   ```
   If one is missing, `app.config.ts` stops the build and says which.
4. **Build.** On the first build, accept generating a new Android keystore (EAS keeps it; losing it means the app cannot be updated):
   ```bash
   eas build --platform android --profile preview
   ```
   When it finishes, the terminal and expo.dev show a link and a QR to download the APK on the phone (Android asks to allow installing apps from that source).
5. **Restrict the Maps key to the app.** In expo.dev → project → **Credentials** → Android → `co.edu.pascualbravo.planit`, copy the keystore's **SHA-1 fingerprint**. In Google Cloud, set the key's application restriction to **Android apps** with package `co.edu.pascualbravo.planit` and that SHA-1.

Google sign-in in the APK returns through `planit://auth/callback`, which is already allowed in Supabase (`planit://**`, see "Supabase setup").

The release build uses `expo-build-properties` to make the app lighter: only the ARM architectures of real phones are included (`arm64-v8a` and `armeabi-v7a`; x86 is only for emulators, so the APK does not install on an x86 emulator). Code shrinking with R8 is turned off on purpose with `enableMinifyInReleaseBuilds: false` (the Expo SDK 58 template turns it on by default): it broke the internal database of WorkManager, which `react-native-maps` uses, and the APK closed as soon as it opened ("Failed to create an instance of class androidx.work.impl.WorkDatabase"). Turning it on again needs keep rules for those classes and a test of every screen in the APK. `app.json` also blocks permissions the app does not use (`SYSTEM_ALERT_WINDOW` and the old storage ones): the gallery opens with Android's photo picker, which needs no permission, and camera photos stay in the app's cache.

### Code quality

| Command | What it does |
|---|---|
| `npm run lint` | ESLint with the Expo rules (includes the React hooks rules) |
| `npm run format` | Formats the code with Prettier (`npm run format:check` only checks) |
| `npm run typecheck` | Checks TypeScript types |
| `npm run test:db` | Runs the migrations on a local Postgres (PGlite) and tests the Row Level Security policies |

GitHub Actions runs `lint`, `format:check`, `typecheck` and `test:db` on every pull request (`.github/workflows/ci.yml`); run them locally before pushing.

### Branching convention

- `main` — stable version
- `develop` — feature integration
- `feature/<name>` — development of a specific screen or feature
- `fix/<name>` — bug fixes

### Commit convention

Follows the `type(scope): message` format, for example:

```
feat(login): add Login screen with social buttons and reusable InputField
fix(intro): correct spacing between image, text, and dots
refactor(intro): split slide into background and overlapping card layers
```

### Project status

Actively in development. Authentication (including password recovery), places (Google Places), favorites and plans work with Supabase, and Home shows the real weather (Open-Meteo), which Surprise me also uses, together with the company, to order its recommendations. Plans work as an organizer (visiting order, time at each place, travel times with Google Routes, estimated end time, budget and notes), can be shared with a code, its QR or by inviting friends by email, edited and deleted from their detail screen, and remind you before they start. Ideas for later: notify people when they are invited to a plan (push notifications, which need a development build) and more languages.

### Authors
Juan Esteban
Juan Pablo Orozco
Alexander Vargas Mejía
Institución Universitaria Pascual Bravo, Software Development Technology

---

## Español

Aplicación móvil para descubrir actividades y lugares según ubicación, clima y preferencias personales. Proyecto universitario desarrollado en React Native con Expo.

### Tecnologías

- **React Native** 0.88 + **Expo** SDK 58
- **TypeScript**
- **React Navigation** (`native-stack` + `bottom-tabs`) para la navegación entre pantallas
- **Supabase** (`@supabase/supabase-js`) para la autenticación (correo/contraseña y Google) y la base de datos
- **AsyncStorage** (`@react-native-async-storage/async-storage`) para persistir el estado de onboarding, y **expo-secure-store** con **expo-crypto** para guardar cifrada la sesión de Supabase (ver "Seguridad" más abajo)
- **react-native-safe-area-context** para manejo de áreas seguras (notch, barra de navegación)
- **lucide-react-native** para iconografía
- **react-native-maps** para el mapa de Buscar y **@react-native-community/datetimepicker** para la fecha de los planes (ambas vienen en Expo Go)
- **Open-Meteo** para el clima de Inicio (gratis, sin API key)
- **expo-notifications** para los recordatorios de planes (notificaciones locales, que funcionan en Expo Go)
- **expo-image-picker**, **expo-image-manipulator** y **expo-file-system** para la foto de perfil (cámara o galería, recortada en cuadrado y reducida a 512 px antes de subirla a Supabase Storage)
- **expo-splash-screen** para la pantalla de carga, que se queda hasta que la app sabe si hay sesión. El logo (pin blanco con un visto sobre el verde de la app, también en `assets/logo.png` para las pantallas de acceso) es provisional
- **expo-camera** para escanear el QR de un plan, y **qrcode** con **react-native-svg** para dibujarlo (solo el núcleo de `qrcode` que arma la matriz del QR)
- **expo-image** para las fotos de lugares, planes y perfiles: las guarda en memoria y en disco, así al volver a una pantalla no se descargan otra vez, y aparecen con un fundido
- **React Compiler** (`experiments.reactCompiler` en `app.json`), que memoriza los componentes automáticamente para que solo se vuelvan a dibujar cuando cambian sus datos

### Estructura del proyecto

```
PlanIt/
├── assets/                 # Ilustraciones, íconos y splash screen
├── src/
│   ├── components/         # Componentes reutilizables (Button, InputField, BottomNavBar...)
│   ├── navigation/         # Configuración de React Navigation
│   ├── screens/            # Pantallas de la app
│   ├── services/           # Servicios de auth, perfil, lugares, clima, recomendaciones, favoritos, planes, recordatorios y ubicación; contextos y hooks
│   ├── styles/             # Colores y estilos globales
│   ├── types/              # Tipos compartidos (navegación, props de componentes, auth, lugares, planes, clima)
│   └── utils/              # Utilidades (cliente de Supabase, reglas de los formularios, mensajes, AsyncStorage, datos del usuario, fechas, íconos de lugares, códigos del clima)
├── supabase/               # Migraciones, pruebas de RLS y la Edge Function `places` (Google Places)
├── .env.example            # Plantilla de variables de entorno
├── App.tsx
├── index.ts
├── app.json                # Configuración de la app (nombre, íconos, permisos, plugins)
├── app.config.ts           # Agrega la key de Google Maps desde el entorno al compilar
└── eas.json                # Perfiles de EAS Build (preview = APK)
```

### Organización del código

Siguiendo la guía del curso, cada capa tiene una sola responsabilidad:

- **Pantallas y componentes** (`src/screens`, `src/components`) muestran los datos y responden al usuario; no contienen reglas de negocio.
- **Servicios** (`src/services`) hablan con Supabase, Google Places (a través de la Edge Function) y Open-Meteo.
- **Reglas** (`src/utils/validation.ts`) revisan los datos de los formularios antes de enviarlos: nombre, correo, contraseña, y el nombre, la fecha y los lugares de un plan. Cada función devuelve el error que se debe mostrar, o un texto vacío. La base de datos vuelve a revisar las reglas importantes (RLS y restricciones). Las reglas para ordenar Sorpréndeme están en `src/utils/recommendations.ts`.
- **Mensajes** (`src/utils/messages.ts`) reúne todos los mensajes de éxito, advertencia y error de la app, para que el tono sea el mismo y se cambien en un solo lugar.

### Pantallas implementadas

| Pantalla | Descripción |
|---|---|
| `IntroScreen` | Onboarding con carrusel de bienvenida (3 slides), navegación por swipe, indicador de puntos y botón de inicio |
| `LoginScreen` | Inicio de sesión con correo/contraseña y con Google, validación de campos, enlace para recuperar la contraseña |
| `RegisterScreen` | Registro con nombre, correo y contraseña, o con Google |
| `ForgotPasswordScreen` | Recuperar la contraseña con un código que llega al correo (correo → código → contraseña nueva) |
| `HomeScreen` | Saludo, clima actual, acceso a "Sorpréndeme" y lugares cercanos; al deslizar hacia abajo se actualizan la ubicación, el clima y los lugares |
| `SearchScreen` | Mapa con lugares cercanos, filtros por categoría, búsqueda por texto y "Buscar en esta zona" |
| `PlaceDetailScreen` | Foto, calificación, distancia, horario, precio, descripción y servicios; guardar en favoritos, agregar a un plan (uno nuevo o uno próximo que organices) y compartir |
| `SurpriseMeScreen` | Formulario de preferencias (actividad, presupuesto, distancia, compañía) |
| `RecommendationsScreen` | Lugares que cumplen las preferencias de Sorpréndeme, ordenados por calificación, clima y compañía, con una nota que explica el orden |
| `PlansScreen` | Planes próximos y pasados desde Supabase (propios y compartidos); se actualizan al deslizar hacia abajo; unirse a un plan con su código o escaneando su QR |
| `PlanDetailScreen` | Fecha, hora de inicio y de fin aproximada, transporte, presupuesto por persona, notas, el itinerario (hora de llegada a cada lugar y traslado entre ellos) y las personas; el código del plan, que cualquier miembro puede compartir o mostrar como QR; el dueño invita por correo, cambia el código, quita invitados, edita y elimina el plan; los invitados pueden salirse |
| `CreatePlanScreen` | Organizador del plan: nombre, fecha, hora de inicio, cómo se mueven, lugares en el orden de visita (cercanos, favoritos o búsqueda) con el tiempo en cada uno, traslados, hora de fin aproximada, presupuesto por persona y notas. Al guardar abre el plan nuevo; también edita un plan existente |
| `FavoritesScreen` | Lugares y planes favoritos (Todos / Lugares / Planes); se actualizan al deslizar hacia abajo |
| `ProfileScreen` | Datos del usuario, menú de ajustes y cierre de sesión |
| `EditProfileScreen` | Cambiar el nombre y la foto que ven las personas de tus planes (el correo es de solo lectura) |
| `NotificationsScreen` | Activar o desactivar los recordatorios de planes y elegir cuándo llegan |
| `HelpScreen` | Preguntas frecuentes e información sobre la app |

### Flujo de navegación

`AppNavigator` muestra un grupo de pantallas distinto según la sesión de Supabase (`AuthContext`):

1. **Sin sesión, primera vez que se abre la app** → `IntroScreen` y luego `LoginScreen`.
2. **Sin sesión, onboarding ya visto** → `LoginScreen` / `RegisterScreen` / `ForgotPasswordScreen`.
3. **Sesión activa** → `MainTabs` (Inicio, Buscar, Planes, Favoritos, Perfil) y, encima de las pestañas, `SurpriseMeScreen`, `RecommendationsScreen`, `PlaceDetailScreen`, `CreatePlanScreen`, `PlanDetailScreen` y las pantallas de ajustes del Perfil (`EditProfileScreen`, `NotificationsScreen`, `HelpScreen`).

Al iniciar o cerrar sesión el grupo cambia solo; las pantallas no necesitan llamar a `navigation.reset`. La única excepción es la recuperación de contraseña: al verificar el código del correo Supabase ya tiene sesión, pero `AuthContext.isRecoveringPassword` mantiene las pantallas de acceso hasta que se guarda la contraseña nueva. Si la persona sale de `ForgotPasswordScreen` antes, se cierra esa sesión de recuperación.

### Seguridad

- **El inicio de sesión con Google usa PKCE** (`flowType: 'pkce'`, el flujo recomendado para apps móviles en el RFC 8252). Google, a través de Supabase, devuelve un código de un solo uso en vez de los tokens, y solo la instalación que abrió el navegador lo puede canjear, porque el verificador se queda en el teléfono. Hermes no trae WebCrypto, así que `utils/webCrypto.ts` agrega `getRandomValues` y `subtle.digest` de expo-crypto: el verificador sale de números aleatorios seguros y el desafío es su hash SHA-256 (`s256`). Lo canjea `AuthService.completeOAuthRedirect`; si Android trae la app al frente antes de que llegue el enlace de regreso, o si Expo Go recarga la app mientras el navegador está abierto, `AuthProvider` recibe el enlace y termina el inicio de sesión. El canje se rinde a los 20 segundos para que el botón nunca se quede cargando.
- **En Expo Go el navegador regresa por `exp://<servidor de desarrollo>/--/auth/callback`.** Expo Go solo abre enlaces `exp://`, pero algunas versiones se presentan como una app instalada y entonces `Linking.createURL` arma `planit://auth/callback`, que nada en el teléfono abre, y Chrome se quedaba en la página de Google. `AuthService` arma el enlace `exp://` cuando corre en Expo Go; el APK sigue usando `planit://auth/callback`. En desarrollo, la terminal de Expo muestra la línea `Google: el navegador volverá a ...`.
- **La sesión se guarda cifrada** (`utils/secureSessionStorage.ts`, el patrón de la guía de Supabase para Expo): una clave AES-256-GCM vive en el Keystore de Android a través de expo-secure-store, y en AsyncStorage solo va el texto cifrado. Las sesiones guardadas antes de este cambio siguen funcionando y se cifran en la siguiente renovación del token.
- **Las copias de seguridad de Android están desactivadas** (`android.allowBackup: false`), así los datos de la app no se pueden sacar con un respaldo.

La Intro se muestra una sola vez por instalación. Para verla de nuevo mientras desarrollas, usa **Perfil → "Ver la Intro de nuevo (desarrollo)"**: borra la marca del onboarding, cierra sesión y recarga la app. La opción solo existe en desarrollo (`__DEV__`).

### Instalación

```bash
git clone https://github.com/MiloDS/Proyect_PlanIT.git
cd Proyect_PlanIT
npm install
```

### Configuración de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Copia `.env.example` como `.env` y completa la URL del proyecto y la clave **anon/publishable** (Project Settings → API). Nunca uses la clave `service_role`/secret en la app. `.env` está ignorado por git.
3. En **Authentication → Sign In / Providers → Email**, deja el proveedor activo. Si **Confirm email** está activado, los usuarios nuevos deben confirmar su correo antes de iniciar sesión.
4. Recuperar contraseña: la app pide el código que llega al correo, así que en **Authentication → Emails → Templates → Reset Password** cambia el enlace por el código, por ejemplo:
   - Asunto: `Tu código para recuperar PlanIt`
   - Cuerpo: `<p>Escribe este código en PlanIt para crear una contraseña nueva:</p><h2>{{ .Token }}</h2><p>Si no lo pediste, ignora este correo.</p>`

   Sin un servidor SMTP propio, Supabase solo envía correos a los miembros del equipo del proyecto, y pocos por hora. Para que cualquier persona reciba el código (y la confirmación del registro), configura un proveedor en **Authentication → Emails → SMTP Settings** (por ejemplo Brevo o Resend, que tienen plan gratuito).
5. Login con Google:
   1. En Google Cloud Console, crea un OAuth client ID de tipo **Web application** con la URI de redirección autorizada `https://<project-ref>.supabase.co/auth/v1/callback`.
   2. En Supabase → **Authentication → Sign In / Providers → Google**, actívalo y pega el Client ID y el Client Secret.
   3. En Supabase → **Authentication → URL Configuration → Redirect URLs**, agrega `exp://**` (Expo Go) y `planit://**` (development builds).
6. Base de datos: abre el **SQL Editor** de Supabase y ejecuta en orden cada archivo de `supabase/migrations/` (o usa la CLI: `npx supabase link --project-ref <project-ref>` y `npx supabase db push --remote`; sin `--remote` la CLI apunta a una base de datos local en Docker). Las migraciones también crean el bucket `avatars` de Storage para las fotos de perfil.

### Base de datos

Los lugares vienen de la API de Google Places, así que la base de datos solo guarda su `place_id`.

| Tabla | Contenido | Quién puede acceder |
|---|---|---|
| `profiles` | Nombre y foto públicos de cada usuario (se crea solo al registrarse) | Leer: cualquier usuario con sesión. Editar: el propio usuario |
| `favorites` | Lugares guardados por cada usuario | Solo el propio usuario |
| `favorite_plans` | Planes guardados por cada usuario | Solo el propio usuario, y solo de planes de los que es miembro |
| `plans` | Planes (título, fecha, transporte, presupuesto por persona, notas, código para unirse) | Leer: los miembros del plan. Editar/eliminar: el dueño |
| `plan_members` | Miembros de cada plan (`owner` / `member`) | Leer: los miembros. Invitar/expulsar: el dueño. Cualquier miembro puede salirse |
| `plan_places` | Lugares de cada plan, su orden y el tiempo en cada uno (`stay_minutes`) | Los miembros del plan |

La app crea los planes con la función `create_plan`, que guarda el plan y sus lugares en una sola transacción: `supabase.rpc('create_plan', { p_title, p_starts_at, p_place_ids, p_stay_minutes, p_transport_mode, p_budget_per_person, p_notes })` (`p_stay_minutes` va en el orden de `p_place_ids`; los cuatro últimos parámetros son opcionales). Los edita con `update_plan` (`{ p_plan_id, ...los mismos parámetros }`), que funciona igual y solo deja pasar al dueño. `add_plan_place` (`{ p_plan_id, p_place_id, p_stay_minutes }`) agrega un lugar al final de un plan desde la ficha del lugar y devuelve `false` si ya estaba. Cada plan tiene un `invite_code` de 8 caracteres (sin 0, O, 1, I ni L para poder dictarlo); `join_plan_by_code` (`{ p_code }`) agrega como invitado a quien lo envía y devuelve `{ plan_id, already_member }`, y `regenerate_plan_invite_code` (`{ p_plan_id }`) le da al plan un código nuevo (solo el dueño), así el anterior deja de servir. El QR guarda `PLANIT:XXXX-XXXX`, que lee el escáner de la app y que la cámara del teléfono muestra como texto. Para invitar a alguien a un plan por correo se usa `add_plan_member_by_email`: `supabase.rpc('add_plan_member_by_email', { p_plan_id, p_email })`. La persona necesita una cuenta de PlanIt con ese correo; queda agregada de inmediato y ve el plan en su lista de planes (todavía no hay notificaciones).

Las fotos de perfil están en el bucket público `avatars` de Storage, en una carpeta con el id de cada usuario: cualquiera puede ver una foto con su URL (guardada en `profiles.avatar_url`), pero cada persona solo puede subir, listar y borrar archivos en su propia carpeta. Cada foto nueva tiene un nombre nuevo para que los teléfonos no sigan mostrando la anterior desde su caché, y la app borra los archivos anteriores después. Si la persona quita su foto, o si la foto no carga, se muestran sus iniciales.

### Google Places

Inicio, Buscar, el detalle de lugar, Sorpréndeme, favoritos y planes usan Google Places API (New) a través de la Edge Function `places` de Supabase (`supabase/functions/places/index.ts`). La API key queda en los secretos de Supabase y nunca viaja dentro de la app; solo los usuarios con sesión pueden llamar la función. La función tiene cinco acciones: `nearby` (Nearby Search, la predeterminada), `text` (Text Search), `details` (Place Details para la pantalla de detalle), `lookup` (datos básicos de hasta 20 lugares guardados por ID) y `routes` (distancia y tiempo de traslado entre los lugares de un plan, con Google Routes API).

1. En Google Cloud Console, crea un proyecto, vincula una cuenta de facturación y activa **Places API (New)** y **Routes API**.
2. Crea una API key y, en **API restrictions**, permite solo **Places API (New)** y **Routes API**. Opcionalmente limita la cuota diaria de ambas para que un error no dispare los costos. (Para usar otra key en Routes, agrégala como el secreto `GOOGLE_ROUTES_API_KEY`.)
3. En Supabase → **Edge Functions → Secrets**, agrega `GOOGLE_PLACES_API_KEY` con esa key.
4. Despliega la función dejando activo **Verify JWT**:
   - CLI: `npx supabase login`, `npx supabase link --project-ref <project-ref>` y `npx supabase functions deploy places`.
   - O en Supabase → **Edge Functions → Deploy a new function → Via Editor**, con el nombre `places`, pegando el contenido de `index.ts`.

Cada carga de Inicio hace 1 búsqueda Nearby Search y hasta 10 pedidos de fotos; cada búsqueda en Buscar o en Sorpréndeme hace 1 Nearby o Text Search y hasta 20 fotos; abrir un lugar hace 1 Place Details; cada traslado entre dos lugares de un plan hace 1 Compute Routes (tarifa básica, sin tráfico en tiempo real), y la app guarda en memoria los que ya calculó, así que al reordenar o volver a abrir un plan solo pide los nuevos. Mientras la app está abierta, los lugares ya mostrados quedan en memoria para que favoritos y portadas de planes no los vuelvan a pedir (las condiciones de Google no permiten guardar datos de Places en el teléfono ni en la base de datos). Si el usuario no da permiso de ubicación, la app busca alrededor del centro de Medellín. Si un lugar no tiene foto, o su foto no carga (enlace vencido, sin conexión), la app muestra el ícono de su categoría en vez de un recuadro vacío.

El mapa funciona en Expo Go sin configuración extra. El APK necesita su propia key de Google Maps, que `app.config.ts` lee de `GOOGLE_MAPS_ANDROID_API_KEY` (ver "Generar el APK").

### Clima

La tarjeta del clima de Inicio usa la API de pronóstico de [Open-Meteo](https://open-meteo.com), que no necesita API key, así que la app la consulta directamente (`src/services/weatherService.ts`). Envía la ubicación redondeada a dos decimales (alrededor de 1 km) y guarda cada resultado en memoria 15 minutos, que es cada cuánto Open-Meteo actualiza el clima actual. La API gratuita de Open-Meteo es para uso no comercial y sus datos tienen licencia CC BY 4.0, por eso la tarjeta lo menciona; para publicar la app con fines comerciales haría falta uno de sus planes pagos.

### Sorpréndeme

`RecommendationsService` (`src/services/recommendationsService.ts`) busca lugares de las actividades elegidas dentro de la distancia, deja los que están dentro del presupuesto y los ordena con las reglas de `src/utils/recommendations.ts`. Cada lugar recibe un puntaje:

- su calificación de Google (0 a 5);
- **+2 / −2 por el clima** (Open-Meteo, la misma consulta en caché de Inicio): con lluvia o de noche suben los lugares bajo techo (museos, cafés, restaurantes, cines, centros comerciales) y bajan los de aire libre (parques, zoológicos); con el cielo despejado de día, al revés. Nublado o con niebla el clima no cambia el orden, y si no se puede cargar el clima la lista sale igual, sin tenerlo en cuenta;
- **+1 por la compañía**: cafés, bibliotecas y museos si vas solo; restaurantes, cafés y spas en pareja; bares, discotecas y bolos con amigos; parques, zoológicos y museos en familia. En familia no se incluyen bares, pubs, discotecas ni casinos.

La pantalla muestra una nota que explica cómo cambiaron el orden el clima y la compañía. Si llueve y todos los resultados son al aire libre, la nota lo advierte en lugar de prometer techo.

### Recordatorios de planes

En **Perfil → Notificaciones** cada persona puede activar un recordatorio antes de sus planes (30 minutos, 1 hora, 3 horas o 1 día antes). Son notificaciones locales que se programan en el teléfono con `expo-notifications` (`src/services/planReminders.ts`), así que llegan con la app cerrada y no necesitan servidor; la preferencia se guarda en el dispositivo. Los recordatorios se reprograman cada vez que la app carga los planes (al abrirla, en Mis planes y en el detalle de un plan), así se enteran de los cambios que hagan otras personas; salir de un plan, eliminarlo o cerrar sesión los cancela, y tocar un recordatorio abre el plan.

Las notificaciones locales funcionan en Expo Go. Las push no (necesitarían un development build), por eso la app oculta los dos avisos que `expo-notifications` muestra sobre ellas en Expo Go (`src/utils/devWarnings.ts`).

### Ejecución

```bash
npx expo start
```

Desde ahí puedes abrir el proyecto en:
- Android: `npx expo start --android` (emulador o Expo Go)
- iOS: `npx expo start --ios` (simulador o Expo Go)

Si hay problemas de caché tras instalar dependencias nuevas o cambiar el `.env`:

```bash
npx expo start -c
```

### Generar el APK

El APK se compila en la nube con [EAS Build](https://docs.expo.dev/build/introduction/), con el perfil `preview` de `eas.json` (un `.apk` instalable para distribución interna; `production` arma el `.aab` para Google Play). `app.config.ts` toma `app.json` y le agrega la key de Google Maps desde el entorno, porque el `.env` no se sube.

1. **Key de Google Maps** (el mapa de Buscar; Expo Go usa la suya). En Google Cloud, activa **Maps SDK for Android**, crea una API key y, en las restricciones de API, permite solo esa API. Agrégala a tu `.env` local (nunca se sube al repositorio):
   ```
   GOOGLE_MAPS_ANDROID_API_KEY=tu-key-de-maps
   ```
2. **Cuenta de EAS.** El proyecto ya está vinculado a EAS en la cuenta `mukkanos-team` (`owner` y `extra.eas.projectId` en `app.json`; el ID no es secreto), así que solo necesitas ser miembro de ese equipo. Instala la CLI y entra con tu cuenta de Expo:
   ```bash
   npm install --global eas-cli
   eas login
   ```
3. **Variables en EAS.** Sube las tres variables del `.env` al entorno `preview` (las `EXPO_PUBLIC_` como texto visible, porque igual quedan dentro de la app; la key de Maps como sensible):
   ```bash
   eas env:push preview --path .env
   ```
   Si falta alguna, `app.config.ts` detiene la compilación y dice cuál.
4. **Compilar.** En la primera compilación, acepta generar un keystore de Android nuevo (EAS lo guarda; si se pierde, la app ya no se puede actualizar):
   ```bash
   eas build --platform android --profile preview
   ```
   Al terminar, la terminal y expo.dev muestran un enlace y un QR para descargar el APK en el teléfono (Android pide permitir instalar apps de ese origen).
5. **Restringir la key de Maps a la app.** En expo.dev → proyecto → **Credentials** → Android → `co.edu.pascualbravo.planit`, copia la **huella SHA-1** del keystore. En Google Cloud, pon como restricción de aplicación **Apps para Android** con el paquete `co.edu.pascualbravo.planit` y esa SHA-1.

En el APK, el inicio de sesión con Google regresa por `planit://auth/callback`, que ya está permitido en Supabase (`planit://**`, ver "Configuración de Supabase").

La compilación de release usa `expo-build-properties` para que la app pese menos: solo se incluyen las arquitecturas ARM de los teléfonos reales (`arm64-v8a` y `armeabi-v7a`; x86 es solo para emuladores, así que el APK no se instala en un emulador x86). La reducción de código con R8 queda apagada a propósito con `enableMinifyInReleaseBuilds: false` (la plantilla de Expo SDK 58 la activa por defecto): dañaba la base de datos interna de WorkManager, que usa `react-native-maps`, y el APK se cerraba apenas se abría ("Failed to create an instance of class androidx.work.impl.WorkDatabase"). Para volver a activarla hacen falta reglas que conserven esas clases y probar todas las pantallas en el APK. `app.json` también bloquea permisos que la app no usa (`SYSTEM_ALERT_WINDOW` y los de almacenamiento antiguos): la galería se abre con el selector de fotos de Android, que no necesita permiso, y las fotos de la cámara quedan en la caché de la app.

### Calidad del código

| Comando | Qué hace |
|---|---|
| `npm run lint` | ESLint con las reglas de Expo (incluye las reglas de hooks de React) |
| `npm run format` | Formatea el código con Prettier (`npm run format:check` solo revisa) |
| `npm run typecheck` | Revisa los tipos de TypeScript |
| `npm run test:db` | Ejecuta las migraciones en un Postgres local (PGlite) y prueba las políticas de Row Level Security |

GitHub Actions corre `lint`, `format:check`, `typecheck` y `test:db` en cada pull request (`.github/workflows/ci.yml`); córrelos localmente antes de subir cambios.

### Convención de ramas

- `main` — versión estable
- `develop` — integración de features
- `feature/<nombre>` — desarrollo de una pantalla o funcionalidad puntual
- `fix/<nombre>` — corrección de bugs

### Convención de commits

Se sigue el formato `tipo(alcance): mensaje`, por ejemplo:

```
feat(login): add Login screen with social buttons and reusable InputField
fix(intro): correct spacing between image, text, and dots
refactor(intro): split slide into background and overlapping card layers
```

### Estado del proyecto

En desarrollo activo. La autenticación (con recuperación de contraseña), los lugares (Google Places), los favoritos y los planes funcionan con Supabase, e Inicio muestra el clima real (Open-Meteo), que Sorpréndeme también usa, junto con la compañía, para ordenar sus recomendaciones. Los planes funcionan como un organizador (orden de visita, tiempo en cada lugar, traslados con Google Routes, hora de fin aproximada, presupuesto y notas), se comparten con un código, su QR o invitando amigos por correo, se editan y eliminan desde su detalle, y avisan antes de empezar. Ideas para después: avisar a las personas cuando las invitan a un plan (notificaciones push, que necesitan un development build) y más idiomas.

### Autores
Juan Esteban
Juan Pablo Orozco
Alexander Vargas Mejía
Institución Universitaria Pascual Bravo, Tecnología en Desarrollo de Software
