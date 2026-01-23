# UrbanWatch: Smart Concern Validation & Spam Prevention System
## Technical Implementation Plan

### 1. Overview
The goal is to transition from a "Fire-and-Forget" submission model to an "Analyze-First" model using Gemini AI. This prevents false alarms and spam from reaching responders while maintaining a responsive user experience through optimistic UI updates and real-time validation.

### 2. User Experience (UX) Flow

#### Step 1: Submission (Optimistic UI)
- **Action:** Citizen submits a manual or voice concern.
- **Immediate Feedback:** 
  - The app creates a temporary card in the "My Concerns" list.
  - **Status:** "Verifying..." (Yellow Badge).
  - **Interaction:** User is free to continue using the app. They do not need to wait on a loading screen.

#### Step 2: Background Validation (The "Gatekeeper")
- **Process:** The server accepts the request but flags it as `analyzing`. It is **hidden** from Admins/Responders.
- **AI Analysis:** A background job sends the text/image/audio to Gemini with strict instructions to identify:
  - Spam (gibberish, irrelevant content).
  - False Alarms (pranks, non-emergencies).
  - Valid Emergencies.

#### Step 3: Real-Time Result (Websockets)
- **Scenario A: Valid Report**
  - **Visual:** Card badge flips to **"Pending"** (Green).
  - **Notification:** "Concern verified. Responders alerted."
  - **System:** The report becomes visible to the Barangay Dispatcher.

- **Scenario B: Rejected (Spam/False Alarm)**
  - **Visual:** Card turns **"Rejected"** (Red).
  - **Alert:** A warning popup appears:
    > "Report Rejected: Our AI detected this as a false alarm. You have received a strike (1/3)."
  - **System:** The report remains hidden from Dispatchers or is soft-deleted.

### 3. Backend Architecture

#### Database Schema Updates
1.  **`users` Table:**
    - Add `false_alarm_strikes` (integer, default: 0).
2.  **`concerns` Table:**
    - Update `status` enum to include: `'analyzing'`, `'rejected'`.
    - Add `rejection_reason` (string, nullable) - to store Gemini's explanation.
    - Add `is_valid` (boolean, nullable).

#### Service Layer (`ConcernService.php`)
- **`createConcern`:**
    - Save initial record with status `analyzing`.
    - **Crucial:** Do NOT dispatch to Purok Leaders yet.
    - Dispatch `AnalyzeConcernJob` to the queue.
- **`processConcernResult` (New Method):**
    - **Input:** Result from Gemini (Valid/Invalid).
    - **Logic:**
        - **If Valid:** Update status to `pending` -> Call `finalizeConcern` (Assignment Logic) -> Broadcast `ConcernValidationSuccess`.
        - **If Invalid:** Update status to `rejected` -> Increment User Strike -> Check Suspension Rules -> Broadcast `ConcernValidationFailed`.

#### AI Logic (`GeminiService.php`)
- **Enhancement:** Update `analyzeImage` and `analyzeConcernCategory` prompts.
- **New Instruction:** "Strictly evaluate if this is a legitimate community concern. Reject selfies, memes, gibberish, or clear non-emergencies."

#### Auto-Suspension Logic (`UserSuspension.php`)
- **Trigger:** Called when a strike is added.
- **Rules:**
    - **Strike 3:** Warning 1 (3 Days Suspension).
    - **Strike 4:** Warning 2 (7 Days Suspension).
    - **Strike 5:** Permanent Ban.

### 4. Real-Time Events (Broadcasting)
1.  **`ConcernValidationSuccess`**
    - Channel: `citizen.{id}`
    - Payload: Concern ID, New Status (`pending`).
2.  **`ConcernValidationFailed`**
    - Channel: `citizen.{id}`
    - Payload: Concern ID, New Status (`rejected`), Strike Count, Warning Message.

### 5. Fallback Strategy
- **AI Failure:** If Gemini API fails/times out, default to **"Valid"** (Manual Review).
- **Reason:** Better to let one spam message through than to block a real emergency during an API outage.
