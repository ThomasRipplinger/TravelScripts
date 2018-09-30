
function OnOkLocationsForm() {
    log.info('saving location form');
    saveLocationsForm();
    hideLocationsForm();
    clearLocationsForm();  // for next time
    scrollIntoView('.jumbotron');
}

function OnNewLocation() {
    log.info('on new location...');
    // first save whatever location form is currently open
    if ($('.locationForm').is(":visible")) {
        saveLocationsForm();  
    }
    hideLocationsForm();
    clearLocationsForm();
    // add overlay then wait for user input
    var html = '<input type="text" class="form-control" id="input-newlocation" placeholder="neuer Ort / Zwischenstopp">';
    $('#btn-newlocation').empty();  // remove field in case already existing
    $(this).append(html);           // overlay current location button with input field
    $('#input-newlocation').keydown(OnLocationPopupKeydown);  // add handler for input processing
    $('#input-newlocation').focus();  
    if(!locationScrolled){              // scroll only once
        locationScrolled = true;
        scrollIntoView('#tripMap');
    }}

function OnDeleteLocation() {
    log.info('delete location...');

    hideLocationsForm();

    var locationId = $('#locationId').val();
    if(locationId == undefined) {
        log.error('ERROR: cant find location Id');
        return;
    }

    location.open(locationId);
    location.delete(locationId);
    
    saveTripsToLocalStore();
    clearLocationsForm();
    showLocationTiles();
}

function OnMoveLocation(event) {
    event.preventDefault(); // supress page reload
    log.info('move location...');

    if(!location.opened) return;

    const directionId = $(this).attr('id');
    log.debug('direction: ' + directionId);  // btnUp or btnDown

    // var locationId = $('#locationId').val();
    // if(locationId == undefined) {
    //     log.error('ERROR: cant find location Id');
    //     return;
    // }

    // verify if at least 2 locations
    const locationCount = location.locArray.length;
    if(locationCount < 2) return;

    // move upwards
    if(directionId == 'btnUp') {
        // verify if already on first location
        if(locationIndex == 0) return;
        // swap current with prev. location
        swapLocations(locationIndex, locationIndex-1);
    }
    // move downwards
    if(directionId == 'btnDown') {
        // verify if already on last location
        if(locationIndex == locationCount-1) return;
        // swap current with next location
        swapLocations(locationIndex, locationIndex+1);
    }

    showLocationTiles();
}

function OnViewLocation() {
    log.info('view location...');
    // toggle state
    $(this).button('toggle');

    // check if same location selected: do nothing
    var newLocationId = $(this).attr('id');
    var prevLocationId = $('#prevlocation').text();
    if (prevLocationId == newLocationId) {  // same
        // if locationsform displayed: save
        if ($('.locationForm').is(":visible")) {
            saveLocationsForm();  
        }
        showLocationForm();                 // toggle form
        if(!locationScrolled){              // scroll only once
            locationScrolled = true;
            scrollIntoView('#tripMap');
        }
        return; 
    }
    else {
        // if locationsform displayed: save
        if ($('.locationForm').is(":visible")) {
            saveLocationsForm();  
        }
        // save new location id
        $('#prevlocation').text(newLocationId);

        // fill location form (and init map)
        updateLocationForm();
    }
    showLocationForm();
    if(!locationScrolled){              // scroll only once
        locationScrolled = true;
        scrollIntoView('#tripMap');
    }
}

function OnLocationPopupKeydown(event) {
    log.debug(event.keyCode);
    if(event.keyCode===13) {     // Enter
        OnLocationPopupEntered();
    }
    else if(event.keyCode===9) { // Tab
        OnLocationPopupEntered();
    }
    else if(event.keyCode===27) { // ESC
        $('#input-newlocation').remove();  // hide input field
        addEmptyLocationTile();
    }
    else if(event.keyCode===32) { // Space
        event.preventDefault();
        var locationName = $('#input-newlocation').val();
        $('#input-newlocation').val(locationName + ' ');  // add space, but prevent leaving the form
    }
}

function OnLocationKeydown(event) {
    if(event.keyCode===13) {     // Enter
        OnFormLocationEntered();
    }
}

function OnLocationPopupEntered(event) {
    log.info('location entered');
    // log.debug(event);
    // user has entered a new location in popup overlay
    var locationName = $('#input-newlocation').val();
    $('#input-newlocation').remove();  // hide input field
    // check if valid entry
    if(locationName === '') {
        log.info('no location entered');
        addEmptyLocationTile();  // re-draw 'new location' tile
        return;
    }
    log.info('new location: ' + locationName);

    // add locations tile before the 'new location' tile:
    if(!trip.opened) return;

    var locationId = location.create(locationName);
    location.open(locationId);
    showLocationTiles();  // update the location tiles
    updateLocationForm();         // init form and update map
    showLocationForm();  
}

function OnFormLocationEntered() {
    log.info('form location entered...');
    // user has entered a new location in location form => update data and map
    var locationName = $('#locationName').val();
    if((locationName === '') || (locationName == undefined)) {
        log.info('no location entered');
        return;
    }
    log.info('modified location: ' + locationName);

    // update location name in data:
    // var tripId = $('.tripForm #tripId').val();
    // var locationId = $('.locationForm #locationId').val();
    // var tripIndex = getTripIndexById(tripId);
    // var locationIndex = getLocationIndexById(tripIndex, locationId);
    location.locArray[location.index].name = locationName;
    // update location name in tile:
    // var locationDate = location.locArray[location.index].date;
    // updateLocationTile(trip.id, location.id, locationName, locationDate);
    updateLocationTile();
    // update map
    centerMapAroundAddressForLocation(locationName);
}

function OnFormDateEntered(dateText) {
    log.info('form date entered');
    log.debug('date: ' + dateText);

    // user has entered a new date in location form => update tile
    location.locArray[location.index].date = dateText;
    // update location date in tile:
    updateLocationTile();
}

function addLocationTile() {
    log.info('add location tile');
    if(!location.opened) {
        log.error('ERROR: location not open, cant add tile');
        return ERROR;
    }
    if(location.distance === undefined) location.distance = '';
    if(location.duration === undefined) location.duration = '';

    // var html = '<div class="btn-location locationTile existingLocation col-md-4" id="' + locationId + '">'
    var html = '<div class="btn-location locationTile existingLocation " id="' + location.id + '">'
        + '<div class="row">'
        // +   '<h4 class="col-sm-10">' + locationName + '</h4>'
        +   '<h4>' + location.name + '</h4>'
        // +   '<button type="button" class="deletelocation close col-sm-2" aria-label="Close">'
        // +     '<span aria-hidden="true">&times;</span>'
        // +   '</button>'
        + '</div>'
        + '<div>'
        + '<span class="location-info" id="locationTileDate">' + location.tileDate + '</span>'
        + '</div>'
        + '<span class="location-info" id="locationTileDistance">' + location.distance + '</span>'
        + '<span class="location-info" id="locationTileDuration"> ' + location.duration + '</span>'
        // + '<p><a class="btn btn-secondary viewlocation" href="#" role="button">Anschauen »</a></p>'
        + '</div>';
    // log.debug(html);
    $('.locationTiles').append(html);
}

function updateLocationTile() {
    log.info('update location tile');
    if(!location.opened) {
        log.error('ERROR: location not open, cant add tile');
        return ERROR;
    }

    var $locTile = $('#' + locationId);   // find location tile by Id
    if($locTile.length) {
        $locTile.find('h4').text(location.name);                  // update name of the location tile 
        $locTile.find('#locationTileDate').text(location.tileDate);   // update date of the location tile 
    }
    else {
        log.error('ERROR: could not find location tile for name update');
    }
}

function addEmptyLocationTile() {
    log.info('add empty location tile');
    $('#btn-newlocation').remove();  // remove
    var html = '<button type="button" class="btn-location locationTile" id="btn-newlocation">' 
            + '<span class="mr-3">' + 'Ort hinzufügen' + '</span>'
            + '<i class="fas fa-angle-double-right"></i></button>';
    $('.locationTiles').append(html);  // add
    $('#btn-newlocation').click(OnNewLocation);
}

function showLocationTiles() {
    log.info('show location tiles for trip: ' + trip.id);

    if(!trip.opened) {
        log.error('ERROR: trip not open, cant show tiles');
        return ERROR;
    }

    $('.locationTiles').empty();  // delete all existing locations

    // add existing locations for this trip:
    if(trip.locArray !== undefined) {
        for (var i = 0; i < trip.locArray.length; i++) {
            location.open(i);
            log.debug('adding location: ' + location.name);
            addLocationTile();
            location.close();
        }
    }
    // add handlers
    $('.existingLocation').click(OnViewLocation);

    // button 'add new' at the end:
    addEmptyLocationTile(); 

    // show location tiles
    if(!($('.locationsContainer').is(':visible'))) {
        $('.locationsContainer').slideToggle(500, 'linear', function () {
            // log.debug('toggling location tiles');
        });
    }
} 

function hideLocationTiles() {
    log.info('hide location tiles');
    $('.locationsContainer').fadeOut(700);    
}

function updateLocationForm() {
    if(!location.opened) {
        log.error('ERROR: location not open, cant update form');
        return ERROR;
    }

    log.info('fill location form with data');
    $('.locationForm #locationId').val(location.id);
    $('.locationForm #locationName').val(location.name);
    $('.locationForm #locationDate').val(location.date);
    $('.locationForm #locationNights').val(location.nights);
    $('.locationForm #locationDistance').val(location.distance);
    $('.locationForm #locationDuration').val(location.duration);
    $('.locationForm #locationAddress').val(location.address);
    $('.locationForm #locationDesc').val(location.desc);

    centerMapAroundAddressForLocation(location.name);
}

function showLocationForm() {
    log.info('show location form');
    // toggle only if not visible
    if(!($('.locationForm').is(':visible'))) {
        $('.locationForm').slideToggle(500, 'linear', function () {
            ;
        });
    }
}

function hideLocationsForm() {
    log.info('hide location form');
    $('.locationForm').fadeOut(1000 );    
}

function clearLocationsForm() {
    log.info('clear location form');
    $('.locationForm #locationId').val('');
    $('.locationForm #locationName').val('');
    $('.locationForm #locationDate').val('');
    $('.locationForm #locationNights').val('');
    $('.locationForm #locationDistance').val('');
    $('.locationForm #locationDuration').val('');
    $('.locationForm #locationAddress').val('');
    $('.locationForm #locationDesc').val('');
}

function saveLocationsForm() {
    log.info('save location form');

    if(!location.opened || !trip.opened) {
        log.error('ERROR: trip / location not open, cant save');
        return ERROR;
    }
    
    // prepare object with form data
    var locationObj = {
        id: locationId,
        name: $('.locationForm #locationName').val(),
        date: $('.locationForm #locationDate').val(),
        nights: $('.locationForm #locationNights').val(),
        distance: $('.locationForm #locationDistance').val(),
        duration: $('.locationForm #locationDuration').val(),
        address: $('.locationForm #locationAddress').val(),
        desc: $('.locationForm #locationDesc').val()
    };

    trip.locArray[location.index] = locationObj;
    saveTripsToLocalStore();
}