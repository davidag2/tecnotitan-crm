const { requireUser } = require("./_auth");
const { readJsonBody } = require("./_request");
const { insertRow, supabaseFetch, updateRows } = require("./_supabase");

function getOpportunityId(req) {
  const url = new URL(req.url, "https://tecnotitan.local");
  return String(url.searchParams.get("id") || "").trim();
}

async function loadOpportunity(id, user) {
  const filters = [
    "select=id,lead_type,target_region,pipeline_status,owner_user_id,score,score_label,score_reasons,service_interest,consulting_need,investor_type,investment_stage,investment_thesis,last_activity_at,next_follow_up_at,next_follow_up_type,created_at,contacts(id,full_name,first_name,last_name,title,seniority,email,email_status,phone,mobile_phone,linkedin_url,photo_url,country,city,state,apollo_enrichment_status,apollo_enriched_at,apollo_raw_payload),companies(id,name,domain,website_url,linkedin_url,industry,country,city,state,employee_count,raw_payload)",
    `id=eq.${encodeURIComponent(id)}`,
    "deleted_at=is.null",
    "limit=1",
  ];

  if (user.role !== "admin") {
    filters.splice(2, 0, `owner_user_id=eq.${encodeURIComponent(user.db_user_id || "")}`);
  }

  const { payload } = await supabaseFetch(`/opportunities?${filters.join("&")}`);
  return payload?.[0] || null;
}

async function loadNotes(id, user) {
  const opportunity = await loadOpportunity(id, user);
  if (!opportunity) return { opportunity: null, notes: [] };

  const [{ payload: notes }, { payload: events }, { payload: activities }] = await Promise.all([
    supabaseFetch(
    `/notes?select=id,body,created_at,users(name,email)&opportunity_id=eq.${encodeURIComponent(id)}&deleted_at=is.null&order=created_at.desc&limit=20`
    ),
    supabaseFetch(
      `/pipeline_events?select=id,from_status,to_status,note,changed_at,users(name,email)&opportunity_id=eq.${encodeURIComponent(id)}&order=changed_at.desc&limit=20`
    ),
    supabaseFetch(
      `/activities?select=id,activity_type,subject,body,activity_at,users(name,email)&opportunity_id=eq.${encodeURIComponent(id)}&order=activity_at.desc&limit=20`
    ),
  ]);
  return { opportunity, notes: notes || [], events: events || [], activities: activities || [] };
}

async function addNote(id, body, user) {
  const opportunity = await loadOpportunity(id, user);
  if (!opportunity) throw new Error("No se encontro el lead o no tienes acceso.");
  if (!body.note) throw new Error("La nota no puede estar vacia.");

  await insertRow("notes", {
    opportunity_id: id,
    contact_id: opportunity.contacts?.id || null,
    company_id: opportunity.companies?.id || null,
    user_id: user.db_user_id || null,
    body: String(body.note).trim(),
  });

  await updateRows(
    "opportunities",
    {
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    `id=eq.${encodeURIComponent(id)}`
  );
}

async function addActivity(id, body, user) {
  const opportunity = await loadOpportunity(id, user);
  if (!opportunity) throw new Error("No se encontro el lead o no tienes acceso.");
  if (!body.activity_type) throw new Error("activity_type es requerido.");

  const labels = {
    email: "Email registrado",
    phone: "Llamada registrada",
    linkedin: "LinkedIn registrado",
    website: "Web revisada",
    contact: "Contacto registrado",
  };
  const activityType = String(body.activity_type).trim();
  const subject = String(body.subject || labels[activityType] || "Actividad registrada").trim();

  await insertRow("activities", {
    opportunity_id: id,
    contact_id: opportunity.contacts?.id || null,
    company_id: opportunity.companies?.id || null,
    user_id: user.db_user_id || null,
    activity_type: activityType,
    subject,
    body: body.body ? String(body.body).trim() : null,
  });

  await updateRows(
    "opportunities",
    {
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    `id=eq.${encodeURIComponent(id)}`
  );
}

async function updateOpportunity(id, body, user) {
  const opportunity = await loadOpportunity(id, user);
  if (!opportunity) throw new Error("No se encontro el lead o no tienes acceso.");

  const patch = { updated_at: new Date().toISOString() };
  const fromStatus = opportunity.pipeline_status;
  if (body.pipeline_status) patch.pipeline_status = body.pipeline_status;
  if (body.next_follow_up_at !== undefined) patch.next_follow_up_at = body.next_follow_up_at || null;
  if (body.next_follow_up_type !== undefined) patch.next_follow_up_type = body.next_follow_up_type || null;
  if (body.service_interest !== undefined) patch.service_interest = body.service_interest || null;
  if (body.consulting_need !== undefined) patch.consulting_need = body.consulting_need || null;
  if (body.investment_thesis !== undefined) patch.investment_thesis = body.investment_thesis || null;

  await updateRows("opportunities", patch, `id=eq.${encodeURIComponent(id)}`);
  if (body.pipeline_status && body.pipeline_status !== fromStatus) {
    await insertRow("pipeline_events", {
      opportunity_id: id,
      from_status: fromStatus,
      to_status: body.pipeline_status,
      changed_by: user.db_user_id || null,
      note: body.pipeline_note || null,
    });
  }
}

module.exports = async function handler(req, res) {
  const user = requireUser(req, res);
  if (!user) return;

  try {
    const id = getOpportunityId(req);
    if (!id) {
      res.status(400).json({ error: "id es requerido." });
      return;
    }

    if (req.method === "GET") {
      const detail = await loadNotes(id, user);
      if (!detail.opportunity) {
        res.status(404).json({ error: "No se encontro el lead o no tienes acceso." });
        return;
      }
      res.status(200).json(detail);
      return;
    }

    const body = await readJsonBody(req);
    if (req.method === "POST") {
      if (body.activity_type) {
        await addActivity(id, body, user);
        res.status(201).json(await loadNotes(id, user));
        return;
      }
      await addNote(id, body, user);
      res.status(201).json(await loadNotes(id, user));
      return;
    }

    if (req.method === "PATCH") {
      await updateOpportunity(id, body, user);
      res.status(200).json(await loadNotes(id, user));
      return;
    }

    res.status(405).json({ error: "Metodo no permitido." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
