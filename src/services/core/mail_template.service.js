const config = require("../../config");

class MailTemplateService {
  static verificationCodeTemplate(randomCode) {
    const template = `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f0;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f0;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #9d4d3a; padding: 40px 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 2px;">Project Name</h1>
                            <p style="margin: 8px 0 0; color: #f5f5f0; font-size: 13px; letter-spacing: 1px;">VERIFY YOUR EMAIL</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 50px 40px 30px;">
                            <h2 style="margin: 0 0 20px; color: #2d2d2d; font-size: 24px; font-weight: 600; text-align: center;">Email Verification</h2>
                            <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6; text-align: center;">
                                Thank you for signing up! Please use the verification code below to complete your registration.
                            </p>
                            
                            <!-- Verification Code Box -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 30px;">
                                <tr>
                                    <td align="center">
                                        <div style="background-color: #faf8f5; border: 2px dashed #9d4d3a; border-radius: 8px; padding: 30px; display: inline-block;">
                                            <p style="margin: 0 0 10px; color: #666666; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                                            <p style="margin: 0; color: #9d4d3a; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${randomCode}</p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 20px; color: #666666; font-size: 14px; line-height: 1.6; text-align: center;">
                                This code will expire in <strong style="color: #9d4d3a;">10 minutes</strong>.
                            </p>
                            
                            <!-- Decorative Line -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                <tr>
                                    <td style="border-bottom: 1px solid #e5e5e0;"></td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.6; text-align: center;">
                                If you didn't request this verification code, please ignore this email or contact our support team.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #faf8f5; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e5e0;">
                            <p style="margin: 0 0 10px; color: #2d2d2d; font-size: 16px; font-weight: 600; letter-spacing: 1px;">Project Name</p>
                            <p style="margin: 0 0 15px; color: #999999; font-size: 12px;">
                                Curated Fashion Reimagined
                            </p>
                            <p style="margin: 0; color: #999999; font-size: 11px; line-height: 1.5;">
                                © 2025 Project Name. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
    return template;
  }

  static changePasswordTemplate(token, isBusiness) {
    const domain =
      config.env == "development"
        ? "http://localhost:4200"
        : "https://backend.com";
    const template = `Use this link to change your password <a href="${domain}/en/password/${token}?isBusiness=${isBusiness}">${domain}/en/password/${token}?isBusiness=${isBusiness}</a>`;
    return template;
  }

  static resetPasswordTemplate(code) {
    const template = `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f0;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f0;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <tr>
                        <td style="background-color: #9d4d3a; padding: 40px 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 2px;">Project Name</h1>
                            <p style="margin: 8px 0 0; color: #f5f5f0; font-size: 13px; letter-spacing: 1px;">PASSWORD RESET</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 50px 40px 30px;">
                            <h2 style="margin: 0 0 20px; color: #2d2d2d; font-size: 24px; font-weight: 600; text-align: center;">Reset Your Password</h2>
                            <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6; text-align: center;">
                                We received a request to reset your password. Use the code below to create a new password for your account.
                            </p>
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 30px;">
                                <tr>
                                    <td align="center">
                                        <div style="background-color: #faf8f5; border: 2px dashed #9d4d3a; border-radius: 8px; padding: 30px; display: inline-block;">
                                            <p style="margin: 0 0 10px; color: #666666; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Your Reset Code</p>
                                            <p style="margin: 0; color: #9d4d3a; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 0 0 20px; color: #666666; font-size: 14px; line-height: 1.6; text-align: center;">
                                This code will expire in <strong style="color: #9d4d3a;">15 minutes</strong> for security reasons.
                            </p>
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0 20px;">
                                <tr>
                                    <td style="border-bottom: 1px solid #e5e5e0;"></td>
                                </tr>
                            </table>
                            <div style="background-color: #fff8f5; border-left: 3px solid #9d4d3a; padding: 15px 20px; margin: 0 0 20px;">
                                <p style="margin: 0; color: #9d4d3a; font-size: 13px; line-height: 1.6; font-weight: 600;">
                                    ⚠️ Security Notice
                                </p>
                                <p style="margin: 8px 0 0; color: #666666; font-size: 13px; line-height: 1.6;">
                                    If you didn't request a password reset, please ignore this email and ensure your account is secure. Your password will remain unchanged.
                                </p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #faf8f5; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e5e0;">
                            <p style="margin: 0 0 10px; color: #2d2d2d; font-size: 16px; font-weight: 600; letter-spacing: 1px;">Project Name</p>
                            <p style="margin: 0 0 15px; color: #999999; font-size: 12px;">Curated Fashion Reimagined</p>
                            <p style="margin: 0; color: #999999; font-size: 11px; line-height: 1.5;">© 2025 Project Name. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
    return template;
  }
}

module.exports = MailTemplateService;
