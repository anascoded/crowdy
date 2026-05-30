import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router"; // Clean, explicitly typed hook pattern matching layout routes
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
import { updateUserAttributes } from "aws-amplify/auth"; // Target Amplify Gen 2 profile attribute client mutation

export default function EditProfileScreen(): JSX.Element {
    const router = useRouter();
    const { user, isLoading } = useAuthStore();

    // FIXED: Swapped out old field name reference to use backend contract parameter 'name'
    const [name, setName] = useState(user?.name || "");
    const [localLoading, setLocalLoading] = useState(false);

    /**
     * Handles the user profile save operation.
     *
     * This asynchronous function validates the user's input, updates the user profile
     * in AWS Cognito/Amplify by directly mutating the UserProfile attribute model,
     * and provides feedback to the user through alerts.
     *
     * Key behaviors:
     * - Ensures that the `name` field is not empty.
     * - Displays an error alert if `name` is invalid.
     * - Temporarily sets a loading state while the update operation is performed.
     * - Updates the user's attributes in the Cognito/Amplify backend.
     * - Provides success or error notification to the user via alerts.
     * - Navigates back after a successful update operation.
     */
    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "Name cannot be empty");
            return;
        }

        try {
            setLocalLoading(true);

            // Directly mutates the native UserProfile attribute model record in Cognito/Amplify
            await updateUserAttributes({
                userAttributes: {
                    name: name.trim(),
                },
            });

            Alert.alert("Success", "Profile updated!");
            router.back();
        } catch (err: any) {
            Alert.alert("Error", err.message || "Something went wrong updating your profile.");
        } finally {
            setLocalLoading(false);
        }
    };

    const isProcessing = isLoading || localLoading;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={28} color="#1A1A2E" />
                </TouchableOpacity>
                <Text style={styles.title}>Edit Profile</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.label}>Display Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your name"
                        value={name}
                        onChangeText={setName}
                        editable={!isProcessing}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Email</Text>
                    <View style={[styles.input, styles.disabledInput]}>
                        <Text style={styles.disabledText}>{user?.email}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, isProcessing && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={isProcessing}
                    activeOpacity={0.85}
                >
                    <Text style={styles.saveButtonText}>
                        {isProcessing ? "Saving..." : "Save Changes"}
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
    input: {
        backgroundColor: "#fff",
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: "#1A1A2E",
    },
    disabledInput: {
        justifyContent: "center",
        backgroundColor: "#F9FAFB",
    },
    disabledText: {
        color: "#9CA3AF",
    },
    saveButton: {
        backgroundColor: "#0A0A0A",
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