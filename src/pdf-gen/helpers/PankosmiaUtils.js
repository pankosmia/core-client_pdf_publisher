export async function toTemp(html) {
  const blob = new Blob([html], { type: "text/html" });

  // 2. Create FormData
  const formData = new FormData();

  // IMPORTANT: field name must match backend (likely "file")
  formData.append("file", blob, "test.html");
  try {
    const response = await fetch("/api/temp/bytes", {
      method: "POST",
      body: formData,
    });

    const result = await response.text();
    const { uuid } = JSON.parse(result);
    return uuid;
  } catch (err) {
    console.error("Upload failed:", err);
  }
}
export async function pdfToTemp(pdf) {
  // pdf can be a Blob, File, or ArrayBuffer

  const blob =
    pdf instanceof Blob ? pdf : new Blob([pdf], { type: "application/pdf" });

  const formData = new FormData();

  formData.append("file", blob, "file.pdf");

  try {
    const response = await fetch("/api/temp/bytes", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    return result.uuid;
  } catch (err) {
    console.error("PDF upload failed:", err);
  }
}
export async function getCssFromLookUp(cssLookUp, styleName) {
  return await (
    await fetch(`/api/temp/bytes/${cssLookUp[styleName]}`, {
      method: "GET",
    })
  ).text();
}
