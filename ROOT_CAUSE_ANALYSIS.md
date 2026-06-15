# Root Cause Analysis: Invitations, Contact Requests & Notification System

## Identified Issues

### 1. Dashboard Data Gaps
Both Recruiter and Developer dashboards were lacking queries for specific cross-role interactions.
- **Recruiters** could not see contact requests initiated by Developers or a consolidated list of incoming applications within their main dashboard view.
- **Developers** had limited visibility into recruiter-initiated contact requests and project invitations across different tabs.
- Queries were often one-way (e.g., only showing requests the user *sent* but not those they *received*).

### 2. Notification System Failures
- **Inconsistent Schema:** The application was using a mix of `read_at` (timestamp) and `is_read` (boolean) for tracking notification status, causing UI inconsistencies.
- **Manual Generation:** Notifications were being manually inserted via the frontend in components like `ContactAccess.tsx` and `InviteDeveloperDialog.tsx`. This approach is fragile, prone to race conditions, and fails for background events or status updates performed by other users.
- **Missing Triggers:** Critical workflow events such as Project Assignment, Project Completion, and New Messages lacked robust server-side triggers to ensure notification delivery.

### 3. Realtime Update Limitations
Realtime subscriptions in the dashboard were not exhaustive. They didn't monitor all the necessary tables (Applications, Invites, Contact Requests) for all relevant events (Insert/Update), resulting in a "stale" UI that required a page refresh to show new data.

### 4. RLS & Query Filters
Some queries were missing explicit filters for the current user's ID, and RLS policies (while present) were not always aligned with the complex multi-party access required for notifications and shared contact details.

## Resolved Solutions

1.  **Dashboard Enhancement:** Added comprehensive queries to `src/routes/dashboard.tsx` for both roles, ensuring all incoming and outgoing requests/invites are visible.
2.  **Notification System Upgrade:** Created a new migration (`20260615000000_notification_system_upgrade.sql`) that:
    - Standardizes the `notifications` table (adding `actor_id`, `reference_id`, `is_read`).
    - Implements robust PostgreSQL triggers for all core actions (Applications, Invites, Contact Requests, Messages, Project Assignments, and Completion).
3.  **Frontend Standardization:** Updated `NotificationBell.tsx` and dashboard components to use the standardized notification schema with backward compatibility.
4.  **Exhaustive Realtime:** Expanded Supabase Realtime listeners in the dashboard to automatically invalidate and re-fetch data for all relevant workflow changes.
5.  **Removed Redundant Logic:** Cleaned up manual notification insertion in frontend components to rely solely on the database as the single source of truth.
