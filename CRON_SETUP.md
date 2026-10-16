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
   - **Command:** `curl https://ainos-ywu0.onrender.com/api/cron/recurring-invoices`
6. Click "Save Changes"
7. Repeat for Auto Reminders:
   - **Name:** `Auto Reminders`
   - **Schedule:** `0 10 * * *` (10 AM daily)
   - **Command:** `curl https://ainos-ywu0.onrender.com/api/cron/auto-reminders`

### Cost:
- Render Cron: **Free** (included with all plans)

---

## Option 2: cron-job.org (Free Alternative)

### Setup Steps:
1. Go to https://cron-job.org → Sign up (free)
2. Click "Create cronjob"
3. Configure:
   - **Title:** `AINOS Recurring Invoices`
   - **URL:** `https://ainos-ywu0.onrender.com/api/cron/recurring-invoices`
   - **Schedule:** Daily at 9:00 AM
   - **Timezone:** Asia/Kolkata
4. Click "Create"
5. Repeat for Auto Reminders:
   - **Title:** `AINOS Auto Reminders`
   - **URL:** `https://ainos-ywu0.onrender.com/api/cron/auto-reminders`
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
   - **URL:** `https://ainos-ywu0.onrender.com/api/cron/recurring-invoices`
   - **Monitoring Interval:** Every 30 minutes (or daily)
4. Click "Create Monitor"
5. Repeat for Auto Reminders

### Cost:
- UptimeRobot: **Free** (up to 50 monitors)

---

## Testing

After setup, manually trigger once to verify:

```bash
# Test recurring invoices
curl https://ainos-ywu0.onrender.com/api/cron/recurring-invoices

# Expected response:
{"success":true,"generated":0,"errors":0,"total":0}

# Test auto reminders
curl https://ainos-ywu0.onrender.com/api/cron/auto-reminders

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

## Security Note

These endpoints have no auth (designed for cron services). If you want to add auth:

1. Add `CRON_SECRET` to .env:
   ```
   CRON_SECRET=your-random-secret-here
   ```

2. Update both cron routes to check:
   ```typescript
   const authHeader = req.headers.get('authorization');
   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
   ```

3. Update cron job commands:
   ```bash
   curl -H "Authorization: Bearer your-random-secret-here" https://ainos-ywu0.onrender.com/api/cron/recurring-invoices
   ```
