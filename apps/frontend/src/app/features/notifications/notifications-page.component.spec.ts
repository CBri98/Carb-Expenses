import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { NotificationsPageComponent } from './notifications-page.component';

describe('NotificationsPageComponent', () => {
  it('ripristina filtri dai query parameter e li riscrive tornando a pagina 1', () => {
    const queryParamMap = new BehaviorSubject(convertToParamMap({
      page: '3', status: 'UNREAD', type: 'EXPENSE_REMINDER',
    }));
    const navigate = vi.fn(() => Promise.resolve(true));
    const service = {
      unreadCount: () => 2,
      refreshUnreadCount: vi.fn(() => of(2)),
      list: vi.fn(() => of({ items: [], meta: { page: 3, pageSize: 20, totalItems: 0, totalPages: 0 } })),
    };
    TestBed.configureTestingModule({
      providers: [
        NotificationsPageComponent,
        ToastService,
        { provide: NotificationService, useValue: service },
        { provide: ActivatedRoute, useValue: { queryParamMap, snapshot: {}, } },
        { provide: Router, useValue: { navigate } },
      ],
    });
    const component = TestBed.inject(NotificationsPageComponent);
    expect(component.query()).toMatchObject({ page: 3, status: 'UNREAD', type: 'EXPENSE_REMINDER' });
    component.applyFilters({ search: '', status: 'READ', type: '', expenseId: '', dateFrom: '', dateTo: '' });
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { status: 'READ', page: 1 } }));
  });
});
