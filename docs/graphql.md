# FixFlow GraphQL API Reference (Phase 2)

Endpoint: `http://localhost:4000/graphql`

---

## 1. Authentication & Users

### 1.1 Login Mutation
```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    accessToken
    user {
      id
      email
      name
      role
      department
    }
  }
}
```
**Variables**:
```json
{
  "input": {
    "email": "manager@fixflow.edu",
    "password": "Manager@123"
  }
}
```

### 1.2 Current User (`me`) Query
Requires `Authorization: Bearer <token>` header.
```graphql
query Me {
  me {
    id
    email
    name
    role
    department
    phone
    isActive
  }
}
```

### 1.3 Users Query (Admin / Manager only)
```graphql
query GetUsers($role: Role) {
  users(role: $role) {
    id
    email
    name
    role
    department
  }
}
```

---

## 2. Locations

### 2.1 Get Locations
```graphql
query GetLocations {
  locations {
    id
    code
    name
    building
    floor
    roomNumber
  }
}
```

### 2.2 Create Location (Facility Manager / Admin)
```graphql
mutation CreateLocation($input: CreateLocationInput!) {
  createLocation(input: $input) {
    id
    code
    name
    building
    floor
    roomNumber
  }
}
```

---

## 3. Asset Categories

### 3.1 Get Categories
```graphql
query GetCategories {
  assetCategories {
    id
    code
    name
    defaultMaintenanceIntervalDays
  }
}
```

### 3.2 Create Category (Facility Manager / Admin)
```graphql
mutation CreateCategory($input: CreateAssetCategoryInput!) {
  createAssetCategory(input: $input) {
    id
    code
    name
    defaultMaintenanceIntervalDays
  }
}
```

---

## 4. Asset Management

### 4.1 Search & Filter Assets
```graphql
query GetAssets($filter: AssetFilterInput) {
  assets(filter: $filter) {
    id
    assetTag
    name
    status
    criticality
    conditionRating
    qrIdentifier
    manufacturer
    model
    category {
      code
      name
    }
    location {
      code
      name
      building
    }
  }
}
```
**Variables Example**:
```json
{
  "filter": {
    "search": "AC",
    "status": "OPERATIONAL",
    "criticality": "HIGH"
  }
}
```

### 4.2 Asset By Tag (QR Destination)
```graphql
query GetAssetByTag($assetTag: String!) {
  assetByTag(assetTag: $assetTag) {
    id
    assetTag
    name
    status
    criticality
    conditionRating
    qrIdentifier
    category {
      name
    }
    location {
      code
      name
      building
    }
  }
}
```

### 4.3 Create Asset (Facility Manager / Admin)
```graphql
mutation CreateAsset($input: CreateAssetInput!) {
  createAsset(input: $input) {
    id
    assetTag
    name
    status
    criticality
    conditionRating
    qrIdentifier
  }
}
```

### 4.4 Update Asset Status (Manager / Technician / Admin)
```graphql
mutation UpdateStatus($id: ID!, $status: AssetStatus!) {
  updateAssetStatus(id: $id, status: $status) {
    id
    assetTag
    status
  }
}
```

---

## 5. Audit Logs

### 5.1 Query Audit Logs (Admin only)
```graphql
query GetAuditLogs($entity: String, $limit: Int) {
  auditLogs(entity: $entity, limit: $limit) {
    id
    actorId
    action
    entity
    entityId
    metadata
    timestamp
  }
}
```
