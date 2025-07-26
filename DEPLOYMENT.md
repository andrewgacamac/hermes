# Deployment Guide for Hermès Picotin Monitor

## Environment Variables Setup

Your `.env` file contains sensitive credentials that should NEVER be committed to GitHub. Here's how to handle them in production:

### Option 1: DigitalOcean App Platform (Easiest)

1. Push your code to GitHub (without .env file)
2. Create a new App in DigitalOcean App Platform
3. Connect your GitHub repository
4. In App Settings → Environment Variables, add:
   ```
   TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
   TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
   TWILIO_PHONE_NUMBER=YOUR_TWILIO_PHONE_NUMBER
   TEST_RECIPIENT_NUMBER=YOUR_RECIPIENT_PHONE_NUMBER
   MONITOR_INTERVAL_MINUTES=5
   MONITOR_BUSINESS_HOURS_ONLY=true
   MONITOR_START_HOUR=9
   MONITOR_END_HOUR=18
   MONITOR_WEEKDAYS_ONLY=true
   PORT=8080
   ```

### Option 2: DigitalOcean Droplet with PM2

1. SSH into your droplet
2. Clone your repository
3. Create `.env` file on the server:
   ```bash
   nano .env
   ```
   Then paste your environment variables

4. Install dependencies:
   ```bash
   npm install
   npm install -g pm2
   ```

5. Start with PM2:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### Option 3: Using GitHub Secrets (CI/CD)

1. Go to your GitHub repo → Settings → Secrets
2. Add each environment variable as a secret
3. Use GitHub Actions to deploy:

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to DigitalOcean

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to DigitalOcean
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /home/your-username/hermez
          git pull
          npm install
          echo "TWILIO_ACCOUNT_SID=${{ secrets.TWILIO_ACCOUNT_SID }}" > .env
          echo "TWILIO_AUTH_TOKEN=${{ secrets.TWILIO_AUTH_TOKEN }}" >> .env
          echo "TWILIO_PHONE_NUMBER=${{ secrets.TWILIO_PHONE_NUMBER }}" >> .env
          echo "TEST_RECIPIENT_NUMBER=${{ secrets.TEST_RECIPIENT_NUMBER }}" >> .env
          echo "MONITOR_INTERVAL_MINUTES=5" >> .env
          echo "MONITOR_BUSINESS_HOURS_ONLY=true" >> .env
          echo "MONITOR_START_HOUR=9" >> .env
          echo "MONITOR_END_HOUR=18" >> .env
          echo "MONITOR_WEEKDAYS_ONLY=true" >> .env
          pm2 restart picotin-monitor
```

## Security Best Practices

1. **Never commit .env to GitHub** - It's already in .gitignore
2. **Use strong passwords** for your DigitalOcean account
3. **Enable 2FA** on GitHub and DigitalOcean
4. **Restrict server access** - Use SSH keys, not passwords
5. **Keep dependencies updated** - Run `npm audit` regularly

## Accessing the Web Interface

Once deployed, access your control panel at:
- App Platform: `https://your-app-name.ondigitalocean.app`
- Droplet: `http://your-droplet-ip:3000`

Consider using Nginx as a reverse proxy for the Droplet option to serve on port 80/443 with SSL.