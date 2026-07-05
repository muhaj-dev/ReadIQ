/**
 * Tiny className helper for NativeWind.
 *
 * Accepts strings, numbers, arrays, and conditional `{ 'class': boolean }` maps,
 * drops falsy values, and joins the rest with a space. Use it to compose
 * conditional Tailwind classes cleanly:
 *
 *   <View className={cn('flex-1 px-5', isActive && 'bg-accent', { 'opacity-50': disabled })} />
 *
 * NativeWind resolves conflicting utilities by source order, so the layout /
 * spacing classes this app uses don't need `tailwind-merge`. Keep colours in
 * `useTheme()` — this helper is for layout classes only.
 */
export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string' || typeof input === 'number') {
      out.push(String(input));
    } else if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) out.push(nested);
    } else if (typeof input === 'object') {
      for (const key in input) {
        if (input[key]) out.push(key);
      }
    }
  }

  return out.join(' ');
}
