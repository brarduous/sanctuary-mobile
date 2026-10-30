const storedValue = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
};
const record = (value: unknown): Record<string, unknown> => {
  const parsed = storedValue(value);
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
};
const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
export const lessonTextList = (value: unknown): string[] => {
  const parsed = storedValue(value);
  if (typeof parsed === 'string') return parsed.trim() ? [parsed.trim()] : [];
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean) : [];
};

// Current generated lessons use arrays for application_sidebar; older lessons
// store a {title,body} object. Both contain reader-visible content.
export function normalizeLessonContent(lesson: Record<string, unknown>) {
  const intro = record(lesson.introduction);
  const conclusion = record(lesson.conclusion);
  const sidebar = record(lesson.application_sidebar);
  const questions = lessonTextList(lesson.reflection_questions);
  return {
    introduction: { hook: text(intro.hook), background: text(intro.background) || (typeof storedValue(lesson.introduction) === 'string' ? text(storedValue(lesson.introduction)) : '') },
    aims: lessonTextList(lesson.lesson_aims),
    outline: lessonTextList(lesson.study_outline),
    questions,
    discussion: lessonTextList(lesson.discussion_starters).filter(item => !questions.includes(item)),
    applicationTitle: text(sidebar.title) || 'Apply this lesson',
    applications: text(sidebar.body) ? [text(sidebar.body)] : lessonTextList(lesson.application_sidebar),
    conclusion: { summary: text(conclusion.summary) || (typeof storedValue(lesson.conclusion) === 'string' ? text(storedValue(lesson.conclusion)) : ''), thoughtToRemember: text(conclusion.thoughtToRemember), prayer: text(conclusion.prayer) },
  };
}
