import ReadingContent from '@/components/ReadingContent';
import { normalizeLessonContent } from '@/lib/lessonContent';
import { formatScriptureReferences } from '@/lib/readingHtml';
import ScriptureLinkifier from '@/components/ScriptureLinkifier';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { BookOpen, Info, MessageCircle, Target } from 'lucide-react-native';
import { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';

type LessonContent = {
  title?: string;
  scripture?: unknown;
  key_verse?: unknown;
  study_outline?: unknown;
  introduction?: unknown;
  lesson_aims?: unknown;
  reflection_questions?: unknown;
  discussion_starters?: unknown;
  application_sidebar?: unknown;
  conclusion?: unknown;
  commentary?: string;
};
export default function ChurchLessonContent({ lesson }: { lesson: LessonContent }) {
  const scripture = formatScriptureReferences(lesson.scripture);
  const theme = Colors[useColorScheme() ?? 'light'];
  const { introduction: intro, aims, outline, questions, discussion, applicationTitle, applications, conclusion } = normalizeLessonContent(lesson);
  const keyVerse = formatScriptureReferences(lesson.key_verse);
  const body = { color: theme.text, fontFamily: Layout.serif, ...Layout.body };
  const heading = { color: theme.text, fontSize: 20, lineHeight: 28, fontWeight: '700' as const };
  const panel = { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card };
  const sectionHeading = (children: ReactNode, icon?: ReactNode) => <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>{icon}<Text accessibilityRole="header" style={{ ...heading, flex: 1 }}>{children}</Text></View>;
  return <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 28 }}>
    <View>
      <Text accessibilityRole="header" style={{ color: theme.text, fontFamily: Layout.serif, fontSize: 28, lineHeight: 36, fontWeight: '700' }}>{lesson.title}</Text>
      {scripture ? <View style={{ marginTop: 20, padding: 16, backgroundColor: theme.accentSoft, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}><BookOpen size={20} color={theme.tint} /><View style={{ flex: 1 }}><ScriptureLinkifier text={scripture} textStyle={{ fontSize: 16, lineHeight: 24 }} /></View></View> : null}
    </View>
    {intro.hook || intro.background ? <View style={{ gap: 16 }}>{intro.hook ? <Text style={{ ...body, fontSize: 20, lineHeight: 30, fontStyle: 'italic' }}>“{intro.hook}”</Text> : null}{intro.background ? <Text style={body}>{intro.background}</Text> : null}</View> : null}
    {aims.length ? <View style={panel}>{sectionHeading('Goals for this lesson', <Target size={20} color={theme.tint} />)}<View style={{ gap: 12 }}>{aims.map((aim, index) => <View key={index} style={{ flexDirection: 'row', gap: 10 }}><Text style={{ color: theme.tint, fontSize: 17, lineHeight: 28 }}>•</Text><Text style={{ ...body, flex: 1 }}>{aim}</Text></View>)}</View></View> : null}
    {outline.length ? <View>{sectionHeading('In this lesson')}<View style={{ gap: 12 }}>{outline.map((item, index) => <View key={index} style={{ flexDirection: 'row', gap: 10 }}><Text style={{ ...body, color: theme.tint }}>{index + 1}.</Text><Text style={{ ...body, flex: 1 }}>{item}</Text></View>)}</View></View> : null}
    {keyVerse && keyVerse !== scripture ? <View>{sectionHeading('Key verse')}<ScriptureLinkifier text={keyVerse} textStyle={body} /></View> : null}
    {lesson.commentary ? <View>{sectionHeading('Commentary')}<ReadingContent content={lesson.commentary} /></View> : null}
    {applications.length ? <View style={{ ...panel, backgroundColor: theme.readingSurface }}>{sectionHeading(applicationTitle, <Info size={20} color={theme.tint} />)}<View style={{ gap: 16 }}>{applications.map((application, index) => <ReadingContent key={index} content={application} horizontalPadding={40} />)}</View></View> : null}
    {discussion.length ? <View>{sectionHeading('Discuss together')}<View style={{ gap: 16 }}>{discussion.map((item, index) => <Text key={index} style={body}>{item}</Text>)}</View></View> : null}
    {questions.length ? <View>{sectionHeading('Reflection questions', <MessageCircle size={20} color={theme.tint} />)}<View style={{ gap: 12 }}>{questions.map((question, index) => <View key={index} style={panel}><Text style={{ fontSize: 13, lineHeight: 20, fontWeight: '600', color: theme.tint, marginBottom: 8 }}>Question {index + 1}</Text><Text style={body}>{question}</Text></View>)}</View></View> : null}
    {(['summary', 'thoughtToRemember', 'prayer'] as const).some(key => conclusion[key]) ? <View style={{ ...panel, gap: 24 }}>{([['summary', 'Summary'], ['thoughtToRemember', 'Thought to remember'], ['prayer', 'Closing prayer']] as const).map(([key, label]) => conclusion[key] ? <View key={key}><Text accessibilityRole="header" style={{ ...heading, fontSize: 17, marginBottom: 10 }}>{label}</Text><Text style={{ ...body, fontStyle: key === 'thoughtToRemember' ? 'italic' : 'normal' }}>{conclusion[key]}</Text></View> : null)}</View> : null}
  </ScrollView>;
}
