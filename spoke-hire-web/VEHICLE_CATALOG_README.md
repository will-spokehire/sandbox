# 🚗 Vehicle Catalog Interface

A modern, responsive vehicle catalog interface built with the T3 Stack (Next.js, tRPC, TypeScript, Tailwind CSS).

## ✨ Features

### 📊 **Statistics Dashboard**
- Total records count
- Published vehicles
- Multi-source records
- Records with images, contact info, addresses, and registrations
- Real-time statistics with color-coded indicators

### 🔍 **Advanced Search & Filtering**
- Real-time search with 300ms debouncing
- Filter by data source (catalog, cleansed, submission)
- Multi-source filtering
- Published/unpublished filtering
- Active filter display with easy removal

### 📋 **Vehicle Management**
- Responsive vehicle cards with key information
- Detailed vehicle view with comprehensive data
- Source badges and status indicators
- Contact information display
- Image gallery with error handling

### 🎨 **Modern UI/UX**
- Responsive design (mobile, tablet, desktop)
- Collapsible sidebar
- Pagination with smart page navigation
- Loading states and skeleton animations
- Empty states with helpful messaging
- Breadcrumb navigation
- Professional header and footer

## 🏗️ Architecture

### **Components Structure**
```
src/app/_components/
├── vehicles/
│   ├── VehicleCard.tsx          # Individual vehicle display
│   ├── VehicleDetail.tsx        # Detailed vehicle view
│   ├── VehicleList.tsx          # List with pagination
│   ├── SearchFilters.tsx        # Search and filter controls
│   └── Stats.tsx                # Statistics dashboard
└── ui/
    ├── Header.tsx               # Page header with navigation
    ├── Sidebar.tsx              # Collapsible sidebar
    ├── Pagination.tsx           # Smart pagination
    ├── LoadingSpinner.tsx       # Loading indicators
    ├── EmptyState.tsx           # Empty state messaging
    ├── Toast.tsx                # Notifications
    └── LoadingOverlay.tsx       # Loading overlays
```

### **API Endpoints**
- `vehicles.getAll` - Get vehicles with filtering and pagination
- `vehicles.getById` - Get specific vehicle details
- `vehicles.getStats` - Get vehicle statistics
- `vehicles.getMetadata` - Get catalog metadata
- `vehicles.getFilterCounts` - Get filter counts for UI

### **Data Flow**
1. **Data Loading**: JSON files loaded from `/public/data/`
2. **Type Safety**: Full TypeScript integration with tRPC
3. **State Management**: React hooks for local state
4. **Real-time Updates**: Automatic re-fetching on filter changes

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+
- npm or yarn

### **Installation**
```bash
cd spoke-hire-web
npm install
npm run dev
```

### **Access the Interface**
- **Home**: http://localhost:3000/
- **Vehicle Catalog**: http://localhost:3000/vehicles

## 📱 Responsive Design

### **Breakpoints**
- **Mobile**: < 768px (single column layout)
- **Tablet**: 768px - 1024px (optimized grid)
- **Desktop**: > 1024px (sidebar + main content)

### **Mobile Features**
- Collapsible sidebar
- Touch-friendly interactions
- Optimized typography
- Swipe-friendly pagination

## 🎯 Key Features

### **Search & Filter**
- **Real-time Search**: Search across vehicle name, make, model, year, registration, and owner
- **Source Filtering**: Filter by data source with live counts
- **Active Filters**: Visual display of active filters with easy removal
- **Debounced Input**: 300ms debouncing for optimal performance

### **Vehicle Display**
- **Card View**: Compact vehicle information with key details
- **Detail View**: Comprehensive vehicle information in two-column layout
- **Source Badges**: Color-coded source indicators
- **Status Indicators**: Published/unpublished status
- **Image Gallery**: Vehicle images with error handling

### **Navigation**
- **Pagination**: Smart pagination with page numbers and navigation
- **Breadcrumbs**: Clear navigation hierarchy
- **Sidebar**: Collapsible sidebar for better space utilization
- **Header**: Professional header with navigation links

## 🔧 Technical Details

### **Performance Optimizations**
- Debounced search input
- Pagination for large datasets
- Efficient re-rendering with React hooks
- Optimized API calls with tRPC

### **Type Safety**
- Full TypeScript coverage
- tRPC for type-safe API calls
- Zod validation for input schemas
- Comprehensive type definitions

### **Error Handling**
- Graceful error states
- Loading indicators
- Empty state messaging
- Image error handling

## 📊 Data Structure

### **Vehicle Data**
```typescript
interface VehicleData {
  id: string;
  primarySource: string;
  sources: string[];
  vehicle: {
    id: string;
    source: string;
    status: string;
    vehicle: {
      name: string;
      make: string;
      model: string;
      year: string;
      registration: string;
      // ... additional fields
    };
  };
}
```

### **Statistics**
```typescript
interface VehicleStats {
  totalRecords: number;
  publishedRecords: number;
  multiSourceRecords: number;
  withImages: number;
  withContact: number;
  withAddress: number;
  withRegistration: number;
}
```

## 🎨 Styling

### **Design System**
- **Colors**: Tailwind CSS color palette
- **Typography**: Geist font family
- **Spacing**: Consistent spacing scale
- **Shadows**: Subtle shadows for depth
- **Borders**: Consistent border radius

### **Component Styling**
- **Cards**: Rounded corners with subtle shadows
- **Buttons**: Hover states and focus indicators
- **Forms**: Consistent input styling
- **Navigation**: Clear visual hierarchy

## 🔮 Future Enhancements

### **Planned Features**
- [ ] Export functionality (CSV, PDF)
- [ ] Advanced filtering options
- [ ] Bulk operations
- [ ] Data visualization charts
- [ ] User authentication
- [ ] Database integration
- [ ] Real-time updates
- [ ] Mobile app (React Native)

### **Performance Improvements**
- [ ] Virtual scrolling for large lists
- [ ] Image lazy loading
- [ ] Caching strategies
- [ ] Service worker for offline support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is part of the SpokeHire application suite.

---

**Built with ❤️ using the T3 Stack**
