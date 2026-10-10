## ADDED Requirements

### Requirement: Searching the image pool
Wherever a backend form offers the pool of previously uploaded images — for a cover image, a logo, an image list, or an image in a body — the pool SHALL offer a search that narrows the images shown by file name, title and alternative text, ignoring letter case and accents. The pool SHALL show an image's title in place of its file name when it has one.

#### Scenario: Finding an image in the pool
- **WHEN** an editor opens the image pool on a form and searches for "tuin"
- **THEN** the pool SHALL show only the images whose file name, title or alternative text contains that text

#### Scenario: A search that matches nothing
- **WHEN** an editor's search in the image pool matches no image
- **THEN** the pool SHALL say that nothing was found and SHALL still let the editor clear the search

### Requirement: The body image description starts from the stored one
When an authorized user chooses an image for a body from the media library and that image has a stored alternative text, the image control SHALL fill its description with that text. The user SHALL be able to change the description for this use, and a description SHALL remain required before the image is inserted.

#### Scenario: Choosing a described image
- **WHEN** an authorized user chooses, in the body image control, an image whose stored alternative text is "De moestuin in mei"
- **THEN** the control's description SHALL read "De moestuin in mei", and the user SHALL be able to edit it before inserting

#### Scenario: Choosing an image without a description
- **WHEN** an authorized user chooses an image that has no stored alternative text
- **THEN** the control's description SHALL be empty and SHALL be required before inserting
