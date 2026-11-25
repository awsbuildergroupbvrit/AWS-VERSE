# AWS-VERSE Setup Instructions

This guide walks you through the 3-minute setup for **Google Sheets Registration (Priority 1)** and **EmailJS Spider-Verse Pass Dispatch (Priority 2)**.

---

## 1. Google Sheets Setup (Priority 1 — 2 Minutes)

1. **Create a Google Sheet**:
   - Go to [Google Sheets](https://sheets.new) and create a new blank spreadsheet.
   - Name it `AWS-VERSE Registrations`.

2. **Open Apps Script**:
   - In the spreadsheet menu, click **Extensions > Apps Script**.
   - Delete any placeholder code in `Code.gs`.
   - Open [`setup/google-apps-script.js`](./google-apps-script.js) from this repository, copy its entire contents, and paste it into `Code.gs`.
   - Click the **Save** (disk) icon or press `Ctrl + S`.

3. **Deploy as Web App**:
   - Click the blue **Deploy** button at the top right > **New deployment**.
   - Click the gear icon next to "Select type" and choose **Web app**.
   - Configure the deployment:
     - **Description**: `AWS-VERSE Registration API`
     - **Execute as**: `Me (<your-email>)`
     - **Who has access**: `Anyone` *(Crucial: allows student browsers to submit registrations)*
   - Click **Deploy**.
   - Authorize access when prompted (click *Advanced* > *Go to AWS-VERSE (unsafe)* if Google displays a verification warning).
   - Copy the generated **Web App URL** (looks like `https://script.google.com/macros/s/.../exec`).

4. **Add URL to Configuration**:
   - Add it to your `.env` file:
     ```env
     GOOGLE_SHEET_URL=https://script.google.com/macros/s/AKfycb.../exec
     VITE_GOOGLE_SHEET_URL=https://script.google.com/macros/s/AKfycb.../exec
     ```
   - In static/preview mode, you can also paste this URL directly into [`public/event-settings.js`](../public/event-settings.js):
     ```javascript
     const eventSettings = {
       googleSheetUrl: 'https://script.google.com/macros/s/AKfycb.../exec',
       ...
     };
     ```

---

## 2. EmailJS Setup (Priority 2 — 1 Minute)

1. **Create an EmailJS Account**:
   - Sign up at [emailjs.com](https://www.emailjs.com/) (free tier includes 200 emails/month, more than enough for the 120-seat limit).

2. **Add Email Service**:
   - In the EmailJS Dashboard, go to **Email Services** > **Add New Service**.
   - Choose your provider (e.g., **Gmail** or **Outlook/Custom SMTP**).
   - Connect your sender account and note the **Service ID** (e.g., `service_awsverse`).

3. **Create Email Template**:
   - Go to **Email Templates** > **Create New Template**.
   - In the subject line, enter:
     `🎟️ Your AWS-VERSE Workshop Pass [{{pass_id}}]`
   - Switch the email editor to the **HTML / Code Editor** view.
   - Open [`setup/emailjs-pass-template.html`](./emailjs-pass-template.html) from this repository, copy the entire HTML, and paste it into the EmailJS template editor.
   - Ensure the template parameters match:
     - `to_name`
     - `to_email`
     - `pass_id`
     - `roll_number`
     - `branch`
     - `year`
     - `section`
     - `event_dates`
     - `venue`
     - `event_name`
   - Save the template and note the **Template ID** (e.g., `template_spiderpass`).

4. **Get Public Key**:
   - Go to **Account** > **API Keys** in the EmailJS dashboard.
   - Copy your **Public Key** (e.g., `user_xxxxx` or `xyz123abc`).

5. **Set EmailJS Credentials**:
   - Add to your `.env` or set in [`public/event-settings.js`](../public/event-settings.js):
     ```env
     EMAILJS_SERVICE_ID=service_awsverse
     EMAILJS_TEMPLATE_ID=template_spiderpass
     EMAILJS_PUBLIC_KEY=xyz123abc
     ```
   - Or in [`public/event-settings.js`](../public/event-settings.js):
     ```javascript
     emailjs: {
       serviceId: 'service_awsverse',
       templateId: 'template_spiderpass',
       publicKey: 'xyz123abc'
     }
     ```

---

## 3. Features & Safeguards

- **120 Seat Hard Cap**: The Google Apps Script automatically counts registered rows and rejects registrations once 120 seats are claimed.
- **Deduplication**: Registrations with duplicate Roll Numbers or College Emails are rejected with an informative prompt.
- **Fail-safe Email Dispatch**: If email delivery fails due to EmailJS quota or network restrictions, the registration still succeeds in Google Sheets and the student's confirmed pass is displayed on-screen with instructions to take a screenshot.
- **Auto-Formatting**: Roll numbers are automatically capitalized and formatted.
- **Pass Download**: Students can click "Save pass" on the confirmed screen to download a digital PNG pass ticket generated via HTML5 Canvas.
