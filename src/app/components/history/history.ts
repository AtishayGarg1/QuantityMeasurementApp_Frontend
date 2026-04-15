import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MeasurementsService } from '../../services/measurements.service';
import { MeasurementRecord } from '../../models/api.models';
import { NavbarComponent } from '../navbar/navbar';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class HistoryComponent implements OnInit {
  history: any[] = []; // Use any to be safe with casing from backend
  loading: boolean = false;
  errorMessage: string = '';

  constructor(private service: MeasurementsService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading = true;
    this.service.getHistory().subscribe({
      next: (data: any[]) => {
        // Log to verify casing if I could, but I'll map it common keys
        this.history = data.map(record => ({
            ...record,
            id: record.id ?? record.Id, // Handle both casing
            measurementCategory: record.measurementCategory ?? record.MeasurementCategory,
            operationType: record.operationType ?? record.OperationType,
            measurementUnit1: record.measurementUnit1 ?? record.MeasurementUnit1,
            measurementValue1: record.measurementValue1 ?? record.MeasurementValue1,
            measurementUnit2: record.measurementUnit2 ?? record.MeasurementUnit2,
            measurementValue2: record.measurementValue2 ?? record.MeasurementValue2,
            targetMeasurementUnit: record.targetMeasurementUnit ?? record.TargetMeasurementUnit,
            calculatedValue: record.calculatedValue ?? record.CalculatedValue,
            isComparison: record.isComparison ?? record.IsComparison,
            areEqual: record.areEqual ?? record.AreEqual,
            timestamp: record.timestamp ?? record.Timestamp ?? record.createdAt ?? record.CreatedAt
        }));
        this.loading = false;
      },
      error: (err) => {
        if (err.status === 401) {
          this.errorMessage = 'Session expired or not logged in. Please log in again.';
        } else if (err.status === 0) {
          this.errorMessage = 'Cannot reach the server. Is the backend running on port 5100?';
        } else {
          this.errorMessage = `Failed to load history (Error ${err.status}).`;
        }
        this.loading = false;
      }
    });
  }

  deleteRecord(id: any): void {
    if (!id) {
        console.error('No ID provided for delete');
        return;
    }
    if (confirm('Are you sure you want to delete this record?')) {
      this.service.deleteHistory(id).subscribe({
        next: () => {
          this.history = this.history.filter(r => (r.id ?? r.Id) !== id);
        },
        error: (err) => {
          console.error('Delete failed', err);
        }
      });
    }
  }

  getOperationSymbol(type: any, isComparison: boolean): string {
    const t = String(type).toLowerCase();
    if (t === '2' || t === 'addition' || t === 'add') return '+';
    if (t === '3' || t === 'subtraction' || t === 'subtract') return '-';
    if (t === '4' || t === 'division' || t === 'divide') return '/';
    return isComparison ? '⇌' : '→';
  }

  isArithmetic(type: any): boolean {
    const t = String(type).toLowerCase();
    return ['2', '3', '4', 'addition', 'subtraction', 'subtract', 'add', 'division', 'divide'].includes(t);
  }
}
