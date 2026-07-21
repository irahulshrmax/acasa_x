import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, name, html, propertyName, propertyId } = body;

        if (!email || !html) {
            return NextResponse.json(
                { success: false, message: "Email and HTML are required" },
                { status: 400 }
            );
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Email content
        const mailOptions = {
            from: process.env.SMTP_FROM || "info@acasa.ae",
            to: email,
            subject: `📄 ${propertyName} - Brochure Download`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #192334; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                        .button { display: inline-block; background: #192334; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
                        .footer { text-align: center; padding: 20px; font-size: 12px; color: #888; }
                        .highlight { background: #f0f4ff; padding: 15px; border-radius: 6px; border-left: 4px solid #192334; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🏠 ACASA Real Estate</h1>
                            <p style="margin: 0; opacity: 0.8;">Property Brochure</p>
                        </div>
                        <div class="content">
                            <h2>Hello ${name || "Valued Customer"},</h2>
                            
                            <p>Thank you for showing interest in <strong>${propertyName}</strong>.</p>
                            
                            <p>Please find your brochure attached to this email.</p>
                            
                            <div class="highlight">
                                <p><strong>📋 Property Details:</strong></p>
                                <ul style="margin: 5px 0; padding-left: 20px;">
                                    <li><strong>Property:</strong> ${propertyName}</li>
                                    <li><strong>Reference:</strong> PRJ-${String(propertyId).padStart(6, '0')}</li>
                                    <li><strong>Downloaded:</strong> ${new Date().toLocaleDateString()}</li>
                                </ul>
                            </div>
                            
                            <p style="margin-top: 20px;">
                                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://acasa.ae'}/properties/${propertyId}" 
                                   class="button" style="color: white; text-decoration: none;">
                                    🔗 View Property Online
                                </a>
                            </p>
                            
                            <p style="margin-top: 20px;">
                                If you have any questions, feel free to reply to this email or contact our team at 
                                <a href="tel:+971501234567">+971 50 123 4567</a>.
                            </p>
                            
                            <p style="margin-top: 20px; color: #666; font-size: 14px;">
                                <strong>💡 Tip:</strong> If you can't see the attachment, please check your spam folder.
                            </p>
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} ACASA Real Estate. All rights reserved.</p>
                            <p style="margin-top: 5px;">
                                <a href="https://acasa.ae" style="color: #192334; text-decoration: none;">Visit our website</a>
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            attachments: [
                {
                    filename: `${propertyName.replace(/\s+/g, "_")}_brochure.html`,
                    content: html,
                    contentType: "text/html",
                },
            ],
        };

        // Send email
        await transporter.sendMail(mailOptions);

        return NextResponse.json({
            success: true,
            message: "Email sent successfully",
        });

    } catch (error: any) {
        console.error("Email sending error:", error);
        return NextResponse.json(
            { 
                success: false, 
                message: error.message || "Failed to send email" 
            },
            { status: 500 }
        );
    }
}