import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/** Ephemeral per-question timer — never persisted, resets whenever questionId changes. */
@Component({
  selector: 'app-stopwatch',
  templateUrl: './stopwatch.html',
  styleUrl: './stopwatch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Stopwatch {
  readonly questionId = input<string | null>(null);

  protected readonly running = signal(false);
  private readonly tick = signal(0);
  private accumulatedMs = 0;
  private startedAt: number | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  /** Public so hosts can snapshot the running total at a segment boundary (e.g. revealing a follow-up). */
  readonly elapsedMs = computed(() => {
    this.tick();
    const live = this.running() && this.startedAt !== null ? Date.now() - this.startedAt : 0;
    return this.accumulatedMs + live;
  });

  protected readonly label = computed(() => formatElapsed(this.elapsedMs()));

  constructor() {
    effect(() => {
      const id = this.questionId();
      untracked(() => {
        if (id !== null) {
          this.resetInternal();
          this.startInternal();
        } else {
          this.pauseInternal();
          this.resetInternal();
        }
      });
    });

    inject(DestroyRef).onDestroy(() => this.stopInterval());
  }

  protected toggle(): void {
    if (this.running()) {
      this.pauseInternal();
    } else if (this.questionId() !== null) {
      this.startInternal();
    }
  }

  /** Public so a host can stop the count once the question is fully answered. */
  pause(): void {
    this.pauseInternal();
  }

  protected reset(): void {
    this.resetInternal();
  }

  private startInternal(): void {
    if (this.running()) return;
    this.startedAt = Date.now();
    this.running.set(true);
    this.startInterval();
  }

  private pauseInternal(): void {
    if (!this.running()) return;
    this.accumulatedMs += Date.now() - (this.startedAt ?? Date.now());
    this.startedAt = null;
    this.running.set(false);
    this.stopInterval();
    this.tick.update((n) => n + 1);
  }

  private resetInternal(): void {
    this.accumulatedMs = 0;
    this.startedAt = this.running() ? Date.now() : null;
    this.tick.update((n) => n + 1);
  }

  private startInterval(): void {
    if (this.intervalId !== null) return;
    this.intervalId = setInterval(() => this.tick.update((n) => n + 1), 1000);
  }

  private stopInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
