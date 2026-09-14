import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyScreen() {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const cooldownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    // authStore's actual method is confirmSignUp (not verifyCode — that name
    // doesn't exist on the store and previously caused this screen to throw
    // on submit). There's also no logInUser on the store; removed.
    const { confirmSignUp, resendCode, unverifiedEmail, isLoading, error } = useAuthStore();

    // Clean up the interval on unmount so it doesn't keep ticking after the
    // user navigates away.
    useEffect(() => {
        return () => {
            if (cooldownInterval.current) clearInterval(cooldownInterval.current);
        };
    }, []);

    const startCooldown = () => {
        setCooldown(RESEND_COOLDOWN_SECONDS);
        cooldownInterval.current = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    if (cooldownInterval.current) clearInterval(cooldownInterval.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleVerification = async () => {
        if (code.trim().length !== 6) {
            Alert.alert('Invalid Code', 'Please enter the full 6-digit verification code sent to your email.');
            return;
        }

        try {
            const success = await confirmSignUp(code.trim());
            if (success) {
                Alert.alert(
                    'Account Verified!',
                    'Your Crowdy account is active. Please log in to continue.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                router.push("/(auth)/sign-in" as any);
                            }
                        }
                    ]
                );
            }
        } catch (err: any) {
            console.error('Verification failure:', err);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0 || isResending) return;

        setIsResending(true);
        try {
            const success = await resendCode();
            if (success) {
                Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
                startCooldown();
            }
        } catch (err: any) {
            console.error('Resend code failure:', err);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.innerContainer}>
                    <View style={styles.headerBlock}>
                        <Text style={styles.title}>Verify Your Email</Text>
                        <Text style={styles.subtitle}>
                            We sent a 6-digit confirmation security code to:
                        </Text>
                        <Text style={styles.emailHighlight}>
                            {unverifiedEmail ?? 'your registered email address'}
                        </Text>
                    </View>

                    {error && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.otpInput}
                            placeholder="000000"
                            placeholderTextColor="#999"
                            maxLength={6}
                            keyboardType="number-pad"
                            textContentType="oneTimeCode"
                            value={code}
                            onChangeText={setCode}
                            editable={!isLoading}
                            autoFocus
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.verifyButton, isLoading && styles.disabledButton]}
                        onPress={() => { void handleVerification(); }}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.buttonText}>Confirm Account</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.resendButton}
                        onPress={() => { void handleResend(); }}
                        disabled={cooldown > 0 || isResending}
                    >
                        {isResending ? (
                            <ActivityIndicator size="small" color="#5C4033" />
                        ) : (
                            <Text style={[styles.resendButtonText, cooldown > 0 && styles.resendButtonTextDisabled]}>
                                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn't get a code? Resend"}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.push("/(auth)/sign-in" as any)}
                        disabled={isLoading}
                    >
                        <Text style={styles.backButtonText}>Back to Login</Text>
                    </TouchableOpacity>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    innerContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 28,
    },
    headerBlock: {
        marginBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    emailHighlight: {
        fontSize: 15,
        fontWeight: '600',
        color: '#5C4033',
        marginTop: 4,
        textAlign: 'center',
    },
    errorBox: {
        backgroundColor: '#FFEBEA',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FFC1C0',
    },
    errorText: {
        color: '#D9383A',
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
    inputContainer: {
        marginBottom: 24,
        alignItems: 'center',
    },
    otpInput: {
        backgroundColor: '#FFF',
        width: '80%',
        height: 60,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 8,
        color: '#1A1A1A',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    verifyButton: {
        backgroundColor: '#5C4033',
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#5C4033',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: '#C4A484',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    resendButton: {
        marginTop: 20,
        alignItems: 'center',
        minHeight: 20,
        justifyContent: 'center',
    },
    resendButtonText: {
        color: '#5C4033',
        fontSize: 14,
        fontWeight: '600',
    },
    resendButtonTextDisabled: {
        color: '#9CA3AF',
        fontWeight: '500',
    },
    backButton: {
        marginTop: 16,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
    },
});