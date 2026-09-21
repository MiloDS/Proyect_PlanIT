import { View, Text, StyleSheet } from 'react-native';
import { PlaceholderScreenProps } from '../types/components';
import { BottomNavBar } from './BottomNavBar';

export function PlaceholderScreen({ title, activeTab, onTabPress }: PlaceholderScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Próximamente</Text>
      </View>

      <BottomNavBar activeTab={activeTab} onTabPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 50,
    marginBottom: 50,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
  },
});