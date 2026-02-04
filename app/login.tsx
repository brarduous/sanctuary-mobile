import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { logActivityEvent } from '@/lib/activityLogger';
import { useRouter } from 'expo-router';
import { BookOpen, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Platform,
    Pressable,
    Animated as RNAnimated,
    StatusBar,
    Text,
    View
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Spiritual Guidance',
        description: 'Receive personalized, biblical advice for your daily walk with God.',
        icon: Sparkles,
        color: '#4F46E5', // Indigo
    },
    {
        id: '2',
        title: 'Daily Devotionals',
        description: 'Start your day with scripture, prayer, and reflection tailored to you.',
        icon: BookOpen,
        color: '#059669', // Emerald
    },
    {
        id: '3',
        title: 'Christian News',
        description: 'Stay informed with faith-based analysis of current events.',
        icon: HeartHandshake,
        color: '#D97706', // Amber
    },
    {
        id: '4',
        title: 'Private & Secure',
        description: 'Your spiritual journey is personal. We protect your privacy.',
        icon: ShieldCheck,
        color: '#DC2626', // Red
    },
];

export default function LoginScreen() {
    const { signInWithGoogle, signInWithApple, loading } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    useEffect(() => {
        void logActivityEvent({ activityType: 'login_screen_viewed', description: 'Login screen mounted' });
    }, []);

    // Slider Logic
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new RNAnimated.Value(0)).current;

    const viewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const handleApplePress = async () => {
        void logActivityEvent({ activityType: 'login_apple_pressed' });
        await signInWithApple();
    };

    const handleGooglePress = async () => {
        void logActivityEvent({ activityType: 'login_google_pressed' });
        await signInWithGoogle();
    };

    const renderItem = ({ item }: { item: typeof SLIDES[0] }) => {
        const Icon = item.icon;
        return (
            <View style={{ width, alignItems: 'center', paddingHorizontal: 40, paddingTop: 80 }}>
                <View
                    style={{
                        width: 120,
                        height: 120,
                        borderRadius: 60,
                        backgroundColor: item.color + '20',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 40
                    }}
                >
                    <Icon size={64} color={item.color} />
                </View>

                <Text
                    style={{
                        fontSize: 32,
                        fontWeight: '800',
                        color: theme.text,
                        textAlign: 'center',
                        marginBottom: 16,
                        fontFamily: Platform.select({ ios: 'Serif', android: 'serif' })
                    }}
                >
                    {item.title}
                </Text>

                <Text
                    style={{
                        fontSize: 18,
                        color: Colors.gray,
                        textAlign: 'center',
                        lineHeight: 28
                    }}
                >
                    {item.description}
                </Text>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Carousel Section */}
            <View style={{ flex: 2 }}>
                <FlatList
                    data={SLIDES}
                    renderItem={renderItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={(item) => item.id}
                    onScroll={RNAnimated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                        useNativeDriver: false,
                    })}
                    scrollEventThrottle={32}
                    onViewableItemsChanged={viewableItemsChanged}
                    viewabilityConfig={viewConfig}
                />

                {/* Paginator */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', height: 64 }}>
                    {SLIDES.map((_, i) => {
                        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                        const dotWidth = scrollX.interpolate({
                            inputRange,
                            outputRange: [10, 20, 10],
                            extrapolate: 'clamp',
                        });
                        const opacity = scrollX.interpolate({
                            inputRange,
                            outputRange: [0.3, 1, 0.3],
                            extrapolate: 'clamp',
                        });

                        return (
                            <RNAnimated.View
                                style={{
                                    height: 10,
                                    width: dotWidth,
                                    borderRadius: 5,
                                    backgroundColor: theme.tint,
                                    marginHorizontal: 8,
                                    opacity
                                }}
                                key={i.toString()}
                            />
                        );
                    })}
                </View>
            </View>

            {/* Auth Section */}
            <Animated.View
                entering={FadeInUp.delay(300).springify()}
                style={{
                    flex: 1,
                    backgroundColor: theme.background,
                    paddingHorizontal: 24,
                    paddingBottom: 40,
                    justifyContent: 'center',
                    gap: 16
                }}
            >
                {loading ? (
                    <View style={{ alignItems: 'center', justifyContent: 'center', height: 100 }}>
                        <ActivityIndicator size="large" color={theme.tint} />
                        <Text style={{ marginTop: 12, color: theme.text }}>Signing in...</Text>
                    </View>
                ) : (
                    <>
                        <View style={{ alignItems: 'center', marginBottom: 12 }}>
                            <Text style={{ fontSize: 16, color: theme.text, fontWeight: '500' }}>Get started:</Text>
                        </View>

                        {/* Apple Button - iOS Only */}
                        {Platform.OS === 'ios' && (
                            <Pressable
                                onPress={handleApplePress}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: colorScheme === 'dark' ? '#FFF' : '#000',
                                    paddingVertical: 16,
                                    borderRadius: 12,
                                    opacity: 1,
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 3.84,
                                    elevation: 5,
                                }}
                            >
                                <Svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 12 }}>
                                    <Path d="M17.05 13.5c-.91 0-1.82.33-2.5 1.02.68.69 1.59 1.02 2.5 1.02 1.66 0 3-1.34 3-3 0-1.66-1.34-3-3-3-1.23 0-2.29.74-2.84 1.82-.27.54-.42 1.13-.42 1.75 0 1.66 1.34 3 3 3 1.23 0 2.29-.74 2.84-1.82.27-.54.42-1.13.42-1.75 0-1.66-1.34-3-3-3z" fill={colorScheme === 'dark' ? '#000' : '#FFF'} />
                                    <Path d="M17.05 2c-6.29 0-11.43 5.14-11.43 11.43 0 1.15.17 2.27.5 3.34.33 1.07.82 2.09 1.43 3h4.61c.61-.91 1.6-1.52 2.72-1.52 1.71 0 3.1 1.39 3.1 3.1 0 1.71-1.39 3.1-3.1 3.1-1.71 0-3.1-1.39-3.1-3.1 0-.68.23-1.31.61-1.83H8.3c-.59.51-1.36.83-2.2.83-1.71 0-3.1-1.39-3.1-3.1 0-1.71 1.39-3.1 3.1-3.1.84 0 1.61.32 2.2.83h4.35c-.38-.52-.61-1.15-.61-1.83 0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1 0 1.71-1.39 3.1-3.1 3.1zm0 1.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z" fill={colorScheme === 'dark' ? '#000' : '#FFF'} />
                                </Svg>
                                <Text style={{ color: colorScheme === 'dark' ? '#000' : '#FFF', fontSize: 16, fontWeight: 'bold' }}>Continue with Apple</Text>
                            </Pressable>
                        )}

                        {/* Google Button - All Platforms */}
                        <Pressable
                            onPress={handleGooglePress}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#FFF',
                                paddingVertical: 16,
                                borderRadius: 12,
                                opacity: 1,
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2,
                            }}
                        >
                            <Svg width="24" height="24" viewBox="0 0 24 24" style={{ marginRight: 12 }}>
                                <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </Svg>
                            <Text style={{ color: '#374151', fontSize: 16, fontWeight: 'bold' }}>Continue with Google</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => router.replace('/(tabs)')}
                            className="mt-4 p-4 items-center"
                        >
                            <Text className="text-slate-500 font-semibold">Continue as Guest</Text>
                        </Pressable>

                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
                            <Text style={{ color: Colors.gray, textAlign: 'center', fontSize: 12, paddingHorizontal: 20 }}>
                                By continuing, you agree to our Terms of Service and Privacy Policy.
                            </Text>
                        </View>
                    </>
                )}
            </Animated.View>
        </View>
    );
}