# AINOS Cron Job Setup Guide

## Overview
AINOS has two automation endpoints that need to run daily:
1. **Recurring Invoices** — Auto-generates invoices for regular clients
2. **Auto Reminders** — Sends payment reminders for overdue invoices

## Option 1: Render Cron (Recommended)

### Setup Steps:
1. Go to https://dashboard.render.com
2. Select your AINOS service
3. Click "Cron Jobs" in the left sidebar
4. Click "Add Cron Job"
5. Configure:
   - **Name:** `Recurring Invoices`
   - **Schedule:** `0 9 * * *` (9 AM daily)
   - **Command:** `curl -H "Authorization: Bearer $CRON_SECRET" https://ainossuite.com/api/cron/recurring-invoices`
6. Click "Save Changes"
7. Repeat for Auto Reminders:
   - **Name:** `Auto Reminders`
   - **Schedule:** `0 10 * * *` (10 AM daily)
   - **Command:** `curl -H "Authorization: Bearer $CRON_SECRET" https://ainossuite.com/api/cron/auto-reminders`

`CRON_SECRET` has to exist in the service's environment (see Authorization at
the end of this guide); Render expands it inside the command.

### Cost:
- Render Cron: **Free** (included with all plans)

---

## Option 2: cron-job.org (Free Alternative)

### Setup Steps:
1. Go to https://cron-job.org → Sign up (free)
2. Click "Create cronjob"
3. Configure:
   - **Title:** `AINOS Recurring Invoices`
   - **URL:** `https://ainossuite.com/api/cron/recurring-invoices?key=<CRON_SECRET>`
   - **Schedule:** Daily at 9:00 AM
   - **Timezone:** Asia/Kolkata
4. Click "Create"
5. Repeat for Auto Reminders:
   - **Title:** `AINOS Auto Reminders`
   - **URL:** `https://ainossuite.com/api/cron/auto-reminders?key=<CRON_SECRET>`
   - **Schedule:** Daily at 10:00 AM

### Cost:
- cron-job.org: **Free** (up to 60 jobs)

---

## Option 3: UptimeRobot (Simple)

### Setup Steps:
1. Go to https://uptimerobot.com → Sign up (free)
2. Click "Add New Monitor"
3. Configure:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** `AINOS Recurring Invoices`
   - **URL:** `https://ainossuite.com/api/cron/recurring-invoices?key=<CRON_SECRET>`
   - **Monitoring Interval:** Every 30 minutes (or daily)
4. Click "Create Monitor"
5. Repeat for Auto Reminders

### Cost:
- UptimeRobot: **Free** (up to 50 monitors)

---

## Testing

After setup, manually trigger once to verify (add the `Authorization` header or
`?key=` shown further down once `CRON_SECRET` is configured):

```bash
# Test recurring invoices
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://ainossuite.com/api/cron/recurring-invoices

# Expected response:
{"success":true,"generated":0,"errors":0,"total":0}

# Test auto reminders
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://ainossuite.com/api/cron/auto-reminders

# Expected response:
{"success":true,"remindersSent":0,"errors":0,"total":0}
```

**Note:** `total: 0` means no recurring invoices or overdue invoices exist yet. Once you create them, the count will increase.

---

## What Happens When Cron Runs

### Recurring Invoices:
1. Scans all active `RecurringInvoice` rows where `nextRunDate <= today`
2. For each:
   - Generates a real `Invoice` with GST split (CGST/SGST)
   - Sequential numbering (AIN-0001-2026, AIN-0002-2026, etc.)
   - 30-day due date
   - Status: `draft`
3. Updates `nextRunDate` based on frequency (daily/weekly/monthly/quarterly/yearly)
4. Marks as `completed` if `endDate` passed

### Auto Reminders:
1. Finds all invoices where `dueDate < today` and `status != paid`
2. For each overdue invoice:
   - Sends branded email via Resend to customer email
   - Includes days overdue, amount, invoice number
3. Logs sent/failed counts

---

## Monitoring

Check cron execution logs:
- **Render:** Dashboard → Cron Jobs → Click job → "Logs" tab
- **cron-job.org:** Dashboard → Click job → "Executions" tab
- **UptimeRobot:** Dashboard → Click monitor → "Details"

---

## Troubleshooting

### Cron returns 401 or 503:
- `503` — `CRON_SECRET` is not set on the deployment. Add it in Render env.
- `401` — the scheduler is sending a different value than the deployed secret.

### Cron returns 404:
- Production deploy not complete. Check Render build logs.
- Trigger manual deploy: Render Dashboard → Manual Deploy → "Deploy latest commit"

### Cron returns error:
- Check Render logs for stack trace
- Verify database connection (Aiven PostgreSQL)
- Check RESEND_API_KEY in .env (for auto-reminders)

### No invoices generated:
- Create a RecurringInvoice first (via API or admin panel)
- Ensure `nextRunDate <= today` and `status = active`

### No reminders sent:
- Create overdue invoices (dueDate in past, status != paid)
- Ensure customers have email addresses
- Verify RESEND_API_KEY is set

---

## Authorization (required in production)

Every cron endpoint (`/api/cron/recurring-invoices`, `/api/cron/auto-reminders`,
`/api/cron/refresh-credits`) and `/api/blog-agent/auto-generate` is guarded by
`cronAuthorized()` in `src/lib/security.ts`. They generate invoices, refill
credits and email customers, so an unauthenticated call is money-moving work:

- On the live deployment the routes **fail closed** — with `CRON_SECRET` missing
  they answer `503`, not `200`. Locally, with no secret set, they stay open so
  the existing scheduler URL keeps working while you build.
- The guard accepts either form below. Prefer the header; the query parameter
  exists for schedulers that can only hit a URL (cron-job.org, UptimeRobot).

### 1. Set the secret once, in three places

```bash
# Generate one strong value
openssl rand -hex 32
```

| Place | Key | Value |
| --- | --- | --- |
| Render → Environment | `CRON_SECRET` | the generated value |
| GitHub → Settings → Secrets and variables → Actions | `CRON_SECRET` | **the same** value |
| Local `.env` (optional) | `CRON_SECRET` | anything, only for testing |

### 2. Header form (Render Cron Jobs, GitHub Actions, Vercel Cron)

Render Cron Jobs run a real command inside the service, so the secret is
already in the environment:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  https://ainossuite.com/api/cron/recurring-invoices
```

### 3. Query form (URL-only schedulers such as cron-job.org)

```text
https://ainossuite.com/api/cron/auto-reminders?key=<CRON_SECRET>
```

The key lands in access logs on the scheduler's side, so use the header form
whenever the tool allows it.

### Verifying

```bash
# Expected: 401 (wrong/absent secret) or 503 (CRON_SECRET not configured)
curl -o /dev/null -w "%{http_code}\n" https://ainossuite.com/api/cron/recurring-invoices

# Expected: 200
curl -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer <CRON_SECRET>" \
  https://ainossuite.com/api/cron/recurring-invoices
```
