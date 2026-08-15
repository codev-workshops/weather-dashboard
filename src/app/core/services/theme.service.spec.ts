import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { WeatherCondition } from '../../models/weather.model';

describe('ThemeService', () => {
  let service: ThemeService;
  const nowSeconds = 1_700_000_000;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ThemeService] });
    service = TestBed.inject(ThemeService);
    spyOn(Date, 'now').and.returnValue(nowSeconds * 1000);
  });

  it('returns a day theme class when now is between sunrise and sunset (TC-THEME-001)', () => {
    expect(service.getThemeClass('clear', nowSeconds - 3600, nowSeconds + 3600)).toBe(
      'theme-clear-day'
    );
  });

  it('returns a night theme class when now is after sunset (TC-THEME-002)', () => {
    expect(service.getThemeClass('rain', nowSeconds - 7200, nowSeconds - 3600)).toBe(
      'theme-rain-night'
    );
  });

  it('returns a night theme class when now is before sunrise (TC-THEME-003)', () => {
    expect(service.getThemeClass('snow', nowSeconds + 3600, nowSeconds + 7200)).toBe(
      'theme-snow-night'
    );
  });

  it('treats the sunrise boundary as day and the sunset boundary as night (TC-THEME-004)', () => {
    expect(service.getThemeClass('clouds', nowSeconds, nowSeconds + 3600)).toBe(
      'theme-clouds-day'
    );
    expect(service.getThemeClass('clouds', nowSeconds - 3600, nowSeconds)).toBe(
      'theme-clouds-night'
    );
  });

  it('maps every supported condition into the theme class name (TC-THEME-005)', () => {
    const conditions: WeatherCondition[] = [
      'clear',
      'clouds',
      'rain',
      'snow',
      'thunderstorm',
      'mist',
    ];
    for (const condition of conditions) {
      expect(service.getThemeClass(condition, nowSeconds - 60, nowSeconds + 60)).toBe(
        `theme-${condition}-day`
      );
    }
  });
});
