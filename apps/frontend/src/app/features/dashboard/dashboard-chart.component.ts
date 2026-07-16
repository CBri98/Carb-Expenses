import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  type ChartConfiguration,
  type ChartType,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
);

type ChartValue = number | null;

@Component({
  selector: 'app-dashboard-chart',
  standalone: true,
  template: `<div class="chart-canvas"><canvas #canvas role="img" [attr.aria-label]="ariaLabel"></canvas></div>`,
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
  @Input() colors: readonly string[] = ['#4f46e5'];
  @Input() datasetLabel = 'Spese';
  @Input() secondaryValues: readonly ChartValue[] = [];
  @Input() secondaryCounts: readonly number[] = [];
  @Input() secondaryDatasetLabel = '';
  @Input() secondaryColor = '#d97706';
  @Input() horizontal = false;
  @Input() ariaLabel = 'Grafico delle spese';

  @ViewChild('canvas') private canvas?: ElementRef<HTMLCanvasElement>;
  private chart?: Chart<ChartType, ChartValue[], string>;
  private readonly platformId = inject(PLATFORM_ID);

  ngAfterViewInit(): void { this.render(); }
  ngOnChanges(): void {
    if (this.canvas) this.render();
  }
  ngOnDestroy(): void { this.chart?.destroy(); }

  private render(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const context = this.canvas?.nativeElement.getContext('2d');
    if (!context) return;
    this.chart?.destroy();

    const primaryColor = this.colors[0] ?? '#4f46e5';
    const datasets = [{
      label: this.datasetLabel,
      data: [...this.values],
      backgroundColor:
        this.type === 'doughnut' ? [...this.colors] : colorWithAlpha(primaryColor),
      borderColor: this.type === 'doughnut' ? '#ffffff' : primaryColor,
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
        backgroundColor: colorWithAlpha(this.secondaryColor),
        borderColor: this.secondaryColor,
        borderWidth: 2,
        fill: false,
        tension: 0.25,
        pointRadius: this.type === 'line' ? 2 : 0,
        spanGaps: false,
      });
    }

    const numericScale = {
      beginAtZero: true,
      ticks: { callback: (value: string | number) => formatEuro(Number(value)) },
    };
    const categoryScale = {
      grid: { display: false },
      ticks: { autoSkip: true, maxTicksLimit: 12 },
    };
    const configuration: ChartConfiguration<ChartType, ChartValue[], string> = {
      type: this.type,
      data: { labels: [...this.labels], datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        indexAxis: this.horizontal ? 'y' : 'x',
        plugins: {
          legend: {
            display: this.type === 'doughnut' || this.secondaryValues.length > 0,
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: (item) => {
                const label = item.dataset.label || item.label || this.datasetLabel;
                return item.raw === null ? `${label}: giorno non presente` : `${label}: ${formatEuro(Number(item.raw))}`;
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
    this.chart = new Chart(context, configuration);
  }
}

function colorWithAlpha(color: string): string {
  if (/^#[0-9a-f]{6}$/i.test(color)) return `${color}33`;
  return 'rgba(79, 70, 229, 0.2)';
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
}
