import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MeasurementRequest, MeasurementResponse, MeasurementRecord, UnitsMetadata } from '../models/api.models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MeasurementsService {
  private apiUrl = 'https://quantitymeasurementapp-yvwg.onrender.com/api';

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getUnits(): Observable<UnitsMetadata> {
    return this.http.get<UnitsMetadata>(`${this.apiUrl}/units`, { headers: this.getHeaders() });
  }

  calculate(request: MeasurementRequest): Observable<MeasurementResponse> {
    return this.http.post<MeasurementResponse>(`${this.apiUrl}/calculate`, request, { headers: this.getHeaders() });
  }

  compare(request: MeasurementRequest): Observable<MeasurementResponse> {
    return this.http.post<MeasurementResponse>(`${this.apiUrl}/compare`, request, { headers: this.getHeaders() });
  }

  getHistory(): Observable<MeasurementRecord[]> {
    return this.http.get<MeasurementRecord[]>(`${this.apiUrl}/history`, { headers: this.getHeaders() });
  }

  deleteHistory(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/history/${id}`, { headers: this.getHeaders() });
  }
}
