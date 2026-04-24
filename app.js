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

  if (!q) {
    renderResults(glossaryEntries);
    return;
  }

  const scored = glossaryEntries
    .map(entry => {
      let score = 0;

      const term = entry.term.toLowerCase();
      const acronym = (entry.acronym || "").toLowerCase();
      const theme = entry.theme.toLowerCase();
      const type = entry.type.toLowerCase();
      const definition = entry.definition.toLowerCase();

      // Strongest matches
      if (term.startsWith(q)) score += 100;
      else if (term.includes(q)) score += 70;

      if (acronym === q) score += 60;
      else if (acronym.includes(q)) score += 40;

      // Weaker but still relevant
      if (theme.includes(q)) score += 20;
      if (type.includes(q)) score += 15;
      if (definition.includes(q)) score += 10;

      return { entry, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.entry);

  renderResults(scored);
});

});
``
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
