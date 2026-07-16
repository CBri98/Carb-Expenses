import { Component, input, output } from '@angular/core';

import { EscapeCloseDirective } from '../directives/escape-close.directive';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [EscapeCloseDirective],
  template: `
    @if (open()) {
      <div
        class="modal d-block"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="dialogId() + '-title'"
        [appEscapeClose]="open() && !busy()"
        (escapeClose)="cancelled.emit()"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content shadow-lg">
            <div class="modal-header">
              <h2 class="modal-title fs-5" [id]="dialogId() + '-title'">{{ title() }}</h2>
              <button
                type="button"
                class="btn-close"
                aria-label="Annulla"
                (click)="cancelled.emit()"
              ></button>
            </div>
            <div class="modal-body">
              <p class="mb-0">{{ message() }}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" (click)="cancelled.emit()">
                Annulla
              </button>
              <button
                type="button"
                class="btn btn-danger"
                [disabled]="busy()"
                (click)="confirmed.emit()"
              >
                @if (busy()) {
                  <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                }
                {{ confirmLabel() }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop show"></div>
    }
  `,
})
export class ConfirmDialogComponent {
  readonly open = input(false);
  readonly title = input('Conferma operazione');
  readonly message = input('Vuoi continuare?');
  readonly confirmLabel = input('Conferma');
  readonly dialogId = input('confirm-dialog');
  readonly busy = input(false);
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
