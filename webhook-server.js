const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');

const app = express();
const PORT = 9000;

// GitHub webhook secret (set this in GitHub webhook settings)
const WEBHOOK_SECRET = 'your-secret-key-here';

app.use(express.json());

// Webhook endpoint
app.post('/webhook', (req, res) => {
    const signature = req.get('X-Hub-Signature-256');
    const body = JSON.stringify(req.body);
    
    if (!signature) {
        return res.status(401).send('No signature');
    }
    
    // Verify webhook signature
    const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(body)
        .digest('hex');
    
    if (signature !== expectedSignature) {
        return res.status(401).send('Invalid signature');
    }
    
    // Check if push to main branch
    if (req.body.ref === 'refs/heads/main') {
        console.log('Deploying from GitHub push...');
        
        exec('cd ~/apps/hermes && ./deploy.sh', (error, stdout, stderr) => {
            if (error) {
                console.error(`Deployment error: ${error}`);
                return res.status(500).send('Deployment failed');
            }
            console.log(`Deployment output: ${stdout}`);
            if (stderr) console.error(`Deployment stderr: ${stderr}`);
            
            res.status(200).send('Deployment triggered');
        });
    } else {
        res.status(200).send('Not main branch, skipping deployment');
    }
});

app.listen(PORT, () => {
    console.log(`Webhook server listening on port ${PORT}`);
});