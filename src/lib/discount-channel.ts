/** Labels for where a product discount applies. */
export const CHANNELS = [
  {
    value: 'both',
    label: 'Till & website',
    short: '',
    text: 'text-emerald-600',
    selected: 'bg-emerald-600 text-white',
    soft: 'border-emerald-500/40 bg-emerald-500/10',
  },
  {
    value: 'web',
    label: 'Website only',
    short: 'Website only',
    text: 'text-violet-600',
    selected: 'bg-violet-600 text-white',
    soft: 'border-violet-500/40 bg-violet-500/10',
  },
  {
    value: 'pos',
    label: 'Till only',
    short: 'Till only',
    text: 'text-sky-600',
    selected: 'bg-sky-600 text-white',
    soft: 'border-sky-500/40 bg-sky-500/10',
  },
] as const;

/** Colour classes for a channel; unknown/empty falls back to "both". */
export const channelStyle = (c?: string | null) => CHANNELS.find((x) => x.value === c) ?? CHANNELS[0];

export const channelShort = (c?: string | null) => CHANNELS.find((x) => x.value === c)?.short ?? '';
