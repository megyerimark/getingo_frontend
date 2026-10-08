import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should add and dismiss a toast', () => {
    service.success('Sikeres mentés', 0);
    const toast = service.toasts()[0];
    expect(toast.message).toBe('Sikeres mentés');
    expect(toast.type).toBe('success');
    service.dismiss(toast.id);
    expect(service.toasts().length).toBe(0);
  });
});
