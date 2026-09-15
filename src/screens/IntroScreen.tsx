import { useState } from 'react';
import { StyleSheet, View, Text, Image, Pressable, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppStackParamList } from '../types/navigation';


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

function Slide({item, index, activeIndex, navigation, bottomInset}: {
  item: SlideItem;
  index: number;
  activeIndex: number;
  navigation: Props['navigation'];
  bottomInset: number;
}) {
  const isLast = index === slides.length - 1;

  return (
    <View style={{ width }}>
      <View style={styles.background}>
        <Text style={styles.title}>{item.title}</Text>
        <Image source={item.image} style={styles.image} />
      </View>

      <View style={[styles.card, { paddingBottom: bottomInset + 16 }]}>
        <Text style={styles.text}>{item.text}</Text>

        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.activeDot]} />
          ))}
        </View>

        {isLast && (
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

export function IntroScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff'}}>
      <FlatList
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.key}
        renderItem={({ item, index }) => ( 
          <Slide 
            item={item}
            index={index}
            activeIndex={activeIndex}
            navigation={navigation}
            bottomInset={insets.bottom}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
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
  button: {
    backgroundColor: '#2ecc71',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
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