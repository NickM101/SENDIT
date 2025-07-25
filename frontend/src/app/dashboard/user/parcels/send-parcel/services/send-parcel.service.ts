import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../core/services/api.service';

@Injectable({
  providedIn: 'root',
})
export class SendParcelService {
  constructor(private apiService: ApiService) {}

  getCurrentDraft(): Observable<any> {
    return this.apiService.get('/parcels/draft/current');
  }

  saveSenderDetails(senderDetails: any): Observable<any> {
    return this.apiService.post('/parcels/sender-details', senderDetails);
  }

  saveDraft(draftData: any): Observable<any> {
    return this.apiService.post('/parcels/draft/save', draftData);
  }

  deleteDraft(): Observable<any> {
    return this.apiService.delete('/parcels/draft');
  }

  getSavedRecipients(): Observable<any> {
    return this.apiService.get('/parcels/recipients/saved');
  }
}
