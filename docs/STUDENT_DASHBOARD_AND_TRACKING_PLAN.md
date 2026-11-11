# BusGraph FYP Feature Implementation Roadmap

## Overview
This document outlines the planned future features for the BusGraph application:
1. **Student Commute Dashboard & Metrics**
2. **"I Boarded / I Exited" Live Crowdsourced Bus Spotting**
3. **Route-Specific Commuter Live Chat Rooms**
4. **Commute Coin & EasyPaisa Reward System**

---

## 1. Student Dashboard & Commute Metrics
- **Financial & Distance Stats:**
  - Total money spent (filterable by This Month / This Year / All Time).
  - Total kilometers traveled via bus.
  - Total kilometers walked (boarding and destination legs).
  - Estimated savings compared to ride-hailing services (Rickshaw / Bykea).
- **Commute Habits & Analytics:**
  - Most frequent stops / transit hubs.
  - Primary bus line utilized.
  - Carbon footprint reduction estimate (CO₂ saved).
- **Commute Rewards Widget:**
  - Live Coin balance.
  - Progress bar toward the next EasyPaisa cashout threshold.

---

## 2. "I Boarded" & "I Exited" Live Bus Tracker
- **"I Boarded" Action:**
  - Commuter taps "I Boarded This Bus" and selects/confirms current route (e.g., `R11`).
  - Broadcasts timestamped GPS coordinate to place a live bus indicator on the map for all commuters.
- **"I Exited" Action:**
  - Commuter taps "I Exited".
  - Automatically calculates completed distance and duration.
  - Updates personal Dashboard statistics.
  - Credits Commute Coins to the user's balance.

---

## 3. Per-Bus Live Chat Rooms (Route Channels)
- **Isolated Route Channels:**
  - Dedicated discussion thread per route (e.g., `#R11-chat`, `#EV3-chat`).
- **Quick-Tag Status Updates:**
  - 1-tap structured tags to maintain a clean, professional channel:
    - 📍 *"Bus crossed [Stop Name]"*
    - 💺 *"Seats available"* / *"Standing only"*
    - ⚠️ *"Traffic delay near [Area]"*
- **Free-Text Communication:**
  - Allows verified students to share quick route queries and updates.
- **Moderation & Verification:**
  - Verified student badge shown alongside user tags.

---

## 4. Student Reward & EasyPaisa Payout System
- **Reward Mechanics:**
  - Earn coins through validated board/exit confirmations and helpful community alerts.
- **Redemption:**
  - Accumulate sufficient coin balance to redeem against ticket fare via EasyPaisa payout.

