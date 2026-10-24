import { gql } from '@apollo/client';

// ==========================================
// REQUESTS
// ==========================================

export const GET_REQUESTS_QUERY = gql`
  query GetRequests($filter: RequestFilterInput) {
    requests(filter: $filter) {
      id
      requestNumber
      title
      description
      requesterId
      locationId
      assetId
      priority
      status
      slaTargetHours
      slaDeadline
      slaBreached
      rejectionReason
      verificationNotes
      resolvedAt
      closedAt
      createdAt
      updatedAt
      upvotesCount
      hasUpvoted
      isDuplicate
      duplicateOfId
      duplicateOfNumber
      duplicateReason
      requester {
        id
        name
        email
        role
        department
      }
      location {
        id
        code
        name
        building
        floor
        room: roomNumber
      }
      asset {
        id
        assetTag
        name
      }
    }
  }
`;

export const GET_REQUEST_QUERY = gql`
  query GetRequest($id: ID!) {
    request(id: $id) {
      id
      requestNumber
      title
      description
      requesterId
      locationId
      assetId
      priority
      status
      slaTargetHours
      slaDeadline
      slaBreached
      rejectionReason
      verificationNotes
      resolvedAt
      closedAt
      createdAt
      updatedAt
      upvotesCount
      hasUpvoted
      isDuplicate
      duplicateOfId
      duplicateOfNumber
      duplicateReason
      requester {
        id
        name
        email
        role
        department
      }
      location {
        id
        code
        name
        building
        floor
        room: roomNumber
      }
      asset {
        id
        assetTag
        name
      }
    }
  }
`;

export const SUGGEST_DUPLICATES_QUERY = gql`
  query SuggestDuplicateRequests($title: String!, $locationId: ID) {
    suggestDuplicateRequests(title: $title, locationId: $locationId) {
      id
      requestNumber
      title
      description
      priority
      status
      upvotesCount
      createdAt
      location {
        id
        name
      }
    }
  }
`;

export const CREATE_REQUEST_MUTATION = gql`
  mutation CreateRequest($input: CreateRequestInput!) {
    createRequest(input: $input) {
      id
      requestNumber
      title
      description
      requesterId
      locationId
      assetId
      priority
      status
      slaTargetHours
      slaDeadline
      slaBreached
      createdAt
      updatedAt
      upvotesCount
      hasUpvoted
      isDuplicate
      duplicateOfId
      duplicateOfNumber
      duplicateReason
      requester {
        id
        name
        email
        role
        department
      }
      location {
        id
        code
        name
        building
        floor
        room: roomNumber
      }
      asset {
        id
        assetTag
        name
      }
    }
  }
`;

export const UPVOTE_REQUEST_MUTATION = gql`
  mutation UpvoteRequest($id: ID!) {
    upvoteRequest(id: $id) {
      id
      upvotesCount
      hasUpvoted
    }
  }
`;

export const REMOVE_UPVOTE_MUTATION = gql`
  mutation RemoveUpvote($id: ID!) {
    removeUpvote(id: $id) {
      id
      upvotesCount
      hasUpvoted
    }
  }
`;

export const MARK_DUPLICATE_MUTATION = gql`
  mutation MarkRequestAsDuplicate($duplicateRequestId: ID!, $originalRequestId: ID!, $reason: String) {
    markRequestAsDuplicate(duplicateRequestId: $duplicateRequestId, originalRequestId: $originalRequestId, reason: $reason) {
      id
      isDuplicate
      duplicateOfId
      duplicateOfNumber
      duplicateReason
    }
  }
`;

export const UNMARK_DUPLICATE_MUTATION = gql`
  mutation UnmarkRequestDuplicate($duplicateRequestId: ID!) {
    unmarkRequestDuplicate(duplicateRequestId: $duplicateRequestId) {
      id
      isDuplicate
      duplicateOfId
      duplicateOfNumber
      duplicateReason
    }
  }
`;

export const OVERRIDE_PRIORITY_MUTATION = gql`
  mutation OverridePriority($id: ID!, $priority: Priority!, $reason: String!) {
    overridePriority(id: $id, priority: $priority, reason: $reason) {
      id
      priority
      status
      slaTargetHours
      slaDeadline
    }
  }
`;

export const REOPEN_REQUEST_MUTATION = gql`
  mutation ReopenRequest($id: ID!, $reason: String!) {
    reopenRequest(id: $id, reason: $reason) {
      id
      status
      rejectionReason
    }
  }
`;

// ==========================================
// WORK ORDERS
// ==========================================

export const GET_WORK_ORDERS_QUERY = gql`
  query GetWorkOrders($filter: WorkOrderFilterInput) {
    workOrders(filter: $filter) {
      id
      orderNumber
      requestId
      assetId
      technicianId
      status
      instructions
      workNotes
      resolutionSummary
      partsUsed
      estimatedCost
      actualCost
      startedAt
      completedAt
      createdAt
      updatedAt
      request {
        id
        requestNumber
        title
        description
        priority
        status
        slaDeadline
        closedAt
        verificationNotes
        rejectionReason
        location {
          id
          code
          name
          building
          room: roomNumber
        }
        asset {
          id
          assetTag
          name
        }
      }
      asset {
        id
        assetTag
        name
      }
      technician {
        id
        name
        email
        role
        department
      }
      handovers {
        id
        previousTechId
        nextTechId
        handoverNotes
        reason
        createdAt
        previousTech {
          id
          name
        }
        nextTech {
          id
          name
        }
      }
      records {
        id
        actionTaken
        cost
        repairDetails
        partsReplaced
        dateCompleted
        createdAt
      }
    }
  }
`;

export const GET_WORK_ORDER_QUERY = gql`
  query GetWorkOrder($id: ID!) {
    workOrder(id: $id) {
      id
      orderNumber
      requestId
      assetId
      technicianId
      status
      instructions
      workNotes
      resolutionSummary
      partsUsed
      estimatedCost
      actualCost
      startedAt
      completedAt
      createdAt
      updatedAt
      request {
        id
        requestNumber
        title
        description
        priority
        status
        slaDeadline
        closedAt
        verificationNotes
        rejectionReason
        location {
          id
          code
          name
          building
          room: roomNumber
        }
        asset {
          id
          assetTag
          name
        }
      }
      asset {
        id
        assetTag
        name
      }
      technician {
        id
        name
        email
        role
        department
      }
      handovers {
        id
        previousTechId
        nextTechId
        handoverNotes
        reason
        createdAt
        previousTech {
          id
          name
        }
        nextTech {
          id
          name
        }
      }
      records {
        id
        actionTaken
        cost
        repairDetails
        partsReplaced
        dateCompleted
        createdAt
      }
    }
  }
`;

export const CREATE_WORK_ORDER_MUTATION = gql`
  mutation CreateWorkOrder($input: CreateWorkOrderInput!) {
    createWorkOrder(input: $input) {
      id
      orderNumber
      requestId
      status
      technicianId
      estimatedCost
      instructions
      createdAt
      technician {
        id
        name
        email
      }
    }
  }
`;

export const UPDATE_WORK_ORDER_STATUS_MUTATION = gql`
  mutation UpdateWorkOrderStatus($input: UpdateWorkOrderStatusInput!) {
    updateWorkOrderStatus(input: $input) {
      id
      status
      workNotes
      startedAt
      updatedAt
    }
  }
`;

export const COMPLETE_WORK_ORDER_MUTATION = gql`
  mutation CompleteWorkOrder($input: CompleteWorkOrderInput!) {
    completeWorkOrder(input: $input) {
      id
      status
      resolutionSummary
      partsUsed
      actualCost
      completedAt
      updatedAt
    }
  }
`;

export const VERIFY_WORK_ORDER_MUTATION = gql`
  mutation VerifyWorkOrder($input: VerifyWorkOrderInput!) {
    verifyWorkOrder(input: $input) {
      id
      status
      updatedAt
      request {
        id
        status
        verificationNotes
      }
    }
  }
`;

export const HANDOVER_WORK_ORDER_MUTATION = gql`
  mutation HandoverWorkOrder($input: HandoverWorkOrderInput!) {
    handoverWorkOrder(input: $input) {
      id
      status
      technicianId
      updatedAt
    }
  }
`;

// ==========================================
// COMMENTS
// ==========================================

export const GET_COMMENTS_QUERY = gql`
  query GetComments($requestId: ID!) {
    comments(requestId: $requestId) {
      id
      requestId
      authorId
      content
      isInternal
      createdAt
      author {
        id
        name
        email
        role
      }
    }
  }
`;

export const CREATE_COMMENT_MUTATION = gql`
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      id
      requestId
      authorId
      content
      isInternal
      createdAt
      author {
        id
        name
        email
        role
      }
    }
  }
`;

// ==========================================
// NOTIFICATIONS
// ==========================================

export const GET_NOTIFICATIONS_QUERY = gql`
  query GetNotifications {
    notifications {
      id
      userId
      title
      message
      type
      isRead
      link
      createdAt
    }
  }
`;

export const MARK_NOTIFICATION_AS_READ_MUTATION = gql`
  mutation MarkNotificationAsRead($id: ID!) {
    markNotificationAsRead(id: $id) {
      id
      isRead
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_AS_READ_MUTATION = gql`
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead
  }
`;

// ==========================================
// USERS & RBAC GOVERNANCE (ADMIN)
// ==========================================

export const GET_USERS_QUERY = gql`
  query GetUsers {
    users {
      id
      email
      name
      firstName
      lastName
      role
      status
      department
      phone
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_USER_ROLE_MUTATION = gql`
  mutation UpdateUserRole($id: ID!, $role: Role!) {
    updateUserRole(id: $id, role: $role) {
      id
      role
      updatedAt
    }
  }
`;

export const UPDATE_USER_ACTIVE_MUTATION = gql`
  mutation UpdateUserActive($id: ID!, $isActive: Boolean!) {
    updateUserActive(id: $id, isActive: $isActive) {
      id
      isActive
      updatedAt
    }
  }
`;

// ==========================================
// AUDIT LOGS
// ==========================================

export const GET_AUDIT_LOGS_QUERY = gql`
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
`;

// ==========================================
// ANALYTICS SUMMARY
// ==========================================

export const GET_ANALYTICS_SUMMARY_QUERY = gql`
  query GetAnalyticsSummary {
    analyticsSummary {
      totalRequests
      unresolvedRequests
      criticalOrHigh
      activeWorkOrders
      pendingVerification
      slaComplianceRate
      mttrHours
    }
  }
`;

// ==========================================
// LOCATIONS
// ==========================================

export const GET_LOCATIONS_QUERY = gql`
  query GetLocations {
    locations {
      id
      code
      name
      building
      floor
      room: roomNumber
      description
    }
  }
`;

// ==========================================
// PREVENTIVE MAINTENANCE SCHEDULES
// ==========================================

export const GET_SCHEDULES_QUERY = gql`
  query GetMaintenanceSchedules {
    maintenanceSchedules {
      id
      assetId
      frequencyDays
      nextDueDate
      title
      description
      isEnabled
      createdAt
      asset {
        id
        assetTag
        name
      }
    }
  }
`;
