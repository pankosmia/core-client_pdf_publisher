import { getJson, getText } from "pithekos-lib";
import { Proskomma } from "proskomma-core";
export const getBookName = (pk, docSetId, bookCode) => {
  const headers = pk.gqlQuerySync(
    `{docSet(id:"${docSetId}") { document(bookCode:"${bookCode}") {headers {key value}}}}`,
  ).data.docSet.document.headers;
  for (const key of ["toc2", "toc3", "h", "toc"]) {
    const keySearch = headers.filter((h) => h.key === key);
    if (keySearch.length === 1) {
      return keySearch[0].value;
    }
  }
  return bookCode;
};

export const pkWithDocs = async (bookCode, docSpecs, verbose = false) => {
  const pk = new Proskomma();
  verbose && console.log("Loading USFM into Proskomma");
  for (const docSpec of docSpecs) {
    verbose && console.log(`${docSpec.id}`);
    const summary = await getJson(
      `/api/burrito/metadata/summary/${docSpec.path}`,
    );
    if (summary.ok) {
      let matchingBookUsfm = summary.json.book_codes.filter((f) =>
        f.includes(bookCode),
      )[0];
      if (!matchingBookUsfm) {
        throw new Error(
          `No match for bookCode '${bookCode}' in ${docSpec.id} in directory '${docSpec.path}'`,
        );
      }

      const contentString = await getText(
        `/api/burrito/ingredient/raw/${docSpec.path}?ipath=${matchingBookUsfm}.usfm`,
      );

      const [lang, abbr] = docSpec.id.split("_");
      pk.importDocument({ lang, abbr }, "usfm", contentString.text);
    }
  }
  return pk;
};
