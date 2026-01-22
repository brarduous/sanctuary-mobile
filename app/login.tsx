import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { BookOpen, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    Platform,
    Pressable,
    Animated as RNAnimated,
    StatusBar,
    Text,
    View
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

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
        icon: HeartHandshake, // Approximating news/community
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
    
    // Slider Logic
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new RNAnimated.Value(0)).current;
    
    const slidesRef = useRef(null);
    
    const viewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
    
    // Auto-scroll logic could go here, but manual is often better for onboarding

    const renderItem = ({ item }: { item: typeof SLIDES[0] }) => {
        const Icon = item.icon;
        return (
            <View style={{ width, alignItems: 'center', paddingHorizontal: 40, paddingTop: 80 }}>
                <View 
                    style={{ 
                        width: 120, 
                        height: 120, 
                        borderRadius: 60, 
                        backgroundColor: item.color + '20', // 20% opacity
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
                        fontFamily: Platform.select({ ios: 'Serif', android: 'serif' }) // Fallback serif
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
                    ref={slidesRef}
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
                <View style={{ alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, color: Colors.gray, fontWeight: '500' }}>Get started with</Text>
                </View>

                {/* Apple Button */}
                <Pressable
                    onPress={signInWithApple}
                    style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colorScheme === 'dark' ? '#FFF' : '#000',
                        paddingVertical: 16,
                        borderRadius: 12,
                        opacity: pressed ? 0.9 : 1,
                        shadowColor: "#000",
                        shadowOffset: {
                            width: 0,
                            height: 2,
                        },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                    })}
                >
                    <Image 
                        source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg' }} // Fallback if no local icon
                        style={{ width: 20, height: 20, marginRight: 12, tintColor: colorScheme === 'dark' ? '#000' : '#FFF' }} // Inverse tint
                    />
                    {/* Using Text instead of Image for logo simplicy if possible, but standard is icon */}
                   <Text style={{ color: colorScheme === 'dark' ? '#000' : '#FFF', fontSize: 16, fontWeight: 'bold' }}>Continue with Apple</Text>
                </Pressable>

                {/* Google Button */}
                <Pressable
                    onPress={signInWithGoogle}
                    style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#FFF',
                        paddingVertical: 16,
                        borderRadius: 12,
                        opacity: pressed ? 0.9 : 1,
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        shadowColor: "#000",
                        shadowOffset: {
                            width: 0,
                            height: 1,
                        },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2,
                    })}
                >
                    {/* Placeholder Google G */}
                    <Text style={{ fontSize: 18, marginRight: 12 }}>G</Text>
                    <Text style={{ color: '#374151', fontSize: 16, fontWeight: 'bold' }}>Continue with Google</Text>
                </Pressable>

                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
                    <Text style={{ color: Colors.gray, textAlign: 'center', fontSize: 12 }}>
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </Text>
                </View>
            </Animated.View>
        </View>
    );
}
