import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  toISODate, todayISO, nightsBetween, addDays,
  startOfMonth, addMonths, monthGrid, MONTH_LABEL, WEEKDAYS,
} from '../../utils/dates';

/**
 * Availability calendar with two-click range selection.
 *
 * Shows two months side by side on desktop and one on mobile. Unavailable
 * nights are struck through and unselectable; the range highlight is a
 * continuous band with rounded caps at each end.
 *
 * Props
 *   unavailable   Set of 'YYYY-MM-DD' nights that cannot be stayed
 *   checkIn/Out   selected range ('YYYY-MM-DD' or '')
 *   onChange      ({ checkIn, checkOut }) — checkOut is '' while mid-selection
 *   minNights/maxNights   listing limits, used to guide the second click
 *   nightlyRate   optional; renders a per-night price under each day
 *   fixedNights   when set, the stay is a known length and a single click
 *                 selects the whole range. Used when moving a booking, where
 *                 the length cannot change — asking for a checkout the guest
 *                 has no say over would be a click that can only be wrong.
 */
const AvailabilityCalendar = ({
  unavailable = new Set(),
  checkIn = '',
  checkOut = '',
  onChange,
  minNights = 1,
  maxNights = 365,
  nightlyRate = 0,
  months = 2,
  fixedNights = 0,
}) => {
  const today = todayISO();
  const [cursor, setCursor] = useState(() =>
    startOfMonth(checkIn ? new Date(checkIn) : new Date())
  );
  const [hovered, setHovered] = useState('');

  const canGoBack = cursor > startOfMonth(new Date());

  /**
   * Once a check-in is picked, the stay may not jump over an unavailable
   * night — so the last selectable checkout is the night before the first
   * blocked day after check-in (capped by maxNights).
   */
  const maxCheckout = useMemo(() => {
    if (!checkIn) return null;
    let cur = checkIn;
    for (let i = 0; i < maxNights; i += 1) {
      const next = addDays(cur, 1);
      if (unavailable.has(next)) return next; // checkout ON that day is still fine
      cur = next;
    }
    return cur;
  }, [checkIn, unavailable, maxNights]);

  /** Every night of a fixed-length stay starting here must be free. */
  const fixedRangeFree = (iso) => {
    let cur = iso;
    for (let i = 0; i < fixedNights; i += 1) {
      if (unavailable.has(cur)) return false;
      cur = addDays(cur, 1);
    }
    return true;
  };

  const isSelectable = (iso) => {
    if (iso < today) return false;
    if (fixedNights > 0) return fixedRangeFree(iso);
    if (!checkIn || (checkIn && checkOut)) return !unavailable.has(iso);
    // Mid-selection: only forward dates that keep the stay contiguous.
    if (iso <= checkIn) return !unavailable.has(iso);
    if (maxCheckout && iso > maxCheckout) return false;
    return nightsBetween(checkIn, iso) >= minNights;
  };

  const handlePick = (iso) => {
    if (!onChange) return;
    // Fixed length: one click picks the whole stay.
    if (fixedNights > 0) {
      onChange({ checkIn: iso, checkOut: addDays(iso, fixedNights) });
      return;
    }
    // Starting fresh, or restarting because the click landed before check-in.
    if (!checkIn || checkOut || iso <= checkIn) {
      onChange({ checkIn: iso, checkOut: '' });
      return;
    }
    onChange({ checkIn, checkOut: iso });
  };

  // The provisional range follows the cursor before the second click lands.
  // A fixed-length stay has no second click, so nothing is provisional.
  const previewEnd = fixedNights > 0
    ? checkOut
    : checkOut || (checkIn && hovered > checkIn ? hovered : '');

  const rangeState = (iso) => {
    if (checkIn && iso === checkIn) return 'start';
    if (previewEnd && iso === previewEnd) return 'end';
    if (checkIn && previewEnd && iso > checkIn && iso < previewEnd) return 'middle';
    return null;
  };

  const visibleMonths = Array.from({ length: months }, (_, i) => addMonths(cursor, i));

  return (
    <div className="select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => canGoBack && setCursor(addMonths(cursor, -1))}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="w-8 h-8 rounded-full flex items-center justify-center text-dark-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 grid gap-6" style={{ gridTemplateColumns: `repeat(${months}, minmax(0, 1fr))` }}>
          {visibleMonths.map((m, i) => (
            <p
              key={i}
              className={`text-sm font-semibold text-dark-900 text-center ${i > 0 ? 'hidden md:block' : ''}`}
            >
              {MONTH_LABEL(m)}
            </p>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setCursor(addMonths(cursor, 1))}
          aria-label="Next month"
          className="w-8 h-8 rounded-full flex items-center justify-center text-dark-600 hover:bg-gray-100 transition"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${months}, minmax(0, 1fr))` }}>
        {visibleMonths.map((month, mi) => (
          <div key={mi} className={mi > 0 ? 'hidden md:block' : ''}>
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-[11px] font-medium text-dark-400 text-center py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1" onMouseLeave={() => setHovered('')}>
              {monthGrid(month).map((cell, idx) => {
                if (!cell) return <div key={idx} />;
                const iso = toISODate(cell);
                const selectable = isSelectable(iso);
                const state = rangeState(iso);
                const isPast = iso < today;
                const blocked = !isPast && unavailable.has(iso);

                // Continuous band behind the pill, capped at the ends.
                let band = '';
                if (state === 'middle') band = 'bg-primary/10';
                else if (state === 'start' && previewEnd) band = 'bg-gradient-to-r from-transparent to-primary/10';
                else if (state === 'end') band = 'bg-gradient-to-l from-transparent to-primary/10';

                let pill = 'text-dark-800 hover:border-dark-900 border border-transparent';
                if (isPast) pill = 'text-dark-300 cursor-not-allowed';
                else if (blocked) pill = 'text-dark-300 line-through cursor-not-allowed';
                else if (state === 'start' || state === 'end') pill = 'bg-primary text-white font-semibold';
                else if (state === 'middle') pill = 'text-dark-900 font-medium';
                else if (!selectable) pill = 'text-dark-300 cursor-not-allowed';

                return (
                  <div key={idx} className={`relative ${band}`}>
                    <button
                      type="button"
                      disabled={!selectable}
                      onClick={() => handlePick(iso)}
                      onMouseEnter={() => setHovered(iso)}
                      aria-label={iso}
                      aria-pressed={!!state}
                      className={`relative w-full aspect-square rounded-full flex flex-col items-center justify-center text-[13px] leading-none transition ${pill}`}
                    >
                      <span>{cell.getDate()}</span>
                      {nightlyRate > 0 && selectable && !state && (
                        <span className="hidden md:block text-[9px] text-dark-400 mt-0.5">
                          ₦{Math.round(nightlyRate / 1000)}k
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer: guidance + clear */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-dark-500">
          {!checkIn && (fixedNights > 0
            ? `Tap a new start date — ${fixedNights} night${fixedNights !== 1 ? 's' : ''}`
            : `${minNights} night minimum`)}
          {checkIn && !checkOut && 'Select your checkout date'}
          {checkIn && checkOut && `${nightsBetween(checkIn, checkOut)} night${nightsBetween(checkIn, checkOut) !== 1 ? 's' : ''} selected`}
        </p>
        {(checkIn || checkOut) && (
          <button
            type="button"
            onClick={() => onChange?.({ checkIn: '', checkOut: '' })}
            className="text-xs font-semibold text-dark-700 underline hover:text-dark-900"
          >
            Clear dates
          </button>
        )}
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
