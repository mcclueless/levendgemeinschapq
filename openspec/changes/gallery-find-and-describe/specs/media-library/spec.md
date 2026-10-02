## MODIFIED Requirements

### Requirement: Browse the image bank
The system SHALL provide an authenticated backend page that lists the images in the media bank with a visual thumbnail for each, newest first unless another order is chosen. The page SHALL let the administrator search the images by file name, title and alternative text, ignoring letter case and accents; filter them to those in use or those not in use; and sort them by upload date, name or size. It SHALL show at most 48 images per page with controls to reach the other pages and the number of images matched. The search, filter, order and page SHALL be part of the page's address, and SHALL work without JavaScript. Unauthenticated users SHALL NOT access the page.

#### Scenario: Administrator browses uploaded images
- **WHEN** a signed-in administrator opens the media library
- **THEN** the system SHALL display the uploaded images as a thumbnail grid, newest first

#### Scenario: Empty library
- **WHEN** no images have been uploaded yet
- **THEN** the system SHALL show an empty-state message instead of an empty grid

#### Scenario: Searching for an image
- **WHEN** an administrator searches the media library for "cafe"
- **THEN** the grid SHALL show the images whose file name, title or alternative text contains that text, including one titled "Repair Café"

#### Scenario: Listing unused images
- **WHEN** an administrator filters the media library to images not in use
- **THEN** the grid SHALL show only images that no content item uses

#### Scenario: More images than one page
- **WHEN** the media library matches 100 images
- **THEN** the grid SHALL show the first 48, the total of 100, and controls to reach the remaining pages

#### Scenario: Nothing matches
- **WHEN** a search or filter matches no images
- **THEN** the page SHALL state that nothing was found and SHALL offer a link that clears the search and filter

### Requirement: Upload images from the library
The media library SHALL allow the administrator to upload one or more new images directly, storing them in the media store and showing them in the grid. The administrator SHALL be able to choose several files at once or drop them on the page. Each file SHALL be validated and stored on its own, the result SHALL be reported per file, and a rejected file SHALL NOT prevent the others from being stored. Uploading a single image SHALL work without JavaScript.

#### Scenario: Uploading a new image
- **WHEN** an administrator uploads an image file from the media library
- **THEN** the system SHALL store it in the media store and the image SHALL appear in the library grid

#### Scenario: Uploading several images at once
- **WHEN** an administrator chooses or drops five image files in the media library
- **THEN** the system SHALL store all five and they SHALL appear in the library grid

#### Scenario: One file of several is rejected
- **WHEN** an administrator uploads several files and one of them is not a permitted image
- **THEN** the system SHALL store the others, SHALL NOT store the rejected file, and SHALL report which file was rejected and why

## ADDED Requirements

### Requirement: Where an image is used
The media library SHALL show, for each image, whether any content item uses it, counting the same uses that prevent deletion: as a cover image, as a logo, in a gallery or slideshow, or within the body text of an item of any publication status. For a single image the library SHALL list the items that use it, each linking to that item.

#### Scenario: An image in use
- **WHEN** an administrator views an image that an event uses as its cover
- **THEN** the library SHALL mark the image as in use and SHALL name that event with a link to it

#### Scenario: An unused image
- **WHEN** an administrator views an image that no content item uses
- **THEN** the library SHALL mark the image as not in use

### Requirement: A page per image
The media library SHALL provide a page for each image, reachable from the grid, showing the image at a large size, its file name, file size, upload date and address, the items that use it, and an action to delete it. The page SHALL offer a control that copies the image's address. Where the image's dimensions can be determined, the page SHALL show them.

#### Scenario: Opening an image
- **WHEN** an administrator selects an image in the library grid
- **THEN** the system SHALL open that image's page with its large view, file name, size, upload date, address, and the items that use it

#### Scenario: Deleting from the image's page
- **WHEN** an administrator deletes an image from its page and the image is not in use
- **THEN** the system SHALL remove it and return the administrator to the library

### Requirement: Deleting several images at once
The media library SHALL let the administrator select several images and delete them in one action, after an explicit confirmation. Each selected image SHALL be subject to the reference check for deletion: images not in use SHALL be removed, images in use SHALL NOT be removed, and the result SHALL state how many were removed and name those that were kept because they are in use.

#### Scenario: Deleting several unused images
- **WHEN** an administrator selects three images that nothing uses and confirms deleting them
- **THEN** the system SHALL remove all three and report that three images were deleted

#### Scenario: A selection that includes an image in use
- **WHEN** an administrator selects three images, one of which a blog post uses, and confirms deleting them
- **THEN** the system SHALL remove the two unused images, SHALL keep the one in use, and SHALL name the image that was kept

### Requirement: Image title and alternative text
The media library SHALL let the administrator give an image a title and an alternative text, both optional, and change or clear them later. The title SHALL be shown in place of the file name wherever the backend names the image. Setting a title SHALL NOT change the image's stored name or address. Deleting an image SHALL also remove its title and alternative text. These details SHALL NOT be readable from outside the authenticated backend except as the alternative text of an image shown on a public page.

#### Scenario: Giving an image a title
- **WHEN** an administrator sets an image's title to "Repair Café, zaal"
- **THEN** the library grid and the image picker SHALL show that title for the image, and the image's address SHALL be unchanged

#### Scenario: An image without details
- **WHEN** an image has no title
- **THEN** the backend SHALL show its file name, as before

#### Scenario: Clearing the details
- **WHEN** an administrator clears an image's title and alternative text
- **THEN** the image SHALL be shown by its file name and SHALL have no stored alternative text

### Requirement: An image's alternative text is used where it is shown
Where a page shows an image as a cover image, in a gallery or in a slideshow, and that image has a stored alternative text, the page SHALL use it as the image's text alternative. An image without a stored alternative text SHALL keep the text alternative the page gave it before. An image placed within a body SHALL keep the description given when it was inserted.

#### Scenario: A described cover image
- **WHEN** a visitor opens an event whose cover image has the stored alternative text "Vrijwilligers repareren een fiets"
- **THEN** the cover image's text alternative SHALL be "Vrijwilligers repareren een fiets"

#### Scenario: A cover image without a description
- **WHEN** a visitor opens an event whose cover image has no stored alternative text
- **THEN** the cover image's text alternative SHALL be the event's title

### Requirement: Replacing an image's file
The media library SHALL let the administrator replace an image's file with a new one while keeping the image's address, title and alternative text, so that every content item using the image shows the new file without being edited. The new file SHALL pass the same validation as any upload and SHALL be of the same format as the file it replaces; otherwise the system SHALL refuse it, report why, and leave the stored image unchanged. The library SHALL tell the administrator that visitors may see the previous file for a time.

#### Scenario: Replacing with a file of the same format
- **WHEN** an administrator replaces a JPEG image with another JPEG
- **THEN** the image's address SHALL be unchanged and the address SHALL serve the new file

#### Scenario: Replacing with another format
- **WHEN** an administrator tries to replace a JPEG image with a PNG
- **THEN** the system SHALL refuse the file, report that the format must match, and keep the stored image
