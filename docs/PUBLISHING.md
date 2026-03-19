# Publishing VibeWords

VibeWords is built with Next.js and Firebase, making it perfectly suited for **Firebase App Hosting**. Follow these steps to take your app from prototype to production.

## 1. Prepare your GitHub Repository
Firebase App Hosting works by connecting directly to your GitHub repository.
1. Create a new repository on GitHub.
2. Push your current code to the `main` branch.

## 2. Set Up Firebase App Hosting
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: `captionwise`.
3. In the left sidebar, navigate to **Build** > **App Hosting**.
4. Click **Get Started** and connect your GitHub account.
5. Select the repository you created in Step 1.
6. Keep the default settings (App Hosting will automatically detect the Next.js framework).

## 3. Configure Production Secrets
Your app requires an API key for GenAI features.
1. In the App Hosting dashboard, go to the **Settings** tab.
2. Add a new environment variable:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** Your Google AI Studio API Key.
3. Ensure you use **Secret Manager** (provided in the UI) for this key to keep it secure.

## 4. Deploying Updates
Every time you push a change to your `main` branch on GitHub, Firebase App Hosting will automatically:
- Build your Next.js application.
- Deploy it to a global CDN.
- Provide you with a live URL (e.g., `https://your-app.web.app`).

## 5. Domain Setup
Once deployed, you can connect a custom domain (like `vibewords.ai`) through the **App Hosting** > **Settings** > **Domains** section in the Firebase Console.

---
**Note:** Ensure your Firebase Security Rules (in `firestore.rules`) are deployed. Firebase Studio handles this automatically during development, but you should verify them in the Firebase Console under **Firestore Database** > **Rules** before going live.