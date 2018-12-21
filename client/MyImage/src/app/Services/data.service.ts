import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { keys } from '../secret/keys';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private baseUrl = 'http://localhost:3000/';
  private headers = new Headers({'Content-Type': 'application/json'});
  returnData: any;


  constructor(private http: HttpClient) {}

  public getNewImages() {
    const url = this.baseUrl + 'retreiveFirstTenImages';
    return this.http.post(url, {headers: this.headers}).pipe(map(data => this.returnData = data));
  }
}
