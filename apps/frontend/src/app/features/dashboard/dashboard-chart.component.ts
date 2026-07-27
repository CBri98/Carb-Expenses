import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import type {
  ChartConfiguration,
  ChartEvent,
  ChartType,
} from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

type ChartValue = number | null;

export interface DashboardChartSelection {
  index: number;
  datasetIndex: number;
  label: string;
  value: ChartValue;
}

@Component({
  selector: 'app-dashboard-chart',
  standalone: true,
  imports: [BaseChartDirective],
  template: `<div class="chart-canvas"><canvas
    baseChart
    role="img"
    [attr.aria-label]="ariaLabel"
    [type]="type"
    [data]="chartData"
    [options]="chartOptions"
    (chartClick)="chartClicked($event.event, $event.active)"
  ></canvas></div>`,
  styles: [`
    :host { display: block; min-width: 0; }
    .chart-canvas { position: relative; width: 100%; height: 19rem; }
    canvas { max-width: 100%; }
    @media (max-width: 575.98px) { .chart-canvas { height: 15rem; } }
  `],
})
export class DashboardChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) type: 'line' | 'bar' | 'doughnut' = 'line';
  @Input({ required: true }) labels: readonly string[] = [];
  @Input({ required: true }) values: readonly ChartValue[] = [];
  @Input() counts: readonly number[] = [];
  @Input() colors: readonly string[] = [];
  @Input() datasetLabel = 'Spese';
  @Input() secondaryValues: readonly ChartValue[] = [];
  @Input() secondaryCounts: readonly number[] = [];
  @Input() secondaryDatasetLabel = '';
  @Input() secondaryColor = '';
  @Input() horizontal = false;
  @Input() ariaLabel = 'Grafico delle spese';
  @Output() readonly pointSelected = new EventEmitter<DashboardChartSelection>();

  @ViewChild(BaseChartDirective) private chart?: BaseChartDirective;
  chartData: ChartConfiguration<ChartType, ChartValue[], string>['data'] = {
    labels: [],
    datasets: [],
  };
  chartOptions: ChartConfiguration<ChartType, ChartValue[], string>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
  };

  private themeObserver?: MutationObserver;
  private readonly platformId = inject(PLATFORM_ID);

  ngAfterViewInit(): void {
    this.configure();
    if (isPlatformBrowser(this.platformId) && typeof MutationObserver !== 'undefined') {
      this.themeObserver = new MutationObserver(() => this.configure());
      this.themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme', 'data-accent'],
      });
    }
  }

  ngOnChanges(): void {
    this.configure();
  }

  ngOnDestroy(): void {
    this.themeObserver?.disconnect();
  }

  chartClicked(_event?: ChartEvent, active: object[] = []): void {
    const selected = active[0];
    if (!isSelectedElement(selected)) return;
    this.pointSelected.emit({
      index: selected.index,
      datasetIndex: selected.datasetIndex,
      label: this.labels[selected.index] ?? '',
      value: selected.datasetIndex === 0
        ? this.values[selected.index] ?? null
        : this.secondaryValues[selected.index] ?? null,
    });
  }

  private configure(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const styles = getComputedStyle(document.documentElement);
    const textColor = styles.getPropertyValue('--text-secondary').trim() || '#727789';
    const gridColor = styles.getPropertyValue('--border-color').trim() || '#e1e4ee';
    const surfaceColor = styles.getPropertyValue('--surface').trim() || '#ffffff';
    const primaryRgb = styles.getPropertyValue('--primary-rgb').trim() || '85, 92, 168';
    const themePrimary = styles.getPropertyValue('--primary-strong').trim() || '#555ca8';
    const themeSecondary = styles.getPropertyValue('--chart-secondary').trim() || '#a66f2c';
    const primaryColor = this.colors[0] ?? themePrimary;
    const chartColors = this.colors.length > 0 ? [...this.colors] : [primaryColor];
    const secondaryColor = this.secondaryColor || themeSecondary;

    const datasets = [{
      label: this.datasetLabel,
      data: [...this.values],
      backgroundColor:
        this.type === 'doughnut' ? chartColors : colorWithAlpha(primaryColor, primaryRgb),
      borderColor: this.type === 'doughnut' ? surfaceColor : primaryColor,
      borderWidth: 2,
      fill: this.type === 'line',
      tension: 0.25,
      pointRadius: this.type === 'line' ? 2 : 0,
      spanGaps: false,
    }];
    if (this.type !== 'doughnut' && this.secondaryValues.length > 0) {
      datasets.push({
        label: this.secondaryDatasetLabel || 'Confronto',
        data: [...this.secondaryValues],
        backgroundColor: colorWithAlpha(secondaryColor, primaryRgb),
        borderColor: secondaryColor,
        borderWidth: 2,
        fill: false,
        tension: 0.25,
        pointRadius: this.type === 'line' ? 2 : 0,
        spanGaps: false,
      });
    }

    const numericScale = {
      beginAtZero: true,
      grid: { color: gridColor },
      ticks: { color: textColor, callback: (value: string | number) => formatEuro(Number(value)) },
    };
    const categoryScale = {
      grid: { display: false },
      ticks: { color: textColor, autoSkip: true, maxTicksLimit: 12 },
    };
    const configuration: ChartConfiguration<ChartType, ChartValue[], string> = {
      type: this.type,
      data: { labels: [...this.labels], datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        indexAxis: this.horizontal ? 'y' : 'x',
        onHover: (event, elements) => {
          const canvas = event.native?.target;
          if (canvas instanceof HTMLCanvasElement) {
            canvas.style.cursor = elements.length ? 'pointer' : 'default';
          }
        },
        plugins: {
          legend: {
            display: this.type === 'doughnut' || this.secondaryValues.length > 0,
            position: 'bottom',
            labels: { color: textColor },
          },
          tooltip: {
            callbacks: {
              label: (item) => {
                const label = item.dataset.label || item.label || this.datasetLabel;
                return item.raw === null
                  ? `${label}: giorno non presente`
                  : `${label}: ${formatEuro(Number(item.raw))}`;
              },
              afterLabel: (item) => {
                const source = item.datasetIndex === 0 ? this.counts : this.secondaryCounts;
                const count = source[item.dataIndex];
                return count === undefined ? '' : `${count} ${count === 1 ? 'spesa' : 'spese'}`;
              },
            },
          },
        },
        scales: this.type === 'doughnut'
          ? undefined
          : this.horizontal
            ? { x: numericScale, y: categoryScale }
            : { x: categoryScale, y: numericScale },
      },
    };
    this.chartData = configuration.data;
    this.chartOptions = configuration.options;
    this.chart?.update();
  }
}

function isSelectedElement(value: object | undefined): value is object & {
  index: number;
  datasetIndex: number;
} {
  return Boolean(
    value &&
    'index' in value && typeof value.index === 'number' &&
    'datasetIndex' in value && typeof value.datasetIndex === 'number',
  );
}

function colorWithAlpha(color: string, fallbackRgb: string): string {
  if (/^#[0-9a-f]{6}$/i.test(color)) return `${color}33`;
  return `rgba(${fallbackRgb}, 0.2)`;
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
}
