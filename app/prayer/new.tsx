import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { submitPrayerRequest } from '@/lib/api';
import { Stack, useRouter } from 'expo-router';
import { CheckCircle2, Globe, ShieldCheck, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, ScrollView,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- CRITICAL IMPORT FOR THE MIC BUTTON ---
import AudioMicButton from '@/components/AudioMicButton';

type VisibilityTier = 'public_anonymous' | 'congregation' | 'pastor';

export default function NewPrayerScreen() {
    const router = useRouter();
    const { user, userCongregationId } = useAuth(); 
    const theme = Colors[useColorScheme() ?? 'light'];
    const insets = useSafeAreaInsets();

    const [requestText, setRequestText] = useState('');
    const [visibility, setVisibility] = useState<VisibilityTier>(userCongregationId ? 'congregation' : 'public_anonymous');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, (event) => {
            setKeyboardHeight(event.endCoordinates?.height ?? 0);
        });

        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const footerBasePadding = Math.max(insets.bottom, 12);
    const footerKeyboardOffset = Platform.OS === 'android' ? keyboardHeight : 0;
    const footerHeightEstimate = 92;

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

    const VisibilityCard = ({ 
        tier, title, description, icon: Icon, disabled = false 
    }: { 
        tier: VisibilityTier; title: string; description: string; icon: any; disabled?: boolean;
    }) => {
        const isSelected = visibility === tier;
        
        return (
            <TouchableOpacity 
                activeOpacity={0.8}
                disabled={disabled}
                onPress={() => setVisibility(tier)}
                className={`p-4 mb-3 rounded-2xl border-2 flex-row items-start gap-4 transition-all ${
                    disabled ? 'opacity-40 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50' :
                    isSelected 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B]'
                }`}
            >
                <View className={`p-3 rounded-full mt-1 ${isSelected ? 'bg-indigo-500' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <Icon size={20} color={isSelected ? 'white' : theme.text} />
                </View>
                <View className="flex-1">
                    <Text className={`font-bold text-base mb-1 ${isSelected ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-900 dark:text-white'}`}>
                        {title}
                    </Text>
                    <Text className={`text-xs leading-tight ${isSelected ? 'text-indigo-700/80 dark:text-indigo-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                        {description}
                    </Text>
                </View>
                {isSelected && (
                    <View className="absolute top-4 right-4">
                        <CheckCircle2 size={20} color="#6366f1" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, backgroundColor: theme.background }}
        >
            <Stack.Screen options={{ title: 'Share a Prayer Need', headerBackTitle: 'Back' }} />
            
            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    padding: 20,
                    paddingBottom: footerHeightEstimate + footerBasePadding + 20,
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
                        placeholderTextColor="#94A3B8"
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
                                tintColor="#6366f1" // Indigo to match the selected state
                            />
                            <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                                {requestText.length > 0 ? `${requestText.length} chars` : 'Hold to record'}
                            </Text>
                        </View>
                    </View>
                </View>

                <Text className="font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider text-xs">
                    Who should see this?
                </Text>

                <VisibilityCard 
                    tier="pastor"
                    title="To My Pastor (Private)"
                    description="Shared only with the pastoral team. Your name will be attached so they can follow up and care for you."
                    icon={ShieldCheck}
                    disabled={!userCongregationId}
                />

                <VisibilityCard 
                    tier="congregation"
                    title="To My Church Family"
                    description="Shared with your local church's prayer wall. Your name will be visible so your church family can support you."
                    icon={Users}
                    disabled={!userCongregationId}
                />

                <VisibilityCard 
                    tier="public_anonymous"
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
                className="px-5 pt-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-black"
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: footerKeyboardOffset,
                    paddingBottom: footerBasePadding,
                }}
            >
                <TouchableOpacity 
                    onPress={handleSubmit}
                    disabled={isSubmitting || !requestText.trim()}
                    className={`p-4 rounded-xl items-center flex-row justify-center shadow-lg ${
                        isSubmitting || !requestText.trim() ? 'bg-indigo-400' : 'bg-indigo-600'
                    }`}
                >
                    {isSubmitting ? (
                        <>
                            <ActivityIndicator color="white" className="mr-2" />
                            <Text className="text-white font-bold text-lg">Submitting...</Text>
                        </>
                    ) : (
                        <Text className="text-white font-bold text-lg">Share Prayer Request</Text>
                    )}
                </TouchableOpacity>
            </View>

        </KeyboardAvoidingView>
    );
}