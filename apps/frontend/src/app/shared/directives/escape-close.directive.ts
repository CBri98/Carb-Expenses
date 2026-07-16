import { Directive, HostListener, input, output } from '@angular/core';

@Directive({
  selector: '[appEscapeClose]',
  standalone: true,
})
export class EscapeCloseDirective {
  readonly appEscapeClose = input(true);
  readonly escapeClose = output<void>();

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (!this.appEscapeClose()) return;
    event.preventDefault();
    event.stopPropagation();
    this.escapeClose.emit();
  }
}
