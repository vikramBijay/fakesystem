const express = require("express");
const router = express.Router();

const { analyzeController } = require("../controllers/analyzeController");

router.post("/analyze", (req, res, next) => {
  console.log("🔥 /api/analyze HIT");
  analyzeController(req, res, next);
});

module.exports = router;