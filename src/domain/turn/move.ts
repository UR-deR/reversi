import { Disc } from './disc';
import { Point } from './point';

export class Move {
  constructor(public readonly disc: Disc, public readonly point: Point) {}
}
