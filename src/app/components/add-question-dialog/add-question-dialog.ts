import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuestionStore } from '../../core/question-store.service';
import { RawQuestion } from '../../core/question.model';

type Mode = 'manual' | 'import';

@Component({
  selector: 'app-add-question-dialog',
  imports: [FormsModule],
  templateUrl: './add-question-dialog.html',
  styleUrl: './add-question-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddQuestionDialog {
  private readonly store = inject(QuestionStore);

  protected readonly open = signal(false);
  protected readonly mode = signal<Mode>('manual');
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);

  protected readonly text = signal('');
  protected readonly tagsInput = signal('');
  protected readonly followUps = signal<string[]>([]);

  openDialog(): void {
    this.open.set(true);
    this.mode.set('manual');
    this.error.set(null);
    this.notice.set(null);
  }

  closeDialog(): void {
    this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) this.closeDialog();
  }

  protected setMode(mode: Mode): void {
    this.mode.set(mode);
    this.error.set(null);
    this.notice.set(null);
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
    const result = this.store.addQuestion(raw);
    if (!result.ok) {
      this.error.set(result.error ?? 'Не вдалось додати питання.');
      return;
    }
    this.error.set(null);
    this.notice.set('✓ додано');
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
        this.error.set(result.error ?? 'Помилка імпорту.');
        return;
      }
      this.error.set(null);
      this.notice.set(`✓ додано питань: ${result.added}`);
      setTimeout(() => this.closeDialog(), 700);
    } catch {
      this.error.set('Некоректний JSON-файл.');
    } finally {
      input.value = '';
    }
  }
}
