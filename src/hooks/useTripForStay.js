import { useMemo } from 'react';
import useTripStore from '../store/tripStore';
import { withinStay } from '../utils/experiences';

/**
 * The experiences lines inside a stay's booking widget. Returns the in-stay
 * items and their total so the widget can add them to the trip total.
 */
export default function useTripForStay(checkIn, checkOut) {
  const items = useTripStore(s => s.items);
  return useMemo(() => {
    const inside = items.filter(i => withinStay(i.date, checkIn, checkOut));
    const outside = checkIn && checkOut ? items.filter(i => !withinStay(i.date, checkIn, checkOut)) : [];
    const total = inside.reduce((s, i) => s + Number(i.experience.price_per_person) * (i.guests || 1), 0);
    return { inside, outside, total };
  }, [items, checkIn, checkOut]);
}
