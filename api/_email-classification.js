function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function automaticReplyReason({ subject = "", text = "", headers = null } = {}) {
  const subjectText = normalizeText(subject);
  const bodyText = normalizeText(text).slice(0, 4000);
  const headerText = normalizeText(headers ? JSON.stringify(headers) : "");

  if (/auto-submitted[^\n]*(auto-replied|auto-generated)|x-autoreply|x-autorespond/.test(headerText)) {
    return "automatic_header";
  }

  const subjectPatterns = [
    /\bautomatic reply\b/,
    /\bautomated reply\b/,
    /\bauto[ -]?reply\b/,
    /\bautoreply\b/,
    /\bout of office\b/,
    /\baway from (the )?office\b/,
    /\bvacation (reply|responder)\b/,
    /\brespuesta automatica\b/,
    /\bfuera de la oficina\b/,
    /\bmensaje de ausencia\b/,
    /\breponse automatique\b/,
    /\babsent du bureau\b/,
    /\bautomatische antwort\b/,
    /\babwesenheitsnotiz\b/,
    /\brisposta automatica\b/,
    /\bresposta automatica\b/,
    /\bfora do escritorio\b/,
  ];
  if (subjectPatterns.some((pattern) => pattern.test(subjectText))) return "automatic_subject";

  const bodyPatterns = [
    /\bthis is an automated (reply|response)\b/,
    /\bi am (currently )?out of (the )?office\b/,
    /\bi will be out of (the )?office\b/,
    /\bestoy fuera de la oficina\b/,
    /\besta es una respuesta automatica\b/,
    /\bje suis absent(e)? du bureau\b/,
    /\bich bin (derzeit )?nicht im buro\b/,
    /\bestou fora do escritorio\b/,
  ];
  return bodyPatterns.some((pattern) => pattern.test(bodyText)) ? "automatic_body" : "";
}

module.exports = { automaticReplyReason };

