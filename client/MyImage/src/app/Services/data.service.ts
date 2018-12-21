import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { keys } from '../secret/keys';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(private http: HttpClient) {}

  public getNewImages() {
    const url = 'https://api.unsplash.com/photos/?client_id=';
    const key = keys.UNSPLASH_API;
    const requestUrl = url + key;
    return this.http.get(requestUrl).pipe(map(data => this.convertData(data)));
  }

  public convertData(data) {
    const images = data;

    return images.map(d => ({
      imageUrl: d.urls.regular,
      imageId: d.id,
      date: d.created_at,
      likes: d.likes,
      description: d.desciption,
      userName: d.user.name,
      userLink: d.user.links.self
    }));
  }
}
