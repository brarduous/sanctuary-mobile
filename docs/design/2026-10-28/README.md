# Sanctuary trivia design — October 28, 2026

The current direction is compact trivia: warm paper and forest ink in light mode, layered forest charcoal and ivory in dark mode, a serif question, four spacious answer rows, and restrained antique-gold actions.

The built-in imagegen tool produced [the compact light/dark concept](compact-trivia-concept.png). Its [exact prompt](compact-trivia-prompt.txt) is saved beside it. This board is a visual reference; all actual questions, citations, editions and rights come from the content system. The first board, discovery-light-dark-concept.png, is superseded. Its report form and verbose reveal were rejected and are absent from the current UI.

## Implemented flow

Start → 20-second question → result → short detail and preferred Scripture. One wrong choice disappears at 7 seconds, another at 14 seconds; two choices remain until timeout. Removed rows retain their space so touch targets do not move. Reopening preserves the deadline. Results show elapsed time and consecutive correct daily answers. Sharing is a short truthful sentence plus the generic game link, with no emoji grid, question, answer, Scripture citation, or answer image. The earlier Wordle-style history squares have been removed.

The result keeps only the correct answer row, a brief factoid, statistics, Done/Share actions, and the inline Scripture card. Sources remain optional and expandable. No report/help section is present. Scripture uses the existing reader's edition and font preference, and opens that reader internally.

The original John 11:35 fixture was rejected as too obvious. The user subsequently resumed question writing with the Trivia Hall of Fame guide. Backend writer v3 now uses contextual scenes and separate evidence/craft gates; the original starter bank is retired. Existing screenshots are historical UI evidence, not approval of their fixture text. Current candidate provenance is in sanctuary-backend/content/discoveries/README.md.

See [visual QA](VISUAL_QA.md) for actual captures and coverage limits.
