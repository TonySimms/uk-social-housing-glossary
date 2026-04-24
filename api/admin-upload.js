import XLSX from "xlsx";

/**
 * Helper: commit data.json to GitHub
 */
async function commitToGitHub({ content, message }) {
  const owner = "TonySimms"; // 🔴 CHANGE if different
  const repo = "uk-social-housing-glossary";
  const path = "data.json";

  const apiBase = "https://api.github.com";
  const headers = {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    "Accept": "application/vnd.github+json"
  };

  // Get current file SHA (if exists)
  const getRes = await fetch(
    `${apiBase}/repos/${owner}/${repo}/contents/${path}`,
    { headers }
  );

  const existing = getRes.ok ? await getRes.json() : null;

  const body = {
    message,
    content: Buffer.from(content).toString("base64"),
    ...(existing?.sha && { sha: existing.sha })
  };

  const putRes = await fetch(
    `${apiBase}/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify(body)
    }
  );

  if (!putRes.ok) {
    const err = await putRes.text();
    throw new Error("GitHub commit failed: " + err);
  }
}

export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  try {
    // Method
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Password check
    if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Read upload
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Parse Excel
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

    const json = JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        entries
      },
      null,
      2
    );

    // Commit to GitHub
    await commitToGitHub({
      content: json,
      message: `Update glossary (${entries.length} terms)`
    });

    return res.json({
      success: true,
      count: entries.length
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
``
