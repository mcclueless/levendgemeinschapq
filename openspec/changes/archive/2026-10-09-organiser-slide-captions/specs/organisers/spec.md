## ADDED Requirements

### Requirement: Slide captions
Where an Organiser's page shows its images, each image that has a caption SHALL be shown with that caption as visible text directly beneath it, belonging to that image and changing with it in a slideshow. An image without a caption SHALL be shown without caption text. The caption SHALL NOT replace the image's text alternative.

#### Scenario: A captioned slide
- **WHEN** a visitor views an Organiser whose second image has the caption "Het team in 2025"
- **THEN** that text SHALL appear beneath the second image when it is shown, and not beneath the others

#### Scenario: A single captioned image
- **WHEN** a visitor views an Organiser with one image that has a caption
- **THEN** the caption SHALL appear beneath that image

#### Scenario: No captions
- **WHEN** a visitor views an Organiser none of whose images has a caption
- **THEN** the images SHALL be shown as before, with no caption area
