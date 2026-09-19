import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { QuestionStore } from '../../core/question-store.service';
import { Question } from '../../core/question.model';

type Tab = 'answered' | 'all' | 'archived';

@Component({
  selector: 'app-question-list-panel',
  templateUrl: './question-list-panel.html',
  styleUrl: './question-list-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionListPanel {
  protected readonly store = inject(QuestionStore);
  protected readonly activeTab = signal<Tab>('answered');
  protected readonly selectedTag = signal('');

  protected readonly filteredAnswered = computed(() =>
    this.byTag(this.store.answeredQuestions()),
  );
  protected readonly filteredAll = computed(() => this.byTag(this.store.allQuestionsList()));
  protected readonly filteredArchived = computed(() =>
    this.byTag(this.store.archivedQuestions()),
  );

  protected onTagChange(event: Event): void {
    this.selectedTag.set((event.target as HTMLSelectElement).value);
  }

  protected deleteQuestion(id: string, text: string): void {
    if (confirm(`Видалити питання "${text}"? Дію не можна скасувати (окрім повторного імпорту).`)) {
      this.store.deleteQuestion(id);
    }
  }

  protected deleteAll(): void {
    const list = this.filteredAll();
    if (list.length === 0) return;
    if (!this.selectedTag()) {
      if (confirm('Видалити ВСІ питання без винятку? Дію не можна скасувати.')) {
        this.store.deleteAllQuestions();
      }
      return;
    }
    if (
      confirm(
        `Видалити ${list.length} питання(нь) з тегом "${this.selectedTag()}"? Дію не можна скасувати.`,
      )
    ) {
      for (const q of list) {
        this.store.deleteQuestion(q.id);
      }
    }
  }

  protected resetAllAnswered(): void {
    const list = this.filteredAnswered();
    if (list.length === 0) return;
    if (!this.selectedTag()) {
      this.store.resetAllAnswered();
      return;
    }
    for (const q of list) {
      this.store.returnToPool(q.id);
    }
  }

  protected archiveAllAnswered(): void {
    const list = this.filteredAnswered();
    if (list.length === 0) return;
    if (confirm(`Архівувати ${list.length} питання(нь)?`)) {
      for (const q of list) {
        this.store.archiveQuestion(q.id);
      }
    }
  }

  private byTag(list: Question[]): Question[] {
    const tag = this.selectedTag();
    if (!tag) return list;
    return list.filter((q) => q.tags.includes(tag));
  }
}
