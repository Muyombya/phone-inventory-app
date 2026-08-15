const { generateBusinessAI } = require("../services/businessAIService");

const getBusinessAI = async (req, res) => {
  try {
    const result = await generateBusinessAI(req, req.query);
    return res.json(result);
  } catch (error) {
    console.error("Business AI:", error);
    return res.status(500).json({
      message: error.message || "Failed to generate AI business insights",
    });
  }
};

module.exports = {
  getBusinessAI,
};
