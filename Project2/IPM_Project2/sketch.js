// Bake-off #2 -- Seleção em Interfaces Densas
// IPM 2023-24, Período 3
// Entrega: até às 23h59, dois dias úteis antes do sexto lab (via Fenix)
// Bake-off: durante os laboratórios da semana de 18 de Março

// p5.js reference: https://p5js.org/reference/

// Database (CHANGE THESE!)
const GROUP_NUMBER        = 43;      // Add your group number here as an integer (e.g., 2, 3)
const RECORD_TO_FIREBASE  = true;  // Set to 'true' to record user results to Firebase

// Pixel density and setup variables (DO NOT CHANGE!)
let PPI, PPCM;
const NUM_OF_TRIALS       = 12;     // The numbers of trials (i.e., target selections) to be completed
let continue_button;
let legendas;                       // The item list from the "legendas" CSV

// Metrics (DO NOT CHANGE!)
let testStartTime, testEndTime;     // time between the start and end of one attempt (8 trials)
let hits 			      = 0;      // number of successful selections
let misses 			      = 0;      // number of missed selections (used to calculate accuracy)
let database;                       // Firebase DB  

// Study control parameters (DO NOT CHANGE!)
let draw_targets          = false;  // used to control what to show in draw()
let trials;                         // contains the order of targets that activate in the test
let current_trial         = 0;      // the current trial number (indexes into trials array above)
let attempt               = 0;      // users complete each test twice to account for practice (attemps 0 and 1)

// Target list and layout variables
let targets               = []; 	// Stores all the targets in a simple array
let targetsByGroup 		  = []; 	// Stores all the targets divided into groups (each row is a group)
const GRID_ROWS           = 8;      // We divide our 80 targets in a 8x10 grid
const GRID_COLUMNS        = 10;     // We divide our 80 targets in a 8x10 grid

// Colors:
let BACKGROUND_COLOR, TARGET_COLOR, TARGET_HOVER_COLOR, TARGET_TEXT_COLOR, TRIAL_COUNT_COLOR, TARGET_USED_COLOR;

// Sound
let MYSOUND;

// Cursor state variable
let cursor_pointer = false;

// Groups and respectives prefixes and colors
let targetGroups = []; // This is a table that will contain the target groups
let groupColors = [];


/**
 * This function will organize all targets in groups alphabetically per prefix.
 * The following global variables will contain the groups organized (each row is a group):
 * @global targetGroups - Contains spaces (undefined) to put the targets organized by groups
 * @gloabl groupColors - Contains each group color
 */
function createGroups() {
	let colorID = 0;

	let currentGroupSize = 0; 
	let maxGroupSize = 5;

	let currentPrefixSize = 2;

	let prefixesStack = []; // Stack keeping the order of the subgroups if repetition is found

	let currentCityID = 0;
	let currentCity = ''
	let lastPrefix = '';

	// Changed to while to have better control over the current ID
	while (currentCityID < legendas.getRowCount()) {
		currentCity = legendas.getString(currentCityID, 'city');
		let currentPrefix = currentCity.substring(0, currentPrefixSize);
		
		// Check if we left the group. example:
		// if we are on Bechar, we have to compare Be with the last
		// group found, which in this case was Ba
		let currentGroupPrefix = prefixesStack.slice(-1);
		if (currentGroupPrefix.length > 0){
			let currentCityPrefixGroupSized = currentCity.substring(0, currentGroupPrefix[0].length);
			if (currentGroupPrefix != currentCityPrefixGroupSized){
				//console.log("left group");
				prefixesStack.pop();
				currentPrefixSize--;
				currentGroupSize = 0;
				continue;
			}
		}

		if (currentPrefix == lastPrefix) {
			currentGroupSize++;

			// Push the target to the current group
			//targetGroups[targetGroups.length - 1].push(targets[currentCityID]);

			// Sum 1 to the group number of targets
			targetGroups[targetGroups.length - 1].nTargets++;
		} else {
			colorID++;
			currentGroupSize = 0;

			// Create a new group and insert the target, the prefix and the color
			targetGroups.push({ "nTargets": 1, "prefix": currentPrefix, "color": groupColors[currentCityID] });
		}
		
		// Check if a group is needed
		if (currentGroupSize > maxGroupSize){
			currentCityID -= currentGroupSize;
			//console.log("Group needed - back to: " + currentCityID);
			currentGroupSize = 0;
			currentPrefixSize++;
			prefixesStack.push(currentPrefix);

			// Delete the current group and prefix
			targetGroups.pop();
			//prefixes.pop();

			continue;
		}
			
		lastPrefix = currentCity.substring(0, currentPrefixSize);
		currentCityID++;
	}
}


// Ensures important data is loaded before the program starts
function preload() {
	// id,name,...
	legendas = loadTable('legendas.csv', 'csv', 'header');
	groupColors = ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', color(139,69,19), color(255,140,0), color(255,140,0), color(255,140,0), color(255,140,0), color(255,140,0), 'yellow', 'yellow', 'pink', 'purple', 'purple', 'purple', 'purple', 'purple', 'green', 'green', 'green', 'green', 'green', 'green', 'yellow'];
}

// Runs once at the start
function setup() {
	// Define colors:
	BACKGROUND_COLOR   = 'black';
	TARGET_COLOR       = color(158,226,255);
	TARGET_HOVER_COLOR = 'white';
	TARGET_USED_COLOR  = color(175,175,175);
	TARGET_TEXT_COLOR  = 'white';
	TRIAL_COUNT_COLOR  = 'white';

	createCanvas(700, 500);    // window size in px before we go into fullScreen()
	frameRate(60);             // frame rate (DO NOT CHANGE!)

	// Sort legendas alphabetically
	legendas.getRows().sort((a, b) => a.getString('city').localeCompare(b.getString('city')));

	// Create the target groups
	createGroups();

	randomizeTrials();         // randomize the trial order at the start of execution
	drawUserIDScreen();        // draws the user start-up screen (student ID and display size)
	textFont("Arial", 16);     // set the font for the majority of the text
	fill(255);                 // set the fill color to white
	textStyle(BOLD);
	text("Dicas:", 30, 275);
	textStyle(NORMAL);
	text("As palavras estão organizadas por ordem alfabética e agrupadas por\ncores, onde cada cor indica as primeiras letras do nome.\n\nCada palavra tem uma abreviação destacada no topo do respetivo alvo.\n\nVai tocar um som sempre que um alvo for clicado.\n\nNão te esqueças que o tempo só começa a contar após clicares no primeiro alvo,\nportanto não tenhas problemas em perceber como o prototipo está organizado.", 30, 300);
}

// Runs every frame and redraws the screen
function draw() {
	if (!draw_targets || attempt >= 2) return;

	cursor_pointer = false;

	// The user is interacting with the 6x3 target grid
	background(BACKGROUND_COLOR);        // sets background to black

	// Print trial count at the top left-corner of the canvas
	textFont("Arial", 16);
	fill(TRIAL_COUNT_COLOR);
	textAlign(LEFT);
	text("Trial " + (current_trial + 1) + " of " + trials.length, 50, 20);	

	// Draws a background for each group
	for (let i = 0; i < targetsByGroup.length; i++) {
		let currentGroup = targetsByGroup[i];

		let x1 = currentGroup[0].x;
		let y1 = currentGroup[0].y;
		let x2 = currentGroup[currentGroup.length - 1].x; // + currentGroup[currentGroup.length - 1].width;
		let y2 = currentGroup[currentGroup.length - 1].y;

		let targetWidth = currentGroup[0].width;
		let targetHeight = currentGroup[0].width;

		// Check if they are in the same line
		if (y1 == y2) {
			let groupWidth = x2 + targetWidth - x1;

			let lastX = currentGroup[0].x;
			currentGroup.forEach(target => {
				if (target != currentGroup[0]) target.x = lastX + targetWidth + 10;

				lastX = target.x;
			});

			fill(255);
			rect(x1 - targetWidth/2 - 10, y1 - targetHeight/2 - 10, groupWidth + 20, targetHeight + 20);
		} else {
			let lastTarget = currentGroup[0]; // Row last target
			let firstTarget = undefined; // Next row first target
			let lastX = currentGroup[0].x;
			currentGroup.forEach(target => {
				if (target.y == lastTarget.y) lastTarget = target;
				else if (!firstTarget) firstTarget = target;

				if (target != firstTarget && target != currentGroup[0]) target.x = lastX + targetWidth + 10;

				lastX = target.x;
			});

			fill(255);
			rect(x1 - targetWidth/2 - 10, y1 - targetHeight/2 - 10, lastTarget.x + targetWidth - x1 + 20, targetHeight + 20);
			rect(firstTarget.x - targetWidth/2 - 10, firstTarget.y - targetHeight/2 - 10, x2 + targetWidth - firstTarget.x + 20, targetHeight) + 20;
		}

		// Draw all the targets for this group
		let firstTarget = true;
		currentGroup.forEach(target => {
			let targetPrefix = (firstTarget) ? targetGroups[i].prefix : '';
			target.draw(groupColors[i], targetPrefix);
			firstTarget = true;
		});
	}

	// Draws the target label to be selected in the current trial. We include 
	// a black rectangle behind the trial label for optimal contrast in case 
	// you change the background colour of the sketch (DO NOT CHANGE THESE!)
	fill(color(0,0,0));
	rect(0, height - 40, width, 40);

	textFont("Arial", 20); 
	fill(color(255,255,255)); 
	textAlign(CENTER);

	text(legendas.getString(trials[current_trial],'city'), width/2, height - 20);

	if (cursor_pointer) {
		cursor(HAND);
	} else {
		cursor(ARROW);
	}
}

// Print and save results at the end of 54 trials
function printAndSavePerformance() {
	// DO NOT CHANGE THESE! 
	let accuracy			= parseFloat(hits * 100) / parseFloat(hits + misses);
	let test_time         = (testEndTime - testStartTime) / 1000;
	let time_per_target   = nf((test_time) / parseFloat(hits + misses), 0, 3);
	let penalty           = constrain((((parseFloat(95) - (parseFloat(hits * 100) / parseFloat(hits + misses))) * 0.2)), 0, 100);
	let target_w_penalty	= nf(((test_time) / parseFloat(hits + misses) + penalty), 0, 3);
	let timestamp         = day() + "/" + month() + "/" + year() + "  " + hour() + ":" + minute() + ":" + second();

	textFont("Arial", 18);
	background(color(0,0,0));   // clears screen
	fill(color(255,255,255));   // set text fill color to white
	textAlign(LEFT);
	text(timestamp, 10, 20);    // display time on screen (top-left corner)

	textAlign(CENTER);
	text("Attempt " + (attempt + 1) + " out of 2 completed!", width/2, 60); 
	text("Hits: " + hits, width/2, 100);
	text("Misses: " + misses, width/2, 120);
	text("Accuracy: " + accuracy + "%", width/2, 140);
	text("Total time taken: " + test_time + "s", width/2, 160);
	text("Average time per target: " + time_per_target + "s", width/2, 180);
	text("Average time for each target (+ penalty): " + target_w_penalty + "s", width/2, 220);

	// Saves results (DO NOT CHANGE!)
	let attempt_data = {
		project_from:       GROUP_NUMBER,
		assessed_by:        student_ID,
		test_completed_by:  timestamp,
		attempt:            attempt,
		hits:               hits,
		misses:             misses,
		accuracy:           accuracy,
		attempt_duration:   test_time,
		time_per_target:    time_per_target,
		target_w_penalty:   target_w_penalty,
	}

	// Sends data to DB (DO NOT CHANGE!)
	if (RECORD_TO_FIREBASE) {
		// Access the Firebase DB
		if (attempt === 0) {
			firebase.initializeApp(firebaseConfig);
			database = firebase.database();
		}

		// Adds user performance results
		let db_ref = database.ref('G' + GROUP_NUMBER);
		db_ref.push(attempt_data);
	}
}

// Mouse button was pressed - lets test to see if hit was in the correct target
function mousePressed() {
	// Only look for mouse releases during the actual test
	// (i.e., during target selections)
	if (draw_targets) {
		for (var i = 0; i < legendas.getRowCount(); i++)
		{
			// Check if the user clicked over one of the targets
			if (targets[i].clicked(mouseX, mouseY)) {

				// Checks if it was the correct target
				if (targets[i].id.toString() === legendas.getString(trials[current_trial],'id')) {
					hits++;
					// Save as already clicked
					targets[i].used = true;
					MYSOUND = new Audio('Sounds/right.wav');
					MYSOUND.play();
				}
				else {
					misses++;
					MYSOUND = new Audio('Sounds/right.wav');
					MYSOUND.play();
				}
				
				current_trial++;              // Move on to the next trial/target
				break;
			}
		}

		// Check if the user has completed all trials
		if (current_trial === NUM_OF_TRIALS) {
			testEndTime = millis();
			draw_targets = false;          // Stop showing targets and the user performance results
			printAndSavePerformance();     // Print the user's results on-screen and send these to the DB
			attempt++;   
			MYSOUND = new Audio('Sounds/end.wav');
			MYSOUND.play();             
			
			// If there's an attempt to go create a button to start this
			if (attempt < 2) {
				continue_button = createButton('START 2ND ATTEMPT');
				continue_button.mouseReleased(continueTest);
				continue_button.position(width/2 - continue_button.size().width/2, height/2 - continue_button.size().height/2);
			}
		}
		// Check if this was the first selection in an attempt
		else if (current_trial === 1) testStartTime = millis(); 
	}
}

// Evoked after the user starts its second (and last) attempt
function continueTest() {

	// Re-randomize the trial order
	randomizeTrials();

	// Resets performance variables
	hits = 0;
	misses = 0;

	current_trial = 0;
	continue_button.remove();

	// Set the used targets background to default again 
	targets.forEach(target => target.used = false);

	// Shows the targets again
	draw_targets = true;

	// Resets the sound
	MYSOUND.pause();
	MYSOUND.currentTime = 0;
}

// Creates and positions the UI targets
function createTargets(target_size, group_space, screen_width, horizontal_gap, vertical_gap) {
	// Only create the targets once!
	if (targets.length > 0) return;
	
	// Current positions to draw
	let X = target_size/2 + 10;
	let Y = 105;

	// Populate targets by groups
	let legendas_index = 0;
	targetGroups.forEach(group => {
		// Calculate space needed for this group
		let groupWidth = group.nTargets * target_size + group_space * (group.nTargets - 1);

		// Check if a new line is needed
		if (X + groupWidth > screen_width - 10) {
			X = target_size/2 + 10;
			Y += vertical_gap + target_size;
		}

		let newGroup = [];
		for (i = 0; i < group.nTargets; i++) {
			let target_id = legendas.getNum(legendas_index, 0); 
			let target_label = legendas.getString(legendas_index, 1);
			
			let target = new Target(X, Y, target_size, target_label, target_id);			
			newGroup.push(target);
			targets.push(target);
			
			legendas_index++;
			X += target_size + group_space;
		}
		targetsByGroup.push(newGroup);

		X += horizontal_gap;
	});
}

// Is invoked when the canvas is resized (e.g., when we go fullscreen)
function windowResized() {
	if (fullscreen()) {
		resizeCanvas(windowWidth, windowHeight);

		// DO NOT CHANGE THE NEXT THREE LINES!
		let display        = new Display({ diagonal: display_size }, window.screen);
		PPI                = display.ppi;                      // calculates pixels per inch
		PPCM               = PPI / 2.54;                       // calculates pixels per cm

		// Make your decisions in 'cm', so that targets have the same size for all participants
		// Below we find out out white space we can have between 2 cm targets
		let screen_width   = display.width * 2.54;             // screen width
		let screen_height  = display.height * 2.54;            // screen height

		let target_size    = screen_width / 18.4;					// sets the target size (will be converted to cm when passed to createTargets)
		let group_space	   = screen_width / (18.4*5);				// sets the space between targets in the same group
		let horizontal_gap = screen_width / (18.4*(2/0.8));		// sets the space between groups (horizontally)
		let vertical_gap   = screen_height / 36.1;				// empty space in cm across the y-axis (based on 8 targets per column)

		// Create targets based on the above values
		createTargets(target_size * PPCM, group_space * PPCM, screen_width * PPCM, horizontal_gap * PPCM, vertical_gap * PPCM);

		// Starts drawing targets immediately after we go fullscreen
		draw_targets = true;
	}
}
