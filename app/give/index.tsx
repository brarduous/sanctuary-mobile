import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Layout, Typography } from '@/constants/Layout';
import { useAuth } from '@/context/AuthContext';
import ScreenState from '@/components/ScreenState';
import { fetchGivingStatus, createGivingCheckout } from '@/lib/api';
import { Stack } from 'expo-router';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Building, Globe, Heart, Lock } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    InputAccessoryView, Keyboard,
    KeyboardAvoidingView, Platform,
    ScrollView,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';

export default function GiveScreen() {
    const { userCongregationId, loading: authLoading } = useAuth();
    const theme = Colors[useColorScheme() ?? 'light'];
    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight();

    const [isGivingEnabled, setIsGivingEnabled] = useState(false);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);
    const [statusError, setStatusError] = useState(false);
    const [attempt, setAttempt] = useState(0);

    // Form State
    const [amount, setAmount] = useState('');
    const [selectedFund, setSelectedFund] = useState('General');
    const [isProcessing, setIsProcessing] = useState(false);
    const checkoutInFlight = useRef(false);

    const FUNDS = [
        { id: 'General', label: 'General Fund', icon: Building },
        { id: 'Missions', label: 'Missions', icon: Globe },
        { id: 'Benevolence', label: 'Benevolence', icon: Heart },
    ];

    useEffect(() => {
        if (authLoading) return;
        let active = true;
        setStatusError(false);
        setIsGivingEnabled(false);
        setIsLoadingStatus(!!userCongregationId);
        if (userCongregationId) {
            void fetchGivingStatus(userCongregationId).then(enabled => {
                if (active) setIsGivingEnabled(enabled);
            }).catch(() => {
                if (active) setStatusError(true);
            }).finally(() => {
                if (active) setIsLoadingStatus(false);
            });
        }
        return () => { active = false; };
    }, [authLoading, userCongregationId, attempt]);

    const handleGive = async () => {
        if (checkoutInFlight.current || !userCongregationId) return;
        const numAmount = Number(amount);
        if (!Number.isFinite(numAmount) || numAmount < 1) {
            Alert.alert("Invalid Amount", "Please enter an amount of $1.00 or more.");
            return;
        }

        checkoutInFlight.current = true;
        setIsProcessing(true);
        try {
            const url = await createGivingCheckout(numAmount, selectedFund, userCongregationId);
            await WebBrowser.openBrowserAsync(url, {
                presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
                toolbarColor: theme.background,
                controlsColor: theme.tint
            });
            // Closing the browser does not prove payment; preserve the gift for retry.
        } catch (error) {
            Alert.alert("Error", "Check your connection and try again.");
        } finally {
            checkoutInFlight.current = false;
            setIsProcessing(false);
        }
    };

    const canContinue = Number.isFinite(Number(amount)) && Number(amount) >= 1 && !isProcessing;

    // --- RENDER BLOCKS ---

    if (authLoading || isLoadingStatus || statusError || !userCongregationId || !isGivingEnabled) {
        return <View style={{ flex: 1, backgroundColor: theme.background }}>
            <Stack.Screen options={{ title: 'Give' }} />
            {authLoading || isLoadingStatus ? <ScreenState title="Loading giving" loading /> :
                statusError ? <ScreenState title="Giving unavailable" message="We couldn’t check your church’s giving options. Please try again." onRetry={() => setAttempt(value => value + 1)} /> :
                !userCongregationId ? <ScreenState title="Connect to a church" message="Join your church to see its giving options." /> :
                <ScreenState title="Giving isn’t available yet" message="Your church hasn’t enabled digital giving. Please check back later." />}
        </View>;
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={headerHeight}
            style={{ flex: 1, backgroundColor: theme.background }}
        >
            <Stack.Screen options={{ title: 'Give' }} />

            <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ padding: 20, paddingTop: 24 }}>

                <Text style={{ color: theme.mutedForeground, textAlign: 'center', fontSize: 13, fontWeight: '600', marginBottom: 24 }}>
                    Tithes & Offerings
                </Text>

                {/* Amount Input */}
                <View className="items-center mb-10">
                    <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: theme.border, paddingBottom: 8 }}>
                        <Text style={{ fontSize: 36, color: theme.mutedForeground, marginRight: 8 }}>$</Text>
                        <TextInput
                            value={amount}
                            onChangeText={text => setAmount(text.replace(/[^0-9.]/g, ''))}
                            keyboardType="decimal-pad"
                            inputAccessoryViewID={Platform.OS === 'ios' ? 'giving-amount-accessory' : undefined}
                            returnKeyType="done"
                            onSubmitEditing={() => Keyboard.dismiss()}
                            placeholder="0.00"
                            placeholderTextColor={theme.mutedForeground}
                            accessibilityLabel="Gift amount in dollars"
                            style={{ fontSize: 52, fontWeight: '700', color: theme.text, minWidth: 120, textAlign: 'center' }}
                        />
                    </View>
                    <Text style={{ ...Typography.helper, color: amount && !Number.isFinite(Number(amount)) ? theme.error : theme.mutedForeground, marginTop: 12, textAlign: 'center' }}>{amount && !Number.isFinite(Number(amount)) ? 'Enter a valid dollar amount.' : 'Gifts start at $1.00 USD.'}</Text>
                </View>

                <Text accessibilityRole="header" style={{ color: theme.text, fontWeight: '600', fontSize: 16, marginBottom: 12 }}>Designated Fund</Text>

                {/* Fund Selector */}
                <View className="space-y-3 mb-8">
                    {FUNDS.map((fund) => {
                        const isSelected = selectedFund === fund.id;
                        const Icon = fund.icon;
                        return (
                            <TouchableOpacity
                                key={fund.id}
                                onPress={() => setSelectedFund(fund.id)}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: isSelected }}
                                style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: isSelected ? theme.tint : theme.border, backgroundColor: isSelected ? theme.selection : theme.card, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 }}
                            >
                                <View style={{ padding: 10, borderRadius: 24, backgroundColor: isSelected ? theme.tint : theme.muted }}>
                                    <Icon size={18} color={isSelected ? theme.onTint : theme.text} />
                                </View>
                                <Text style={{ color: theme.text, fontWeight: '600', fontSize: 16, flex: 1 }}>
                                    {fund.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View className="flex-row items-center justify-center gap-2 mb-12">
                    <Lock size={12} color={theme.mutedForeground} />
                    <Text style={{ color: theme.mutedForeground, fontSize: 13, lineHeight: 20, flexShrink: 1 }}>Continue to secure checkout to review your gift.</Text>
                </View>

            </ScrollView>

            {/* Sticky Give Button */}
            <View style={{ padding: 20, paddingBottom: Math.max(insets.bottom, 12), borderTopWidth: 1, borderColor: theme.border, backgroundColor: theme.background }}>
                <TouchableOpacity
                    onPress={handleGive}
                    disabled={!canContinue}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !canContinue, busy: isProcessing }}
                    style={{ minHeight: Layout.actionHeight, paddingHorizontal: 16, paddingVertical: 12, borderRadius: Layout.controlRadius, alignItems: 'center', justifyContent: 'center', backgroundColor: canContinue || isProcessing ? theme.action : theme.disabled }}
                >
                    {isProcessing ? <ActivityIndicator color={theme.onAction} /> :
                        <Text style={{ ...Typography.action, color: canContinue ? theme.onAction : theme.onDisabled, textAlign: 'center' }}>{amount && Number.isFinite(Number(amount)) ? `Continue with $${Number(amount).toFixed(2)}` : 'Continue to checkout'}</Text>}
                </TouchableOpacity>
            </View>

            {Platform.OS === 'ios' && <InputAccessoryView nativeID="giving-amount-accessory" backgroundColor={theme.background}>
                <View style={{ borderTopWidth: 1, borderColor: theme.border, alignItems: 'flex-end', backgroundColor: theme.background }}>
                    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Done entering amount" onPress={() => Keyboard.dismiss()} style={{ minHeight: 44, paddingHorizontal: 20, justifyContent: 'center' }}>
                        <Text style={{ color: theme.tint, fontWeight: '600', fontSize: 16 }}>Done</Text>
                    </TouchableOpacity>
                </View>
            </InputAccessoryView>}

        </KeyboardAvoidingView>
    );
}
