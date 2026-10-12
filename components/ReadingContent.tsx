import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Layout, Typography } from '@/constants/Layout';
import { View, useWindowDimensions } from 'react-native';
import Markdown, { RenderFunction } from 'react-native-markdown-display';
import RenderHtml from 'react-native-render-html';

const headingRule: RenderFunction = (node, children, _parents, styles) => <View key={node.key} accessible accessibilityRole="header" style={styles[`_VIEW_SAFE_${node.type}`]}>{children}</View>;

export default function ReadingContent({ content, horizontalPadding = Layout.gutter }: { content: string; horizontalPadding?: number }) {
  const theme = Colors[useColorScheme() ?? 'light'];
  const { width } = useWindowDimensions();
  const body = { color: theme.text, fontFamily: Layout.serif, ...Typography.readingBody };
  const heading = { ...Typography.sectionHeading, color: theme.text, fontFamily: Layout.serif, marginTop: 24, marginBottom: 12 };
  // Published content includes both Markdown and legacy HTML. Keep their
  // structure rather than showing markup or silently dropping HTML paragraphs.
  if (/<(?:p|div|h[1-6]|ul|ol|li|blockquote|strong|em|a|br|span|b|i)\b[^>]*>/i.test(content)) {
    return <RenderHtml contentWidth={Math.max(1, width - horizontalPadding * 2)} source={{ html: content }} baseStyle={body} systemFonts={[Layout.serif!]} defaultTextProps={{ style: { fontFamily: Layout.serif } }} tagsStyles={{ p: { marginTop: 0, marginBottom: 16 }, h1: heading, h2: heading, h3: heading, h4: heading, li: { marginBottom: 8 }, a: { color: theme.tint }, blockquote: { borderLeftWidth: 3, borderLeftColor: theme.tint, paddingLeft: 16, marginLeft: 0, marginRight: 0 } }} />;
  }
  return <Markdown rules={{ heading1: headingRule, heading2: headingRule, heading3: headingRule, heading4: headingRule }} style={{ body, paragraph: { marginTop: 0, marginBottom: 16 }, heading1: heading, heading2: heading, heading3: heading, heading4: heading, strong: { fontWeight: '700' }, em: { fontStyle: 'italic' }, bullet_list: { marginVertical: 8 }, ordered_list: { marginVertical: 8 }, list_item: { ...Typography.readingBody, color: theme.text }, link: { color: theme.tint }, blockquote: { backgroundColor: theme.readingSurface, borderLeftWidth: 3, borderLeftColor: theme.tint, padding: 16 } }}>{content}</Markdown>;
}
