/**
 * Extra cardio — 10 exercises from ideas.md
 *
 * Two from each band: easy (sum, unique), medium (sort titles, chunk),
 * harder (running total, top N), hard (inverted index, group states).
 * Plus: partition + find by id (ideas #9 and #4) to reach 10.
 */

// ─── Testing ───
export function lowercaseHello(name: string) {
  if (!name.length) return 'hello';
  return 'hello ' + name.toLowerCase();
}
// ─── Easy ───

/** Sum an array of numbers. */
export function sum(numbers: number[]): number {
  return numbers.reduce((acc, elt) => {
    return acc + elt;
  }, 0);
}

/** Remove duplicates, keep first occurrence order (use strict equality). */
export function unique<T>(items: T[]): T[] {
  const hashMap = new Map<T, number>();
  const uniqueItems: T[] = [];
  for (const item of items) {
    if (!hashMap.has(item)) {
      uniqueItems.push(item);
    }
    hashMap.set(item, 1);
  }

  return uniqueItems;
}

/** Split into elements that satisfy `pred` vs those that do not (original relative order preserved in each bucket). */
export function partition<T>(
  arr: T[],
  pred: (value: T) => boolean,
): { pass: T[]; fail: T[] } {
  const pass: T[] = [];
  const fail: T[] = [];

  arr.forEach((element) => {
    if (pred(element)) {
      pass.push(element);
    } else {
      fail.push(element);
    }
  });

  return { pass, fail };
}

export type User = { id: string; name: string };

/** Return the user’s `name` for `id`, or `null` if not found. */
export function findNameById(users: User[], id: string): string | null {
  const matchedUser = users.find((user) => {
    return user.id === id;
  });

  return matchedUser?.name || null;
}

// ─── Medium ───

/**
 * Sort movie titles as if leading "The ", "A ", or "An " were not present.
 * Compare the remainder (case-sensitive OK; tests use consistent casing).
 */
export function sortTitlesIgnoringArticles(titles: string[]): string[] {
  const articles = /(The | A | An)/g;
  return titles.sort((titleA: string, titleB: string) => {
    const cleanTitleA = titleA.replace(articles, '');
    const cleanTitleB = titleB.replace(articles, '');
    return cleanTitleA.localeCompare(cleanTitleB);
  });
}

/** Split `arr` into consecutive chunks of length `size` (last chunk may be shorter). Assume `size > 0`. */
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunkedArray = [];
  // standard approach:
  // traverse the array
  // start an counter at 1
  // increment the counter when it reaches the size
  // then we need to start a new chunk and reset the counter to 1
  const N = arr.length;
  let chunk = [];
  for (let idx = 0; idx < N; idx++) {
    chunk.push(arr[idx]);
    if (chunk.length === size) {
      chunkedArray.push(chunk);
      chunk = [];
    }
  }

  if (chunk.length) {
    chunkedArray.push(chunk);
  }
  return chunkedArray;
}

// ─── Harder ───

/** Cumulative sum at each step. */
export function runningTotal(values: number[]): number[] {
  return values.reduce((acc: number[], current: number, pos: number) => {
    let previous = pos === 0 ? 0 : acc[pos - 1];
    acc.push(previous + current);
    return acc;
  }, []);
}

export type ScoreRow = { studentId: string; subject: string; score: number };

/**
 * For each subject, take the top `n` scores (highest first). If fewer than `n` rows exist, return all.
 * Ties: stable by original order in the input array.
 */
export function topNPerSubject(
  rows: ScoreRow[],
  n: number,
): Record<string, { studentId: string; score: number }[]> {
  const subjectVsScoreMap = new Map<
    string,
    { studentId: string; score: number }[]
  >();

  for (const row of rows) {
    if (!subjectVsScoreMap.has(row.subject)) {
      subjectVsScoreMap.set(row.subject, []);
    }

    const scores = subjectVsScoreMap.get(row.subject)!;
    scores.push({ studentId: row.studentId, score: row.score });
    subjectVsScoreMap.set(row.subject, scores);
  }

  const answer: Record<string, { studentId: string; score: number }[]> = {};

  for (const [key, value] of subjectVsScoreMap) {
    answer[key] = value.sort((a, b) => b.score - a.score).slice(0, n);
  }
  return answer;
}

// ─── Hard ───

export type DocWords = { id: string; words: string[] };

/**
 * Word → sorted list of document ids that contain that word (each id once per word).
 */
export function invertedIndex(docs: DocWords[]): Record<string, string[]> {
  const wordVsIdMap = new Map<string, string[]>();
  for (const doc of docs) {
    for (const word of doc.words) {
      if (!wordVsIdMap.has(word)) {
        wordVsIdMap.set(word, []);
      }

      const idList = wordVsIdMap.get(word)!;
      idList.push(doc.id);
      wordVsIdMap.set(word, idList);
    }
  }

  const answer: Record<string, string[]> = {};
  for (let [key, value] of wordVsIdMap) {
    answer[key] = value.sort((a, b) => a.localeCompare(b));
  }

  return answer;
}

export type City = { name: string; state: string; population: number };

/**
 * States ordered by **total** population (descending). Each entry lists that state’s city **names**
 * sorted **alphabetically** (A→Z).
 */
export function groupStatesByPopulation(
  cities: City[],
): { state: string; totalPopulation: number; cities: string[] }[] {
  return [];
}
