# blog Specification

## Purpose

Defines the Blog post content type, the reverse-chronological published listing, the single post view, and the ability to embed event listings within post content.

## Requirements

### Requirement: Blog post entity
The system SHALL represent a Blog post with a title, body content, publication date, author, and an optional featured image.

#### Scenario: Creating a blog post
- **WHEN** an editor provides a title and body and publishes the post
- **THEN** the system SHALL persist the post with its publication date and author

### Requirement: Reverse-chronological blog listing
The system SHALL provide a blog page that lists published blog posts in reverse chronological order (newest first).

#### Scenario: Listing order
- **WHEN** a visitor opens the blog page
- **THEN** the system SHALL display published posts ordered from newest to oldest publication date

#### Scenario: Unpublished posts excluded
- **WHEN** a post is in draft or pending approval
- **THEN** the system SHALL NOT display it on the public blog listing

### Requirement: Single blog post view
The system SHALL provide a dedicated, linkable page for each blog post showing its title, featured image (if present), author, date, and full content.

#### Scenario: Viewing one post
- **WHEN** a visitor opens a blog post
- **THEN** the system SHALL render the post's full content with its title, author, and date

### Requirement: Embedding event listings in posts
A blog post SHALL be able to embed an event listing within its content.

#### Scenario: Event listing inside a post
- **WHEN** a post embeds an event listing
- **THEN** the system SHALL render the upcoming-events listing inline within the post body
