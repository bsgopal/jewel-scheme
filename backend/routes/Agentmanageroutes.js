const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllAgents,
  createAgent,
  getAgentById,
  deleteAgent,
  getAgentCustomers,
  assignCustomers,
  removeCustomer,
} = require('../controllers/agentManageController');

// All routes below require admin only
router.use(protect, authorize('admin'));

router.get('/',    getAllAgents);   // GET  /api/agents
router.post('/',   createAgent);   // POST /api/agents

router.get('/:id',    getAgentById);  // GET    /api/agents/:id
router.delete('/:id', deleteAgent);   // DELETE /api/agents/:id

router.get('/:id/customers',                    getAgentCustomers); // GET    /api/agents/:id/customers
router.post('/:id/assign-customers',            assignCustomers);   // POST   /api/agents/:id/assign-customers
router.delete('/:id/remove-customer/:custId',   removeCustomer);    // DELETE /api/agents/:id/remove-customer/:custId

module.exports = router;