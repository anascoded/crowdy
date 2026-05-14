import useAuthStore from "@/store/authStore";
import { router } from "expo-router";
import { useState } from "react";
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

export default function EditProfileScreen() {
    // @ts-ignore
    const { user, updateProfile, isLoading } = useAuthStore();
    const [displayName, setDisplayName] = useState(user?.displayName || "");

    const handleSave = async () => {
        if (!displayName.trim()) {
            Alert.alert("Error", "Name cannot be empty");
            return;
        }

        try {
            await updateProfile({ displayName: displayName.trim() });
            Alert.alert("Success", "Profile updated!");
            router.back();
        } catch (err: any) {
            Alert.alert("Error", err.message);
        }
    };

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
                        value={displayName}
                        onChangeText={setDisplayName}
                        editable={!isLoading}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Email</Text>
                    <View style={[styles.input, styles.disabledInput]}>
                        <Text style={styles.disabledText}>{user?.email}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, isLoading && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={isLoading}
                >
                    <Text style={styles.saveButtonText}>
                        {isLoading ? "Saving..." : "Save Changes"}
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
        paddingTop: Platform.OS === "ios" ? 60 : 16,
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
        backgroundColor: "#6C63FF",
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