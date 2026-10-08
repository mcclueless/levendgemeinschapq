## MODIFIED Requirements

### Requirement: Organiser image slideshow
An Organiser MAY have several images, in an order chosen by the editor. The first SHALL serve as the Organiser's cover wherever a single image represents it, except on an organiser card, which prefers the logo (see "Organiser card image"). The Organiser's page SHALL present its images as a slideshow that a visitor moves through by hand, with controls for the previous and next image and one per image, and by swiping. The slideshow SHALL NOT advance on its own. It SHALL remain scrollable when scripts do not run, and its controls SHALL be operable by keyboard with accessible names. With a single image the page SHALL show that image without controls, and with none it SHALL show no image area.

#### Scenario: Several images
- **WHEN** a visitor views an Organiser with three images
- **THEN** the page SHALL show the first image with controls to move to the others, and SHALL indicate which of the three is shown

#### Scenario: One image
- **WHEN** a visitor views an Organiser with exactly one image
- **THEN** the page SHALL show that image without slideshow controls

#### Scenario: The slideshow does not move on its own
- **WHEN** a visitor leaves an Organiser page with several images open without interacting
- **THEN** the shown image SHALL NOT change

#### Scenario: The first image is the cover
- **WHEN** an Organiser with several images is shown in a share preview, or on a card when it has no logo
- **THEN** its first image SHALL be used

## ADDED Requirements

### Requirement: Organiser card image
Wherever organisers are listed as cards — the organisers overview and the homepage's "who we are" section — each card SHALL show one image area chosen in this order: the organiser's logo when it has one; otherwise its cover image; otherwise the organiser's name on a brand-coloured panel. The image area SHALL have a 16:9 aspect ratio on every page that lists organiser cards. A logo SHALL be shown whole, never cropped, centred on a plain white panel that fills the image area, so that a logo exported at 16:9 fills the area exactly. A cover image MAY be cropped to fill the area. The organiser's name SHALL serve as the alternative text of a logo. The organiser's own page SHALL be unaffected.

#### Scenario: Organiser with a logo
- **WHEN** an organiser with a logo and a cover image appears on a card
- **THEN** the card SHALL show the logo, whole and uncropped, and SHALL NOT show the cover image

#### Scenario: Organiser with a cover but no logo
- **WHEN** an organiser without a logo but with at least one image appears on a card
- **THEN** the card SHALL show its first image as a cover, as before this change

#### Scenario: Organiser with neither
- **WHEN** an organiser with no logo and no images appears on a card
- **THEN** the card SHALL show the organiser's name on a brand-coloured panel in the image area

#### Scenario: A wide logo
- **WHEN** an organiser's logo is much wider than it is tall
- **THEN** the card SHALL show the whole logo, scaled down to fit the image area, with no part cut off

#### Scenario: A logo exported at 16:9
- **WHEN** an organiser's logo is a 16:9 image, such as one with its own white background made to the site's image rule
- **THEN** the logo SHALL fill the card's image area edge to edge, with no visible panel or border around it, and SHALL look as consistent with neighbouring cover-image cards as a cover would

#### Scenario: Cards in one row
- **WHEN** organisers with a logo, a cover, and neither appear in the same row of cards
- **THEN** their image areas SHALL have the same size and the same 16:9 shape

#### Scenario: The same organiser on both pages
- **WHEN** the same organiser appears on the organisers overview and in the homepage's "who we are" section
- **THEN** both cards SHALL show the same image, chosen by the same rule

#### Scenario: The organiser's page is unchanged
- **WHEN** a visitor opens the page of an organiser with a logo and images
- **THEN** the page SHALL still show the logo beside the name and the images as a slideshow
