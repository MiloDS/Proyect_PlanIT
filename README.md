# PlanIt

**[English](#english) | [Español](#español)**

---

## English

Mobile app to discover activities and places based on location, weather, and personal preferences. University project built with React Native and Expo.

### Tech stack

- **React Native** 0.86 + **Expo** SDK 57
- **TypeScript**
- **React Navigation** (`@react-navigation/native-stack`) for screen navigation
- **AsyncStorage** (`@react-native-async-storage/async-storage`) to persist onboarding state and user session
- **react-native-safe-area-context** for safe area handling (notch, navigation bar)
- **@expo/vector-icons** for icons

### Project structure

```
PlanIt/
├── assets/                 # Illustrations, icons, splash screen
├── src/
│   ├── components/         # Reusable components (InputField, SocialButton)
│   ├── navigation/          # React Navigation setup
│   ├── screens/             # App screens
│   ├── types/                # Shared types (navigation, component props)
│   └── utils/                 # Utilities (AsyncStorage)
├── App.tsx
├── index.ts
└── app.json
```

### Implemented screens

| Screen | Description |
|---|---|
| `IntroScreen` | Onboarding carousel (3 slides), swipe navigation, pagination dots, and start button |
| `LoginScreen` | Email/password login, Google and Apple options, field validation |
| `HomeScreen` | Main screen (in progress) |

### Navigation flow

The entry point (`AppNavigator`) decides the initial screen based on what's stored in `AsyncStorage`:

1. **First time opening the app** → shows `IntroScreen`.
2. **Onboarding already seen, no active session** → shows `LoginScreen`.
3. **Onboarding seen and active session** → goes straight to `HomeScreen`.

### Installation

```bash
git clone https://github.com/MiloDS/Proyect_PlanIT.git
cd Proyect_PlanIT
npm install
```

### Running the app

```bash
npx expo start
```

From there you can open the project on:
- Android: `npx expo start --android` (emulator or Expo Go)
- iOS: `npx expo start --ios`
- Web: `npx expo start --web`

If you run into cache issues after installing new dependencies:

```bash
npx expo start -c
```

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

Actively in development. `HomeScreen` and new user registration are still pending.

### Author
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
- **React Navigation** (`@react-navigation/native-stack`) para la navegación entre pantallas
- **AsyncStorage** (`@react-native-async-storage/async-storage`) para persistir el estado de onboarding y la sesión del usuario
- **react-native-safe-area-context** para manejo de áreas seguras (notch, barra de navegación)
- **@expo/vector-icons** para iconografía

### Estructura del proyecto

```
PlanIt/
├── assets/                 # Ilustraciones, íconos y splash screen
├── src/
│   ├── components/         # Componentes reutilizables (InputField, SocialButton)
│   ├── navigation/          # Configuración de React Navigation
│   ├── screens/             # Pantallas de la app
│   ├── types/                # Tipos compartidos (navegación, props de componentes)
│   └── utils/                 # Utilidades (AsyncStorage)
├── App.tsx
├── index.ts
└── app.json
```

### Pantallas implementadas

| Pantalla | Descripción |
|---|---|
| `IntroScreen` | Onboarding con carrusel de bienvenida (3 slides), navegación por swipe, indicador de puntos y botón de inicio |
| `LoginScreen` | Inicio de sesión con correo/contraseña, opciones de Google y Apple, validación de campos |
| `HomeScreen` | Pantalla principal (en desarrollo) |

### Flujo de navegación

El punto de entrada (`AppNavigator`) decide la pantalla inicial según lo guardado en `AsyncStorage`:

1. **Primera vez que se abre la app** → se muestra `IntroScreen`.
2. **Onboarding ya visto, sin sesión iniciada** → se muestra `LoginScreen`.
3. **Onboarding visto y sesión activa** → se entra directo a `HomeScreen`.

### Instalación

```bash
git clone https://github.com/MiloDS/Proyect_PlanIT.git
cd Proyect_PlanIT
npm install
```

### Ejecución

```bash
npx expo start
```

Desde ahí puedes abrir el proyecto en:
- Android: `npx expo start --android` (emulador o Expo Go)
- iOS: `npx expo start --ios`
- Web: `npx expo start --web`

Si hay problemas de caché tras instalar dependencias nuevas:

```bash
npx expo start -c
```

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

En desarrollo activo. `HomeScreen` y el registro de nuevos usuarios aún están pendientes.

### Autor
Juan Esteban
Juan Pablo Orozco
Alexander Vargas Mejía 
Institución Universitaria Pascual Bravo, Tecnología en Desarrollo de Software