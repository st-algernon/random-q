import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { QuestionStore } from '../../core/question-store.service';
import { AddQuestionDialog } from '../add-question-dialog/add-question-dialog';

@Component({
  selector: 'app-toolbar',
  imports: [AddQuestionDialog],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toolbar {
  protected readonly store = inject(QuestionStore);
}
