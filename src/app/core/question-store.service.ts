import { Injectable, computed, effect, signal } from '@angular/core';
import { Question, RawQuestion } from './question.model';

const ANSWERED_KEY = 'randomq.answeredIds';
const CUSTOM_QUESTIONS_KEY = 'randomq.customQuestions';

function readLocalStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode, quota) — silently ignore
  }
}

function normalize(raw: RawQuestion[], idPrefix = 'q'): Question[] {
  return raw.map((q, index) => ({
    id: q.id?.trim() || `${idPrefix}-${index}-${q.text.slice(0, 24)}`,
    text: q.text,
    tags: (q.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean),
    followUps: (q.followUps ?? []).filter((f) => f.trim().length > 0),
  }));
}

function uniqueId(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

@Injectable({ providedIn: 'root' })
export class QuestionStore {
  private readonly allQuestions = signal<Question[]>([]);
  private readonly answeredIds = signal<Set<string>>(
    new Set(readLocalStorage<string[]>(ANSWERED_KEY) ?? []),
  );
  readonly selectedTags = signal<Set<string>>(new Set());
  readonly currentQuestionId = signal<string | null>(null);
  readonly revealedFollowUpCount = signal(0);
  readonly loadError = signal<string | null>(null);
  readonly loading = signal(true);

  readonly availableTags = computed(() => {
    const tags = new Set<string>();
    for (const q of this.allQuestions()) {
      for (const t of q.tags) tags.add(t);
    }
    return [...tags].sort();
  });

  readonly filteredPool = computed(() => {
    const selected = this.selectedTags();
    const answered = this.answeredIds();
    return this.allQuestions().filter(
      (q) =>
        !answered.has(q.id) &&
        (selected.size === 0 || q.tags.some((t) => selected.has(t))),
    );
  });

  readonly answeredQuestions = computed(() => {
    const answered = this.answeredIds();
    return this.allQuestions()
      .filter((q) => answered.has(q.id))
      .reverse();
  });

  readonly currentQuestion = computed<Question | null>(() => {
    const id = this.currentQuestionId();
    if (!id) return null;
    return this.allQuestions().find((q) => q.id === id) ?? null;
  });

  readonly allQuestionsList = computed(() => this.allQuestions());
  readonly totalCount = computed(() => this.allQuestions().length);
  readonly answeredCount = computed(() => this.answeredIds().size);

  constructor() {
    effect(() => {
      writeLocalStorage(ANSWERED_KEY, [...this.answeredIds()]);
    });

    const custom = readLocalStorage<RawQuestion[]>(CUSTOM_QUESTIONS_KEY);
    if (custom !== null) {
      this.allQuestions.set(normalize(custom));
      this.loading.set(false);
    } else {
      this.loadDefaultQuestions();
    }
  }

  private async loadDefaultQuestions(): Promise<void> {
    try {
      const res = await fetch('questions.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = (await res.json()) as RawQuestion[];
      this.allQuestions.set(normalize(raw));
    } catch (err) {
      this.loadError.set(
        'Не вдалось завантажити questions.json. Імпортуйте свій файл.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  /** Merges imported questions into the existing pool (does not replace it). */
  importFromRaw(raw: RawQuestion[]): { ok: boolean; error?: string; added?: number } {
    if (!Array.isArray(raw) || raw.length === 0) {
      return { ok: false, error: 'Очікується непорожній масив питань.' };
    }
    if (raw.some((q) => typeof q?.text !== 'string' || !q.text.trim())) {
      return { ok: false, error: 'Кожне питання повинно мати поле "text".' };
    }
    const incoming = normalize(raw, `import-${Date.now()}`);
    const existingIds = new Set(this.allQuestions().map((q) => q.id));
    const withUniqueIds = incoming.map((q) => {
      const id = uniqueId(q.id, existingIds);
      existingIds.add(id);
      return { ...q, id };
    });
    const merged = [...this.allQuestions(), ...withUniqueIds];
    this.allQuestions.set(merged);
    this.loadError.set(null);
    this.persistAsCustom(merged);
    return { ok: true, added: withUniqueIds.length };
  }

  addQuestion(raw: RawQuestion): { ok: boolean; error?: string } {
    if (!raw.text || !raw.text.trim()) {
      return { ok: false, error: "Текст питання обов'язковий." };
    }
    const [normalized] = normalize([raw], `manual-${Date.now()}`);
    const existingIds = new Set(this.allQuestions().map((q) => q.id));
    const question: Question = { ...normalized, id: uniqueId(normalized.id, existingIds) };
    const merged = [...this.allQuestions(), question];
    this.allQuestions.set(merged);
    this.persistAsCustom(merged);
    return { ok: true };
  }

  private persistAsCustom(list: Question[]): void {
    writeLocalStorage(CUSTOM_QUESTIONS_KEY, list);
  }

  toggleTag(tag: string): void {
    const next = new Set(this.selectedTags());
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    this.selectedTags.set(next);
  }

  clearTagFilter(): void {
    this.selectedTags.set(new Set());
  }

  pickRandom(): void {
    const pool = this.filteredPool();
    if (pool.length === 0) {
      this.currentQuestionId.set(null);
      return;
    }
    const idx = Math.floor(Math.random() * pool.length);
    this.currentQuestionId.set(pool[idx].id);
    this.revealedFollowUpCount.set(0);
  }

  revealNextFollowUp(): void {
    const q = this.currentQuestion();
    if (!q) return;
    const max = q.followUps?.length ?? 0;
    this.revealedFollowUpCount.update((n) => Math.min(n + 1, max));
  }

  markCurrentAnswered(): void {
    const id = this.currentQuestionId();
    if (!id) return;
    this.answeredIds.update((set) => new Set(set).add(id));
    this.currentQuestionId.set(null);
    this.revealedFollowUpCount.set(0);
    this.pickRandom();
  }

  returnToPool(id: string): void {
    this.answeredIds.update((set) => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });
  }

  resetAllAnswered(): void {
    this.answeredIds.set(new Set());
  }

  isAnswered(id: string): boolean {
    return this.answeredIds().has(id);
  }

  deleteQuestion(id: string): void {
    const remaining = this.allQuestions().filter((q) => q.id !== id);
    this.allQuestions.set(remaining);
    if (this.answeredIds().has(id)) {
      this.answeredIds.update((set) => {
        const next = new Set(set);
        next.delete(id);
        return next;
      });
    }
    if (this.currentQuestionId() === id) {
      this.currentQuestionId.set(null);
      this.revealedFollowUpCount.set(0);
    }
    this.persistAsCustom(remaining);
  }

  deleteAllQuestions(): void {
    this.allQuestions.set([]);
    this.answeredIds.set(new Set());
    this.currentQuestionId.set(null);
    this.revealedFollowUpCount.set(0);
    this.persistAsCustom([]);
  }
}
