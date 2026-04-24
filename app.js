fetch("data.json")
  .then(response => {
    if (!response.ok) {
      throw new Error("Failed to load data.json");
    }
    return response.json();
  })
  .then(data => {
    const results = document.getElementById("results");
    results.innerHTML = "";

    data.entries.forEach(entry => {
      const item = document.createElement("div");
      item.style.borderLeft = "4px solid #ccc";
      item.style.padding = "0.75rem";
      item.style.marginBottom = "1rem";

      item.innerHTML = `
        <h3>${entry.term}${entry.acronym ? ` (${entry.acronym})` : ""}</h3>
        <small>${entry.theme} · ${entry.type} · UK (All nations)</small>
        <p>${entry.definition}</p>
      `;

      results.appendChild(item);
    });
  })
  .catch(error => {
    document.getElementById("results").innerText =
      "Error loading glossary data.";
    console.error(error);
  });
