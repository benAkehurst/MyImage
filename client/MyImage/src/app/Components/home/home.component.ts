import { Component, OnInit } from '@angular/core';
import { DataService } from '../../Services/data.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  imageBank: Array<any> = [];

  constructor( private dataService: DataService) { }

  ngOnInit() {
    this.retreiveNewImages();
  }

  public retreiveNewImages() {
    this.dataService.getNewImages().subscribe(data => {
      const retreiveNewImages = data;
      this.displayImages(retreiveNewImages);
    });
  }

  public displayImages(retreiveNewImages) {
    if (!retreiveNewImages) {
      console.log('No Images');
    } else {
      this.imageBank = retreiveNewImages;
      console.log(this.imageBank);
    }
  }
}
