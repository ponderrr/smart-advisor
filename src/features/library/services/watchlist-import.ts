import type {
  LibraryRating,
  LibraryStatus,
  LogLibraryInput,
} from "@/features/library/types/library";

/**
 * Faithful TS port of the mobile watchlist_import.dart parser. Pure (no
 * network / DOM): tolerant of column order and missing optional columns,
 * trims every value, skips blank rows and rows with an empty title.
 */

/** Where the CSV came from. The user picks this explicitly in the UI;
 *  {@link detectSource} is a convenience used only to warn on a likely
 *  mismatch. */
export type ImportSource = "letterboxd" | "goodreads";

/** Running tally surfaced after an import. `log` upserts, so it can't
 *  signal "this was a duplicate" — rejected rows count as `failed`;
 *  rows dropped before the network (blank / unparseable) are `skipped`. */
export interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
}

/** Thrown by {@link parseCsv} when the file can't be read as the chosen
 *  source's export (empty, no header, or the wrong format entirely). */
export class ImportFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportFormatError";
  }
}

/**
 * Minimal RFC 4180 CSV reader: handles quoted fields, escaped `""`
 * quotes, and commas / newlines inside quotes. Normalises CRLF/CR to LF
 * first. Returns rows of string cells. No dependency on purpose — the
 * project keeps runtime deps lean.
 */
function parseRows(csv: string): string[][] {
  const text = csv.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (text.trim().length === 0) return [];
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  // Flush the trailing field/row unless the file ended on a clean newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const isBlank = (row: string[]): boolean =>
  row.every((c) => c.trim().length === 0);

/**
 * Best-effort source sniff from the header row. Returns null when the
 * headers match neither known export. Letterboxd exports carry a
 * `Letterboxd URI` column; Goodreads carries `Exclusive Shelf` /
 * `Bookshelves`.
 */
export function detectSource(csv: string): ImportSource | null {
  const rows = parseRows(csv);
  if (rows.length === 0) return null;
  const headers = new Set(rows[0].map((c) => c.trim().toLowerCase()));
  if (headers.has("letterboxd uri")) return "letterboxd";
  if (headers.has("exclusive shelf") || headers.has("bookshelves")) {
    return "goodreads";
  }
  return null;
}

/** Star rating (0.5–5) → the library's 1–3 scale: >=4 ⇒ 3 (loved),
 *  2.5–3.5 ⇒ 2 (meh), else ⇒ 1 (nope). */
function toScale(stars: number): LibraryRating {
  if (stars >= 4) return 3;
  if (stars >= 2.5 && stars <= 3.5) return 2;
  return 1;
}

/** Drops a trailing " (Series, #n)" Goodreads appends to some titles. */
function stripSeries(t: string): string {
  return t.replace(/\s*\([^()]*,\s*#\d+(\.\d+)?\)\s*$/, "").trim();
}

const numberOrNull = (v: string | null): number | null => {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * Parses a Letterboxd or Goodreads CSV export into {@link LogLibraryInput}s.
 * Throws {@link ImportFormatError} on an unusable file.
 */
export function parseCsv(
  csv: string,
  source: ImportSource,
): LogLibraryInput[] {
  const rows = parseRows(csv);
  if (rows.length === 0) {
    throw new ImportFormatError("That file looks empty.");
  }
  const header = rows[0].map((c) => c.trim());
  const lower = header.map((h) => h.toLowerCase());
  const idx = (names: string[]): number => {
    for (const n of names) {
      const i = lower.indexOf(n.toLowerCase());
      if (i !== -1) return i;
    }
    return -1;
  };
  const cell = (row: string[], i: number): string | null => {
    if (i < 0 || i >= row.length) return null;
    const v = (row[i] ?? "").trim();
    return v.length === 0 ? null : v;
  };

  const out: LogLibraryInput[] = [];

  if (source === "letterboxd") {
    const nameI = idx(["Name"]);
    const yearI = idx(["Year"]);
    const ratingI = idx(["Rating"]);
    const hasUri = idx(["Letterboxd URI"]) !== -1;
    if (nameI === -1) {
      throw new ImportFormatError(
        "This doesn’t look like a Letterboxd export — no “Name” column was found.",
      );
    }
    const hasRatingCol = ratingI !== -1;
    for (const row of rows.slice(1)) {
      if (isBlank(row)) continue;
      const title = cell(row, nameI);
      if (title == null) continue;
      const ratingCell = hasRatingCol ? cell(row, ratingI) : null;
      const stars =
        ratingCell != null && Number.isFinite(Number(ratingCell))
          ? Number(ratingCell)
          : null;
      let status: LibraryStatus;
      if (stars != null) {
        status = "finished";
      } else if (!hasRatingCol && hasUri) {
        // watchlist.csv has no Rating column → these are saved-for-later.
        status = "wishlist";
      } else {
        status = "finished";
      }
      out.push({
        medium: "movie",
        title,
        year: numberOrNull(cell(row, yearI)),
        status,
        rating: stars == null ? null : toScale(stars),
      });
    }
  } else {
    const titleI = idx(["Title"]);
    const authorI = idx(["Author"]);
    const ratingI = idx(["My Rating"]);
    const shelfI = idx(["Exclusive Shelf"]);
    const origYearI = idx(["Original Publication Year"]);
    const pubYearI = idx(["Year Published"]);
    if (titleI === -1) {
      throw new ImportFormatError(
        "This doesn’t look like a Goodreads export — no “Title” column was found.",
      );
    }
    for (const row of rows.slice(1)) {
      if (isBlank(row)) continue;
      const raw = cell(row, titleI);
      if (raw == null) continue;
      const title = stripSeries(raw);
      const shelf = (cell(row, shelfI) ?? "").toLowerCase();
      const status: LibraryStatus =
        shelf === "currently-reading"
          ? "in_progress"
          : shelf === "to-read"
            ? "wishlist"
            : shelf === "read"
              ? "finished"
              : "finished";
      const ratingCell = cell(row, ratingI);
      const stars =
        ratingCell != null && Number.isFinite(Number(ratingCell))
          ? Number(ratingCell)
          : null;
      out.push({
        medium: "book",
        title,
        creator: cell(row, authorI),
        year:
          numberOrNull(cell(row, origYearI)) ??
          numberOrNull(cell(row, pubYearI)),
        status,
        rating: stars == null || stars <= 0 ? null : toScale(stars),
      });
    }
  }
  return out;
}
