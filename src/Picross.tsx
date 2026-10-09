import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import { ArrowRight, Check, Paintbrush, RotateCcw, Sparkles, Undo2, X } from 'lucide-react';
import { text } from './i18n';
import type { Locale } from './types';
import { columnClues, columns, decode, emptyBoard, encode, filled, isSolved, linesDone, puzzles, rowClues, solution } from './picross';
import type { Cell, Puzzle } from './picross';

const copy = {
  ja: {
    title: 'ひと休み、ピクロス。', subtitle: '数字のヒントからマスを塗って、旅の絵を完成させよう。',
    mode: '操作', fill: '塗る', cross: '✕をつける', undo: '1手戻す', reset: '最初から',
    help: 'タップ・ドラッグで塗ります。右クリックか「✕をつける」で、塗らないマスに印を。', keys: 'キーボード：矢印で移動、Spaceで塗る、Xで✕。',
    cleared: 'クリア！', next: '次の問題へ', puzzles: '問題をえらぶ', allCleared: '全問クリア！おつかれさま。',
    saved: '進み具合とクリア記録はこの端末に保存されます', board: 'ピクロスの盤面', cell: '{r}行{c}列', states: ['空白', '塗り', '✕'],
  },
  ko: {
    title: '잠깐 쉬어 가는 네모로직.', subtitle: '숫자 힌트로 칸을 칠해서 여행 그림을 완성해 보세요.',
    mode: '조작', fill: '칠하기', cross: '✕ 표시', undo: '한 수 되돌리기', reset: '처음부터',
    help: '탭하거나 드래그해서 칠해요. 오른쪽 클릭이나 「✕ 표시」로 칠하지 않을 칸을 표시해요.', keys: '키보드: 방향키로 이동, Space로 칠하기, X로 ✕.',
    cleared: '완성!', next: '다음 문제', puzzles: '문제 고르기', allCleared: '모든 문제 완성! 수고했어요.',
    saved: '진행 상황과 완성 기록은 이 기기에 저장됩니다', board: '네모로직 판', cell: '{r}행 {c}열', states: ['빈칸', '칠함', '✕'],
  },
  en: {
    title: 'Take a break with Picross.', subtitle: 'Use the number clues to fill in squares and reveal a little travel picture.',
    mode: 'Tool', fill: 'Fill', cross: 'Mark ✕', undo: 'Undo', reset: 'Start over',
    help: 'Tap or drag to fill. Right-click or use “Mark ✕” for squares that stay empty.', keys: 'Keyboard: arrows to move, Space to fill, X to mark.',
    cleared: 'Solved!', next: 'Next puzzle', puzzles: 'Choose a puzzle', allCleared: 'All puzzles solved. Nicely done!',
    saved: 'Progress and solved puzzles are saved on this device', board: 'Picross board', cell: 'Row {r}, column {c}', states: ['empty', 'filled', 'marked'],
  },
};

type Saved = { current?: string; cleared: string[]; boards: Record<string, string> };
type Game = { puzzle: Puzzle; board: Cell[][]; history: Cell[][][] };
type Point = { r: number; c: number };
const storageKey = 'seoul-picross';
function load(): Saved {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || 'null');
    return {
      current: typeof value?.current === 'string' ? value.current : undefined,
      cleared: Array.isArray(value?.cleared) ? value.cleared.filter((id: unknown): id is string => typeof id === 'string') : [],
      boards: value?.boards && typeof value.boards === 'object' ? value.boards : {},
    };
  } catch { return { cleared: [], boards: {} }; }
}
function save(value: Saved) { try { localStorage.setItem(storageKey, JSON.stringify(value)); } catch { /* Progress is optional in restricted browsers. */ } }
const start = (puzzle: Puzzle, boards: Record<string, string>): Game => ({ puzzle, board: decode(boards[puzzle.id], puzzle) || emptyBoard(puzzle), history: [] });
const set = (board: Cell[][], { r, c }: Point, value: Cell) => board.map((row, i) => i === r ? row.map((cell, j) => j === c ? value : cell) : row);

function Thumbnail({ puzzle }: { puzzle: Puzzle }) {
  return <svg viewBox={`0 0 ${puzzle.art[0].length} ${puzzle.art.length}`} shapeRendering="crispEdges" aria-hidden="true">{solution(puzzle).flatMap((row, r) => row.map((on, c) => on && <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" />))}</svg>;
}

export default function Picross({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [initial] = useState(load);
  const boards = useRef(initial.boards);
  const [cleared, setCleared] = useState(initial.cleared);
  const [game, setGame] = useState(() => start(puzzles.find(p => p.id === initial.current) || puzzles.find(p => !initial.cleared.includes(p.id)) || puzzles[0], initial.boards));
  const [mode, setMode] = useState<1 | 2>(1);
  const [active, setActive] = useState<Point | null>(null);
  const [focus, setFocus] = useState<Point>({ r: 0, c: 0 });
  const stroke = useRef<{ from: Cell; to: Cell; last: Point } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const { puzzle, board } = game;
  const answer = useMemo(() => solution(puzzle), [puzzle]);
  const rows = useMemo(() => rowClues(answer), [answer]);
  const cols = useMemo(() => columnClues(answer), [answer]);
  const grid = filled(board);
  const rowDone = linesDone(grid, rows), colDone = linesDone(columns(grid), cols);
  const solved = isSolved(board, puzzle);
  const width = answer[0].length, height = answer.length;

  useEffect(() => {
    boards.current = { ...boards.current, [puzzle.id]: encode(board) };
    save({ current: puzzle.id, cleared, boards: boards.current });
  }, [puzzle, board, cleared]);
  useEffect(() => { if (solved) setCleared(value => value.includes(puzzle.id) ? value : [...value, puzzle.id]); }, [solved, puzzle]);

  function choose(next: Puzzle) {
    stroke.current = null; setActive(null); setFocus({ r: 0, c: 0 }); setGame(start(next, boards.current));
    boardRef.current?.closest('.picross-main')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function apply(point: Point, first = false) {
    const current = stroke.current;
    if (!current) return;
    // Fill every cell between pointer events so a quick swipe does not skip any.
    const { last } = current, steps = Math.max(Math.abs(point.r - last.r), Math.abs(point.c - last.c));
    const path = Array.from({ length: steps + 1 }, (_, i) => steps ? { r: Math.round(last.r + (point.r - last.r) * i / steps), c: Math.round(last.c + (point.c - last.c) * i / steps) } : point);
    current.last = point;
    setGame(g => {
      const next = path.reduce((board, p) => board[p.r][p.c] === current.from ? set(board, p, current.to) : board, g.board);
      return next === g.board ? g : { ...g, board: next, history: first ? [...g.history.slice(-99), g.board] : g.history };
    });
  }
  function begin(point: Point, mark: Cell) {
    const from = board[point.r][point.c];
    stroke.current = { from, to: from === mark ? 0 : mark, last: point };
    apply(point, true);
  }
  function cellAt(x: number, y: number): Point | null {
    const element = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-cell]');
    if (!element || !boardRef.current?.contains(element)) return null;
    const [r, c] = element.dataset.cell!.split('-').map(Number);
    return { r, c };
  }
  function down(event: PointerEvent<HTMLDivElement>) {
    const point = cellAt(event.clientX, event.clientY);
    if (!point || solved || (event.pointerType === 'mouse' && event.button !== 0 && event.button !== 2)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setFocus(point); setActive(point);
    begin(point, event.button === 2 ? 2 : mode);
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const point = cellAt(event.clientX, event.clientY);
    if (point && (point.r !== active?.r || point.c !== active?.c)) setActive(point);
    if (point) apply(point);
  }
  function end() { stroke.current = null; }
  function key(event: KeyboardEvent<HTMLDivElement>) {
    const steps: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (steps[event.key]) {
      event.preventDefault();
      const next = { r: Math.min(height - 1, Math.max(0, focus.r + steps[event.key][0])), c: Math.min(width - 1, Math.max(0, focus.c + steps[event.key][1])) };
      setFocus(next); setActive(next);
      boardRef.current?.querySelector<HTMLElement>(`[data-cell="${next.r}-${next.c}"]`)?.focus();
    } else if ([' ', 'Enter', 'x', 'X'].includes(event.key)) {
      event.preventDefault();
      if (!solved) { begin(focus, event.key.toLowerCase() === 'x' ? 2 : mode); stroke.current = null; }
    }
  }
  function undo() { setGame(g => g.history.length ? { ...g, board: g.history[g.history.length - 1], history: g.history.slice(0, -1) } : g); }
  function reset() { setGame(g => ({ ...g, board: emptyBoard(g.puzzle), history: solved ? [] : [...g.history, g.board] })); }
  const index = puzzles.indexOf(puzzle);
  const next = puzzles.slice(index + 1).concat(puzzles.slice(0, index)).find(p => !cleared.includes(p.id)) || puzzles[(index + 1) % puzzles.length];
  const label = (point: Point) => `${t.cell.replace('{r}', String(point.r + 1)).replace('{c}', String(point.c + 1))}: ${t.states[board[point.r][point.c]]}`;
  const longest = Math.max(...rows.map(clue => Math.max(clue.length, 1)));

  return <section className="secondary-page picross-page">
    <div className="section-heading"><div><span className="eyebrow">TAKE A BREAK</span><h1>{t.title}</h1><p>{t.subtitle}</p></div></div>
    <div className="picross-layout">
      <div className="picross-main">
        <div className="picross-toolbar">
          <div className="view-switch picross-mode" role="group" aria-label={t.mode}>
            <button aria-pressed={mode === 1} onClick={() => setMode(1)}><Paintbrush size={17} />{t.fill}</button>
            <button aria-pressed={mode === 2} onClick={() => setMode(2)}><X size={17} />{t.cross}</button>
          </div>
          <div className="picross-actions">
            <button className="raised-button" onClick={undo} disabled={solved || game.history.length === 0}><Undo2 size={16} />{t.undo}</button>
            <button className="raised-button" onClick={reset}><RotateCcw size={16} />{t.reset}</button>
          </div>
        </div>
        <div className="picross-frame">
          <div ref={boardRef} className={`picross-board ${solved ? 'is-solved' : ''}`} role="group" aria-label={`${t.board} · ${width}×${height}`} style={{ '--cols': width, '--rows': height, '--clue-cols': longest } as CSSProperties}
            onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} onPointerLeave={() => { if (!stroke.current) setActive(null); }} onContextMenu={event => event.preventDefault()} onKeyDown={key}>
            <div className="picross-corner">{width}×{height}</div>
            <div className="col-clues">{cols.map((clue, c) => <div key={c} className={`col-clue ${colDone[c] ? 'done' : ''} ${active?.c === c ? 'current' : ''}`}>{(clue.length ? clue : [0]).map((n, i) => <span key={i}>{n}</span>)}</div>)}</div>
            <div className="row-clues">{rows.map((clue, r) => <div key={r} className={`row-clue ${rowDone[r] ? 'done' : ''} ${active?.r === r ? 'current' : ''}`}>{(clue.length ? clue : [0]).map((n, i) => <span key={i}>{n}</span>)}</div>)}</div>
            <div className="cells">{board.flatMap((row, r) => row.map((cell, c) => <button key={`${r}-${c}`} data-cell={`${r}-${c}`} tabIndex={focus.r === r && focus.c === c ? 0 : -1} aria-label={label({ r, c })}
              className={['cell', ['', 'filled', 'crossed'][cell], (c + 1) % 5 === 0 || c === width - 1 ? 'edge-right' : '', (r + 1) % 5 === 0 || r === height - 1 ? 'edge-bottom' : '', active && (active.r === r || active.c === c) ? 'in-line' : ''].filter(Boolean).join(' ')} />))}</div>
          </div>
        </div>
        <div className="picross-status" aria-live="polite">{solved
          ? <div className="picross-cleared"><Sparkles size={20} /><p><strong>{t.cleared}</strong>{text(puzzle.title, locale)}</p>{puzzles.length > 1 && <button className="raised-button" onClick={() => choose(next)}>{t.next}<ArrowRight size={16} /></button>}</div>
          : <p>{t.help}<span className="picross-keys">{t.keys}</span></p>}</div>
      </div>
      <aside className="picross-list" aria-label={t.puzzles}>
        <h2>{t.puzzles}</h2>
        {cleared.length >= puzzles.length && <p className="picross-all"><Sparkles size={15} />{t.allCleared}</p>}
        <ul>{puzzles.map((p, i) => { const done = cleared.includes(p.id); return <li key={p.id}><button className={p === puzzle ? 'active' : ''} aria-current={p === puzzle ? 'true' : undefined} onClick={() => choose(p)}>
          <span className={`picross-thumb ${done ? 'done' : ''}`}>{done ? <Thumbnail puzzle={p} /> : '?'}</span>
          <span><small>No.{String(i + 1).padStart(2, '0')} · {p.art[0].length}×{p.art.length}</small><strong>{done ? text(p.title, locale) : '？？？'}</strong></span>
          {done && <Check size={17} className="picross-check" />}
        </button></li>; })}</ul>
      </aside>
    </div>
    <p className="local-caption"><Check size={14} />{t.saved}</p>
  </section>;
}
