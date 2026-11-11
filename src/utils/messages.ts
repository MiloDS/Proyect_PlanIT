/**
 * Mensajes de éxito, advertencia y error que ve quien usa la app. Las pantallas y los
 * servicios los toman de aquí para que el tono sea el mismo en toda la app y para
 * cambiarlos en un solo lugar. Los textos fijos de cada pantalla (títulos, etiquetas,
 * ayudas y estados vacíos) siguen en su pantalla.
 */

const CHECK_CONNECTION = 'Revisa tu conexión e intenta de nuevo.';

const failed = (action: string) => `No se pudo ${action}. ${CHECK_CONNECTION}`;

export const messages = {
  common: {
    errorTitle: 'Error',
  },

  validation: {
    nameRequired: 'El nombre es obligatorio',
    emailRequired: 'El correo es obligatorio',
    emailInvalid: 'Ingresa un correo válido (ejemplo@dominio.com)',
    passwordRequired: 'La contraseña es obligatoria',
    passwordTooShort: (minLength: number) =>
      `La contraseña debe tener al menos ${minLength} caracteres`,
    passwordConfirmationRequired: 'Confirma tu contraseña',
    passwordsDontMatch: 'Las contraseñas no coinciden',
    tooLong: (maxLength: number) => `Máximo ${maxLength} caracteres`,
    planTitleRequired: 'Dale un nombre a tu plan',
    planDateInPast: 'Elige una fecha y hora futuras',
    planPlacesRequired: 'Agrega al menos un lugar',
    budgetTooHigh: (max: string) => `El presupuesto máximo es ${max}`,
    resetCodeRequired: 'Escribe el código que te enviamos',
    resetCodeInvalid: (minLength: number, maxLength: number) =>
      `El código tiene entre ${minLength} y ${maxLength} números`,
  },

  auth: {
    invalidCredentials: 'Correo o contraseña incorrectos.',
    emailNotConfirmed: 'Confirma tu correo antes de iniciar sesión.',
    userAlreadyExists: 'Este correo electrónico ya está registrado.',
    weakPassword: 'La contraseña es demasiado débil.',
    emailInvalid: 'Ingresa un correo válido.',
    tooManyAttempts: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
    network: 'No se pudo conectar con el servidor. Revisa tu conexión.',
    loginFailed: 'Error al iniciar sesión',
    registerFailed: 'Error al crear la cuenta',
    accountCreated: '¡Cuenta creada! Revisa tu correo para confirmarla y luego inicia sesión.',
    googleFailed: 'No se pudo iniciar sesión con Google.',
    googleNoSession: 'Google no devolvió una sesión válida.',
    googleUnavailable: 'No se pudo continuar con Google',
    resetCodeSent: (email: string) =>
      `Si ${email} tiene una cuenta en PlanIt, te llegará un código en unos minutos. Revisa también la carpeta de spam.`,
    resetCodeResent: 'Te enviamos un código nuevo.',
    resetCodeExpired: 'El código no es válido o ya venció. Pide uno nuevo.',
    samePassword: 'La contraseña nueva debe ser distinta de la anterior.',
    emailNotAuthorized:
      'Por ahora no podemos enviar correos a esa dirección. Escríbele al equipo de PlanIt.',
    resetFailed: 'No se pudo cambiar la contraseña',
    logoutTitle: 'Cerrar sesión',
    logoutConfirm: '¿Estás seguro de que deseas cerrar sesión?',
    logoutFailed: 'No se pudo cerrar sesión',
    onboardingResetFailed: 'No se pudo reiniciar el onboarding',
  },

  profile: {
    loadFailed: failed('cargar tu perfil'),
    saveNameFailed: failed('guardar tu nombre'),
    signInRequired: 'Inicia sesión para editar tu perfil',
    photoUploadFailed: failed('guardar tu foto'),
    photoRemoveFailed: failed('quitar tu foto'),
    photoProcessFailed: 'No se pudo preparar la foto. Prueba con otra imagen.',
    cameraPermissionDenied:
      'Para tomar una foto, permite que PlanIt use la cámara en los ajustes del teléfono.',
    removePhotoTitle: 'Quitar foto',
    removePhotoConfirm: 'En tus planes se verán tus iniciales en lugar de tu foto.',
  },

  places: {
    loadFailed: 'No se pudieron cargar los lugares. Revisa tu conexión e intenta de nuevo.',
    loadFailedTitle: 'No pudimos cargar los lugares',
    recommendationsFailedTitle: 'No pudimos cargar las recomendaciones',
  },

  weather: {
    loadFailed: 'No pudimos cargar el clima',
  },

  recommendations: {
    rainy: (description: string, temperature: number) =>
      `${description} (${temperature}°): primero te mostramos lugares bajo techo.`,
    rainyOutdoorOnly: (description: string, temperature: number) =>
      `${description} (${temperature}°) y estos lugares son al aire libre: lleva sombrilla o prueba con otra actividad.`,
    night: (temperature: number) =>
      `Ya es de noche (${temperature}°): primero te mostramos lugares bajo techo.`,
    nightOutdoorOnly: (temperature: number) =>
      `Ya es de noche (${temperature}°) y estos lugares son al aire libre: revisa que estén abiertos o prueba con otra actividad.`,
    sunny: (description: string, temperature: number) =>
      `${description} (${temperature}°): buen momento para lugares al aire libre.`,
    weatherUnavailable: 'No pudimos consultar el clima, así que no lo tuvimos en cuenta.',
    company: {
      Solo: 'Si vas solo, primero cafés, bibliotecas, museos y parques.',
      Pareja: 'En pareja, primero restaurantes, cafés, spas y cine.',
      Amigos: 'Con amigos, primero bares, discotecas, bolos y cine.',
      Familia:
        'En familia, primero parques, zoológicos, museos y centros comerciales, sin bares ni discotecas.',
    } as Record<string, string>,
  },

  favorites: {
    alertTitle: 'Favoritos',
    loadPlacesFailed: failed('cargar tus lugares favoritos'),
    addPlaceFailed: failed('guardar el lugar en favoritos'),
    removePlaceFailed: failed('quitar el lugar de favoritos'),
    loadPlansFailed: failed('cargar tus planes favoritos'),
    addPlanFailed: failed('guardar el plan en favoritos'),
    removePlanFailed: failed('quitar el plan de favoritos'),
    loadFailedTitle: 'No pudimos cargar tus favoritos',
    placesLoadFailedTitle: 'No pudimos cargar tus lugares',
    plansLoadFailedTitle: 'No pudimos cargar tus planes',
  },

  plans: {
    loadListFailed: failed('cargar tus planes'),
    loadListFailedTitle: 'No pudimos cargar tus planes',
    loadFailed: failed('cargar el plan'),
    createFailed: failed('guardar el plan'),
    updateFailed: failed('guardar los cambios'),
    inviteFailed: failed('invitar a esa persona'),
    membersUpdateFailed: failed('actualizar las personas del plan'),
    deleteFailed: failed('eliminar el plan'),
    onlyOwnerCanEdit: 'Solo quien creó el plan puede editarlo',
    onlyOwnerCanInvite: 'Solo quien creó el plan puede invitar personas',
    noPermission: 'No tienes permiso para hacer este cambio',
    accountNotFound: 'No hay ninguna cuenta de PlanIt con ese correo',
    inviteYourself: 'Ya haces parte de este plan',
    alreadyMember: 'Esa persona ya hace parte del plan',
    memberAdded: (email: string) => `Listo, agregamos a ${email} al plan`,
    placesLoadFailed: 'No pudimos cargar los lugares del plan.',
    missingPlaces: (count: number) =>
      count === 1
        ? '1 lugar ya no está disponible en Google Maps.'
        : `${count} lugares ya no están disponibles en Google Maps.`,
    unavailableTitle: 'Este plan ya no está disponible',
    unavailableMessage: 'Puede que lo hayan eliminado o que ya no hagas parte de él.',
    removeMemberTitle: 'Quitar del plan',
    removeMemberConfirm: (name: string, planTitle: string) =>
      `¿Quieres quitar a ${name} de "${planTitle}"?`,
    removeMemberFailedTitle: 'No se pudo quitar',
    deleteTitle: 'Eliminar plan',
    deleteConfirm: (planTitle: string) =>
      `"${planTitle}" se eliminará para todas las personas del plan. Esta acción no se puede deshacer.`,
    deleteFailedTitle: 'No se pudo eliminar el plan',
    leaveTitle: 'Salir del plan',
    leaveConfirm: (planTitle: string) =>
      `Ya no verás "${planTitle}" en tus planes. Para volver, quien lo organiza tendrá que invitarte de nuevo.`,
    leaveFailedTitle: 'No se pudo salir del plan',
    routesFailed: 'No pudimos calcular los traslados.',
    addToPlanTitle: 'Agregar a un plan',
    addPlaceFailed: failed('agregar el lugar al plan'),
    placeAddedTitle: 'Lugar agregado',
    placeAdded: (placeName: string, planTitle: string) =>
      `Agregamos ${placeName} al final de "${planTitle}".`,
    placeAlreadyInPlan: (planTitle: string) => `Ese lugar ya está en "${planTitle}".`,
  },

  reminders: {
    syncFailed:
      'Guardamos tu preferencia, pero no pudimos programar los recordatorios. Se programarán la próxima vez que abras PlanIt con conexión.',
    permissionBlocked:
      'Las notificaciones de PlanIt están desactivadas en tu teléfono. Actívalas en los ajustes para recibir los recordatorios.',
  },
};
