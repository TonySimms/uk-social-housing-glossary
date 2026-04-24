let glossaryEntries = [];

fetch("data.json")
  .then(response => response.json())
  .then(data => {
    glossaryEntries = data.entries;
    renderResults(glossaryEntries);
  });

const searchInput = document.getElementById("search");

searchInput.addEventListener("input", event => {
  const query = event.target.value.toLowerCase().trim();

  const filtered = glossaryEntries.filter(entry =>
    [
      entry.term,
      entry.acronym,
      entry.definition,
      entry.operational,
      entry.theme,
      entry.type
    ]
      .join(" ")
      .toLowerCase()
      .includes(query)
  );

  renderResults(filtered);
});

function renderResults(entries) {
  const results = document.getElementById("results");
  results.innerHTML = "";

  if (entries.length === 0) {
    results.innerHTML = "<p>No matching terms found.</p>";
    return;
  }

  entries.forEach(entry => {
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
}
``
