const { listTemplates } = require("./_templates");

module.exports = async function handler(req, res) {
  res.status(200).json({ templates: listTemplates(), count: listTemplates().length });
};
