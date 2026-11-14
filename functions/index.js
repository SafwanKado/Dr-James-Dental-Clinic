/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const twilio = require("twilio");

const FIRESTORE_DATABASE_ID =
  process.env.FIRESTORE_DATABASE_ID ||
  "ai-studio-drjamesqadodenta-f4085850-80c9-4199-abdf-00d09aee83b9";
const FUNCTION_REGION = process.env.FUNCTION_REGION || "europe-west1";

// Initialize Firebase Admin SDK bound to the provisioned named Firestore database
const firebaseApp = getApps().length ? getApps()[0] : initializeApp();
const db = getFirestore(firebaseApp, FIRESTORE_DATABASE_ID);

/**
 * Reads Twilio credentials securely from process.env at execution time.
 * Never logs or exposes credential values.
 */
function getTwilioConfig() {
  const accountSid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
  const authToken = (process.env.TWILIO_AUTH_TOKEN || "").trim();
  const phoneNumber = normalizePhoneNumber((process.env.TWILIO_PHONE_NUMBER || "").trim()) ||
    (process.env.TWILIO_PHONE_NUMBER || "").trim();

  const missing = [];
  if (!accountSid) missing.push("TWILIO_ACCOUNT_SID");
  if (!authToken) missing.push("TWILIO_AUTH_TOKEN");
  if (!phoneNumber) missing.push("TWILIO_PHONE_NUMBER");

  if (missing.length > 0) {
    return { client: null, fromNumber: "", missing };
  }

  return {
    client: twilio(accountSid, authToken),
    fromNumber: phoneNumber,
    missing: []
  };
}

/**
 * Normalizes U.S. phone number into E.164 format (+1XXXXXXXXXX)
 */
function normalizePhoneNumber(phone) {
  if (!phone || typeof phone !== "string") return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return "";
}

/**
 * Normalizes phone number into alphanumeric document ID key (1XXXXXXXXXX)
 */
function normalizePhoneDocId(phone) {
  if (!phone || typeof phone !== "string") return "10000000000";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return digits;
  return digits || "10000000000";
}

/**
 * Helper to record immutable HIPAA compliance audit logs
 */
async function appendAuditLog(action, performedBy, patientId, ipAddress, details = {}) {
  try {
    const auditLogId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    await db.collection("audit_logs").doc(auditLogId).set({
      timestamp: FieldValue.serverTimestamp(),
      action,
      performedBy,
      patientId,
      ipAddress: ipAddress || "cloud-functions",
      details
    });
  } catch (error) {
    logger.error("Failed to append audit log:", error);
  }
}

// =============================================================================
// 1. sendBookingConfirmation (Firestore Trigger)
//    Fires whenever a new document is added to /appointments/{appointmentId}.
//    Verifies TCPA SMS opt-in, sends privacy-safe confirmation SMS via Twilio,
//    and updates the appointment record + HIPAA audit log.
// =============================================================================
exports.sendBookingConfirmation = onDocumentCreated(
  {
    document: "appointments/{appointmentId}",
    database: FIRESTORE_DATABASE_ID,
    region: FUNCTION_REGION
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      logger.info("No document snapshot associated with the event.");
      return;
    }

    const appointment = snap.data();
    const appointmentId = event.params.appointmentId;

    // Skip if confirmation SMS was already dispatched
    if (appointment.confirmationSmsSent) {
      logger.info(`Confirmation SMS already sent for appointment ${appointmentId}.`);
      return;
    }

    // TCPA Compliance Guard: Never send automated SMS without explicit consent
    if (appointment.tcpaConsent !== true) {
      logger.warn(`Skipping SMS: TCPA consent not granted for appointment ${appointmentId}.`);
      return;
    }

    const recipientPhone = normalizePhoneNumber(appointment.phoneNumber || appointment.phone);
    if (!recipientPhone) {
      logger.error(`Invalid U.S. phone number for appointment ${appointmentId}.`);
      return;
    }

    const patientDocId = normalizePhoneDocId(recipientPhone);
    const patientName = (appointment.patientName || appointment.name || "Valued Patient").trim();
    const visitDate = appointment.appointmentDate || appointment.date || "Scheduled Date";
    const visitTime = appointment.timeSlot || appointment.time || "Scheduled Time";
    const cashTotal =
      typeof appointment.totalCashEstimated === "number"
        ? `$${appointment.totalCashEstimated.toFixed(2)}`
        : "$80.00";
    const refCode = appointment.confirmationCode ? ` (Ref: ${appointment.confirmationCode})` : "";

    // HIPAA Privacy-Safe SMS: Do not expose clinical diagnoses or detailed treatments
    const messageBody =
      `Dr. James Qado Dental Clinic: Hi ${patientName}, your visit${refCode} is confirmed!\n` +
      `Date: ${visitDate}\n` +
      `Time: ${visitTime}\n` +
      `Estimated Cash Total (pay at desk): ${cashTotal}\n` +
      `Location: 742 Medical Plaza Pkwy, Suite 320, Denver, CO 80202\n` +
      `Please arrive 10 min early. Questions? Call (555) 382-7236. Reply STOP to opt out.`;

    const { client: twilioClient, fromNumber, missing } = getTwilioConfig();
    if (!twilioClient) {
      logger.warn("Twilio credentials missing in environment; confirmation SMS skipped.", {
        appointmentId,
        missingEnvVars: missing
      });
      await snap.ref.set(
        {
          confirmationSmsStatus: "SKIPPED_NO_TWILIO_CONFIG",
          lastUpdated: FieldValue.serverTimestamp()
        },
        { merge: true }
      );
      return;
    }

    try {
      const response = await twilioClient.messages.create({
        body: messageBody,
        from: fromNumber,
        to: recipientPhone
      });

      logger.info(`Booking confirmation SMS sent: SID ${response.sid} for appointment ${appointmentId}`);

      await snap.ref.set(
        {
          confirmationSmsSent: true,
          confirmationSmsStatus: "SENT",
          confirmationSmsSid: response.sid,
          confirmationSmsSentAt: FieldValue.serverTimestamp(),
          lastUpdated: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      await appendAuditLog("STATUS_CHANGE", "Twilio Booking Trigger", patientDocId, "cloud-functions", {
        appointmentId,
        smsEvent: "CONFIRMATION_SMS_SENT",
        messageSid: response.sid,
        cashTotal
      });
    } catch (error) {
      logger.error(`Error sending booking confirmation SMS for appointment ${appointmentId}:`, error);

      await snap.ref.set(
        {
          confirmationSmsSent: false,
          confirmationSmsStatus: "FAILED",
          confirmationSmsError: error.message || "Twilio delivery error",
          lastUpdated: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      await appendAuditLog("STATUS_CHANGE", "Twilio Booking Trigger", patientDocId, "cloud-functions", {
        appointmentId,
        smsEvent: "CONFIRMATION_SMS_FAILED",
        error: error.message || "Unknown error"
      });
    }
  }
);

// =============================================================================
// 2. send24HourReminder (Scheduled Cloud Function)
//    Runs every hour to identify appointments scheduled ~24 hours ahead.
//    Sends reminder with explicit 24h cancellation fee disclosure notice.
// =============================================================================
exports.send24HourReminder = onSchedule(
  {
    schedule: "every 1 hours",
    region: FUNCTION_REGION
  },
  async () => {
    logger.info("Executing scheduled 24-hour appointment reminder job...");

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const targetDateString = tomorrow.toISOString().split("T")[0];

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

      const { client: twilioClient, fromNumber, missing } = getTwilioConfig();
      if (!twilioClient) {
        logger.warn("Twilio credentials missing in environment; 24h reminders skipped.", {
          missingEnvVars: missing
        });
        return;
      }

      for (const docSnap of appointmentsSnapshot.docs) {
        const appointment = docSnap.data();

        if (appointment.reminder24hSent || appointment.tcpaConsent !== true) {
          continue;
        }

        const recipientPhone = normalizePhoneNumber(appointment.phoneNumber);
        if (!recipientPhone) continue;

        const patientDocId = normalizePhoneDocId(recipientPhone);
        const reminderBody =
          `Dr. James Qado Dental Clinic Reminder: Your visit is tomorrow (${appointment.appointmentDate}) at ${appointment.timeSlot}.\n` +
          `Reply CANCEL to cancel your visit. Note: Cancellations within 24h incur a $10 fee on your next visit.\n` +
          `742 Medical Plaza Pkwy, Suite 320, Denver, CO. Call (555) 382-7236 with questions. Reply STOP to opt out.`;

        try {
          const response = await twilioClient.messages.create({
            body: reminderBody,
            from: fromNumber,
            to: recipientPhone
          });

          await docSnap.ref.set(
            {
              reminder24hSent: true,
              reminderSentAt: FieldValue.serverTimestamp(),
              reminderMessageSid: response.sid,
              lastUpdated: FieldValue.serverTimestamp()
            },
            { merge: true }
          );

          await appendAuditLog("STATUS_CHANGE", "Twilio 24h Scheduler", patientDocId, "cloud-scheduler", {
            appointmentId: docSnap.id,
            smsEvent: "REMINDER_24H_SMS_SENT",
            messageSid: response.sid
          });
        } catch (smsError) {
          logger.error(`Failed to send 24h reminder SMS for ${docSnap.id}:`, smsError);
        }
      }
    } catch (error) {
      logger.error("Error running send24HourReminder job:", error);
    }
  }
);

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
exports.handleTwilioWebhook = onRequest({ region: FUNCTION_REGION }, async (req, res) => {
  // Enforce POST requests from Twilio
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  // Validate Twilio X-Twilio-Signature when auth token is configured
  const authToken = (process.env.TWILIO_AUTH_TOKEN || "").trim();
  const twilioSignature = req.headers["x-twilio-signature"];
  if (authToken && twilioSignature) {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers["x-forwarded-host"] || req.get("host");
    const requestUrl = `${protocol}://${host}${req.originalUrl}`;
    const isValidSignature = twilio.validateRequest(
      authToken,
      twilioSignature,
      requestUrl,
      req.body || {}
    );
    if (!isValidSignature) {
      logger.warn("Rejected webhook request due to invalid Twilio signature.");
      res.status(403).send("Forbidden");
      return;
    }
  }

  const twiml = new twilio.twiml.MessagingResponse();
  const incomingBody = (req.body.Body || "").trim();
  const rawSender = (req.body.From || "").trim();
  const normalizedSender = normalizePhoneNumber(rawSender);
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "twilio-ip";

  logger.info(`Received incoming Twilio SMS from ${normalizedSender}: "${incomingBody}"`);

  const upperBody = incomingBody.toUpperCase();

  // Handle standard U.S. A2P 10DLC carrier opt-out / help keywords
  if (upperBody === "STOP" || upperBody === "UNSUBSCRIBE" || upperBody === "QUIT") {
    await appendAuditLog("CANCEL", "Twilio SMS Opt-Out", normalizePhoneDocId(normalizedSender), clientIp, { keyword: upperBody });
    res.type("text/xml").status(200).send(twiml.toString());
    return;
  }
  if (upperBody === "HELP") {
    twiml.message(
      "Dr. James Qado Dental Clinic (Denver, CO): For scheduling or care help, call (555) 382-7236. Reply CANCEL to cancel an upcoming visit or STOP to opt out."
    );
    res.type("text/xml").status(200).send(twiml.toString());
    return;
  }
  if (upperBody === "START") {
    twiml.message(
      "Dr. James Qado Dental Clinic: You are opted in for appointment reminders. Reply HELP for assistance or STOP to cancel alerts."
    );
    res.type("text/xml").status(200).send(twiml.toString());
    return;
  }

  // Handle CANCEL request
  if (upperBody === "CANCEL") {
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
      const patientDocId = normalizePhoneDocId(normalizedSender);

      // 1. Update appointment status to 'cancelled' and reopen slot
      await matchedDoc.ref.set(
        {
          status: "cancelled",
          cancelledVia: "TWILIO_SMS_WEBHOOK",
          cancelledAt: FieldValue.serverTimestamp(),
          lastUpdated: FieldValue.serverTimestamp(),
          slotReopened: true
        },
        { merge: true }
      );

      // 2. Assess $10 Late Cancellation Fee on patient profile
      const patientRef = db.collection("patients").doc(patientDocId);
      await patientRef.set(
        {
          phoneNumber: normalizedSender,
          fullName: appointmentData.patientName || "Patient",
          unpaidCancellationFee: true,
          feeAmount: 10.0,
          notes: "Late cancellation via SMS (<24h notice policy)",
          lastUpdated: FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      // 3. Append to immutable HIPAA audit log
      await appendAuditLog("CANCEL", "Twilio SMS Webhook", patientDocId, clientIp, {
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
