# Brevo Configuration for FlexWise Password Reset

## 📧 Subject Line Configuration

**In Brevo Template Editor:**
1. Go to Brevo Dashboard → Email → Templates  
2. Create/Edit your template
3. Set **Subject Line**: `Passwort zurücksetzen - FlexWise`
4. Paste the HTML content in the body

**Or via API when sending:**
```json
{
  "to": [{"email": "user@example.com"}],
  "templateId": YOUR_TEMPLATE_ID,
  "subject": "Passwort zurücksetzen - FlexWise",
  "params": {
    "USER_NAME": "Clarissa Döbel",
    "RESET_URL": "https://yourdomain.com/auth/reset-password?token=..."
  }
}
```

## 📝 Getting User Name in Your Code

Update your password reset function to get the user's full name:

```javascript
// In EditProfile.tsx password reset function:
const { data: { user: authUser } } = await supabase.auth.getUser();

// Get user profile for name
const profileId = authUser.user_metadata?.profile_id;
const { data: profile } = await supabase
  .from('user_profiles')
  .select('first_name, last_name')
  .eq('id', profileId)
  .single();

const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();

// Send reset email with name
const { error } = await supabase.auth.resetPasswordForEmail(authUser.email, {
  redirectTo: `${window.location.origin}/auth/reset-password`,
  data: {
    USER_NAME: fullName || authUser.email  // Fallback to email if no name
  }
});
```

## 🎨 Template Variables in Brevo

**Required Variables:**
- `{{params.USER_NAME}}` - User's full name (e.g., "Clarissa Döbel")
- `{{params.RESET_URL}}` - Password reset URL from Supabase

**Make sure to configure these in your Brevo template settings:**
- Template parameter: `USER_NAME`
- Template parameter: `RESET_URL`

## 🔧 Supabase Integration

**Option 1: Supabase SMTP → Brevo**
Configure Supabase Auth to use Brevo SMTP directly

**Option 2: Webhook Integration**
1. Supabase triggers password reset
2. Your server receives webhook
3. Server calls Brevo API to send template

## ✅ Testing Checklist

1. **Template renders correctly** in Brevo preview
2. **Subject line appears** properly  
3. **Logo displays** with white background
4. **Reset URL works** when clicked
5. **Email delivers** to inbox (not spam)
6. **Mobile view** looks good

## 🎯 Final Setup Steps

1. Upload HTML to Brevo template
2. Set subject line in template settings
3. Configure variables (EMAIL, RESET_URL)
4. Test with real email address
5. Check template ID and update Supabase config
