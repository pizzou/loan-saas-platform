package com.patrick.fintech.loan_backend.service;

import com.patrick.fintech.loan_backend.model.Loan;
import com.patrick.fintech.loan_backend.model.Payment;
import com.patrick.fintech.loan_backend.model.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class NotificationService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:noreply@loansaas.com}")
    private String fromAddress;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Async
    public void sendLoanApproved(Loan loan) {
        if (loan.getBorrower() == null) return;
        String to = loan.getBorrower().getEmail();
        log.info("[NOTIFY] Loan approved — borrower={} {} amount={} {}",
            loan.getBorrower().getFirstName(), loan.getBorrower().getLastName(),
            loan.getCurrency(), loan.getAmount());
        if (to == null) return;
        String html = buildHtml("Loan Approved",
            "Dear " + loan.getBorrower().getFirstName() + ",",
            "<p>Your loan of <strong>" + loan.getCurrency() + " " +
            String.format("%.2f", loan.getAmount()) + "</strong> has been approved.</p>" +
            "<p>Duration: <strong>" + loan.getDurationMonths() + " months</strong>.</p>" +
            "<p>Your repayment schedule is now available in your dashboard.</p>",
            frontendUrl + "/dashboard/loans");
        sendHtmlEmail(to, "Your loan has been approved", html);
    }

    @Async
    public void sendLoanRejected(Loan loan) {
        if (loan.getBorrower() == null) return;
        String to = loan.getBorrower().getEmail();
        log.info("[NOTIFY] Loan rejected — borrower={} {} reason={}",
            loan.getBorrower().getFirstName(), loan.getBorrower().getLastName(),
            loan.getRejectionReason());
        if (to == null) return;
        String html = buildHtml("Loan Application Update",
            "Dear " + loan.getBorrower().getFirstName() + ",",
            "<p>We were unable to approve your loan application at this time.</p>" +
            (loan.getRejectionReason() != null ?
                "<p><strong>Reason:</strong> " + loan.getRejectionReason() + "</p>" : "") +
            "<p>Please contact your loan officer for more information.</p>",
            frontendUrl + "/dashboard");
        sendHtmlEmail(to, "Update on your loan application", html);
    }

    @Async
    public void sendPaymentDueReminder(Payment payment) {
        if (payment.getLoan() == null || payment.getLoan().getBorrower() == null) return;
        String to = payment.getLoan().getBorrower().getEmail();
        log.info("[NOTIFY] Payment due — borrower={} {} dueDate={} amount={}",
            payment.getLoan().getBorrower().getFirstName(),
            payment.getLoan().getBorrower().getLastName(),
            payment.getDueDate(), payment.getAmount());
        if (to == null) return;
        String html = buildHtml("Payment Reminder",
            "Dear " + payment.getLoan().getBorrower().getFirstName() + ",",
            "<p>Your payment of <strong>" + String.format("%.2f", payment.getAmount()) +
            "</strong> is due on <strong>" + payment.getDueDate() + "</strong>.</p>" +
            "<p>Please pay on time to avoid late penalties.</p>",
            frontendUrl + "/dashboard/payments");
        sendHtmlEmail(to, "Payment reminder — due " + payment.getDueDate(), html);
    }

    @Async
    public void sendPaymentConfirmation(Payment payment) {
        if (payment.getLoan() == null || payment.getLoan().getBorrower() == null) return;
        String to = payment.getLoan().getBorrower().getEmail();
        log.info("[NOTIFY] Payment confirmed — borrower={} {} amount={} paidDate={}",
            payment.getLoan().getBorrower().getFirstName(),
            payment.getLoan().getBorrower().getLastName(),
            payment.getAmount(), payment.getPaidDate());
        if (to == null) return;
        String html = buildHtml("Payment Confirmed",
            "Dear " + payment.getLoan().getBorrower().getFirstName() + ",",
            "<p>We received your payment of <strong>" +
            String.format("%.2f", payment.getAmount()) +
            "</strong> on <strong>" + payment.getPaidDate() + "</strong>. Thank you.</p>",
            frontendUrl + "/dashboard/payments");
        sendHtmlEmail(to, "Payment received — thank you", html);
    }

    @Async
    public void sendOverdueAlert(Payment payment) {
        if (payment.getLoan() == null || payment.getLoan().getBorrower() == null) return;
        String to = payment.getLoan().getBorrower().getEmail();
        long daysLate = java.time.temporal.ChronoUnit.DAYS.between(
            payment.getDueDate(), java.time.LocalDate.now());
        log.warn("[NOTIFY] Payment OVERDUE — borrower={} {} daysLate={} penalty={}",
            payment.getLoan().getBorrower().getFirstName(),
            payment.getLoan().getBorrower().getLastName(),
            daysLate, payment.getPenalty());
        if (to == null) return;
        String html = buildHtml("Overdue Payment",
            "Dear " + payment.getLoan().getBorrower().getFirstName() + ",",
            "<p style=\"color:#dc2626\">Your payment of <strong>" +
            String.format("%.2f", payment.getAmount()) +
            "</strong> was due on <strong>" + payment.getDueDate() +
            "</strong> and is now <strong>" + daysLate + " day(s) overdue</strong>.</p>" +
            "<p>A late penalty of <strong>" + String.format("%.2f", payment.getPenalty()) +
            "</strong> has been applied. Please make payment immediately.</p>",
            frontendUrl + "/dashboard/payments");
        sendHtmlEmail(to, "URGENT: Overdue payment — " + daysLate + " days late", html);
    }

    @Async
    public void sendPasswordResetEmail(User user, String resetLink) {
        log.info("[NOTIFY] Password reset for user={}", user.getEmail());
        String html = buildHtml("Reset Your Password",
            "Hello " + user.getName() + ",",
            "<p>You requested a password reset. Click the button below.</p>" +
            "<p>This link expires in <strong>1 hour</strong>.</p>" +
            "<p>If you did not request this, ignore this email.</p>",
            resetLink, "Reset Password");
        sendHtmlEmail(user.getEmail(), "Reset your LoanSaaS password", html);
    }

    private void sendHtmlEmail(String to, String subject, String html) {
        if (!mailEnabled) {
            log.info("[EMAIL DISABLED] Would send to={} subject={}", to, subject);
            return;
        }
        if (mailSender == null) {
            log.warn("[EMAIL] mailSender not configured, skipping to={}", to);
            return;
        }
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(msg);
            log.info("[EMAIL] Sent to={} subject={}", to, subject);
        } catch (MessagingException e) {
            log.error("[EMAIL] Failed to send to={}: {}", to, e.getMessage());
        }
    }

    private String buildHtml(String title, String greeting, String body, String ctaUrl) {
        return buildHtml(title, greeting, body, ctaUrl, "View Dashboard");
    }

    private String buildHtml(String title, String greeting, String body,
                              String ctaUrl, String ctaText) {
        return "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"></head><body " +
            "style=\"margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc\">" +
            "<div style=\"max-width:600px;margin:40px auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden\">" +
            "<div style=\"background:#1d4ed8;padding:24px 32px\">" +
            "<h1 style=\"color:#fff;margin:0;font-size:20px;font-weight:600\">LoanSaaS</h1>" +
            "<p style=\"color:#93c5fd;margin:4px 0 0;font-size:13px\">Fintech Loan Management</p>" +
            "</div>" +
            "<div style=\"padding:32px\">" +
            "<h2 style=\"color:#111827;font-size:18px;margin:0 0 8px\">" + title + "</h2>" +
            "<p style=\"color:#374151;margin:0 0 16px\">" + greeting + "</p>" +
            body +
            "<div style=\"margin:24px 0\">" +
            "<a href=\"" + ctaUrl + "\" style=\"display:inline-block;background:#1d4ed8;" +
            "color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;" +
            "font-weight:500;font-size:14px\">" + ctaText + "</a>" +
            "</div></div>" +
            "<div style=\"background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb\">" +
            "<p style=\"color:#9ca3af;font-size:12px;margin:0\">LoanSaaS &mdash; This is an automated message.</p>" +
            "</div></div></body></html>";
    }
}