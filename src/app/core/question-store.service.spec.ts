import { TestBed } from '@angular/core/testing';
import { QuestionStore } from './question-store.service';
import { mockQuestions } from './testing/question.mock';

describe('QuestionStore', () => {
  let store: QuestionStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(QuestionStore);
    store.importFromRaw(mockQuestions);
  });

  it('loads the imported mock questions', () => {
    expect(store.totalCount()).toBe(mockQuestions.length);
    expect(store.availableTags()).toContain('angular');
    expect(store.availableTags()).toContain('typescript');
  });

  it('excludes answered questions from the random pool', () => {
    store.pickRandom();
    const picked = store.currentQuestion();
    expect(picked).not.toBeNull();

    store.markCurrentAnswered();

    expect(store.filteredPool().some((q) => q.id === picked!.id)).toBe(false);
    expect(store.answeredQuestions().some((q) => q.id === picked!.id)).toBe(true);
  });

  it('refuses to archive a question that has not been answered yet', () => {
    const [first] = mockQuestions;
    store.archiveQuestion(first.id);

    expect(store.isArchived(first.id)).toBe(false);
    expect(store.archivedCount()).toBe(0);
  });

  it('pendingQuestions excludes both answered and archived questions', () => {
    const [first, second] = mockQuestions;
    store.currentQuestionId.set(first.id);
    store.markCurrentAnswered();
    store.archiveQuestion(first.id);

    store.currentQuestionId.set(second.id);
    store.markCurrentAnswered();

    const pendingIds = store.pendingQuestions().map((q) => q.id);
    expect(pendingIds).not.toContain(first.id);
    expect(pendingIds).not.toContain(second.id);
    expect(pendingIds.length).toBe(mockQuestions.length - 2);
  });

  it('archives an answered question and excludes it from the random pool', () => {
    const [first] = mockQuestions;
    store.currentQuestionId.set(first.id);
    store.markCurrentAnswered();

    store.archiveQuestion(first.id);

    expect(store.isArchived(first.id)).toBe(true);
    expect(store.filteredPool().some((q) => q.id === first.id)).toBe(false);
  });

  it('restoreFromArchive removes the question from the archive', () => {
    const [first] = mockQuestions;
    store.currentQuestionId.set(first.id);
    store.markCurrentAnswered();
    store.archiveQuestion(first.id);

    store.restoreFromArchive(first.id);

    expect(store.isArchived(first.id)).toBe(false);
  });

  it('deleteQuestion removes the question and cleans up answered/archived state', () => {
    const [first] = mockQuestions;
    store.currentQuestionId.set(first.id);
    store.markCurrentAnswered();
    store.archiveQuestion(first.id);

    store.deleteQuestion(first.id);

    expect(store.totalCount()).toBe(mockQuestions.length - 1);
    expect(store.answeredQuestions().some((q) => q.id === first.id)).toBe(false);
    expect(store.archivedQuestions().some((q) => q.id === first.id)).toBe(false);
  });

  it('importFromRaw merges new questions instead of replacing the pool', () => {
    const before = store.totalCount();

    store.importFromRaw([{ text: 'Нове тестове питання', tags: ['test'] }]);

    expect(store.totalCount()).toBe(before + 1);
  });

  it('importFromRaw rejects an empty array', () => {
    const result = store.importFromRaw([]);
    expect(result.ok).toBe(false);
  });

  it('importFromRaw rejects entries without text', () => {
    const result = store.importFromRaw([{ text: '' }]);
    expect(result.ok).toBe(false);
  });

  it('addQuestion normalizes tags to lowercase and trims them', () => {
    store.addQuestion({ text: 'Питання з тегами', tags: [' Angular ', 'RxJS'] });

    const added = store.allQuestionsList().find((q) => q.text === 'Питання з тегами');
    expect(added?.tags).toEqual(['angular', 'rxjs']);
  });
});
