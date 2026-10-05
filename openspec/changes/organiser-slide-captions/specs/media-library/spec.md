## ADDED Requirements

### Requirement: Image caption
The media library SHALL let the administrator give an image a caption, optional, beside its title and alternative text, and change or clear it later. The caption SHALL be stored with the image's other details, SHALL be found by the library's search, and SHALL be removed with the image.

#### Scenario: Setting a caption on the image's page
- **WHEN** an administrator sets an image's caption to "Onze werkplaats" on its page
- **THEN** the caption SHALL be stored with the image and shown wherever the image's caption is used

#### Scenario: Clearing a caption
- **WHEN** an administrator clears an image's caption
- **THEN** the image SHALL have no caption
