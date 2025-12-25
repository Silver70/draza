# Customers API Documentation

## Base URL: `/customers`

## Customers Routes

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/` | Get all customers with optional filters | `?search=term&isGuest=true/false` |
| GET | `/registered` | Get registered customers only (non-guest) | - |
| GET | `/guests` | Get guest customers only | - |
| GET | `/search` | Search customers by name, email, or phone | `?q=searchTerm` (required) |
| GET | `/email/:email` | Get customer by email | - |
| GET | `/phone/:phone` | Get customer by phone number | - |
| GET | `/:id` | Get customer by ID | - |
| GET | `/:id/addresses` | Get customer with their addresses | - |
| GET | `/:id/stats` | Get customer statistics (address count, etc.) | - |
| POST | `/` | Create a new customer | Body: `createCustomerSchema` |
| POST | `/guest` | Create a guest customer (for checkout without account) | Body: `{ first_name, last_name, email, phone_number }` |
| POST | `/get-or-create` | Get existing customer by email or create new one | Body: `{ first_name, last_name, email, phone_number, is_guest }` |
| PUT | `/:id` | Update customer information | Body: `updateCustomerSchema` |
| PUT | `/:id/convert-to-registered` | Convert guest customer to registered customer | Body: `{ userId }` |
| DELETE | `/:id` | Delete a customer (cascades to addresses) | - |

---

## Addresses Routes

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/:customerId/addresses/all` | Get all addresses for a customer | - |
| GET | `/:customerId/addresses/default` | Get customer's default address | - |
| GET | `/:customerId/addresses/stats` | Get address statistics (count, by country, etc.) | - |
| GET | `/addresses/:addressId` | Get address by ID | - |
| POST | `/:customerId/addresses` | Create a new address for a customer | Body: `createAddressSchema` (without customerId) |
| PUT | `/addresses/:addressId` | Update an address | Body: `updateAddressSchema` |
| PUT | `/:customerId/addresses/:addressId/set-default` | Set an address as default for a customer | - |
| DELETE | `/addresses/:addressId` | Delete an address | - |

---

## Response Format

All endpoints return responses in the following format:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Common Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input or validation error |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

---

## Key Features

- **Guest checkout support**: Create customers without user accounts for quick checkout
- **Email/Phone uniqueness**: Prevents duplicate customers with same email or phone
- **Auto-reuse guests**: `createGuest` returns existing customer if email already exists
- **Get-or-create pattern**: Useful for checkout flows to avoid duplicates
- **Default address management**: First address is automatically set as default
- **Address ownership validation**: Ensures addresses belong to the correct customer
- **Cascade deletion**: Deleting a customer automatically deletes their addresses
- **Guest to registered conversion**: Upgrade guest customers when they create an account
- **Comprehensive search**: Search across name, email, and phone number fields
- **Zod validation**: All POST/PUT requests are validated using Zod schemas

---

## Address Business Rules

- **First address is default**: When creating first address, it's automatically set as default
- **Cannot delete default**: Must set another address as default before deleting the current default
- **Cannot delete only address**: Customer must have at least one address (throws error)
- **Auto-unset old default**: Setting a new default automatically unsets the previous default

---

## Data Models

### Customer Schema
```typescript
{
  id: uuid (auto-generated)
  user_id?: uuid | null
  first_name: string (required, max 100)
  last_name: string (required, max 100)
  email: string (required, unique, valid email)
  phone_number: string (required, unique, 7-20 chars)
  is_guest: boolean (default: false)
  createdAt: timestamp (auto-generated)
}
```

### Address Schema
```typescript
{
  id: uuid (auto-generated)
  customerId: uuid (required)
  firstName: string (required, max 100)
  lastName: string (required, max 100)
  phoneNumber: string (required, 7-20 chars)
  streetAddress: string (required)
  apartment?: string | null
  city: string (required)
  state: string (required)
  postalCode: string (required, max 20)
  country: string (default: "USA")
  isDefault: boolean (default: false)
  createdAt: timestamp (auto-generated)
  updatedAt: timestamp (auto-updated)
}
```

---

## Example Usage

### Create a Registered Customer
```bash
POST /customers
{
  "user_id": "uuid-here",  # Optional: link to user account
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone_number": "1234567890",
  "is_guest": false
}

# Response (201):
{
  "success": true,
  "data": {
    "id": "customer-uuid",
    "user_id": "uuid-here",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone_number": "1234567890",
    "is_guest": false,
    "createdAt": "2024-12-24T10:00:00Z"
  }
}
```

### Create a Guest Customer for Checkout
```bash
POST /customers/guest
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  "phone_number": "9876543210"
}

# If customer with email exists, returns existing customer
# If new, creates guest customer with is_guest = true

# Response (201 or 200):
{
  "success": true,
  "data": {
    "id": "customer-uuid",
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "phone_number": "9876543210",
    "is_guest": true,
    "createdAt": "2024-12-24T10:05:00Z"
  }
}
```

### Get or Create Customer (Checkout Flow)
```bash
POST /customers/get-or-create
{
  "first_name": "Bob",
  "last_name": "Wilson",
  "email": "bob@example.com",
  "phone_number": "5555555555",
  "is_guest": true
}

# Response (200 if exists, 201 if created):
{
  "success": true,
  "data": {
    "customer": {
      "id": "customer-uuid",
      "first_name": "Bob",
      "last_name": "Wilson",
      "email": "bob@example.com",
      "is_guest": true,
      ...
    },
    "created": false  # true if newly created, false if existing
  }
}
```

### Add Address for Customer
```bash
POST /customers/:customerId/addresses
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "1234567890",
  "streetAddress": "123 Main St",
  "apartment": "Apt 4B",  # Optional
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "USA",
  "isDefault": true  # Optional, defaults to false
}

# First address is automatically set as default regardless of isDefault value

# Response (201):
{
  "success": true,
  "data": {
    "id": "address-uuid",
    "customerId": "customer-uuid",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "1234567890",
    "streetAddress": "123 Main St",
    "apartment": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA",
    "isDefault": true,
    "createdAt": "2024-12-24T10:10:00Z",
    "updatedAt": "2024-12-24T10:10:00Z"
  }
}
```

### Search Customers
```bash
GET /customers/search?q=john

# Searches across first_name, last_name, email, and phone_number

# Response:
{
  "success": true,
  "data": [
    {
      "id": "customer-uuid-1",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      ...
    },
    {
      "id": "customer-uuid-2",
      "first_name": "Johnny",
      "last_name": "Smith",
      "email": "johnny@example.com",
      ...
    }
  ]
}
```

### Convert Guest to Registered Customer
```bash
PUT /customers/:id/convert-to-registered
{
  "userId": "user-account-uuid"
}

# Links guest customer to user account and sets is_guest = false

# Response:
{
  "success": true,
  "data": {
    "id": "customer-uuid",
    "user_id": "user-account-uuid",
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "is_guest": false,  # Changed from true
    ...
  }
}
```

### Get Customer with Addresses
```bash
GET /customers/:id/addresses

# Returns customer object with nested addresses array

# Response:
{
  "success": true,
  "data": {
    "id": "customer-uuid",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone_number": "1234567890",
    "is_guest": false,
    "addresses": [
      {
        "id": "address-uuid-1",
        "streetAddress": "123 Main St",
        "city": "New York",
        "isDefault": true
      },
      {
        "id": "address-uuid-2",
        "streetAddress": "456 Oak Ave",
        "city": "Boston",
        "isDefault": false
      }
    ]
  }
}
```

### Set Default Address
```bash
PUT /customers/:customerId/addresses/:addressId/set-default

# Automatically unsets previous default
# Returns updated address with isDefault = true

# Response:
{
  "success": true,
  "data": {
    "id": "address-uuid",
    "customerId": "customer-uuid",
    "streetAddress": "456 Oak Ave",
    "city": "Boston",
    "isDefault": true,  # Now default
    ...
  }
}
```

### Get Customer Statistics
```bash
GET /customers/:id/stats

# Response:
{
  "success": true,
  "data": {
    "customer": {
      "id": "customer-uuid",
      "first_name": "John",
      "last_name": "Doe",
      ...
    },
    "addressCount": 3,
    "hasDefaultAddress": true
  }
}
```

### Get Address Statistics
```bash
GET /customers/:customerId/addresses/stats

# Response:
{
  "success": true,
  "data": {
    "totalAddresses": 3,
    "hasDefaultAddress": true,
    "defaultAddressId": "address-uuid",
    "addressesByCountry": {
      "USA": 2,
      "Canada": 1
    }
  }
}
```

---

## Workflow Examples

### Guest Checkout Flow
```bash
# 1. Get or create guest customer
POST /customers/get-or-create
{
  "first_name": "Guest",
  "last_name": "User",
  "email": "guest@example.com",
  "phone_number": "1234567890",
  "is_guest": true
}
# Returns: { customer, created: true/false }

# 2. Add shipping address
POST /customers/:customerId/addresses
{
  "firstName": "Guest",
  "lastName": "User",
  "phoneNumber": "1234567890",
  "streetAddress": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001"
}
# First address auto-set as default

# 3. Create order (see Orders API documentation)
POST /orders
{
  "customerId": "customer-uuid",
  "shippingAddressId": "address-uuid",
  "billingAddressId": "address-uuid",
  "items": [...]
}
```

### Account Creation from Guest
```bash
# 1. User decides to create account after checkout
# Create user account in your auth system
# Get userId

# 2. Convert guest to registered customer
PUT /customers/:id/convert-to-registered
{
  "userId": "new-user-uuid"
}

# Customer now has:
# - is_guest = false
# - user_id = new-user-uuid
# - All previous orders preserved
# - All addresses preserved
```

### Multiple Address Management
```bash
# 1. Add home address
POST /customers/:customerId/addresses
{ /* home address */ }
# isDefault = true (first address)

# 2. Add work address
POST /customers/:customerId/addresses
{ /* work address */ }
# isDefault = false (not first address)

# 3. Add vacation home
POST /customers/:customerId/addresses
{ /* vacation home */ }
# isDefault = false

# 4. Change default to work address
PUT /customers/:customerId/addresses/:workAddressId/set-default
# workAddress: isDefault = true
# homeAddress: isDefault = false (auto-unset)
```

---

## Error Handling

### Duplicate Email
```bash
POST /customers
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "existing@example.com",  # Email already exists
  ...
}

# Response (400):
{
  "success": false,
  "error": "Customer with this email already exists"
}
```

### Duplicate Phone Number
```bash
POST /customers
{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone_number": "1234567890",  # Phone already exists
  ...
}

# Response (400):
{
  "success": false,
  "error": "Customer with this phone number already exists"
}
```

### Delete Default Address
```bash
DELETE /customers/addresses/:addressId
# If address is default

# Response (400):
{
  "success": false,
  "error": "Cannot delete default address. Set another address as default first."
}
```

### Delete Only Address
```bash
DELETE /customers/addresses/:addressId
# If customer has only one address

# Response (400):
{
  "success": false,
  "error": "Cannot delete the only address. Customer must have at least one address."
}
```

### Convert Non-Guest Customer
```bash
PUT /customers/:id/convert-to-registered
{ "userId": "..." }
# If customer is already registered

# Response (400):
{
  "success": false,
  "error": "Customer is already registered"
}
```

---

## Integration Notes

### With Orders Module
- Orders require a valid `customerId`
- Orders require addresses that belong to the customer
- Customer statistics include order information (via Orders API)

### With User Accounts
- Customers can optionally be linked to user accounts via `user_id`
- Guest customers have `user_id = null` and `is_guest = true`
- Converting guest to registered sets `user_id` and `is_guest = false`

### Data Relationships
```
Customer (1) ─── (many) Address
Customer (1) ─── (many) Order (see Orders API)
Customer (1) ─── (0..1) User Account
```
