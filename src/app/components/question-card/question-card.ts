import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { QuestionStore } from '../../core/question-store.service';
import { Stopwatch } from '../stopwatch/stopwatch';

@Component({
  selector: 'app-question-card',
  imports: [Stopwatch],
  templateUrl: './question-card.html',
  styleUrl: './question-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionCard {
  protected readonly store = inject(QuestionStore);

  protected revealedFollowUps(): string[] {
    const q = this.store.currentQuestion();
    if (!q?.followUps) return [];
    return q.followUps.slice(0, this.store.revealedFollowUpCount());
  }

  protected hasMoreFollowUps(): boolean {
    const q = this.store.currentQuestion();
    const total = q?.followUps?.length ?? 0;
    return this.store.revealedFollowUpCount() < total;
  }
}
