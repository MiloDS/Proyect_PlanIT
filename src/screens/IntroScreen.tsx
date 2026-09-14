import { useRef, useState } from 'react';
import { StyleSheet, View, Text, Image, Pressable, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent} from 'react-native';
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
    <View style={styles.slide}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.text}>{item.text}</Text>
      <Image source={item.image} style={styles.image} />
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
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <View style={{ width }}>
            <Slide item={item} />
          </View>
        )}
      />

      <View style={[styles.paginationContainer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.dotsRow}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === activeIndex && styles.activeDot]}
            />
          ))}
        </View>

        {activeIndex === slides.length - 1 && (
          <Pressable style={styles.button} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.buttonText}>Comenzar</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 320,
    resizeMode: 'contain',
  },
  paginationContainer: {
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
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
    backgroundColor: '#2ecc71',
    width: 20,
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
});