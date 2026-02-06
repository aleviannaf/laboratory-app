import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';

@Component({
  selector: 'app-weekly-flow-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  templateUrl: './weekly-flow-chart.component.html',
  styleUrl: './weekly-flow-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyFlowChartComponent {
  @Input() title = 'Fluxo Semanal de Atendimentos';

  // dados default (você vai trocar pelos seus)
  @Input() labels: string[] = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
  @Input() values: number[] = [45, 52, 49, 61, 55, 30, 12];

  get options(): EChartsOption {
    return {
      grid: { left: 16, right: 16, top: 20, bottom: 24, containLabel: true },

      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line' },
        backgroundColor: '#fff',
        borderColor: '#EDEFF3',
        borderWidth: 1,
        textStyle: { color: '#111827' },
        extraCssText:
          'box-shadow: 0 8px 24px rgba(17,24,39,.12); border-radius: 12px;',
      },

      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: this.labels,
        axisLine: { lineStyle: { color: '#EDEFF3' } },
        axisTick: { show: false },
        axisLabel: { color: '#6B7280' },
      },

      yAxis: {
        type: 'value',
        min: 0,
        splitNumber: 4,
        axisLabel: { color: '#9CA3AF' },
        axisTick: { show: false },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#F3F4F6' } },
      },

      series: [
        {
          name: 'Atendimentos',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: this.values,
          lineStyle: { width: 2, color: '#F08A74' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(240,138,116,0.28)' },
                { offset: 1, color: 'rgba(240,138,116,0.00)' },
              ],
            },
          },
          emphasis: { focus: 'series' },
        },
      ],
    };
  }
}
