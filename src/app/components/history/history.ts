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
  debugInfo: string = '';

  constructor(private service: MeasurementsService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading = true;
    this.errorMessage = '';
    const hasToken = !!localStorage.getItem('token');
    this.debugInfo = `Starting history load. Token present: ${hasToken}.`;
    
    this.service.getHistory().subscribe({
      next: (response: any) => {
        // Handle potential wrapping in an object (e.g., { data: [...] } or { items: [...] })
        let data: any[] = [];
        if (Array.isArray(response)) {
          data = response;
        } else if (response && Array.isArray(response.data)) {
          data = response.data;
        } else if (response && Array.isArray(response.items)) {
          data = response.items;
        } else if (response && Array.isArray(response.history)) {
          data = response.history;
        }

        this.history = data.map(record => ({
            ...record,
            id: record.id ?? record.Id,
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
        this.debugInfo = `Successfully loaded ${this.history.length} records.`;
        this.loading = false;
      },
      error: (err) => {
        this.debugInfo = `Error: ${err.message || 'Unknown object error'}. Status: ${err.status}.`;
        if (err.status === 401) {
          this.errorMessage = 'Session expired or not logged in. Please log in again.';
        } else if (err.status === 0) {
          this.errorMessage = 'Cannot reach the server. Please check your internet connection.';
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
