let glossaryEntries = [];

fetch("data.json")
  .then(res => res.json())
  .then(data => {
    glossaryEntries = data.entries;
    renderResults(glossaryEntries);
  });

const searchInput = document.getElementById("search");

searchInput.addEventListener("input", e => {
  const q = e.target.value.toLowerCase().trim();

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
      .includes(q)
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
    const card = document.createElement("div");
    card.className = "card";
    card.style.borderLeftColor = priorityColour(entry.priority);

    card.innerHTML = `
      <h3>
        ${entry.term}${entry.acronym ? ` (${entry.acronym})` : ""}
        ${priorityBadge(entry.priority)}
      </h3>

      <div class="meta">
        ${entry.theme} · ${entry.type} · UK (All nations)
      </div>

      <p>${entry.definition}</p>

      <details>
        <summary>Operational use</summary>
        <p>${entry.operational || "No operational guidance provided."}</p>
      </details>

      ${
        entry.caution
          ? `<div class="caution"><strong>Key caution:</strong> ${entry.caution}</div>`
          : ""
      }
    `;

    results.appendChild(card);
  });
}

function priorityBadge(priority) {
  const p = priority.toLowerCase();
  return `<span class="badge ${p}">${priority}</span>`;
}

function priorityColour(priority) {
  switch (priority.toLowerCase()) {
    case "high":
      return "#d97706";
    case "medium":
      return "#f59e0b";
    default:
      return "#9ca3af";
  }
}
