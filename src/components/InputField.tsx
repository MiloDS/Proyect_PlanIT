import { useState } from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { CustomInputFieldProps } from "../types/components";
import { Button } from "./Button";
import { colors } from "../styles/colors";

export function InputField({ placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, autoCorrect, error }: CustomInputFieldProps) {
    
  const [hidePassword, setHidePassword] = useState(secureTextEntry ?? false);
  const isPassword = secureTextEntry;

  return (
    <View style={styles.container}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#797373ee"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={isPassword ? hidePassword : false}
        style={[styles.input, error && styles.inputError]}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
      />
      {isPassword && (
        <Button onPress={() => setHidePassword(!hidePassword)} style={styles.icon}>
          <Ionicons name={hidePassword ? "eye-off" : "eye"} size={22} color="#64748B" />
        </Button>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16, position: "relative" },
  input: {
    borderWidth: 1,
    borderColor: "#fff8f8ee",
    borderRadius: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingRight: 40,
    backgroundColor: "#fff8f8ee",
    color: "#000000ee",
    fontSize: 16,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  icon: {
    position: "absolute",
    right: 12,
    top: 15,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
});