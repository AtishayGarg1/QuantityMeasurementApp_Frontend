import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MeasurementsService } from '../../services/measurements.service';
import { UnitsMetadata, MeasurementRequest } from '../../models/api.models';
import { NavbarComponent } from '../navbar/navbar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  units: UnitsMetadata | null = null;
  measurementForm: FormGroup;
  result: any | null = null;
  errorMessage: string = '';
  loading: boolean = false;
  categories: string[] = ['Length', 'Weight', 'Volume', 'Temperature'];
  availableUnits: string[] = [];
  
  // Arithmetic options: 2: Addition, 3: Subtraction, 4: Division
  arithmeticOps = [
    { label: 'Addition (+)', value: 2 },
    { label: 'Subtraction (-)', value: 3 },
    { label: 'Division (/)', value: 4 }
  ];

  constructor(private fb: FormBuilder, private service: MeasurementsService) {
    this.measurementForm = this.fb.group({
      measurementCategory: ['Length', Validators.required],
      measurementValue1: [null, [Validators.required]],
      measurementUnit1: ['', Validators.required],
      measurementValue2: [0, Validators.required],
      measurementUnit2: ['', Validators.required],
      targetMeasurementUnit: ['', Validators.required],
      opType: ['convert'], // convert, compare or arithmetic
      arithmeticOp: [2] // Internal selection for arithmetic mode
    });
  }

  ngOnInit(): void {
    this.service.getUnits().subscribe({
      next: (units) => {
        this.units = units;
        this.updateUnits();
      },
      error: (err) => console.error('Failed to load units', err)
    });

    this.measurementForm.get('measurementCategory')?.valueChanges.subscribe(() => {
      this.updateUnits();
    });
  }

  updateUnits(): void {
    if (!this.units) return;
    const cat = this.measurementForm.get('measurementCategory')?.value;
    switch(cat) {
        case 'Length': this.availableUnits = this.units.length; break;
        case 'Weight': this.availableUnits = this.units.weight; break;
        case 'Volume': this.availableUnits = this.units.volume; break;
        case 'Temperature': this.availableUnits = this.units.temperature; break;
    }
    this.measurementForm.patchValue({
      measurementUnit1: this.availableUnits[0],
      measurementUnit2: this.availableUnits[0],
      targetMeasurementUnit: this.availableUnits[0]
    });
  }

  onSubmit(): void {
    if (this.measurementForm.valid) {
      this.loading = true;
      this.result = null;
      this.errorMessage = '';
      
      const formValue = this.measurementForm.value;
      const isCompare = formValue.opType === 'compare';
      const isConvert = formValue.opType === 'convert';

      const request: MeasurementRequest = {
        measurementCategory: formValue.measurementCategory,
        operationType: isCompare ? 1 : (isConvert ? 0 : Number(formValue.arithmeticOp)),
        measurementUnit1: formValue.measurementUnit1,
        measurementValue1: formValue.measurementValue1,
        measurementUnit2: formValue.measurementUnit2,
        measurementValue2: formValue.measurementValue2,
        targetMeasurementUnit: formValue.targetMeasurementUnit
      };

      let call;
      if (isCompare) {
        call = this.service.compare(request);
      } else if (isConvert) {
        call = this.service.convert(request);
      } else {
        call = this.service.calculate(request);
      }

      call.subscribe({
        next: (resp: any) => {
          if (resp.isSuccess || resp.IsSuccess) {
            this.result = {
                ...resp,
                calculatedValue: resp.calculatedValue ?? resp.CalculatedValue,
                areEqual: resp.areEqual ?? resp.AreEqual
            };
          } else {
            this.errorMessage = resp.errorMessage || resp.ErrorMessage || 'Unknown error occurred.';
          }
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = 'Operation failed. Check your inputs or server.';
          this.loading = false;
        }
      });
    }
  }
}
