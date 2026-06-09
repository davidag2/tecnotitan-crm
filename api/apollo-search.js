const { requireAdmin } = require("./_auth");
const { scoreLead } = require("./_scoring");
const { buildApolloPayload, getTemplate } = require("./_templates");
const { insertRow, upsertRow } = require("./_supabase");

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
    name: organization.name || "Empresa sin nombre",
    domain: organization.primary_domain || organization.domain || null,
    website_url: organization.website_url || null,
    linkedin_url: organization.linkedin_url || null,
    industry: organization.industry || null,
    country: organization.country || person.country || null,
    city: organization.city || null,
    state: organization.state || null,
    employee_count: organization.estimated_num_employees || organization.employee_count || null,
    raw_payload: organization,
  };
}

function contactFromPerson(person, companyId) {
  return {
    company_id: companyId,
    apollo_person_id: person.id || null,
    first_name: person.first_name || null,
    last_name: person.last_name || null,
    full_name: person.name || [person.first_name, person.last_name].filter(Boolean).join(" ") || null,
    title: person.title || null,
    seniority: person.seniority || null,
    email: person.email || null,
    email_status: person.email_status || null,
    phone: person.phone_numbers?.[0]?.raw_number || person.phone || null,
    mobile_phone: person.mobile_phone || null,
    linkedin_url: person.linkedin_url || null,
    photo_url: person.photo_url || null,
    country: person.country || null,
    city: person.city || null,
    state: person.state || null,
    lead_source: "apollo",
    apollo_raw_payload: person,
    apollo_last_synced_at: new Date().toISOString(),
  };
}

async function savePerson(person, template, leadSearchId, position, page) {
  const companyRow = companyFromPerson(person);
  let company = null;
  if (companyRow?.apollo_organization_id) {
    company = await upsertRow("companies", companyRow, ["apollo_organization_id"]);
  } else if (companyRow?.name) {
    company = await insertRow("companies", companyRow);
  }

  const contactRow = contactFromPerson(person, company?.id || null);
  const contact = contactRow.apollo_person_id
    ? await upsertRow("contacts", contactRow, ["apollo_person_id"])
    : await insertRow("contacts", contactRow);

  const score = scoreLead({
    leadType: template.lead_type,
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
      lead_type: template.lead_type,
      target_region: template.target_region,
      pipeline_status: "nuevo",
      ...score,
    },
    ["contact_id", "lead_type", "target_region"]
  );

  await insertRow("lead_search_results", {
    lead_search_id: leadSearchId,
    contact_id: contact.id,
    company_id: company?.id || null,
    opportunity_id: opportunity.id,
    apollo_person_id: person.id || null,
    apollo_organization_id: companyRow?.apollo_organization_id || null,
    page,
    position,
  });

  return { contact, company, opportunity };
}

module.exports = async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== "POST") {
    res.status(405).json({ error: "Metodo no permitido." });
    return;
  }

  try {
    const body = req.body || {};
    const template = getTemplate(body.template_key || "consulting_client:latam");
    const page = Number(body.page || 1);
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
