## ADDED Requirements

### Requirement: Captions on the organiser's image list
The Organiser create and edit forms SHALL offer, for each image in the organiser's image list, a caption field prefilled with the image's current caption. Saving the organiser SHALL store each caption with its image, so that the same caption is used wherever that image is shown with one. The fields SHALL post with the form without JavaScript.

#### Scenario: Writing a caption while editing an organiser
- **WHEN** an editor enters "Onze werkplaats" as the caption of the first image on an organiser's edit form and saves
- **THEN** the image SHALL have the caption "Onze werkplaats", and the organiser's page SHALL show it beneath that image

#### Scenario: An image that already has a caption
- **WHEN** an editor adds an image from the gallery that already has a caption
- **THEN** its row SHALL show that caption, which the editor can change

#### Scenario: Clearing a caption from the form
- **WHEN** an editor empties an image's caption field and saves the organiser
- **THEN** the image SHALL have no caption
