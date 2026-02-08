# Security & Google Sheets Integration Guide

## 🔒 Data Privacy & Security

### User Data Protection
- ✅ **Authentication Required**: All attendance data is protected behind login
- ✅ **Role-Based Access Control (RBAC)**:
  - **Admin**: Can view all student attendance data
  - **User**: Can only view their own attendance records
- ✅ **Secure Storage**: Sensitive data stored in `localStorage` with encryption ready
- ✅ **Session Management**: Automatic logout on page close

### Access Control Implementation

```typescript
// Example: Only users with matching UIDs can view their data
const canViewRecord = (userId: string, currentUserId: string, userRole: string) => {
  if (userRole === 'admin') return true;  // Admins see all
  return userId === currentUserId;        // Users see only their own
};
```

## 📊 Google Sheets Integration

### Prerequisites
1. **Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable "Google Sheets API"

2. **API Key**
   - Go to Credentials → Create API Key
   - Restrict it to Sheets API only

3. **Google Sheet Setup**
   - Create a Google Sheet with attendance data
   - Share it (with view access if using public API)
   - Get the Sheet ID from URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

### Configuration

Create `.env.local` file in project root:
```
REACT_APP_GOOGLE_SHEET_ID=your_sheet_id_here
REACT_APP_GOOGLE_SHEETS_API_KEY=your_api_key_here
```

### Sheet Structure (Expected Format)
```
| userId  | name        | rollNo  | date       | status  | checkInTime | checkOutTime |
|---------|-------------|---------|------------|---------|-------------|--------------|
| user-001| John Smith  | STU001  | 2024-01-15 | present | 08:45       | 16:30        |
| user-002| Sarah J.    | STU002  | 2024-01-15 | absent  |             |              |
```

### API Implementation

The service automatically:
- ✅ Fetches data from Google Sheets
- ✅ Transforms it to app format
- ✅ Filters by user role
- ✅ Caches results (to reduce API calls)

## ⚠️ Production Security Checklist

### Frontend
- [ ] Never expose API keys in frontend code
- [ ] Always use `.env.local` for sensitive data
- [ ] `.env.local` is in `.gitignore` (protected)

### Backend Recommended
For production, move Google Sheets API calls to backend:
```
Frontend → Backend API → Google Sheets
```

**Backend Implementation Pseudocode**:
```typescript
// backend/routes/attendance.ts
app.get('/api/attendance', authenticate, authorize(['admin', 'user']), (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  
  // Fetch from Google Sheets (secure - API key never exposed)
  const data = await fetchFromGoogleSheets();
  
  // Filter by role
  const filtered = filterByRole(data, role, userId);
  
  res.json(filtered);
});
```

### Database Security (Firebase/Backend)
- [ ] Enable Row Level Security (RLS)
- [ ] Set up proper authentication
- [ ] Encrypt sensitive data
- [ ] Audit access logs

## 🔐 Access Control Matrix

| Feature | Admin | User |
|---------|-------|------|
| View all attendance | ✅ | ❌ |
| View own attendance | ✅ | ✅ |
| Edit own attendance | ❌ | ❌ |
| Edit any attendance | ✅ | ❌ |
| View reports | ✅ | ❌ |
| Export data | ✅ | ❌ |

## 📋 Current Implementation Status

- ✅ Authentication setup
- ✅ Role-based filtering
- ✅ Google Sheets service layer
- ✅ Environment variables
- ✅ Security notices in UI
- ⏳ Backend API (recommended for production)

## 🚀 Next Steps

1. Get Google Sheets API credentials
2. Update `.env.local` with your Sheet ID & API Key
3. Test data fetching from your sheet
4. (Optional) Migrate to backend API for production

---

**Remember**: Never commit `.env.local` to GitHub! 🔐
