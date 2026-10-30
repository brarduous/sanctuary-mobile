import ScreenState from '@/components/ScreenState';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { fetchVolunteerMemberships, fetchVolunteerSchedule, fetchVolunteerTeams, joinVolunteerTeam, respondToVolunteerSchedule } from '@/lib/api';
import { Stack, useRouter } from 'expo-router';
import { CalendarDays, Users } from 'lucide-react-native';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

type Schedule = { id: string; status: 'pending' | 'accepted' | 'declined'; events: { id: string | number; title: string; event_date: string; location?: string } | null; volunteer_roles: { name: string; color_code: string } | null };
type Team = { id: string; name: string; description?: string; join_policy: string; color_code?: string };
type Membership = { status: string; volunteer_roles: { id: string | number } | null };

export default function VolunteerHubScreen() {
  const router = useRouter();
  const { user, userCongregationId, loading: authLoading } = useAuth();
  const theme = Colors[useColorScheme() ?? 'light'];
  const [tab, setTab] = useState<'schedule' | 'browse'>('schedule');
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const submitting = useRef(false);

  useEffect(() => {
    if (authLoading || !user || !userCongregationId) return;
    let active = true;
    setLoading(true);
    setError(false);
    setAccessDenied(false);
    setSchedule([]);
    setTeams([]);
    setMemberships([]);
    const load = async () => {
      try {
        if (tab === 'schedule') {
          const data = await fetchVolunteerSchedule();
          if (active) setSchedule(data.filter((item: Schedule) => item?.events?.id && item?.volunteer_roles));
        } else {
          const [data, memberData] = await Promise.all([fetchVolunteerTeams(userCongregationId), fetchVolunteerMemberships()]);
          if (active) {
            setTeams(data);
            setMemberships(memberData);
          }
        }
      } catch (cause) {
        if (active) {
          setError(true);
          setAccessDenied(axios.isAxiosError(cause) && cause.response?.status === 403);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [authLoading, user?.id, userCongregationId, tab, attempt]);

  const respond = async (item: Schedule, status: 'accepted' | 'declined') => {
    if (submitting.current || !item.events?.id) return;
    submitting.current = true;
    setBusyId(item.id);
    try {
      await respondToVolunteerSchedule(String(item.events.id), String(item.id), status);
      setSchedule(previous => previous.map(entry => entry.id === item.id ? { ...entry, status } : entry));
    } catch { Alert.alert('Could not update your response', 'Please try again.'); }
    finally { submitting.current = false; setBusyId(null); }
  };
  const join = async (team: Team) => {
    if (submitting.current) return;
    submitting.current = true;
    setBusyId(team.id);
    try {
      await joinVolunteerTeam(String(team.id));
      Alert.alert(team.join_policy === 'open' ? 'You joined the team' : 'Request sent', team.join_policy === 'open' ? 'Your team leader will help you get started.' : 'Your team leader will review your request.');
      setAttempt(value => value + 1);
    } catch { Alert.alert('Could not join this team', 'Please try again or contact your church.'); }
    finally { submitting.current = false; setBusyId(null); }
  };
  const card = { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, borderRadius: 20, padding: 20, marginBottom: 16 };
  const retry = () => setAttempt(value => value + 1);
  const pending = schedule.filter(item => item.status === 'pending');
  const accepted = schedule.filter(item => item.status === 'accepted');
  const date = (value: string) => Number.isNaN(Date.parse(value)) ? '' : new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

  return <View style={{ flex: 1, backgroundColor: theme.background }}>
    <Stack.Screen options={{ title: 'Volunteer Hub', headerBackTitle: 'Back' }} />
    {authLoading ? <ScreenState title="Loading your church" loading /> : !user || !userCongregationId ?
      <ScreenState title="Connect to a church" message="Join your church to find teams and see your volunteer schedule." /> : <>
      <View accessibilityRole="tablist" style={{ flexDirection: 'row', margin: 20, padding: 4, borderRadius: 16, backgroundColor: theme.muted, gap: 4 }}>
        {(['schedule', 'browse'] as const).map(value => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: tab === value }} onPress={() => setTab(value)} style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: tab === value ? theme.tint : 'transparent' }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: tab === value ? theme.onTint : theme.mutedForeground }}>{value === 'schedule' ? 'My schedule' : 'Browse teams'}</Text>
        </Pressable>)}
      </View>
      {loading ? <ScreenState title={tab === 'schedule' ? 'Loading your schedule' : 'Finding teams'} loading /> : error ?
        <ScreenState title={accessDenied ? 'Volunteer access is restricted' : tab === 'schedule' ? 'Schedule unavailable' : 'Teams unavailable'} message={accessDenied ? 'Your account doesn’t have access to this church’s volunteer information. Ask your church leader for help getting connected.' : 'We couldn’t load this right now. Please try again.'} actionLabel={accessDenied ? 'Back to Sanctuary' : undefined} onRetry={accessDenied ? () => router.dismissTo('/') : retry} /> :
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={false} onRefresh={retry} tintColor={theme.tint} />}>
          {tab === 'schedule' ? <>
            {pending.length > 0 && <Text style={{ color: theme.tint, fontWeight: '700', fontSize: 18, marginBottom: 16 }}>Your response needed</Text>}
            {pending.map(item => <View key={item.id} style={card}>
              <Text style={{ color: theme.tint, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>{item.volunteer_roles?.name}</Text>
              <Text style={{ color: theme.text, fontSize: 20, fontWeight: '600', marginBottom: 8 }}>{item.events?.title}</Text>
              <Text style={{ color: theme.mutedForeground, fontSize: 14, lineHeight: 22, marginBottom: item.events?.location ? 8 : 20 }}>{date(item.events!.event_date)}</Text>
              {!!item.events?.location && <Text style={{ color: theme.mutedForeground, fontSize: 14, lineHeight: 22, marginBottom: 20 }}>{item.events.location}</Text>}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {(['accepted', 'declined'] as const).map(status => <Pressable key={status} accessibilityRole="button" accessibilityState={{ disabled: busyId !== null, busy: busyId === item.id }} disabled={busyId !== null} onPress={() => void respond(item, status)} style={{ flex: 1, minHeight: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: status === 'accepted' ? theme.action : theme.muted, opacity: busyId !== null ? 0.5 : 1 }}>
                  <Text style={{ fontWeight: '600', color: status === 'accepted' ? theme.onAction : theme.text }}>{status === 'accepted' ? 'Accept' : 'Decline'}</Text>
                </Pressable>)}
              </View>
            </View>)}
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '600', marginBottom: 16 }}>Upcoming dates</Text>
            {accepted.length === 0 ? <View style={card}>
              <CalendarDays color={theme.tint} size={28} />
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>Nothing scheduled yet</Text>
              <Text style={{ color: theme.mutedForeground, fontSize: 16, lineHeight: 25 }}>Accepted volunteer dates will appear here.</Text>
            </View> : accepted.map(item => <View key={item.id} style={card}>
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: '600', marginBottom: 8 }}>{item.events?.title}</Text>
              <Text style={{ color: theme.mutedForeground, fontSize: 14, lineHeight: 22 }}>{date(item.events!.event_date)}</Text>
              {!!item.events?.location && <Text style={{ color: theme.mutedForeground, fontSize: 14, lineHeight: 22, marginTop: 8 }}>{item.events.location}</Text>}
              <Text style={{ color: theme.tint, fontSize: 14, marginTop: 12 }}>{item.volunteer_roles?.name}</Text>
            </View>)}
          </> : <>
            <Text style={{ color: theme.mutedForeground, fontSize: 16, lineHeight: 25, marginBottom: 20 }}>Find a place to serve. Join an open team or request to meet its leader.</Text>
            {teams.length === 0 && <View style={card}>
              <Users color={theme.tint} size={28} />
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>No teams listed yet</Text>
              <Text style={{ color: theme.mutedForeground, fontSize: 16, lineHeight: 25 }}>Your church will list available teams here.</Text>
            </View>}
            {teams.map(team => {
              const membership = memberships.find(item => String(item.volunteer_roles?.id) === String(team.id));
              const alreadyJoined = membership?.status === 'active';
              const awaitingApproval = membership?.status === 'pending_approval';
              return <View key={team.id} style={card}>
              <Text style={{ color: theme.text, fontSize: 20, fontWeight: '600', marginBottom: 8 }}>{team.name}</Text>
              <Text style={{ color: theme.tint, fontSize: 13, fontWeight: '600' }}>{team.join_policy === 'open' ? 'Open to everyone' : 'Leader approval required'}</Text>
              <Text style={{ color: theme.mutedForeground, fontSize: 16, lineHeight: 25, marginVertical: 16 }}>{team.description || 'Help serve your church family.'}</Text>
              {alreadyJoined || awaitingApproval ? <View style={{ minHeight: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.muted }}>
                <Text style={{ color: theme.text, fontWeight: '600' }}>{alreadyJoined ? 'You’re on this team' : 'Awaiting leader approval'}</Text>
              </View> : <Pressable accessibilityRole="button" accessibilityState={{ disabled: busyId !== null, busy: busyId === team.id }} disabled={busyId !== null} onPress={() => void join(team)} style={{ minHeight: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.action, opacity: busyId !== null ? 0.5 : 1 }}>
                <Text style={{ color: theme.onAction, fontWeight: '600' }}>{team.join_policy === 'open' ? 'Join team' : 'Request to join'}</Text>
              </Pressable>}
            </View>;
            })}
          </>}
        </ScrollView>}
    </>}
  </View>;
}
