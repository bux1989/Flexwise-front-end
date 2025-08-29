# 🔐 OTP Setup Guide for FlexWise

This guide shows you how to set up both **Email OTP** and **SMS OTP** for your FlexWise school management system using Supabase.

## 📧 Email OTP (Using Brevo)

### Step 1: Get Brevo SMTP Credentials

1. **Log in to Brevo Dashboard**
   - Go to [brevo.com](https://brevo.com) → Login
   - Navigate to **Account & Plan** → **SMTP & API**

2. **Get SMTP Settings:**
   ```
   Host: smtp-relay.brevo.com
   Port: 587
   Username: [Your SMTP Login]
   Password: [Your SMTP Key]
   ```

### Step 2: Configure Supabase

Add these environment variables to your Supabase project:

```env
# Brevo SMTP Configuration
GOTRUE_SMTP_HOST="smtp-relay.brevo.com"
GOTRUE_SMTP_PORT="587"
GOTRUE_SMTP_USER="your-brevo-smtp-login"
GOTRUE_SMTP_PASS="your-brevo-smtp-key"
GOTRUE_SMTP_ADMIN_EMAIL="admin@flexwise-schule.de"
GOTRUE_SMTP_SENDER_NAME="FlexWise Schulplattform"
```

### Step 3: Test Email OTP

```javascript
// Send email OTP
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    shouldCreateUser: false
  }
});

// Verify email OTP
const { error } = await supabase.auth.verifyOtp({
  email: 'user@example.com',
  token: '123456',
  type: 'email'
});
```

## 📱 SMS OTP (Using Twilio)

### Step 1: Set Up Twilio Account

1. **Sign up at [twilio.com](https://twilio.com)**
2. **Get your credentials:**
   - Account SID
   - Auth Token
   - Message Service SID (or phone number)

### Step 2: Configure Twilio

Add these to your Supabase environment:

```env
# Twilio SMS Configuration
GOTRUE_SMS_PROVIDER="twilio"
GOTRUE_SMS_TWILIO_ACCOUNT_SID="your-account-sid"
GOTRUE_SMS_TWILIO_AUTH_TOKEN="your-auth-token"
GOTRUE_SMS_TWILIO_MESSAGE_SERVICE_SID="your-message-service-sid"
GOTRUE_SMS_TEMPLATE="Ihr FlexWise Code: {{ .Code }}. Gültig für 10 Minuten."
```

### Step 3: Test SMS OTP

```javascript
// Send SMS OTP
const { error } = await supabase.auth.signInWithOtp({
  phone: '+4915112345678',
  options: {
    shouldCreateUser: false
  }
});

// Verify SMS OTP
const { error } = await supabase.auth.verifyOtp({
  phone: '+4915112345678',
  token: '123456',
  type: 'sms'
});
```

## 🔧 Frontend Integration

Your FlexWise profile component already has the OTP UI implemented. The flow is:

1. **User clicks "Aktivieren"**
2. **Chooses Email or SMS**
3. **Enters their email/phone**
4. **Clicks "Code senden"**
5. **Receives 6-digit code**
6. **Enters code and clicks "Verifizieren"**

## 🧪 Testing & Development

### Test OTP Codes (Development Only)

```env
# Use fixed codes for testing
GOTRUE_SMS_TEST_OTP="+4915112345678:123456, +4915187654321:654321"
GOTRUE_SMS_TEST_OTP_VALID_UNTIL="2024-12-31T23:59:59Z"
```

### Local Development

1. **Start Supabase locally:**
   ```bash
   supabase start
   ```

2. **Add OTP config to local env:**
   ```bash
   cp supabase-otp-config.env .env.local
   ```

3. **Test in your app**

## 🔒 Security Best Practices

### Rate Limiting
```env
GOTRUE_RATE_LIMIT_EMAIL_SENT="10"  # Max 10 emails per hour
GOTRUE_RATE_LIMIT_SMS_SENT="10"    # Max 10 SMS per hour
GOTRUE_SMS_MAX_FREQUENCY="5s"      # Min 5 seconds between requests
```

### OTP Settings
```env
GOTRUE_SMS_OTP_EXP="600"           # 10 minutes expiry
GOTRUE_SMS_OTP_LENGTH="6"          # 6-digit codes
GOTRUE_MAX_VERIFIED_FACTORS="3"    # Max 3 MFA methods per user
```

## 🚀 Production Deployment

### Supabase Cloud

1. **Go to Supabase Dashboard**
2. **Navigate to Settings → API**
3. **Add environment variables**
4. **Deploy and test**

### Self-Hosted Supabase

1. **Update your `docker-compose.yml`**
2. **Add environment variables**
3. **Restart services**
4. **Test configuration**

## 📞 Support & Troubleshooting

### Common Issues

**Email not sending:**
- Check Brevo SMTP credentials
- Verify sender email is configured
- Check Supabase logs

**SMS not sending:**
- Verify Twilio credentials
- Check phone number format (+4915112345678)
- Ensure sufficient Twilio balance

**OTP verification failing:**
- Check code expiry (default 10 minutes)
- Verify correct email/phone
- Check rate limiting

### Getting Help

- **Brevo Support:** [help.brevo.com](https://help.brevo.com)
- **Twilio Support:** [support.twilio.com](https://support.twilio.com)
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)

## ✅ Checklist

- [ ] Brevo SMTP credentials configured
- [ ] Email OTP template customized
- [ ] Twilio account set up
- [ ] SMS OTP template configured
- [ ] Supabase environment variables added
- [ ] OTP functionality tested
- [ ] Rate limiting configured
- [ ] Production deployment completed
