# DigitalOcean Droplet Setup Guide

## Step 1: Create Droplet
1. Go to DigitalOcean → Create → Droplets
2. Choose Ubuntu 22.04 LTS
3. Select $6/month plan (1GB RAM)
4. Add SSH key or use password
5. Create droplet

## Step 2: Initial Server Setup

SSH into your droplet:
```bash
ssh root@YOUR_DROPLET_IP
```

### Quick Setup (Option A - Automated)
```bash
# Download and run setup script
wget https://raw.githubusercontent.com/andrewgacamac/hermes/main/droplet-setup.sh
chmod +x droplet-setup.sh
./droplet-setup.sh
```

### Manual Setup (Option B)
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs build-essential

# Install PM2
npm install -g pm2

# Install Git
apt install -y git

# Clone your repository
cd ~
git clone https://github.com/andrewgacamac/hermes.git
cd hermes

# Install dependencies
npm install
```

## Step 3: Configure Environment Variables

Create .env file:
```bash
nano .env
```

Add your credentials:
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
```

Save with Ctrl+X, Y, Enter

## Step 4: Start the Application

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy and run the command it outputs
```

## Step 5: Configure Firewall

```bash
# Allow SSH and web traffic
ufw allow OpenSSH
ufw allow 3000
ufw enable
```

## Step 6: Access Your Application

Visit: `http://YOUR_DROPLET_IP:3000`

## Optional: Nginx Reverse Proxy (for port 80)

```bash
# Install Nginx
apt install -y nginx

# Create Nginx config
nano /etc/nginx/sites-available/hermez
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name YOUR_DROPLET_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/hermez /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
ufw allow 'Nginx Full'
```

Now access at: `http://YOUR_DROPLET_IP`

## Monitoring Commands

```bash
# View logs
pm2 logs

# Monitor processes
pm2 monit

# Restart app
pm2 restart picotin-monitor

# Stop app
pm2 stop picotin-monitor

# View status
pm2 status
```

## Troubleshooting

If the app doesn't start:
```bash
# Check logs
pm2 logs

# Check if port 3000 is in use
lsof -i :3000

# Manually test
node server-with-controls.js
```

## Security Tips

1. **Create non-root user**:
```bash
adduser hermez
usermod -aG sudo hermez
su - hermez
```

2. **Disable root SSH** (after creating user):
Edit `/etc/ssh/sshd_config`:
```
PermitRootLogin no
```

3. **Keep system updated**:
```bash
apt update && apt upgrade -y
```

## Costs
- Droplet: $6/month
- Bandwidth: 1TB included (more than enough)
- Backups: +$1.20/month (optional but recommended)