import { Component } from '@angular/core';
import { WeatherDashboardComponent } from './features/weather-dashboard/weather-dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [WeatherDashboardComponent],
  template: `<app-weather-dashboard />`,
})
export class AppComponent {}
