const User = require('../models/User');
const AgentAssignment = require('../models/AgentAssignment');

// ─── GET /api/agents ──────────────────────────────────────────────────────────
// Returns all users with role = 'agent', with their assigned customer count
exports.getAllAgents = async (req, res, next) => {
  try {
    const agents = await User.find({ role: 'agent' })
      .select('name email phone role createdAt')
      .lean();

    // Attach customer count to each agent
    const agentsWithCount = await Promise.all(
      agents.map(async (agent) => {
        const count = await AgentAssignment.countDocuments({
          agent: agent._id,
          active: true,
        });
        return { ...agent, customerCount: count };
      })
    );

    res.status(200).json({ success: true, data: agentsWithCount });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/agents ─────────────────────────────────────────────────────────
// Create a new agent account
exports.createAgent = async (req, res, next) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone and password are required.'
      });
    }

    // Check duplicate phone
    const exists = await User.findOne({
      $or: [
        { phone },
        ...(email ? [{ email }] : [])
      ]
    });

    if (exists) {
      const field = exists.phone === phone ? 'phone' : 'email';
      return res.status(400).json({
        success: false,
        message: `A user with this ${field} already exists.`
      });
    }

    const agent = await User.create({
      name,
      phone,
      email: email || `agent_${phone}@placeholder.com`, // ← prevents duplicate email error if empty
      password,
      role: 'agent',
    });

    const agentData = agent.toObject();
    delete agentData.password;

    res.status(201).json({ success: true, data: agentData });

  } catch (error) {
    // Handle MongoDB duplicate key error explicitly
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A user with this ${field} already exists.`
      });
    }
    next(error);
  }
};
// ─── GET /api/agents/:id ──────────────────────────────────────────────────────
exports.getAgentById = async (req, res, next) => {
  try {
    const agent = await User.findOne({ _id: req.params.id, role: 'agent' })
      .select('name email phone role createdAt')
      .lean();

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found.' });
    }

    const customerCount = await AgentAssignment.countDocuments({
      agent: agent._id,
      active: true,
    });

    res.status(200).json({ success: true, data: { ...agent, customerCount } });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/agents/:id ───────────────────────────────────────────────────
exports.deleteAgent = async (req, res, next) => {
  try {
    const agent = await User.findOne({ _id: req.params.id, role: 'agent' });

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found.' });
    }

    // Remove all assignments for this agent
    await AgentAssignment.deleteMany({ agent: agent._id });

    await agent.deleteOne();

    res.status(200).json({ success: true, message: 'Agent deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/agents/:id/customers ───────────────────────────────────────────
// Returns all customers assigned to this agent
exports.getAgentCustomers = async (req, res, next) => {
  try {
    const assignments = await AgentAssignment.find({
      agent: req.params.id,
      active: true,
    }).populate('customer', 'name email phone customerId');

    const customers = assignments
      .filter(a => a.customer) // skip if customer was deleted
      .map(a => a.customer);

    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/agents/:id/assign-customers ────────────────────────────────────
// Assign one or many customers to an agent
// Body: { customerIds: ["id1", "id2", ...] }
exports.assignCustomers = async (req, res, next) => {
  try {
    const { customerIds } = req.body;

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({ success: false, message: 'customerIds array is required.' });
    }

    const agentId = req.params.id;

    // Verify agent exists
    const agent = await User.findOne({ _id: agentId, role: 'agent' });
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found.' });
    }

    // For each customer, upsert an assignment (avoid duplicates)
    const ops = customerIds.map(custId => ({
      updateOne: {
        filter: { agent: agentId, customer: custId },
        update: { $set: { agent: agentId, customer: custId, active: true, assignedAt: new Date() } },
        upsert: true,
      },
    }));

    await AgentAssignment.bulkWrite(ops);

    res.status(200).json({
      success: true,
      message: `${customerIds.length} customer(s) assigned successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/agents/:id/remove-customer/:custId ──────────────────────────
exports.removeCustomer = async (req, res, next) => {
  try {
    const { id: agentId, custId } = req.params;

    const result = await AgentAssignment.findOneAndDelete({
      agent: agentId,
      customer: custId,
    });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    res.status(200).json({ success: true, message: 'Customer removed from agent.' });
  } catch (error) {
    next(error);
  }
};