import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingReminderPayload {
    bookingId: string;
    actionType: 'created' | 'updated';
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        const senderEmail = Deno.env.get('RESEND_SENDER_EMAIL') || 'onboarding@resend.dev';
        const senderName = Deno.env.get('RESEND_SENDER_NAME') || 'Reply Ready Bot';
        const siteUrl = Deno.env.get('SITE_URL') || 'https://responder.online';

        if (!resendApiKey) {
            throw new Error('RESEND_API_KEY not configured');
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const { bookingId, actionType } = await req.json() as BookingReminderPayload;

        console.log(`📧 Sending booking reminder email for booking ${bookingId}, action: ${actionType}`);

        // 1. Fetch booking details
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) {
            throw new Error('Booking not found');
        }

        // 2. Get user email
        const { data: userAuth, error: authError } = await supabase.auth.admin.getUserById(booking.user_id);
        if (authError || !userAuth.user) {
            throw new Error('User not found');
        }

        const userEmail = userAuth.user.email;
        if (!userEmail) {
            throw new Error('User has no email');
        }

        // 3. Format booking details for email
        const formatDate = (date: string | null) => {
            if (!date) return 'Not specified';
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        const formatCustomData = (customData: any) => {
            if (!customData || typeof customData !== 'object') return '';

            return Object.entries(customData)
                .map(([key, value]) => {
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    return `<p style="margin: 4px 0; color: #718096; font-size: 14px;">${label}: <span style="color: #2d3748; font-weight: 500;">${value || 'N/A'}</span></p>`;
                })
                .join('');
        };

        const statusColor = booking.status === 'confirmed' ? '#48bb78' :
            booking.status === 'cancelled' ? '#f56565' : '#ed8936';

        const statusLabel = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);

        // 4. Build email HTML
        const emailSubject = actionType === 'created'
            ? `🎉 New Booking Received - ${booking.customer_name || 'Guest'}`
            : `📝 Booking Updated - ${booking.customer_name || 'Guest'}`;

        const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #1a202c; margin-bottom: 8px;">${actionType === 'created' ? '🎉 New Booking Received!' : '📝 Booking Updated'}</h2>
          <p style="color: #718096; margin: 0;">You have a ${actionType === 'created' ? 'new' : 'updated'} booking from ${booking.platform === 'whatsapp' ? 'WhatsApp' : 'Telegram'}</p>
        </div>
        
        <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="color: #2d3748; margin: 0;">Booking Details</h3>
            <span style="background-color: ${statusColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">${statusLabel}</span>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
            <p style="margin: 4px 0; color: #718096; font-size: 14px;">Business: <span style="color: #2d3748; font-weight: 500;">${booking.business_name || booking.booking_type}</span></p>
            <p style="margin: 4px 0; color: #718096; font-size: 14px;">Booking Type: <span style="color: #2d3748; font-weight: 500; text-transform: capitalize;">${booking.booking_type}</span></p>
          </div>
        </div>

        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;">
          <h3 style="color: #2d3748; margin-top: 0; margin-bottom: 16px;">Customer Information</h3>
          <p style="margin: 4px 0; color: #718096; font-size: 14px;">Name: <span style="color: #2d3748; font-weight: 500;">${booking.customer_name || 'Not provided'}</span></p>
          <p style="margin: 4px 0; color: #718096; font-size: 14px;">Phone: <span style="color: #2d3748; font-weight: 500;">${booking.customer_phone || 'Not provided'}</span></p>
          <p style="margin: 4px 0; color: #718096; font-size: 14px;">Email: <span style="color: #2d3748; font-weight: 500;">${booking.customer_email || 'Not provided'}</span></p>
          <p style="margin: 4px 0; color: #718096; font-size: 14px;">Platform: <span style="color: #2d3748; font-weight: 500; text-transform: capitalize;">${booking.platform}</span></p>
        </div>

        ${booking.check_in_date || booking.check_out_date || booking.number_of_guests || booking.room_type ? `
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;">
          <h3 style="color: #2d3748; margin-top: 0; margin-bottom: 16px;">Reservation Details</h3>
          ${booking.check_in_date ? `<p style="margin: 4px 0; color: #718096; font-size: 14px;">Check-in: <span style="color: #2d3748; font-weight: 500;">${formatDate(booking.check_in_date)}</span></p>` : ''}
          ${booking.check_out_date ? `<p style="margin: 4px 0; color: #718096; font-size: 14px;">Check-out: <span style="color: #2d3748; font-weight: 500;">${formatDate(booking.check_out_date)}</span></p>` : ''}
          ${booking.number_of_guests ? `<p style="margin: 4px 0; color: #718096; font-size: 14px;">Guests: <span style="color: #2d3748; font-weight: 500;">${booking.number_of_guests}</span></p>` : ''}
          ${booking.room_type ? `<p style="margin: 4px 0; color: #718096; font-size: 14px;">Room Type: <span style="color: #2d3748; font-weight: 500;">${booking.room_type}</span></p>` : ''}
        </div>
        ` : ''}

        ${booking.reservation_date || booking.reservation_time ? `
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;">
          <h3 style="color: #2d3748; margin-top: 0; margin-bottom: 16px;">Restaurant Reservation</h3>
          ${booking.reservation_date ? `<p style="margin: 4px 0; color: #718096; font-size: 14px;">Date: <span style="color: #2d3748; font-weight: 500;">${formatDate(booking.reservation_date)}</span></p>` : ''}
          ${booking.reservation_time ? `<p style="margin: 4px 0; color: #718096; font-size: 14px;">Time: <span style="color: #2d3748; font-weight: 500;">${booking.reservation_time}</span></p>` : ''}
        </div>
        ` : ''}

        ${booking.appointment_date || booking.appointment_time ? `
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;">
          <h3 style="color: #2d3748; margin-top: 0; margin-bottom: 16px;">Appointment Details</h3>
          ${booking.appointment_date ? `<p style="margin: 4px 0; color: #718096; font-size: 14px;">Date: <span style="color: #2d3748; font-weight: 500;">${formatDate(booking.appointment_date)}</span></p>` : ''}
          ${booking.appointment_time ? `<p style="margin: 4px 0; color: #718096; font-size: 14px;">Time: <span style="color: #2d3748; font-weight: 500;">${booking.appointment_time}</span></p>` : ''}
        </div>
        ` : ''}

        ${booking.custom_data ? `
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;">
          <h3 style="color: #2d3748; margin-top: 0; margin-bottom: 16px;">Additional Information</h3>
          ${formatCustomData(booking.custom_data)}
        </div>
        ` : ''}

        ${booking.notes ? `
        <div style="background-color: #fffaf0; padding: 16px; border-left: 4px solid #ed8936; border-radius: 4px; margin-bottom: 24px;">
          <p style="margin: 0; color: #744210; font-size: 14px;"><strong>Notes:</strong> ${booking.notes}</p>
        </div>
        ` : ''}
        
        <div style="margin-top: 32px; text-align: center;">
          <a href="${siteUrl}/bookings" style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View All Bookings</a>
        </div>
        
        <hr style="margin: 40px 0 24px 0; border: 0; border-top: 1px solid #edf2f7;" />
        <p style="color: #a0aec0; font-size: 12px; text-align: center; margin: 0;">Booking received on ${new Date(booking.created_at).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
        <p style="color: #a0aec0; font-size: 12px; text-align: center; margin: 8px 0 0 0;">&copy; ${new Date().getFullYear()} ${senderName}. All rights reserved.</p>
      </div>
    `;

        // 5. Send Email via Resend
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `${senderName} <${senderEmail}>`,
                to: [userEmail],
                subject: emailSubject,
                html: emailHtml,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Resend error: ${error}`);
        }

        // 6. Update last_email_sent_at timestamp
        await supabase
            .from('bookings')
            .update({
                last_email_sent_at: new Date().toISOString(),
                email_sent_count: (booking.email_sent_count || 0) + 1
            })
            .eq('id', bookingId);

        console.log(`✅ Booking reminder email sent successfully to ${userEmail}`);

        return new Response(JSON.stringify({ message: 'Success' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('❌ Error in send-booking-reminder-email:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
