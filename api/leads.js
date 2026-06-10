const { requireUser } = require("./_auth");
const { readJsonBody } = require("./_request");
const { scoreLead } = require("./_scoring");
const { insertRow, supabaseFetch, updateRows, upsertRow } = require("./_supabase");

function param(req, name) {
  const url = new URL(req.url, "https://tecnotitan.local");
  return String(url.searchParams.get(name) || "").trim();
}

function textIncludes(value, query) {
  return String(value || "").toLowerCase().includes(query);
}

function matchesText(lead, query) {
  if (!query) return true;
  const contact = lead.contacts || {};
  const company = lead.companies || {};
  return [
    contact.full_name,
    contact.title,
    contact.email,
    contact.country,
    contact.city,
    company.name,
    company.domain,
    company.industry,
    company.country,
  ].some((value) => textIncludes(value, query));
}

function matchesCountry(lead, country) {
  if (!country) return true;
  const contact = lead.contacts || {};
  const company = lead.companies || {};
  return [contact.country, company.country].some((value) => textIncludes(value, country));
}

async function listSearches() {
  const query = [
    "select=id,name,lead_type,target_region,search_template,filters,status,total_entries,pages_requested,results_saved,created_at",
    "order=created_at.desc",
    "limit=30",
  ].join("&");
  const { payload } = await supabaseFetch(`/lead_searches?${query}`);
  return payload || [];
}

async function listSearchResults(id) {
  const query = [
    "select=id,page,position,created_at,opportunities(id,lead_type,target_region,pipeline_status,score,score_label,contacts(full_name,title,email,country,city),companies(name,domain,industry,country))",
    `lead_search_id=eq.${encodeURIComponent(id)}`,
    "order=position.asc",
    "limit=100",
  ].join("&");
  const { payload } = await supabaseFetch(`/lead_search_results?${query}`);
  return payload || [];
}

function requireAdminView(user, res) {
  if (user.role === "admin") return true;
  res.status(403).json({ error: "Solo el usuario maestro puede realizar esta accion." });
  return false;
}

async function firstRow(path) {
  const { payload } = await supabaseFetch(path);
  return payload?.[0] || null;
}

function clean(value) {
  const text = String(value || "").trim();
  return text || null;
}

function cleanLower(value) {
  const text = clean(value);
  return text ? text.toLowerCase() : null;
}

function rowValue(row, names) {
  for (const name of names) {
    const value = row[name];
    if (value !== undefined && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

function companyFromCsv(row) {
  const name = clean(rowValue(row, ["company", "company_name", "empresa", "organization", "organization_name"]));
  const domain = cleanLower(rowValue(row, ["domain", "dominio", "company_domain"]));
  if (!name && !domain) return null;
  return {
    name: name || domain,
    domain,
    website_url: clean(rowValue(row, ["website", "website_url", "web", "company_website"])),
    linkedin_url: clean(rowValue(row, ["company_linkedin", "company_linkedin_url", "linkedin_empresa"])),
    industry: clean(rowValue(row, ["industry", "industria"])),
    country: clean(rowValue(row, ["company_country", "country", "pais"])),
    city: clean(rowValue(row, ["company_city", "city", "ciudad"])),
    state: clean(rowValue(row, ["company_state", "state", "estado"])),
    employee_count: Number(rowValue(row, ["employee_count", "employees", "empleados"])) || null,
    raw_payload: row,
  };
}

async function findCompany(companyRow) {
  if (!companyRow) return null;
  if (companyRow.domain) {
    const company = await firstRow(`/companies?select=*&domain=ilike.${encodeURIComponent(companyRow.domain)}&deleted_at=is.null&limit=1`);
    if (company) return company;
  }
  if (companyRow.name) {
    const countryFilter = companyRow.country ? `country=ilike.${encodeURIComponent(companyRow.country)}` : "or=(country.is.null,country.eq.)";
    const company = await firstRow(
      `/companies?select=*&name=ilike.${encodeURIComponent(companyRow.name)}&${countryFilter}&domain=is.null&deleted_at=is.null&limit=1`
    );
    if (company) return company;
  }
  return null;
}

async function saveCompany(companyRow) {
  if (!companyRow) return null;
  const existing = await findCompany(companyRow);
  if (existing) {
    const rows = await updateRows(
      "companies",
      {
        ...companyRow,
        domain: existing.domain || companyRow.domain,
        updated_at: new Date().toISOString(),
      },
      `id=eq.${encodeURIComponent(existing.id)}`
    );
    return rows[0] || existing;
  }
  return insertRow("companies", companyRow);
}

function contactFromCsv(row, companyId) {
  const firstName = clean(rowValue(row, ["first_name", "nombre"]));
  const lastName = clean(rowValue(row, ["last_name", "apellido"]));
  const fullName = clean(rowValue(row, ["full_name", "name", "nombre_completo"])) || [firstName, lastName].filter(Boolean).join(" ") || null;
  return {
    company_id: companyId,
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    title: clean(rowValue(row, ["title", "cargo", "job_title", "position"])),
    seniority: clean(rowValue(row, ["seniority", "senioridad"])),
    email: cleanLower(rowValue(row, ["email", "correo", "mail"])),
    phone: clean(rowValue(row, ["phone", "telefono"])),
    mobile_phone: clean(rowValue(row, ["mobile_phone", "mobile", "celular"])),
    linkedin_url: clean(rowValue(row, ["linkedin", "linkedin_url", "contact_linkedin"])),
    country: clean(rowValue(row, ["contact_country", "country", "pais"])),
    city: clean(rowValue(row, ["contact_city", "city", "ciudad"])),
    state: clean(rowValue(row, ["contact_state", "state", "estado"])),
    lead_source: "csv_import",
    apollo_raw_payload: { csv_import: row },
  };
}

async function findContact(contactRow) {
  if (contactRow.email) {
    const contact = await firstRow(`/contacts?select=*&email=ilike.${encodeURIComponent(contactRow.email)}&deleted_at=is.null&limit=1`);
    if (contact) return contact;
  }
  if (contactRow.linkedin_url) {
    const contact = await firstRow(`/contacts?select=*&linkedin_url=ilike.${encodeURIComponent(contactRow.linkedin_url)}&deleted_at=is.null&limit=1`);
    if (contact) return contact;
  }
  if (contactRow.full_name && contactRow.company_id) {
    const contact = await firstRow(
      `/contacts?select=*&full_name=ilike.${encodeURIComponent(contactRow.full_name)}&company_id=eq.${encodeURIComponent(contactRow.company_id)}&deleted_at=is.null&limit=1`
    );
    if (contact) return contact;
  }
  return null;
}

async function saveContact(contactRow) {
  const existing = await findContact(contactRow);
  if (existing) {
    const rows = await updateRows(
      "contacts",
      {
        ...contactRow,
        company_id: existing.company_id || contactRow.company_id,
        lead_source: existing.lead_source || "csv_import",
        updated_at: new Date().toISOString(),
      },
      `id=eq.${encodeURIComponent(existing.id)}`
    );
    return rows[0] || existing;
  }
  return insertRow("contacts", contactRow);
}

function normalizeLeadType(value, fallback) {
  const text = String(value || fallback || "consulting_client").toLowerCase();
  return text.includes("invest") ? "investor" : "consulting_client";
}

function normalizeRegion(value, fallback) {
  const text = String(value || fallback || "latam").toLowerCase();
  if (text.includes("eur")) return "europe";
  if (text.includes("usa") || text.includes("united states") || text.includes("eeuu")) return "usa";
  return "latam";
}

async function importCsvRows(rows, body, user) {
  const inputRows = Array.isArray(rows) ? rows.slice(0, 500) : [];
  const leadSearch = await insertRow("lead_searches", {
    name: body.name || `CSV import ${new Date().toISOString().slice(0, 10)}`,
    lead_type: normalizeLeadType(body.lead_type),
    target_region: normalizeRegion(body.target_region),
    search_template: "csv_import",
    filters: { source: "csv", rows_received: inputRows.length },
    status: "completed",
    total_entries: inputRows.length,
    pages_requested: 1,
    results_saved: 0,
    created_by: user.db_user_id || null,
  });

  const saved = [];
  let skipped = 0;
  for (const [index, row] of inputRows.entries()) {
    const companyRow = companyFromCsv(row);
    const company = await saveCompany(companyRow);
    const contactRow = contactFromCsv(row, company?.id || null);
    if (!contactRow.full_name && !contactRow.email && !contactRow.linkedin_url) {
      skipped += 1;
      continue;
    }
    const contact = await saveContact(contactRow);
    const leadType = normalizeLeadType(rowValue(row, ["lead_type", "tipo"]), body.lead_type);
    const targetRegion = normalizeRegion(rowValue(row, ["target_region", "region"]), body.target_region);
    const score = scoreLead({
      leadType,
      title: contactRow.title,
      country: contactRow.country || companyRow?.country,
      linkedinUrl: contactRow.linkedin_url,
      organization: companyRow,
    });
    const opportunity = await upsertRow(
      "opportunities",
      {
        contact_id: contact.id,
        company_id: company?.id || null,
        lead_type: leadType,
        target_region: targetRegion,
        pipeline_status: "nuevo",
        ...score,
      },
      ["contact_id", "lead_type", "target_region"]
    );
    await insertRow("lead_search_results", {
      lead_search_id: leadSearch.id,
      contact_id: contact.id,
      company_id: company?.id || null,
      opportunity_id: opportunity.id,
      apollo_person_id: null,
      apollo_organization_id: null,
      page: 1,
      position: index + 1,
    });
    saved.push({ contact, company, opportunity });
  }

  await updateRows("lead_searches", { results_saved: saved.length, updated_at: new Date().toISOString() }, `id=eq.${encodeURIComponent(leadSearch.id)}`);
  return { lead_search_id: leadSearch.id, received: inputRows.length, saved: saved.length, skipped };
}

module.exports = async function handler(req, res) {
  const user = requireUser(req, res);
  if (!user) return;

  try {
    if (req.method === "POST") {
      if (!requireAdminView(user, res)) return;
      const body = await readJsonBody(req);
      if (body.mode !== "csv_import") {
        res.status(400).json({ error: "mode csv_import es requerido." });
        return;
      }
      const result = await importCsvRows(body.rows, body, user);
      res.status(200).json(result);
      return;
    }

    if (req.method !== "GET") {
      res.status(405).json({ error: "Metodo no permitido." });
      return;
    }

    const mode = param(req, "mode");
    const leadSearchId = param(req, "search_id");
    if (mode === "search_history") {
      if (!requireAdminView(user, res)) return;
      const searches = await listSearches();
      res.status(200).json({ searches, count: searches.length });
      return;
    }

    if (leadSearchId) {
      if (!requireAdminView(user, res)) return;
      const results = await listSearchResults(leadSearchId);
      res.status(200).json({ results, count: results.length });
      return;
    }

    const leadType = param(req, "lead_type");
    const targetRegion = param(req, "target_region");
    const scoreLabel = param(req, "score_label");
    const pipelineStatus = param(req, "pipeline_status");
    const createdAfter = param(req, "created_after");
    const q = param(req, "q").toLowerCase();
    const country = param(req, "country").toLowerCase();
    const assignmentFilter =
      user.role === "admin" ? "" : `&owner_user_id=eq.${encodeURIComponent(user.db_user_id || user.email || "")}`;
    const query = [
      "select=id,lead_type,target_region,pipeline_status,score,score_label,created_at,owner_user_id,next_follow_up_at,next_follow_up_type,contacts(id,full_name,title,email,email_status,phone,mobile_phone,linkedin_url,country,city,apollo_enrichment_status,apollo_raw_payload),companies(id,name,domain,website_url,linkedin_url,industry,country,city,state,employee_count)",
      "deleted_at=is.null",
      assignmentFilter.replace(/^&/, ""),
      leadType ? `lead_type=eq.${encodeURIComponent(leadType)}` : "",
      targetRegion ? `target_region=eq.${encodeURIComponent(targetRegion)}` : "",
      scoreLabel ? `score_label=eq.${encodeURIComponent(scoreLabel)}` : "",
      pipelineStatus ? `pipeline_status=eq.${encodeURIComponent(pipelineStatus)}` : "",
      createdAfter ? `created_at=gte.${encodeURIComponent(createdAfter)}` : "",
      "order=score.desc",
      "limit=200",
    ].filter(Boolean).join("&");
    const { payload } = await supabaseFetch(`/opportunities?${query}`);
    const leads = (payload || []).filter((lead) => matchesText(lead, q)).filter((lead) => matchesCountry(lead, country));
    res.status(200).json({ leads, count: leads.length, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
