const { requireAdmin } = require("./_auth");
const { readJsonBody } = require("./_request");
const { insertRow, supabaseFetch, updateRows } = require("./_supabase");

function apolloKey() {
  if (!process.env.APOLLO_API_KEY) throw new Error("APOLLO_API_KEY no esta configurada en Vercel.");
  return process.env.APOLLO_API_KEY;
}

async function enrichWithApollo({ contact, company }) {
  const params = new URLSearchParams();
  if (contact.email) params.set("email", contact.email);
  if (contact.linkedin_url) params.set("linkedin_url", contact.linkedin_url);
  if (contact.first_name) params.set("first_name", contact.first_name);
  if (contact.last_name) params.set("last_name", contact.last_name);
  if (contact.full_name) params.set("name", contact.full_name);
  if (company?.domain) params.set("domain", company.domain);
  if (company?.name) params.set("organization_name", company.name);
  params.set("reveal_personal_emails", "true");
  params.set("reveal_phone_number", "false");

  const response = await fetch(`https://api.apollo.io/api/v1/people/match?${params.toString()}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
      "X-Api-Key": apolloKey(),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Apollo respondio ${response.status}`);
  }
  return data;
}

function contactUpdateFromApollo(person) {
  return {
    email: person.email || null,
    email_status: person.email_status || null,
    phone: person.phone_numbers?.[0]?.raw_number || person.phone || null,
    mobile_phone: person.mobile_phone || null,
    linkedin_url: person.linkedin_url || null,
    photo_url: person.photo_url || null,
    apollo_raw_payload: person,
    apollo_enriched_at: new Date().toISOString(),
    apollo_enrichment_status: person.id ? "enriched" : "not_available",
    updated_at: new Date().toISOString(),
  };
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
    if (!body.opportunity_id) {
      res.status(400).json({ error: "opportunity_id es requerido." });
      return;
    }

    const select = [
      "select=id,contact_id,company_id,contacts(id,first_name,last_name,full_name,email,linkedin_url),companies(id,name,domain)",
      `id=eq.${encodeURIComponent(body.opportunity_id)}`,
      "limit=1",
    ].join("&");
    const { payload } = await supabaseFetch(`/opportunities?${select}`);
    const opportunity = payload?.[0];
    if (!opportunity?.contacts) {
      res.status(404).json({ error: "No se encontro la oportunidad o su contacto." });
      return;
    }

    await updateRows("contacts", { apollo_enrichment_status: "requested" }, `id=eq.${opportunity.contacts.id}`);
    const apollo = await enrichWithApollo({ contact: opportunity.contacts, company: opportunity.companies });
    const person = apollo.person || {};
    const updated = await updateRows("contacts", contactUpdateFromApollo(person), `id=eq.${opportunity.contacts.id}`);

    await insertRow("apollo_sync_logs", {
      operation: "people_match_enrichment",
      endpoint: "/api/v1/people/match",
      request_payload: { opportunity_id: body.opportunity_id },
      response_status: 200,
      response_payload: apollo,
      credits_used: person.id ? 1 : 0,
      contact_id: opportunity.contacts.id,
      company_id: opportunity.companies?.id || null,
    });

    res.status(200).json({ contact: updated[0] || null, enriched: Boolean(person.id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
