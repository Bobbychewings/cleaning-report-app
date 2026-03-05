import emailjs from '@emailjs/browser';

// TODO: Replace with your actual EmailJS credentials
// 1. Create a free account at https://www.emailjs.com/
// 2. Add a new Email Service (e.g., connect your Gmail)
// 3. Create an Email Template with variables like {{location_name}}, {{staff_name}}, {{health_score}}, {{failed_checks}}
// 4. Get your Public Key from Account -> API Keys
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "YOUR_PUBLIC_KEY";

/**
 * Sends an email notification when an audit is completed.
 * @param {Object} reportData - The audit report data
 * @param {string} adminEmail - The email address to send the report to
 */
export async function sendAuditNotification(reportData, adminEmail) {
  // If credentials aren't set, log to console instead of failing
  if (EMAILJS_SERVICE_ID === "YOUR_SERVICE_ID") {
    console.warn("EmailJS credentials not configured. Skipping email notification.");
    console.log("Would have sent email with data:", reportData);
    return;
  }

  try {
    const templateParams = {
      to_email: adminEmail,
      location_name: reportData.locationName,
      staff_name: reportData.staffName,
      health_score: reportData.healthScore,
      total_checks: reportData.totalChecks,
      failed_checks: reportData.failedChecks,
      submission_time: new Date().toLocaleString(),
      report_link: new URL('/admin', window.location.href).href
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      { publicKey: EMAILJS_PUBLIC_KEY }
    );

    console.log('Email sent successfully!', response.status, response.text);
    return true;
  } catch (error) {
    console.error('Failed to send email...', error);
    return false;
  }
}
