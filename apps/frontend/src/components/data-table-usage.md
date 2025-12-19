# DataTable Component Usage Guide

The `DataTable` component is a reusable table component built with shadcn/ui and TanStack Table that provides searching, sorting, filtering, pagination, and column visibility features.

## Features

- **Search**: Filter data by a specific column
- **Sorting**: Click column headers to sort data
- **Pagination**: Navigate through pages of data
- **Column Visibility**: Show/hide columns via dropdown
- **Row Selection**: Select individual or all rows with checkboxes
- **Responsive**: Works on all screen sizes

## Basic Usage

### 1. Define your data type

```tsx
export type YourDataType = {
  id: string
  name: string
  // ... other fields
}
```

### 2. Create columns definition

```tsx
import { ColumnDef } from "@tanstack/react-table"

export const columns: ColumnDef<YourDataType>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  // ... more columns
]
```

### 3. Use the DataTable component

```tsx
import { DataTable } from '@/components/data-table'
import { columns } from './columns'

function YourPage() {
  const data = [...] // your data

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Search by name..."
    />
  )
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `columns` | `ColumnDef<TData, TValue>[]` | Yes | Column definitions |
| `data` | `TData[]` | Yes | Array of data to display |
| `searchKey` | `string` | No | Column key to enable search on |
| `searchPlaceholder` | `string` | No | Placeholder text for search input (default: "Search...") |

## Advanced Column Features

### Sortable columns

```tsx
{
  accessorKey: "price",
  header: ({ column }) => {
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Price
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    )
  },
}
```

### Custom cell rendering

```tsx
{
  accessorKey: "status",
  header: "Status",
  cell: ({ row }) => {
    const status = row.getValue("status") as string
    return <Badge>{status}</Badge>
  },
}
```

### Row actions

```tsx
{
  id: "actions",
  cell: ({ row }) => {
    const item = row.original
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleEdit(item)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDelete(item)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
}
```

## Example

See `/routes/inventory/products/` for a complete implementation example.
