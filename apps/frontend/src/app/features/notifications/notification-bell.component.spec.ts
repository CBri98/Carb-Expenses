import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { NotificationBellComponent } from './notification-bell.component';

describe('NotificationBellComponent', () => {
  afterEach(() => vi.useRealTimers());

  it('esegue polling leggero e lo interrompe alla distruzione', async () => {
    vi.useFakeTimers();
    const unread = signal(2);
    const refreshUnreadCount = vi.fn(() => of(2));
    const list = vi.fn(() => of({ items: [], meta: { page: 1, pageSize: 5, totalItems: 0, totalPages: 0 } }));
    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { authenticated: signal(true).asReadonly() } },
        {
          provide: NotificationService,
          useValue: {
            unreadCount: unread.asReadonly(), countLoading: signal(false).asReadonly(),
            refreshUnreadCount, list, markRead: vi.fn(), markAllRead: vi.fn(),
          },
        },
        ToastService,
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(NotificationBellComponent);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(0);
    expect(refreshUnreadCount).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(environment.notificationPollIntervalMs);
    expect(refreshUnreadCount).toHaveBeenCalledTimes(2);
    fixture.destroy();
    await vi.advanceTimersByTimeAsync(environment.notificationPollIntervalMs);
    expect(refreshUnreadCount).toHaveBeenCalledTimes(2);
  });

  it('apre il dropdown e carica soltanto cinque recenti', async () => {
    const list = vi.fn(() => of({ items: [], meta: { page: 1, pageSize: 5, totalItems: 0, totalPages: 0 } }));
    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { authenticated: signal(false).asReadonly() } },
        {
          provide: NotificationService,
          useValue: {
            unreadCount: signal(0).asReadonly(), countLoading: signal(false).asReadonly(),
            refreshUnreadCount: vi.fn(() => of(0)), list, markRead: vi.fn(), markAllRead: vi.fn(),
          },
        },
        ToastService,
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(NotificationBellComponent);
    fixture.detectChanges();
    fixture.componentInstance.toggle();
    expect(fixture.componentInstance.open()).toBe(true);
    expect(list).toHaveBeenCalledWith({ page: 1, pageSize: 5 });
    fixture.destroy();
  });

  it('resta aperto per i click interni e si chiude con click esterno o Escape', async () => {
    const list = vi.fn(() => of({ items: [], meta: { page: 1, pageSize: 5, totalItems: 0, totalPages: 0 } }));
    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { authenticated: signal(false).asReadonly() } },
        {
          provide: NotificationService,
          useValue: {
            unreadCount: signal(0).asReadonly(), countLoading: signal(false).asReadonly(),
            refreshUnreadCount: vi.fn(() => of(0)), list, markRead: vi.fn(), markAllRead: vi.fn(),
          },
        },
        ToastService,
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(NotificationBellComponent);
    fixture.detectChanges();
    fixture.componentInstance.toggle();
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.notification-bell__button')
      .dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(fixture.componentInstance.open()).toBe(true);

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(fixture.componentInstance.open()).toBe(false);

    fixture.componentInstance.toggle();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(fixture.componentInstance.open()).toBe(false);
    fixture.destroy();
  });
});
