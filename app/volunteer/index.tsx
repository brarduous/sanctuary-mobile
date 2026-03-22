import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Stack, useRouter } from 'expo-router';
import {
    CheckCircle2,
    Clock,
    ShieldAlert,
    XCircle
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function VolunteerHubScreen() {
    const { user, userCongregationId } = useAuth();
    const router = useRouter();
    const theme = Colors[useColorScheme() ?? 'light'];

    const [activeTab, setActiveTab] = useState<'schedule' | 'browse'>('schedule');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Data States
    const [schedule, setSchedule] = useState<any[]>([]);
    const [myTeams, setMyTeams] = useState<any[]>([]);
    const [availableTeams, setAvailableTeams] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

            // Fetch Hub Data (Schedule & My Teams)
            const hubRes = await fetch(`${baseUrl}/api/volunteers/hub`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const hubData = await hubRes.json();
            setSchedule(hubData.schedule);
            setMyTeams(hubData.myTeams);

            // Fetch Browse Teams
            if (userCongregationId) {
                const teamsRes = await fetch(`${baseUrl}/api/volunteers/browse-teams/${userCongregationId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setAvailableTeams(await teamsRes.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchData();
    };

    const respondToSchedule = async (scheduleId: string, status: 'accepted' | 'declined') => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/events/schedule/${scheduleId}/respond`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                // Optimistically update the UI
                setSchedule(prev => prev.map(s => s.id === scheduleId ? { ...s, status } : s));
            }
        } catch (error) {
            Alert.alert("Error", "Could not update status.");
        }
    };

    const handleJoinTeam = async (team: any) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/volunteers/join-team`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ roleId: team.id, joinPolicy: team.join_policy })
            });

            if (res.ok) {
                Alert.alert("Success", team.join_policy === 'open' ? "You are now on the team!" : "Your request has been sent to the team leader.");
                fetchData(); // Refresh to move it to "My Teams"
            } else {
                const err = await res.json();
                Alert.alert("Notice", err.error);
            }
        } catch (error) {
            Alert.alert("Error", "Could not join team.");
        }
    };

    if (!userCongregationId) {
        return (
            <View className="flex-1 justify-center items-center p-8 bg-white dark:bg-black">
                <Stack.Screen options={{ title: 'Volunteer Hub' }} />
                <ShieldAlert size={48} color={theme.text} className="mb-4 opacity-20" />
                <Text className="text-xl font-bold dark:text-white mb-2 text-center">Connect to a Church</Text>
                <Text className="text-gray-500 text-center">You must join a digital congregation to volunteer and view schedules.</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <Stack.Screen options={{ title: 'Volunteer Hub', headerBackTitle: 'Back' }} />
            
            {/* Custom Tab Bar */}
            <View className="flex-row p-2 mx-4 mt-4 bg-gray-100 dark:bg-gray-900 rounded-xl">
                <TouchableOpacity 
                    onPress={() => setActiveTab('schedule')}
                    className={`flex-1 py-2.5 items-center rounded-lg ${activeTab === 'schedule' ? 'bg-white dark:bg-gray-800 shadow-sm' : ''}`}
                >
                    <Text className={`font-bold text-sm ${activeTab === 'schedule' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>My Schedule</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setActiveTab('browse')}
                    className={`flex-1 py-2.5 items-center rounded-lg ${activeTab === 'browse' ? 'bg-white dark:bg-gray-800 shadow-sm' : ''}`}
                >
                    <Text className={`font-bold text-sm ${activeTab === 'browse' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>Browse Teams</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#6366f1" />
                </View>
            ) : (
                <ScrollView 
                    className="flex-1" 
                    contentContainerStyle={{ padding: 20 }}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
                >
                    
                    {activeTab === 'schedule' && (
                        <View className="space-y-6">
                            {/* Action Required Section */}
                            {schedule.filter(s => s.status === 'pending').length > 0 && (
                                <View>
                                    <Text className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">Action Required</Text>
                                    {schedule.filter(s => s.status === 'pending').map(item => (
                                        <View key={item.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/30 mb-3 shadow-sm">
                                            <View className="flex-row items-center gap-2 mb-2">
                                                <View className="w-3 h-3 rounded-full" style={{ backgroundColor: item.volunteer_roles.color_code }} />
                                                <Text className="font-bold text-gray-900 dark:text-white">{item.volunteer_roles.name}</Text>
                                            </View>
                                            <Text className="text-lg font-serif dark:text-white mb-1">{item.events.title}</Text>
                                            <Text className="text-sm text-gray-500 mb-6 flex-row items-center">
                                                <Clock size={12} /> {new Date(item.events.event_date).toLocaleString()}
                                            </Text>
                                            
                                            <div className="flex-row gap-3">
                                                <TouchableOpacity 
                                                    onPress={() => respondToSchedule(item.id, 'accepted')}
                                                    className="flex-1 bg-indigo-600 py-3 rounded-xl items-center flex-row justify-center"
                                                >
                                                    <CheckCircle2 size={16} color="white" className="mr-2" />
                                                    <Text className="text-white font-bold text-sm">Accept</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity 
                                                    onPress={() => respondToSchedule(item.id, 'declined')}
                                                    className="flex-1 bg-gray-100 dark:bg-gray-800 py-3 rounded-xl items-center flex-row justify-center"
                                                >
                                                    <XCircle size={16} color={theme.text} className="mr-2" />
                                                    <Text className="font-bold text-sm dark:text-white">Decline</Text>
                                                </TouchableOpacity>
                                            </div>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Upcoming Accepted Schedule */}
                            <View>
                                <Text className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 mt-4">Upcoming Accepted</Text>
                                {schedule.filter(s => s.status === 'accepted').length === 0 ? (
                                    <Text className="text-gray-500 italic text-center py-4">You have no upcoming scheduled dates.</Text>
                                ) : (
                                    schedule.filter(s => s.status === 'accepted').map(item => (
                                        <View key={item.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 mb-3 flex-row items-center justify-between">
                                            <View>
                                                <Text className="font-bold text-gray-900 dark:text-white mb-1">{item.events.title}</Text>
                                                <Text className="text-xs text-gray-500">{new Date(item.events.event_date).toLocaleDateString()}</Text>
                                            </View>
                                            <View className="bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg flex-row items-center gap-2">
                                                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: item.volunteer_roles.color_code }} />
                                                <Text className="text-xs font-bold dark:text-white">{item.volunteer_roles.name}</Text>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        </View>
                    )}

                    {activeTab === 'browse' && (
                        <View className="space-y-6">
                            <Text className="text-gray-500 mb-4">Find a place to serve. Some teams are open to join immediately, while others require a quick chat with the leader first.</Text>
                            
                            {availableTeams.map(team => (
                                <View key={team.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 mb-4 shadow-sm">
                                    <View className="flex-row items-start justify-between mb-2">
                                        <View className="flex-row items-center gap-3">
                                            <View className="w-4 h-12 rounded-full shadow-inner" style={{ backgroundColor: team.color_code }} />
                                            <View>
                                                <Text className="text-lg font-bold text-gray-900 dark:text-white">{team.name}</Text>
                                                <Text className="text-xs text-gray-400 uppercase tracking-widest mt-0.5">
                                                    {team.join_policy === 'open' ? 'Open to All' : 'Approval Required'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    
                                    <Text className="text-sm text-gray-600 dark:text-gray-300 my-4 leading-relaxed">
                                        {team.description || 'Join this team to help serve the church family.'}
                                    </Text>
                                    
                                    <TouchableOpacity 
                                        onPress={() => handleJoinTeam(team)}
                                        className="bg-indigo-50 dark:bg-indigo-900/30 py-3 rounded-xl items-center flex-row justify-center border border-indigo-100 dark:border-indigo-800"
                                    >
                                        <Text className="text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                                            {team.join_policy === 'open' ? 'Join Team' : 'Request to Join'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    <View className="h-12" />
                </ScrollView>
            )}
        </View>
    );
}