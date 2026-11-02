/**
 * Effective price of a product, taking its scheduled discount into account.
 * Every price shown or charged (POS, public API, checkout) goes through
 * `effectivePrice` so they cannot disagree. `sellingPrice` is never overwritten.
 *
 * A discount applies to the till ('pos'), the website ('web') or both. Pass the
 * channel you are pricing for; 'any' ignores the setting (admin screens that
 * show the discount itself).
 */

export type DiscountType = 'percent' | 'fixed';
/** What a discount applies to. */
export type DiscountChannel = 'both' | 'web' | 'pos';
/** Who is asking for the price. */
export type Channel = 'pos' | 'web' | 'any';

export interface DiscountFields {
  sellingPrice: number;
  discountType?: string | null;
  discountValue?: number | null;
  discountStart?: Date | string | null;
  discountEnd?: Date | string | null;
  discountChannel?: string | null;
}

export type DiscountStatus = 'none' | 'scheduled' | 'active' | 'expired';

const toDate = (d: Date | string | null | undefined) => (d ? new Date(d) : null);

/** Whole-day end: a discount ending on the 30th still applies all day on the 30th. */
function endOfDay(d: Date): Date {
  const e = new Date(d);
  e.setUTCHours(23, 59, 59, 999);
  return e;
}

export function discountStatus(p: DiscountFields, now: Date = new Date()): DiscountStatus {
  const start = toDate(p.discountStart);
  const end = toDate(p.discountEnd);
  if (!p.discountType || !p.discountValue || p.discountValue <= 0 || !start || !end) return 'none';
  if (now < start) return 'scheduled';
  if (now > endOfDay(end)) return 'expired';
  return 'active';
}

/** Does the discount's "applies to" setting cover this channel? */
export function appliesTo(p: Pick<DiscountFields, 'discountChannel'>, channel: Channel): boolean {
  return channel === 'any' || !p.discountChannel || p.discountChannel === 'both' || p.discountChannel === channel;
}

/** Is a discount running right now on this channel? */
export function isDiscountLive(p: DiscountFields, channel: Channel, now: Date = new Date()): boolean {
  return discountStatus(p, now) === 'active' && appliesTo(p, channel);
}

/** Amount taken off `sellingPrice` while the discount is active on this channel, else 0. */
export function discountAmount(p: DiscountFields, now: Date = new Date(), channel: Channel = 'any'): number {
  if (!isDiscountLive(p, channel, now)) return 0;
  const value = p.discountValue ?? 0;
  const off = p.discountType === 'percent' ? (p.sellingPrice * value) / 100 : value;
  // A discount that would zero the price (e.g. the base price was lowered
  // after a fixed discount was set) is ignored rather than selling for free.
  return off > 0 && off < p.sellingPrice ? off : 0;
}

export function effectivePrice(p: DiscountFields, now: Date = new Date(), channel: Channel = 'any'): number {
  return Math.round((p.sellingPrice - discountAmount(p, now, channel)) * 100) / 100;
}

/** Returns an error message, or null when the discount input is valid. */
export function validateDiscount(
  input: { type: string; value: number; start: string; end: string; channel?: string },
  sellingPrice: number,
): string | null {
  if (input.channel !== undefined && !['both', 'web', 'pos'].includes(input.channel)) return 'Choose where the discount applies';
  if (input.type !== 'percent' && input.type !== 'fixed') return 'Choose percent or fixed amount';
  if (!Number.isFinite(input.value) || input.value <= 0) return 'Discount value must be greater than 0';
  if (input.type === 'percent' && input.value > 99) return 'Percent discount must be between 1 and 99';
  if (input.type === 'fixed' && input.value >= sellingPrice) return 'Discount must be less than the price';
  const start = new Date(input.start);
  const end = new Date(input.end);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Start and end dates are required';
  if (end < start) return 'End date must be on or after the start date';
  return null;
}
