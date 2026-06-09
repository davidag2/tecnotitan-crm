const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const PSQL_PATH = "C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe";

function loadEnv() {
  const candidates = [
    path.join(path.dirname(process.execPath), ".env"),
    path.join(process.cwd(), ".env"),
    path.join(ROOT, ".env"),
  ];
  const envPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!envPath) return {};

  const env = {};
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...parts] = line.split("=");
    env[key.trim()] = parts.join("=").trim().replace(/^['"]|['"]$/g, "");
  }

  return env;
}

function parseDatabaseUrl(databaseUrl) {
  const parsed = new URL(databaseUrl);
  const databaseName = parsed.pathname.replace(/^\//, "");
  if (databaseName === "copiloto_pyme") {
    throw new Error("DATABASE_URL apunta a copiloto_pyme. No se permite tocar esa base.");
  }

  return {
    host: parsed.hostname || "127.0.0.1",
    port: parsed.port || "5432",
    user: decodeURIComponent(parsed.username || "postgres"),
    password: decodeURIComponent(parsed.password || ""),
    database: databaseName,
  };
}

function sqlLiteral(value) {
  if (value === null || value === undefined || value === "") return "NULL";
  if (typeof value !== "string") value = JSON.stringify(value);
  return `'${String(value).replace(/\u0000/g, "").replace(/'/g, "''")}'`;
}

function dbQuery(sql) {
  const env = loadEnv();
  const db = parseDatabaseUrl(env.DATABASE_URL);
  const result = spawnSync(
    PSQL_PATH,
    ["-h", db.host, "-p", db.port, "-U", db.user, "-d", db.database, "-v", "ON_ERROR_STOP=1", "-q", "-t", "-A"],
    {
      input: sql,
      encoding: "utf8",
      env: { ...process.env, PGPASSWORD: db.password, PGCLIENTENCODING: "UTF8" },
    }
  );

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || result.stdout.trim() || "Error de PostgreSQL");
  }

  const output = result.stdout.trim();
  return output ? JSON.parse(output) : null;
}

const searchTemplates = {
  "consulting_client:latam": {
    key: "consulting_client:latam",
    name: "Clientes consultoria LATAM",
    lead_type: "consulting_client",
    target_region: "latam",
    default_per_page: 10,
    editable_filters: ["person_locations", "q_keywords"],
    apollo_payload: {
      person_locations: ["Colombia", "Mexico", "Chile", "Peru", "Ecuador", "Panama", "Costa Rica"],
      organization_num_employees_ranges: ["20,200", "201,500", "501,1000"],
      person_titles: [
        "CEO",
        "Founder",
        "CTO",
        "CIO",
        "Head of Technology",
        "IT Director",
        "Operations Director",
        "IT Manager",
        "Digital Transformation Manager"
      ]
    }
  },
  "investor:usa": {
    key: "investor:usa",
    name: "Inversionistas USA",
    lead_type: "investor",
    target_region: "usa",
    default_per_page: 10,
    editable_filters: ["person_locations", "q_keywords"],
    apollo_payload: {
      person_locations: ["United States"],
      person_titles: ["Angel Investor", "Managing Partner", "General Partner", "Venture Partner", "Principal", "Investment Manager"],
      q_keywords: "venture capital"
    }
  },
  "investor:latam": {
    key: "investor:latam",
    name: "Inversionistas LATAM",
    lead_type: "investor",
    target_region: "latam",
    default_per_page: 10,
    editable_filters: ["person_locations", "q_keywords"],
    apollo_payload: {
      person_locations: ["Colombia", "Mexico", "Brazil", "Chile", "Argentina", "Peru", "Uruguay", "Panama"],
      person_titles: ["Angel Investor", "Investor", "Managing Partner", "Partner", "Principal", "Investment Manager"],
      q_keywords: "venture capital"
    }
  },
  "investor:europe": {
    key: "investor:europe",
    name: "Inversionistas Europa",
    lead_type: "investor",
    target_region: "europe",
    default_per_page: 10,
    editable_filters: ["person_locations", "q_keywords"],
    apollo_payload: {
      person_locations: ["Spain", "United Kingdom", "Germany", "France", "Netherlands", "Switzerland", "Portugal"],
      person_titles: ["Angel Investor", "Managing Partner", "General Partner", "Venture Partner", "Principal", "Investment Manager"],
      q_keywords: "venture capital"
    }
  }
};

function titleScore(leadType, title, organizationName) {
  const text = `${title || ""} ${organizationName || ""}`.toLowerCase();
  const reasons = [];
  let score = 0;

  if (leadType === "investor") {
    if (["angel investor", "venture capital investor", "managing partner", "general partner", "venture partner", "fund manager"].some((token) => text.includes(token))) {
      score += 30;
      reasons.push({ points: 30, reason: "Cargo senior de inversion" });
    } else if (["principal", "investment manager", "investment director", "associate"].some((token) => text.includes(token))) {
      score += 18;
      reasons.push({ points: 18, reason: "Cargo de screening o gestion de inversion" });
    }

    if (["venture", "capital", "fund", "investor", "startup"].some((token) => text.includes(token))) {
      score += 18;
      reasons.push({ points: 18, reason: "Contexto de fondo, venture, startup o inversion" });
    }
  } else {
    if (["ceo", "founder", "cto", "cio", "director", "head", "chief"].some((token) => text.includes(token))) {
      score += 25;
      reasons.push({ points: 25, reason: "Cargo decisor para consultoria" });
    } else if (["manager", "technology", "operations", "digital", "systems"].some((token) => text.includes(token))) {
      score += 15;
      reasons.push({ points: 15, reason: "Cargo operativo o tecnico relevante" });
    }
  }

  const scoreLabel = score >= 75 ? "hot" : score >= 45 ? "warm" : score >= 20 ? "cold" : "unqualified";
  return { score, scoreLabel, reasons };
}

function dashboardSummary() {
  return dbQuery(`
    SELECT json_build_object(
      'total_opportunities', (SELECT count(*) FROM opportunities WHERE deleted_at IS NULL),
      'consulting_opportunities', (SELECT count(*) FROM opportunities WHERE deleted_at IS NULL AND lead_type = 'consulting_client'),
      'investor_opportunities', (SELECT count(*) FROM opportunities WHERE deleted_at IS NULL AND lead_type = 'investor'),
      'priority_leads', (SELECT count(*) FROM opportunities WHERE deleted_at IS NULL AND score_label IN ('hot', 'warm')),
      'searches', (SELECT count(*) FROM lead_searches)
    );
  `);
}

function listLeads() {
  return dbQuery(`
    SELECT COALESCE(json_agg(row_to_json(rows)), '[]'::json)
    FROM (
      SELECT
        contacts.full_name,
        contacts.title,
        companies.name AS company_name,
        opportunities.lead_type,
        opportunities.target_region,
        opportunities.pipeline_status,
        opportunities.score,
        opportunities.score_label,
        opportunities.created_at
      FROM opportunities
      JOIN contacts ON contacts.id = opportunities.contact_id
      LEFT JOIN companies ON companies.id = opportunities.company_id
      WHERE opportunities.deleted_at IS NULL
      ORDER BY opportunities.created_at DESC
      LIMIT 100
    ) rows;
  `);
}

async function apolloSearch(input) {
  const env = loadEnv();
  const apiKey = env.APOLLO_API_KEY;
  if (!apiKey) throw new Error("APOLLO_API_KEY no esta configurada.");

  const template = searchTemplates[input.template_key];
  if (!template) throw new Error("Plantilla no encontrada.");

  const payload = { ...template.apollo_payload, page: 1, per_page: Number(input.per_page || 5) };
  if (input.location) payload.person_locations = input.location.split(",").map((item) => item.trim()).filter(Boolean);
  if (input.keywords && template.editable_filters.includes("q_keywords")) payload.q_keywords = input.keywords;

  const response = await fetch("https://api.apollo.io/api/v1/mixed_people/api_search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Error Apollo");

  const leadSearchId = createLeadSearch(template, payload, data.total_entries);
  const saved = [];
  for (const person of data.people || []) {
    saved.push(savePerson(template, person, leadSearchId));
  }

  return { total_entries: data.total_entries || 0, returned: (data.people || []).length, saved: saved.length };
}

function createLeadSearch(template, filters, totalEntries) {
  return dbQuery(`
    INSERT INTO lead_searches (name, lead_type, target_region, search_template, filters, status, total_entries, pages_requested)
    VALUES (
      ${sqlLiteral(`Desktop ${template.name}`)},
      ${sqlLiteral(template.lead_type)}::lead_type,
      ${sqlLiteral(template.target_region)}::target_region,
      ${sqlLiteral(template.key)},
      ${sqlLiteral(filters)}::jsonb,
      'completed',
      ${sqlLiteral(totalEntries)}::integer,
      1
    )
    RETURNING to_json(id);
  `);
}

function savePerson(template, person, leadSearchId) {
  const organization = person.organization || {};
  const firstName = person.first_name || null;
  const lastName = person.last_name || person.last_name_obfuscated || null;
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || null;
  const scoring = titleScore(template.lead_type, person.title, organization.name);
  const pipeline = template.lead_type === "investor" ? "identified" : "new";

  return dbQuery(`
    WITH existing_company AS (
      SELECT id
      FROM companies
      WHERE deleted_at IS NULL
        AND (
          (${sqlLiteral(organization.id)} IS NOT NULL AND apollo_organization_id = ${sqlLiteral(organization.id)})
          OR (${sqlLiteral(organization.primary_domain || organization.website_url)} IS NOT NULL AND lower(trim(domain)) = lower(trim(${sqlLiteral(organization.primary_domain || organization.website_url)})))
          OR (${sqlLiteral(organization.primary_domain || organization.website_url)} IS NULL AND lower(trim(name)) = lower(trim(COALESCE(${sqlLiteral(organization.name)}, 'Unknown company'))) AND coalesce(lower(trim(country)), '') = coalesce(lower(trim(${sqlLiteral(organization.country)})), ''))
        )
      ORDER BY created_at
      LIMIT 1
    ),
    updated_company AS (
      UPDATE companies
      SET
        apollo_organization_id = COALESCE(companies.apollo_organization_id, ${sqlLiteral(organization.id)}),
        name = COALESCE(${sqlLiteral(organization.name)}, companies.name),
        domain = COALESCE(${sqlLiteral(organization.primary_domain || organization.website_url)}, companies.domain),
        website_url = COALESCE(${sqlLiteral(organization.website_url)}, companies.website_url),
        industry = COALESCE(${sqlLiteral(organization.industry)}, companies.industry),
        country = COALESCE(${sqlLiteral(organization.country)}, companies.country),
        raw_payload = ${sqlLiteral(organization)}::jsonb,
        updated_at = now()
      WHERE id = (SELECT id FROM existing_company)
      RETURNING id
    ),
    inserted_company AS (
      INSERT INTO companies (apollo_organization_id, name, domain, website_url, industry, country, raw_payload, updated_at)
      SELECT
        ${sqlLiteral(organization.id)},
        COALESCE(${sqlLiteral(organization.name)}, 'Unknown company'),
        ${sqlLiteral(organization.primary_domain || organization.website_url)},
        ${sqlLiteral(organization.website_url)},
        ${sqlLiteral(organization.industry)},
        ${sqlLiteral(organization.country)},
        ${sqlLiteral(organization)}::jsonb,
        now()
      WHERE NOT EXISTS (SELECT 1 FROM updated_company)
      RETURNING id
    ),
    company AS (
      SELECT id FROM updated_company
      UNION ALL
      SELECT id FROM inserted_company
      LIMIT 1
    ),
    contact AS (
      INSERT INTO contacts (company_id, apollo_person_id, first_name, last_name, full_name, title, email, linkedin_url, country, lead_source, apollo_raw_payload, apollo_last_synced_at, updated_at)
      SELECT id, ${sqlLiteral(person.id)}, ${sqlLiteral(firstName)}, ${sqlLiteral(lastName)}, ${sqlLiteral(fullName)}, ${sqlLiteral(person.title)}, ${sqlLiteral(person.email)}, ${sqlLiteral(person.linkedin_url)}, ${sqlLiteral(person.country)}, 'apollo', ${sqlLiteral(person)}::jsonb, now(), now()
      FROM company
      ON CONFLICT (apollo_person_id) DO UPDATE SET title = COALESCE(EXCLUDED.title, contacts.title), updated_at = now(), apollo_last_synced_at = now()
      RETURNING id
    ),
    opportunity AS (
      INSERT INTO opportunities (contact_id, company_id, lead_type, target_region, pipeline_status, score, score_label, score_reasons, updated_at)
      SELECT contact.id, company.id, ${sqlLiteral(template.lead_type)}::lead_type, ${sqlLiteral(template.target_region)}::target_region, ${sqlLiteral(pipeline)}, ${sqlLiteral(scoring.score)}::integer, ${sqlLiteral(scoring.scoreLabel)}::score_label, ${sqlLiteral(scoring.reasons)}::jsonb, now()
      FROM contact, company
      ON CONFLICT (contact_id, lead_type, target_region) DO UPDATE SET score = GREATEST(opportunities.score, EXCLUDED.score), score_label = EXCLUDED.score_label, score_reasons = EXCLUDED.score_reasons, updated_at = now()
      RETURNING id, contact_id, company_id
    )
    INSERT INTO lead_search_results (lead_search_id, contact_id, company_id, opportunity_id, apollo_person_id, apollo_organization_id, page, position)
    SELECT ${sqlLiteral(leadSearchId)}::uuid, contact_id, company_id, id, ${sqlLiteral(person.id)}, ${sqlLiteral(organization.id)}, 1, 1
    FROM opportunity
    ON CONFLICT DO NOTHING
    RETURNING to_json(opportunity_id);
  `);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 640,
    title: "Tecnotitan CRM",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(() => {
  ipcMain.handle("dashboard", dashboardSummary);
  ipcMain.handle("templates", () => Object.values(searchTemplates));
  ipcMain.handle("leads", listLeads);
  ipcMain.handle("apollo-search", (_event, input) => apolloSearch(input));
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
