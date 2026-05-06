import useAuthStore from "@/store/authStore";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SignInScreen() {
  const { signIn, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }

    try {
      await signIn({ email: email.trim(), password });
      router.replace("/(tabs)/explore");
    } catch {
      // Error is already set in the store
    }
  };

  return (
      <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.inner}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to access your favorite places
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#9E9E9E"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(text) => {
                    clearError();
                    setEmail(text);
                  }}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9E9E9E"
                  secureTextEntry
                  value={password}
                  onChangeText={(text) => {
                    clearError();
                    setPassword(text);
                  }}
              />
            </View>

            {/* Remember Me & Forgot Password */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.7}
              >
                <View
                    style={[
                      styles.checkbox,
                      rememberMe && styles.checkboxChecked,
                    ]}
                >
                  {rememberMe && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Remember me</Text>
              </TouchableOpacity>

              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity onPress={clearError}>
                  <Text style={styles.forgotLink}>Forgot Password?</Text>
                </TouchableOpacity>
              </Link>
            </View>

            <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSignIn}
                disabled={isLoading}
                activeOpacity={0.85}
            >
              {isLoading ? (
                  <ActivityIndicator color="#fff" />
              ) : (
                  <Text style={styles.buttonText}>Sign in</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <Link href="/(auth)/sign-up" onPress={clearError}>
              <Text style={styles.link}>Sign up</Text>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
  },
  form: {
    gap: 16,
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#1A1A2E",
    backgroundColor: "#F9FAFB",
  },
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  checkboxChecked: {
    backgroundColor: "#F77A05",
    borderColor: "#F77A05",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  forgotLink: {
    color: "#C82909",
    fontSize: 14,
    fontWeight: "600",
  },
  button: {
    height: 52,
    backgroundColor: "#F77A05",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  footerText: {
    color: "#6B7280",
    fontSize: 14,
  },
  link: {
    color: "#C82909",
    fontSize: 14,
    fontWeight: "600",
  },
});