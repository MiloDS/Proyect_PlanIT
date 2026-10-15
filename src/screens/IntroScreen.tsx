import { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppStackParamList } from '../types/navigation';
import { setOnboardingSeen } from '../utils/storage';
import { colors } from '../styles/colors';
import { Button } from '../components/Button';
import { PromptLink } from '../components/PromptLink';
import { globalStyles } from '../styles/globalStyles';

type Props = NativeStackScreenProps<AppStackParamList, 'Intro'>;

const slides = [
  {
    key: '1',
    title: 'Descubre nuevos lugares',
    text: 'Encuentra lugares, actividades y experiencias cerca de ti.',
    image: require('../../assets/slide1.png'),
  },
  {
    key: '2',
    title: 'Según el clima',
    text: 'Recomendaciones adaptadas al clima y la temporada.',
    image: require('../../assets/slide2.png'),
  },
  {
    key: '3',
    title: 'Guarda tus favoritos',
    text: 'Repite las buenas experiencias.',
    image: require('../../assets/slide3.png'),
  },
];

type SlideItem = (typeof slides)[number];

function Slide({ item, width }: { item: SlideItem; width: number }) {
  return (
    <View style={{ width }}>
      <View style={styles.background}>
        <Text style={styles.title}>{item.title}</Text>
        <Image source={item.image} style={[styles.image, { width }]} />
      </View>

      <View style={styles.card}>
        <Text style={styles.text}>{item.text}</Text>
      </View>
    </View>
  );
}

export function IntroScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  // Se recalcula si cambia el tamaño de la ventana (rotación, tablets, web)
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const finishOnboarding = async (destination: 'Login' | 'Register') => {
    await setOnboardingSeen();
    // Register queda encima de Login para que "volver" lleve al inicio de sesión
    if (destination === 'Register') {
      navigation.reset({ index: 1, routes: [{ name: 'Login' }, { name: 'Register' }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  const isLast = activeIndex === slides.length - 1;

  return (
    <View style={globalStyles.screen}>
      <StatusBar style="dark" />
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.key}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        renderItem={({ item }) => <Slide item={item} width={width} />}
      />

      {/* Indicadores de puntos y botones estáticos fuera del FlatList */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.dotsRow}>
          {slides.map((slide, i) => (
            <Pressable
              key={slide.key}
              onPress={() => flatListRef.current?.scrollToIndex({ index: i, animated: true })}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Ir a la diapositiva ${i + 1}`}
              accessibilityState={{ selected: i === activeIndex }}
            >
              <View style={[styles.dot, i === activeIndex && styles.activeDot]} />
            </Pressable>
          ))}
        </View>

        <View style={styles.actionContainer}>
          {isLast ? (
            <>
              <Button variant="primary" onPress={() => finishOnboarding('Register')}>
                <Text style={globalStyles.primaryButtonText}>Comenzar</Text>
              </Button>

              <PromptLink
                prompt="¿Ya tienes cuenta?"
                linkLabel="Inicia sesión"
                onPress={() => finishOnboarding('Login')}
                style={styles.loginPrompt}
              />
            </>
          ) : (
            <View style={styles.actionSpacer} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.textPrimary,
    paddingTop: 40,
    paddingHorizontal: 24,
    marginBottom: 40,
    marginTop: 140,
  },
  image: {
    height: 340,
    resizeMode: 'cover',
  },
  card: {
    backgroundColor: colors.white,
    marginTop: -30,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  text: {
    fontSize: 15,
    textAlign: 'center',
    color: colors.textSecondary,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    backgroundColor: colors.white,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dot: {
    backgroundColor: colors.inactive,
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: colors.primary,
    width: 22,
    borderRadius: 5,
  },
  actionContainer: {
    minHeight: 85,
    justifyContent: 'center',
  },
  actionSpacer: {
    height: 85,
  },
  loginPrompt: {
    marginTop: 12,
  },
});
