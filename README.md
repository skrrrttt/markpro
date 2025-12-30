# MarkPro - Pavement Marking Job Management

A Progressive Web App (PWA) for managing pavement marking jobs. Works on any device - phones, tablets, and computers.

## Features

- **Job Cards**: View all jobs with status, contact info, scheduled date, and progress
- **Interactive Checklists**: Track completion of each job step
- **File Uploads**: Attach plans, maps, and photos to any job
- **Calendar View**: See all scheduled jobs on a monthly calendar
- **Admin Panel**: Create, edit, delete jobs and manage checklist templates
- **Archive System**: Save and load jobs from previous years
- **Offline Support**: Works without internet once loaded
- **Mobile-First**: Designed for use on job sites

## Quick Start

### Default Password
The default password is: `markpro2025`

**To change it**, edit `app.js` line 8:
```javascript
PASSWORD: 'your-new-password-here',
```

## Deployment Options

### Option 1: Vercel (Recommended - Free)

1. **Create a Vercel account** at https://vercel.com
2. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```
3. **Deploy**:
   - Drag and drop this folder to vercel.com/new
   - OR run `vercel` in this directory
4. **Done!** You'll get a URL like `your-app.vercel.app`

### Option 2: Netlify (Free)

1. Go to https://netlify.com
2. Drag and drop this folder onto the page
3. Done!

### Option 3: GitHub Pages (Free)

1. Create a GitHub repository
2. Upload all files
3. Go to Settings → Pages → Select "main" branch
4. Done!

### Option 4: Self-Hosted

Upload all files to any web server. Just needs to serve static files - no backend required.

## Installing on Phones

### iPhone/iPad
1. Open Safari (must be Safari, not Chrome)
2. Go to your deployed URL
3. Tap the Share button (square with arrow)
4. Scroll down and tap "Add to Home Screen"
5. Name it "MarkPro" and tap Add

### Android
1. Open Chrome
2. Go to your deployed URL
3. Tap the three dots menu
4. Tap "Add to Home screen" or "Install app"
5. Done!

## File Structure

```
pavement-jobs/
├── index.html      # Main app HTML and CSS
├── app.js          # All application logic
├── manifest.json   # PWA configuration
├── sw.js           # Service worker (offline support)
├── icon-192.svg    # App icon (source)
├── icon-192.png    # App icon (192x192) - replace with real PNG
├── icon-512.png    # App icon (512x512) - replace with real PNG
└── README.md       # This file
```

## Customization

### Change App Name
1. In `index.html`: Change "MARKPRO" text in logo elements
2. In `manifest.json`: Change `name` and `short_name`

### Change Colors
In `index.html`, edit the CSS variables at the top:
```css
:root {
    --bg-primary: #0f0f1a;      /* Main background */
    --accent-yellow: #ffd60a;    /* Primary accent */
    /* etc... */
}
```

### Modify Default Checklist
In `app.js`, edit the `DEFAULT_CHECKLIST` array:
```javascript
const DEFAULT_CHECKLIST = [
    { id: 1, text: 'Your step 1', checked: false },
    { id: 2, text: 'Your step 2', checked: false },
    // Add more...
];
```

## Data Storage

All data is stored in the browser's localStorage. This means:
- Data persists between sessions
- Data is specific to each browser/device
- Clearing browser data will delete all jobs

### Syncing Between Devices
For the initial version, there's no automatic sync. To share data between devices:
1. Use the Export feature to download a JSON file
2. Share the file with other devices
3. (Future: We can add Supabase for real-time sync)

## Adding Real-Time Sync (Future Enhancement)

When you're ready to add cloud sync:

1. **Create a Supabase account** at https://supabase.com (free tier available)
2. **Create these tables**:
   - `jobs` (id, name, address, contact_name, contact_phone, contact_email, scheduled_date, status, notes, created_at)
   - `checklist_items` (id, job_id, text, checked, order)
   - `files` (id, job_id, name, url, uploaded_at)
3. **Add the Supabase JavaScript client** and update the save/load functions

## Troubleshooting

### App won't install on iPhone
- Must use Safari (not Chrome)
- iOS 11.3 or later required

### Changes not showing up
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear site data in browser settings

### Files not uploading
- Check file size (very large files may fail)
- Only images and PDFs are supported

## Support

For issues or feature requests, document them and we can iterate on the app.

---

Built for practical field use. No account required, no recurring fees, your data stays on your devices.
