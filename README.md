# QuickTrack Mobile

A cross-platform React Native (Expo) app for field technicians to log and sync equipment status — even without internet.

## Features

- **Offline-first** — SQLite local queue stores all data; syncs to REST API on reconnect
- **Equipment management** — Create, view, and track equipment by category, status, and location
- **Service logs** — Log equipment check-ins with status, notes, and on-site photos
- **Camera integration** — Capture photos directly or choose from library (Expo Camera)
- **PDF reports** — Generate and share equipment reports on-device (expo-print)
- **Push notifications** — Overdue check alerts and daily reminders (expo-notifications)
- **Auto-sync** — Polls for connectivity every 30s and flushes the SQLite sync queue
- **iOS & Android** — Built with Expo for universal deployment

---

## Tech Stack

| Package | Purpose |
|---|---|
| React Native + Expo | Cross-platform foundation |
| expo-sqlite | Offline-first local database |
| @react-native-async-storage/async-storage | Settings & preferences |
| expo-camera / expo-image-picker | On-site photo capture |
| expo-print + expo-sharing | PDF report generation & sharing |
| expo-notifications | Push notifications (overdue + daily) |
| expo-network | Connectivity detection for auto-sync |
| @react-navigation/native | Navigation (tabs + stack) |
| date-fns | Date formatting |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
- [Expo Go](https://expo.dev/go) app on your iOS or Android device (for quick testing)

### Install

```bash
# Clone / unzip the project
cd QuickTrackMobile

# Install dependencies
npm install

# Start the development server
npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press `i` for iOS simulator / `a` for Android emulator.

---

## Project Structure

```
QuickTrackMobile/
├── App.tsx                         # Entry point, DB init
├── app.json                        # Expo config
├── src/
│   ├── db/
│   │   ├── database.ts             # SQLite init + seed data
│   │   └── queries.ts              # All DB read/write functions
│   ├── screens/
│   │   ├── DashboardScreen.tsx     # Home with stats + overdue alert
│   │   ├── EquipmentListScreen.tsx # Search, filter, list
│   │   ├── EquipmentDetailScreen.tsx # Detail + logs + PDF export
│   │   ├── LogEntryScreen.tsx      # New log with photos
│   │   ├── AddEquipmentScreen.tsx  # Add new equipment
│   │   └── SettingsScreen.tsx      # API URL, tech name, notifications
│   ├── components/
│   │   └── ui.tsx                  # Shared components (Button, Card, Badge…)
│   ├── hooks/
│   │   └── useNetworkSync.ts       # Connectivity + auto-sync hook
│   ├── navigation/
│   │   └── AppNavigator.tsx        # Tab + stack navigator setup
│   └── utils/
│       ├── theme.ts                # Colors, spacing, typography tokens
│       ├── syncService.ts          # REST API sync + AsyncStorage helpers
│       ├── pdfGenerator.ts         # HTML → PDF report
│       └── notifications.ts        # Push notification registration + scheduling
└── assets/                         # App icons and splash (add your own)
```

---

## Configuration

### API URL

Open the **Settings** tab in the app and update the **API Base URL** to point to your server. The sync service will POST new equipment and logs, and PUT updates, to:

- `POST /equipment` — new equipment
- `PUT /equipment/:id` — equipment update
- `POST /equipment-logs` — new log entry

### Technician Name

Set your name in **Settings** — it's saved locally and stamped on every log entry.

### Push Notifications

Toggle notifications on in **Settings**. A physical device is required (simulators don't support push tokens). The app will request permission and schedule a daily 8:00 AM reminder plus an immediate alert whenever overdue equipment is detected.

---

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Configure the build
eas build:configure

# Build for iOS (requires Apple Developer account)
eas build --platform ios

# Build for Android
eas build --platform android
```

Update `app.json` with your own `bundleIdentifier` (iOS) and `package` (Android) before building.

---

## Demo Data

The app seeds 5 demo equipment items on first launch so you can explore all features immediately. All demo data is stored locally in SQLite and does not sync until you configure a valid API URL.

---

## Portfolio Notes

- **Architecture**: Offline-first with a SQLite sync queue pattern — suitable for any field-service or asset-tracking domain
- **State management**: React hooks + SQLite as source of truth (no Redux/Zustand needed for this scale)
- **PDF generation**: Uses expo-print's HTML renderer for fully custom, branded reports
- **Notifications**: Combines scheduled (daily) and event-driven (overdue) notification patterns

---

Built with React Native & Expo · 2024
