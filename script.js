var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent;

var synth = window.speechSynthesis;
var voices;
var foundVoices;

setTimeout(() => {

    voices = synth.getVoices();
    foundVoices = voices.filter(function (voice) {
        return voice.name == "Google UK English Male";
    });
}, 10);

let startBtn = document.getElementById('start-button');

var diagnosticPara = document.querySelector('.output');

window.onload = getMain();

var regexYes = /.*(?:(.*yes(?: thanks| please| thank you)?)|yeah|yep|okay|alright|sure)/;
var regexNo = /.*(?:(.*no(?: thank you| thanks| please)?)|nah|nope)/;

var regexClyde = /(?:yo |hey |hi |hello )?.*(?:clyde|clide)/;

var regexNew = /.*(?:create|open|get|make|add)( another)?/;
var regexCurrent = /.*(open|switch|change|go)( to)?/;
var regexNewTab = /(?: new tab| a new tab| another tab)/;

var regexCurrentTab = /.* tab/;
var regexOpenNewTab = concatRegexp(regexNew, regexNewTab);
var regexOpenCurrentTab = concatRegexp(regexCurrent, regexCurrentTab);

var regexFile = /.* file/;

var regexNewFile = /(?: new file| a new file| another file)/;
var regexOpenFile = concatRegexp(regexCurrent, regexFile);
var regexOpenNewFile = concatRegexp(regexNew, regexNewFile);

var regexFunc1 = /.*(?:explain|what) (?:does|is) this(?: function| variable)?( do)?/;
var regexFunc2 = /.*explain(?: this| it)?/;
var regexFunc3 = /.*(?:explain|give) (the )?details(?:for|of)?( this)?(?:function|variable)?/;

var fullFunc = new RegExp("(?:(" + regexFunc1.source + ")|("
    + regexFunc2.source + ")|(" + regexFunc3.source + "))");

var fileRegex;

function getFileNames() {
    let files = document.getElementsByClassName("file-button");

    let fileNames = [];

    for (let i = 0; i < files.length; i++)
        fileNames[i] = files[i].id;

    return fileNames;
}

function getFileRegex() {
    let files = document.getElementsByClassName("file-button");

    var regex = '.*(?:';
    for (let i = 0; i < files.length; i++) {
        regex += " " + files[i].id;
        if (i < files.length - 1)
            regex += "|";
    }
    regex += ')';

    fileRegex = new RegExp(regex);

}

getFileRegex();

var fileWithName = new RegExp("(" + regexCurrent.source + ")(" + fileRegex.source + ")( java )?( file)?");

var clyde = new RegExp(".*" + regexClyde.source + "(?:(" + regexOpenCurrentTab.source +
    ")|(" + regexOpenNewTab.source + ")|(" + regexOpenNewFile.source + ")|(" + fullFunc.source + ")|(" +
    regexOpenFile.source + ")|(" + fileWithName.source + "))");

function concatRegexp(reg, exp) {
    let flags = reg.flags + exp.flags;
    flags = Array.from(new Set(flags.split(''))).join();
    return new RegExp(reg.source + exp.source, flags);
}

function resetStates() {
    innerState = undefined;
    state = 0;
    recognition.continuous = true;
}

let recognition = new SpeechRecognition();
let speechRecognitionList = new SpeechGrammarList();

recognition.grammars = speechRecognitionList;
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

let state = 0;
let innerState;

recognition.onresult = function (event) {

    let resultsLength = event.results.length;

    let speechResult = event.results[resultsLength - 1][0].transcript.toLowerCase().trim();

    diagnosticPara.textContent = 'Speech received: "' + speechResult + '"';

    if (speechResult.includes("stop")) {
        stopClyde();
        resetStates();
        state = undefined;
        listening = !listening;
    }

    switch (innerState) {
        case 0:

            if (speechResult.match(regexYes)) {
                utterThis("Switching to new tab");
                let tabNum = document.getElementsByClassName("tab-button").length;

                openTab("tab-" + tabNum);

            } else if (speechResult.match(regexNo)) {
                utterThis("Okay, just say my name if you need me again!");
            } else {
                utterThis("I didn't understand that, sorry.");
            }
            resetStates();
            break;

        case 1:

            let tabNum = parseInt(speechResult);
            console.log(tabNum + " " + isNaN(tabNum) + " " + speechResult.includes("tab"))
            console.log(!isNaN(tabNum))
            console.log(tabNum !== undefined)

            if (speechResult.includes("tab")) {
                console.log("i)")
                let tabNum = parseInt(speechResult.split(" tab ")[0]);
                if (isNaN(tabNum)) {

                    utterThis("I can't find that tab, sorry.");
                } else {
                    utterThis("I opened tab " + tabNum);
                    openTab("tab-" + tabNum);
                }

            } else if (!isNaN(tabNum)) {
                console.log("y)")
                utterThis("I opened tab " + tabNum);
                openTab("tab-" + tabNum);
            } else {
                utterThis("I can't find that tab, sorry.");
            }

            resetStates();
            break;

        case 2:
            if (speechResult.match(regexYes)) {
                explainDetails();
            } else if (speechResult.match(regexNo)) {

            } else {
                utterThis("I didn't understand that, sorry.")
                resetStates();
                break;
            }
            if (highlightedText.includes("addOne")) {
                state = undefined;
                innerState = 3;
                utterThis("Would you like to go to the functions declaration?");
                break;
            } else {
                utterThis("Okay, just say my name if you need me again!");
                resetStates();
                break;
            }

        case 3:
            if (speechResult.match(regexYes)) {
                utterThis("The function is in this file at line 4.");
                getUtility();
            } else if (speechResult.match(regexNo)) {

                utterThis("Okay, just say my name if you need me again!");
            }
            resetStates();
            break;

        case 4:
            utterThis("i have created a file called " + speechResult);
            setFileName(speechResult);
            resetStates();
            break;
        case 5:
            let fileName = speechResult;
            getFileRegex();
            console.log(fileName[0] + " " + (" " + fileName[0]).match(fileRegex))
            if (fileName === "main") {
                utterThis(fileName + " file opened");
                getMain();

            } else if (fileName === "utility") {
                utterThis(fileName + " file opened");
                getUtility();
            } else if ((" " + fileName).match(fileRegex)) {
                openBlankFile(fileName);

                utterThis(fileName + " file opened");
            } else
                utterThis("I can't find that file, sorry.")

            resetStates();
            break;

    }

    switch (state) {
        case 0:

            getFileRegex();
            fileWithName = new RegExp("(" + regexCurrent.source + ")(" + fileRegex.source + ")( java )?( file)?");

            clyde = new RegExp(".*" + regexClyde.source + "(?:(" + regexOpenCurrentTab.source +
                ")|(" + regexOpenNewTab.source + ")|(" + regexOpenNewFile.source + ")|(" + fullFunc.source + ")|(" +
                regexOpenFile.source + ")|(" + fileWithName.source + "))");

            if (speechResult.match(clyde)) {

                state = 1;
                recognition.continuous = false;
            } else if (speechResult.match(regexClyde)) {
                state = 1;

                recognition.continuous = false;
                utterThis("I'm listening.")
                break;
            }

        case 1:
            if (speechResult.match(regexOpenNewTab)) {
                innerState = 0;
                openNewTab();
                utterThis("Would you like to switch to the new tab?");
            } else if (speechResult.match(regexCurrentTab)) {

                let tabNum = parseInt(speechResult.split(' tab ')[1]);
                console.log(tabNum);
                if (isNaN(tabNum) || tabNum === undefined) {
                    utterThis("Which tab?");
                    innerState = 1;
                } else {
                    openTab("tab-" + tabNum);
                    utterThis("opened tab " + tabNum);
                    resetStates();
                }
            }

            if (speechResult.match(fullFunc)) {

                explainFunction();
                if (!highlightedText.includes("number")) {
                    innerState = 2;
                    utterThis("Would you like more details?");
                } else {
                    resetStates();
                    break;
                }
            }
            getFileRegex();
            if (speechResult.match(regexNewFile)) {
                utterThis("What should the files name be?");
                innerState = 4;
                openNewFile();

            } else if (speechResult.match(fileWithName) || speechResult.match(regexOpenFile)) {
                let fileName = undefined;

                let words = speechResult.split(" ");

                let fileNames = getFileNames();
                getFileRegex();
                for (let i = 0; i < words.length; i++) {

                    fileName = fileNames.filter(function (file) {

                        return words[i] == file;
                    });
                    if (fileName[0] !== undefined)
                        break;
                }

                if (fileName[0] === undefined) {
                    utterThis("Which file?");
                    innerState = 5;
                } else {
                    
                    if (fileName[0] === "main") {
                        getMain();
                        utterThis(fileName[0] + "file opened");
                    } else if (fileName[0] === "utility") {
                        getUtility();
                        utterThis(fileName[0] + " file opened");
                    } else if ((" " + fileName[0]).match(fileRegex)) {
                        openBlankFile(fileName[0]);

                        utterThis(fileName[0] + " file opened");
                    } else {
                        utterThis("I can't find that file. Sorry.")
                    }

                    resetStates();
                }
            }

            break;

        case 2:
            utterThis("I'm sorry, I didn't understand, try again.");
            resetStates();


    }

    console.log('Confidence: ' + event.results[0][0].confidence);
}

recognition.onspeechend = function () {
    recognition.stop();
    startBtn.disabled = false;
    startBtn.textContent = 'Start CLIDE';
    document.getElementById("listening").style.visibility = "hidden";

}

recognition.onerror = function (event) {
    startBtn.disabled = false;
    startBtn.textContent = 'Start CLIDE';
    diagnosticPara.textContent = 'Error occurred in recognition: ' + event.error;
}

recognition.onaudiostart = function (event) {
    //Fired when the user agent has started to capture audio.
    console.log('SpeechRecognition.onaudiostart');
}

recognition.onaudioend = function (event) {
    //Fired when the user agent has finished capturing audio.
    console.log('SpeechRecognition.onaudioend');
}

recognition.onend = function (event) {
    //Fired when the speech recognition service has disconnected.
    console.log('SpeechRecognition.onend');
}

recognition.onnomatch = function (event) {
    //Fired when the speech recognition service returns a final result with no significant recognition. This may involve some degree of recognition, which doesn't meet or exceed the confidence threshold.
    console.log('SpeechRecognition.onnomatch');
}

recognition.onsoundstart = function (event) {
    //Fired when any sound — recognisable speech or not — has been detected.
    console.log('SpeechRecognition.onsoundstart');
}

recognition.onsoundend = function (event) {
    //Fired when any sound — recognisable speech or not — has stopped being detected.
    console.log('SpeechRecognition.onsoundend');
}

recognition.onspeechstart = function (event) {
    //Fired when sound that is recognised by the speech recognition service as speech has been detected.
    console.log('SpeechRecognition.onspeechstart');
}
recognition.onstart = function (event) {
    //Fired when the speech recognition service has begun listening to incoming audio with intent to recognize grammars associated with the current SpeechRecognition.
    console.log('SpeechRecognition.onstart');
}

let listening = false;
let first = true;

startBtn.onclick = function () {
    listening = !listening;
    resetStates();
    if (listening) {
        if (first) {
            utterThis("To make me listen, say my name followed by a command!");

            /* setTimeout(() => {
             }, 20);
             */
            first = false;
        } else {
            utterThis("I'm listening");
        }

        recognition.continuous = true;
        recognition.start();
        state = 0;
        startBtn.textContent = "Stop CLIDE";
        document.getElementById("listening").style.visibility = "visible";

    } else {
        utterThis("okay, i'll stop listening");
        recognition.stop();

        startBtn.textContent = "Start CLIDE";
        document.getElementById("listening").style.visibility = "hidden";

        diagnosticPara.textContent = '';
    }
};

function stopClyde() {
    utterThis("okay, i'll stop listening");
    recognition.stop();
    startBtn.textContent = "Start CLIDE";
    document.getElementById("listening").style.visibility = "hidden";

    diagnosticPara.textContent = '';
}

function getCurrentTab() {
    let tabs = document.getElementsByClassName("tab-button");
    let currentTab;
    for (let i = 0; i < tabs.length; i++) {

        if (tabs[i].classList.contains("highlighted")) {
            currentTab = tabs[i].id
        }

    }
    return currentTab.replace("-button", "");
}

function getMain() {
    let fileLinks = document.getElementsByClassName("file-button");

    for (let i = 0; i < fileLinks.length; i++) {
        console.log(fileLinks[i]);
        fileLinks[i].className = fileLinks[i].className.replace(" highlighted", "");
    }

    let html = '<pre>' +

        '<span class="function">function </span> void main (String args[]){' +
        '<br>' +
        '       <span class="function">int</span> <span class="variable">number</span> = 0;' +
        '<br><br>' +
        '       <span class="function">for</span>(<span class="function">int</span> i = 0; i < 10) {' +
        '<br>' +
        '           <span class="variable">number</span> = <span class="function">addOne</span>(i);' +
        '<br>' +
        '           System.out.println(<span class="variable">number</span>);' +
        '<br>' +
        '<br>' +
        '           <span class="function">int</span>[] <span class="variable">arr1</span> = new <span class="function">int</span>[5];' +
        '<br>' +
        '           <span class="function">int</span>[] <span class="variable">arr2</span> = new <span class="function">int</span>[5];' +
        '<br><br>' +
        '           <span class="function">boolean</span> <span class="variable">isEqual</span> = <span class="function">equals</span>(arr1, arr2);' +
        '<br>' +
        '      }' +
        '<br>' +
        '}' +
        '</pre>';

    document.getElementById(getCurrentTab()).innerHTML = html;
    document.getElementById("main").className += " highlighted";
}

function getUtility() {

    let fileLinks = document.getElementsByClassName("file-button");

    for (let i = 0; i < fileLinks.length; i++) {
        console.log(fileLinks[i]);
        fileLinks[i].className = fileLinks[i].className.replace(" highlighted", "");

    }

    let html = '<pre>' +
        '<br>' +
        '/**<br>' +
        '* Adds one to the given number.<br>' +
        '* @param int, the number to add one to.<br>' +
        '* @returns int, the number after adding one.<br>' +
        '*/<br>' +
        '<span class="function">function </span> int addOne (int number){' +
        '<br>' +
        '      <span class="variable">number</span> = <span class="variable">number</span> + 1;' +
        '<br>' +
        '      <span class="function">return</span> <span class="variable">number</span>;' +
        '<br>' +
        '}' +
        '</pre>';

    document.getElementById(getCurrentTab()).innerHTML = html;
    document.getElementById("utility").className += " highlighted";
}

function openNewTab() {

    let tabs = document.getElementById("tabs");
    let codeBlocks = document.getElementsByClassName("code-block");
    let tabNum = codeBlocks.length + 1;

    utterThis("Opening new tab in position " + tabNum);

    let newTabName = 'tab-' + tabNum;

    tabs.innerHTML += "<div id='" + newTabName + "' class='code-block'> </div>";

    let newButton = document.createElement("button");
    newButton.className = "tab-button";
    newButton.id = newTabName + '-button';

    newButton.innerText = "Tab " + tabNum;
    document.getElementById("buttons").appendChild(newButton);
    document.getElementById(newTabName + "-button").setAttribute("onclick", "openTab('" + newTabName + "')");
    console.log(document.getElementById("buttons"));
}

function openTab(tabName) {

    console.log("Tab name: " + tabName);
    var tabs = document.getElementsByClassName("code-block");

    for (let i = 0; i < tabs.length; i++)
        tabs[i].style.display = "none";

    let tablinks = document.getElementsByClassName("tab-button");

    for (let i = 0; i < tabs.length; i++) {
        console.log(tablinks[i]);
        tablinks[i].className = tablinks[i].className.replace(" highlighted", "");

    }

    document.getElementById(tabName).style.display = "block";
    document.getElementById(tabName + "-button").className += " highlighted";

}

function openNewFile() {
    let tabs = document.getElementById("file-buttons");
    tabs.innerHTML += '<button class="file-button"></button>'

}

function openBlankFile(id) {
    let fileLinks = document.getElementsByClassName("file-button");

    for (let i = 0; i < fileLinks.length; i++) {
        console.log(fileLinks[i]);
        fileLinks[i].className = fileLinks[i].className.replace(" highlighted", "");

    }

    let html = '<pre>' +
        '/* This is a new Java file. */'
    '</pre>';

    document.getElementById(getCurrentTab()).innerHTML = html;
    document.getElementById(id).className += " highlighted";
}

function setFileName(name) {
    let buttons = document.getElementsByClassName("file-button");

    let newFile = buttons[buttons.length - 1];

    newFile.innerText = name + ".java";
    newFile.id = name;
    newFile.onclick = function () {
        openBlankFile(name)
    };
}

let highlightedText = "";

function getHighlightedText() {
    var text = "";
    if (typeof window.getSelection != "undefined") {
        text = window.getSelection().toString();
    } else if (typeof document.selection != "undefined" && document.selection.type == "Text") {
        text = document.selection.createRange().text;
    }

    return text;
}

function setHighlighted() {
    let highlighted = getHighlightedText();
    if (highlighted) {
        highlightedText = highlighted.trim();
        console.log(highlightedText);
    }
}

document.onmouseup = setHighlighted;
document.onkeyup = setHighlighted;

function explainFunction() {
    let explanation = "";
    if (highlightedText.includes("addOne")) {

        explanation = "Adds one to the given number. There is 1 parameter, " +
            "an integer. It returns an integer.";

    } else if (highlightedText.includes("equals")) {

        explanation = "Returns true if the two specified arrays of integers are equal to one another. " +
            "There are 2 parameters. First is an integer array. Second is an integer array. It returns a boolean.";
    } else if (highlightedText.includes("number")) {
        explanation = "This variable is an integer.";
    } else {
        explanation = "Sorry, I can't find the details for what you've highlighted. Please try again.";
    }
    utterThis(explanation);
}

function explainDetails() {
    let explanation = "";
    if (highlightedText.includes("addOne")) {

        explanation = "It takes an integer as parameter. This is the number to add one to. It returns an integer. This " +
            "is the number after adding one. This function was implemented locally.";
    } else if (highlightedText.includes("equals")) {
        explanation = "First parameter is an array to be tested for equality. " +
            "Second parameter is the other array to be tested for equality. It returns true " +
            "if the two arrays are equal. This function was implemented in an external library or framework.";
    } else if (highlightedText.includes("number")) {
        explanation = "This variable is an integer.";
    } else {
        explanation = "Sorry, I can't find the details for what you've highlighted. Please try again.";
    }
    utterThis(explanation);
}

function utterThis(phrase) {

    var utterThis = new SpeechSynthesisUtterance(phrase);
    utterThis.onend = function (event) {
        console.log('SpeechSynthesisUtterance.onend');
    }
    utterThis.onerror = function (event) {
        console.error('SpeechSynthesisUtterance.onerror');
    }

    console.log(voices);
    utterThis.voice = foundVoices[0];
    utterThis.pitch = 1;
    utterThis.rate = 1.1;
    synth.speak(utterThis);
}

