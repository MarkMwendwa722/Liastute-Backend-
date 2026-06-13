const express = require("express");
const router = express.Router();

const { sendEmail } = require("../controllers/emailController");
const { sendEmailValidator } = require("../validators/emailValidator");

// POST /api/send-email
// Sends a transactional email to the recipient specified in the request body.
router.post("/", sendEmailValidator, sendEmail);

module.exports = router;
