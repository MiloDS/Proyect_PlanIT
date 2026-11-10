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
- **AsyncStorage** (`@react-native-async-storage/async-storage`) to persist onboarding state and the Supabase session
- **react-native-safe-area-context** for safe area handling (notch, navigation bar)
- **lucide-react-native** for icons
- **react-native-maps** for the Search map and **@react-native-community/datetimepicker** for plan dates (both included in Expo Go)
- **Open-Meteo** for the weather on Home (free, no API key)
- **expo-notifications** for plan reminders (local notifications, which work in Expo Go)

### Project structure

```
PlanIt/
├── assets/                 # Illustrations, icons, splash screen
├── src/
│   ├── components/         # Reusable components (Button, InputField, BottomNavBar...)
│   ├── navigation/         # React Navigation setup
│   ├── screens/            # App screens
│   ├── services/           # Auth, profile, places, weather, favorites, plans, reminders and location services, contexts and hooks
│   ├── styles/             # Colors and global styles
│   ├── types/              # Shared types (navigation, component props, auth, places, plans, weather)
│   └── utils/              # Utilities (Supabase client, form rules, messages, AsyncStorage, user data, dates, place icons, weather codes)
├── supabase/               # Migrations, RLS tests and the `places` Edge Function (Google Places)
├── .env.example            # Environment variables template
├── App.tsx
├── index.ts
└── app.json
```

### Code organization

Following the course guide, each layer has one job:

- **Screens and components** (`src/screens`, `src/components`) show data and respond to the user; they don't hold business rules.
- **Services** (`src/services`) talk to Supabase, Google Places (through the Edge Function) and Open-Meteo.
- **Rules** (`src/utils/validation.ts`) check form data before it is sent: name, email, password, and a plan's title, date and places. Each function returns the error to show, or an empty string. The database checks the important rules again (RLS and constraints).
- **Messages** (`src/utils/messages.ts`) holds every success, warning and error message the app shows, so the wording stays consistent and changes in one place.

### Implemented screens

| Screen | Description |
|---|---|
| `IntroScreen` | Onboarding carousel (3 slides), swipe navigation, pagination dots, and start button |
| `LoginScreen` | Email/password login and Google login, field validation, "forgot password" link |
| `RegisterScreen` | Sign up with name, email, and password, or with Google |
| `ForgotPasswordScreen` | Recover the password with a code sent by email (email → code → new password) |
| `HomeScreen` | Greeting, current weather, "Surprise me" shortcut, and nearby places |
| `SearchScreen` | Map with nearby places, category filters, text search, and "search this area" |
| `PlaceDetailScreen` | Photo, rating, distance, hours, price, description, amenities; save to favorites and share |
| `SurpriseMeScreen` | Preference form (activity, budget, distance, company) |
| `RecommendationsScreen` | Places that match the Surprise me preferences, best rated first |
| `PlansScreen` | Upcoming and past plans from Supabase (own and shared) |
| `PlanDetailScreen` | Plan date, places and members; the owner invites people by email, removes guests, edits and deletes the plan; guests can leave |
| `CreatePlanScreen` | New plan with name, date, time and places (nearby, favorites or search); also edits an existing plan |
| `FavoritesScreen` | Favorite places and plans (All / Places / Plans) |
| `ProfileScreen` | User data, settings menu, and logout |
| `EditProfileScreen` | Change the name other people see in your plans (the email is read-only) |
| `NotificationsScreen` | Turn plan reminders on or off and choose when they arrive |
| `HelpScreen` | Frequently asked questions and information about the app |

### Navigation flow

`AppNavigator` renders a different group of screens depending on the Supabase session (`AuthContext`):

1. **No session, first time opening the app** → `IntroScreen`, then `LoginScreen`.
2. **No session, onboarding already seen** → `LoginScreen` / `RegisterScreen` / `ForgotPasswordScreen`.
3. **Active session** → `MainTabs` (Home, Search, Plans, Favorites, Profile) plus `SurpriseMeScreen`, `RecommendationsScreen`, `PlaceDetailScreen`, `CreatePlanScreen`, `PlanDetailScreen` and the Profile settings screens (`EditProfileScreen`, `NotificationsScreen`, `HelpScreen`) on top of the tabs.

Logging in or out switches the group automatically; screens don't need to call `navigation.reset`. The one exception is password recovery: once the emailed code is verified Supabase already has a session, but `AuthContext.isRecoveringPassword` keeps the sign-in screens until the new password is saved. Leaving `ForgotPasswordScreen` before that signs the recovery session out.

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
6. Database: open **SQL Editor** in Supabase and run each file in `supabase/migrations/` in order (or use the CLI: `npx supabase link --project-ref <project-ref>` and `npx supabase db push`).

### Database

Places come from the Google Places API, so the database only stores their `place_id`.

| Table | Content | Who can access it |
|---|---|---|
| `profiles` | Public name and avatar of each user (created automatically on sign up) | Read: any signed-in user. Update: the user themselves |
| `favorites` | Places saved by each user | Only the user themselves |
| `favorite_plans` | Plans saved by each user | Only the user themselves, and only for plans they belong to |
| `plans` | Plans (title, date, cover) | Read: plan members. Edit/delete: the owner |
| `plan_members` | Members of each plan (`owner` / `member`) | Read: plan members. Invite/remove: the owner. Any member can leave |
| `plan_places` | Places of each plan and their order | Plan members |

The app creates plans with the `create_plan` function, which saves the plan and its places in a single transaction: `supabase.rpc('create_plan', { p_title, p_starts_at, p_place_ids })`. It edits them with `update_plan` (`{ p_plan_id, p_title, p_starts_at, p_place_ids }`), which works the same way and only lets the owner through. To invite someone to a plan by email, call `add_plan_member_by_email`: `supabase.rpc('add_plan_member_by_email', { p_plan_id, p_email })`. The person needs a PlanIt account with that email; they are added right away and see the plan in their plans list (there are no notifications yet).

### Google Places

Home, Search, place details, Surprise me, favorites and plans use the Google Places API (New) through the `places` Supabase Edge Function (`supabase/functions/places/index.ts`). The API key stays in Supabase's secrets and never ships inside the app; only signed-in users can call the function. The function supports four actions: `nearby` (Nearby Search, the default), `text` (Text Search), `details` (Place Details for the detail screen) and `lookup` (basic data for up to 20 saved place IDs).

1. In Google Cloud Console, create a project, link a billing account, and enable **Places API (New)**.
2. Create an API key and, under **API restrictions**, allow only **Places API (New)**. Optionally cap the daily quota so a bug cannot run up costs.
3. In Supabase → **Edge Functions → Secrets**, add `GOOGLE_PLACES_API_KEY` with that key.
4. Deploy the function, keeping **Verify JWT** enabled:
   - CLI: `npx supabase login`, `npx supabase link --project-ref <project-ref>` and `npx supabase functions deploy places`.
   - Or in Supabase → **Edge Functions → Deploy a new function → Via Editor**, name it `places` and paste the contents of `index.ts`.

Each Home load makes 1 Nearby Search plus up to 10 photo requests; each Search or Surprise me query makes 1 Nearby or Text Search plus up to 20 photos; opening a place makes 1 Place Details request. While the app is open, places already shown are kept in memory so favorites and plan covers don't request them again (Google's terms don't allow storing Places data on the device or in the database). If the user denies location access, the app searches around the center of Medellín.

The map works in Expo Go without extra setup. For a development or store build, Android needs a Google Maps key: enable **Maps SDK for Android** in Google Cloud, create a key restricted to that API and the app's package, and add the `react-native-maps` plugin to `app.json` with `androidGoogleMapsApiKey`.

### Weather

The weather card on Home uses the [Open-Meteo](https://open-meteo.com) forecast API, which needs no API key, so the app calls it directly (`src/services/weatherService.ts`). It sends the location rounded to two decimals (about 1 km) and keeps each result in memory for 15 minutes, which is how often Open-Meteo updates the current weather. Open-Meteo's free API is for non-commercial use and its data is licensed under CC BY 4.0, so the card credits it; a commercial release would need one of its paid plans.

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

Actively in development. Authentication (including password recovery), places (Google Places), favorites and plans work with Supabase, and Home shows the real weather (Open-Meteo). Plans can be shared by inviting friends by email, edited and deleted from their detail screen, and remind you before they start. Ideas for later: notify people when they are invited to a plan (push notifications, which need a development build), uploading a profile photo, and more languages.

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
- **AsyncStorage** (`@react-native-async-storage/async-storage`) para persistir el estado de onboarding y la sesión de Supabase
- **react-native-safe-area-context** para manejo de áreas seguras (notch, barra de navegación)
- **lucide-react-native** para iconografía
- **react-native-maps** para el mapa de Buscar y **@react-native-community/datetimepicker** para la fecha de los planes (ambas vienen en Expo Go)
- **Open-Meteo** para el clima de Inicio (gratis, sin API key)
- **expo-notifications** para los recordatorios de planes (notificaciones locales, que funcionan en Expo Go)

### Estructura del proyecto

```
PlanIt/
├── assets/                 # Ilustraciones, íconos y splash screen
├── src/
│   ├── components/         # Componentes reutilizables (Button, InputField, BottomNavBar...)
│   ├── navigation/         # Configuración de React Navigation
│   ├── screens/            # Pantallas de la app
│   ├── services/           # Servicios de auth, perfil, lugares, clima, favoritos, planes, recordatorios y ubicación; contextos y hooks
│   ├── styles/             # Colores y estilos globales
│   ├── types/              # Tipos compartidos (navegación, props de componentes, auth, lugares, planes, clima)
│   └── utils/              # Utilidades (cliente de Supabase, reglas de los formularios, mensajes, AsyncStorage, datos del usuario, fechas, íconos de lugares, códigos del clima)
├── supabase/               # Migraciones, pruebas de RLS y la Edge Function `places` (Google Places)
├── .env.example            # Plantilla de variables de entorno
├── App.tsx
├── index.ts
└── app.json
```

### Organización del código

Siguiendo la guía del curso, cada capa tiene una sola responsabilidad:

- **Pantallas y componentes** (`src/screens`, `src/components`) muestran los datos y responden al usuario; no contienen reglas de negocio.
- **Servicios** (`src/services`) hablan con Supabase, Google Places (a través de la Edge Function) y Open-Meteo.
- **Reglas** (`src/utils/validation.ts`) revisan los datos de los formularios antes de enviarlos: nombre, correo, contraseña, y el nombre, la fecha y los lugares de un plan. Cada función devuelve el error que se debe mostrar, o un texto vacío. La base de datos vuelve a revisar las reglas importantes (RLS y restricciones).
- **Mensajes** (`src/utils/messages.ts`) reúne todos los mensajes de éxito, advertencia y error de la app, para que el tono sea el mismo y se cambien en un solo lugar.

### Pantallas implementadas

| Pantalla | Descripción |
|---|---|
| `IntroScreen` | Onboarding con carrusel de bienvenida (3 slides), navegación por swipe, indicador de puntos y botón de inicio |
| `LoginScreen` | Inicio de sesión con correo/contraseña y con Google, validación de campos, enlace para recuperar la contraseña |
| `RegisterScreen` | Registro con nombre, correo y contraseña, o con Google |
| `ForgotPasswordScreen` | Recuperar la contraseña con un código que llega al correo (correo → código → contraseña nueva) |
| `HomeScreen` | Saludo, clima actual, acceso a "Sorpréndeme" y lugares cercanos |
| `SearchScreen` | Mapa con lugares cercanos, filtros por categoría, búsqueda por texto y "Buscar en esta zona" |
| `PlaceDetailScreen` | Foto, calificación, distancia, horario, precio, descripción y servicios; guardar en favoritos y compartir |
| `SurpriseMeScreen` | Formulario de preferencias (actividad, presupuesto, distancia, compañía) |
| `RecommendationsScreen` | Lugares que cumplen las preferencias de Sorpréndeme, de mejor a peor calificados |
| `PlansScreen` | Planes próximos y pasados desde Supabase (propios y compartidos) |
| `PlanDetailScreen` | Fecha, lugares y personas del plan; el dueño invita por correo, quita invitados, edita y elimina el plan; los invitados pueden salirse |
| `CreatePlanScreen` | Nuevo plan con nombre, fecha, hora y lugares (cercanos, favoritos o búsqueda); también edita un plan existente |
| `FavoritesScreen` | Lugares y planes favoritos (Todos / Lugares / Planes) |
| `ProfileScreen` | Datos del usuario, menú de ajustes y cierre de sesión |
| `EditProfileScreen` | Cambiar el nombre que ven las personas de tus planes (el correo es de solo lectura) |
| `NotificationsScreen` | Activar o desactivar los recordatorios de planes y elegir cuándo llegan |
| `HelpScreen` | Preguntas frecuentes e información sobre la app |

### Flujo de navegación

`AppNavigator` muestra un grupo de pantallas distinto según la sesión de Supabase (`AuthContext`):

1. **Sin sesión, primera vez que se abre la app** → `IntroScreen` y luego `LoginScreen`.
2. **Sin sesión, onboarding ya visto** → `LoginScreen` / `RegisterScreen` / `ForgotPasswordScreen`.
3. **Sesión activa** → `MainTabs` (Inicio, Buscar, Planes, Favoritos, Perfil) y, encima de las pestañas, `SurpriseMeScreen`, `RecommendationsScreen`, `PlaceDetailScreen`, `CreatePlanScreen`, `PlanDetailScreen` y las pantallas de ajustes del Perfil (`EditProfileScreen`, `NotificationsScreen`, `HelpScreen`).

Al iniciar o cerrar sesión el grupo cambia solo; las pantallas no necesitan llamar a `navigation.reset`. La única excepción es la recuperación de contraseña: al verificar el código del correo Supabase ya tiene sesión, pero `AuthContext.isRecoveringPassword` mantiene las pantallas de acceso hasta que se guarda la contraseña nueva. Si la persona sale de `ForgotPasswordScreen` antes, se cierra esa sesión de recuperación.

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
6. Base de datos: abre el **SQL Editor** de Supabase y ejecuta en orden cada archivo de `supabase/migrations/` (o usa la CLI: `npx supabase link --project-ref <project-ref>` y `npx supabase db push`).

### Base de datos

Los lugares vienen de la API de Google Places, así que la base de datos solo guarda su `place_id`.

| Tabla | Contenido | Quién puede acceder |
|---|---|---|
| `profiles` | Nombre y foto públicos de cada usuario (se crea solo al registrarse) | Leer: cualquier usuario con sesión. Editar: el propio usuario |
| `favorites` | Lugares guardados por cada usuario | Solo el propio usuario |
| `favorite_plans` | Planes guardados por cada usuario | Solo el propio usuario, y solo de planes de los que es miembro |
| `plans` | Planes (título, fecha, portada) | Leer: los miembros del plan. Editar/eliminar: el dueño |
| `plan_members` | Miembros de cada plan (`owner` / `member`) | Leer: los miembros. Invitar/expulsar: el dueño. Cualquier miembro puede salirse |
| `plan_places` | Lugares de cada plan y su orden | Los miembros del plan |

La app crea los planes con la función `create_plan`, que guarda el plan y sus lugares en una sola transacción: `supabase.rpc('create_plan', { p_title, p_starts_at, p_place_ids })`. Los edita con `update_plan` (`{ p_plan_id, p_title, p_starts_at, p_place_ids }`), que funciona igual y solo deja pasar al dueño. Para invitar a alguien a un plan por correo se usa `add_plan_member_by_email`: `supabase.rpc('add_plan_member_by_email', { p_plan_id, p_email })`. La persona necesita una cuenta de PlanIt con ese correo; queda agregada de inmediato y ve el plan en su lista de planes (todavía no hay notificaciones).

### Google Places

Inicio, Buscar, el detalle de lugar, Sorpréndeme, favoritos y planes usan Google Places API (New) a través de la Edge Function `places` de Supabase (`supabase/functions/places/index.ts`). La API key queda en los secretos de Supabase y nunca viaja dentro de la app; solo los usuarios con sesión pueden llamar la función. La función tiene cuatro acciones: `nearby` (Nearby Search, la predeterminada), `text` (Text Search), `details` (Place Details para la pantalla de detalle) y `lookup` (datos básicos de hasta 20 lugares guardados por ID).

1. En Google Cloud Console, crea un proyecto, vincula una cuenta de facturación y activa **Places API (New)**.
2. Crea una API key y, en **API restrictions**, permite solo **Places API (New)**. Opcionalmente limita la cuota diaria para que un error no dispare los costos.
3. En Supabase → **Edge Functions → Secrets**, agrega `GOOGLE_PLACES_API_KEY` con esa key.
4. Despliega la función dejando activo **Verify JWT**:
   - CLI: `npx supabase login`, `npx supabase link --project-ref <project-ref>` y `npx supabase functions deploy places`.
   - O en Supabase → **Edge Functions → Deploy a new function → Via Editor**, con el nombre `places`, pegando el contenido de `index.ts`.

Cada carga de Inicio hace 1 búsqueda Nearby Search y hasta 10 pedidos de fotos; cada búsqueda en Buscar o en Sorpréndeme hace 1 Nearby o Text Search y hasta 20 fotos; abrir un lugar hace 1 Place Details. Mientras la app está abierta, los lugares ya mostrados quedan en memoria para que favoritos y portadas de planes no los vuelvan a pedir (las condiciones de Google no permiten guardar datos de Places en el teléfono ni en la base de datos). Si el usuario no da permiso de ubicación, la app busca alrededor del centro de Medellín.

El mapa funciona en Expo Go sin configuración extra. Para un development build o la tienda, Android necesita una key de Google Maps: activa **Maps SDK for Android** en Google Cloud, crea una key restringida a esa API y al paquete de la app, y agrega el plugin `react-native-maps` en `app.json` con `androidGoogleMapsApiKey`.

### Clima

La tarjeta del clima de Inicio usa la API de pronóstico de [Open-Meteo](https://open-meteo.com), que no necesita API key, así que la app la consulta directamente (`src/services/weatherService.ts`). Envía la ubicación redondeada a dos decimales (alrededor de 1 km) y guarda cada resultado en memoria 15 minutos, que es cada cuánto Open-Meteo actualiza el clima actual. La API gratuita de Open-Meteo es para uso no comercial y sus datos tienen licencia CC BY 4.0, por eso la tarjeta lo menciona; para publicar la app con fines comerciales haría falta uno de sus planes pagos.

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

En desarrollo activo. La autenticación (con recuperación de contraseña), los lugares (Google Places), los favoritos y los planes funcionan con Supabase, e Inicio muestra el clima real (Open-Meteo). Los planes se comparten invitando amigos por correo, se editan y eliminan desde su detalle, y avisan antes de empezar. Ideas para después: avisar a las personas cuando las invitan a un plan (notificaciones push, que necesitan un development build), subir una foto de perfil y más idiomas.

### Autores
Juan Esteban
Juan Pablo Orozco
Alexander Vargas Mejía
Institución Universitaria Pascual Bravo, Tecnología en Desarrollo de Software
