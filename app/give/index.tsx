import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Building, CreditCard, Globe, Heart, Lock, ShieldAlert } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView, Platform,
    ScrollView,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';

export default function GiveScreen() {
    const { user, userCongregationId } = useAuth();
    const theme = Colors[useColorScheme() ?? 'light'];

    const [isGivingEnabled, setIsGivingEnabled] = useState(false);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);
    
    // Form State
    const [amount, setAmount] = useState('');
    const [selectedFund, setSelectedFund] = useState('General');
    const [isProcessing, setIsProcessing] = useState(false);

    const FUNDS = [
        { id: 'General', label: 'General Fund', icon: Building },
        { id: 'Missions', label: 'Missions', icon: Globe },
        { id: 'Benevolence', label: 'Benevolence', icon: Heart },
    ];

    useEffect(() => {
        if (userCongregationId) checkGivingStatus();
        else setIsLoadingStatus(false);
    }, [userCongregationId]);

    const checkGivingStatus = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/stripe/status/${userCongregationId}/public`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            const data = await res.json();
            setIsGivingEnabled(data.isGivingEnabled);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingStatus(false);
        }
    };

    const handleGive = async () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount < 1) {
            Alert.alert("Invalid Amount", "Please enter an amount of $1.00 or more.");
            return;
        }

        setIsProcessing(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/stripe/checkout`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    amount: numAmount,
                    fund: selectedFund,
                    congregationId: userCongregationId
                })
            });

            const data = await res.json();
            
            if (res.ok && data.url) {
                // Open Stripe Checkout securely in an in-app browser
                await WebBrowser.openBrowserAsync(data.url, {

                    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
                    toolbarColor: theme.background,
                    controlsColor: '#6366f1'
                });
                
                // Reset amount after they close the browser
                setAmount('');
            } else {
                Alert.alert("Error", data.error || "Could not process transaction at this time.");
            }
        } catch (error) {
            Alert.alert("Error", "Check your connection and try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    // --- RENDER BLOCKS ---

    if (isLoadingStatus) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    if (!userCongregationId) {
        return (
            <View className="flex-1 justify-center items-center p-8 bg-white dark:bg-black">
                <Stack.Screen options={{ title: 'Give' }} />
                <ShieldAlert size={48} color={theme.text} className="mb-4 opacity-20" />
                <Text className="text-xl font-bold dark:text-white mb-2 text-center">Connect to a Church</Text>
                <Text className="text-gray-500 text-center text-sm leading-relaxed">You must join a digital congregation to tithe and view your giving history.</Text>
            </View>
        );
    }

    if (!isGivingEnabled) {
        return (
            <View className="flex-1 justify-center items-center p-8 bg-white dark:bg-black">
                <Stack.Screen options={{ title: 'Give' }} />
                <CreditCard size={48} color={theme.text} className="mb-4 opacity-20" />
                <Text className="text-xl font-bold dark:text-white mb-2 text-center">Not Setup Yet</Text>
                <Text className="text-gray-500 text-center text-sm leading-relaxed">Your church has not configured digital giving yet. Please check back later.</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: theme.background }}
        >
            <Stack.Screen options={{ title: 'Give' }} />
            
            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingTop: 40 }}>
                
                <Text className="text-center text-gray-500 dark:text-gray-400 font-medium tracking-widest uppercase text-xs mb-8">
                    Tithes & Offerings
                </Text>

                {/* Amount Input */}
                <View className="items-center mb-10">
                    <View className="flex-row items-center border-b-2 border-indigo-200 dark:border-indigo-900 pb-2">
                        <Text className="text-4xl font-bold text-gray-400 dark:text-gray-600 mr-2">$</Text>
                        <TextInput
                            value={amount}
                            onChangeText={text => setAmount(text.replace(/[^0-9.]/g, ''))}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor={theme.text === '#FFFFFF' ? '#475569' : '#CBD5E1'}
                            className="text-6xl font-bold text-gray-900 dark:text-white min-w-[120px] text-center"
                            autoFocus
                        />
                    </View>
                </View>

                <Text className="font-bold text-gray-900 dark:text-white mb-3 text-sm">Designated Fund</Text>
                
                {/* Fund Selector */}
                <View className="space-y-3 mb-8">
                    {FUNDS.map((fund) => {
                        const isSelected = selectedFund === fund.id;
                        const Icon = fund.icon;
                        return (
                            <TouchableOpacity
                                key={fund.id}
                                onPress={() => setSelectedFund(fund.id)}
                                className={`p-4 rounded-2xl border-2 flex-row items-center gap-4 transition-all ${
                                    isSelected 
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E293B]'
                                }`}
                            >
                                <View className={`p-2 rounded-full ${isSelected ? 'bg-indigo-500' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                    <Icon size={18} color={isSelected ? 'white' : theme.text} />
                                </View>
                                <Text className={`font-bold text-base flex-1 ${isSelected ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-900 dark:text-white'}`}>
                                    {fund.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View className="flex-row items-center justify-center gap-2 mb-12">
                    <Lock size={12} color="#64748b" />
                    <Text className="text-xs text-gray-500 font-medium">Securely processed by Stripe. 508(c)(1)(a) Compliant.</Text>
                </View>

            </ScrollView>

            {/* Sticky Give Button */}
            <View className="p-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-black">
                <TouchableOpacity 
                    onPress={handleGive}
                    disabled={isProcessing || !amount}
                    className={`p-4 rounded-xl items-center flex-row justify-center shadow-lg ${
                        isProcessing || !amount ? 'bg-indigo-400' : 'bg-indigo-600'
                    }`}
                >
                    {isProcessing ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">
                            Give ${parseFloat(amount || '0').toFixed(2)}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

        </KeyboardAvoidingView>
    );
}