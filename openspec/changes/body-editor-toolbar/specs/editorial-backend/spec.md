## ADDED Requirements

### Requirement: Body editing aids on the event and blog forms
The backend create and edit forms for Events and Blog posts SHALL offer, with the body field, a toolbar that inserts the Markdown for bold, italic, a heading, a bulleted list, a numbered list, and a link, applied to the selected text or at the cursor. The body SHALL remain plain Markdown text: the aids SHALL NOT change how a body is stored, and the field SHALL remain usable as a plain text field when scripts do not run.

The forms SHALL let an authorized user preview the body before saving. The preview SHALL render the body as the public page renders it, including embedded components. When a body cannot be rendered, the preview SHALL report that and SHALL NOT present a partial result as the outcome. The preview SHALL be available only to authenticated backend users.

The toolbar and the preview SHALL be operable by keyboard, and each control SHALL have an accessible name.

#### Scenario: Formatting selected text
- **WHEN** an authorized user selects text in the body and chooses bold, italic, heading, a list, or link
- **THEN** the body SHALL contain the Markdown for that formatting around or before the selection, and the rest of the text SHALL be unchanged

#### Scenario: Previewing the body
- **WHEN** an authorized user opens the preview
- **THEN** the system SHALL show the body rendered as it will appear on the public page, including any embedded event listing

#### Scenario: A body that cannot be rendered
- **WHEN** an authorized user previews a body the renderer rejects
- **THEN** the preview SHALL report that the text cannot be displayed and SHALL NOT show a partial rendering

#### Scenario: Without scripts
- **WHEN** the event or blog form is used without scripts
- **THEN** the body SHALL be a plain text field that submits as it does today

#### Scenario: Other forms unchanged
- **WHEN** an authorized user opens a Venue, Organiser, or Project form, or a visitor opens the public event submission form
- **THEN** the body field SHALL be offered without the toolbar or preview

### Requirement: Inserting an image into a body
The event and blog body toolbar SHALL offer an image control that lets an authorized user choose an image from the media library or upload a new one, and SHALL insert that image into the body at the cursor as its own paragraph, without the user handling the image's address. The control SHALL require a description of the image for users of assistive technology before inserting it, and SHALL use that description as the image's alternative text. An image uploaded this way SHALL be validated and stored exactly as any other upload, SHALL appear in the media library, and a rejected upload SHALL be reported in the control without inserting anything. The control SHALL NOT offer size, position, or caption settings; the page layout SHALL place the image.

#### Scenario: Inserting an image from the library
- **WHEN** an authorized user chooses an image from the library, enters a description, and confirms
- **THEN** the body SHALL contain that image, with the description as its alternative text, on its own paragraph at the cursor

#### Scenario: Uploading and inserting a new image
- **WHEN** an authorized user uploads a new image through the control, enters a description, and confirms
- **THEN** the system SHALL store the image, the image SHALL appear in the media library, and the body SHALL contain it as its own paragraph at the cursor

#### Scenario: A description is required
- **WHEN** an authorized user confirms an image without a description
- **THEN** the control SHALL NOT insert the image and SHALL ask for a description

#### Scenario: A rejected upload
- **WHEN** an upload made through the control is rejected, for example for its type or size
- **THEN** the control SHALL report the reason, SHALL NOT insert anything, and SHALL NOT store the file
