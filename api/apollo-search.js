const { requireAdmin } = require("./_auth");
const { readJsonBody } = require("./_request");
const { scoreLead } = require("./_scoring");
const { buildApolloPayload, getTemplate } = require("./_templates");
const { countRows, insertRow, supabaseFetch, updateRows, upsertRow } = require("./_supabase");

function apolloKey() {
  if (!process.env.APOLLO_API_KEY) throw new Error("APOLLO_API_KEY no esta configurada en Vercel.");
  return process.env.APOLLO_API_KEY;
}

async function searchApollo(payload) {
  const response = await fetch("https://api.apollo.io/api/v1/mixed_people/api_search", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
      "X-Api-Key": apolloKey(),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Apollo respondio ${response.status}`);
  }
  return data;
}

function companyFromPerson(person) {
  const organization = person.organization || person.account || {};
  if (!organization?.id && !organization?.name) return null;

  return {
    apollo_organization_id: organization.id || null,
    name: String(organization.name || "Empresa sin nombre").trim(),
    domain: String(organization.primary_domain || organization.domain || "").trim().toLowerCase() || null,
    website_url: organization.website_url || null,
    linkedin_url: organization.linkedin_url || null,
    industry: organization.industry || null,
    country: String(organization.country || person.country || "").trim() || null,
    city: organization.city || null,
    state: organization.state || null,
    employee_count: organization.estimated_num_employees || organization.employee_count || null,
    raw_payload: organization,
  };
}

async function firstRow(path) {
  const { payload } = await supabaseFetch(path);
  return payload?.[0] || null;
}

function keepValue(incoming, existing) {
  return incoming === null || incoming === undefined || incoming === "" ? existing || null : incoming;
}

function wordCount(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

function keepRicherName(incoming, existing) {
  if (!incoming) return existing || null;
  if (!existing) return incoming;
  if (wordCount(incoming) > wordCount(existing)) return incoming;
  if (wordCount(incoming) === wordCount(existing) && String(incoming).length > String(existing).length) return incoming;
  return existing;
}

function mergePayload(existingPayload, incomingPayload) {
  return {
    ...(incomingPayload || {}),
    ...(existingPayload || {}),
    tecnotitan_last_search_sync_at: new Date().toISOString(),
  };
}

async function nextPageForTemplate(templateKey) {
  const previousSearches = await countRows("lead_searches", `&search_template=eq.${encodeURIComponent(templateKey)}`);
  return previousSearches + 1;
}

async function findCompany(companyRow) {
  if (!companyRow) return null;
  if (companyRow.apollo_organization_id) {
    const company = await firstRow(`/companies?select=*&apollo_organization_id=eq.${encodeURIComponent(companyRow.apollo_organization_id)}&deleted_at=is.null&limit=1`);
    if (company) return company;
  }

  if (companyRow.domain) {
    const company = await firstRow(`/companies?select=*&domain=ilike.${encodeURIComponent(companyRow.domain)}&deleted_at=is.null&limit=1`);
    if (company) return company;
  }

  if (companyRow.name) {
    const countryFilter = companyRow.country
      ? `country=ilike.${encodeURIComponent(companyRow.country)}`
      : "or=(country.is.null,country.eq.)";
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
    const updates = {
      apollo_organization_id: existing.apollo_organization_id || companyRow.apollo_organization_id,
      name: keepValue(companyRow.name, existing.name),
      domain: keepValue(companyRow.domain, existing.domain),
      website_url: keepValue(companyRow.website_url, existing.website_url),
      linkedin_url: keepValue(companyRow.linkedin_url, existing.linkedin_url),
      industry: keepValue(companyRow.industry, existing.industry),
      country: keepValue(companyRow.country, existing.country),
      city: keepValue(companyRow.city, existing.city),
      state: keepValue(companyRow.state, existing.state),
      employee_count: keepValue(companyRow.employee_count, existing.employee_count),
      raw_payload: mergePayload(existing.raw_payload, companyRow.raw_payload),
      updated_at: new Date().toISOString(),
    };
    const rows = await updateRows("companies", updates, `id=eq.${encodeURIComponent(existing.id)}`);
    return rows[0] || existing;
  }

  return insertRow("companies", companyRow);
}

function contactFromPerson(person, companyId) {
  const phone = person.phone_numbers?.[0]?.raw_number || person.phone || null;
  const mobilePhone = person.mobile_phone || null;
  const apolloRawPayload = {
    ...person,
    tecnotitan_phone_status: phone || mobilePhone ? "available" : "unknown",
  };
  return {
    company_id: companyId,
    apollo_person_id: person.id || null,
    first_name: person.first_name || null,
    last_name: person.last_name || null,
    full_name: String(person.name || [person.first_name, person.last_name].filter(Boolean).join(" ") || "").trim() || null,
    title: person.title || null,
    seniority: person.seniority || null,
    email: String(person.email || "").trim().toLowerCase() || null,
    email_status: person.email_status || null,
    phone,
    mobile_phone: mobilePhone,
    linkedin_url: String(person.linkedin_url || "").trim() || null,
    photo_url: person.photo_url || null,
    country: person.country || null,
    city: person.city || null,
    state: person.state || null,
    lead_source: "apollo",
    apollo_raw_payload: apolloRawPayload,
    apollo_last_synced_at: new Date().toISOString(),
  };
}

async function findContact(contactRow) {
  if (!contactRow) return null;
  if (contactRow.apollo_person_id) {
    const contact = await firstRow(`/contacts?select=*&apollo_person_id=eq.${encodeURIComponent(contactRow.apollo_person_id)}&deleted_at=is.null&limit=1`);
    if (contact) return contact;
  }

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
    const updates = {
      company_id: existing.company_id || contactRow.company_id,
      apollo_person_id: existing.apollo_person_id || contactRow.apollo_person_id,
      first_name: keepValue(contactRow.first_name, existing.first_name),
      last_name: keepValue(contactRow.last_name, existing.last_name),
      full_name: keepRicherName(contactRow.full_name, existing.full_name),
      title: keepValue(contactRow.title, existing.title),
      seniority: keepValue(contactRow.seniority, existing.seniority),
      email: keepValue(contactRow.email, existing.email),
      email_status: keepValue(contactRow.email_status, existing.email_status),
      phone: keepValue(contactRow.phone, existing.phone),
      mobile_phone: keepValue(contactRow.mobile_phone, existing.mobile_phone),
      linkedin_url: keepValue(contactRow.linkedin_url, existing.linkedin_url),
      photo_url: keepValue(contactRow.photo_url, existing.photo_url),
      country: keepValue(contactRow.country, existing.country),
      city: keepValue(contactRow.city, existing.city),
      state: keepValue(contactRow.state, existing.state),
      lead_source: existing.lead_source || contactRow.lead_source,
      apollo_raw_payload: mergePayload(existing.apollo_raw_payload, contactRow.apollo_raw_payload),
      apollo_last_synced_at: new Date().toISOString(),
      apollo_enrichment_status: existing.apollo_enrichment_status || contactRow.apollo_enrichment_status,
      apollo_enriched_at: existing.apollo_enriched_at || contactRow.apollo_enriched_at,
      updated_at: new Date().toISOString(),
    };
    const rows = await updateRows("contacts", updates, `id=eq.${encodeURIComponent(existing.id)}`);
    return rows[0] || existing;
  }

  return insertRow("contacts", contactRow);
}

async function savePerson(person, template, leadSearchId, position, page) {
  const companyRow = companyFromPerson(person);
  const company = await saveCompany(companyRow);

  const contactRow = contactFromPerson(person, company?.id || null);
  const contact = await saveContact(contactRow);

  const score = scoreLead({
    leadType: template.lead_type,
    title: contactRow.title,
    country: contactRow.country || companyRow?.country,
    linkedinUrl: contactRow.linkedin_url,
    organization: companyRow,
  });

  const existingOpportunity = await firstRow(
    `/opportunities?select=*&contact_id=eq.${encodeURIComponent(contact.id)}&lead_type=eq.${encodeURIComponent(template.lead_type)}&target_region=eq.${encodeURIComponent(template.target_region)}&deleted_at=is.null&limit=1`
  );
  const opportunity = existingOpportunity
    ? (
        await updateRows(
          "opportunities",
          {
            company_id: existingOpportunity.company_id || company?.id || null,
            score: existingOpportunity.score || score.score,
            score_label: existingOpportunity.score_label || score.score_label,
            score_reasons: existingOpportunity.score_reasons || score.score_reasons,
            updated_at: new Date().toISOString(),
          },
          `id=eq.${encodeURIComponent(existingOpportunity.id)}`
        )
      )[0] || existingOpportunity
    : await upsertRow("opportunities", {
      contact_id: contact.id,
      company_id: company?.id || null,
      lead_type: template.lead_type,
      target_region: template.target_region,
      pipeline_status: "nuevo",
      ...score,
    }, ["contact_id", "lead_type", "target_region"]);

  if (person.id) {
    await upsertRow(
      "lead_search_results",
      {
        lead_search_id: leadSearchId,
        contact_id: contact.id,
        company_id: company?.id || null,
        opportunity_id: opportunity.id,
        apollo_person_id: person.id,
        apollo_organization_id: companyRow?.apollo_organization_id || null,
        page,
        position,
      },
      ["lead_search_id", "apollo_person_id"]
    );
  } else {
    await insertRow("lead_search_results", {
      lead_search_id: leadSearchId,
      contact_id: contact.id,
      company_id: company?.id || null,
      opportunity_id: opportunity.id,
      apollo_person_id: null,
      apollo_organization_id: companyRow?.apollo_organization_id || null,
      page,
      position,
    });
  }

  return { contact, company, opportunity };
}

module.exports = async function handler(req, res) {
  const user = requireAdmin(req, res);
  if (!user) return;
  if (req.method !== "POST") {
    res.status(405).json({ error: "Metodo no permitido." });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const template = getTemplate(body.template_key || "consulting_client:latam");
    const page = Number(body.page || (await nextPageForTemplate(template.key)));
    const perPage = Math.min(Number(body.per_page || template.default_per_page), 25);
    const payload = { ...buildApolloPayload(template, body.filters), page, per_page: perPage };
    const apollo = await searchApollo(payload);
    const people = apollo.people || [];

    const leadSearch = await insertRow("lead_searches", {
      name: body.name || `${template.key} page ${page}`,
      lead_type: template.lead_type,
      target_region: template.target_region,
      search_template: template.key,
      filters: payload,
      status: "completed",
      total_entries: apollo.total_entries || null,
      pages_requested: 1,
      results_saved: people.length,
      created_by: user.db_user_id || null,
    });

    const saved = [];
    for (const [index, person] of people.entries()) {
      saved.push(await savePerson(person, template, leadSearch.id, index + 1, page));
    }

    res.status(200).json({
      lead_search_id: leadSearch.id,
      total_entries: apollo.total_entries || null,
      returned: people.length,
      saved: saved.length,
      leads: saved,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
