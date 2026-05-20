import { useAuthStore } from "@/store/authStore"; // Adjusted to use named import if standard
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * Renders the Sign-Up screen of the application.
 *
 * Handles the user sign-up process through interactions with the newly migrated
 * AWS Cognito authentication store and gracefully paths unverified accounts to verification.
 *
 * @return {React.ReactElement} A React component representing the Sign-Up screen.
 */
export default function SignUpScreen(): React.ReactElement {
  const router = useRouter();
  // Swapped to point directly to our updated AWS store hooks
  const { signUp, isLoading, error, clearError } = useAuthStore();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  /**
   * Validates user input for required fields and constraints.
   */
  const validate = (): string | null => {
    if (!displayName.trim()) return "Please enter your name.";
    if (!email.trim()) return "Please enter your email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Please enter a valid email.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  /**
   * Handles the sign-up process for a user.
   */
  const handleSignUp = async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert("Invalid input", validationError);
      return;
    }

    try {
      await signUp({ email: email.trim(), password, displayName: displayName.trim() });

      const currentNeedsVerification = useAuthStore.getState().needsVerification;
      if (currentNeedsVerification) {
        router.push("/(auth)/verify" as any);
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (err) {
      // Error is set internally
    }
  };

  return (
      <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
            contentContainerStyle={styles.inner}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Save and track your favorite places
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
              <Text style={styles.label}>Name</Text>
              <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor="#9E9E9E"
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={displayName}
                  onChangeText={(text) => {
                    if (clearError) clearError();
                    setDisplayName(text);
                  }}
              />
            </View>

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
                    if (clearError) clearError();
                    setEmail(text);
                  }}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                    style={styles.passwordInput}
                    placeholder="Min. 8 characters"
                    placeholderTextColor="#9E9E9E"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      if (clearError) clearError();
                      setPassword(text);
                    }}
                />
                <TouchableOpacity
                    style={styles.visibilityButton}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                >
                  <Ionicons
                      name={showPassword ? "eye" : "eye-off"}
                      size={20}
                      color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                  style={[
                    styles.input,
                    confirmPassword.length > 0 &&
                    password !== confirmPassword &&
                    styles.inputError,
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor="#9E9E9E"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={(text) => {
                    if (clearError) clearError();
                    setConfirmPassword(text);
                  }}
              />
              {confirmPassword.length > 0 && password !== confirmPassword && (
                  <Text style={styles.inlineError}>Passwords do not match</Text>
              )}
            </View>

            <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={() => { void handleSignUp(); }}
                disabled={isLoading}
                activeOpacity={0.85}
            >
              {isLoading ? (
                  <ActivityIndicator color="#fff" />
              ) : (
                  <Text style={styles.buttonText}>Create account</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.terms}>
              By creating an account you agree to our{" "}
              <Text style={styles.link}>Terms of Service</Text> and{" "}
              <Text style={styles.link}>Privacy Policy</Text>
            </Text>
          </View>

          {/* ── Footer ────────────────────────────────────────────────────────── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            {/* Added 'asChild' and 'as any' type casting to bypass the cached Expo Router mapping rule */}
            <Link href={"/(auth)/sign-in" as any} onPress={clearError} asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.link}>Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  inner: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
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
  inputError: {
    borderColor: "#FCA5A5",
    backgroundColor: "#FFF5F5",
  },
  inlineError: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 2,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
  },
  passwordInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#1A1A2E",
  },
  visibilityButton: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  button: {
    height: 52,
    backgroundColor: "#CA3519", // Updated matching Crowdy Brand Violet used in the verify screen layout
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
  terms: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
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
    color: "#CA3519",
    fontSize: 14,
    fontWeight: "600",
  },
});