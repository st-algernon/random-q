import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { QuestionStore } from '../../core/question-store.service';
import { Stopwatch, formatElapsed } from '../stopwatch/stopwatch';

@Component({
  selector: 'app-question-card',
  imports: [Stopwatch],
  templateUrl: './question-card.html',
  styleUrl: './question-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionCard {
  protected readonly store = inject(QuestionStore);

  /** Per-segment durations (index 0 = main question, index i = follow-up i-1), frozen at each transition. */
  private readonly segmentDurationsMs = signal<number[]>([]);
  private lastBoundaryMs = 0;
  /** True once the final segment's time has been frozen and we're waiting for a confirming click to move on. */
  protected readonly awaitingNext = signal(false);

  constructor() {
    effect(() => {
      this.store.currentQuestion()?.id;
      this.segmentDurationsMs.set([]);
      this.lastBoundaryMs = 0;
      this.awaitingNext.set(false);
    });
  }

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

  /** Frozen duration for segment `index` (0 = main question, i = follow-up i-1), or null if not finished yet. */
  protected segmentLabel(index: number): string | null {
    const list = this.segmentDurationsMs();
    return index < list.length ? formatElapsed(list[index]) : null;
  }

  protected advanceFollowUp(totalElapsedMs: number): void {
    this.recordSegment(totalElapsedMs);
    this.store.revealNextFollowUp();
  }

  /**
   * First click marks the question answered right away and freezes/stops the clock so the last
   * segment's time stays visible; second click just moves on to a new question.
   */
  protected requestFinish(stopwatch: Stopwatch): void {
    if (!this.awaitingNext()) {
      this.recordSegment(stopwatch.elapsedMs());
      stopwatch.pause();
      const id = this.store.currentQuestion()?.id;
      if (id) this.store.markAnswered(id);
      this.awaitingNext.set(true);
      return;
    }
    this.store.advanceToNextQuestion();
  }

  private recordSegment(totalElapsedMs: number): void {
    const duration = Math.max(0, totalElapsedMs - this.lastBoundaryMs);
    this.lastBoundaryMs = totalElapsedMs;
    this.segmentDurationsMs.update((list) => [...list, duration]);
  }
}
