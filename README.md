# PlanIt

**[English](#english) | [Español](#español)**

---

## English

Mobile app to discover activities and places based on location, weather, and personal preferences. University project built with React Native and Expo.

### Tech stack

- **React Native** 0.86 + **Expo** SDK 57
- **TypeScript**
- **React Navigation** (`native-stack` + `bottom-tabs`) for screen navigation
- **Supabase** (`@supabase/supabase-js`) for authentication (email/password and Google) and the database
- **AsyncStorage** (`@react-native-async-storage/async-storage`) to persist onboarding state and the Supabase session
- **react-native-safe-area-context** for safe area handling (notch, navigation bar)
- **lucide-react-native** for icons

### Project structure

```
PlanIt/
├── assets/                 # Illustrations, icons, splash screen
├── src/
│   ├── components/         # Reusable components (Button, InputField, BottomNavBar...)
│   ├── navigation/         # React Navigation setup
│   ├── screens/            # App screens
│   ├── services/           # Supabase Auth: AuthService, AuthContext (session) and useGoogleSignIn
│   ├── styles/             # Colors and global styles
│   ├── types/              # Shared types (navigation, component props, auth)
│   └── utils/              # Utilities (Supabase client, validation, AsyncStorage, user data, sample data)
├── supabase/migrations/    # Database schema and Row Level Security policies
├── .env.example            # Environment variables template
├── App.tsx
├── index.ts
└── app.json
```

### Implemented screens

| Screen | Description |
|---|---|
| `IntroScreen` | Onboarding carousel (3 slides), swipe navigation, pagination dots, and start button |
| `LoginScreen` | Email/password login and Google login, field validation |
| `RegisterScreen` | Sign up with name, email, and password, or with Google |
| `HomeScreen` | Greeting, weather card, "Surprise me" shortcut, and nearby places |
| `SurpriseMeScreen` | Preference form (activity, budget, distance, company) and recommendation |
| `PlansScreen` | Upcoming and past plans |
| `ProfileScreen` | User data, settings menu, and logout |
| `SearchScreen` / `FavoritesScreen` | Placeholders |

### Navigation flow

`AppNavigator` renders a different group of screens depending on the Supabase session (`AuthContext`):

1. **No session, first time opening the app** → `IntroScreen`, then `LoginScreen`.
2. **No session, onboarding already seen** → `LoginScreen` / `RegisterScreen`.
3. **Active session** → `MainTabs` (Home, Search, Plans, Favorites, Profile) and `SurpriseMeScreen`.

Logging in or out switches the group automatically; screens don't need to call `navigation.reset`.

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
4. Google login:
   1. In Google Cloud Console, create an OAuth client ID of type **Web application** with the authorized redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`.
   2. In Supabase → **Authentication → Sign In / Providers → Google**, enable it and paste the Client ID and Client Secret.
   3. In Supabase → **Authentication → URL Configuration → Redirect URLs**, add `exp://**` (Expo Go) and `planit://**` (development builds).
5. Database: open **SQL Editor** in Supabase and run each file in `supabase/migrations/` in order (or use the CLI: `npx supabase link --project-ref <project-ref>` and `npx supabase db push`).

### Database

Places come from an external API, so the database only stores their `place_id`.

| Table | Content | Who can access it |
|---|---|---|
| `profiles` | Public name and avatar of each user (created automatically on sign up) | Read: any signed-in user. Update: the user themselves |
| `favorites` | Places saved by each user | Only the user themselves |
| `plans` | Plans (title, date, cover) | Read: plan members. Edit/delete: the owner |
| `plan_members` | Members of each plan (`owner` / `member`) | Read: plan members. Invite/remove: the owner. Any member can leave |
| `plan_places` | Places of each plan and their order | Plan members |

To invite someone to a plan by email, call the `add_plan_member_by_email` function: `supabase.rpc('add_plan_member_by_email', { p_plan_id, p_email })`.

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

Actively in development. Authentication works with Supabase; Search and Favorites are placeholders, and Home, Plans, and Surprise me still use sample data.

### Authors
Juan Esteban
Juan Pablo Orozco
Alexander Vargas Mejía
Institución Universitaria Pascual Bravo, Software Development Technology

---

## Español

Aplicación móvil para descubrir actividades y lugares según ubicación, clima y preferencias personales. Proyecto universitario desarrollado en React Native con Expo.

### Tecnologías

- **React Native** 0.86 + **Expo** SDK 57
- **TypeScript**
- **React Navigation** (`native-stack` + `bottom-tabs`) para la navegación entre pantallas
- **Supabase** (`@supabase/supabase-js`) para la autenticación (correo/contraseña y Google) y la base de datos
- **AsyncStorage** (`@react-native-async-storage/async-storage`) para persistir el estado de onboarding y la sesión de Supabase
- **react-native-safe-area-context** para manejo de áreas seguras (notch, barra de navegación)
- **lucide-react-native** para iconografía

### Estructura del proyecto

```
PlanIt/
├── assets/                 # Ilustraciones, íconos y splash screen
├── src/
│   ├── components/         # Componentes reutilizables (Button, InputField, BottomNavBar...)
│   ├── navigation/         # Configuración de React Navigation
│   ├── screens/            # Pantallas de la app
│   ├── services/           # Supabase Auth: AuthService, AuthContext (sesión) y useGoogleSignIn
│   ├── styles/             # Colores y estilos globales
│   ├── types/              # Tipos compartidos (navegación, props de componentes, auth)
│   └── utils/              # Utilidades (cliente de Supabase, validación, AsyncStorage, datos del usuario y de ejemplo)
├── supabase/migrations/    # Esquema de la base de datos y políticas de Row Level Security
├── .env.example            # Plantilla de variables de entorno
├── App.tsx
├── index.ts
└── app.json
```

### Pantallas implementadas

| Pantalla | Descripción |
|---|---|
| `IntroScreen` | Onboarding con carrusel de bienvenida (3 slides), navegación por swipe, indicador de puntos y botón de inicio |
| `LoginScreen` | Inicio de sesión con correo/contraseña y con Google, validación de campos |
| `RegisterScreen` | Registro con nombre, correo y contraseña, o con Google |
| `HomeScreen` | Saludo, clima, acceso a "Sorpréndeme" y lugares cercanos |
| `SurpriseMeScreen` | Formulario de preferencias (actividad, presupuesto, distancia, compañía) y recomendación |
| `PlansScreen` | Planes próximos y pasados |
| `ProfileScreen` | Datos del usuario, menú de ajustes y cierre de sesión |
| `SearchScreen` / `FavoritesScreen` | Pantallas provisionales |

### Flujo de navegación

`AppNavigator` muestra un grupo de pantallas distinto según la sesión de Supabase (`AuthContext`):

1. **Sin sesión, primera vez que se abre la app** → `IntroScreen` y luego `LoginScreen`.
2. **Sin sesión, onboarding ya visto** → `LoginScreen` / `RegisterScreen`.
3. **Sesión activa** → `MainTabs` (Inicio, Buscar, Planes, Favoritos, Perfil) y `SurpriseMeScreen`.

Al iniciar o cerrar sesión el grupo cambia solo; las pantallas no necesitan llamar a `navigation.reset`.

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
4. Login con Google:
   1. En Google Cloud Console, crea un OAuth client ID de tipo **Web application** con la URI de redirección autorizada `https://<project-ref>.supabase.co/auth/v1/callback`.
   2. En Supabase → **Authentication → Sign In / Providers → Google**, actívalo y pega el Client ID y el Client Secret.
   3. En Supabase → **Authentication → URL Configuration → Redirect URLs**, agrega `exp://**` (Expo Go) y `planit://**` (development builds).
5. Base de datos: abre el **SQL Editor** de Supabase y ejecuta en orden cada archivo de `supabase/migrations/` (o usa la CLI: `npx supabase link --project-ref <project-ref>` y `npx supabase db push`).

### Base de datos

Los lugares vienen de una API externa, así que la base de datos solo guarda su `place_id`.

| Tabla | Contenido | Quién puede acceder |
|---|---|---|
| `profiles` | Nombre y foto públicos de cada usuario (se crea solo al registrarse) | Leer: cualquier usuario con sesión. Editar: el propio usuario |
| `favorites` | Lugares guardados por cada usuario | Solo el propio usuario |
| `plans` | Planes (título, fecha, portada) | Leer: los miembros del plan. Editar/eliminar: el dueño |
| `plan_members` | Miembros de cada plan (`owner` / `member`) | Leer: los miembros. Invitar/expulsar: el dueño. Cualquier miembro puede salirse |
| `plan_places` | Lugares de cada plan y su orden | Los miembros del plan |

Para invitar a alguien a un plan por correo se usa la función `add_plan_member_by_email`: `supabase.rpc('add_plan_member_by_email', { p_plan_id, p_email })`.

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

En desarrollo activo. La autenticación funciona con Supabase; Buscar y Favoritos son pantallas provisionales, e Inicio, Planes y Sorpréndeme todavía usan datos de ejemplo.

### Autores
Juan Esteban
Juan Pablo Orozco
Alexander Vargas Mejía
Institución Universitaria Pascual Bravo, Tecnología en Desarrollo de Software
