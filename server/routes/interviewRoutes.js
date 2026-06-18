const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { createInterview, getInterviews, updateInterview, deleteInterview } = require("../controllers/interviewController");

router.post("/:orgId/interviews", protect, createInterview);
router.get("/:orgId/interviews", protect, getInterviews);
router.put("/:orgId/interviews/:interviewId", protect, updateInterview);
router.delete("/:orgId/interviews/:interviewId", protect, deleteInterview);

module.exports = router;
