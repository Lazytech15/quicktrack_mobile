# QuickTrack Mobile

A cross-platform React Native app for field technicians to track, inspect, and report on equipment — fully functional offline.

---

## Overview

QuickTrack is built for environments where internet connectivity is unreliable. Technicians can register equipment, log inspection results with photos, and generate PDF reports entirely on-device. When connectivity is restored, the app automatically syncs all pending records to a configurable REST API.

---

## Features

- **Offline-first** — all data is stored locally in SQLite; the app works fully without a network connection
- **Equipment management** — register and manage equipment across categories: HVAC, Electrical, Plumbing, Safety, and Mechanical
- **Service logs** — record inspection results with technician name, status, timestamped notes, and attached photos
- **Photo capture** — attach photos from the camera or photo library directly to a log entry
- **PDF reports** — generate a full equipment report (details + service history) on-device and export via the native share sheet
- **Sync queue** — every write is queued in SQLite and flushed to a REST API on reconnect, with per-item retry tracking and success/failure status
- **Push notifications** — immediate alert when overdue equipment is detected on app load; configurable daily 8 AM reminder
- **Overdue tracking** — dashboard and equipment list both surface items past their next-check date
- **Cross-platform** — runs on iOS and Android via Expo

---

## Screenshots

| Dashboard | Equipment List | Equipment Detail |
|-----------|---------------|-----------------|
| _(add screenshot)_ | _(add screenshot)_ | _(add screenshot)_ |

---

## Tech Stack

| Package | Purpose |
|---|---|
| `react-native` + `expo` | Cross-platform mobile framework |
| `expo-sqlite` | Local on-device database |
| `expo-router` | File-based navigation |
| `react-navigation` | Stack and tab navigation |
| `expo-notifications` | Push and scheduled notifications |
| `expo-print` + `expo-sharing` | PDF generation and native share sheet |
| `expo-image-picker` + `expo-camera` | Photo capture and library access |
| `@react-native-async-storage/async-storage` | Persisted user settings |
| `date-fns` | Date formatting and comparison |

---

## Project Structure

```
QuickTrack/
├── App.tsx                          # Root component — DB init, navigation setup
├── index.js                         # Entry point (registerRootComponent)
├── src/
│   ├── screens/
│   │   ├── DashboardScreen.tsx      # Overview: stats, overdue alert, recent equipment
│   │   ├── EquipmentListScreen.tsx  # Searchable, filterable equipment list
│   │   ├── EquipmentDetailScreen.tsx # Equipment info, logs, PDF export
│   │   ├── AddEquipmentScreen.tsx   # Form to register new equipment
│   │   ├── LogEntryScreen.tsx       # Form to log an inspection with photos
│   │   └── SettingsScreen.tsx       # Technician name, API URL, notifications
│   ├── navigation/
│   │   └── AppNavigator.tsx         # Bottom tabs + stack navigators
│   ├── db/
│   │   ├── database.ts              # SQLite init, schema creation, seed data
│   │   └── queries.ts               # All read/write queries + sync queue logic
│   ├── components/
│   │   └── ui.tsx                   # Shared components: Button, Card, StatusBadge, etc.
│   ├── hooks/
│   │   └── useNetworkSync.ts        # Network state + auto-sync on reconnect
│   └── utils/
│       ├── theme.ts                 # Colors, spacing, typography, responsive scale helpers
│       ├── pdfGenerator.ts          # HTML-to-PDF report builder
│       ├── syncService.ts           # REST API sync queue processor
│       └── notifications.ts        # Push notification registration and scheduling
└── assets/                          # App icons and splash screen
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your device, or a simulator

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/quicktrack-mobile.git
cd quicktrack-mobile

# Install dependencies
npm install

# Start the dev server
npx expo start --clear
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS).

### Running on a simulator

```bash
# iOS (requires Xcode)
npx expo run:ios

# Android (requires Android Studio)
npx expo run:android
```

> **Note:** Push notifications require a physical device and a development build. They are not fully supported in Expo Go as of SDK 53+.

---

## Database Schema

### `equipment`

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER | Primary key |
| `name` | TEXT | Equipment name |
| `location` | TEXT | Physical location |
| `serial_number` | TEXT | Optional serial number |
| `category` | TEXT | HVAC, Electrical, Plumbing, Safety, Mechanical |
| `status` | TEXT | `active`, `maintenance`, `offline`, `decommissioned` |
| `last_checked` | TEXT | ISO timestamp of last inspection |
| `next_check_due` | TEXT | ISO timestamp of next scheduled check |
| `notes` | TEXT | Free-form notes |
| `created_at` | TEXT | ISO timestamp |
| `updated_at` | TEXT | ISO timestamp |

### `equipment_logs`

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER | Primary key |
| `equipment_id` | INTEGER | Foreign key → equipment |
| `technician` | TEXT | Technician display name |
| `status` | TEXT | OK, Needs Attention, Critical, Repaired, Inspected |
| `notes` | TEXT | Inspection notes |
| `photos` | TEXT | JSON array of local image URIs |
| `created_at` | TEXT | ISO timestamp |
| `synced` | INTEGER | `0` = pending, `1` = synced |
| `sync_attempts` | INTEGER | Number of sync attempts made |

### `sync_queue`

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER | Primary key |
| `table_name` | TEXT | Target table (`equipment` or `equipment_logs`) |
| `record_id` | INTEGER | ID of the record to sync |
| `operation` | TEXT | `INSERT` or `UPDATE` |
| `payload` | TEXT | JSON payload for the API request |
| `status` | TEXT | `pending`, `completed`, `failed` |
| `attempts` | INTEGER | Retry count |
| `last_attempt` | TEXT | ISO timestamp of last attempt |

---

## Sync Architecture

Every create or update operation immediately writes to SQLite and adds an entry to the `sync_queue` table. A background hook (`useNetworkSync`) monitors network state via `expo-network`. When the device comes online, it calls `syncQueue()` which iterates the pending queue and posts each item to the configured REST API endpoint:

- `INSERT` operations → `POST /api/{table-name}`
- `UPDATE` operations → `PUT /api/{table-name}/{id}`

Successful items are marked `completed`. Failed items are marked `failed` and can be retried. The pending count is shown in the UI via the sync banner and Settings screen.

---

## Configuration

In the Settings screen you can set:

- **Technician name** — shown on all log entries
- **API base URL** — the REST endpoint to sync data to (e.g. `https://api.yourcompany.com/v1`)

Both values are persisted in `AsyncStorage`.

---

## PDF Reports

Tapping **PDF Report** on any equipment detail screen generates an HTML report on-device using `expo-print`, then opens the native share sheet via `expo-sharing`. The report includes:

- Equipment details (name, location, serial number, category, status, next due date)
- Full service log history with technician names, timestamps, statuses, notes, and photos
- Sync status per log entry
- Generation timestamp

---

## Notifications

Two notification types are used:

| Type | Trigger | Content |
|---|---|---|
| Overdue alert | On app load when overdue items exist | Lists affected equipment names |
| Daily reminder | Every day at 8:00 AM | Prompt to review the day's schedule |

Both require permission grant on first use. Notifications can be toggled in Settings.

---

## License

MIT