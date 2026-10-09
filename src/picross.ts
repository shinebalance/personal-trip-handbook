import type { Localized } from './types';

// 0: blank, 1: filled, 2: marked with ✕.
export type Cell = 0 | 1 | 2;
export type Puzzle = { id: string; title: Localized; art: string[] };

// Every puzzle is solvable by line logic alone (see scripts/picross.test.mjs).
export const puzzles: Puzzle[] = [
  { id: 'heart', title: { ja: 'ハート', ko: '하트', en: 'Heart' }, art: [
    '.#.#.',
    '#####',
    '#####',
    '.###.',
    '..#..'] },
  { id: 'note', title: { ja: '音符', ko: '음표', en: 'Music note' }, art: [
    '..##.',
    '..#.#',
    '..#..',
    '###..',
    '###..'] },
  { id: 'coffee', title: { ja: 'カフェのコーヒー', ko: '카페 커피', en: 'Café coffee' }, art: [
    '...#..#...',
    '..#..#....',
    '...#..#...',
    '..........',
    '.#######..',
    '.#########',
    '.#######.#',
    '.#########',
    '..#####...',
    '#########.'] },
  { id: 'plane', title: { ja: '飛行機', ko: '비행기', en: 'Airplane' }, art: [
    '.....#....',
    '.....##...',
    '#....###..',
    '##...####.',
    '##########',
    '##########',
    '##...####.',
    '#....###..',
    '.....##...',
    '.....#....'] },
  { id: 'tower', title: { ja: 'Nソウルタワー', ko: 'N서울타워', en: 'N Seoul Tower' }, art: [
    '....##....',
    '....##....',
    '...####...',
    '..######..',
    '...####...',
    '....##....',
    '....##....',
    '...####...',
    '..##..##..',
    '##########'] },
  { id: 'record', title: { ja: 'レコード', ko: '레코드', en: 'Record' }, art: [
    '..######..',
    '.########.',
    '##########',
    '####..####',
    '###.##.###',
    '###.##.###',
    '####..####',
    '##########',
    '.########.',
    '..######..'] },
  { id: 'hanok', title: { ja: '月夜の韓屋', ko: '달밤의 한옥', en: 'Hanok by moonlight' }, art: [
    '...........##..',
    '..........##...',
    '...........##..',
    '......###......',
    '..###########..',
    '#.###########.#',
    '###############',
    '.##.........##.',
    '...#########...',
    '...#.##.##.#...',
    '...#.##.##.#...',
    '...#.......#...',
    '...#########...',
    '.#############.',
    '###############'] },
];

export const solution = (puzzle: Puzzle) => puzzle.art.map(row => [...row].map(cell => cell === '#'));
export const emptyBoard = (puzzle: Puzzle): Cell[][] => puzzle.art.map(row => [...row].map(() => 0));
export function clue(line: boolean[]) {
  const runs: number[] = [];
  let run = 0;
  for (const filled of line) { if (filled) run++; else if (run) { runs.push(run); run = 0; } }
  if (run) runs.push(run);
  return runs;
}
export const columns = <T>(grid: T[][]) => grid[0].map((_, c) => grid.map(row => row[c]));
export const rowClues = (grid: boolean[][]) => grid.map(clue);
export const columnClues = (grid: boolean[][]) => columns(grid).map(clue);
export const filled = (board: Cell[][]) => board.map(row => row.map(cell => cell === 1));
const same = (a: number[], b: number[]) => a.length === b.length && a.every((value, i) => value === b[i]);
export const linesDone = (lines: boolean[][], targets: number[][]) => lines.map((line, i) => same(clue(line), targets[i]));
// Accept any picture that satisfies every clue, not only the drawn one.
export function isSolved(board: Cell[][], puzzle: Puzzle) {
  const answer = solution(puzzle), grid = filled(board);
  return linesDone(grid, rowClues(answer)).every(Boolean) && linesDone(columns(grid), columnClues(answer)).every(Boolean);
}
export const encode = (board: Cell[][]) => board.map(row => row.join('')).join('/');
export function decode(value: unknown, puzzle: Puzzle): Cell[][] | null {
  if (typeof value !== 'string') return null;
  const rows = value.split('/');
  if (rows.length !== puzzle.art.length || rows.some((row, r) => row.length !== puzzle.art[r].length || /[^012]/.test(row))) return null;
  return rows.map(row => [...row].map(Number) as Cell[]);
}
