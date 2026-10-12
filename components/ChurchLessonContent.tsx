import ScriptureLinkifier from '@/components/ScriptureLinkifier';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { BookOpen, Info, MessageCircle, Target } from 'lucide-react-native';
import { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';

type LessonContent = {
  title?: string;
  scripture?: string;
  introduction?: unknown;
  lesson_aims?: unknown;
  reflection_questions?: unknown;
  discussion_starters?: unknown;
  application_sidebar?: unknown;
  conclusion?: unknown;
  commentary?: string;
};
const parse = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return null; }
};
const record = (value: unknown): Record<string, unknown> => {
  const parsed = parse(value);
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
};
const strings = (value: unknown): string[] => {
  const parsed = parse(value);
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string' && !!item.trim()) : [];
};
const text = (value: unknown): string => typeof value === 'string' ? value : '';

export default function ChurchLessonContent({ lesson }: { lesson: LessonContent }) {
  const theme = Colors[useColorScheme() ?? 'light'];
  const intro = record(lesson.introduction);
  const aims = strings(lesson.lesson_aims);
  const questions = strings(lesson.reflection_questions).length ? strings(lesson.reflection_questions) : strings(lesson.discussion_starters);
  const sidebar = record(lesson.application_sidebar);
  const conclusion = record(lesson.conclusion);
  const body = { color: theme.text, fontFamily: Layout.serif, ...Layout.body };
  const heading = { color: theme.text, fontSize: 20, lineHeight: 28, fontWeight: '700' as const };
  const panel = { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card };
  const sectionHeading = (children: ReactNode, icon?: ReactNode) => <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>{icon}<Text accessibilityRole="header" style={{ ...heading, flex: 1 }}>{children}</Text></View>;
  return <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 28 }}>
    <View>
      <Text accessibilityRole="header" style={{ color: theme.text, fontFamily: Layout.serif, fontSize: 28, lineHeight: 36, fontWeight: '700' }}>{lesson.title}</Text>
      {lesson.scripture ? <View style={{ marginTop: 20, padding: 16, backgroundColor: theme.accentSoft, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}><BookOpen size={20} color={theme.tint} /><View style={{ flex: 1 }}><ScriptureLinkifier text={lesson.scripture} textStyle={{ fontSize: 16, lineHeight: 24 }} /></View></View> : null}
    </View>
    {text(intro.hook) || text(intro.background) ? <View style={{ gap: 16 }}>{text(intro.hook) ? <Text style={{ ...body, fontSize: 20, lineHeight: 30, fontStyle: 'italic' }}>“{text(intro.hook)}”</Text> : null}{text(intro.background) ? <Text style={body}>{text(intro.background)}</Text> : null}</View> : null}
    {aims.length ? <View style={panel}>{sectionHeading('Goals for this lesson', <Target size={20} color={theme.tint} />)}<View style={{ gap: 12 }}>{aims.map((aim, index) => <View key={index} style={{ flexDirection: 'row', gap: 10 }}><Text style={{ color: theme.tint, fontSize: 17, lineHeight: 28 }}>•</Text><Text style={{ ...body, flex: 1 }}>{aim}</Text></View>)}</View></View> : null}
    {lesson.commentary ? <View>{sectionHeading('Commentary')}<Text style={body}>{lesson.commentary}</Text></View> : null}
    {text(sidebar.body) ? <View style={{ ...panel, backgroundColor: theme.accentSoft }}>{sectionHeading(text(sidebar.title) || 'Application', <Info size={20} color={theme.tint} />)}<Text style={body}>{text(sidebar.body)}</Text></View> : null}
    {questions.length ? <View>{sectionHeading('Reflection questions', <MessageCircle size={20} color={theme.tint} />)}<View style={{ gap: 12 }}>{questions.map((question, index) => <View key={index} style={panel}><Text style={{ fontSize: 13, lineHeight: 20, fontWeight: '600', color: theme.tint, marginBottom: 8 }}>Question {index + 1}</Text><Text style={body}>{question}</Text></View>)}</View></View> : null}
    {['summary', 'thoughtToRemember', 'prayer'].some(key => text(conclusion[key])) ? <View style={{ ...panel, gap: 24 }}>{([['summary', 'Summary'], ['thoughtToRemember', 'Thought to remember'], ['prayer', 'Closing prayer']] as const).map(([key, label]) => text(conclusion[key]) ? <View key={key}><Text accessibilityRole="header" style={{ ...heading, fontSize: 17, marginBottom: 10 }}>{label}</Text><Text style={{ ...body, fontStyle: key === 'thoughtToRemember' ? 'italic' : 'normal' }}>{text(conclusion[key])}</Text></View> : null)}</View> : null}
  </ScrollView>;
}
