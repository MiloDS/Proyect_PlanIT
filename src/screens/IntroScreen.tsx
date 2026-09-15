import { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppStackParamList } from '../types/navigation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

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

function Slide({ item }: { item: typeof slides[0] }) {
  return (
    <View style={[styles.slide, { width }]}>
      <Text style={styles.title}>{item.title}</Text>
      <Image source={item.image} style={styles.image} />
      <Text style={styles.text}>{item.text}</Text>
    </View>
  );
}

export function IntroScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  return (
    <View style={{ flex: 1}}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => <Slide item={item} />}
      />

      <View style={styles.dotsRow}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === activeIndex && styles.activeDot]}
          />
        ))}
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        {activeIndex === slides.length - 1 && (
          <>
            <Pressable style={styles.button} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.buttonText}>Comenzar</Text>
            </Pressable>

            <Text style={styles.loginPrompt}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
                Inicia sesión
              </Text>
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: 40,
    paddingHorizontal: 24,
    marginTop: 100,
    marginBottom: 40,
  },
  image: {
    width,
    height: 350,
    resizeMode: 'cover',
    marginTop: 20,
  },
  text: {
    fontSize: 15,
    textAlign: 'center',
    color: '#666',
    paddingHorizontal: 24,
    marginTop: 40,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  dot: {
    backgroundColor: '#ccc',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#2ecc71',
    width: 20,
  },
  actions: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
  },
  button: {
    backgroundColor: '#2ecc71',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginPrompt: {
    textAlign: 'center',
    marginTop: 14,
    fontSize: 13,
    color: '#666',
  },
  loginLink: {
    color: '#2ecc71',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});