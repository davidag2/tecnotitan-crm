PRIORITY_CONSULTING_COUNTRIES = (
    "colombia",
    "mexico",
    "chile",
    "peru",
    "ecuador",
    "panama",
    "costa rica",
)

SECONDARY_CONSULTING_COUNTRIES = (
    "argentina",
    "uruguay",
    "dominican republic",
    "brazil",
    "guatemala",
    "el salvador",
    "honduras",
    "paraguay",
    "bolivia",
)

PRIORITY_CONSULTING_INDUSTRIES = (
    "ecommerce",
    "retail",
    "logistics",
    "healthcare",
    "education",
    "financial services",
    "real estate",
    "construction",
    "manufacturing",
    "professional services",
    "saas",
    "technology",
    "hospitality",
    "insurance",
    "agriculture",
)

TECH_SIGNAL_KEYWORDS = (
    "software",
    "technology",
    "digital",
    "automation",
    "data",
    "systems",
    "ecommerce",
    "crm",
    "ai",
    "intelligence",
)

PRIORITY_INVESTOR_COUNTRIES = (
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
)

INVESTOR_CONTEXT_KEYWORDS = (
    "venture",
    "capital",
    "vc",
    "investment",
    "investor",
    "angel",
    "fund",
    "family office",
    "accelerator",
    "startup",
    "ventures",
    "studio",
)

INVESTOR_THESIS_KEYWORDS = (
    "software",
    "saas",
    "b2b",
    "ai",
    "artificial intelligence",
    "automation",
    "data",
    "enterprise",
    "emerging markets",
    "latin america",
    "latam",
    "fintech",
    "productivity",
    "digital transformation",
)

HIGH_CONSULTING_TITLES = (
    "ceo",
    "founder",
    "co-founder",
    "cto",
    "cio",
    "director",
    "head",
    "chief",
)

MID_CONSULTING_TITLES = (
    "manager",
    "technology",
    "operations",
    "digital transformation",
    "innovation",
    "product",
    "ecommerce",
    "data",
    "systems",
)

HIGH_INVESTOR_TITLES = (
    "angel investor",
    "venture capital investor",
    "managing partner",
    "general partner",
    "founding partner",
    "venture partner",
    "investment partner",
    "fund manager",
)

MID_INVESTOR_TITLES = (
    "principal",
    "investment director",
    "investment manager",
    "associate",
    "startup advisor",
    "head of investments",
)

LOW_VALUE_TITLES = ("intern", "assistant", "junior", "student", "recruiter")


def score_label(score: int) -> str:
    if score >= 75:
        return "hot"
    if score >= 45:
        return "warm"
    if score >= 20:
        return "cold"
    return "unqualified"


def add_score(reasons: list[dict[str, object]], points: int, reason: str) -> int:
    reasons.append({"points": points, "reason": reason})
    return points


def normalize(value: object) -> str:
    return str(value or "").strip().lower()


def employee_count_from_organization(organization: dict[str, object] | None) -> int | None:
    if not organization:
        return None

    value = organization.get("estimated_num_employees") or organization.get("employee_count")
    try:
        return int(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def score_lead(
    lead_type: str,
    title: str | None,
    country: str | None,
    linkedin_url: str | None,
    organization: dict[str, object] | None = None,
) -> dict[str, object]:
    score = 0
    reasons: list[dict[str, object]] = []
    normalized_title = normalize(title)
    normalized_country = normalize(country)

    if any(token in normalized_title for token in LOW_VALUE_TITLES):
        score += add_score(reasons, -10, "Cargo de baja prioridad")

    if lead_type == "consulting_client":
        score += score_consulting_title(reasons, normalized_title)
        score += score_consulting_country(reasons, normalized_country)
        score += score_consulting_organization(reasons, organization)
    elif lead_type == "investor":
        score += score_investor_title(reasons, normalized_title)
        score += score_investor_country(reasons, normalized_country)
        score += score_investor_organization(reasons, organization)

    if linkedin_url:
        score += add_score(reasons, 10, "LinkedIn disponible")

    final_score = max(min(score, 100), 0)
    return {
        "score": final_score,
        "score_label": score_label(final_score),
        "score_reasons": reasons,
    }


def score_consulting_title(reasons: list[dict[str, object]], normalized_title: str) -> int:
    if any(token in normalized_title for token in HIGH_CONSULTING_TITLES):
        return add_score(reasons, 25, "Cargo decisor para consultoria")

    if any(token in normalized_title for token in MID_CONSULTING_TITLES):
        return add_score(reasons, 15, "Cargo operativo o tecnico relevante")

    return 0


def score_consulting_country(reasons: list[dict[str, object]], normalized_country: str) -> int:
    if not normalized_country:
        return 0

    if normalized_country in PRIORITY_CONSULTING_COUNTRIES:
        return add_score(reasons, 15, "Pais prioritario para consultoria")

    if normalized_country in SECONDARY_CONSULTING_COUNTRIES:
        return add_score(reasons, 8, "Pais secundario para consultoria")

    return add_score(reasons, 3, "Ubicacion disponible")


def score_consulting_organization(reasons: list[dict[str, object]], organization: dict[str, object] | None) -> int:
    if not organization:
        return 0

    score = 0
    industry = normalize(organization.get("industry"))
    name = normalize(organization.get("name"))
    website = normalize(organization.get("website_url") or organization.get("primary_domain"))
    linkedin_url = normalize(organization.get("linkedin_url"))
    employee_count = employee_count_from_organization(organization)
    searchable_text = " ".join([industry, name, website])

    if any(industry_token in industry for industry_token in PRIORITY_CONSULTING_INDUSTRIES):
        score += add_score(reasons, 15, "Industria prioritaria para consultoria")

    if employee_count is not None:
        if 20 <= employee_count <= 200:
            score += add_score(reasons, 15, "Tamano ideal de empresa 20-200 empleados")
        elif 201 <= employee_count <= 500:
            score += add_score(reasons, 12, "Tamano fuerte de empresa 201-500 empleados")
        elif 501 <= employee_count <= 1000:
            score += add_score(reasons, 8, "Empresa grande con potencial 501-1000 empleados")
        elif employee_count < 20:
            score += add_score(reasons, -8, "Empresa muy pequena para el ICP inicial")

    if website:
        score += add_score(reasons, 5, "Sitio web o dominio disponible")

    if linkedin_url:
        score += add_score(reasons, 5, "LinkedIn de empresa disponible")

    if any(token in searchable_text for token in TECH_SIGNAL_KEYWORDS):
        score += add_score(reasons, 10, "Senales tecnologicas o digitales")

    return score


def score_investor_title(reasons: list[dict[str, object]], normalized_title: str) -> int:
    if any(token in normalized_title for token in HIGH_INVESTOR_TITLES):
        return add_score(reasons, 30, "Cargo senior de inversion")

    if any(token in normalized_title for token in MID_INVESTOR_TITLES):
        return add_score(reasons, 18, "Cargo de screening o gestion de inversion")

    if "advisor" in normalized_title or "mentor" in normalized_title:
        return add_score(reasons, 8, "Cargo exploratorio con acceso potencial a red")

    return 0


def score_investor_country(reasons: list[dict[str, object]], normalized_country: str) -> int:
    if not normalized_country:
        return 0

    if normalized_country in PRIORITY_INVESTOR_COUNTRIES:
        return add_score(reasons, 12, "Pais objetivo para inversionistas")

    return add_score(reasons, 3, "Ubicacion disponible")


def score_investor_organization(reasons: list[dict[str, object]], organization: dict[str, object] | None) -> int:
    if not organization:
        return 0

    score = 0
    name = normalize(organization.get("name"))
    industry = normalize(organization.get("industry"))
    website = normalize(organization.get("website_url") or organization.get("primary_domain"))
    linkedin_url = normalize(organization.get("linkedin_url"))
    keywords = normalize(organization.get("keywords"))
    short_description = normalize(organization.get("short_description"))
    searchable_text = " ".join([name, industry, website, keywords, short_description])

    if any(token in searchable_text for token in INVESTOR_CONTEXT_KEYWORDS):
        score += add_score(reasons, 18, "Contexto de fondo, venture, startup o inversion")

    if any(token in searchable_text for token in INVESTOR_THESIS_KEYWORDS):
        score += add_score(reasons, 15, "Tesis potencial alineada con Tecnotitan")

    if website:
        score += add_score(reasons, 5, "Sitio web o dominio disponible")

    if linkedin_url:
        score += add_score(reasons, 5, "LinkedIn de firma disponible")

    return score
