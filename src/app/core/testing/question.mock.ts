import { Question } from '../question.model';

/** Small fixed question set for unit tests — covers multiple tags, with and without follow-ups. */
export const mockQuestions: Question[] = [
  {
    id: 'mock-closures',
    text: 'Що таке замикання (closure) в JavaScript?',
    tags: ['javascript', 'general'],
    followUps: ['Наведіть приклад витоку пам’яті через closure.'],
  },
  {
    id: 'mock-generics',
    text: 'Навіщо потрібні дженерики в TypeScript?',
    tags: ['typescript'],
    followUps: [],
  },
  {
    id: 'mock-change-detection',
    text: 'Як працює change detection в Angular?',
    tags: ['angular'],
    followUps: ['Чим OnPush відрізняється від Default?', 'Що таке zoneless Angular?'],
  },
  {
    id: 'mock-cors',
    text: 'Що таке CORS?',
    tags: ['web-api', 'http'],
    followUps: [],
  },
  {
    id: 'mock-box-model',
    text: 'Поясніть CSS box model.',
    tags: ['css'],
    followUps: ['Чим border-box відрізняється від content-box?'],
  },
];
