/**
 * B-97 regression coverage — onEscKey() behavior under each guard path.
 *
 * Contract 15 attempted to fix B-97 with `this.dialog.openDialogs.length > 0`;
 * UAT confirmed the guard was unreliable. Contract 16 replaces it with the
 * self-tracked `gateModalOpen` flag. This spec locks the four onEscKey paths
 * so the regression cannot return silently.
 *
 * Scope: onEscKey() guard logic only. Wider component behavior intentionally
 * out of scope — first spec on a 2864-line file, kept focused per Rule 11.
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute }            from '@angular/router';
import { MatDialog }                 from '@angular/material/dialog';
import { NoopAnimationsModule }      from '@angular/platform-browser/animations';

import { DeliveryCycleDetailComponent } from './delivery-cycle-detail.component';
import { DeliveryService }              from '../../../core/services/delivery.service';
import { UserProfileService }           from '../../../core/services/user-profile.service';

describe('DeliveryCycleDetailComponent — onEscKey() (B-97 Contract 16)', () => {
  let fixture: ComponentFixture<DeliveryCycleDetailComponent>;
  let component: DeliveryCycleDetailComponent;
  let closeEmitSpy: jasmine.Spy;

  beforeEach(async () => {
    // Skip fixture.detectChanges() means ngOnInit does not run. These spies
    // exist only so DI resolves cleanly when TestBed instantiates the component;
    // none of the methods are exercised on the onEscKey path.
    const deliverySpy  = jasmine.createSpyObj<DeliveryService>('DeliveryService', ['getCycle']);
    const profileSpy   = jasmine.createSpyObj<UserProfileService>('UserProfileService', ['listUsers', 'getCurrentProfile']);

    const dialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open'], { openDialogs: [] });

    const routeStub = {
      snapshot: { paramMap: { get: (_key: string) => null } }
    } as unknown as ActivatedRoute;

    await TestBed.configureTestingModule({
      imports: [DeliveryCycleDetailComponent, NoopAnimationsModule],
      providers: [
        { provide: ActivatedRoute,     useValue: routeStub },
        { provide: DeliveryService,    useValue: deliverySpy },
        { provide: UserProfileService, useValue: profileSpy },
        { provide: MatDialog,          useValue: dialogSpy }
      ]
    }).compileComponents();

    fixture   = TestBed.createComponent(DeliveryCycleDetailComponent);
    component = fixture.componentInstance;
    closeEmitSpy = spyOn(component.close, 'emit');
    // Intentionally skip fixture.detectChanges() — ngOnInit would call loadCycle
    // and bring view dependencies into scope. onEscKey is testable on the bare
    // component instance.
  });

  it('returns without emitting when not in panel mode (no cycleId input)', () => {
    component.cycleId = undefined;
    component.gateModalOpen = false;
    component.showEditPanel = false;

    component.onEscKey();

    expect(closeEmitSpy).not.toHaveBeenCalled();
  });

  it('returns without emitting when gateModalOpen is true (B-97 regression guard)', () => {
    component.cycleId = 'cycle-uuid-1';
    component.gateModalOpen = true;
    component.showEditPanel = false;

    component.onEscKey();

    expect(closeEmitSpy).not.toHaveBeenCalled();
  });

  it('increments cancelEditSignal when edit panel is open — does not emit close', () => {
    component.cycleId = 'cycle-uuid-1';
    component.gateModalOpen = false;
    component.showEditPanel = true;
    const beforeSignal = component.cancelEditSignal;

    component.onEscKey();

    expect(component.cancelEditSignal).toBe(beforeSignal + 1);
    expect(closeEmitSpy).not.toHaveBeenCalled();
  });

  it('emits close in panel mode when no modal and no edit panel are open', () => {
    component.cycleId = 'cycle-uuid-1';
    component.gateModalOpen = false;
    component.showEditPanel = false;

    component.onEscKey();

    expect(closeEmitSpy).toHaveBeenCalledTimes(1);
  });
});
