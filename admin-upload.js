import formidable from "formidable";
import fs from "fs";
import XLSX from "xlsx";

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  // 1. Check method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 2. Check admin password
  const adminPassword = req.headers["x-admin-password"];
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 3. Parse form
  const form = formidable();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Upload failed" });
    }

    const file = files.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      // 4. Read Excel
      const workbook = XLSX.readFile(file.filepath);
      const sheet = workbook.Sheets["Public Glossary"];

      if (!sheet) {
        throw new Error("Missing 'Public Glossary' sheet");
      }

      const rows = XLSX.utils.sheet_to_json(sheet);

      // 5. Map rows to glossary entries
      const entries = rows.map(r => ({
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
      })).filter(e => e.term);

      // 6. Write new data.json
      const output = {
        updatedAt: new Date().toISOString(),
        entries
      };

      fs.writeFileSync("data.json", JSON.stringify(output, null, 2));

      res.json({
        success: true,
        count: entries.length
      });

    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
}
``
