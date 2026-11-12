import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

import { AppStackParamList } from '../types/navigation';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import { useTheme, ThemeColors } from '../services/ThemeContext';

type Props = NativeStackScreenProps<AppStackParamList, 'Help'>;

const QUESTIONS = [
  {
    question: '¿Cómo creo un plan?',
    answer:
      'En la pestaña Planes toca "Nuevo plan". Ponle un nombre, elige la fecha, la hora de inicio y cómo se van a mover, y agrega los lugares en el orden en que los van a visitar: cercanos, de tus favoritos o buscándolos por nombre. También puedes poner un presupuesto por persona y notas para todos.',
  },
  {
    question: '¿Cómo se calculan las horas del itinerario?',
    answer:
      'El primer lugar empieza a la hora de inicio. A cada lugar le sumamos el tiempo que se van a quedar (lo propone PlanIt según el tipo de lugar y lo puedes cambiar) y el traslado hasta el siguiente, que calcula Google según vayan a pie, en carro o en transporte público. Con las flechas cambias el orden. Las horas son aproximadas.',
  },
  {
    question: '¿Puedo agregar un lugar a un plan desde su ficha?',
    answer:
      'Sí. En la ficha del lugar toca "Agregar a un plan" y elige uno de tus próximos planes o "Nuevo plan". Solo aparecen los planes que tú organizas.',
  },
  {
    question: '¿Cómo invito a mis amigos a un plan?',
    answer:
      'Abre el plan: en Personas está su código. Compártelo por WhatsApp o toca "Ver QR" para que lo escaneen; quien lo tenga se une desde Planes → Unirme. Quien creó el plan también puede invitar con el correo de la cuenta de PlanIt.',
  },
  {
    question: '¿Cómo me uno a un plan con un código?',
    answer:
      'En la pestaña Planes toca "Unirme". Escribe el código que te compartieron o toca "Escanear QR" y apunta al QR que te muestran. Si el código ya no sirve, pide uno nuevo: quien creó el plan puede cambiarlo.',
  },
  {
    question: 'Me invitaron a un plan y no lo veo',
    answer:
      'Revisa que te hayan invitado con el correo de tu cuenta, que aparece en Perfil. La lista de planes se actualiza cada vez que abres la pestaña Planes.',
  },
  {
    question: '¿Cómo edito, elimino o salgo de un plan?',
    answer:
      'Abre el plan. Si lo creaste, toca el lápiz para editarlo o baja hasta el final para eliminarlo para todos. Si te invitaron, al final encontrarás "Salir del plan".',
  },
  {
    question: '¿Cómo elige Sorpréndeme los lugares?',
    answer:
      'Busca cerca de ti lugares de las actividades que elegiste y dentro de tu presupuesto, y los ordena por calificación. Si llueve o es de noche pone primero los lugares bajo techo; con buen clima, los de aire libre. También tiene en cuenta con quién vas: en familia no incluye bares ni discotecas.',
  },
  {
    question: '¿Cómo guardo lugares y planes en favoritos?',
    answer:
      'Toca el corazón de un lugar o de un plan. Los encuentras después en la pestaña Favoritos.',
  },
  {
    question: '¿Cómo funcionan los recordatorios?',
    answer:
      'En Perfil > Notificaciones puedes activar un aviso antes de cada plan y elegir cuándo llega. Los avisos llegan aunque la app esté cerrada.',
  },
  {
    question: '¿Para qué usa PlanIt mi ubicación?',
    answer:
      'Para mostrarte lugares cercanos, calcular a qué distancia están y mostrar el clima de tu zona. Si no das permiso, la app usa el centro de Medellín.',
  },
  {
    question: 'Olvidé mi contraseña',
    answer:
      'En Iniciar sesión toca "¿Olvidaste tu contraseña?". Te enviaremos un código a tu correo para crear una contraseña nueva. Si entras con Google, no necesitas contraseña.',
  },
  {
    question: '¿Cómo cambio mi nombre o mi foto?',
    answer:
      'En Perfil, toca tu foto o entra a Información personal. Puedes tomar una foto, elegirla de la galería o quitarla. Tu nombre y tu foto son los que ven las personas de tus planes.',
  },
];

function Question({
  question,
  answer,
  styles,
  chevronColor,
}: {
  question: string;
  answer: string;
  styles: ReturnType<typeof makeStyles>;
  chevronColor: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const Chevron = expanded ? ChevronUp : ChevronDown;

  return (
    <View style={styles.item}>
      <Pressable
        onPress={() => setExpanded((current) => !current)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={({ pressed }) => [styles.questionRow, pressed && styles.pressed]}
      >
        <Text style={styles.question}>{question}</Text>
        <Chevron size={18} color={chevronColor} />
      </Pressable>
      {expanded && <Text style={styles.answer}>{answer}</Text>}
    </View>
  );
}

export function HelpScreen({ navigation }: Props) {
  const { colors: themeColors, isDark } = useTheme();
  const styles = makeStyles(themeColors);

  return (
    <View style={[globalStyles.screen, { backgroundColor: themeColors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScreenHeader
        title="Ayuda y soporte"
        subtitle="Preguntas frecuentes"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.list}>
          {QUESTIONS.map((item) => (
            <Question
              key={item.question}
              {...item}
              styles={styles}
              chevronColor={themeColors.textSecondary}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Acerca de PlanIt</Text>
        <Text style={styles.about}>
          PlanIt es un proyecto universitario de la Tecnología en Desarrollo de Software de la
          Institución Universitaria Pascual Bravo.
        </Text>
        <Text style={styles.about}>Lugares y fotos: Google Maps. Clima: Open-Meteo.</Text>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      paddingHorizontal: 24,
      paddingTop: 18,
      paddingBottom: 32,
    },
    list: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      overflow: 'hidden',
    },
    item: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    questionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      minHeight: 54,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    pressed: {
      backgroundColor: colors.surface,
    },
    question: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    answer: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.textBody,
      paddingHorizontal: 16,
      paddingBottom: 14,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 26,
      marginBottom: 6,
    },
    about: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.textSecondary,
      marginBottom: 6,
    },
  });
}
