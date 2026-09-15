import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

function formatElapsed(ms: number): string {
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

  protected readonly label = computed(() => {
    this.tick();
    const live = this.running() && this.startedAt !== null ? Date.now() - this.startedAt : 0;
    return formatElapsed(this.accumulatedMs + live);
  });

  constructor() {
    effect(() => {
      if (this.questionId() !== null) {
        this.resetInternal();
        this.startInternal();
      } else {
        this.pauseInternal();
        this.resetInternal();
      }
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
