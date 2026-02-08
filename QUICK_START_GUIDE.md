# SHAMS SMS Enterprise Platform - Developer Quick Reference

## 🚀 Quick Start: Using New Components

### 1. Toast Notifications (User Feedback)

```tsx
"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function FeeCollectionButton({ feeId }: { feeId: string }) {
  const handleCollect = async () => {
    try {
      // Your API call here
      const response = await fetch(`/api/fees/${feeId}/collect`, { method: "POST" })
      
      if (response.ok) {
        toast.success("Fee collected successfully!", {
          description: "The transaction has been recorded."
        })
      }
    } catch (error) {
      toast.error("Failed to collect fee", {
        description: "Please check your connection and try again."
      })
    }
  }

  return <Button onClick={handleCollect}>Collect Fee</Button>
}
```

### 2. Status Badges (Fee/Student Status)

```tsx
import { StatusBadge } from "@/components/ui/status-badge"

export function FeeRow({ fee }) {
  return (
    <tr>
      <td>{fee.courseCode}</td>
      <td>{formatCurrency(fee.amount)}</td>
      <td>
        <StatusBadge status={fee.status as "PAID" | "UNPAID" | "PENDING" | "OVERDUE"} />
      </td>
    </tr>
  )
}
```

### 3. Metric Cards (Dashboard Statistics)

```tsx
import { MetricCard } from "@/components/ui/metric-card"
import { Users, TrendingUp } from "lucide-react"

export function DashboardMetrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard
        label="Total Students"
        value={245}
        icon={<Users className="w-5 h-5" />}
        trend={{ value: 5.2, isPositive: true }}
        subtext="Increase from last month"
      />
      
      <MetricCard
        label="Overdue Fees"
        value="PKR 125,000"
        icon={<TrendingUp className="w-5 h-5" />}
        trend={{ value: 12.5, isPositive: false }}
      />
    </div>
  )
}
```

### 4. Empty States (No Data)

```tsx
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"

export function StudentSearchResults({ results }) {
  if (results.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-12 h-12" />}
        title="No Students Found"
        description="No students match your search criteria. Try adjusting your filters."
        action={{
          label: "Add New Student",
          onClick: () => navigate("/admin/students/new")
        }}
      />
    )
  }

  return // Your list here
}
```

### 5. Receipt Preview (Printable Receipts)

```tsx
"use client"

import { ReceiptPreview } from "@/components/ui/receipt-preview"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useState } from "react"

export function FeeReceiptModal({ fee, onClose }: { fee: FeeData; onClose: () => void }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <ReceiptPreview
          studentName={fee.student.name}
          studentId={fee.student.studentId}
          courseCode={fee.course.code}
          courseName={fee.course.name}
          totalAmount={Number(fee.finalAmount)}
          paidAmount={Number(fee.paidAmount)}
          dueAmount={Number(fee.finalAmount) - Number(fee.paidAmount)}
          dueDate={fee.dueDate}
          status={fee.status as "PAID" | "PARTIAL" | "UNPAID" | "OVERDUE"}
          transactionDate={fee.transactions[0]?.date}
          paymentMethod={fee.transactions[0]?.method}
        />
      </DialogContent>
    </Dialog>
  )
}
```

### 6. Data Table (High-Density Lists)

```tsx
import { DataTable } from "@/components/ui/data-table"
import { useRouter } from "next/navigation"

export function StudentsList({ students }) {
  const router = useRouter()

  return (
    <DataTable
      columns={[
        { key: "studentId", label: "ID", width: "w-20" },
        { key: "name", label: "Name" },
        { 
          key: "status", 
          label: "Status",
          render: (status) => <StatusBadge status={status as any} />
        },
        {
          key: "totalDue",
          label: "Outstanding",
          render: (amount) => formatCurrency(amount)
        },
      ]}
      data={students}
      onRowClick={(student) => router.push(`/admin/students/${student.id}`)}
    />
  )
}
```

### 7. Collapsible Sidebar (Navigation)

The sidebar is automatically included in the admin layout and handles its own state:

```tsx
// No setup needed! It's already in app/admin/layout.tsx
// Just use the admin routes and it works automatically
```

To customize navigation items, edit [`components/ui/collapsible-sidebar.tsx`](components/ui/collapsible-sidebar.tsx):

```tsx
const NAV_ITEMS: NavItem[] = [
  { icon: <LayoutDashboard size={20} />, label: "Overview", href: "/admin" },
  { icon: <Users size={20} />, label: "Students", href: "/admin/students" },
  // Add your custom items here
]
```

### 8. Command Palette (Ctrl+K)

The command palette is automatically enabled in admin routes. Add new commands:

```tsx
// In components/ui/command-palette.tsx
const commands = [
  {
    group: "Navigation",
    items: [
      // Existing items...
      {
        icon: <FileText className="w-4 h-4" />,
        label: "View Reports",
        value: "reports",
        onSelect: () => {
          router.push("/admin/fees/reports")
          setOpen(false)
        },
      },
    ],
  },
]
```

### 9. Dynamic Breadcrumbs (Route Navigation)

Automatically generated from current route. Customize labels in the component:

```tsx
// In components/ui/dynamic-breadcrumbs.tsx
const ROUTE_LABELS: Record<string, string> = {
  admin: "Dashboard",
  students: "Students",
  enrollment: "Enrollment",
  // Add custom labels for your routes
}
```

## 📊 Formatting Utilities

All in `lib/utils.ts`:

```tsx
import { formatCurrency, formatDate, truncateText } from "@/lib/utils"

// Currency formatting with PKR
const amount = formatCurrency(15000) // "Rs. 15,000"

// Date formatting with timezone
const date = formatDate("2026-02-08") // "Feb 08, 2026"

// Text truncation
const text = truncateText("Very long text here...", 20) // "Very long text he..."
```

## 🎨 Tailwind Classes for Enterprise Theme

Use these custom utility classes in your components:

```tsx
// Professional card styling
<div className="card-surface p-6">
  {/* Your content */}
</div>

// Sidebar with glassmorphism
<div className="sidebar-glass">
  {/* Your content */}
</div>

// Metric card with spacing
<div className="metric-card">
  {/* Your metric content */}
</div>

// High-density table text
<table className="data-table-text">
  {/* Your table */}
</table>

// Badge styles
<span className="badge-success">Paid</span>
<span className="badge-error">Overdue</span>
<span className="badge-warning">Pending</span>
<span className="badge-info">Processing</span>
```

## 🎯 Common Patterns

### Loading State with Skeleton
```tsx
import { Skeleton } from "@/components/ui/skeleton"

export function StudentCardLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-8 w-1/2" />
    </div>
  )
}
```

### Tabbed Student Profile
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function StudentProfile({ student }) {
  return (
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">General Info</TabsTrigger>
        <TabsTrigger value="financial">Financial</TabsTrigger>
        <TabsTrigger value="academic">Academic</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        {/* General information tabs */}
      </TabsContent>
      
      <TabsContent value="financial">
        {/* Financial ledger */}
      </TabsContent>

      <TabsContent value="academic">
        {/* Academic results */}
      </TabsContent>
    </Tabs>
  )
}
```

## 🔍 Debugging Tips

### Check if toasts are showing
- Make sure `<ToastProvider />` is in your root layout
- Use `toast.promise()` for async operations

### Sidebar not collapsing
- Sidebar state is client-side only
- Check `use client` directive is present in `collapsible-sidebar.tsx`

### Command palette not responding to Ctrl+K
- Ensure you're in admin routes
- Check browser console for JavaScript errors
- The `CommandPaletteProvider` must wrap your content

### Colors not applying
- Clear Next.js cache: `rm -rf .next`
- Rebuild: `npm run build`
- Check globals.css is imported in root layout

## 📚 Further Reading

- [Enterprise Platform Guide](./ENTERPRISE_PLATFORM_GUIDE.md) - Full transformation documentation
- [Shadcn/UI Docs](https://ui.shadcn.com) - Component library reference
- [Tailwind CSS Docs](https://tailwindcss.com) - CSS utility framework
- [Sonner Docs](https://sonner.emilkowal.ski) - Toast notifications
- [Recharts Docs](https://recharts.org) - Chart library

## 🆘 Support

For issues or questions:
1. Check the [Enterprise Platform Guide](./ENTERPRISE_PLATFORM_GUIDE.md)
2. Review component source code in `components/ui/`
3. Test in browser devtools
4. Check console for error messages
