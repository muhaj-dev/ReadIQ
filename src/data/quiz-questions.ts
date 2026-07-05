// Static quiz content for the Quiz Active screen (Phase 6 shell). Real quizzes
// are generated from retrieved note chunks via lib/quizgen.ts in a later step —
// every question keeps its sourceNote so the grounding tag can point at it.

export type QuizOption = {
  /** Display letter — 'A' | 'B' | 'C' | 'D'. */
  key: string;
  text: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: QuizOption[];
  /** The `key` of the correct option. */
  answerKey: string;
  /** The subject this question belongs to — used to filter a picked quiz. */
  subject: string;
  sourceNoteId: string;
  sourceNoteTitle: string;
};

// The mock opens on question 4 of 10 (the chloroplast MCQ). We seed the full
// run so the progress bar and "Question N of 10" are honest.
export const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    prompt: 'Which organelle is the site of aerobic respiration?',
    options: [
      { key: 'A', text: 'Ribosome' },
      { key: 'B', text: 'Mitochondrion' },
      { key: 'C', text: 'Golgi apparatus' },
      { key: 'D', text: 'Lysosome' },
    ],
    answerKey: 'B',
    subject: 'Cell Biology',
    sourceNoteId: 'cell-biology-l4',
    sourceNoteTitle: 'Cell Biology · Lecture 4',
  },
  {
    id: 'q2',
    prompt: 'What molecule carries the cell’s genetic instructions?',
    options: [
      { key: 'A', text: 'DNA' },
      { key: 'B', text: 'ATP' },
      { key: 'C', text: 'Glucose' },
      { key: 'D', text: 'Lipid' },
    ],
    answerKey: 'A',
    subject: 'Cell Biology',
    sourceNoteId: 'cell-biology-l4',
    sourceNoteTitle: 'Cell Biology · Lecture 4',
  },
  {
    id: 'q3',
    prompt: 'Which process splits one cell into two identical daughter cells?',
    options: [
      { key: 'A', text: 'Meiosis' },
      { key: 'B', text: 'Osmosis' },
      { key: 'C', text: 'Mitosis' },
      { key: 'D', text: 'Diffusion' },
    ],
    answerKey: 'C',
    subject: 'Cell Biology',
    sourceNoteId: 'cell-biology-l5',
    sourceNoteTitle: 'Cell Biology · Lecture 5',
  },
  {
    id: 'q4',
    prompt: 'What is the main function of the chloroplast in photosynthesis?',
    options: [
      { key: 'A', text: 'Produce ATP' },
      { key: 'B', text: 'Absorb light energy' },
      { key: 'C', text: 'Store water' },
      { key: 'D', text: 'Break down glucose' },
    ],
    answerKey: 'B',
    subject: 'Photosynthesis',
    sourceNoteId: 'photosynthesis-l2',
    sourceNoteTitle: 'Photosynthesis · Lecture 2',
  },
  {
    id: 'q5',
    prompt: 'Photosynthesis converts carbon dioxide and water into glucose and what gas?',
    options: [
      { key: 'A', text: 'Nitrogen' },
      { key: 'B', text: 'Hydrogen' },
      { key: 'C', text: 'Oxygen' },
      { key: 'D', text: 'Methane' },
    ],
    answerKey: 'C',
    subject: 'Photosynthesis',
    sourceNoteId: 'photosynthesis-l2',
    sourceNoteTitle: 'Photosynthesis · Lecture 2',
  },
  {
    id: 'q6',
    prompt: 'Which pigment gives leaves their green colour and captures light?',
    options: [
      { key: 'A', text: 'Carotene' },
      { key: 'B', text: 'Chlorophyll' },
      { key: 'C', text: 'Melanin' },
      { key: 'D', text: 'Haemoglobin' },
    ],
    answerKey: 'B',
    subject: 'Photosynthesis',
    sourceNoteId: 'photosynthesis-l2',
    sourceNoteTitle: 'Photosynthesis · Lecture 2',
  },
  {
    id: 'q7',
    prompt: 'The light-dependent reactions take place in which part of the chloroplast?',
    options: [
      { key: 'A', text: 'Stroma' },
      { key: 'B', text: 'Thylakoid membrane' },
      { key: 'C', text: 'Cell wall' },
      { key: 'D', text: 'Nucleus' },
    ],
    answerKey: 'B',
    subject: 'Photosynthesis',
    sourceNoteId: 'photosynthesis-l3',
    sourceNoteTitle: 'Photosynthesis · Lecture 3',
  },
  {
    id: 'q8',
    prompt: 'Which cycle fixes carbon dioxide into glucose during photosynthesis?',
    options: [
      { key: 'A', text: 'Krebs cycle' },
      { key: 'B', text: 'Nitrogen cycle' },
      { key: 'C', text: 'Calvin cycle' },
      { key: 'D', text: 'Cell cycle' },
    ],
    answerKey: 'C',
    subject: 'Photosynthesis',
    sourceNoteId: 'photosynthesis-l3',
    sourceNoteTitle: 'Photosynthesis · Lecture 3',
  },
  {
    id: 'q9',
    prompt: 'What is the term for the algorithmic worst-case growth rate?',
    options: [
      { key: 'A', text: 'Big O notation' },
      { key: 'B', text: 'Recursion' },
      { key: 'C', text: 'Iteration' },
      { key: 'D', text: 'Hashing' },
    ],
    answerKey: 'A',
    subject: 'Algorithms',
    sourceNoteId: 'algorithms-l1',
    sourceNoteTitle: 'Algorithms · Lecture 1',
  },
  {
    id: 'q10',
    prompt: 'A function that calls itself to solve smaller subproblems is using what?',
    options: [
      { key: 'A', text: 'A loop' },
      { key: 'B', text: 'Recursion' },
      { key: 'C', text: 'A switch' },
      { key: 'D', text: 'Concatenation' },
    ],
    answerKey: 'B',
    subject: 'Algorithms',
    sourceNoteId: 'algorithms-l2',
    sourceNoteTitle: 'Algorithms · Lecture 2',
  },
];
