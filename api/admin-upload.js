import Busboy from "busboy";
import XLSX from "xlsx";

/**
 * Commit data.json to GitHub
 */
async function commitToGitHub({ content, message }) {
  const owner = "TonySimms";          // ✅ change if needed
  const repo = "uk-social-housing-glossary";
  const path = "data.json";

  const headers = {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json"
  };

  const get = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers }
  );

  const existing = get.ok ? await get.json() : null;

  const body = {
    message,
    content: Buffer.from(content).toString("base64"),
    ...(existing?.sha && { sha: existing.sha })
  };

  const put = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify(body)
    }
  );

  if (!put.ok) {
    throw new Error(await put.text());
  }
}

export const config = {
  api: {
    bodyParser: false
  }
};

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const bb = Busboy({ headers: req.headers });
  let fileBuffer = null;

  bb.on("file", (_, file) => {
    const chunks = [];
    file.on("data", d => chunks.push(d));
    file.on("end", () => {
      fileBuffer = Buffer.concat(chunks);
    });
  });

  bb.on("finish", async () => {
    try {
      if (!fileBuffer) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const workbook = XLSX.read(fileBuffer);
      const sheet = workbook.Sheets["Public Glossary"];

      if (!sheet) {
        return res
          .status(400)
          .json({ error: "Missing 'Public Glossary' sheet" });
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

      await commitToGitHub({
        content: JSON.stringify(
          { updatedAt: new Date().toISOString(), entries },
          null,
          2
        ),
        message: `Update glossary (${entries.length} terms)`
      });

      res.json({ success: true, count: entries.length });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  req.pipe(bb);
}
