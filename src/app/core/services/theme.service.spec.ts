import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  const sunrise = 1_700_000_000;
  const sunset = sunrise + 12 * 3600;

  function setNow(seconds: number): void {
    jasmine.clock().mockDate(new Date(seconds * 1000));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('returns a day theme between sunrise and sunset', () => {
    setNow(sunrise + 3600);
    expect(service.getThemeClass('clear', sunrise, sunset)).toBe('theme-clear-day');
  });

  it('returns a night theme before sunrise', () => {
    setNow(sunrise - 1);
    expect(service.getThemeClass('rain', sunrise, sunset)).toBe('theme-rain-night');
  });

  it('returns a night theme after sunset', () => {
    setNow(sunset + 3600);
    expect(service.getThemeClass('snow', sunrise, sunset)).toBe('theme-snow-night');
  });

  it('treats the exact sunrise second as day', () => {
    setNow(sunrise);
    expect(service.getThemeClass('clouds', sunrise, sunset)).toBe('theme-clouds-day');
  });

  it('treats the exact sunset second as night', () => {
    setNow(sunset);
    expect(service.getThemeClass('mist', sunrise, sunset)).toBe('theme-mist-night');
  });

  it('includes the condition in the class name', () => {
    setNow(sunrise + 60);
    expect(service.getThemeClass('thunderstorm', sunrise, sunset)).toBe(
      'theme-thunderstorm-day'
    );
  });
});
