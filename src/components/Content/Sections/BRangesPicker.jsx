import { useEffect, useState } from "react";
import { getJson, doI18n } from "pithekos-lib";

import { Box, Card, Chip, CardContent, Typography } from "@mui/material";
import { BIBLE_BOOKS } from "../../utils/booksOfTheBible";
const allowedSelected = [
  "jxl",
  "scripture",
  "notes",
  "src",
  "obs",
  "obsImg",
  "bcvNotes",
  "scriptureSrc",
];

const OT_BOOKS = Object.keys(BIBLE_BOOKS.oldTestament);
const NT_BOOKS = Object.keys(BIBLE_BOOKS.newTestament);

export function BRangesPicker({ bRanges, setBRanges, currentSections }) {
  const [booksOption, setBooksOption] = useState([]);
  const [selectedBooks, setSelectedBooks] = useState([]);

  useEffect(() => {
    if (bRanges?.length) {
      setSelectedBooks(bRanges);
    }
  }, [bRanges]);

  useEffect(() => {
    if (!booksOption.length) return;

    setSelectedBooks((prev) => {
      const filtered = prev.filter((b) => booksOption.includes(b));

      if (filtered.length !== prev.length) {
        setBRanges(filtered);
      }

      return filtered;
    });
  }, [booksOption]);

  const toggleBook = (book) => {
    setSelectedBooks((prev) => {
      const exists = prev.includes(book);
      const updated = exists ? prev.filter((b) => b !== book) : [...prev, book];

      setBRanges(updated);
      return updated;
    });
  };
  const booksToRender = Object.keys({
    ...BIBLE_BOOKS.oldTestament,
    ...BIBLE_BOOKS.newTestament,
  });
  const BOOK_GROUPS = {
    ot: OT_BOOKS,
    nt: NT_BOOKS,
  };

  const toggleGroup = (groupKey) => {
    const groupBooks = BOOK_GROUPS[groupKey];

    if (!groupBooks) return;

    setSelectedBooks((prev) => {
      const allSelected = groupBooks.every((b) => prev.includes(b));

      let updated;

      if (allSelected) {
        // unselect group
        updated = prev.filter((b) => !groupBooks.includes(b));
      } else {
        // select group
        updated = [...new Set([...prev, ...groupBooks])];
      }

      setBRanges(updated);
      return updated;
    });
  };
  const isGroupSelected = (groupKey) =>
    BOOK_GROUPS[groupKey]?.every((b) => selectedBooks.includes(b));
  return (
    <Card sx={{ mt: 2, p: 2 }}>
      <CardContent sx={{ padding: 0 }}>
        <Box display="flex" gap={1} mb={2}>
          {Object.keys(BOOK_GROUPS).map((groupKey) => (
            <Chip
              key={groupKey}
              label={groupKey.toUpperCase()}
              color={isGroupSelected(groupKey) ? "primary" : "default"}
              variant={isGroupSelected(groupKey) ? "filled" : "outlined"}
              onClick={() => toggleGroup(groupKey)}
            />
          ))}
        </Box>
        {/* Books */}
        <Box display="flex" gap={1} flexWrap="wrap">
          {booksToRender.map((bookKey) => {
            const label =
              BIBLE_BOOKS.oldTestament[bookKey] ||
              BIBLE_BOOKS.newTestament[bookKey];

            return (
              <Chip
                key={bookKey}
                label={label}
                clickable
                color={selectedBooks.includes(bookKey) ? "primary" : "default"}
                variant={
                  selectedBooks.includes(bookKey) ? "filled" : "outlined"
                }
                onClick={() => toggleBook(bookKey)}
              />
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
