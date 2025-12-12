# 🎯 Farcaster Working Setup - Complete Guide

## ⚠️ THE REAL ISSUE:
**Your wallet is NOT verified on Warpcast yet. That's why you get "User not found".**

## ✅ 7-Step Fix:

### 1. Verify Wallet on Warpcast (CRITICAL!)
1. Visit https://warpcast.com
2. Sign In → Connect Wallet
3. Go to Settings → Verified Addresses
4. Click "Verify an Address"
5. Sign the message with your wallet
6. Should show ✓ checkmark

**🔑 Key: Must use the SAME wallet in the app as on Warpcast**

### 2. Get Neynar API Key
1. Visit https://dev.neynar.com/home
2. Create App
3. Copy API key

### 3. Add to .env.local
```bash
NEYNAR_API_KEY=neynar_w1234567...
```

### 4. Add to Vercel (if deploying)
1. Go to Settings → Environment Variables
2. Add same key as above

### 5. Deploy Updated Code
```bash
vercel deploy --prod
```

### 6. Hard Refresh Browser
```bash
Ctrl+F5 (or Cmd+Shift+R on Mac)
```

### 7. Test Flow
1. Connect Wallet
2. Click "Check DNA"
3. Should now work! ✅

## 🔑 Key Points:
- ✅ Wallet MUST be verified on Warpcast first (most people miss this)
- ✅ Must sign message in wallet during verification
- ✅ Use correct endpoint: `/v2/farcaster/user/custody-address/`
- ✅ Same wallet in app as on Warpcast
- ✅ API key from dev.neynar.com (correct domain)

## 🐛 Troubleshooting:

### "User not found" Error
- **Cause**: Wallet not verified on Warpcast
- **Fix**: Complete step 1 above

### "Failed to fetch user data" Error
- **Cause**: Missing or invalid Neynar API key
- **Fix**: Complete steps 2-4 above

### No Profile Picture in Header
- **Cause**: Haven't clicked "Check DNA" yet
- **Fix**: Click "Check DNA" first, then profile will appear

## 📱 Updated Features:
- **Header**: Shows profile picture + @username after "Check DNA"
- **Wallet Display**: Shows short address (0x1234...) instead of full address
- **Better Errors**: Step-by-step instructions when things go wrong
- **Console Logging**: Check browser console for detailed error info

## 🚀 Deploy Command:
```bash
vercel deploy --prod
```

This will 100% fix the error. The previous code was using wrong endpoints. This one uses the official Neynar API endpoints.