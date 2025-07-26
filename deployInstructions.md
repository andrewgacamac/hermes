# Deploy Instructions - Manual Update from Mac

## Quick Deploy Steps

Whenever you make changes to your code and want to update the live app on your DigitalOcean droplet:

### 1. Make your code changes locally

### 2. Commit and push to GitHub:
```bash
cd /Users/developer/projects/hermez
git add .
git commit -m "Your update message"
git push
```

### 3. Deploy to your droplet:
```bash
cd /Users/developer/projects/hermez
./update-droplet.sh
```

That's it! The script will:
- SSH into your droplet (143.198.41.150)
- Pull the latest code from GitHub
- Install any new dependencies
- Restart the app with PM2

## Your Live App URL
http://143.198.41.150:3000

## Troubleshooting

If the update script fails, you can manually SSH and update:
```bash
ssh root@143.198.41.150
cd ~/apps/hermes
./deploy.sh
```

## View Logs on Droplet
```bash
ssh root@143.198.41.150
pm2 logs
```

## Restart App Manually
```bash
ssh root@143.198.41.150
pm2 restart picotin-monitor
```