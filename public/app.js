const templates = [
  {
    name: "Clientes consultoria LATAM",
    description: "Decisores tecnologicos y operativos en empresas medianas de America Latina.",
    type: "consulting_client",
    region: "latam",
  },
  {
    name: "Inversionistas USA",
    description: "Angels, partners y operadores de inversion con foco venture capital.",
    type: "investor",
    region: "usa",
  },
  {
    name: "Inversionistas LATAM",
    description: "Fondos y personas relevantes en ecosistemas startup de America Latina.",
    type: "investor",
    region: "latam",
  },
  {
    name: "Inversionistas Europa",
    description: "Inversionistas europeos con potencial interes en software, AI, B2B y LatAm.",
    type: "investor",
    region: "europe",
  },
];

const container = document.querySelector("#templates");

container.innerHTML = templates
  .map(
    (template) => `
      <article class="template ${template.type === "investor" ? "investor" : ""}">
        <h3>${template.name}</h3>
        <p>${template.description}</p>
        <span class="tag">${template.type} · ${template.region}</span>
      </article>
    `
  )
  .join("");
