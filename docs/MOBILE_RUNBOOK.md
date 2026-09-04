# Codempress — Mobile (Capacitor) Build Runbook

**Why a separate client?** The spec's `CodeEmpress-debug.apk` comes from a
Capacitor + **Vite/React** client, not the Next.js app. Next.js is server-rendered
and doesn't map cleanly to a Capacitor WebView (which expects a static SPA).
So the mobile app is a **separate Vite + React project** that reuses the API.
This runbook is the path to produce the APK.

> ⚠️ **Sandbox limitation:** this workspace cannot compile the APK. It has
> **Java 11** and only **Gradle 4.4** available, with no Android SDK platform.
> Modern Capacitor needs **Java 17, Gradle 8.x, AGP 8.x, Android SDK 34/35**.
> Run the steps below on a machine with those (or in CI with
> `android`/`gradle`/`java-17` setup).

---

## 1. Prerequisites (local machine)

| Tool | Version |
|---|---|
| Node.js | ≥ 18 |
| Java | 17 (OpenJDK) |
| Android SDK | Platforms 34/35, Build-Tools, `cmdline-tools` |
| Gradle | 8.0+ (Capacitor ships a wrapper; a system Gradle isn't required) |
| ANDROID_HOME | set to your SDK path |

## 2. Create the mobile client

```bash
npm create vite@latest codempress-mobile -- --template react-ts
cd codempress-mobile
npm install @capacitor/core @capacitor/cli @capacitor/android \
            @capacitor/preferences @capacitor/network @capacitor/local-notifications
npx cap init "Codempress" "com.codempress.app" --web-dir dist
```

## 3. Wire the offline-first pieces (spec §4.3, §4.2)

- Add a **local-first data layer** (Dexie/IndexedDB) as the source of truth.
- Add an **offline sync queue** (JSON array in localStorage) flushed on
  `navigator.onLine`.
- Port the **Code Forge** sandbox (see `src/app/forge/page.tsx` for a
  reference implementation) — JS via isolated iframe, Python via Pyodide.
- Store the auth token in `@capacitor/preferences` (secure storage), **not**
  localStorage.

## 4. Build web assets + sync to Android

```bash
npm run build                      # outputs dist/
npx cap add android                # generates android/ project
npx cap sync android
```

## 5. Generate the APK

```bash
cd android
./gradlew assembleDebug            # -> android/app/build/outputs/apk/debug/app-debug.apk
```

Rename/copy as `CodeEmpress-debug.apk` at the repo root.

## 6. (Optional) Continue background service, not foreground

Use fg service when executing the command to avoid a timeout:

```bash
./gradlew assembleDebug --no-daemon
```

## Common failures

- `Java 11` → install JDK 17 and set `JAVA_HOME`.
- `SDK location not found` → set `local.properties` `sdk.dir=/path/to/android-sdk`.
- `Could not find com.android.tools.build:gradle` → ensure AGP version in
  `android/build.gradle` matches your Capacitor SDK version.
- `Downloading Gradle...` stalls → pre-warm the Gradle distribution or run once
  with network.
