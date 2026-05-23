import { describe, expect, it } from "vitest";

import {
  detectSource,
  ImportFormatError,
  parseCsv,
} from "@/features/library/services/watchlist-import";

describe("detectSource", () => {
  it("sniffs Letterboxd from the Letterboxd URI column", () => {
    expect(
      detectSource("Date,Name,Year,Letterboxd URI\n2024,Dune,2021,http://x"),
    ).toBe("letterboxd");
  });

  it("sniffs Goodreads from Exclusive Shelf / Bookshelves", () => {
    expect(detectSource("Title,Author,Exclusive Shelf\nX,Y,read")).toBe(
      "goodreads",
    );
  });

  it("returns null for an unknown header", () => {
    expect(detectSource("foo,bar\n1,2")).toBeNull();
    expect(detectSource("")).toBeNull();
  });
});

describe("parseCsv — Letterboxd", () => {
  it("treats a watchlist export (no Rating column) as wishlist", () => {
    const csv =
      "Date,Name,Year,Letterboxd URI\n" +
      "2024-01-01,Dune,2021,https://letterboxd.com/film/dune-2021/";
    const [row] = parseCsv(csv, "letterboxd");
    expect(row).toEqual({
      medium: "movie",
      title: "Dune",
      year: 2021,
      status: "wishlist",
      rating: null,
    });
  });

  it("maps a rated export to finished + 1–3 scale", () => {
    const csv =
      "Date,Name,Year,Rating,Letterboxd URI\n" +
      "2024-01-01,Heat,1995,4.5,uri\n" +
      "2024-01-02,Meh Movie,2000,3,uri\n" +
      "2024-01-03,Bad Movie,2001,1.5,uri";
    const rows = parseCsv(csv, "letterboxd");
    expect(rows.map((r) => [r.title, r.status, r.rating])).toEqual([
      ["Heat", "finished", 3],
      ["Meh Movie", "finished", 2],
      ["Bad Movie", "finished", 1],
    ]);
  });

  it("skips blank rows and rows with an empty title", () => {
    const csv =
      "Name,Year,Letterboxd URI\n" + "Dune,2021,uri\n" + ",,\n" + "\n";
    expect(parseCsv(csv, "letterboxd")).toHaveLength(1);
  });

  it("throws when the Name column is missing", () => {
    expect(() => parseCsv("Foo,Bar\n1,2", "letterboxd")).toThrow(
      ImportFormatError,
    );
  });
});

describe("parseCsv — Goodreads", () => {
  it("maps Exclusive Shelf to status and strips the series suffix", () => {
    const csv =
      "Title,Author,My Rating,Exclusive Shelf,Original Publication Year,Year Published\n" +
      '"Mistborn (The Final Empire, #1)",Brandon Sanderson,5,read,2006,2007\n' +
      "Some Book,Jane Doe,0,currently-reading,,2010\n" +
      "Later Read,Foo Bar,0,to-read,,2015";
    const rows = parseCsv(csv, "goodreads");
    expect(rows).toEqual([
      {
        medium: "book",
        title: "Mistborn",
        creator: "Brandon Sanderson",
        year: 2006,
        status: "finished",
        rating: 3,
      },
      {
        medium: "book",
        title: "Some Book",
        creator: "Jane Doe",
        year: 2010,
        status: "in_progress",
        rating: null,
      },
      {
        medium: "book",
        title: "Later Read",
        creator: "Foo Bar",
        year: 2015,
        status: "wishlist",
        rating: null,
      },
    ]);
  });

  it("handles quoted commas and escaped quotes in fields", () => {
    const csv =
      "Title,Author,My Rating,Exclusive Shelf\n" +
      '"Goodbye, Columbus",Philip Roth,4,read\n' +
      '"She said ""hi""",A. Writer,2,read';
    const rows = parseCsv(csv, "goodreads");
    expect(rows[0].title).toBe("Goodbye, Columbus");
    expect(rows[0].rating).toBe(3);
    expect(rows[1].title).toBe('She said "hi"');
    expect(rows[1].rating).toBe(1);
  });

  it("throws when the Title column is missing", () => {
    expect(() => parseCsv("Foo,Bar\n1,2", "goodreads")).toThrow(
      ImportFormatError,
    );
  });

  it("throws on an empty file", () => {
    expect(() => parseCsv("   ", "goodreads")).toThrow(ImportFormatError);
  });
});
