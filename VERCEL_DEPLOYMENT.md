# Vercel Deployment Guide for Zombie Arena Protocol

## Prerequisites
- Vercel account (sign up at vercel.com)
- GitHub repository connected (already done: Jpatching/zombie-arena-protocol)

## Deployment Steps

### 1. Import Project to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Select "Import Git Repository"
3. Choose the `Jpatching/zombie-arena-protocol` repository
4. Select the `frontend` directory as the root directory
5. Framework preset should auto-detect as Next.js

### 2. Configure Build Settings
The following settings should be auto-detected from `vercel.json`:
- Framework Preset: Next.js
- Build Command: `next build`
- Output Directory: `.next`
- Install Command: `npm install --legacy-peer-deps`

### 3. Environment Variables
Add these environment variables in Vercel dashboard:
```
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
```

Optional (for future integration):
```
NEXT_PUBLIC_WS_URL=wss://your-websocket-server.com
NEXT_PUBLIC_TOKEN_MINT=<your-token-mint-address>
NEXT_PUBLIC_GAME_PROGRAM_ID=<your-program-id>
```

### 4. Deploy
1. Click "Deploy"
2. Wait for the build to complete (usually 2-3 minutes)
3. Your app will be live at `https://zombie-arena-protocol.vercel.app`

## Custom Domain (Optional)
1. Go to Project Settings > Domains
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions

## Troubleshooting

### Build Errors
- If you see React version conflicts, the `--legacy-peer-deps` flag in install command should handle it
- Check build logs in Vercel dashboard for specific errors

### CORS Issues
- The NZ:P iframe (nzp.gay) should work without CORS issues
- If needed, add headers in `next.config.js`

### Performance
- Vercel automatically optimizes Next.js apps
- Images and assets are served from Vercel's CDN
- Consider enabling Vercel Analytics for monitoring

## Current Status
✅ Frontend is ready for deployment
✅ NZ:P game integration working via iframe
✅ Wallet connection functional
✅ Basic game UI and instructions complete

## Next Steps After Deployment
1. Test the live deployment thoroughly
2. Share the URL for community testing
3. Monitor performance and user feedback
4. Implement token rewards system (currently showing "Coming Soon")
5. Add multiplayer functionality when backend is ready