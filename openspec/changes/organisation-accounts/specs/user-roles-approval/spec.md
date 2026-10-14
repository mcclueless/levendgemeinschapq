# Spec Delta

## MODIFIED Requirements

### Requirement: Roles and permissions
The system SHALL support two roles: Administrator, who can oversee and manage all content and accounts, and Organisation account, which belongs to exactly one organisation and may maintain that organisation's page and the events whose primary organiser that organisation is. An organisation account's changes SHALL publish directly, without review. Several accounts MAY belong to the same organisation.

#### Scenario: Administrator oversight
- **WHEN** an Administrator is signed in
- **THEN** the system SHALL allow them to view, edit, approve, publish, and delete any content, and to manage accounts

#### Scenario: Limited user scope
- **WHEN** an organisation account attempts to edit an event whose primary organiser is another organisation, an organisation page other than its own, or any venue, project, blog post, feed or account
- **THEN** the system SHALL deny the action

#### Scenario: An organisation's event is published without review
- **WHEN** an organisation account saves an event of its organisation as published
- **THEN** the event SHALL be public at once and SHALL NOT enter the approval queue

### Requirement: Organisation page ownership
An organisation account SHALL be assigned exactly one organisation when the Administrator creates it, and SHALL be able to maintain that organisation's page: its text, contact details, social links, images and logo. Changing the page's permalink and hiding the page SHALL remain Administrator-only.

#### Scenario: Maintaining an owned organisation
- **WHEN** an organisation account edits its own organisation's page
- **THEN** the system SHALL save the change and publish it directly

#### Scenario: Permalink and visibility stay with the administrator
- **WHEN** an organisation account opens its organisation's page in the backend
- **THEN** the system SHALL NOT offer a permalink change or a hide action, and SHALL refuse such a request from that account

### Requirement: Submission approval queue
Events submitted through the public submission form SHALL enter an approval queue and remain unpublished until an Administrator approves them. Changes made by organisation accounts SHALL NOT enter the queue.

#### Scenario: Submission held for approval
- **WHEN** a visitor submits an event through the public form
- **THEN** the system SHALL add it to the approval queue and SHALL NOT publish it publicly

#### Scenario: Approval publishes
- **WHEN** an Administrator approves a queued item
- **THEN** the system SHALL publish it and remove it from the pending queue, and the organisation named as its primary organiser SHALL be able to maintain it from then on

#### Scenario: Rejection
- **WHEN** an Administrator rejects a queued item
- **THEN** the system SHALL keep it unpublished and record the rejection for the submitter

## ADDED Requirements

### Requirement: Event ownership by primary organiser
An event SHALL be owned by the organisation named as its primary organiser. The owner's accounts and the Administrator MAY edit, hide, show and delete the event. An organisation named only as a further organiser SHALL see the event in its backend list as read-only. The Administrator MAY move ownership by changing the primary organiser.

#### Scenario: The owner edits
- **WHEN** an account of the event's primary organiser opens the event's edit form and saves
- **THEN** the system SHALL save the change

#### Scenario: A co-organiser only looks
- **WHEN** an account of an organisation named only as a further organiser views its event list
- **THEN** the event SHALL be listed with its owner's name and without edit, hide, show or delete actions, and a request to change it SHALL be denied

#### Scenario: Ownership moves with the primary organiser
- **WHEN** an Administrator changes an event's primary organiser from A to B
- **THEN** accounts of B SHALL be able to edit it and accounts of A SHALL NOT

### Requirement: Account management by the administrator
The Administrator SHALL be able to create an organisation account with an email address, a display name, one existing organisation and an initial password of at least twelve characters; to reset its password; to disable and re-enable it; and to see every account with its organisation and state. The email address SHALL be the account's login name and SHALL be unique, ignoring letter case. Passwords SHALL be stored only as a salted hash. No email SHALL be sent.

#### Scenario: Creating an account
- **WHEN** the Administrator creates an account for an existing organisation with a valid email and a password of twelve or more characters
- **THEN** the account SHALL be able to sign in and SHALL be scoped to that organisation

#### Scenario: Refused creation
- **WHEN** the Administrator submits an email already in use in any letter case, an organisation that does not exist, or a password shorter than twelve characters
- **THEN** the system SHALL refuse the account and say why

#### Scenario: Resetting and disabling
- **WHEN** the Administrator resets an account's password or disables the account
- **THEN** the new password SHALL be required from then on, or the account SHALL no longer be able to sign in, respectively

### Requirement: Signing in with an account
The backend sign-in SHALL accept an email address and password for an organisation account, alongside the Administrator's password sign-in. A failed attempt SHALL be answered after a delay of about one second with one message that does not say whether the email exists.

#### Scenario: Organisation account signs in
- **WHEN** a person enters the email and password of an enabled account
- **THEN** the system SHALL start a session for that account and open the backend

#### Scenario: Failed sign-in
- **WHEN** a person enters an unknown email, a wrong password, or the email of a disabled account
- **THEN** the system SHALL wait about one second and show the same failure message in every case

#### Scenario: Administrator sign-in is unchanged
- **WHEN** a person leaves the email empty and enters the Administrator password
- **THEN** the system SHALL start an Administrator session as before

### Requirement: Session validity
A session for an organisation account SHALL stop being valid as soon as the account is disabled or its password is changed, and SHALL expire after seven days.

#### Scenario: Disabled account is cut off
- **WHEN** an account is disabled while it has a session
- **THEN** its next backend request SHALL be refused and sent to the sign-in page

#### Scenario: Password change ends earlier sessions
- **WHEN** an account's password is changed or reset
- **THEN** sessions started before the change SHALL be refused on their next request
