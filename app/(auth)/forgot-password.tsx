import { Link } from "expo-router";
import {JSX, useState} from "react";
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

/**
 * Component for displaying the Forgot Password screen.
 * This screen allows users to request a password reset link by entering their email address.
 *
 * @return {JSX.Element} The Forgot Password screen component, including form input for email,
 *                       a Submit button to trigger the reset email, and relevant success or error messages.
 */
export default function ForgotPasswordScreen(): JSX.Element {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSendReset = async () => {
        if (!email.trim()) {
            Alert.alert("Missing field", "Please enter your email address.");
            return;
        }

        setIsLoading(true);
        try {
            // TODO: Integrate with Firebase password reset
            // await getAuth().sendPasswordResetEmail(email.trim());

            setSent(true);
            Alert.alert(
                "Check your email",
                "We've sent a password reset link to your email address."
            );
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to send reset email");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View style={styles.inner}>

                {/* Title */}
                <View style={styles.header}>
                    <Text style={styles.title}>Reset password</Text>
                    <Text style={styles.subtitle}>
                        Enter your email address and we&apos;ll send you a link to reset
                        your password
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {sent ? (
                        <View style={styles.successBox}>
                            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                            <Text style={styles.successTitle}>Email sent!</Text>
                            <Text style={styles.successText}>
                                Check your inbox for a password reset link. It may take a few
                                minutes to arrive.
                            </Text>
                        </View>
                    ) : (
                        <>
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
                                    onChangeText={setEmail}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.button, isLoading && styles.buttonDisabled]}
                                onPress={handleSendReset}
                                disabled={isLoading}
                                activeOpacity={0.85}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Send reset link</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Remember your password? </Text>
                    <Link href="/(auth)/sign-in" asChild>
                        <TouchableOpacity>
                            <Text style={styles.link}>Sign in</Text>
                        </TouchableOpacity>
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
        paddingTop: 16,
    },
    headerContainer: {
        marginBottom: 24,
    },
    header: {
        paddingTop: 120,
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
    successBox: {
        alignItems: "center",
        gap: 16,
        paddingVertical: 40,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1A1A2E",
    },
    successText: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 20,
    },
    button: {
        height: 52,
        backgroundColor: "#CA3519",
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
        marginTop: "auto",
        paddingBottom: 32,
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