const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const { getReports } = require("../controllers/reportController");
const { updateOrganization } = require("../controllers/settingsController");


const {
  createOrganization, getMyOrganization, getMembers, addMember, removeMember, updateMemberRole
} = require("../controllers/organizationController");
const {
  createJobPosition, getJobPositions, updateJobPosition, deleteJobPosition
} = require("../controllers/jobPositionController");
const { bulkAnalyze, getCandidates, updateCandidate, addNote, getPool, addToPosition } = require("../controllers/candidateController");
const { createCampaign, sendCampaign, getCampaigns, getSuggestedCandidates } = require("../controllers/campaignController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Solo se aceptan PDFs"), false);
  },
});

// Organización
router.post("/", protect, createOrganization);
router.get("/my", protect, getMyOrganization);

// Miembros
router.get("/:orgId/members", protect, getMembers);
router.post("/:orgId/members", protect, addMember);
router.delete("/:orgId/members/:userId", protect, removeMember);
router.put("/:orgId/members/:userId/role", protect, updateMemberRole);

// Puestos de trabajo
router.get("/:orgId/positions", protect, getJobPositions);
router.post("/:orgId/positions", protect, createJobPosition);
router.put("/:orgId/positions/:positionId", protect, updateJobPosition);
router.delete("/:orgId/positions/:positionId", protect, deleteJobPosition);

// Candidatos
router.post("/:orgId/candidates/bulk", protect, upload.array("cvs", 20), bulkAnalyze);
router.get("/:orgId/candidates", protect, getCandidates);
router.put("/:orgId/candidates/:candidateId", protect, updateCandidate);
router.post("/:orgId/candidates/:candidateId/notes", protect, addNote);

// Pool de talento
router.get("/:orgId/pool", protect, getPool);
router.put("/:orgId/candidates/:candidateId/add-to-position", protect, addToPosition);

// Campañas de mailing
router.get("/:orgId/campaigns", protect, getCampaigns);
router.post("/:orgId/campaigns", protect, createCampaign);
router.post("/:orgId/campaigns/:campaignId/send", protect, sendCampaign);
router.get("/:orgId/campaigns/suggested-candidates", protect, getSuggestedCandidates);

// Reportes
router.get("/:orgId/reports", protect, getReports);

// Configuración de empresa
router.put("/:orgId/settings", protect, updateOrganization);


module.exports = router;
