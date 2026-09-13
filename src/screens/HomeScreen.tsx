import { Button, View, Text, Image} from 'react-native';
import { StyleSheet } from 'react-native';

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>
        Encuentra planes increibles cerca de ti
      </Text>

      <Text style={styles.description}>
        Explora lugares, actividades y experiencias hecahs para ti.
      </Text>
      
      <Image source={{ uri: "https://example.com/image.jpg" }} />

      <View style={{ marginTop: 20 }}>

        <Button title="Comenzar"/>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});
