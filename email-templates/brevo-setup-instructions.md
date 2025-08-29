# Brevo Email Template Setup for FlexWise Password Reset

## 1. Brevo Template Variables

When setting up this template in Brevo, you'll need to configure these variables:

### Contact Attributes:
- `{{contact.EMAIL}}` - User's email address

### Template Parameters:
- `{{params.RESET_URL}}` - The password reset URL from Supabase

## 2. Supabase Configuration

In your Supabase Authentication settings, configure Brevo SMTP with these custom templates:

### SMTP Settings:
- **Host**: `smtp-relay.brevo.com`
- **Port**: `587`
- **Username**: Your Brevo SMTP login
- **Password**: Your Brevo SMTP key

### Custom Template Configuration:
In Supabase Auth → Email Templates → Reset Password:

```
Subject: Passwort zurücksetzen - FlexWise
Template ID: [Your Brevo Template ID]
```

## 3. Brevo API Call

When Supabase calls Brevo, it should send:

```json
{
  "to": [{"email": "user@example.com"}],
  "templateId": [Your Template ID],
  "params": {
    "RESET_URL": "https://yourdomain.com/auth/reset-password?access_token=..."
  }
}
```

## 4. Alternative: Direct Integration

If you want to bypass Supabase's email sending and use Brevo directly:

```javascript
// In your EditProfile.tsx password reset function:
const { error } = await supabase.auth.resetPasswordForEmail(authUser.email, {
  redirectTo: `${window.location.origin}/auth/reset-password`,
});

// Then trigger Brevo email via webhook or API call
await fetch('/api/send-reset-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: authUser.email,
    resetUrl: resetUrl
  })
});
```

## 5. Brevo Template Creation

1. Go to Brevo Dashboard → Email → Templates
2. Create new template → HTML template
3. Paste the HTML from `reset-password.html`
4. Set template variables as noted above
5. Save and get the Template ID
6. Configure in Supabase

## 6. Testing

Test the email by:
1. Triggering password reset in your app
2. Check Brevo logs for successful delivery
3. Verify template rendering and variables
4. Test the reset link functionality
