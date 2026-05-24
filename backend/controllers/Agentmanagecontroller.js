const User = require('../models/User');
const AgentAssignment = require('../models/AgentAssignment');
const Scheme = require('../models/Scheme');

// ─── GET /api/agents/areas ───────────────────────────────────────────────────
// Get all unique areas/cities from customers
exports.getAvailableAreas = async (req, res, next) => {
  try {
    const areas = await User.aggregate([
      { $match: { role: 'customer' } },
      { $group: { _id: null, areas: { $addToSet: '$address.area' }, cities: { $addToSet: '$address.city' } } },
      { $project: { _id: 0, areas: 1, cities: 1 } }
    ]);

    const allLocations = new Set();
    if (areas[0]) {
      areas[0].areas?.forEach(a => a && allLocations.add(a));
      areas[0].cities?.forEach(c => c && allLocations.add(c));
    }

    res.status(200).json({ success: true, data: Array.from(allLocations).sort() });
  } catch (error) {
    next(error);
  }
};

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
    }).populate('customer', 'name email phone customerId address')
      .populate('scheme', 'schemeName schemeId');

    const customers = assignments
      .filter(a => a.customer) // skip if customer was deleted
      .map(a => ({
        ...a.customer.toObject(),
        assignmentType: a.assignmentType,
        assignmentArea: a.area || '',
        assignmentScheme: a.scheme || null,
        assignmentNotes: a.notes || ''
      }));

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
    const { customerIds, assignmentType = 'customer', area, schemeId } = req.body;

    const agentId = req.params.id;

    // Verify agent exists
    const agent = await User.findOne({ _id: agentId, role: 'agent' });
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found.' });
    }

    let resolvedCustomerIds = Array.isArray(customerIds) ? [...new Set(customerIds)] : [];

    if (assignmentType === 'area') {
      if (!area) {
        return res.status(400).json({ success: false, message: 'Area is required for area-wise assignment.' });
      }

      // Search for customers in the specified area (case-insensitive, partial match)
      const areaCustomers = await User.find({
        role: 'customer',
        $or: [
          { 'address.area': { $regex: area, $options: 'i' } },
          { 'address.city': { $regex: area, $options: 'i' } },
          { 'address.state': { $regex: area, $options: 'i' } }
        ]
      }).select('_id');

      resolvedCustomerIds = areaCustomers.map((item) => item._id.toString());
    }

    if (assignmentType === 'plan') {
      if (!schemeId) {
        return res.status(400).json({ success: false, message: 'Plan or scheme ID is required for plan-wise assignment.' });
      }

      const schemeCustomers = await Scheme.find({
        $or: [{ _id: schemeId }, { schemeName: schemeId }]
      }).select('user');

      resolvedCustomerIds = [...new Set(schemeCustomers.map((item) => item.user?.toString()).filter(Boolean))];
    }

    if (!resolvedCustomerIds.length) {
      return res.status(400).json({ success: false, message: 'No customers found for the selected assignment rule.' });
    }

    // For each customer, upsert an assignment (avoid duplicates)
    const ops = resolvedCustomerIds.map(custId => ({
      updateOne: {
        filter: { agent: agentId, customer: custId },
        update: { $set: { agent: agentId, customer: custId, active: true, assignedAt: new Date(), assignmentType, area: area || '', scheme: schemeId || null } },
        upsert: true,
      },
    }));

    await AgentAssignment.bulkWrite(ops);

    res.status(200).json({
      success: true,
      message: `${resolvedCustomerIds.length} customer(s) assigned successfully.`,
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
