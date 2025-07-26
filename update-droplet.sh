#!/bin/bash
# Run this locally to update your droplet

echo "🚀 Updating Hermès Monitor on Droplet..."

# SSH into droplet and run deploy script
ssh root@143.198.41.150 "cd ~/apps/hermes && ./deploy.sh"

echo "✅ Update complete!"
echo "🌐 Check your app at: http://143.198.41.150:3000"