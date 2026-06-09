const HIGH_CONSULTING_TITLES = ["ceo", "founder", "co-founder", "cto", "cio", "director", "head", "chief"];
const MID_CONSULTING_TITLES = [
  "manager",
  "technology",
  "operations",
  "digital transformation",
  "innovation",
  "product",
  "ecommerce",
  "data",
  "systems",
];
const HIGH_INVESTOR_TITLES = [
  "angel investor",
  "venture capital investor",
  "managing partner",
  "general partner",
  "founding partner",
  "venture partner",
  "investment partner",
  "fund manager",
];
const MID_INVESTOR_TITLES = ["principal", "investment director", "investment manager", "associate", "startup advisor"];
const PRIORITY_CONSULTING_COUNTRIES = ["colombia", "mexico", "chile", "peru", "ecuador", "panama", "costa rica"];
const PRIORITY_INVESTOR_COUNTRIES = [
  "united states",
  "colombia",
  "mexico",
  "brazil",
  "chile",
  "argentina",
  "peru",
  "uruguay",
  "panama",
  "spain",
  "united kingdom",
  "germany",
  "france",
  "netherlands",
  "switzerland",
  "portugal",
];

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function label(score) {
  if (score >= 75) return "hot";
  if (score >= 45) return "warm";
  if (score >= 20) return "cold";
  return "unqualified";
}

function add(reasons, points, reason) {
  reasons.push({ points, reason });
  return points;
}

function scoreLead({ leadType, title, country, linkedinUrl, organization }) {
  let score = 0;
  const reasons = [];
  const normalizedTitle = normalize(title);
  const normalizedCountry = normalize(country);
  const orgText = normalize(
    [organization?.name, organization?.industry, organization?.website_url, organization?.primary_domain, organization?.short_description]
      .filter(Boolean)
      .join(" ")
  );

  if (["intern", "assistant", "junior", "student", "recruiter"].some((item) => normalizedTitle.includes(item))) {
    score += add(reasons, -10, "Cargo de baja prioridad");
  }

  if (leadType === "consulting_client") {
    if (HIGH_CONSULTING_TITLES.some((item) => normalizedTitle.includes(item))) {
      score += add(reasons, 25, "Cargo decisor para consultoria");
    } else if (MID_CONSULTING_TITLES.some((item) => normalizedTitle.includes(item))) {
      score += add(reasons, 15, "Cargo operativo o tecnico relevante");
    }

    if (PRIORITY_CONSULTING_COUNTRIES.includes(normalizedCountry)) {
      score += add(reasons, 15, "Pais prioritario para consultoria");
    }
  }

  if (leadType === "investor") {
    if (HIGH_INVESTOR_TITLES.some((item) => normalizedTitle.includes(item))) {
      score += add(reasons, 30, "Cargo senior de inversion");
    } else if (MID_INVESTOR_TITLES.some((item) => normalizedTitle.includes(item))) {
      score += add(reasons, 18, "Cargo de screening o gestion de inversion");
    }

    if (PRIORITY_INVESTOR_COUNTRIES.includes(normalizedCountry)) {
      score += add(reasons, 12, "Pais objetivo para inversionistas");
    }

    if (["venture", "capital", "investor", "angel", "fund", "startup", "saas", "b2b", "ai"].some((item) => orgText.includes(item))) {
      score += add(reasons, 18, "Contexto alineado con inversion y tecnologia");
    }
  }

  if (linkedinUrl) score += add(reasons, 10, "LinkedIn disponible");
  if (organization?.website_url || organization?.primary_domain) score += add(reasons, 5, "Sitio web o dominio disponible");
  if (organization?.linkedin_url) score += add(reasons, 5, "LinkedIn de empresa disponible");

  const finalScore = Math.max(0, Math.min(score, 100));
  return { score: finalScore, score_label: label(finalScore), score_reasons: reasons };
}

module.exports = { scoreLead };
