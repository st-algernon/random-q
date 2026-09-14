import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { QuestionStore } from '../../core/question-store.service';

type Tab = 'answered' | 'all';

@Component({
  selector: 'app-question-list-panel',
  templateUrl: './question-list-panel.html',
  styleUrl: './question-list-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionListPanel {
  protected readonly store = inject(QuestionStore);
  protected readonly activeTab = signal<Tab>('answered');

  protected deleteQuestion(id: string, text: string): void {
    if (confirm(`Видалити питання "${text}"? Дію не можна скасувати (окрім повторного імпорту).`)) {
      this.store.deleteQuestion(id);
    }
  }

  protected deleteAll(): void {
    if (confirm('Видалити ВСІ питання без винятку? Дію не можна скасувати.')) {
      this.store.deleteAllQuestions();
    }
  }
}
