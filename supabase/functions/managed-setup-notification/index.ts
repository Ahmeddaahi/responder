import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationBody {
    task: 'request' | 'complete' | 'reject';
    userId?: string;
    businessName?: string;
    phoneNumber?: string;
    email?: string;
    reason?: string;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { task, userId, businessName, phoneNumber, email, reason }: NotificationBody = await req.json();
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        const senderEmail = Deno.env.get('RESEND_SENDER_EMAIL') || 'onboarding@resend.dev';
        const adminEmail = Deno.env.get('ADMIN_EMAIL') || senderEmail; // Fallback to sender
        const siteUrl = Deno.env.get('SITE_URL') || 'https://resbonder.online';

        if (!resendApiKey) throw new Error('RESEND_API_KEY not configured');

        let subject = "";
        let html = "";
        let recipient = "";

        if (task === 'request') {
            recipient = adminEmail;
            subject = `New WhatsApp Setup Request: ${businessName}`;
            html = `
        <h1>New Setup Request</h1>
        <p><strong>Business Name:</strong> ${businessName}</p>
        <p><strong>Phone Number:</strong> ${phoneNumber}</p>
        <p><strong>User ID:</strong> ${userId}</p>
        <p><a href="${siteUrl}/admin">Go to Admin Dashboard to complete setup</a></p>
      `;
        } else if (task === 'complete') {
            recipient = email!;
            subject = "Your WhatsApp Chatbot is Ready!";
            html = `
        <h1>Setup Complete! 🎉</h1>
        <p>Hello,</p>
        <p>We have successfully configured your WhatsApp Business API. Your AI chatbot is now live and ready to respond to your customers!</p>
        <p><a href="${siteUrl}/dashboard">Go to your Dashboard</a> to see it in action.</p>
        <p>Best regards,<br/>The Resbonder Team</p>
      `;
        } else if (task === 'reject') {
            recipient = email!;
            subject = "Update regarding your WhatsApp Setup Request";
            html = `
        <h1>Setup Request Update</h1>
        <p>Hello,</p>
        <p>Thank you for your interest in our managed WhatsApp setup service.</p>
        <p>Unfortunately, we couldn't process your request at this time for the following reason:</p>
        <blockquote style="background: #f9f9f9; border-left: 5px solid #ccc; padding: 10px; margin: 20px 0;">
            ${reason || "Payment could not be verified."}
        </blockquote>
        <p>You can try requesting again with updated details or a valid payment proof by visiting your <a href="${siteUrl}/settings">Settings page</a>.</p>
        <p>Best regards,<br/>The Resbonder Team</p>
      `;
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `Resbonder <${senderEmail}>`,
                to: [recipient],
                subject: subject,
                html: html,
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Resend error: ${errorText}`);
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
