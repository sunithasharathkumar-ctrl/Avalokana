// ==========================================================================
// AVALOKANA - SUPABASE EDGE FUNCTION (DENO)
// Email Ticket Confirmation via Resend API
// ==========================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

// CORS configuration to allow calls directly from web application clients
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight options request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not defined on Supabase.")
    }

    const { booking_id, customer_name, tickets_count, email, venue, movie, qr_code_url } = await req.json()

    if (!email || !booking_id || !customer_name) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: email, booking_id, customer_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Build the email HTML body
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Avalokana Ticket Confirmation</title>
        <style>
          body { font-family: 'Inter', sans-serif; background-color: #070d0a; color: #eae3d2; margin: 0; padding: 20px; }
          .ticket-email { max-width: 500px; margin: 0 auto; background-color: #0f1814; border: 2px solid #d4af37; border-radius: 16px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center; }
          h2 { color: #d4af37; font-family: serif; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 5px; }
          .subtitle { font-size: 0.8rem; color: #b0a695; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 25px; }
          .detail-box { text-align: left; background: rgba(7, 13, 10, 0.4); border: 1px solid rgba(212, 175, 55, 0.15); border-radius: 8px; padding: 20px; margin-bottom: 25px; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; font-size: 0.9rem; }
          .detail-row:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
          .label { color: #b0a695; }
          .value { color: #eae3d2; font-weight: bold; }
          .qr-img { width: 180px; height: 180px; border: 2px solid #d4af37; border-radius: 8px; background: #fff; padding: 5px; margin: 20px auto; display: block; }
          .footer-note { font-size: 0.8rem; color: #b0a695; line-height: 1.4; margin-top: 25px; }
          .saffron { color: #ff7300; }
        </style>
      </head>
      <body>
        <div class="ticket-email">
          <h2>Avalokana</h2>
          <div class="subtitle">Official Screening Confirmation</div>
          
          <p>Thank you for booking your seat. Your ticket is confirmed.</p>
          
          <div class="detail-box">
            <div class="detail-row">
              <span class="label">Booking ID</span>
              <span class="value saffron">${booking_id}</span>
            </div>
            <div class="detail-row">
              <span class="label">Seeker Name</span>
              <span class="value">${customer_name}</span>
            </div>
            <div class="detail-row">
              <span class="label">Tickets Count</span>
              <span class="value">${tickets_count} ticket(s)</span>
            </div>
            <div class="detail-row">
              <span class="label">Venue Sanctuary</span>
              <span class="value">${venue}</span>
            </div>
            <div class="detail-row">
              <span class="label">Movie Presentation</span>
              <span class="value">${movie}</span>
            </div>
          </div>
          
          <p style="font-size: 0.9rem; font-weight: 500;">Please show the QR code below at the entrance:</p>
          <img class="qr-img" src="${qr_code_url}" alt="Ticket Entry QR Code">
          
          <div class="footer-note">
            <strong>Sanctuary Entry Note:</strong><br>
            Please arrive 15 minutes before dusk. Remove footwear outside the cinema hall. Maintain complete silence upon entry. Blessings on your journey.
          </div>
        </div>
      </body>
      </html>
    `

    // Call Resend email API endpoint
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "Avalokana Screenings <screenings@yourverifieddomain.com>",
        to: [email],
        subject: "Avalokana Ticket Confirmation",
        html: emailHtml
      })
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      throw new Error(`Resend API returned error: ${JSON.stringify(resendData)}`)
    }

    return new Response(
      JSON.stringify({ message: "Confirmation email sent successfully!", id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
