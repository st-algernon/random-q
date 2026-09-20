import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { QuestionStore } from '../../core/question-store.service';
import { DialogState } from '../../core/dialog-state.service';
import { Question } from '../../core/question.model';

type Tab = 'pending' | 'answered' | 'archived';

@Component({
  selector: 'app-question-list-panel',
  templateUrl: './question-list-panel.html',
  styleUrl: './question-list-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionListPanel {
  protected readonly store = inject(QuestionStore);
  protected readonly dialogState = inject(DialogState);
  protected readonly activeTab = signal<Tab>('pending');
  protected readonly selectedTag = signal('');
  protected readonly selectedIds = signal<Set<string>>(new Set());

  protected readonly filteredAnswered = computed(() =>
    this.byTag(this.store.answeredQuestions()),
  );
  protected readonly filteredPending = computed(() =>
    this.byTag(this.store.pendingQuestions()),
  );
  protected readonly filteredArchived = computed(() =>
    this.byTag(this.store.archivedQuestions()),
  );

  protected readonly currentList = computed<Question[]>(() => {
    switch (this.activeTab()) {
      case 'pending':
        return this.filteredPending();
      case 'answered':
        return this.filteredAnswered();
      case 'archived':
        return this.filteredArchived();
    }
  });

  protected readonly allSelected = computed(() => {
    const list = this.currentList();
    return list.length > 0 && list.every((q) => this.selectedIds().has(q.id));
  });

  protected setTab(tab: Tab): void {
    this.activeTab.set(tab);
    this.selectedIds.set(new Set());
  }

  protected onTagChange(event: Event): void {
    this.selectedTag.set((event.target as HTMLSelectElement).value);
    this.selectedIds.set(new Set());
  }

  protected toggleSelect(id: string): void {
    const next = new Set(this.selectedIds());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selectedIds.set(next);
  }

  protected toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.currentList().map((q) => q.id)));
    }
  }

  protected editSelected(): void {
    const ids = [...this.selectedIds()];
    if (ids.length !== 1) return;
    const [id] = ids;
    const question = this.currentList().find((q) => q.id === id);
    if (!question) return;
    this.dialogState.openForEdit(question, () => {
      this.selectedIds.update((set) => {
        if (!set.has(id)) return set;
        const next = new Set(set);
        next.delete(id);
        return next;
      });
    });
  }

  protected deleteSelected(): void {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) return;
    if (confirm(`Delete ${ids.length} question(s)? This can't be undone.`)) {
      for (const id of ids) this.store.deleteQuestion(id);
      this.selectedIds.set(new Set());
    }
  }

  protected archiveSelected(): void {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) return;
    if (confirm(`Archive ${ids.length} question(s)?`)) {
      for (const id of ids) this.store.archiveQuestion(id);
      this.selectedIds.set(new Set());
    }
  }

  protected resetSelected(): void {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) return;
    for (const id of ids) this.store.returnToPool(id);
    this.selectedIds.set(new Set());
  }

  protected restoreSelected(): void {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) return;
    for (const id of ids) this.store.restoreFromArchive(id);
    this.selectedIds.set(new Set());
  }

  private byTag(list: Question[]): Question[] {
    const tag = this.selectedTag();
    if (!tag) return list;
    return list.filter((q) => q.tags.includes(tag));
  }
}
