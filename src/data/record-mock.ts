// Static Record Result content matching the scan-result layout. Real speech-to-
// text (a class-audio → transcript call through the BTL runtime) replaces this
// in Phase 8.

export const recordMock = {
  transcript:
    'Today we covered the fundamentals of thermodynamics. The first law states that ' +
    'energy cannot be created or destroyed, only transferred or converted from one form ' +
    'to another. We then looked at entropy and the second law, which explains why heat ' +
    'always flows from hotter objects to colder ones.',
  tags: ['Physics'],
};
