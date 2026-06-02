# user-roles-approval Specification

## Purpose

Defines roles and permissions (Administrator and Limited User), Organisation page ownership, and the submission approval queue that holds Limited User content until an Administrator approves it.

## Requirements

### Requirement: Roles and permissions
The system SHALL support at least two roles: Administrator, who can oversee and manage all content and users, and Limited User, who may submit events and blog posts and maintain their own Organisation page(s) only.

#### Scenario: Administrator oversight
- **WHEN** an Administrator is signed in
- **THEN** the system SHALL allow them to view, edit, approve, publish, and delete any content

#### Scenario: Limited user scope
- **WHEN** a Limited User attempts to edit content they do not own or an Organisation page not assigned to them
- **THEN** the system SHALL deny the action

### Requirement: Organisation page ownership
A Limited User SHALL be able to be assigned ownership of one or more Organisation pages and maintain those pages' content.

#### Scenario: Maintaining an owned organisation
- **WHEN** a Limited User who owns an Organisation edits that Organisation's page
- **THEN** the system SHALL allow the edit, subject to the approval workflow where applicable

### Requirement: Submission approval queue
All event and blog submissions from Limited Users SHALL enter an approval queue and remain unpublished until an Administrator approves them.

#### Scenario: Submission held for approval
- **WHEN** a Limited User submits an event or blog post
- **THEN** the system SHALL add it to the approval queue and SHALL NOT publish it publicly

#### Scenario: Approval publishes
- **WHEN** an Administrator approves a queued item
- **THEN** the system SHALL publish it and remove it from the pending queue

#### Scenario: Rejection
- **WHEN** an Administrator rejects a queued item
- **THEN** the system SHALL keep it unpublished and record the rejection for the submitter

### Requirement: Queue visibility
The system SHALL give Administrators a view of all pending submissions with their type, submitter, and submission date.

#### Scenario: Reviewing the queue
- **WHEN** an Administrator opens the approval queue
- **THEN** the system SHALL list all pending items with enough detail to review and act on each
