# Ionos Jamstack Deployment Configuration

## Build Settings for Ionos

### Basic Configuration
```yaml
# Build Command
npm run build

# Publish Directory
packages/web-app/dist

# Node Version
22
```

### Environment Variables (Required)
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Redirect Rules for SPA
Since your app uses React Router, you'll need SPA redirect rules.

**Option 1: _redirects file (if supported)**
```
/*    /index.html   200
```

**Option 2: .htaccess file (if using Apache)**
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

## Migration from Netlify to Ionos

### 1. Repository Connection
- Connect your GitHub repository: `bux1989/Flexwise-front-end`
- Branch: `aura-hub`

### 2. Build Configuration Translation
Your current `netlify.toml` settings translate to:

| Netlify | Ionos Equivalent |
|---------|------------------|
| `command = "npm run build"` | Build Command: `npm run build` |
| `publish = "packages/web-app/dist"` | Publish Directory: `packages/web-app/dist` |
| `NODE_VERSION = "22"` | Node Version: 22 |
| SPA redirects | Configure redirect rules |

### 3. Environment Variables
Transfer these from Netlify to Ionos:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Advantages of Ionos Jamstack vs Netlify

### Ionos Jamstack Pros:
- European data centers (GDPR compliance)
- Potentially lower costs
- Good for German/EU users

### Netlify Pros:
- More mature platform
- Better developer experience
- More advanced features (edge functions, etc.)

## Alternative: Manual Upload to Shared Hosting

If you prefer shared hosting, you can:

1. **Build locally:**
   ```bash
   npm run build
   ```

2. **Upload contents of `packages/web-app/dist/` to your web directory**

3. **Add .htaccess for SPA routing:**
   ```apache
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ /index.html [QSA,L]
   ```

## Recommendation

For your React application, **Ionos Jamstack hosting** is definitely the right choice because:

✅ **Automatic deployments** from Git  
✅ **Built-in SPA support**  
✅ **CDN performance**  
✅ **Environment variable management**  
✅ **HTTPS/SSL included**  
�� **Scales with your project**

The setup should be very similar to your current Netlify configuration!
