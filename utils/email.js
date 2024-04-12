const { Resend } = require('resend');

const resend = new Resend('re_eBaXHi5J_Geku7DKgj4o3dLVfrb2UpCWt');

const registerEmail = (email, name) => {
    resend.emails.send({
        from: 'onboarding@resend.dev',
        to: `${email}`,
        subject: 'Successful Registration on E-Learning Platform',
        html: `<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="text-align: center; color: #007bff;">Welcome to Our E-Learning Platform!</h2>
        <p>Dear ${name},</p>
        <p>Congratulations! You have successfully registered for our e-learning platform. Your journey towards learning and growth begins now.</p>
        <p>Feel free to explore our courses and start learning today.</p>
        <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
        <p>Happy learning!</p>
        <p>Sincerely,<br>The E-Learning Platform Team</p>
        </div>`
    })
}


const courseEnrollEmail = (email, name, course) => {
    resend.emails.send({
        from: 'onboarding@resend.dev',
        to: `${email}`,
        subject: 'Course Enrollment Notification',
        html: `<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="text-align: center; color: #007bff;">Course Enrollment Notification</h2>
        <p>Dear ${name},</p>
        <p>Congratulations! You have successfully enrolled in the course "<strong>${course}</strong>" on our e-learning platform.</p>
        <p>You can start accessing the course materials and lessons immediately.</p>
        <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
        <p>Happy learning!</p>
        <p>Sincerely,<br>The E-Learning Platform Team</p>
        </div>`
    })
}


const resetPasswordEmail = (email, password) => {
    resend.emails.send({
        from: 'onboarding@resend.dev',
        to: `${email}`,
        subject: 'Reset Password',
        html: `<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Password Reset</h2>
        <p>Your password has been reset successfully. Below is your new password:</p>
        <p style="font-size: 24px; font-weight: bold; color: #007bff;">${password}</p>
        <p>Please login with this new password and consider changing it to a more memorable one.</p>
        <p>If you didn't request this change, please contact us immediately.</p>
        <p>Happy learning!</p>
        <p>Sincerely,<br>The E-Learning Platform Team</p>
    </div>`
    })
}

module.exports = { registerEmail, courseEnrollEmail, resetPasswordEmail };