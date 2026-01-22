import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useRevenueCat } from '@/context/RevenueCatContext';
import { updateUserProfile } from '@/lib/api';
import { Stack, useRouter } from 'expo-router';
import {
    Bell,
    ChevronRight,
    Crown,
    LogOut,
    Mail,
    Moon,
    Settings,
    Shield,
    Sparkles,
    Sun,
    Trash2,
    User
} from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const { user, profile, signOut, refreshProfile } = useAuth();
    const { isPro, customerInfo } = useRevenueCat();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(profile?.full_name || '');
    const [isSaving, setIsSaving] = useState(false);

    // Placeholder settings state
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const handleSignOut = async () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Sign Out", 
                    style: "destructive",
                    onPress: async () => {
                        await signOut();
                        router.replace('/(tabs)');
                    }
                }
            ]
        );
    };

    const handleSaveProfile = async () => {
        if (!user || isSaving) return;
        setIsSaving(true);
        const result = await updateUserProfile(user.id, { full_name: editName });
        if (result) {
            await refreshProfile();
            setIsEditing(false);
        } else {
            Alert.alert("Error", "Failed to update profile.");
        }
        setIsSaving(false);
    };

    const SettingItem = ({ icon: Icon, label, value, onPress, isDestructive = false }: any) => (
        <Pressable 
            onPress={onPress}
            style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                backgroundColor: theme.background
            })}
            className="flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800"
        >
            <View className="flex-row items-center gap-3">
                <View className={`p-2 rounded-full ${isDestructive ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    <Icon size={20} color={isDestructive ? '#ef4444' : theme.text} />
                </View>
                <Text className={`text-base font-medium ${isDestructive ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>
                    {label}
                </Text>
            </View>
            <View className="flex-row items-center gap-2">
                {value && <Text className="text-gray-500 text-sm">{value}</Text>}
                <ChevronRight size={20} color={Colors.gray} />
            </View>
        </Pressable>
    );

    if (!user) {
        return null; // Layout handles redirect
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            <Stack.Screen options={{ headerShown: false }} />
            
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-2 mb-4">
                <Pressable onPress={() => router.back()} className="p-2 -ml-2">
                    <Text style={{ color: theme.tint, fontSize: 16 }}>Back</Text>
                </Pressable>
                <Text className="text-lg font-bold" style={{ color: theme.text }}>Profile & Settings</Text>
                <Pressable 
                    onPress={() => isEditing ? handleSaveProfile() : setIsEditing(!isEditing)} 
                    disabled={isSaving}
                    className="p-2 -mr-2"
                >
                    {isSaving ? (
                        <ActivityIndicator size="small" color={theme.tint} />
                    ) : (
                        <Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>
                            {isEditing ? 'Save' : 'Edit'}
                        </Text>
                    )}
                </Pressable>
            </View>

            <ScrollView className="flex-1 px-4">
                {/* Profile Card */}
                <View className="items-center mb-8">
                    <View className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full items-center justify-center mb-4 overflow-hidden">
                        {profile?.avatar_url ? (
                            <Image 
                                source={{ uri: profile.avatar_url }} 
                                style={{ width: 96, height: 96 }}
                            />
                        ) : (
                            <User size={40} color={Colors.gray} />
                        )}
                        {isPro && (
                            <View className="absolute bottom-0 right-0 bg-amber-400 rounded-full p-1.5 border-2 border-white dark:border-black">
                                <Crown size={12} color="white" fill="white" />
                            </View>
                        )}
                    </View>
                    
                    {isEditing ? (
                        <TextInput
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Full Name"
                            placeholderTextColor={Colors.gray}
                            style={{ 
                                fontSize: 24, 
                                fontWeight: 'bold', 
                                color: theme.text, 
                                borderBottomWidth: 1, 
                                borderBottomColor: theme.tint,
                                paddingBottom: 4,
                                textAlign: 'center',
                                minWidth: 200
                            }}
                        />
                    ) : (
                        <Text className="text-2xl font-bold mb-1" style={{ color: theme.text }}>
                            {profile?.full_name || 'Sanctuary User'}
                        </Text>
                    )}
                    
                    <Text className="text-gray-500 mb-4">{user?.email}</Text>
                    
                    {!isPro && (
                        <Pressable 
                            onPress={() => router.push('/paywall')}
                            className="bg-amber-100 dark:bg-amber-900/30 px-4 py-2 rounded-full flex-row items-center gap-2"
                        >
                            <Sparkles size={16} color="#d97706" />
                            <Text className="font-bold text-amber-700 dark:text-amber-500">Upgrade to Pro</Text>
                        </Pressable>
                    )}
                </View>

                {/* Subscription Section */}
                <View className="mb-8">
                    <Text className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Subscription</Text>
                    <View className="bg-white dark:bg-gray-900 rounded-xl px-4 border border-gray-100 dark:border-gray-800">
                        <Pressable 
                            onPress={() => router.push('/paywall')}
                            className="flex-row items-center justify-between py-4"
                        >
                            <View className="flex-row items-center gap-3">
                                <View className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                                    <Crown size={20} color="#d97706" />
                                </View>
                                <View>
                                    <Text className="text-base font-medium" style={{ color: theme.text }}>Sanctuary Pro</Text>
                                    <Text className="text-sm text-gray-500">{isPro ? 'Active' : 'Not Active'}</Text>
                                </View>
                            </View>
                            <Text style={{ color: theme.tint }}>{isPro ? 'Manage' : 'Upgrade'}</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Settings Section */}
                <View className="mb-8">
                    <Text className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Settings</Text>
                    <View className="bg-white dark:bg-gray-900 rounded-xl px-4 border border-gray-100 dark:border-gray-800">
                        <View className="flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800">
                            <View className="flex-row items-center gap-3">
                                <View className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                                    <Bell size={20} color={theme.text} />
                                </View>
                                <Text className="text-base font-medium" style={{ color: theme.text }}>Notifications</Text>
                            </View>
                            <Switch 
                                value={notificationsEnabled} 
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: '#767577', true: theme.tint }}
                            />
                        </View>
                        
                        <View className="flex-row items-center justify-between py-4">
                            <View className="flex-row items-center gap-3">
                                <View className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                                    {colorScheme === 'dark' ? <Moon size={20} color={theme.text} /> : <Sun size={20} color={theme.text} />}
                                </View>
                                <Text className="text-base font-medium" style={{ color: theme.text }}>Appearance</Text>
                            </View>
                            <Text className="text-gray-500 capitalize">{colorScheme}</Text>
                        </View>
                    </View>
                </View>

                {/* Support Section */}
                <View className="mb-8">
                    <Text className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Support</Text>
                    <View className="bg-white dark:bg-gray-900 rounded-xl px-4 border border-gray-100 dark:border-gray-800">
                        <SettingItem icon={Mail} label="Contact Support" onPress={() => {}} />
                        <SettingItem icon={Shield} label="Privacy Policy" onPress={() => {}} />
                        <SettingItem icon={Settings} label="Terms of Service" onPress={() => {}} />
                    </View>
                </View>

                {/* Account Actions */}
                <View className="mb-12">
                    <View className="bg-white dark:bg-gray-900 rounded-xl px-4 border border-gray-100 dark:border-gray-800">
                        <SettingItem 
                            icon={LogOut} 
                            label="Sign Out" 
                            onPress={handleSignOut} 
                            isDestructive 
                        />
                        <View className="h-[1px] bg-gray-100 dark:bg-gray-800" />
                        <SettingItem 
                            icon={Trash2} 
                            label="Delete Account" 
                            onPress={() => Alert.alert("Delete Account", "This action cannot be undone. Please contact support to delete your account.")} 
                            isDestructive 
                        />
                    </View>
                    <Text className="text-center text-gray-400 text-xs mt-6">
                        Version 1.0.0 (Build 100)
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
