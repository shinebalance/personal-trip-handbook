import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const code = ts.transpileModule(fs.readFileSync(new URL('../src/picross.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const picross = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

// Narrow one line (-1 unknown, 0 blank, 1 filled) to the cells every placement of its runs agrees on.
function narrow(line, runs) {
  const n = line.length, canFill = Array(n).fill(false), canBlank = Array(n).fill(false), memo = new Map();
  const fits = (start, end, value) => line.slice(start, end).every(cell => cell === -1 || cell === value);
  function place(at, run) {
    const key = `${at}/${run}`;
    if (memo.has(key)) return memo.get(key);
    let ok = false;
    if (run === runs.length) {
      ok = fits(at, n, 0);
      if (ok) for (let i = at; i < n; i++) canBlank[i] = true;
    } else {
      for (let s = at; s + runs[run] <= n && fits(at, s, 0); s++) {
        const end = s + runs[run];
        if (!fits(s, end, 1) || (end < n && line[end] === 1) || !place(Math.min(n, end + 1), run + 1)) continue;
        ok = true;
        for (let i = at; i < s; i++) canBlank[i] = true;
        for (let i = s; i < end; i++) canFill[i] = true;
        if (end < n) canBlank[end] = true;
      }
    }
    memo.set(key, ok);
    return ok;
  }
  assert.ok(place(0, 0), 'clues contradict each other');
  return line.map((cell, i) => canFill[i] && !canBlank[i] ? 1 : canBlank[i] && !canFill[i] ? 0 : cell);
}
function lineSolve(rows, cols) {
  const grid = rows.map(() => cols.map(() => -1));
  for (let changed = true; changed;) {
    changed = false;
    rows.forEach((runs, r) => narrow(grid[r], runs).forEach((value, c) => { if (grid[r][c] !== value) { grid[r][c] = value; changed = true; } }));
    cols.forEach((runs, c) => narrow(grid.map(row => row[c]), runs).forEach((value, r) => { if (grid[r][c] !== value) { grid[r][c] = value; changed = true; } }));
  }
  return grid;
}

test('every puzzle is rectangular, has a unique id, and is solvable without guessing', () => {
  assert.equal(new Set(picross.puzzles.map(p => p.id)).size, picross.puzzles.length);
  for (const puzzle of picross.puzzles) {
    assert.ok(puzzle.art.every(row => row.length === puzzle.art[0].length && /^[.#]+$/.test(row)), puzzle.id);
    const answer = picross.solution(puzzle);
    const solved = lineSolve(picross.rowClues(answer), picross.columnClues(answer));
    assert.deepEqual(solved, answer.map(row => row.map(Number)), `${puzzle.id} needs guessing`);
  }
});

test('clues count runs and treat an empty line as no runs', () => {
  assert.deepEqual(picross.clue([true, true, false, true, false]), [2, 1]);
  assert.deepEqual(picross.clue([false, false]), []);
});

test('a board is solved when its filled cells match every clue, ignoring ✕ marks', () => {
  const puzzle = picross.puzzles.find(p => p.id === 'heart');
  const board = picross.solution(puzzle).map(row => row.map(on => on ? 1 : 2));
  assert.equal(picross.isSolved(board, puzzle), true);
  board[0][1] = 0;
  assert.equal(picross.isSolved(board, puzzle), false);
  assert.equal(picross.isSolved(picross.emptyBoard(puzzle), puzzle), false);
});

test('saved boards round-trip and reject a board of another shape', () => {
  const puzzle = picross.puzzles[0];
  const board = picross.emptyBoard(puzzle);
  board[1][2] = 1; board[3][0] = 2;
  assert.deepEqual(picross.decode(picross.encode(board), puzzle), board);
  assert.equal(picross.decode('00/11', puzzle), null);
  assert.equal(picross.decode(42, puzzle), null);
});
