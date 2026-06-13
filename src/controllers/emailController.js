const { Resend } = require("resend");
const { validationResult } = require("express-validator");

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_FROM_EMAIL = "Liastute Orders <onboarding@resend.dev>";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    const err = new Error("RESEND_API_KEY is not configured.");
    err.status = 500;
    throw err;
  }
  return new Resend(process.env.RESEND_API_KEY);
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatMoney = (value) => Number(value || 0).toFixed(2);

const formatAddress = (address = {}) => {
  if (typeof address === "string") return address;
  return [
    address.street,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
};

// ─── Core send helper ─────────────────────────────────────────────────────────

/**
 * Sends an email via Resend. Always uses RESEND_FROM_EMAIL (or the Resend
 * onboarding address as a fallback) as the sender so the "from" address can
 * never be spoofed by a client request.
 *
 * @param {object} payload  Fields forwarded to Resend (to, subject, html, text, replyTo).
 *                          `from` is injected here and cannot come from the caller.
 */
const sendResendEmail = async (payload) => {
  const { data, error } = await getResendClient().emails.send(payload);

  if (error) {
    console.error("[Resend error]", error);
    const err = new Error(error.message || "Email could not be sent.");
    err.status = error.statusCode || 502;
    err.expose = true; // mark as safe to show to client
    throw err;
  }

  return data;
};

// ─── POST /api/send-email ─────────────────────────────────────────────────────

/**
 * Sends a transactional email to a recipient specified by the frontend.
 *
 * Request body:
 *   to       {string}  Recipient email address (required)
 *   subject  {string}  Email subject line (required)
 *   html     {string}  HTML email body (required if `text` is absent)
 *   text     {string}  Plain-text email body (required if `html` is absent)
 *   replyTo  {string}  Reply-to address (optional)
 *   name     {string}  Sender display name, e.g. "Liastute Support" (optional)
 *
 * Response 200:
 *   { success: true, message: "Email sent successfully.", id: "<resend-id>" }
 */
const sendEmail = async (req, res, next) => {
  try {
    // 1. Validate inputs (express-validator)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { to, subject, html, text, replyTo, name } = req.body;

    // 2. At least one content type must be present
    if (!html && !text) {
      return res.status(400).json({
        success: false,
        message: "Either html or text email content is required.",
      });
    }

    // 3. Ensure API key is configured before going further
    if (!process.env.RESEND_API_KEY) {
      console.error(
        "[Email] RESEND_API_KEY is not set in environment variables.",
      );
      return res.status(500).json({
        success: false,
        message: "Email service is not configured. Please contact support.",
      });
    }

    // 4. Build the Resend payload
    const fromAddress = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;
    const fromField = name ? `${name} <${fromAddress}>` : fromAddress;

    const payload = {
      from: fromField,
      to: [to],
      subject,
      ...(html && { html }),
      ...(text && { text }),
      ...(replyTo && { replyTo: [replyTo] }),
    };

    // 5. Send via Resend
    const data = await sendResendEmail(payload);

    return res.status(200).json({
      success: true,
      message: "Email sent successfully.",
      id: data?.id,
    });
  } catch (err) {
    console.error("[sendEmail error]", err.message);
    return next(err);
  }
};

// ─── Internal: order notification ─────────────────────────────────────────────

/**
 * Sends a new-order notification to the store owner.
 * Called internally by the orders controller — not exposed via HTTP directly.
 */
const sendOrderNotification = async ({
  order,
  items = [],
  user,
  sourceUrl,
}) => {
  const recipient = process.env.ORDER_EMAIL;
  if (!recipient) {
    console.warn("ORDER_EMAIL is not set — skipping order notification email.");
    return null;
  }

  const orderJson = typeof order.toJSON === "function" ? order.toJSON() : order;

  const itemRows = items
    .map((item) => {
      const i = typeof item.toJSON === "function" ? item.toJSON() : item;
      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(i.productName)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(i.productSku || "-")}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${escapeHtml(i.quantity)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${formatMoney(i.unitPrice)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${formatMoney(i.totalPrice)}</td>
        </tr>`;
    })
    .join("");

  const customerName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Customer";
  const customerEmail = user?.email || "Not provided";
  const customerPhone = user?.phone || "Not provided";
  const shippingAddress = formatAddress(orderJson.shippingAddress);
  const subject = `New order received: ${orderJson.orderNumber}`;

  const sourceUrlHtml = sourceUrl
    ? `<p><strong>Source URL:</strong><br><a href="${escapeHtml(sourceUrl)}">${escapeHtml(sourceUrl)}</a></p>`
    : "";
  const sourceUrlText = sourceUrl ? `\nSource URL: ${sourceUrl}` : "";

  const textItems = items
    .map((item) => {
      const i = typeof item.toJSON === "function" ? item.toJSON() : item;
      return `- ${i.productName} (${i.productSku || "no SKU"}) x${i.quantity}: $${formatMoney(i.totalPrice)}`;
    })
    .join("\n");

  return sendResendEmail({
    to: [recipient],
    subject,
    text: [
      `A new order has been placed: ${orderJson.orderNumber}`,
      "",
      `Customer: ${customerName}`,
      `Email: ${customerEmail}`,
      `Phone: ${customerPhone}`,
      `Shipping address: ${shippingAddress}`,
      "",
      "Items:",
      textItems,
      "",
      `Subtotal: $${formatMoney(orderJson.subtotal)}`,
      `Tax: $${formatMoney(orderJson.tax)}`,
      `Shipping: $${formatMoney(orderJson.shippingCost)}`,
      `Total: $${formatMoney(orderJson.total)}`,
      sourceUrlText,
      `Notes: ${orderJson.notes || "None"}`,
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;color:#222;line-height:1.5;">
        <h2 style="margin:0 0 12px;">New order received</h2>
        <p><strong>Order:</strong> ${escapeHtml(orderJson.orderNumber)}</p>
        <p>
          <strong>Customer:</strong> ${escapeHtml(customerName)}<br>
          <strong>Email:</strong> ${escapeHtml(customerEmail)}<br>
          <strong>Phone:</strong> ${escapeHtml(customerPhone)}
        </p>
        <p><strong>Shipping address:</strong><br>${escapeHtml(shippingAddress)}</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0;">
          <thead>
            <tr>
              <th style="padding:8px;border-bottom:2px solid #ddd;text-align:left;">Product</th>
              <th style="padding:8px;border-bottom:2px solid #ddd;text-align:left;">SKU</th>
              <th style="padding:8px;border-bottom:2px solid #ddd;text-align:center;">Qty</th>
              <th style="padding:8px;border-bottom:2px solid #ddd;text-align:right;">Unit</th>
              <th style="padding:8px;border-bottom:2px solid #ddd;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <p>
          <strong>Subtotal:</strong> $${formatMoney(orderJson.subtotal)}<br>
          <strong>Tax:</strong> $${formatMoney(orderJson.tax)}<br>
          <strong>Shipping:</strong> $${formatMoney(orderJson.shippingCost)}<br>
          <strong>Total:</strong> $${formatMoney(orderJson.total)}
        </p>
        ${sourceUrlHtml}
        <p><strong>Notes:</strong> ${escapeHtml(orderJson.notes || "None")}</p>
      </div>
    `,
  });
};

module.exports = { sendEmail, sendOrderNotification };
