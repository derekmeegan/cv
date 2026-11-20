interface BookArtwork {
  outline: string;
  wash: string;
}

// One small abstract composition per title, shared by its spine and cover.
// All marks use a 32 × 32 drawing area so their weight stays consistent.
export const BOOK_ARTWORK: Record<string, BookArtwork> = {
  "why-fish-dont-exist": {
    outline:
      "M3 17c5-8 9 8 14 0s9 8 12 0M3 23c5-8 9 8 14 0s9 8 12 0M22 5a3 3 0 1 0 0 6a3 3 0 1 0 0-6Z",
    wash: "M3 17c5-8 9 8 14 0s9 8 12 0v9H3Z",
  },
  dune: {
    outline:
      "M2 25Q10 8 22 25M12 25Q23 13 30 25M21 3a5 5 0 1 0 0 10a5 5 0 1 0 0-10Z",
    wash: "M2 25Q10 8 22 25Z",
  },
  "zero-to-one": {
    outline: "M9 9a7 7 0 1 0 0 14a7 7 0 1 0 0-14ZM24 7v18",
    wash: "M22 7h4v18h-4Z",
  },
  "the-prince": {
    outline: "M4 23V10l7 6 5-11 5 11 7-6v13ZM8 27h16",
    wash: "M4 23V10l7 6 5-11 5 11 7-6v13Z",
  },
  frankenstein: {
    outline:
      "M13 4a12 12 0 0 0 0 24M19 4a12 12 0 0 1 0 24M16 7v18M12 11h8M12 16h8M12 21h8",
    wash: "M13 4a12 12 0 0 0 0 24Z",
  },
  "mckinsey-way": {
    outline: "M4 27V17h8V9h8V3h8v24ZM4 27l24-24",
    wash: "M4 27V17h8V9h8V3h8v24Z",
  },
  "tao-te-ching": {
    outline: "M16 5.5a7.5 7.5 0 1 0 0 15a7.5 7.5 0 1 0 0-15ZM2 25h28M6 29h20",
    wash: "M16 3a10 10 0 1 0 0 20a10 10 0 1 0 0-20Z",
  },
  "creative-act": {
    outline:
      "M24 24a11 11 0 1 1 0-16M16 5v22M8 16h16M27 14a2 2 0 1 0 0 4a2 2 0 1 0 0-4Z",
    wash: "M16 5a11 11 0 0 0 0 22Z",
  },
  meditations: {
    outline:
      "M16 3a13 13 0 1 0 0 26a13 13 0 1 0 0-26ZM16 9a7 7 0 1 0 0 14a7 7 0 1 0 0-14Z",
    wash: "M16 13a3 3 0 1 0 0 6a3 3 0 1 0 0-6Z",
  },
  chaos: {
    outline:
      "M16 16C-5-5-5 37 16 16S37-5 16 16S-5 37 16 16S37-5 16 16M7 6l18 20",
    wash: "M16 16C-5-5-5 37 16 16Z",
  },
  "crime-and-punishment": {
    outline: "M11 3 21 16 11 29 1 16ZM21 3 31 16 21 29 11 16Z",
    wash: "M16 9.5 21 16 16 22.5 11 16Z",
  },
  "philosophy-of-software-design": {
    outline: "M27 20v7H5V5h15M20 5h7v7M11 11h10v10H11Z",
    wash: "M11 11h10v10H11Z",
  },
  "brave-new-world": {
    outline: "M16 4a12 12 0 1 0 0 24a12 12 0 1 0 0-24ZM16 2v28M4 16h24",
    wash: "M16 4a12 12 0 0 1 0 24Z",
  },
  "german-ideology": {
    outline: "M3 3h18v18H3ZM11 11h18v18H11Z",
    wash: "M11 11h10v10H11Z",
  },
  "notes-from-underground": {
    outline: "M3 5h7v7h7v7h7v8h5M3 12h3v7h7v8h7",
    wash: "M3 5h7v7h7v7h7v8H3Z",
  },
  "poor-charlies-almanack": {
    outline:
      "M11 5a8 8 0 1 0 0 16a8 8 0 1 0 0-16ZM21 5a8 8 0 1 0 0 16a8 8 0 1 0 0-16ZM16 13a8 8 0 1 0 0 16a8 8 0 1 0 0-16Z",
    wash: "M16 13a8 8 0 1 0 0 16a8 8 0 1 0 0-16Z",
  },
  sapiens: {
    outline: "M16 29V6M16 21 6 11M16 16 26 6M16 9 10 3M16 25 26 15",
    wash: "M16 6 26 6 16 16ZM6 11h10v10Z",
  },
  psycho: {
    outline: "M12 5a11 11 0 0 0 0 22M20 5a11 11 0 0 1 0 22M21 2 11 30",
    wash: "M12 5a11 11 0 0 0 0 22Z",
  },
  metamorphosis: {
    outline: "M16 16C0-9 0 41 16 16ZM16 16C32-9 32 41 16 16ZM16 5v22",
    wash: "M16 16C32-9 32 41 16 16Z",
  },
  "bitcoin-whitepaper": {
    outline: "M16 2 28 9v14L16 30 4 23V9ZM16 9a7 7 0 1 0 0 14a7 7 0 1 0 0-14Z",
    wash: "M16 9a7 7 0 1 0 0 14a7 7 0 1 0 0-14Z",
  },
  "feline-philosophy": {
    outline: "M2 16Q16-2 30 16Q16 34 2 16ZM16 7v18",
    wash: "M2 16Q16-2 30 16Z",
  },
  "designing-data-intensive-applications": {
    outline:
      "M3 3h10v10H3ZM19 19h10v10H19ZM20 4h8v8h-8ZM4 20h8v8H4ZM13 8h7M8 13v7M12 24h7M24 12v7",
    wash: "M3 3h10v10H3ZM19 19h10v10H19Z",
  },
  "myth-of-sisyphus": {
    outline: "M3 29 22 12 29 29M19 2a5 5 0 1 0 0 10a5 5 0 1 0 0-10Z",
    wash: "M3 29 22 12 29 29Z",
  },
  "sorcerers-stone": {
    outline:
      "M16 2 20 12 30 16 20 20 16 30 12 20 2 16 12 12ZM16 11a5 5 0 1 0 0 10a5 5 0 1 0 0-10Z",
    wash: "M16 2 20 12 30 16 20 20 16 30 12 20 2 16 12 12Z",
  },
  "divine-comedy": {
    outline: "M3 12 16 3 29 12M3 20 16 11 29 20M3 28 16 19 29 28",
    wash: "M3 28 16 19 29 28Z",
  },
  "on-liberty": {
    outline: "M16 2 27 13 16 24 5 13ZM16 2v22M5 13h22M16 24q-5 4 0 6",
    wash: "M16 2 27 13 16 24Z",
  },
  "trial-and-death-of-socrates": {
    outline:
      "M16 3v26M3 10h26M3 10v7a6 6 0 0 0 12 0v-7M17 10v7a6 6 0 0 0 12 0v-7M10 29h12",
    wash: "M3 17a6 6 0 0 0 12 0ZM17 17a6 6 0 0 0 12 0Z",
  },
  dracula: {
    outline: "M22 4a13 13 0 1 0 0 24a15 15 0 0 1 0-24ZM25 11v6M22 14h6",
    wash: "M22 4a13 13 0 1 0 0 24a15 15 0 0 1 0-24Z",
  },
  "gay-science": {
    outline:
      "M16 8a8 8 0 1 0 0 16a8 8 0 1 0 0-16ZM16 1v3M16 28v3M1 16h3M28 16h3M5 5l2 2M25 25l2 2M5 27l2-2M25 7l2-2",
    wash: "M16 8a8 8 0 1 0 0 16a8 8 0 1 0 0-16Z",
  },
  "the-lightning-thief": {
    outline: "M19 2 6 18h9l-2 12 13-18h-9Z",
    wash: "M19 2 6 18h9l-2 12 13-18h-9Z",
  },
  "inner-excellence": {
    outline: "M4 28 16 8 28 28ZM16 2a3 3 0 1 0 0 6a3 3 0 1 0 0-6ZM16 17v6",
    wash: "M4 28 16 8v20Z",
  },
  "engines-that-move-markets": {
    outline: "M4 27V17h5v10M14 27V11h5v16M24 27V5h5v22M3 10Q16 10 27 2",
    wash: "M4 17h5v10H4ZM14 11h5v16h-5ZM24 5h5v22h-5Z",
  },
};
