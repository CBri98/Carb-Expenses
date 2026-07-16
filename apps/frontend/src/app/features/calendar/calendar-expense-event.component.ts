import { Component, input, output } from '@angular/core';

import {
  EuroAmountPipe,
  ExpenseStatusBadgeComponent,
} from '../../shared/components/expense-display.components';
import type { CalendarExpenseEvent } from '../../shared/models/calendar.models';
import type { ExpenseStatus } from '../../shared/models/expense.models';

@Component({
  selector: 'app-calendar-expense-event',
  standalone: true,
  imports: [EuroAmountPipe, ExpenseStatusBadgeComponent],
  template: `
    <article
      class="calendar-event"
      [class.calendar-event--overdue]="event().isOverdue"
      [class.calendar-event--busy]="busy()"
      [style.--category-color]="event().category.color"
      [attr.draggable]="event().status === 'PLANNED' && !busy() ? 'true' : null"
      (dragstart)="onDragStart($event)"
    >
      <button
        class="calendar-event__main"
        type="button"
        [disabled]="busy()"
        [attr.aria-label]="'Apri ' + event().title + ', ' + (event().amount | euroAmount)"
        (click)="opened.emit()"
      >
        <span class="calendar-event__time">
          <i class="bi" [class.bi-clock]="event().expenseTime" [class.bi-calendar-event]="!event().expenseTime" aria-hidden="true"></i>
          {{ event().expenseTime || 'Tutto il giorno' }}
        </span>
        <strong class="calendar-event__title">{{ event().title }}</strong>
        <span class="calendar-event__amount">{{ event().amount | euroAmount }}</span>
        <span class="calendar-event__category">
          <i class="bi" [class]="event().category.icon" aria-hidden="true"></i>
          {{ event().category.name }}
        </span>
      </button>

      <div class="calendar-event__meta">
        <app-expense-status-badge [status]="event().status" />
        @if (event().isOverdue) {
          <span class="badge text-bg-danger">
            <i class="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>Scaduta
          </span>
        }
      </div>

      <div class="calendar-event__actions" aria-label="Azioni rapide">
        <button class="btn btn-sm btn-light" type="button" [disabled]="busy()" aria-label="Modifica spesa" title="Modifica" (click)="edited.emit()">
          <i class="bi bi-pencil" aria-hidden="true"></i>
        </button>
        @if (event().status === 'PLANNED') {
          <button class="btn btn-sm btn-light" type="button" [disabled]="busy()" aria-label="Segna come completata" title="Completa" (click)="statusRequested.emit('COMPLETED')">
            <i class="bi bi-check-lg" aria-hidden="true"></i>
          </button>
          <button class="btn btn-sm btn-light" type="button" [disabled]="busy()" aria-label="Cambia data" title="Cambia data" (click)="dateChangeRequested.emit()">
            <i class="bi bi-calendar2-week" aria-hidden="true"></i>
          </button>
          <button class="btn btn-sm btn-light" type="button" [disabled]="busy()" aria-label="Annulla spesa" title="Annulla" (click)="statusRequested.emit('CANCELLED')">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        } @else if (event().status === 'CANCELLED') {
          <button class="btn btn-sm btn-light" type="button" [disabled]="busy()" aria-label="Ripristina come pianificata" title="Ripristina" (click)="statusRequested.emit('PLANNED')">
            <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
          </button>
        }
      </div>

      @if (event().status === 'PLANNED') {
        <p class="calendar-event__drag-help">
          <i class="bi bi-grip-vertical" aria-hidden="true"></i>
          Trascinabile; “Cambia data” è l’alternativa da tastiera.
        </p>
      }
    </article>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .calendar-event {
      --category-color: #9bafd6;
      position: relative;
      min-width: 0;
      padding: .55rem;
      border: 1px solid color-mix(in srgb, var(--category-color) 44%, #fff);
      border-left: .28rem solid var(--category-color);
      border-radius: .65rem;
      background: color-mix(in srgb, var(--category-color) 12%, #fff);
      box-shadow: 0 .1rem .35rem rgba(57, 69, 93, .08);
    }
    .calendar-event[draggable='true'] { cursor: grab; }
    .calendar-event[draggable='true']:active { cursor: grabbing; }
    .calendar-event--overdue { border-style: solid; box-shadow: inset 0 0 0 1px rgba(181, 57, 57, .2); }
    .calendar-event--busy { opacity: .65; }
    .calendar-event__main {
      display: grid;
      width: 100%;
      min-width: 0;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: .05rem .4rem;
      padding: 0;
      color: inherit;
      text-align: left;
      border: 0;
      background: transparent;
    }
    .calendar-event__main:focus-visible { outline: 3px solid rgba(73, 98, 150, .35); outline-offset: 2px; border-radius: .25rem; }
    .calendar-event__time, .calendar-event__category { overflow: hidden; color: #657089; font-size: .73rem; text-overflow: ellipsis; white-space: nowrap; }
    .calendar-event__title { overflow: hidden; font-size: .88rem; text-overflow: ellipsis; white-space: nowrap; }
    .calendar-event__amount { font-size: .82rem; font-weight: 700; white-space: nowrap; }
    .calendar-event__meta, .calendar-event__actions { display: flex; flex-wrap: wrap; gap: .25rem; margin-top: .4rem; }
    .calendar-event__actions .btn { padding: .15rem .38rem; border: 1px solid rgba(83, 94, 119, .16); }
    .calendar-event__drag-help { margin: .35rem 0 0; color: #657089; font-size: .68rem; line-height: 1.25; }
    @media (max-width: 991.98px) { .calendar-event__drag-help { display: none; } }
  `],
})
export class CalendarExpenseEventComponent {
  readonly event = input.required<CalendarExpenseEvent>();
  readonly busy = input(false);
  readonly opened = output<void>();
  readonly edited = output<void>();
  readonly statusRequested = output<ExpenseStatus>();
  readonly dateChangeRequested = output<void>();
  readonly dragStarted = output<string>();

  onDragStart(domEvent: DragEvent): void {
    if (this.event().status !== 'PLANNED' || this.busy()) {
      domEvent.preventDefault();
      return;
    }
    domEvent.dataTransfer?.setData('text/plain', this.event().id);
    if (domEvent.dataTransfer) domEvent.dataTransfer.effectAllowed = 'move';
    this.dragStarted.emit(this.event().id);
  }
}
