const emailService = require('../services/emailService');
const Enquiry = require('../models/Enquiry');

// @desc    Submit contact enquiry
// @route   POST /api/contact
// @access  Public
exports.submitEnquiry = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Full Name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email Address is required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, error: 'Occasion or Subject is required.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message Content is required.' });
    }

    const emailLower = email.trim().toLowerCase();

    // Enforce one active enquiry policy: check for pending (unread) enquiry
    const existingEnquiry = await Enquiry.findOne({
      email: emailLower,
      status: 'unread'
    });

    if (existingEnquiry) {
      return res.status(400).json({
        success: false,
        error: 'You already have a pending enquiry. Please wait until our team reviews your previous message before sending another.'
      });
    }

    console.log(`[Contact Form] Submission received from ${name.trim()} <${emailLower}>. Subject: ${subject.trim()}`);

    // Send email using SMTP helper
    const mailResult = await emailService.sendContactEnquiryEmail({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim()
    });

    if (!mailResult.success) {
      console.error(`[Contact Form] Unable to send the Email Try Again Later: ${mailResult.error}`);
      return res.status(500).json({ success: false, error: 'Failed to deliver message via SMTP. Please try again later.' });
    }

    console.log(`[Contact Form] SMTP email dispatch succeeded.`);

    // Store in database
    const newEnquiry = new Enquiry({
      name: name.trim(),
      email: emailLower,
      subject: subject.trim(),
      message: message.trim(),
      status: 'unread'
    });
    await newEnquiry.save();

    res.status(200).json({ success: true, message: 'Your enquiry has been sent successfully!' });
  } catch (error) {
    console.error(`[Contact Form] Internal error: ${error.message}`);
    res.status(500).json({ success: false, error: `Server error processing enquiry: ${error.message}` });
  }
};
