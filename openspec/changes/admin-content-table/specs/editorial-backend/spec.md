## MODIFIED Requirements

### Requirement: List existing content for management
The backend SHALL provide Administrators a per-type listing of existing Events, Venues, Organisations, Blog posts, and Projects, presented as a table with one row per item. Every row SHALL show the item's title or name, its publication status, and when it was last modified. The table SHALL also show, per type: for Events the date, location and organisers; for Blog posts the date and author; for Projects the location and organisers; for Venues the address; for Organisations the location. Every row SHALL offer actions to edit the item and to hide or show it, and a published item that has a public page SHALL offer a link to that page. The listing SHALL include items of every publication status.

#### Scenario: Browsing a content type
- **WHEN** an Administrator opens the management list for a content type
- **THEN** the system SHALL present a table of that type's items regardless of publication status, each with its title or name, status, last-modified time, the columns for its type, and edit / hide-or-show actions

#### Scenario: Viewing a published item from the list
- **WHEN** an Administrator views the row of a published item that has a public page
- **THEN** the row SHALL offer a link that opens that public page

#### Scenario: An item without a public page
- **WHEN** an Administrator views the row of a hidden item, or of an event that has no page
- **THEN** the row SHALL NOT offer a link to a public page

#### Scenario: A reference to a record that no longer exists
- **WHEN** an item names a location or organiser that no longer exists
- **THEN** its row SHALL show that reference as unknown rather than leaving the cell empty

#### Scenario: The table on a narrow screen
- **WHEN** an Administrator opens the management list at a phone width
- **THEN** every column's value SHALL be readable, with its column name, without horizontal scrolling

## ADDED Requirements

### Requirement: Finding content in the management list
The management list SHALL let an Administrator narrow the items shown: by publication status, by a search on the title or name, and by the filters for the type. The status choices SHALL each show how many items of the type have that status. The search SHALL ignore letter case and accents. The list of Events SHALL be filterable by period (upcoming or past), by location and by organiser, and the list of Projects by location and by organiser. Narrowing SHALL work without JavaScript. When nothing matches, the list SHALL say so and offer a way to clear the search and filters.

#### Scenario: Filtering by status
- **WHEN** an Administrator chooses the hidden status on a management list
- **THEN** the list SHALL show only hidden items of that type

#### Scenario: Status counts
- **WHEN** an Administrator opens a management list
- **THEN** each status choice SHALL show the number of items of that type with that status

#### Scenario: Status choices fit the type
- **WHEN** an Administrator opens the management list of a type that cannot have pending items (Venues, Organisations, Projects)
- **THEN** the list SHALL NOT offer the pending status as a choice

#### Scenario: Searching by title
- **WHEN** an Administrator searches a management list for "cafe"
- **THEN** the list SHALL show the items whose title or name contains that text, including "Repair Café"

#### Scenario: Upcoming events
- **WHEN** an Administrator filters the list of Events to upcoming
- **THEN** the list SHALL show the events with a date today or later, including a repeating event whose repetition has not ended

#### Scenario: Filtering events by location
- **WHEN** an Administrator filters the list of Events by a location
- **THEN** the list SHALL show only the events at that location

#### Scenario: Nothing matches
- **WHEN** a search or filter matches no items
- **THEN** the list SHALL state that nothing was found and SHALL offer a link that clears the search and filters

### Requirement: Sorting and paging the management list
The management list SHALL be sortable by title or name, by status, by last-modified time, and, for types that have a date, by date, in either direction, and SHALL indicate which column it is sorted by. Without a chosen sort, Events, Blog posts and Projects SHALL be ordered by date, newest first (for Events, the date defined by the requirement "Events are listed by their next date"), and Venues and Organisations by name. The list SHALL show at most 25 items per page, with controls to reach the other pages and an indication of the total number of items matched. Sorting and paging SHALL work without JavaScript.

#### Scenario: Sorting by a column
- **WHEN** an Administrator chooses to sort a management list by last modified
- **THEN** the list SHALL be ordered by that column and SHALL indicate the sorted column and its direction

#### Scenario: More items than one page
- **WHEN** a management list matches 60 items
- **THEN** the list SHALL show the first 25, the total of 60, and controls to reach the remaining pages

#### Scenario: A page that no longer exists
- **WHEN** an Administrator opens a page number beyond the last page, for example after deleting the last item on it
- **THEN** the list SHALL show the last page that exists

### Requirement: The management list keeps its view
The chosen status, search, filters, sort order and page of a management list SHALL be part of its address, so that reloading, going back, or sharing the address shows the same view. After an Administrator edits, hides, shows or deletes an item from a management list, the system SHALL return them to the view they acted from, including when the action is refused. The system SHALL NOT redirect to an address outside the backend on the strength of a value in the request.

#### Scenario: Reloading a filtered list
- **WHEN** an Administrator reloads a management list that is filtered, sorted and on its second page
- **THEN** the list SHALL show the same filter, sort order and page

#### Scenario: Returning after an action
- **WHEN** an Administrator hides an item from the second page of a filtered management list
- **THEN** the system SHALL return them to that list with the same filter, sort order and page

#### Scenario: Returning after editing
- **WHEN** an Administrator opens an item's edit form from a filtered management list and saves it
- **THEN** the system SHALL return them to that list with the same filter, sort order and page

#### Scenario: A return address outside the backend
- **WHEN** a request to act on an item carries a return address that is not a backend path
- **THEN** the system SHALL ignore it and return to the item's management list

### Requirement: Backend navigation
Every backend page other than the login page SHALL present navigation that links to the dashboard, to the management list of each content type (Events, Venues, Organisations, Blog posts, Projects), to the approval queue, to the gallery, and to the calendar feeds, and that offers signing out. The navigation SHALL indicate the section the current page belongs to. At a width where the navigation is not shown in full, the backend SHALL provide a labelled control that reveals it, that reports whether it is revealed, and that does not depend on JavaScript to reveal it.

#### Scenario: Reaching a content type from any backend page
- **WHEN** an Administrator is on any backend page other than the login page
- **THEN** the navigation SHALL offer a link to each content type's management list

#### Scenario: The current section is marked
- **WHEN** an Administrator is on a content type's management list, its edit form or its create form
- **THEN** the navigation SHALL mark that content type's entry as the current section, in a way that assistive technology also reports

#### Scenario: Navigation on a phone
- **WHEN** an Administrator opens a backend page at a phone width and activates the navigation control
- **THEN** the system SHALL reveal every navigation entry, each linking to its page

#### Scenario: The login page has no navigation
- **WHEN** a visitor opens the backend login page
- **THEN** the page SHALL NOT present the backend navigation

### Requirement: Loading feedback in the backend
When an Administrator moves to a backend page whose content is not yet available, the backend SHALL show, without waiting for that content, that the page is loading, and SHALL keep the navigation in place and usable. The loading state SHALL be reported to assistive technology.

#### Scenario: Opening a management list
- **WHEN** an Administrator follows a navigation link to a management list
- **THEN** the backend SHALL show a loading placeholder in the content area at once, with the navigation unchanged, until the list is shown
