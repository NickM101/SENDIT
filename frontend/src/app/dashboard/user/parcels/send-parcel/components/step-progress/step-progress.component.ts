// src/app/dashboard/user/parcels/send-parcel/components/step-progress/step-progress.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
} from '@angular/core';
import { SharedModule } from '../../../../../../shared/shared.module';

export interface Step {
  id: number;
  label: string;
  icon: string;
  completed: boolean;
  disabled?: boolean;
}

@Component({
  selector: 'app-step-progress',
  templateUrl: './step-progress.component.html',
  styleUrls: ['./step-progress.component.css'],
  imports: [SharedModule]
})
export class StepProgressComponent implements OnInit, OnChanges {
  @Input() steps: Step[] = [];
  @Input() currentStep: number = 1;
  @Output() stepChange = new EventEmitter<number>();

  ngOnInit() {
    this.updateStepStates();
  }

  ngOnChanges() {
    this.updateStepStates();
  }

  onStepClick(stepId: number) {
    if (this.canNavigateToStep(stepId)) {
      this.stepChange.emit(stepId);
    }
  }

  private canNavigateToStep(stepId: number): boolean {
    return (
      stepId <= this.currentStep || this.getStep(stepId)?.completed || false
    );
  }

  private updateStepStates() {
    this.steps.forEach((step) => {
      step.completed = step.id < this.currentStep;
      step.disabled = step.id > this.currentStep && !step.completed;
    });
  }

  private getStep(stepId: number): Step | undefined {
    return this.steps.find((step) => step.id === stepId);
  }

  getStepStatus(step: Step): 'completed' | 'current' | 'upcoming' | 'disabled' {
    if (step.completed) return 'completed';
    if (step.id === this.currentStep) return 'current';
    if (step.disabled) return 'disabled';
    return 'upcoming';
  }

  getStepButtonClasses(step: Step): string {
    const baseClasses =
      'group flex items-center w-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-lg p-2';

    if (step.disabled) {
      return `${baseClasses} cursor-not-allowed opacity-50`;
    }

    if (step.completed || step.id === this.currentStep) {
      return `${baseClasses} cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30`;
    }

    return `${baseClasses} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800`;
  }

  getStepCircleClasses(step: Step): string {
    const baseClasses =
      'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200';

    if (step.completed) {
      return `${baseClasses} bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500 text-white`;
    }

    if (step.id === this.currentStep) {
      return `${baseClasses} bg-blue-50 dark:bg-blue-900/30 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400`;
    }

    if (step.disabled) {
      return `${baseClasses} bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500`;
    }

    return `${baseClasses} bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 group-hover:border-gray-400 dark:group-hover:border-gray-500`;
  }

  getStepLabelClasses(step: Step): string {
    const baseClasses = 'text-sm font-medium transition-colors duration-200';

    if (step.completed) {
      return `${baseClasses} text-blue-600 dark:text-blue-400`;
    }

    if (step.id === this.currentStep) {
      return `${baseClasses} text-blue-600 dark:text-blue-400`;
    }

    if (step.disabled) {
      return `${baseClasses} text-gray-400 dark:text-gray-500`;
    }

    return `${baseClasses} text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300`;
  }
}
