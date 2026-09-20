import { Injectable, signal } from '@angular/core';
import { Question } from './question.model';

export type DialogMode = 'manual' | 'import';

/** Shared open/edit state for the add-question dialog, so any component can trigger it. */
@Injectable({ providedIn: 'root' })
export class DialogState {
  readonly open = signal(false);
  readonly mode = signal<DialogMode>('manual');
  readonly editingQuestion = signal<Question | null>(null);
  private onSaved: (() => void) | null = null;

  openForCreate(): void {
    this.editingQuestion.set(null);
    this.onSaved = null;
    this.mode.set('manual');
    this.open.set(true);
  }

  /** `onSaved` fires only once the edit is actually saved — not on cancel/escape. */
  openForEdit(question: Question, onSaved?: () => void): void {
    this.editingQuestion.set(question);
    this.onSaved = onSaved ?? null;
    this.mode.set('manual');
    this.open.set(true);
  }

  notifySaved(): void {
    this.onSaved?.();
  }

  close(): void {
    this.open.set(false);
  }
}
