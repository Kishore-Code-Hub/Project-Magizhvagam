const Enquiry = require('../models/Enquiry');
const { logActivity } = require('../services/auditService');

// @desc    Get all enquiries
// @route   GET /api/contact
// @access  Private/Admin
exports.getEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, enquiries });
  } catch (error) {
    res.status(500).json({ success: false, error: `Server error retrieving enquiries: ${error.message}` });
  }
};

// @desc    Mark enquiry as read
// @route   PUT /api/contact/:id/read
// @access  Private/Admin
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const enquiry = await Enquiry.findById(id);

    if (!enquiry) {
      return res.status(404).json({ success: false, error: 'Enquiry not found.' });
    }

    enquiry.status = 'read';
    await enquiry.save();

    // Log the admin activity
    try {
      await logActivity(req, 'mark_enquiry_read', `Marked enquiry from ${enquiry.email} as read`);
    } catch (logErr) {
      console.error(`[Enquiry Controller] Failed to log activity: ${logErr.message}`);
    }

    res.status(200).json({ success: true, message: 'Enquiry marked as read successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: `Server error marking enquiry as read: ${error.message}` });
  }
};
