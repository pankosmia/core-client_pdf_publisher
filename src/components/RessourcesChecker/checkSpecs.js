export function checkPathsSections(
  manifest,
  sections,
  typeThatNeedRessourceSelection,
) {
  let val = true;
  if (sections) {
    sections.forEach((s) => {
      if (s.content) {
        Object.entries(s.content).forEach(([k, v]) => {
          if (typeThatNeedRessourceSelection.includes(k)) {
            if (typeof v === typeof "string") {
              val = val && manifest[v] != null;
            } else if (typeof v === typeof {}) {
              val =
                val &&
                checkPathsSections(manifest, v, typeThatNeedRessourceSelection);
            }
          }
        });
      } else {
        Object.entries(s).forEach(([k, v]) => {
          if (typeThatNeedRessourceSelection.includes(k)) {
            if (typeof v === typeof "string") {
              val = val && manifest[v] != null;
            }
          }
        });
      }
    });
  }

  return val;
}

export function checkPathBooks(
  manifest,
  sections,
  bookRanges,
  typeThatNeedRessourceSelection,
) {
  let val = true;
  if (sections) {
    sections.forEach((s) => {
      if (s.content) {
        Object.entries(s.content).forEach(([k, v]) => {
          if (typeThatNeedRessourceSelection.includes(k)) {
            if (typeof v === typeof "string") {
              val =
                val &&
                manifest[v] != null &&
                bookRanges.every((bc) => manifest[v].book_codes.includes(bc));
            } else if (typeof v === typeof {}) {
              val =
                val &&
                checkPathBooks(
                  manifest,
                  v,
                  bookRanges,
                  typeThatNeedRessourceSelection,
                );
            }
          }
        });
      } else {
        Object.entries(s).forEach(([k, v]) => {
          if (typeThatNeedRessourceSelection.includes(k)) {
            if (typeof v === typeof "string") {
              val = val && manifest[v] != null;
              bookRanges.every((bc) => manifest[v].book_codes.includes(bc));
            }
          }
        });
      }
    });
  }
  return val;
}
