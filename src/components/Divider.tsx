import { StyleSheet, Text, View } from 'react-native';

import { DividerProps } from '../types/components';
import { colors } from '../styles/colors';

export function Divider({ label }: DividerProps) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderStrong,
  },
  label: {
    marginHorizontal: 10,
    color: colors.textMuted,
    fontSize: 13,
  },
});
