import { useState, useRef } from 'react';
import { StyleSheet, View, Text, Image, Pressable, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppStackParamList } from '../types/navigation';
import { setOnboardingSeen } from '../utils/storage';
import { colors } from '../styles/colors';
import { Button } from '../components/Button';
import { globalStyles } from '../styles/globalStyles';

type Props = NativeStackScreenProps<AppStackParamList, "Intro">;

const { width } = Dimensions.get('window');

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
    text: 'Repetir las buenas experiencias',
    image: require('../../assets/slide3.png'),
  },
];

type SlideItem = typeof slides [0];

function Slide({ item }: { item: SlideItem }) {
  return (
    <View style={{ width }}>
      <View style={styles.background}>
        <Text style={styles.title}>{item.title}</Text>
        <Image source={item.image} style={styles.image} />
      </View>

      <View style={styles.card}>
        <Text style={styles.text}>{item.text}</Text>
      </View>
    </View>
  );
}

export function IntroScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const handleFinishOnboarding = async () => {
    await setOnboardingSeen();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
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
        renderItem={({ item }) => ( 
          <Slide 
            item={item}
          />
        )}
      />

      {/* Indicadores de puntos y botones estáticos fuera del FlatList */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => flatListRef.current?.scrollToIndex({ index: i, animated: true })}
              hitSlop={8}
            >
              <View style={[styles.dot, i === activeIndex && styles.activeDot]} />
            </Pressable>
          ))}
        </View>

        <View style={styles.actionContainer}>
          {isLast ? (
            <>
              <Button style={styles.button} onPress={handleFinishOnboarding}>
                <Text style={styles.buttonText}>Comenzar</Text>
              </Button>

              <Text style={styles.loginPrompt}>
                ¿Ya tienes cuenta?{' '}
                <Text style={styles.loginLink} onPress={handleFinishOnboarding}>
                  Inicia sesión
                </Text>
              </Text>
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
    paddingTop: 40,
    paddingHorizontal: 24,
    marginBottom: 40,
    marginTop: 140,
  },
  image: {
    width,
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
    color: '#666',
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
    backgroundColor: '#ccc',
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
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginPrompt: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 13,
    color: '#666',
  },
  loginLink: {
    color: colors.primary,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});