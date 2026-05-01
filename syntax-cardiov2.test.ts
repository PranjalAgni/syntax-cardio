import { describe, expect, it } from 'vitest';
import {
  parseCSV,
  parseCSVLine,
  parseQueryString,
  renderTable,
  slugify,
  stringifyQuery,
  templateRender,
  truncate,   
  wordCount,
  wordWrap,
  type TableRow,
} from './syntax-cardiov2';

// ─── Easy ───

describe('easy — slugify', () => {
  it('lowercases and dashes non-alphanumerics', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
    expect(slugify('  Hello___World  ')).toBe('hello-world');
    expect(slugify('foo bar baz')).toBe('foo-bar-baz');
  });

  it('keeps digits inline (no separator inside alnum runs)', () => {
    expect(slugify('foo123bar')).toBe('foo123bar');
    expect(slugify('v1.2.3 release')).toBe('v1-2-3-release');
  });

  it('handles empty / punctuation-only / single char', () => {
    expect(slugify('')).toBe('');
    expect(slugify('!!!')).toBe('');
    expect(slugify('A')).toBe('a');
  });
});

describe('easy — wordCount', () => {
  it('counts words case-insensitively', () => {
    expect(wordCount('the cat. The dog!')).toEqual({ the: 2, cat: 1, dog: 1 });
    expect(wordCount('one two two three three three')).toEqual({
      one: 1,
      two: 2,
      three: 3,
    });
  });

  it('treats numbers as words', () => {
    expect(wordCount('a1 b2 a1')).toEqual({ a1: 2, b2: 1 });
  });

  it('handles empty / punctuation-only', () => {
    expect(wordCount('')).toEqual({});
    expect(wordCount('...!?!')).toEqual({});
  });
});

describe('easy — truncate', () => {
  it('returns input unchanged when short enough', () => {
    expect(truncate('hello', 10)).toBe('hello');
    expect(truncate('hello', 5)).toBe('hello');
    expect(truncate('hi', 10, '…')).toBe('hi');
  });

  it('truncates with default suffix and total length === n', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
    expect(truncate('hello world', 8).length).toBe(8);
  });

  it('respects a custom suffix', () => {
    expect(truncate('hello world', 7, '…')).toBe('hello …');
    expect(truncate('hello world', 7, '…').length).toBe(7);
    expect(truncate('abcdefghij', 6, '..')).toBe('abcd..');
  });
});

// ─── Medium ───

describe('medium — parseQueryString', () => {
  it('parses simple pairs', () => {
    expect(parseQueryString('a=1&b=2')).toEqual({ a: '1', b: '2' });
  });

  it('strips a leading question mark', () => {
    expect(parseQueryString('?a=1&b=2')).toEqual({ a: '1', b: '2' });
  });

  it('repeats keys collapse into arrays in input order', () => {
    expect(parseQueryString('a=1&b=2&a=3')).toEqual({ a: ['1', '3'], b: '2' });
    expect(parseQueryString('a=1&a=2&a=3')).toEqual({ a: ['1', '2', '3'] });
  });

  it('treats key without "=" as empty string value', () => {
    expect(parseQueryString('flag')).toEqual({ flag: '' });
    expect(parseQueryString('a=1&flag&b=2')).toEqual({
      a: '1',
      flag: '',
      b: '2',
    });
  });

  it('URL-decodes values and keys', () => {
    expect(parseQueryString('name=John%20Doe')).toEqual({ name: 'John Doe' });
    expect(parseQueryString('a%20b=1')).toEqual({ 'a b': '1' });
  });

  it('empty string → {}', () => {
    expect(parseQueryString('')).toEqual({});
    expect(parseQueryString('?')).toEqual({});
  });
});

describe('medium — templateRender', () => {
  it('substitutes flat keys', () => {
    expect(templateRender('Hello {{name}}!', { name: 'World' })).toBe(
      'Hello World!',
    );
  });

  it('allows whitespace inside braces', () => {
    expect(templateRender('Hi {{ user }}', { user: 'Ada' })).toBe('Hi Ada');
  });

  it('handles multiple placeholders and number values', () => {
    expect(templateRender('X={{x}}, Y={{y}}', { x: 1, y: 2 })).toBe('X=1, Y=2');
  });

  it('renders missing keys as empty string', () => {
    expect(templateRender('Hi {{name}}', {})).toBe('Hi ');
    expect(templateRender('a={{a}} b={{b}}', { a: '1' })).toBe('a=1 b=');
  });

  it('passes through templates with no placeholders', () => {
    expect(templateRender('plain text', { ignored: 'x' })).toBe('plain text');
    expect(templateRender('', {})).toBe('');
  });

  it('does not mutate inputs', () => {
    const data = { name: 'World' };
    const tpl = 'Hello {{name}}!';
    templateRender(tpl, data);
    expect(data).toEqual({ name: 'World' });
    expect(tpl).toBe('Hello {{name}}!');
  });
});

describe('medium — stringifyQuery', () => {
  it('serializes simple pairs', () => {
    expect(stringifyQuery({ a: '1', b: '2' })).toBe('a=1&b=2');
  });

  it('URL-encodes values (spaces → %20, not +)', () => {
    expect(stringifyQuery({ name: 'John Doe' })).toBe('name=John%20Doe');
    expect(stringifyQuery({ q: 'a&b=c' })).toBe('q=a%26b%3Dc');
  });

  it('expands arrays to repeated keys in order', () => {
    expect(stringifyQuery({ a: ['1', '2', '3'] })).toBe('a=1&a=2&a=3');
  });

  it('skips null and undefined values', () => {
    expect(stringifyQuery({ a: '1', b: null, c: '2' })).toBe('a=1&c=2');
    expect(stringifyQuery({ a: '1', b: undefined, c: '2' })).toBe('a=1&c=2');
  });

  it('serializes numbers', () => {
    expect(stringifyQuery({ a: 1, b: 2 })).toBe('a=1&b=2');
  });

  it('empty object → ""', () => {
    expect(stringifyQuery({})).toBe('');
  });

  it('round-trips with parseQueryString', () => {
    const original = { a: '1', b: 'hello world', c: ['x', 'y'] };
    const parsed = parseQueryString(stringifyQuery(original));
    expect(parsed).toEqual({ a: '1', b: 'hello world', c: ['x', 'y'] });
  });
});

// ─── Harder ───

describe('harder — parseCSVLine', () => {
  it('splits unquoted fields on commas', () => {
    expect(parseCSVLine('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('preserves whitespace', () => {
    expect(parseCSVLine(' a , b , c ')).toEqual([' a ', ' b ', ' c ']);
  });

  it('handles quoted fields containing commas', () => {
    expect(parseCSVLine('"a,b",c')).toEqual(['a,b', 'c']);
    expect(parseCSVLine('a,"b,c,d",e')).toEqual(['a', 'b,c,d', 'e']);
  });

  it('handles escaped double-quotes inside quoted fields', () => {
    expect(parseCSVLine('"a""b",c')).toEqual(['a"b', 'c']);
    expect(parseCSVLine('"""quoted"""')).toEqual(['"quoted"']);
  });

  it('keeps empty fields for leading/trailing/double commas', () => {
    expect(parseCSVLine('a,')).toEqual(['a', '']);
    expect(parseCSVLine(',a')).toEqual(['', 'a']);
    expect(parseCSVLine('a,,b')).toEqual(['a', '', 'b']);
  });

  it('empty string → [""]', () => {
    expect(parseCSVLine('')).toEqual(['']);
  });
});

describe('harder — wordWrap', () => {
  it('packs greedily up to width', () => {
    expect(wordWrap('the quick brown fox jumps', 10)).toEqual([
      'the quick',
      'brown fox',
      'jumps',
    ]);
  });

  it('does not split words longer than width', () => {
    expect(wordWrap('supercalifragilistic is fun', 10)).toEqual([
      'supercalifragilistic',
      'is fun',
    ]);
  });

  it('collapses multi-space runs to single spaces', () => {
    expect(wordWrap('a   b   c', 10)).toEqual(['a b c']);
  });

  it('empty / whitespace-only input → []', () => {
    expect(wordWrap('', 10)).toEqual([]);
    expect(wordWrap('   ', 10)).toEqual([]);
  });

  it('exact-fit lines do not wrap', () => {
    expect(wordWrap('aaa bbb', 7)).toEqual(['aaa bbb']);
  });
});

// ─── Hard ───

describe('hard — parseCSV', () => {
  it('uses the first row as headers and produces row objects', () => {
    expect(parseCSV('name,age\nAda,30\nLinus,50')).toEqual([
      { name: 'Ada', age: '30' },
      { name: 'Linus', age: '50' },
    ]);
  });

  it('handles quoted fields with commas inside data rows', () => {
    expect(parseCSV('name,age\n"Linus, B.",50')).toEqual([
      { name: 'Linus, B.', age: '50' },
    ]);
  });

  it('tolerates a trailing newline', () => {
    expect(parseCSV('a,b\n1,2\n')).toEqual([{ a: '1', b: '2' }]);
  });

  it('returns [] when there are no data rows', () => {
    expect(parseCSV('')).toEqual([]);
    expect(parseCSV('a,b')).toEqual([]);
  });

  it('keeps all values as strings (no coercion)', () => {
    const rows = parseCSV('id,active\n1,true');
    expect(rows).toEqual([{ id: '1', active: 'true' }]);
    expect(typeof rows[0].id).toBe('string');
    expect(typeof rows[0].active).toBe('string');
  });
});

describe('hard — renderTable', () => {
  it('renders a markdown-style ASCII table', () => {
    const rows: TableRow[] = [
      { name: 'Ada', age: 30 },
      { name: 'Linus', age: 50 },
    ];
    expect(renderTable(rows)).toBe(
      [
        '| name  | age |',
        '| ----- | --- |',
        '| Ada   | 30  |',
        '| Linus | 50  |',
      ].join('\n'),
    );
  });

  it('uses header length when it exceeds all cell lengths', () => {
    const rows: TableRow[] = [{ username: 'a', score: 1 }];
    expect(renderTable(rows)).toBe(
      ['| username | score |', '| -------- | ----- |', '| a        | 1     |'].join(
        '\n',
      ),
    );
  });

  it('preserves column order from the first row', () => {
    const rows: TableRow[] = [{ b: 'x', a: 'y' }];
    const out = renderTable(rows);
    const headerLine = out.split('\n')[0];
    expect(headerLine.indexOf('b')).toBeLessThan(headerLine.indexOf('a'));
  });

  it('empty rows → ""', () => {
    expect(renderTable([])).toBe('');
  });

  it('does not mutate input', () => {
    const rows: TableRow[] = [{ name: 'Ada', age: 30 }];
    const snapshot = JSON.parse(JSON.stringify(rows));
    renderTable(rows);
    expect(rows).toEqual(snapshot);
  });
});
