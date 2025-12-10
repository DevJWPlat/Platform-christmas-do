# WhatsApp Milestone Notifications Setup

This guide explains how to set up WhatsApp notifications when players reach milestones.

## Option 1: Twilio WhatsApp API (Recommended)

### Prerequisites
- Twilio account (sign up at https://www.twilio.com)
- Twilio WhatsApp Sandbox or approved WhatsApp Business Account

### Setup Steps

1. **Get Twilio Credentials**
   - Go to Twilio Console → Account → API Keys & Tokens
   - Copy your Account SID and Auth Token

2. **Set up WhatsApp Number**
   - Go to Twilio Console → Messaging → Try it out → Send a WhatsApp message
   - Follow instructions to join Twilio's WhatsApp Sandbox (for testing)
   - Or get a WhatsApp Business API number (for production)

3. **Get Your Group WhatsApp Number**
   - For a group, you'll need the group's WhatsApp number
   - Format: `whatsapp:+1234567890` (include country code)

4. **Deploy Supabase Edge Function**
   ```bash
   # Install Supabase CLI if you haven't
   npm install -g supabase

   # Login to Supabase
   supabase login

   # Link to your project
   supabase link --project-ref your-project-ref

   # Set environment variables
   supabase secrets set TWILIO_ACCOUNT_SID=your_account_sid
   supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
   supabase secrets set TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   supabase secrets set GROUP_WHATSAPP_NUMBER=whatsapp:+1234567890

   # Deploy the function
   supabase functions deploy send-whatsapp-milestone
   ```

5. **Test the Function**
   - Go to Supabase Dashboard → Edge Functions
   - Test the function with sample data

## Option 2: Simple Webhook (Alternative)

If you prefer not to use Twilio, you can use a service like:
- **Zapier** - Create a webhook trigger
- **Make.com (Integromat)** - Similar webhook integration
- **Custom API** - Your own backend service

### Using Zapier Example

1. Create a Zapier account
2. Create a new Zap with:
   - Trigger: Webhook by Zapier (Catch Hook)
   - Action: WhatsApp by Zapier (or another WhatsApp integration)
3. Copy the webhook URL
4. Update the code to call your webhook instead of the Edge Function

## Option 3: WhatsApp Web Link (Simplest, Manual)

For a simpler approach that opens WhatsApp (but doesn't send automatically):

```javascript
// In triggerMilestonePopup function
const whatsappMessage = encodeURIComponent(
  `🎯 MILESTONE! ${playerName} reached ${points} points! Consequence: ${action}`
)
const whatsappUrl = `https://wa.me/YOUR_GROUP_NUMBER?text=${whatsappMessage}`
window.open(whatsappUrl, '_blank')
```

## Notes

- **Twilio Sandbox**: Free for testing, limited to pre-approved numbers
- **Twilio Production**: Requires WhatsApp Business API approval (can take time)
- **Cost**: Twilio charges per message (check current pricing)
- **Privacy**: Make sure all players consent to receiving WhatsApp notifications

## Troubleshooting

- Check Supabase Edge Function logs in the dashboard
- Verify Twilio credentials are correct
- Ensure WhatsApp numbers are in correct format: `whatsapp:+[country code][number]`
- For groups, you may need to use a broadcast list or individual numbers

