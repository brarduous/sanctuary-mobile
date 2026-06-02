export const ADVICE_PROMPT_SAMPLES = [
  'I keep losing patience with my family. How can I respond with more grace?',
  'I feel spiritually dry and distant from God lately. What should I do?',
  'How do I forgive someone when I still feel hurt by what happened?',
  'I am anxious about a decision and do not know how to discern wisely.',
  'I keep falling into the same sin and feel ashamed to pray again.',
  'How can I build a consistent prayer life when my schedule feels full?',
  'I want to share my faith with a loved one, but I am afraid of pushing them away.',
  'I feel lonely even though I go to church. How should I seek real community?',
  'How do I honor God at work when the environment feels stressful?',
  'I am wrestling with doubt and feel guilty for questioning my faith.',
  'How can I handle conflict without becoming defensive or bitter?',
  'I know I need rest, but I feel guilty slowing down. What does biblical rest look like?',
  'How do I deal with jealousy when someone else receives what I hoped for?',
  'I am grieving a loss and struggling to feel hope.',
  'How can I practice humility when I feel overlooked?',
  'I want to read Scripture more deeply but do not know where to start.',
  'How should I respond to church hurt without walking away from Jesus?',
  'I am afraid God is disappointed in me. How do I receive His grace?',
  'How can I be more generous when I am worried about money?',
  'I feel pulled into political anger. How do I stay grounded as a Christian?',
  'How do I trust God when a prayer seems unanswered?',
  'I want to serve, but I feel burned out. How should I think about that?',
  'How can I love someone who is difficult without enabling what is wrong?',
  'I feel distracted by my phone and want to be more present with God.',
  'My friend is grieving, and I do not know what to say or how to help.',
  'A loved one is drifting from faith. How can I love them without panic or pressure?',
  'My spouse and I keep having the same conflict. How can I approach it with humility?',
  'My child is anxious and discouraged. How can I encourage them spiritually?',
  'Someone I care about is trapped in bitterness. How can I support them wisely?',
  'A friend confessed a serious struggle to me. How can I respond with truth and grace?',
  'My family member is making choices I believe are harmful. How do I set loving boundaries?',
  'A loved one is doubting God after suffering. How can I walk with them patiently?',
];

export const getRandomAdvicePromptSample = () => {
  const index = Math.floor(Math.random() * ADVICE_PROMPT_SAMPLES.length);
  return ADVICE_PROMPT_SAMPLES[index];
};
