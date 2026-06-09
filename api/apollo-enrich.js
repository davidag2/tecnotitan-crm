const { requireAdmin } = require("./_auth");
const { readJsonBody } = require("./_request");
const { insertRow, supabaseFetch, updateRows } = require("./_supabase");

function apolloKey() {
  if (!process.env.APOLLO_API_KEY) throw new Error("APOLLO_API_KEY no esta configurada en Vercel.");
  return process.env.APOLLO_API_KEY;
}

async function enrichWithApollo({ contact, company }) {
  const params = new URLSearchParams();
  if (contact.apollo_person_id) params.set("id", contact.apollo_person_id);
  if (contact.email) params.set("email", contact.email);
  if (contact.linkedin_url) params.set("linkedin_url", contact.linkedin_url);
  if (contact.first_name) params.set("first_name", contact.first_name);
  if (contact.last_name) params.set("last_name", contact.last_name);
  if (contact.full_name) params.set("name", contact.full_name);
  if (company?.domain) params.set("domain", company.domain);
  if (company?.name) params.set("organization_name", company.name);
  params.set("reveal_personal_emails", "true");
  params.set("reveal_phone_number", process.env.APOLLO_PHONE_WEBHOOK_URL ? "true" : "false");
  if (process.env.APOLLO_PHONE_WEBHOOK_URL) {
    params.set("webhook_url", process.env.APOLLO_PHONE_WEBHOOK_URL);
  }

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

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== "") || null;
}

function contactUpdateFromApollo(person, currentContact) {
  const firstPhone = person.phone_numbers?.[0]?.raw_number || person.phone;
  return {
    apollo_person_id: firstValue(currentContact.apollo_person_id, person.id),
    first_name: firstValue(person.first_name, currentContact.first_name),
    last_name: firstValue(person.last_name, currentContact.last_name),
    full_name: firstValue(person.name, currentContact.full_name),
    title: firstValue(person.title, currentContact.title),
    seniority: firstValue(person.seniority, currentContact.seniority),
    email: firstValue(person.email, currentContact.email),
    email_status: firstValue(person.email_status, currentContact.email_status),
    phone: firstValue(firstPhone, currentContact.phone),
    mobile_phone: firstValue(person.mobile_phone, currentContact.mobile_phone),
    linkedin_url: firstValue(person.linkedin_url, currentContact.linkedin_url),
    photo_url: person.photo_url || null,
    country: firstValue(person.country, currentContact.country),
    city: firstValue(person.city, currentContact.city),
    state: firstValue(person.state, currentContact.state),
    apollo_raw_payload: person,
    apollo_enriched_at: new Date().toISOString(),
    apollo_enrichment_status: person.id ? "enriched" : "not_available",
    updated_at: new Date().toISOString(),
  };
}

function companyUpdateFromApollo(person, currentCompany) {
  const organization = person.organization || person.account || {};
  if (!organization.id && !organization.name) return null;
  return {
    apollo_organization_id: firstValue(currentCompany.apollo_organization_id, organization.id),
    name: firstValue(organization.name, currentCompany.name),
    domain: firstValue(organization.primary_domain, organization.domain, currentCompany.domain),
    website_url: firstValue(organization.website_url, currentCompany.website_url),
    linkedin_url: firstValue(organization.linkedin_url, currentCompany.linkedin_url),
    industry: firstValue(organization.industry, currentCompany.industry),
    country: firstValue(organization.country, currentCompany.country),
    city: firstValue(organization.city, currentCompany.city),
    state: firstValue(organization.state, currentCompany.state),
    employee_count: firstValue(organization.estimated_num_employees, organization.employee_count, currentCompany.employee_count),
    raw_payload: organization,
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
      "select=id,contact_id,company_id,contacts(id,apollo_person_id,first_name,last_name,full_name,title,seniority,email,email_status,phone,mobile_phone,linkedin_url,country,city,state),companies(id,apollo_organization_id,name,domain,website_url,linkedin_url,industry,country,city,state,employee_count)",
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
    const updated = await updateRows("contacts", contactUpdateFromApollo(person, opportunity.contacts), `id=eq.${opportunity.contacts.id}`);
    const companyPatch = companyUpdateFromApollo(person, opportunity.companies || {});
    if (companyPatch && opportunity.companies?.id) {
      await updateRows("companies", companyPatch, `id=eq.${opportunity.companies.id}`);
    }

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

    res.status(200).json({
      contact: updated[0] || null,
      enriched: Boolean(person.id),
      has_email: Boolean(updated[0]?.email),
      has_phone: Boolean(updated[0]?.mobile_phone || updated[0]?.phone),
      phone_reveal_enabled: Boolean(process.env.APOLLO_PHONE_WEBHOOK_URL),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
