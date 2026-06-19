import { useEffect, useState } from "react";
import { Modal } from "@mui/material";
import Layout from "../icons/basil/Solid/Interface/Layout";
import { TextOnlyTooltip, LoopSwitch } from "../fieldPicker/customMuiComponent";
import { BookList } from "../BookList";

export function BCVWrapperSortableList({
  keyWrapper,
  advanceMode,
  changePrintData,
  setLoopMode,
  loopMode,
  projectInfo,
}) {
  // Start get all book from current project
  // const initialBook = 'mat';
  const initialChapter = "1";
  const initialVerse = "1";

  const canonList = [
    {
      id: 1,
      title: "All Books",
      currentScope: [
        "GEN",
        "EXO",
        "LEV",
        "NUM",
        "DEU",
        "JOS",
        "JDG",
        "RUT",
        "1SA",
        "2SA",
        "1KI",
        "2KI",
        "1CH",
        "2CH",
        "EZR",
        "NEH",
        "EST",
        "JOB",
        "PSA",
        "PRO",
        "ECC",
        "SNG",
        "ISA",
        "JER",
        "LAM",
        "EZK",
        "DAN",
        "HOS",
        "JOL",
        "AMO",
        "OBA",
        "JON",
        "MIC",
        "NAM",
        "HAB",
        "ZEP",
        "HAG",
        "ZEC",
        "MAL",
        "MAT",
        "MRK",
        "LUK",
        "JHN",
        "ACT",
        "ROM",
        "1CO",
        "2CO",
        "GAL",
        "EPH",
        "PHP",
        "COL",
        "1TH",
        "2TH",
        "1TI",
        "2TI",
        "TIT",
        "PHM",
        "HEB",
        "JAS",
        "1PE",
        "2PE",
        "1JN",
        "2JN",
        "3JN",
        "JUD",
        "REV",
      ],
      locked: true,
    },
    {
      id: 2,
      title: "Old Testament (OT)",
      currentScope: [
        "GEN",
        "EXO",
        "LEV",
        "NUM",
        "DEU",
        "JOS",
        "JDG",
        "RUT",
        "1SA",
        "2SA",
        "1KI",
        "2KI",
        "1CH",
        "2CH",
        "EZR",
        "NEH",
        "EST",
        "JOB",
        "PSA",
        "PRO",
        "ECC",
        "SNG",
        "ISA",
        "JER",
        "LAM",
        "EZK",
        "DAN",
        "HOS",
        "JOL",
        "AMO",
        "OBA",
        "JON",
        "MIC",
        "NAM",
        "HAB",
        "ZEP",
        "HAG",
        "ZEC",
        "MAL",
      ],
      locked: true,
    },
    {
      id: 3,
      title: "New Testament (NT)",
      currentScope: [
        "MAT",
        "MRK",
        "LUK",
        "JHN",
        "ACT",
        "ROM",
        "1CO",
        "2CO",
        "GAL",
        "EPH",
        "PHP",
        "COL",
        "1TH",
        "2TH",
        "1TI",
        "2TI",
        "TIT",
        "PHM",
        "HEB",
        "JAS",
        "1PE",
        "2PE",
        "1JN",
        "2JN",
        "3JN",
        "JUD",
        "REV",
      ],
      locked: true,
    },
  ];
  // end get all book from current project
  const [selectedBooks, setSelectedBooks] = useState(
    projectInfo?.bookId ? projectInfo.map((e) => e.toUpperCase()) : [],
  );
  const [openModalBook, setOpenModalBook] = useState(false);

  useEffect(() => {
    changePrintData((prev) => {
      const copyData = { ...prev };
      copyData[keyWrapper].ranges = [];
      copyData[keyWrapper].ranges = selectedBooks;
      return copyData;
    });
  }, [selectedBooks.length]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "left" }}>
        {advanceMode ? (
          <div>
            <TextOnlyTooltip
              placement="top-end"
              title={
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontStyle: "normal",
                      fontWeight: 600,
                    }}
                  >
                    Loop mode
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontStyle: "normal",
                      fontWeight: 400,
                    }}
                  >
                    Projects in the loop are added one by one to the document,
                    for each book selected below.
                  </div>
                </div>
              }
              arrow
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "black",
                }}
              >
                Loop mode
              </div>
              <LoopSwitch
                defaultChecked={loopMode}
                onChange={() => setLoopMode((prev) => !prev)}
              />
            </TextOnlyTooltip>
          </div>
        ) : (
          <div />
        )}
        <div
          style={{
            margin: "auto",
            display: "flex",
            justifyContent: "left",
            alignItems: "center", // Added alignment to center vertically
            fontSize: 20,
            color: "black",
          }}
        >
          <div style={{ width: 18, height: 18, marginRight: 8 }}>
            <Layout />
          </div>
          Translation
        </div>
      </div>

      <div className="py-5 flex flex-wrap gap-3 uppercase text-sm font-medium ">
        <div
          className={
            selectedBooks.length === canonList[0].currentScope.length
              ? "bg-primary hover:bg-secondary text-white px-3 py-1 rounded-full cursor-pointer whitespace-nowrap"
              : "bg-gray-200 hover:bg-primary hover:text-white px-3 py-1 rounded-full cursor-pointer whitespace-nowrap"
          }
          onClick={() => {
            setSelectedBooks((prev) => {
              let table = [...prev];
              const newTable = canonList[0].currentScope;
              for (let i = 0; i < newTable.length; i++) {
                if (table.includes(newTable[i])) {
                  table = table.filter((item) => item !== newTable[i]);
                } else {
                  table.push(newTable[i]);
                }
              }
              return table;
            });
          }}
          role="button"
          tabIndex="0"
        >
          {"label-all"}
        </div>
        <div
          className={
            selectedBooks.sort().toString() ===
            canonList[1].currentScope.sort().toString()
              ? "bg-primary hover:bg-secondary text-white px-3 py-1 rounded-full cursor-pointer whitespace-nowrap"
              : "bg-gray-200 hover:bg-primary hover:text-white px-3 py-1 rounded-full cursor-pointer whitespace-nowrap"
          }
          onClick={() => {
            setSelectedBooks((prev) => {
              let table = [...prev];
              const newTable = canonList[1].currentScope;
              for (let i = 0; i < newTable.length; i++) {
                if (table.includes(newTable[i])) {
                  table = table.filter((item) => item !== newTable[i]);
                } else {
                  table.push(newTable[i]);
                }
              }
              return table;
            });
          }}
          role="button"
          aria-label="old-testament"
          tabIndex="0"
        >
          {`'label-old-testament')} (OT)`}
        </div>
        <div
          className={
            selectedBooks.sort().toString() ===
            canonList[2].currentScope.sort().toString()
              ? "bg-primary hover:bg-secondary text-white px-3 py-1 rounded-full cursor-pointer whitespace-nowrap"
              : "bg-gray-200 hover:bg-primary hover:text-white px-3 py-1 rounded-full cursor-pointer whitespace-nowrap"
          }
          onClick={() => {
            setSelectedBooks((prev) => {
              let table = [...prev];
              const newTable = canonList[2].currentScope;
              for (let i = 0; i < newTable.length; i++) {
                if (table.includes(newTable[i])) {
                  table = table.filter((item) => item !== newTable[i]);
                } else {
                  table.push(newTable[i]);
                }
              }
              return table;
            });
          }}
          role="button"
          aria-label="new-testament"
          tabIndex="0"
        >
          {`'label-new-testament')} (NT)`}
        </div>
        <div
          className={
            selectedBooks.length > 0 &&
            selectedBooks.length < canonList[0].currentScope.length &&
            selectedBooks.sort().toString() !==
              canonList[2].currentScope.sort().toString() &&
            selectedBooks.sort().toString() !==
              canonList[1].currentScope.sort().toString()
              ? "bg-primary hover:bg-secondary text-white px-3 py-1 rounded-full cursor-pointer whitespace-nowrap"
              : "bg-gray-200 hover:bg-primary hover:text-white px-3 py-1 rounded-full cursor-pointer whitespace-nowrap"
          }
          onClick={() => setOpenModalBook(true)}
          role="button"
          tabIndex="0"
          aria-label="custom-book"
        >
          {"label-custom"}
        </div>
        <br />
      </div>
      <BookList books={selectedBooks ?? []} />
      <br />

      <Modal
        open={openModalBook}
        onClose={() => setOpenModalBook(false)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
        }}
      >
        <div style={{ height: "100%", width: "100%" }}>
          <div className="flex items-center justify-center h-screen ">
            <div className="w-9/12 m-auto z-50 bg-white shadow overflow-hidden sm:rounded-lg"></div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
