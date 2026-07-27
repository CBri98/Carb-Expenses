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

import type { RecurrenceRule } from '../../shared/models/recurrence.models';

@Component({
  selector: 'app-recurrence-actions-menu',
  standalone: true,
  template: `
    <button
      #trigger
      class="btn btn-sm btn-outline-secondary"
      type="button"
      aria-haspopup="menu"
      [attr.aria-controls]="menuId()"
      [attr.aria-expanded]="open()"
      [attr.aria-label]="'Altre azioni per ' + rule().name"
      (click)="toggle($event)"
    >
      <i class="bi bi-three-dots-vertical" aria-hidden="true"></i>
    </button>
    @if (open()) {
      <div #panel class="recurrence-actions-panel" [id]="menuId()" role="menu">
        <button type="button" role="menuitem" (click)="run(edit)"><i class="bi bi-pencil" aria-hidden="true"></i>Modifica</button>
        @if (rule().status === 'ACTIVE') {
          <button type="button" role="menuitem" (click)="run(pauseRequested)"><i class="bi bi-pause-circle" aria-hidden="true"></i>Sospendi</button>
        }
        @if (rule().status === 'PAUSED') {
          <button type="button" role="menuitem" (click)="run(resumeRequested)"><i class="bi bi-play-circle" aria-hidden="true"></i>Riprendi</button>
        }
        @if (rule().status === 'ACTIVE' || rule().status === 'PAUSED') {
          <button type="button" role="menuitem" (click)="run(cancelRequested)"><i class="bi bi-stop-circle" aria-hidden="true"></i>Termina</button>
        }
        @if (rule().generatedCount === 0) {
          <button class="text-danger" type="button" role="menuitem" (click)="run(remove)"><i class="bi bi-trash" aria-hidden="true"></i>Elimina</button>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: inline-flex; }
    .recurrence-actions-panel {
      position: fixed;
      z-index: 2000;
      display: grid;
      min-width: 12.5rem;
      padding: .35rem;
      background: var(--surface);
      border: 1px solid var(--border-color);
      border-radius: .6rem;
      box-shadow: var(--shadow-md);
    }
    .recurrence-actions-panel button {
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
    .recurrence-actions-panel button:hover,
    .recurrence-actions-panel button:focus-visible { background: var(--surface-soft); }
  `],
})
export class RecurrenceActionsMenuComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly renderer = inject(Renderer2);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLDivElement>>('panel');
  private placementTimer: ReturnType<typeof setTimeout> | null = null;

  readonly rule = input.required<RecurrenceRule>();
  readonly open = signal(false);
  readonly edit = output<void>();
  readonly pauseRequested = output<void>();
  readonly resumeRequested = output<void>();
  readonly cancelRequested = output<void>();
  readonly remove = output<void>();
  readonly menuId = () => `recurrence-actions-${this.rule().id}`;

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

  run(action: { emit: () => void }): void {
    this.close();
    action.emit();
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
    const left = Math.min(Math.max(margin, triggerRect.right - panelRect.width), window.innerWidth - panelRect.width - margin);
    const below = triggerRect.bottom + 6;
    const top = below + panelRect.height <= window.innerHeight - margin
      ? below
      : Math.max(margin, triggerRect.top - panelRect.height - 6);
    this.renderer.setStyle(panel, 'left', `${left}px`);
    this.renderer.setStyle(panel, 'top', `${top}px`);
    panel.querySelector<HTMLButtonElement>('button')?.focus();
  }
}
