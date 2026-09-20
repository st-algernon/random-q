import { ChangeDetectionStrategy, Component, HostListener, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuestionStore } from '../../core/question-store.service';
import { DialogState } from '../../core/dialog-state.service';
import { RawQuestion } from '../../core/question.model';

@Component({
  selector: 'app-add-question-dialog',
  imports: [FormsModule],
  templateUrl: './add-question-dialog.html',
  styleUrl: './add-question-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddQuestionDialog {
  private readonly store = inject(QuestionStore);
  protected readonly dialogState = inject(DialogState);

  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);

  protected readonly text = signal('');
  protected readonly tagsInput = signal('');
  protected readonly followUps = signal<string[]>([]);

  constructor() {
    effect(() => {
      if (!this.dialogState.open()) return;
      const editing = this.dialogState.editingQuestion();
      this.error.set(null);
      this.notice.set(null);
      this.text.set(editing?.text ?? '');
      this.tagsInput.set(editing?.tags.join(', ') ?? '');
      this.followUps.set(editing?.followUps ? [...editing.followUps] : []);
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.dialogState.open()) this.dialogState.close();
  }

  protected addFollowUp(): void {
    this.followUps.update((list) => [...list, '']);
  }

  protected updateFollowUp(index: number, value: string): void {
    this.followUps.update((list) => list.map((v, i) => (i === index ? value : v)));
  }

  protected removeFollowUp(index: number): void {
    this.followUps.update((list) => list.filter((_, i) => i !== index));
  }

  protected submitManual(): void {
    const raw: RawQuestion = {
      text: this.text(),
      tags: this.tagsInput()
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      followUps: this.followUps().filter((f) => f.trim().length > 0),
    };

    const editing = this.dialogState.editingQuestion();
    if (editing) {
      const result = this.store.updateQuestion(editing.id, raw);
      if (!result.ok) {
        this.error.set(result.error ?? 'Could not save the question.');
        return;
      }
      this.error.set(null);
      this.dialogState.notifySaved();
      this.dialogState.close();
      return;
    }

    const result = this.store.addQuestion(raw);
    if (!result.ok) {
      this.error.set(result.error ?? 'Could not add the question.');
      return;
    }
    this.error.set(null);
    this.notice.set('✓ added');
    this.text.set('');
    this.tagsInput.set('');
    this.followUps.set([]);
  }

  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const raw = JSON.parse(text) as RawQuestion[];
      const result = this.store.importFromRaw(raw);
      if (!result.ok) {
        this.error.set(result.error ?? 'Import failed.');
        return;
      }
      this.error.set(null);
      this.notice.set(`✓ added ${result.added} question(s)`);
      setTimeout(() => this.dialogState.close(), 700);
    } catch {
      this.error.set('Invalid JSON file.');
    } finally {
      input.value = '';
    }
  }
}
