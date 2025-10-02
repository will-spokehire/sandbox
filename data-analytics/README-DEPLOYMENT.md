# 🚀 Vercel Deployment with Basic Authentication

This guide explains how to deploy your Vehicle Catalog website to Vercel with basic authentication protection.

## 📁 Files Created for Deployment

- `middleware.js` - Handles basic authentication (in root and public/)
- `vercel.json` - Vercel configuration (in root and public/)
- `.vercelignore` - Excludes everything except public folder
- `deploy.sh` - Automated deployment script with two options

## 🔐 Basic Authentication Setup

### Step 1: Create Environment Variables

Create a `.env.local` file in your project root:

```bash
BASIC_AUTH_USERNAME=admin
BASIC_AUTH_PASSWORD=your_secure_password
```

### Step 2: Deploy to Vercel

#### Option A: Using the Deploy Script (Recommended)
```bash
./deploy.sh
```
The script will ask you to choose between two methods:
1. **Deploy entire project** (with .vercelignore) - Deploys from root but only uploads 81MB
2. **Deploy public folder directly** - Deploys only the public folder contents

#### Option B: Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Method 1: Deploy entire project (with .vercelignore)
vercel --prod

# Method 2: Deploy only public folder
cd public
vercel --prod
cd ..
```

### Step 3: Configure Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:
   - `BASIC_AUTH_USERNAME` = your desired username
   - `BASIC_AUTH_PASSWORD` = your desired password

## 🌐 Accessing Your Website

Once deployed and configured, your website will be available at:
`https://your-project-name.vercel.app`

Users will need to enter the username and password you configured to access the site.

## 🔧 How It Works

- **Middleware**: The `middleware.js` file intercepts all requests and checks for valid basic authentication credentials
- **Static Hosting**: Vercel serves your static files from the `public/` directory
- **CDN**: All files are served through Vercel's global CDN for fast loading

## 🚨 Security Notes

- Basic authentication sends credentials in base64 encoding (not encrypted)
- Use HTTPS (Vercel provides this automatically)
- Choose a strong password
- Consider using environment-specific credentials (different for dev/staging/production)

## 🔄 Redeployment

After making changes to your code:

1. Commit and push to your Git repository, OR
2. Run `./deploy.sh` again, OR
3. Run `vercel --prod` manually

## 🛠️ Local Development

To test locally with authentication:

1. Make sure your `.env.local` file exists with your credentials
2. Start your local server:
   ```bash
   npm run dev
   ```
3. Visit `http://localhost:3000` - you'll be prompted for authentication

## 📝 Configuration Options

You can customize the authentication by modifying `middleware.js`:

- Change the realm name: `'Basic realm="Your Site Name"'`
- Add IP whitelisting
- Exclude certain paths from authentication
- Add rate limiting

## 🎯 Troubleshooting

**"Authentication required" error:**
- Check that environment variables are set in Vercel dashboard
- Verify the username/password are correct
- Try redeploying: `vercel --prod --force`

**Build fails:**
- Ensure all files are committed to Git
- Check Vercel build logs in dashboard
- Verify `vercel.json` configuration is correct

**Static files not loading:**
- Make sure `vercel.json` routes are configured properly
- Check that files exist in the `public/` directory
- Verify file paths in your HTML/CSS/JS are correct

## 📞 Support

For issues with:
- Vercel deployment: Check [Vercel Documentation](https://vercel.com/docs)
- Basic authentication: Review the `middleware.js` implementation
- Build errors: Check Vercel dashboard build logs
