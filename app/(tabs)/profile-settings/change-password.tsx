import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router"; // Explicit hook import pattern matches layout structure
import { useState, JSX } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { updatePassword } from "aws-amplify/auth"; // Direct hook target for Amplify Gen 2 Auth operations

export default function ChangePasswordScreen(): JSX.Element {
    const router = useRouter();
    const { isLoading } = useAuthStore(); // Keep context hook for overall platform-wide loading indicator overlay states
    const [localLoading, setLocalLoading] = useState(false); // Manages button lock during execution thread
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert("Error", "All fields are required");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "New passwords do not match");
            return;
        }

        if (newPassword.length < 8) {
            Alert.alert("Error", "Password must be at least 8 characters");
            return;
        }

        try {
            setLocalLoading(true);

            // Native Amplify Auth utility handles standard cloud cognitive token rotations seamlessly
            await updatePassword({
                oldPassword: currentPassword,
                newPassword: newPassword
            });

            Alert.alert("Success", "Password updated successfully!");
            router.back();
        } catch (err: any) {
            Alert.alert("Error", err.message || "An error occurred while updating your password.");
        } finally {
            setLocalLoading(false);
        }
    };

    const isProcessing = isLoading || localLoading;

    // Added explicit type parameters to the component sub-wrapper definition
    const PasswordInput = ({
                               label,
                               value,
                               onChangeText,
                               showPassword,
                               onToggleShow,
                           }: {
        label: string;
        value: string;
        onChangeText: (text: string) => void;
        showPassword: boolean;
        onToggleShow: () => void;
    }) => (
        <View style={styles.section}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.passwordInputContainer}>
                <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    value={value}
                    onChangeText={onChangeText}
                    editable={!isProcessing}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <TouchableOpacity onPress={onToggleShow} disabled={isProcessing}>
                    <Ionicons
                        name={showPassword ? "eye" : "eye-off"}
                        size={20}
                        color="#9CA3AF"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={28} color="#1A1A2E" />
                </TouchableOpacity>
                <Text style={styles.title}>Change Password</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.content}>
                <PasswordInput
                    label="Current Password"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    showPassword={showCurrentPassword}
                    onToggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
                />

                <PasswordInput
                    label="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    showPassword={showNewPassword}
                    onToggleShow={() => setShowNewPassword(!showNewPassword)}
                />

                <PasswordInput
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    showPassword={showConfirmPassword}
                    onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
                />

                <TouchableOpacity
                    style={[styles.saveButton, isProcessing && styles.buttonDisabled]}
                    onPress={handleChangePassword}
                    disabled={isProcessing}
                    activeOpacity={0.85}
                >
                    <Text style={styles.saveButtonText}>
                        {isProcessing ? "Updating..." : "Change Password"}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "ios" ? 60 : 60,
        paddingBottom: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: "#E5E7EB",
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1A1A2E",
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    passwordInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    passwordInput: {
        flex: 1,
        fontSize: 15,
        color: "#1A1A2E",
    },
    saveButton: {
        backgroundColor: "#6C63FF", // Matches targeted brand token palette definitions
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 32,
    },
    saveButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});