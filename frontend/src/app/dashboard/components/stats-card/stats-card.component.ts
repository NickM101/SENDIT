import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

export interface StatCardData {
  title: string;
  value: number | string;
  icon: string;
  iconColor: string;
  growth?: number;
  growthLabel?: string;
  suffix?: string;
  prefix?: string;
}

@Component({
  selector: 'app-stats-card',
  templateUrl: './stats-card.component.html',
  styleUrls: ['./stats-card.component.css'],
  imports: [CommonModule]
})
export class StatsCardComponent implements OnInit {
  @Input() data!: StatCardData;

  Math = Math; // Make Math available in template

  ngOnInit(): void {
    if (!this.data) {
      console.warn('StatsCardComponent: data input is required');
    }
  }

  /**
   * Get icon background color class
   */
  get iconBgColor(): string {
    const colorMap: { [key: string]: string } = {
      'text-blue-600': 'bg-blue-100',
      'text-green-600': 'bg-green-100',
      'text-yellow-600': 'bg-yellow-100',
      'text-purple-600': 'bg-purple-100',
      'text-red-600': 'bg-red-100',
      'text-indigo-600': 'bg-indigo-100',
      'text-pink-600': 'bg-pink-100',
      'text-gray-600': 'bg-gray-100',
    };
    return colorMap[this.data.iconColor] || 'bg-gray-100';
  }

  /**
   * Format value for display
   */
  formatValue(value: number | string): string {
    if (typeof value === 'string') return value;

    // Format large numbers
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }

    return value.toString();
  }

  /**
   * Get growth color class
   */
  getGrowthColorClass(growth: number): string {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  }
}
