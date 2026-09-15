import { useState } from "react";
import { View, TextInput, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { CustomInputFieldProps } from "../types/components";

export function InputField({ placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, autoCorrect }: CustomInputFieldProps) {
    
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
        style={styles.input}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
      />
      {isPassword && (
        <Pressable onPress={() => setHidePassword(!hidePassword)} style={styles.icon}>
          <Ionicons name={hidePassword ? "eye-off" : "eye"} size={22} color="#64748B" />
        </Pressable>
      )}
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