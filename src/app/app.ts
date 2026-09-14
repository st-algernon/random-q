import { Component } from '@angular/core';
import { TagFilter } from './components/tag-filter/tag-filter';
import { QuestionCard } from './components/question-card/question-card';
import { QuestionListPanel } from './components/question-list-panel/question-list-panel';
import { Toolbar } from './components/toolbar/toolbar';

@Component({
  selector: 'app-root',
  imports: [TagFilter, QuestionCard, QuestionListPanel, Toolbar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
