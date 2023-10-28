export const DISC = {
  EMPTY: 0,
  DARK: 1,
  LIGHT: 2,
} as const;

export type Disc = (typeof DISC)[keyof typeof DISC];

export const toDisc = (value: number): Disc => value as Disc;
