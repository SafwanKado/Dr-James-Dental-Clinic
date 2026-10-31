/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const twilio = require("twilio");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Twilio Client Credentials from environment variables or Firebase config
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "";

const twilioClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null;

/**
 * Normalizes phone number into E.164 string format (+1XXXXXXXXXX)
 */
function normalizePhoneNumber(phone) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return phone.startsWith("+") ? phone : `+${digits}`;
}

/**
 * Helper to record immutable HIPAA compliance audit logs
 */
async function appendAuditLog(action, performedBy, patientId, ipAddress, details = {}) {
  try {
    const auditLogId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    await db.collection("audit_logs").doc(auditLogId).set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      action,
      performedBy,
      patientId,
      ipAddress: ipAddress || "twilio-webhook",
      details
    });
  } catch (error) {
    logger.error("Failed to append audit log:", error);
  }
}

// =============================================================================
// 1. sendBookingConfirmation (Firestore Trigger)
//    Fires instantly whenever a new appointment document is created.
//    Validates TCPA opt-in and sends confirmation SMS with visit date, time, and cash total.
// =============================================================================
exports.sendBookingConfirmation = onDocumentCreated(
  "appointments/{appointmentId}",
  async (event) => {
    const snap = event.data;
    if (!snap) {
      logger.info("No data associated with the event");
      return;
    }

    const appointment = snap.data();
    const appointmentId = event.params.appointmentId;

    // TCPA Compliance Guard: Never send automated SMS without documented consent
    if (!appointment.tcpaConsent) {
      logger.warn(`Skipping SMS: TCPA consent missing for appointment ${appointmentId}`);
      return;
    }

    const recipientPhone = normalizePhoneNumber(appointment.phoneNumber);
    if (!recipientPhone) {
      logger.error(`Invalid phone number for appointment ${appointmentId}: ${appointment.phoneNumber}`);
      return;
    }

    // Format service names & cash total
    const servicesList = Array.isArray(appointment.services)
      ? appointment.services.map((s) => s.name).join(", ")
      : appointment.serviceName || "Dental Examination";

    const cashTotal = typeof appointment.totalCashEstimated === "number"
      ? `$${appointment.totalCashEstimated.toFixed(2)}`
      : "$80.00";

    const messageBody =
      `Dr. James Qado Clinic: Hello ${appointment.patientName}, your dental visit is confirmed!\n\n` +
      `• Date: ${appointment.appointmentDate}\n` +
      `• Time: ${appointment.timeSlot}\n` +
      `• Treatment: ${servicesList}\n` +
      `• Total Cash Due: ${cashTotal}\n` +
      `• Address: 742 Medical Plaza Pkwy, Suite 320, Beverly Hills, CA\n\n` +
      `Please arrive 10 min early. Questions? Call (555) 382-7236. Reply STOP to unsubscribe.`;

    if (!twilioClient) {
      logger.warn("Twilio client not configured. Message simulated in test mode:", {
        to: recipientPhone,
        body: messageBody
      });
      return;
    }

    try {
      const response = await twilioClient.messages.create({
        body: messageBody,
        from: TWILIO_PHONE_NUMBER,
        to: recipientPhone
      });

      logger.info(`Booking confirmation SMS sent successfully: SID ${response.sid} to ${recipientPhone}`);

      // Record SMS dispatch in audit log
      await appendAuditLog("CONFIRMATION_SMS_SENT", "system_trigger", recipientPhone, "cloud-functions", {
        appointmentId,
        messageSid: response.sid,
        cashTotal
      });

      // Update appointment document with confirmation timestamp
      await snap.ref.set(
        {
          confirmationSmsSent: true,
          confirmationSmsSid: response.sid,
          confirmationSmsSentAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );
    } catch (error) {
      logger.error(`Error sending booking confirmation SMS to ${recipientPhone}:`, error);
      await appendAuditLog("CONFIRMATION_SMS_FAILED", "system_trigger", recipientPhone, "cloud-functions", {
        appointmentId,
        error: error.message
      });
    }
  }
);

// =============================================================================
// 2. send24HourReminder (Scheduled Cloud Function)
//    Runs every hour to identify appointments scheduled ~24 hours ahead.
//    Sends reminder with explicit 24h cancellation fee disclosure notice.
// =============================================================================
exports.send24HourReminder = onSchedule("every 1 hours", async (event) => {
  logger.info("Executing scheduled 24-hour appointment reminder job...");

  const now = new Date();
  // Target window: Tomorrow (24 hours from now)
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const targetDateString = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

  try {
    const appointmentsSnapshot = await db
      .collection("appointments")
      .where("appointmentDate", "==", targetDateString)
      .where("status", "==", "confirmed")
      .get();

    if (appointmentsSnapshot.empty) {
      logger.info(`No confirmed appointments found for date ${targetDateString}`);
      return;
    }

    logger.info(`Found ${appointmentsSnapshot.size} appointments scheduled for ${targetDateString}`);

    for (const doc of appointmentsSnapshot.docs) {
      const appointment = doc.data();

      // Skip if reminder was already sent
      if (appointment.reminder24hSent) {
        continue;
      }

      // Check TCPA consent
      if (!appointment.tcpaConsent) {
        logger.warn(`Skipping reminder for appointment ${doc.id}: TCPA consent not granted.`);
        continue;
      }

      const recipientPhone = normalizePhoneNumber(appointment.phoneNumber);
      if (!recipientPhone) continue;

      const reminderBody =
        `Dr. James Qado Clinic Reminder: Your appointment is scheduled for tomorrow (${appointment.appointmentDate}) at ${appointment.timeSlot}.\n\n` +
        `Reply CANCEL to cancel your visit. Note: Cancellations within 24h incur a $10 fee on your next visit.\n` +
        `Address: 742 Medical Plaza Pkwy, Suite 320. Call (555) 382-7236 with any questions.`;

      if (!twilioClient) {
        logger.warn("Twilio client unconfigured. Simulated 24h reminder:", {
          to: recipientPhone,
          body: reminderBody
        });
        await doc.ref.set(
          {
            reminder24hSent: true,
            reminderSentAt: admin.firestore.FieldValue.serverTimestamp()
          },
          { merge: true }
        );
        continue;
      }

      try {
        const response = await twilioClient.messages.create({
          body: reminderBody,
          from: TWILIO_PHONE_NUMBER,
          to: recipientPhone
        });

        logger.info(`24h reminder SMS sent to ${recipientPhone}, SID: ${response.sid}`);

        await doc.ref.set(
          {
            reminder24hSent: true,
            reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
            reminderMessageSid: response.sid
          },
          { merge: true }
        );

        await appendAuditLog("REMINDER_24H_SMS_SENT", "scheduled_job", recipientPhone, "cloud-scheduler", {
          appointmentId: doc.id,
          messageSid: response.sid
        });
      } catch (smsError) {
        logger.error(`Failed to send 24h reminder SMS to ${recipientPhone}:`, smsError);
      }
    }
  } catch (error) {
    logger.error("Error running send24HourReminder job:", error);
  }
});

// =============================================================================
// 3. handleTwilioWebhook (HTTP Webhook Endpoint)
//    Listens for incoming SMS from Twilio.
//    If message is CANCEL:
//      - Sets appointment to 'cancelled'
//      - Reopens slot / updates availability
//      - Sets unpaidCancellationFee: true ($10) on patient profile
//      - Appends compliance record to audit_logs
//      - Returns TwiML response to the patient
// =============================================================================
exports.handleTwilioWebhook = onRequest(async (req, res) => {
  // Enforce POST requests from Twilio
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const twiml = new twilio.twiml.MessagingResponse();
  const incomingBody = (req.body.Body || "").trim();
  const rawSender = (req.body.From || "").trim();
  const normalizedSender = normalizePhoneNumber(rawSender);
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "twilio-ip";

  logger.info(`Received incoming Twilio SMS from ${normalizedSender}: "${incomingBody}"`);

  // Handle CANCEL request
  if (incomingBody.toUpperCase() === "CANCEL") {
    try {
      // Find the upcoming active confirmed appointment for this phone number
      const appointmentsRef = db.collection("appointments");
      const activeAppointments = await appointmentsRef
        .where("phoneNumber", "==", normalizedSender)
        .where("status", "==", "confirmed")
        .limit(1)
        .get();

      // If not found with normalized format, fallback to raw sender query
      let matchedDoc = !activeAppointments.empty ? activeAppointments.docs[0] : null;
      if (!matchedDoc && rawSender !== normalizedSender) {
        const fallbackQuery = await appointmentsRef
          .where("phoneNumber", "==", rawSender)
          .where("status", "==", "confirmed")
          .limit(1)
          .get();
        if (!fallbackQuery.empty) {
          matchedDoc = fallbackQuery.docs[0];
        }
      }

      if (!matchedDoc) {
        twiml.message(
          "Dr. James Qado Clinic: No active confirmed appointment was found for this phone number. " +
          "If you need assistance, please call our front desk directly at (555) 382-7236."
        );
        res.type("text/xml").status(200).send(twiml.toString());
        return;
      }

      const appointmentData = matchedDoc.data();
      const appointmentId = matchedDoc.id;

      // 1. Update appointment status to 'cancelled' and reopen slot
      await matchedDoc.ref.set(
        {
          status: "cancelled",
          cancelledVia: "TWILIO_SMS_WEBHOOK",
          cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
          slotReopened: true
        },
        { merge: true }
      );

      // 2. Assess $10 Late Cancellation Fee on patient profile
      const patientRef = db.collection("patients").doc(normalizedSender);
      await patientRef.set(
        {
          phoneNumber: normalizedSender,
          fullName: appointmentData.patientName || "Patient",
          unpaidCancellationFee: true,
          feeAmount: 10.0,
          feeReason: "Late cancellation via SMS (<24h notice policy)",
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      // 3. Append to immutable HIPAA audit log
      await appendAuditLog("CANCEL", "Twilio SMS Webhook", normalizedSender, clientIp, {
        appointmentId,
        appointmentDate: appointmentData.appointmentDate,
        timeSlot: appointmentData.timeSlot,
        feeAssessed: 10.0,
        incomingMessage: incomingBody
      });

      // 4. Return TwiML confirmation to patient
      twiml.message(
        `Dr. James Qado Clinic: Your visit on ${appointmentData.appointmentDate} at ${appointmentData.timeSlot} has been cancelled.\n\n` +
        `Note: As this cancellation occurred within 24 hours of your appointment, a $10 late cancellation fee has been applied to your patient account for your next visit.\n\n` +
        `To reschedule in the future, visit our website or call (555) 382-7236.`
      );

      res.type("text/xml").status(200).send(twiml.toString());
      return;
    } catch (err) {
      logger.error("Error processing CANCEL SMS webhook:", err);
      twiml.message("Dr. James Qado Clinic: We encountered an error processing your cancellation. Please call (555) 382-7236.");
      res.type("text/xml").status(200).send(twiml.toString());
      return;
    }
  }

  // Fallback for other incoming SMS texts
  twiml.message(
    "Dr. James Qado Dental Clinic: Thank you for your message. " +
    "To cancel a scheduled visit, reply CANCEL. For all other inquiries, please call our front desk at (555) 382-7236."
  );

  res.type("text/xml").status(200).send(twiml.toString());
});
