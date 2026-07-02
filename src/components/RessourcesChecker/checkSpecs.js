export function checkPathsSections(manifest, sections, allowedSelected) {
  let val = true;
  sections.forEach((s) => {
    if (s.content) {
      Object.entries(s.content).forEach(([k, v]) => {
        if (allowedSelected.includes(k)) {
          console.log([k, v]);
          if (typeof v === typeof "string") {
            val = val && manifest[v] != null;
          } else if (typeof v === typeof {}) {
            val = val && checkPathsSections(manifest, v, allowedSelected);
          }
        }
      });
    } else {
      Object.entries(s).forEach(([k, v]) => {
        if (allowedSelected.includes(k)) {
          console.log([k, v]);

          if (typeof v === typeof "string") {
            val = val && manifest[v] != null;
          }
        }
      });
    }
  });

  return val;
}

export function checkPathBooks(
  manifest,
  sections,
  bookRanges,
  allowedSelected,
) {
  let val = true;
  sections.forEach((s) => {
    if (s.content) {
      Object.entries(s.content).forEach(([k, v]) => {
        if (allowedSelected.includes(k)) {
          console.log([k, v]);
          if (typeof v === typeof "string") {
            val =
              val &&
              manifest[v] != null &&
              bookRanges.every((bc) => manifest[v].book_codes.includes(bc));
          } else if (typeof v === typeof {}) {
            val =
              val && checkPathBooks(manifest, v, bookRanges, allowedSelected);
          }
        }
      });
    } else {
      Object.entries(s).forEach(([k, v]) => {
        if (allowedSelected.includes(k)) {
          console.log([k, v]);

          if (typeof v === typeof "string") {
            val = val && manifest[v] != null;
            bookRanges.every((bc) => manifest[v].book_codes.includes(bc));
          }
        }
      });
    }
  });

  return val;
}
