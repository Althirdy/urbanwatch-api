# UrbanWatch: Smart Concern Validation & Spam Prevention System
## Master Implementation Plan

### 1. Objective
Transition from a "Fire-and-Forget" submission model to an "Analyze-First" model. This ensures that only valid, actionable concerns reach the Purok Leaders, while users receive immediate feedback on their submission status.

### 2. Architecture Overview

**Flow:**
1.  **Citizen** submits concern (Manual/Voice).
2.  **API** saves record with status `analyzing` (Hidden from Dashboard).
3.  **API** dispatches background Job (`ProcessManualConcernJob` / `ProcessVoiceConcernJob`).
4.  **Gemini AI** (`validateAndClassify`) analyzes content for:
    *   **Validity:** Is this a real community concern? (Reject spam, gibberish, or irrelevant chat).
    *   **Category/Severity:** Classification.
5.  **Job** processes result:
    *   *Valid:* Updates status to `pending` -> **Finalizes** (Assigns/Deduplicates) -> **Notifies Purok Leader** (App + SMS) -> Broadcasts `ValidationSuccess`.
    *   *Invalid:* Updates status to `rejected` -> Logs Strike -> Broadcasts `ValidationFailed`.
6.  **Citizen App** listens to WebSocket events to update UI from "Verifying..." to "Submitted" or "Rejected".

---

### 3. Backend Implementation (Laravel API)

#### 3.1. Database Schema
**Action:** Create a new migration `add_validation_columns_to_users_and_concerns`.

*   **Table: `users`**
    *   `false_alarm_strikes` (integer, default: 0)
*   **Table: `concerns`**
    *   Modify `status` enum: Add `'analyzing'`, `'rejected'`.
    *   `rejection_reason` (string, nullable)
    *   `is_valid` (boolean, nullable)
    *   `ai_analysis_raw` (json, nullable)

#### 3.2. Models
*   **`User`**: Add `false_alarm_strikes` to `$fillable`.
*   **`Concern`**: Add `rejection_reason`, `is_valid`, `ai_analysis_raw` to `$fillable`.

#### 3.3. Service Layer (`ConcernService`)
*   **`createConcern` Method:** Set initial status to `'analyzing'`.
*   **`markAsValid` Method:** Update status to `'pending'`, finalize, and notify.
*   **`markAsInvalid` Method:** Update status to `'rejected'`, log strike, and broadcast failure.
*   **`finalizeConcern` Method:** Trigger App (Notification facade) and SMS (`SmsService`) to Purok Leader.

#### 3.4. Gemini Service (`GeminiService`)
*   **New Method:** `validateAndClassify(string $text, ?string $imageContent = null, ?string $mimeType = null)`
    *   **Prompt Strategy:**
        *   "Analyze this text (and optional image). Return JSON: `{ 'is_valid': boolean, 'rejection_reason': string, 'category': string, 'severity': string, 'confidence': float }`."
        *   **CRITICAL:** For Concerns, expect **REAL** incidents (not simulation/toys). Treat "DEMO:" as irrelevant or unnecessary for this flow.
        *   **Rejection Criteria:** Gibberish ("asdf"), irrelevant/chat ("Kumain ka na?"), selfies, memes.
        *   **Acceptance Criteria:** Infrastructure issues, accidents, safety threats, environmental issues.

---

### 4. Frontend Implementation (Citizen App)
*   **Optimistic UI:** Show "Verifying..." (Yellow) badge immediately.
*   **Real-time:** Listen for `ValidationSuccess` / `ValidationFailed` via Laravel Echo.
*   **Feedback:** Show rejection reason and strike count on failure.

---

### 5. Test Cases & Validation Logic

| Case ID | Input Type | Content | Expected Result | Reason |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Text | "May malaking butas sa gitna ng kalsada sa tapat ng school." | **VALID** | Legitimate Infrastructure concern. |
| **TC-02** | Text | "Sunog sa may Purok 4! Mabilis kumalat ang apoy." | **VALID** | Emergency/Safety concern. |
| **TC-03** | Text | "asdfghjkl12345" | **INVALID** | Gibberish/Spam. |
| **TC-04** | Text | "Ang ganda ng weather ngayon, sana masarap ulam niyo." | **INVALID** | Irrelevant content (Chat). |
| **TC-05** | Image+Text | [Photo of real car crash] + "Banggaan sa intersection." | **VALID** | Real incident (No "DEMO:" required). |
| **TC-06** | Text | "Test report ignore this" | **INVALID** | Non-actionable testing spam. |
| **TC-07** | Text | "Baha na po sa kanto namin dahil sa baradong kanal." | **VALID** | Environmental/Sanitation concern. |

---

### 6. Integration Strategy
1.  **Backend:** Migrations, Model updates, and `SmsService` stub.
2.  **AI:** Implement `validateAndClassify` with strict "Real World" instructions.
3.  **Jobs:** Update `ProcessManualConcernJob` and `ProcessVoiceConcernJob` to use the new AI gatekeeper.
4.  **Testing:** Execute the Test Cases (TC-01 to TC-07) using a test script or Postman. Verify database flags and notification triggers.

---

### 7. QA End-to-End Testing Guide

This guide describes how to verify the entire system manually using the **Citizen App** and **Purok Leader Dashboard** (or Database/Logs).

#### **Prerequisites**
1.  **Queue Worker Running:** `ddev php artisan queue:work` (Must be running to process AI).
2.  **WebSockets Running:** `ddev php artisan reverb:start` (or Pusher active).
3.  **Citizen App:** Logged in as a regular user.

#### **Scenario A: The "Happy Path" (Valid Concern)**
*   **Goal:** Verify a legitimate report is accepted, categorized, and notified.
*   **Steps:**
    1.  Open Citizen App > **Report Concern**.
    2.  Enter Title: "Broken Street Light".
    3.  Enter Description: "The street light at the corner of Main St is completely dark. It's dangerous." (TC-01).
    4.  Submit.
*   **Verification:**
    *   **App UI:** Card should initially say **"Verifying..."** (Yellow). After ~5-10 seconds, it should flip to **"Pending"** (Green) with a success toast.
    *   **Database:** Check `concerns` table. `status`='pending', `is_valid`=1, `category`='infrastructure'.
    *   **SMS:** Purok Leader (User ID 2) should receive an SMS notification.

#### **Scenario B: The "Spam" Path (Invalid Concern)**
*   **Goal:** Verify the AI rejects spam and warns the user.
*   **Steps:**
    1.  Open Citizen App > **Report Concern**.
    2.  Enter Title: "Test Spam".
    3.  Enter Description: "asdfghjkl12345" (TC-03).
    4.  Submit.
*   **Verification:**
    *   **App UI:** Card should initially say **"Verifying..."**. After ~5 seconds, it should flip to **"Rejected"** (Red).
    *   **Alert:** A popup/alert should appear: "Concern Rejected. Reason: Gibberish/Spam. Strike 1/5".
    *   **Database:** Check `users` table for your user. `false_alarm_strikes` should increment.

#### **Scenario C: Voice Concern (Multimodal)**
*   **Goal:** Verify audio is transcribed and validated.
*   **Steps:**
    1.  Open Citizen App > **Voice Report**.
    2.  Record: "Hello, may sunog dito sa may palengke, pakipadala ng tulong." (TC-02).
    3.  Submit.
*   **Verification:**
    *   **App UI:** Card should show **"Verifying..."**.
    *   **Wait:** This takes longer (transcription + analysis).
    *   **Result:** Status becomes **"Pending"**.
    *   **Detail View:** Open the concern. You should see the **Transcript** text populated.

#### **Scenario D: Duplicate Detection (Clustering)**
*   **Goal:** Verify duplicate reports are merged.
*   **Steps:**
    1.  **User A** submits "Big fire at Public Market" (Valid). Wait for it to become 'Pending'.
    2.  **User B** (or same user) immediately submits "Fire at Public Market" (Same category, close location).
*   **Verification:**
    *   **App UI:** User B gets a special notification: "Concern Merged. Your report was added as a follow-up...".
    *   **Database:** The second concern should have `is_duplicate`=1 and `parent_concern_id` pointing to the first concern.
    *   **SMS:** Purok Leader should **NOT** receive a second SMS for the duplicate.