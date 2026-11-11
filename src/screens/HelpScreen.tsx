import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

import { AppStackParamList } from '../types/navigation';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';

type Props = NativeStackScreenProps<AppStackParamList, 'Help'>;

const QUESTIONS = [
  {
    question: '¿Cómo creo un plan?',
    answer:
      'En la pestaña Planes toca "Nuevo plan". Ponle un nombre, elige la fecha y la hora, y agrega los lugares que quieres visitar: cercanos, de tus favoritos o buscándolos por nombre.',
  },
  {
    question: '¿Cómo invito a mis amigos a un plan?',
    answer:
      'Abre el plan y, en Personas, toca "Invitar". Escribe el correo con el que tu amigo entra a PlanIt y el plan le aparecerá en Mis planes. Solo quien creó el plan puede invitar.',
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

function Question({ question, answer }: { question: string; answer: string }) {
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
        <Chevron size={18} color={colors.textSecondary} />
      </Pressable>
      {expanded && <Text style={styles.answer}>{answer}</Text>}
    </View>
  );
}

export function HelpScreen({ navigation }: Props) {
  return (
    <View style={globalStyles.screen}>
      <StatusBar style="dark" />
      <ScreenHeader
        title="Ayuda y soporte"
        subtitle="Preguntas frecuentes"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.list}>
          {QUESTIONS.map((item) => (
            <Question key={item.question} {...item} />
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

const styles = StyleSheet.create({
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
