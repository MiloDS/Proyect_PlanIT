import { StyleSheet, Button, View, Text, Image} from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import { AppStackParamList } from '../types/navigation';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<AppStackParamList, "Intro">;

const slides = [
  {
    key: '1',
    title: 'Descubre nuevos lugares',
    text: 'Encuentra lugares , actividades y experiencias cerca de ti.',
    image: require('../../assets/slide1.png'),
  },
  {
    key: '2',
    title: 'Segun el clima',
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

function RenderItem(item: any) {
    return (
        <View style={styles.slide}>
            <Image source={item.image} style={styles.image} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.text}>{item.text}</Text>
        </View>
    );
}

export function IntroScreen() {
    return (
        <AppIntroSlider
            data={slides}
            renderItem={RenderItem}
            onDone={() => navigation.navigate('Home')}
            showSkipButton
            onSkip={() => navigation.navigate('Home')}
        />
    );
}

const styles = StyleSheet.create({
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    image: {
        width: 200,
        height: 200,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    text: {
        fontSize: 16,
        textAlign: 'center',
    },
});


