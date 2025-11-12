# City Detection Feature - RentStay

## Overview

The hero section title dynamically displays the user's city with intelligent fallback logic.

---

## How It Works

### Priority Order:

1. **Logged-in User's City** (Highest Priority)
   - If user is authenticated and has a city in their profile
   - Shows: `Find Your Perfect Home in {user.city}`
   - Example: User profile has `city: "Abuja"` → Shows "Abuja"

2. **localStorage Saved City**
   - If a city was previously selected/saved
   - Persists across sessions
   - Example: User previously selected "Lagos" → Shows "Lagos"

3. **Default Fallback**
   - Default: **"Jos"** (our primary market)
   - Always works, no external dependencies

### Optional: Geolocation Detection

Currently commented out but can be enabled in `Home.jsx`:

```javascript
// Uncomment lines 31-53 in Home.jsx to enable
if ('geolocation' in navigator) {
  // Automatically detects city from GPS coordinates
  // Uses OpenStreetMap Nominatim API
}
```

---

## User Experience

### For Logged-In Users:
```
Badge shows: "Your city: Abuja"
Title shows: "Find Your Perfect Home in Abuja"
```

### For Guests:
```
Badge shows: "Default location: Jos"
Title shows: "Find Your Perfect Home in Jos"
```

---

## Code Implementation

### 1. Home.jsx (Hero Section)

```javascript
const [userCity, setUserCity] = useState('Jos');
const { user, isAuthenticated } = useAuthStore();

useEffect(() => {
  // Priority 1: User's profile city
  if (isAuthenticated && user?.city) {
    setUserCity(user.city);
    return;
  }

  // Priority 2: localStorage
  const savedCity = localStorage.getItem('userCity');
  if (savedCity) {
    setUserCity(savedCity);
  }

  // Priority 3: Default "Jos"
}, [isAuthenticated, user]);
```

### 2. Display in UI

```jsx
<h1>
  Find Your Perfect Home in{' '}
  <span className="gradient-text">{userCity}</span>
</h1>
```

---

## Future Enhancements

### Phase 1 (Current):
- ✅ Use logged-in user's city
- ✅ Default to Jos
- ✅ Show city indicator badge

### Phase 2 (Optional):
- [ ] Manual city selector dropdown
- [ ] Enable geolocation detection
- [ ] Remember city choice in localStorage

### Phase 3 (Future):
- [ ] IP-based location detection
- [ ] "Change location" button
- [ ] Multi-city search

---

## Testing

### Test Scenario 1: Guest User
1. Visit homepage (not logged in)
2. Expected: Shows "Jos"

### Test Scenario 2: Registered User (Jos)
1. Register with city: "Jos"
2. Login and visit homepage
3. Expected: Shows "Jos"

### Test Scenario 3: Registered User (Other City)
1. Register with city: "Abuja"
2. Login and visit homepage
3. Expected: Shows "Abuja"

### Test Scenario 4: Update Profile
1. Login
2. Go to profile settings
3. Change city to "Lagos"
4. Return to homepage
5. Expected: Shows "Lagos"

---

## API Integration

When users register or update their profile:

```javascript
// User object from backend
{
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "user_type": "tenant",
  "city": "Jos",  // ← This field is used
  "state": "Plateau"
}
```

---

## Supported Cities

See `src/utils/location.js` for full list of Nigerian cities:
- Jos (default)
- Abuja
- Lagos
- Port Harcourt
- Kano
- ... and 15+ more

---

## Benefits

✅ **Personalization** - Users see content relevant to their location
✅ **Trust** - Shows we know where they are
✅ **SEO** - Dynamic content for different cities
✅ **Scalability** - Easy to add more cities
✅ **Fallback** - Always works, even without data

---

## Configuration

To change the default city, edit `Home.jsx`:

```javascript
const [userCity, setUserCity] = useState('Jos'); // ← Change this
```

To enable geolocation, uncomment lines 31-53 in `Home.jsx`.

---

**This feature makes RentStay feel personalized and location-aware!** 🌍
