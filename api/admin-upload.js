import fs from "fs";
import XLSX from "xlsx";

export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  try {
    // ✅ Method check
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // ✅ Password check
    const password = req.headers["x-admin-password"];
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // ✅ Read form data (native Web API)
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // ✅ Convert uploaded file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // ✅ Parse Excel
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets["Public Glossary"];

    if (!sheet) {
      return res.status(400).json({
        error: "Missing 'Public Glossary' sheet"
      });
    }

    const rows = XLSX.utils.sheet_to_json(sheet);

    const entries = rows
      .map(r => ({
        term: r["Term"],
        acronym: r["Acronym"] || "",
        theme: r["Theme"] || "",
        type: r["Type"] || "",
        jurisdiction: r["Jurisdiction"] || "",
        definition: r["Plain-English definition"] || "",
        operational: r["Operational use"] || "",
        caution: r["Key caution / dependency"] || "",
        priority: r["Review priority"] || "Low",
        source: r["Source URL"] || ""
      }))
      .filter(e => e.term);

    // ✅ Write data.json
    fs.writeFileSync(
      "data.json",
      JSON.stringify(
        {
          updatedAt: new Date().toISOString(),
          entries
        },
        null,
        2
      )
    );

    return res.json({
      success: true,
      count: entries.length
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Upload failed"
    });
  }
}
``
