# Mobile App Guide

Bonifatus uses **Capacitor** to wrap the existing Next.js web app in native Android and iOS shells. The native app loads the live web app via URL — there is no separate mobile codebase.

## Architecture

```
Web app (bonifatus.com)
    |
    +-- Browser users access directly
    |
    +-- Android app (WebView wrapper via Capacitor)
    |       loads https://bonifatus.com in native shell
    |       adds: status bar, splash screen, back button, deep links
    |
    +-- iOS app (WebView wrapper via Capacitor) [future]
            same approach
```

Every web deploy automatically updates the mobile app content. Native shell updates (splash screen, plugins, permissions) require a new app store release.

## Local Development

### Prerequisites

- **Node.js 20+** and npm (already installed)
- **Android Studio** (for Android builds)
- **Xcode 15+** (for iOS builds, macOS only)
- **Java 17+** (bundled with Android Studio)

### Android Studio Setup

1. Download and install [Android Studio](https://developer.android.com/studio)
2. During setup, install these SDK components:
   - Android SDK Platform 34 (or latest)
   - Android SDK Build-Tools 34
   - Android SDK Command-line Tools
   - Android Emulator
   - Android SDK Platform-Tools
3. Set the `ANDROID_HOME` environment variable:

   ```bash
   # Windows (add to system environment variables)
   ANDROID_HOME=C:\Users\<you>\AppData\Local\Android\Sdk

   # macOS/Linux (add to ~/.bashrc or ~/.zshrc)
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

4. Create an emulator: Android Studio > Device Manager > Create Device > Pixel 7 > API 34

### Running on Android

```bash
# Sync web assets and plugins to the native project
npm run cap:sync

# Open in Android Studio (for full IDE experience)
npm run cap:open:android

# Or run directly on connected device/emulator
npm run cap:run:android
```

### Running on iOS (macOS only)

```bash
# Add iOS platform (one-time)
npx cap add ios

# Sync and open in Xcode
npm run cap:sync
npm run cap:open:ios
```

### Testing with Dev Server

To point the native app at `dev.bonifatus.com` instead of production, edit `capacitor.config.ts`:

```typescript
server: {
  url: 'https://dev.bonifatus.com',
}
```

Then run `npm run cap:sync` and rebuild.

## Building Release APK/AAB

### Debug APK (for testing)

```bash
npm run cap:build:android:debug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

### Signed Release AAB (for Google Play)

See "Signing Key" section below first.

```bash
npm run cap:sync
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## Google Play Console Setup

### Step 1: Create a Google Play Developer Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Sign in with a Google account (use the Bonifatus business account)
3. Pay the one-time **$25 registration fee**
4. Complete identity verification:
   - Personal account: government ID
   - Organization account: D-U-N-S number + business documents
   - Organization verification takes 5-7 business days
5. Accept the Developer Distribution Agreement

### Step 2: Create the App Listing

1. In Play Console, click **"Create app"**
2. Fill in:
   - **App name**: `Bonifatus`
   - **Default language**: German (de)
   - **App or Game**: App
   - **Free or Paid**: Free
3. Accept declarations and click **"Create app"**

### Step 3: Store Listing (required before first release)

Go to **Grow > Store presence > Main store listing** and fill in:

| Field              | Value                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| App name           | Bonifatus                                                                                        |
| Short description  | Notenrechner & Belohnungssystem fuer Schueler und Eltern                                         |
| Full description   | Bonifatus motiviert Schueler mit einem intelligenten Bonuspunkte-System... (write 80-4000 chars) |
| App icon           | 512x512 PNG, use `public/images/logo-512.png`                                                    |
| Feature graphic    | 1024x500 PNG (create a banner with logo + tagline)                                               |
| Screenshots        | Min 2 phone screenshots (from `public/images/screenshots/`)                                      |
| App category       | Education                                                                                        |
| Contact email      | info@bonifatus.com                                                                               |
| Privacy policy URL | https://bonifatus.com/en/privacy                                                                 |

### Step 4: Content Rating

1. Go to **Policy > App content > Content rating**
2. Start the IARC questionnaire
3. Select category: **Utility / Education**
4. Answer all questions (no violence, no user-generated content, etc.)
5. Submit — you'll get an **Everyone** / **USK 0** rating

### Step 5: Target Audience and Content

1. Go to **Policy > App content > Target audience**
2. Target age group: **13 and above** (not "children under 13" to avoid COPPA)
3. Confirm the app is not primarily child-directed

### Step 6: Data Safety

1. Go to **Policy > App content > Data safety**
2. Fill in data collection details:
   - **Email address**: Collected (account creation)
   - **Name**: Collected (user profile)
   - **App interactions**: Collected (grade data)
   - **Data encrypted in transit**: Yes (HTTPS)
   - **Data deletion**: Users can delete via profile settings
   - Link privacy policy: `https://bonifatus.com/en/privacy`

### Step 7: Signing Key

Google Play uses **App Signing by Google Play** (recommended):

1. Go to **Release > Setup > App signing**
2. Choose **"Let Google manage and protect your app signing key"** (recommended)
3. Generate an **upload key** locally:
   ```bash
   keytool -genkey -v -keystore bonifatus-upload.keystore \
     -alias bonifatus -keyalg RSA -keysize 2048 -validity 10000 \
     -storepass <choose-a-password> -keypass <choose-a-password> \
     -dname "CN=Bonifatus, OU=Mobile, O=Bonifatus GmbH, L=Berlin, ST=Berlin, C=DE"
   ```
4. Store this keystore file securely (NOT in git). Back it up.
5. Get the SHA-256 fingerprint for deep links:
   ```bash
   keytool -list -v -keystore bonifatus-upload.keystore -alias bonifatus
   ```
6. Update `public/.well-known/assetlinks.json` with the SHA-256 fingerprint from Google Play Console (under App signing > App signing key certificate > SHA-256)

### Step 8: Configure Gradle Signing

Create `android/keystore.properties` (gitignored):

```properties
storeFile=../bonifatus-upload.keystore
storePassword=<your-password>
keyAlias=bonifatus
keyPassword=<your-password>
```

Edit `android/app/build.gradle` — add signing config:

```groovy
// Above android { block:
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config ...

    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            // ... existing config ...
        }
    }
}
```

### Step 9: First Release

1. Build the signed AAB:
   ```bash
   cd android && ./gradlew bundleRelease
   ```
2. In Play Console, go to **Release > Testing > Internal testing**
3. Click **"Create new release"**
4. Upload the AAB from `android/app/build/outputs/bundle/release/app-release.aab`
5. Add release notes
6. Review and roll out to internal testers
7. Test on real devices
8. When ready, promote to **Production** release

### Step 10: Automatic Updates

After the first production release:

- The native shell rarely changes (splash screen, plugins, permissions)
- The web content updates automatically on each web deploy
- Only rebuild and upload a new AAB when you change native code, add plugins, or update Capacitor

---

## Apple Developer Setup (iOS)

### Step 1: Enroll in the Apple Developer Program

1. Go to [Apple Developer](https://developer.apple.com/programs/)
2. Click **"Enroll"**
3. Sign in with an Apple ID (create one if needed)
4. Choose enrollment type:
   - **Individual**: $99/year, needs Apple ID with 2FA
   - **Organization**: $99/year, needs a D-U-N-S number
5. Pay the **$99/year** fee
6. Enrollment approval takes up to 48 hours

### Step 2: Create App ID

1. Go to [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list)
2. Click **"+"** to register a new identifier
3. Select **"App IDs"** > **"App"**
4. Fill in:
   - **Description**: Bonifatus
   - **Bundle ID**: `com.bonifatus.app` (Explicit)
5. Enable capabilities:
   - **Associated Domains** (for deep links)
   - **Push Notifications** (if needed later)
6. Click **"Register"**

### Step 3: Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **"My Apps"** > **"+"** > **"New App"**
3. Fill in:
   - **Platforms**: iOS
   - **Name**: Bonifatus
   - **Primary Language**: German
   - **Bundle ID**: com.bonifatus.app (select from dropdown)
   - **SKU**: `bonifatus-app`
4. Click **"Create"**

### Step 4: App Store Listing

In App Store Connect, go to your app and fill in:

| Field              | Value                                                |
| ------------------ | ---------------------------------------------------- |
| Subtitle           | Notenrechner & Belohnungen                           |
| Promotional Text   | Motiviere dein Kind mit Bonuspunkten fuer gute Noten |
| Description        | Full description (similar to Google Play)            |
| Keywords           | Noten,Rechner,Belohnung,Schule,Bonus,Eltern,Kinder   |
| Support URL        | https://bonifatus.com/en/contact                     |
| Marketing URL      | https://bonifatus.com                                |
| Privacy Policy URL | https://bonifatus.com/en/privacy                     |
| Category           | Education                                            |
| Age Rating         | 4+ (fill in the questionnaire)                       |

### Step 5: Screenshots

Required screenshot sizes:

- **6.7" iPhone** (1290x2796): iPhone 15 Pro Max
- **6.5" iPhone** (1284x2778): iPhone 14 Plus
- **5.5" iPhone** (1242x2208): iPhone 8 Plus
- **12.9" iPad** (2048x2732): iPad Pro

Use Xcode Simulator to take screenshots, or scale existing screenshots.

### Step 6: Build and Upload

1. Open in Xcode: `npm run cap:open:ios`
2. Select the signing team (your Apple Developer account)
3. Set the deployment target (iOS 16+)
4. Product > Archive
5. Distribute App > App Store Connect
6. Upload

Or use command line:

```bash
cd ios/App
xcodebuild archive -workspace App.xcworkspace -scheme App \
  -archivePath build/Bonifatus.xcarchive
xcodebuild -exportArchive -archivePath build/Bonifatus.xcarchive \
  -exportOptionsPlist ExportOptions.plist -exportPath build/
```

### Step 7: TestFlight

1. After upload, the build appears in App Store Connect > TestFlight
2. Add internal testers (up to 25)
3. Add external testers (up to 10,000) — requires Beta App Review
4. Test on real devices
5. When ready, submit for App Store Review

### Step 8: App Review

- First review takes 24-48 hours
- Common rejection reasons:
  - Missing privacy policy
  - App is just a website wrapper (add value with native features like push notifications)
  - Broken links or crashes
- After first approval, subsequent updates review in ~24 hours

---

## Deep Linking Setup

### Android (App Links)

1. The `AndroidManifest.xml` already has intent filters for `bonifatus.com`
2. After getting the signing key SHA-256:
   - Get it from Play Console: Release > Setup > App signing > SHA-256 fingerprint
   - Update `public/.well-known/assetlinks.json` with the real fingerprint
   - Deploy to web so the file is accessible at `https://bonifatus.com/.well-known/assetlinks.json`
3. Verify: `adb shell am start -a android.intent.action.VIEW -d "https://bonifatus.com"`

### iOS (Universal Links)

1. Update `public/.well-known/apple-app-site-association`:
   - Replace `TEAMID` with your actual Apple Team ID (from developer.apple.com > Membership)
2. In Xcode, add Associated Domains capability:
   - `applinks:bonifatus.com`
   - `applinks:dev.bonifatus.com`
3. Deploy to web so the file is accessible at `https://bonifatus.com/.well-known/apple-app-site-association`

---

## Deploy Script

The existing deploy process in DEPLOY.md handles the web app. For mobile:

```bash
# Sync Capacitor after code changes
npm run cap:sync

# Build debug APK for testing
npm run cap:build:android:debug

# Build release AAB for Google Play
cd android && ./gradlew bundleRelease

# Upload to Google Play via CLI (optional, after setting up API access)
# See https://developers.google.com/android-publisher/getting_started
```

Web deploys (DEPLOY.md) automatically update the mobile app content since the native shell loads from the live URL. Only rebuild the native app when:

- Adding/removing Capacitor plugins
- Changing native config (splash screen, permissions, deep links)
- Updating Capacitor version
- Changing the app icon

---

## Capacitor Plugin Reference

| Plugin                        | Purpose                   | Status    |
| ----------------------------- | ------------------------- | --------- |
| @capacitor/app                | Back button, app state    | Installed |
| @capacitor/status-bar         | Native status bar styling | Installed |
| @capacitor/splash-screen      | Launch screen             | Installed |
| @capacitor/keyboard           | Keyboard behavior         | Installed |
| @capacitor/haptics            | Vibration feedback        | Installed |
| @capacitor/push-notifications | Push notifications        | Add later |
| @capacitor/camera             | Grade scanning            | Add later |
| @capacitor/browser            | External links            | Add later |

---

## Checklist

### Before First Android Release

- [ ] Create Google Play Developer account ($25)
- [ ] Complete identity verification
- [ ] Create app listing with screenshots and descriptions
- [ ] Complete content rating questionnaire
- [ ] Complete data safety form
- [ ] Generate upload keystore
- [ ] Configure Gradle signing
- [ ] Update assetlinks.json with signing key SHA-256
- [ ] Build signed AAB
- [ ] Upload to internal testing track
- [ ] Test on 3+ real devices
- [ ] Promote to production

### Before First iOS Release

- [ ] Enroll in Apple Developer Program ($99/year)
- [ ] Create App ID with bundle identifier
- [ ] Create app in App Store Connect
- [ ] Add app listing, screenshots, metadata
- [ ] Add iOS platform: `npx cap add ios`
- [ ] Configure signing in Xcode
- [ ] Update apple-app-site-association with Team ID
- [ ] Archive and upload via Xcode
- [ ] Test via TestFlight
- [ ] Submit for App Store Review
