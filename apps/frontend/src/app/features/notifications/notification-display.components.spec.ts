import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { UnreadNotificationBadgeComponent } from './notification-display.components';

describe('UnreadNotificationBadgeComponent', () => {
  it('nasconde lo zero e mostra il limite 9+ con testo accessibile', async () => {
    await TestBed.configureTestingModule({ imports: [UnreadNotificationBadgeComponent] }).compileComponents();
    const fixture = TestBed.createComponent(UnreadNotificationBadgeComponent);
    fixture.componentRef.setInput('count', 0); fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('');
    fixture.componentRef.setInput('count', 12); fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('9+');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('12 notifiche non lette');
  });
});
