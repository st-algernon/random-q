import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { QuestionStore } from '../../core/question-store.service';

@Component({
  selector: 'app-tag-filter',
  templateUrl: './tag-filter.html',
  styleUrl: './tag-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagFilter {
  protected readonly store = inject(QuestionStore);
}
