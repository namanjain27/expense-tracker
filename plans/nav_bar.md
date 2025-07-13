# Navigation Bar Implementation Plan

## Design Requirements:
1. It sticks to the top of the Dashboard page even if user scrolls the page.
2. towards left end (from left to right in order)
   -> logo (image) + TrackX (name) - as used in landing page
   -> navigation buttons - Actions, Monthly Expenses, Subscriptions, Saving Goals
3. towards right end (from left to right in order)
   -> selected month and year (dropdown selector) - already present in dashboard 
   -> website color theme toggle button- already present in dashboard
   -> Profile and settings dropdown menu - shown as `Hello,<username>`+ a down arrow - This required new dev. On clicking, it shows just a logout button currently.

## Implementation Plan

### Phase 1: Frontend Components

#### 1.1 Create NavigationBar Component
**File:** `expense-tracker-frontend/src/components/NavigationBar.tsx`

**Features:**
- Sticky positioning (`position: sticky, top: 0`)
- Consistent theme colors matching Dashboard.tsx:
  - Dark mode: `background: '#1e1e1e'`, `text: '#ffffff'`
  - Light mode: `background: '#ffffff'`, `text: '#000000'`
- Left section: Logo + TrackX branding
- Center section: Navigation buttons (Actions, Monthly Expenses, Subscriptions, Saving Goals)
- Right section: Month/Year selectors, Theme toggle, Profile dropdown

#### 1.2 Create Logo Component
**File:** `expense-tracker-frontend/src/components/Logo.tsx`

**Features:**
- TrackX logo image (if available) + text
- Responsive sizing
- Theme-aware colors

#### 1.3 Create ProfileDropdown Component
**File:** `expense-tracker-frontend/src/components/ProfileDropdown.tsx`

**Features:**
- Display "Hello, {username}" with dropdown arrow
- Material-UI Menu component
- Logout button functionality
- Consistent theme styling

#### 1.4 Create NavigationButton Component
**File:** `expense-tracker-frontend/src/components/NavigationButton.tsx`

**Features:**
- Smooth scroll to sections functionality
- Active state highlighting
- Theme-aware styling

### Phase 2: Backend API Endpoints

#### 2.1 User Information API
**File:** `main.py`

**New Endpoints:**
```python
@app.get("/auth/me", response_model=User, tags=["Authentication"])
def get_current_user_info(current_user: models.User = Depends(auth_service.get_current_user)):
    """Get current authenticated user information"""
    return User(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    )
```

#### 2.2 Enhanced Logout API
**Note:** Logout endpoint already exists at `/auth/logout` - no changes needed

### Phase 3: Frontend Integration

#### 3.1 Update API Service
**File:** `expense-tracker-frontend/src/services/api.ts`

**New Functions:**
```typescript
// Get current user information
getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
}

// Logout function
logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    // Clear local storage
    localStorage.removeItem('token');
    // Redirect to login page
    window.location.href = '/login';
}
```

#### 3.2 Create User Types
**File:** `expense-tracker-frontend/src/types/user.ts`

```typescript
export interface User {
    id: number;
    email: string;
    name: string | null;
    created_at: string;
    last_login: string;
}
```

#### 3.3 Update Dashboard Component
**File:** `expense-tracker-frontend/src/components/Dashboard.tsx`

**Changes:**
- Import and integrate NavigationBar component
- Move month/year selectors and theme toggle to NavigationBar
- Remove existing header elements that will be in NavigationBar
- Add scroll behavior for navigation buttons
- Add user state management

### Phase 4: Styling and Theme Integration

#### 4.1 Navigation Bar Styling
- Match existing theme colors from Dashboard.tsx:
  - Background: `isDarkMode ? '#1e1e1e' : '#ffffff'`
  - Text: `isDarkMode ? '#ffffff' : '#000000'`
  - Secondary text: `isDarkMode ? '#b0b0b0' : '#666666'`
- Consistent border colors: `isDarkMode ? '#333333' : '#e0e0e0'`
- Elevation/shadow for depth
- Responsive design for mobile

#### 4.2 Navigation Button Styling
- Hover effects matching theme
- Active state highlighting
- Smooth transitions
- Proper spacing and padding

#### 4.3 Profile Dropdown Styling
- Material-UI Menu styling
- Theme-consistent colors
- Proper z-index for overlay
- Smooth animations

### Phase 5: Functionality Implementation

#### 5.1 Section Scrolling
**Implementation:**
- Use `useRef` hooks for section references
- Implement smooth scrolling with `scrollIntoView({ behavior: 'smooth' })`
- Add active section detection using Intersection Observer API

#### 5.2 User State Management
**Implementation:**
- Fetch user data on component mount
- Handle loading states
- Error handling for API calls
- Context provider for user data if needed

#### 5.3 Logout Functionality
**Implementation:**
- Call logout API endpoint
- Clear authentication tokens
- Redirect to login page
- Show confirmation dialog (optional)

### Phase 6: Testing and Refinement

#### 6.1 Responsive Testing
- Test on different screen sizes
- Ensure navigation buttons work on mobile
- Test dropdown functionality on touch devices

#### 6.2 Theme Consistency
- Verify all colors match existing theme
- Test theme switching with navigation bar
- Ensure proper contrast ratios

#### 6.3 Performance Testing
- Test sticky behavior performance
- Optimize scroll event handlers
- Ensure smooth animations

## Implementation Order:

1. **Backend APIs first** - Add `/auth/me` endpoint to main.py
2. **Create NavigationBar component** - Build the main navigation structure
3. **Create sub-components** - Logo, ProfileDropdown, NavigationButton
4. **Update Dashboard** - Integrate NavigationBar and remove duplicated elements
5. **Add functionality** - Scrolling, user data fetching, logout
6. **Style and theme** - Ensure consistent look and feel
7. **Test and refine** - Cross-browser and responsive testing

## Files to be Created/Modified:

### New Files:
- `expense-tracker-frontend/src/components/NavigationBar.tsx`
- `expense-tracker-frontend/src/components/Logo.tsx`
- `expense-tracker-frontend/src/components/ProfileDropdown.tsx`
- `expense-tracker-frontend/src/components/NavigationButton.tsx`
- `expense-tracker-frontend/src/types/user.ts`

### Modified Files:
- `main.py` - Add `/auth/me` endpoint
- `expense-tracker-frontend/src/services/api.ts` - Add user-related API calls
- `expense-tracker-frontend/src/components/Dashboard.tsx` - Integrate NavigationBar

## Theme Color Consistency:

Based on Dashboard.tsx analysis:
- **Dark Mode:**
  - Background: `#1e1e1e`
  - Paper: `#1e1e1e`
  - Primary text: `#ffffff`
  - Secondary text: `#b0b0b0`
  - Border: `#333333`
  
- **Light Mode:**
  - Background: `#ffffff`
  - Paper: `#ffffff`
  - Primary text: `#000000`
  - Secondary text: `#666666`
  - Border: `#e0e0e0`