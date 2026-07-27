import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { apiErrorMessage } from '../../core/services/api-error';
import { RecurrenceService } from '../../core/services/recurrence.service';
import {
  LoadingSkeletonComponent,
  PageHeaderComponent,
} from '../../shared/components/catalog-display.components';
import type {
  RecurrenceFormSubmission,
  RecurrenceRule,
  UpdateRecurrenceRequest,
} from '../../shared/models/recurrence.models';
import { RecurrenceFormComponent } from './recurrence-form.component';

@Component({
  selector: 'app-recurrence-form-page',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, LoadingSkeletonComponent, RecurrenceFormComponent],
  template: `
    <div class="container-fluid px-0">
      <nav aria-label="breadcrumb"><ol class="breadcrumb mb-3"><li class="breadcrumb-item"><a routerLink="/recurrences">Spese ricorrenti</a></li><li class="breadcrumb-item active">{{ editing() ? 'Modifica' : 'Nuova' }}</li></ol></nav>
      <app-page-header [title]="editing() ? 'Modifica ricorrenza' : 'Nuova ricorrenza'" subtitle="Definisci la regola, l’orizzonte e i promemoria delle spese pianificate" />
      @if (error()) { <div class="alert alert-danger" role="alert">{{ error() }}</div> }
      @if (loading()) { <div class="card border-0 shadow-sm"><div class="card-body"><app-loading-skeleton /></div></div> }
      @else { <app-recurrence-form [recurrence]="recurrence()" [submitting]="submitting()" (submitted)="save($event)" (cancelled)="cancel()" /> }
    </div>
  `,
})
export class RecurrenceFormPageComponent {
  private readonly service = inject(RecurrenceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly recurrence = signal<RecurrenceRule | null>(null);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly editing = signal(false);
  private id: string | null = null;

  constructor() {
    this.id = this.route.snapshot.paramMap.get('id');
    this.editing.set(Boolean(this.id));
    if (this.id) this.load(this.id);
  }

  save(submission: RecurrenceFormSubmission): void {
    this.submitting.set(true);
    this.error.set(null);
    const current = this.recurrence();
    const request = this.id
      ? this.service.update(this.id, updatePayload(submission, current))
      : this.service.create(submission.payload);
    request.pipe(
      finalize(() => this.submitting.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (rule) => void this.router.navigate(['/recurrences', rule.id], {
        state: { notice: this.id ? 'Ricorrenza aggiornata.' : 'Ricorrenza creata.' },
      }),
      error: (error: unknown) => this.error.set(apiErrorMessage(error)),
    });
  }

  cancel(): void {
    void this.router.navigate(this.id ? ['/recurrences', this.id] : ['/recurrences']);
  }

  private load(id: string): void {
    this.loading.set(true);
    this.service.get(id).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (rule) => this.recurrence.set(rule),
      error: (error: unknown) => this.error.set(apiErrorMessage(error)),
    });
  }
}

function updatePayload(
  submission: RecurrenceFormSubmission,
  current: RecurrenceRule | null,
): UpdateRecurrenceRequest {
  const payload: UpdateRecurrenceRequest = {
    ...submission.payload,
    updateScope: submission.updateScope,
  };
  if (current && current.generatedCount > 0) delete payload.startDate;
  return payload;
}
