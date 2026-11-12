import { StyleSheet, Text, View } from 'react-native';

import { DividerProps } from '../types/components';
import { useTheme, ThemeColors } from '../services/ThemeContext';

export function Divider({ label }: DividerProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={styles.row}>
      <View style={styles.line} />
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.line} />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
}
