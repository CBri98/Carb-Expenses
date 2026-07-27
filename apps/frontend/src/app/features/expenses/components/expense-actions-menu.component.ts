import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  PLATFORM_ID,
  Renderer2,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import type { ExpenseListItem, ExpenseStatus } from '../../../shared/models/expense.models';

@Component({
  selector: 'app-expense-actions-menu',
  standalone: true,
  template: `
    <button
      #trigger
      class="btn btn-sm btn-outline-secondary"
      type="button"
      aria-haspopup="menu"
      [attr.aria-controls]="menuId()"
      [attr.aria-expanded]="open()"
      [attr.aria-label]="'Altre azioni per ' + expense().description"
      (click)="toggle($event)"
    >
      <i class="bi bi-three-dots-vertical" aria-hidden="true"></i>
    </button>
    @if (open()) {
      <div #panel class="expense-actions-panel shadow" [id]="menuId()" role="menu">
        <button type="button" role="menuitem" (click)="runDuplicate()"><i class="bi bi-copy" aria-hidden="true"></i>Duplica</button>
        @if (expense().status !== 'COMPLETED') {
          <button type="button" role="menuitem" (click)="runStatus('COMPLETED')"><i class="bi bi-check-circle" aria-hidden="true"></i>Segna completata</button>
        }
        @if (expense().status !== 'PLANNED') {
          <button type="button" role="menuitem" (click)="runStatus('PLANNED')"><i class="bi bi-clock" aria-hidden="true"></i>Segna pianificata</button>
        }
        @if (expense().status !== 'CANCELLED') {
          <button type="button" role="menuitem" (click)="runStatus('CANCELLED')"><i class="bi bi-x-circle" aria-hidden="true"></i>Annulla</button>
        }
        <button class="text-danger" type="button" role="menuitem" (click)="runRemove()"><i class="bi bi-trash" aria-hidden="true"></i>Elimina</button>
      </div>
    }
  `,
  styles: [`
    :host { display: inline-flex; }
    .expense-actions-panel {
      position: fixed;
      z-index: 2000;
      display: grid;
      min-width: 13rem;
      padding: .35rem;
      background: var(--surface);
      border: 1px solid var(--border-color);
      border-radius: .6rem;
      box-shadow: var(--shadow-md);
    }
    .expense-actions-panel button {
      display: flex;
      gap: .55rem;
      align-items: center;
      padding: .55rem .65rem;
      color: var(--text-primary);
      text-align: left;
      background: var(--surface);
      border: 0;
      border-radius: .35rem;
    }
    .expense-actions-panel button:hover,
    .expense-actions-panel button:focus-visible { background: var(--surface-soft); }
  `],
})
export class ExpenseActionsMenuComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly renderer = inject(Renderer2);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLDivElement>>('panel');
  private placementTimer: ReturnType<typeof setTimeout> | null = null;

  readonly expense = input.required<ExpenseListItem>();
  readonly open = signal(false);
  readonly duplicate = output<void>();
  readonly statusChange = output<ExpenseStatus>();
  readonly remove = output<void>();
  readonly menuId = () => `expense-actions-${this.expense().id}`;

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (this.open()) {
      this.close();
      return;
    }
    this.open.set(true);
    if (!isPlatformBrowser(this.platformId)) return;
    this.placementTimer = setTimeout(() => this.attachAndPosition(), 0);
  }

  @HostListener('document:pointerdown', ['$event'])
  closeOutside(event: PointerEvent): void {
    if (!this.open()) return;
    const target = event.target as Node | null;
    if (target && (this.trigger().nativeElement.contains(target) || this.panel()?.nativeElement.contains(target))) return;
    this.close();
  }

  @HostListener('document:keydown.escape', ['$event'])
  closeWithEscape(event: Event): void {
    if (!this.open()) return;
    event.preventDefault();
    this.close(true);
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  closeOnViewportChange(): void {
    if (this.open()) this.close();
  }

  runDuplicate(): void {
    this.close();
    this.duplicate.emit();
  }
  runStatus(status: ExpenseStatus): void {
    this.close();
    this.statusChange.emit(status);
  }
  runRemove(): void {
    this.close();
    this.remove.emit();
  }

  ngOnDestroy(): void {
    if (this.placementTimer) clearTimeout(this.placementTimer);
    const panel = this.panel()?.nativeElement;
    if (panel?.parentNode === this.document.body) this.renderer.removeChild(this.document.body, panel);
  }

  private close(restoreFocus = false): void {
    if (this.placementTimer) {
      clearTimeout(this.placementTimer);
      this.placementTimer = null;
    }
    this.open.set(false);
    if (restoreFocus) this.trigger().nativeElement.focus();
  }

  private attachAndPosition(): void {
    this.placementTimer = null;
    const trigger = this.trigger().nativeElement;
    const panel = this.panel()?.nativeElement;
    if (!panel || !this.open()) return;
    this.renderer.appendChild(this.document.body, panel);

    const triggerRect = trigger.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const margin = 8;
    const left = Math.min(
      Math.max(margin, triggerRect.right - panelRect.width),
      window.innerWidth - panelRect.width - margin,
    );
    const below = triggerRect.bottom + 6;
    const top = below + panelRect.height <= window.innerHeight - margin
      ? below
      : Math.max(margin, triggerRect.top - panelRect.height - 6);
    this.renderer.setStyle(panel, 'left', `${left}px`);
    this.renderer.setStyle(panel, 'top', `${top}px`);
    panel.querySelector<HTMLButtonElement>('button')?.focus();
  }
}
