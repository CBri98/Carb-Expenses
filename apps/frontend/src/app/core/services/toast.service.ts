import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  text: string;
  tone: 'success' | 'danger' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly state = signal<ToastMessage | null>(null);
  private timeout: ReturnType<typeof setTimeout> | null = null;
  readonly message = this.state.asReadonly();

  show(text: string, tone: ToastMessage['tone'] = 'success'): void {
    if (this.timeout) clearTimeout(this.timeout);
    this.state.set({ text, tone });
    this.timeout = setTimeout(() => this.dismiss(), 4_000);
  }

  dismiss(): void {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = null;
    this.state.set(null);
  }
}
