## MODIFIED Requirements

### Requirement: Reverse-chronological blog listing
The system SHALL provide a blog page that lists published blog posts in reverse chronological order (newest first).

Each listed post SHALL show its cover image in a 16:9 area, so that an image of that shape is shown whole at every screen width. On narrow screens the cover SHALL sit above the post's text; on wider screens it SHALL sit beside it. A post without a cover SHALL be listed without an image area, its text using the full width of the card, as before this change.

#### Scenario: Listing order
- **WHEN** a visitor opens the blog page
- **THEN** the system SHALL display published posts ordered from newest to oldest publication date

#### Scenario: Unpublished posts excluded
- **WHEN** a post is in draft or pending approval
- **THEN** the system SHALL NOT display it on the public blog listing

#### Scenario: A 16:9 cover is shown whole
- **WHEN** a post with a 16:9 cover appears on the blog page, on a phone or on a desktop screen
- **THEN** the whole cover SHALL be visible, with no part cut off

#### Scenario: A post without a cover
- **WHEN** a post without a cover appears on the blog page
- **THEN** its card SHALL show no image area and no empty space where one would be

#### Scenario: Cover beside the text on wide screens
- **WHEN** the blog page is viewed on a screen at least as wide as a tablet
- **THEN** each post's cover SHALL be beside its date, title, excerpt and link, not above them
