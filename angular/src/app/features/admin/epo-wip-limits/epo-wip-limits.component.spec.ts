/**
 * Contract 20 (D-400, D-401) — EpoWipLimitsComponent unit coverage.
 *
 * Scope: synchronous logic on the bare component instance — validation
 * branches in onLimitChange, sort flipping in onSort, sortedRows ordering,
 * and trackByUserId stability. Wider integration coverage (MCP wiring,
 * ngOnInit Admin guard end-to-end, save → tick fade timing) requires fixture
 * lifecycle and observable scheduling — deferred per the focused-spec
 * convention from delivery-cycle-detail.component.spec.ts.
 *
 * Pattern matches the existing spec in the repo: TestBed with spy providers
 * for DI, fixture created but detectChanges() not called so ngOnInit does
 * not fire.
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router }                    from '@angular/router';
import { of }                        from 'rxjs';

import { EpoWipLimitsComponent }     from './epo-wip-limits.component';
import { DeliveryService }           from '../../../core/services/delivery.service';
import { UserProfileService }        from '../../../core/services/user-profile.service';
import { ScreenStateService }        from '../../../core/services/screen-state.service';

describe('EpoWipLimitsComponent — synchronous logic', () => {
  let fixture:   ComponentFixture<EpoWipLimitsComponent>;
  let component: EpoWipLimitsComponent;
  let deliverySpy:    jasmine.SpyObj<DeliveryService>;

  beforeEach(async () => {
    deliverySpy = jasmine.createSpyObj<DeliveryService>(
      'DeliveryService',
      ['getEpoWipLimits', 'updateEpoWipLimits']
    );
    deliverySpy.getEpoWipLimits.and.returnValue(of({ success: true, data: [] }));
    deliverySpy.updateEpoWipLimits.and.returnValue(of({ success: true, data: {
      user_id:                 'u',
      display_name:            'EPO',
      pre_build_limit:         3,
      build_limit:             3,
      post_deploy_limit:       3,
      updated_at:              null,
      updated_by_display_name: null
    }}));

    const profileSpy = {
      // profile$ unused on this synchronous-logic suite (ngOnInit not called).
      profile$: of(null)
    } as unknown as UserProfileService;

    const screenStateSpy = jasmine.createSpyObj<ScreenStateService>(
      'ScreenStateService',
      ['restore', 'save']
    );
    screenStateSpy.restore.and.resolveTo(null);

    const routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [EpoWipLimitsComponent],
      providers: [
        { provide: DeliveryService,    useValue: deliverySpy },
        { provide: UserProfileService, useValue: profileSpy },
        { provide: ScreenStateService, useValue: screenStateSpy },
        { provide: Router,             useValue: routerSpy }
      ]
    }).compileComponents();

    fixture   = TestBed.createComponent(EpoWipLimitsComponent);
    component = fixture.componentInstance;
    // No detectChanges — keeps ngOnInit out of scope for this suite.
  });

  // ── Inline-edit validation (D-200 Pattern 3) ──────────────────────────────

  function buildRow(overrides: Partial<{ pre_build_limit: number; build_limit: number; post_deploy_limit: number }> = {}) {
    return {
      user_id:                 'epo-1',
      display_name:            'Sample EPO',
      pre_build_limit:         overrides.pre_build_limit         ?? 3,
      build_limit:             overrides.build_limit             ?? 3,
      post_deploy_limit:       overrides.post_deploy_limit       ?? 3,
      updated_at:              null,
      updated_by_display_name: null,
      saving_field:            null,
      saved_field:             null,
      error_field:             null,
      error_message:           '',
      reset_confirming:        false
    };
  }

  it('blocks non-integer input on pre_build_limit and does not call MCP', () => {
    const row = buildRow();
    component.onLimitChange(row, 'pre_build_limit', '3.5');
    expect(row.error_field).toBe('pre_build_limit');
    expect(row.error_message).toContain('whole number');
    expect(deliverySpy.updateEpoWipLimits).not.toHaveBeenCalled();
  });

  it('blocks zero on build_limit and does not call MCP', () => {
    const row = buildRow();
    component.onLimitChange(row, 'build_limit', '0');
    expect(row.error_field).toBe('build_limit');
    expect(deliverySpy.updateEpoWipLimits).not.toHaveBeenCalled();
  });

  it('blocks negative input on post_deploy_limit', () => {
    const row = buildRow();
    component.onLimitChange(row, 'post_deploy_limit', '-1');
    expect(row.error_field).toBe('post_deploy_limit');
    expect(deliverySpy.updateEpoWipLimits).not.toHaveBeenCalled();
  });

  it('returns early when the new value equals the prior value (no MCP call)', () => {
    const row = buildRow({ build_limit: 5 });
    component.onLimitChange(row, 'build_limit', '5');
    expect(row.error_field).toBeNull();
    expect(deliverySpy.updateEpoWipLimits).not.toHaveBeenCalled();
  });

  it('clears prior error when a valid integer follows a rejected entry', () => {
    const row = buildRow();
    component.onLimitChange(row, 'build_limit', '0');
    expect(row.error_field).toBe('build_limit');
    component.onLimitChange(row, 'build_limit', '4');
    expect(row.error_field).toBeNull();
    expect(deliverySpy.updateEpoWipLimits).toHaveBeenCalledOnceWith({
      user_id:     'epo-1',
      build_limit: 4
    });
  });

  // ── Sort behavior (D-171) ─────────────────────────────────────────────────

  it('starts asc when a new sort column is chosen', () => {
    component.sortColumn = 'display_name';
    component.sortDir    = 'asc';
    component.onSort('build_limit');
    expect(component.sortColumn).toBe('build_limit');
    expect(component.sortDir).toBe('asc');
  });

  it('flips direction when the same column is clicked again', () => {
    component.sortColumn = 'pre_build_limit';
    component.sortDir    = 'asc';
    component.onSort('pre_build_limit');
    expect(component.sortDir).toBe('desc');
    component.onSort('pre_build_limit');
    expect(component.sortDir).toBe('asc');
  });

  it('renders ▲ for active asc, ▼ for active desc, empty for non-active', () => {
    component.sortColumn = 'updated_at';
    component.sortDir    = 'asc';
    expect(component.sortIndicator('updated_at')).toBe('▲');
    component.sortDir = 'desc';
    expect(component.sortIndicator('updated_at')).toBe('▼');
    expect(component.sortIndicator('build_limit')).toBe('');
  });

  it('persists sort to ScreenStateService on every onSort call', () => {
    const screenStateSpy = TestBed.inject(ScreenStateService) as jasmine.SpyObj<ScreenStateService>;
    component.onSort('post_deploy_limit');
    expect(screenStateSpy.save).toHaveBeenCalled();
    const args = screenStateSpy.save.calls.mostRecent().args;
    expect(args[0]).toBe('admin.epo-wip');
    expect(args[2]).toEqual({ column: 'post_deploy_limit', direction: 'asc' });
  });

  // ── sortedRows ordering ───────────────────────────────────────────────────

  it('sorts by numeric column ascending', () => {
    component.rows = [
      buildRow({ build_limit: 5 }),
      { ...buildRow({ build_limit: 2 }), user_id: 'epo-2', display_name: 'Beta' },
      { ...buildRow({ build_limit: 9 }), user_id: 'epo-3', display_name: 'Gamma' }
    ];
    component.sortColumn = 'build_limit';
    component.sortDir    = 'asc';
    const out = component.sortedRows.map(r => r.build_limit);
    expect(out).toEqual([2, 5, 9]);
  });

  it('sorts by numeric column descending', () => {
    component.rows = [
      buildRow({ build_limit: 5 }),
      { ...buildRow({ build_limit: 2 }), user_id: 'epo-2', display_name: 'Beta' },
      { ...buildRow({ build_limit: 9 }), user_id: 'epo-3', display_name: 'Gamma' }
    ];
    component.sortColumn = 'build_limit';
    component.sortDir    = 'desc';
    const out = component.sortedRows.map(r => r.build_limit);
    expect(out).toEqual([9, 5, 2]);
  });

  it('sorts by display_name (string) localeCompare', () => {
    component.rows = [
      { ...buildRow(), user_id: 'a', display_name: 'Charlie' },
      { ...buildRow(), user_id: 'b', display_name: 'alice' },
      { ...buildRow(), user_id: 'c', display_name: 'Bravo' }
    ];
    component.sortColumn = 'display_name';
    component.sortDir    = 'asc';
    const out = component.sortedRows.map(r => r.display_name);
    expect(out[0]).toBe('alice');
    expect(out[1]).toBe('Bravo');
    expect(out[2]).toBe('Charlie');
  });

  it('places null updated_at last regardless of direction', () => {
    component.rows = [
      { ...buildRow(), user_id: 'a', updated_at: null },
      { ...buildRow(), user_id: 'b', updated_at: '2026-01-01T00:00:00Z' },
      { ...buildRow(), user_id: 'c', updated_at: '2026-06-01T00:00:00Z' }
    ];
    component.sortColumn = 'updated_at';
    component.sortDir    = 'asc';
    const ascIds = component.sortedRows.map(r => r.user_id);
    expect(ascIds[ascIds.length - 1]).toBe('a');
    component.sortDir = 'desc';
    const descIds = component.sortedRows.map(r => r.user_id);
    expect(descIds[descIds.length - 1]).toBe('a');
  });

  // ── trackBy + formatUpdated ───────────────────────────────────────────────

  it('trackByUserId returns user_id for stable list identity', () => {
    const row = buildRow();
    expect(component.trackByUserId(0, row)).toBe('epo-1');
  });

  it('formatUpdated returns em-dash when updated_at is null', () => {
    const row = { ...buildRow(), updated_at: null };
    expect(component.formatUpdated(row)).toBe('—');
  });

  it('formatUpdated includes updater display name when present', () => {
    const row = {
      ...buildRow(),
      updated_at: '2026-06-05T12:00:00Z',
      updated_by_display_name: 'Phil Dodds'
    };
    expect(component.formatUpdated(row)).toContain('by Phil Dodds');
  });

  // ── Two-step reset state machine ──────────────────────────────────────────

  it('per-row reset enters confirming state on click, exits on cancel', () => {
    const row = buildRow();
    component.onRowResetClick(row);
    expect(row.reset_confirming).toBeTrue();
    component.onRowResetCancel(row);
    expect(row.reset_confirming).toBeFalse();
  });

  it('bulk reset toggles confirming flag without saving', () => {
    component.onBulkResetClick();
    expect(component.bulkResetConfirming).toBeTrue();
    expect(component.bulkSaving).toBeFalse();
    component.onBulkResetCancel();
    expect(component.bulkResetConfirming).toBeFalse();
  });
});
