import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { submitPrayerRequest } from '@/lib/api';
import { Stack, useRouter } from 'expo-router';
import { CheckCircle2, Globe, ShieldCheck, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { useHeaderHeight } from '@react-navigation/elements';
import {
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- CRITICAL IMPORT FOR THE MIC BUTTON ---
import AudioMicButton from '@/components/AudioMicButton';

type VisibilityTier = 'public_anonymous' | 'congregation' | 'pastor';

function VisibilityCard({ tier, title, description, icon: Icon, disabled = false, selected, theme, onSelect }: {
    tier: VisibilityTier; title: string; description: string; icon: typeof Users; disabled?: boolean;
    selected: boolean; theme: typeof Colors.light; onSelect: (tier: VisibilityTier) => void;
}) {
    return <TouchableOpacity
        activeOpacity={0.8}
        accessibilityRole="radio"
        accessibilityState={{ selected, disabled }}
        disabled={disabled}
        onPress={() => onSelect(tier)}
        style={{ padding: 16, marginBottom: 12, borderRadius: 16, borderWidth: 1, borderColor: selected ? theme.tint : theme.border, backgroundColor: selected ? theme.accentSoft : theme.card, opacity: disabled ? 0.45 : 1, flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}
    >
        <View style={{ padding: 12, borderRadius: 24, marginTop: 4, backgroundColor: selected ? theme.tint : theme.muted }}><Icon size={20} color={selected ? theme.onTint : theme.text} /></View>
        <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', marginBottom: 6, paddingRight: selected ? 24 : 0 }}>{title}</Text>
            <Text style={{ color: theme.mutedForeground, fontSize: 13, lineHeight: 20 }}>{description}</Text>
        </View>
        {selected ? <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', top: 16, right: 16 }}><CheckCircle2 size={20} color={theme.tint} /></View> : null}
    </TouchableOpacity>;
}

export default function NewPrayerScreen() {
    const router = useRouter();
    const { userCongregationId } = useAuth();
    const theme = Colors[useColorScheme() ?? 'light'];
    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight();

    const [requestText, setRequestText] = useState('');
    const [visibility, setVisibility] = useState<VisibilityTier>(userCongregationId ? 'congregation' : 'public_anonymous');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const footerBasePadding = Math.max(insets.bottom, 12);

    const handleSubmit = async () => {
        if (!requestText.trim()) {
            setError("Please write a prayer request before submitting.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await submitPrayerRequest({
                requestText: requestText.trim(),
                visibility,
                congregationId: userCongregationId
            });

            router.back();
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={headerHeight}
            style={{ flex: 1, backgroundColor: theme.background }}
        >
            <Stack.Screen options={{ title: 'Share a Prayer Need', headerBackTitle: 'Back' }} />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    padding: 20,
                    paddingBottom: 20,
                }}
                keyboardShouldPersistTaps="handled"
            >

                {error && (
                    <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl mb-6">
                        <Text className="text-red-600 dark:text-red-400 font-medium text-sm">{error}</Text>
                    </View>
                )}

                <Text className="font-serif text-2xl font-bold dark:text-white mb-2">How can we pray for you?</Text>
                <Text className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                    God cares about the details of your life. Share your burden so others can carry it with you.
                </Text>

                {/* --- INPUT & MIC BUTTON CARD (Mirrored from index.tsx) --- */}
                <View
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-8 shadow-sm"
                    style={{ backgroundColor: theme.card || '#FFFFFF' }}
                >
                    <TextInput
                        multiline
                        numberOfLines={4}
                        placeholder="Type or hold the mic to speak..."
                        placeholderTextColor={theme.mutedForeground}
                        value={requestText}
                        onChangeText={setRequestText}
                        editable={!isSubmitting}
                        className="p-4 min-h-[120px] text-base"
                        style={{ color: theme.text }}
                        textAlignVertical="top"
                    />

                    {/* Footer Controls */}
                    <View className="flex-row justify-between items-center p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        <View className="flex-row items-center gap-3">
                            <AudioMicButton
                                onTranscription={(text) => setRequestText((prev) => prev ? prev + ' ' + text : text)}
                                tintColor={theme.tint}
                                accessibilityLabel="Hold to record your prayer request"
                                disabled={isSubmitting}
                            />
                            <Text style={{ color: theme.mutedForeground, fontSize: 13 }}>
                                Hold to record
                            </Text>
                        </View>
                    </View>
                </View>

                <Text className="font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider text-xs">
                    Who should see this?
                </Text>

                <VisibilityCard
                    tier="pastor"
                    selected={visibility === 'pastor'} theme={theme} onSelect={setVisibility}
                    title="To My Pastor (Private)"
                    description="Shared only with the pastoral team. Your name will be attached so they can follow up and care for you."
                    icon={ShieldCheck}
                    disabled={!userCongregationId}
                />

                <VisibilityCard
                    tier="congregation"
                    selected={visibility === 'congregation'} theme={theme} onSelect={setVisibility}
                    title="To My Church Family"
                    description="Shared with your local church's prayer wall. Your name will be visible so your church family can support you."
                    icon={Users}
                    disabled={!userCongregationId}
                />

                <VisibilityCard
                    tier="public_anonymous"
                    selected={visibility === 'public_anonymous'} theme={theme} onSelect={setVisibility}
                    title="To The Public (Anonymous)"
                    description="Shared globally. Your name and photo will be hidden. Anyone on the app can pray for this."
                    icon={Globe}
                />

                {!userCongregationId && (
                    <Text className="text-xs text-center text-amber-600 dark:text-amber-500 mt-2 px-4">
                        Join a digital congregation to share named requests with your local church and pastor.
                    </Text>
                )}

            </ScrollView>

            {/* Sticky Submit Button */}
            <View
                className="px-5 pt-4 border-t"
                style={{
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    paddingBottom: footerBasePadding,
                }}
            >
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting || !requestText.trim()}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isSubmitting || !requestText.trim(), busy: isSubmitting }}
                    className="p-4 rounded-xl items-center flex-row justify-center"
                    style={{ minHeight: 52, backgroundColor: theme.action, opacity: isSubmitting || !requestText.trim() ? 0.45 : 1 }}
                >
                    {isSubmitting ? (
                        <>
                            <ActivityIndicator color={theme.onAction} className="mr-2" />
                            <Text className="font-bold text-lg" style={{ color: theme.onAction }}>Submitting...</Text>
                        </>
                    ) : (
                        <Text className="font-bold text-lg" style={{ color: theme.onAction }}>Share Prayer Request</Text>
                    )}
                </TouchableOpacity>
            </View>

        </KeyboardAvoidingView>
    );
}
