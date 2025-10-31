//TODO total rewrite of this spaghetti


let pressTimer = null;
const LONG_PRESS_TIME = 600; 
let timePress = 0;

let droDividers = [1,1,1]
let PRECISION = 3

//onload 

async function fetchSettings(){
    const url = '/api/settings';
 
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) return data;
    else return none;
}


document.addEventListener('DOMContentLoaded', async (event) => {
    
    const droSettings = await fetchSettings();

    const longShortButt = document.querySelectorAll('[data-shortlong]');

    longShortButt.forEach(but=>{
        const action = but.getAttribute('data-shortlong');
        but.addEventListener('mousedown', () => startLongPress(action));
        but.addEventListener('mouseup', () => clearLongPress(action));
        but.addEventListener('touchstart', () => startLongPress(action));
        but.addEventListener('touchend', () => clearLongPress(action));
    });  

    const digitButt = document.querySelectorAll('[data-digit]');
    digitButt.forEach(butt=>{
        const arg = butt.getAttribute('data-digit');
        butt.textContent = arg;
        butt.addEventListener('click',handleDigit);
        });      
    
    activateAxes('axes0');


    const readOuts = document.querySelectorAll('.dro__disp');
    readOuts.forEach(readOut =>{
        ax_index = parseInt(readOut.id.slice(-1),10);
        if (ax_index < droSettings.noAxes){
            readOut.querySelector('[id$="_Name"]').textContent = droSettings.axesSettings[ax_index].name;
            droDividers[ax_index] = droSettings.axesSettings[ax_index].divider;
        }
    })


    if (droSettings.noAxes < 3){
        const axes3 = document.getElementById('readOut2');
        axes3.classList.add('is-disabled')
    } 
    if (droSettings.noAxes < 2){
        const axes2 = document.getElementById('readOut1');
        axes2.classList.add('is-disabled')
    } 

});

function handleSettings(){
    document.documentElement.requestFullscreen();
}

//calculator logic

const mainDisplay = document.getElementById('mainDisplay');
const secondaryDisplay = document.getElementById('secondaryDisplay');
const clearButton = document.getElementById('clearButton');

let previousValue = 0;
let currentOperator = null;
let newNumberStarted = true;
let clearStatus = 0; 
let lastResult = 0; 
let resultReady = false; // Is het laatste resultaat getoond na '='?



function updateSecondaryDisplay() {
        if (currentOperator === null) {
            secondaryDisplay.textContent = '';
        } else {
            secondaryDisplay.textContent = `${Number(previousValue.toFixed(PRECISION))} ${currentOperator}`;
        }
    }

function handleDigit(digit) {
        
        // Controleer of de gebruiker begint met een nieuw nummer na het indrukken van '=' of Initialiseren
        if (resultReady) {
            mainDisplay.textContent = '0'; // Wis het resultaat
            resultReady = false; // Resultaat is nu gewist
            newNumberStarted = true; // Zorg dat het cijfer het display vervangt
        }

        if (newNumberStarted) {
            if (digit === '.') {
                mainDisplay.textContent = '0.';
            } else {
                mainDisplay.textContent = digit;
            }
            newNumberStarted = false;
        } else {
            if (digit === '.' && mainDisplay.textContent.includes('.')) {
                return;
            }
            mainDisplay.textContent += digit;
        }
        
        clearStatus = 1; 
        clearButton.textContent = 'CE'; 
    }




function handleOperator(nextOperator) {
        if (currentOperator !== null && !newNumberStarted) {
            calculate();
        }
        
        previousValue = parseFloat(mainDisplay.textContent);
        currentOperator = nextOperator;
        
        updateSecondaryDisplay();
        newNumberStarted = true;
        mainDisplay.textContent = '0';
        resultReady = false; 
        
        clearStatus = 1;
        clearButton.textContent = 'CE';
    }
function calculate() {
        if (currentOperator === null) {
            v = parseFloat(mainDisplay.textContent);
            secondaryDisplay.textContent = `${Number(v.toFixed(PRECISION))} =`;
            lastResult = parseFloat(mainDisplay.textContent); 
            resultReady = true; 
            return; 
        }
        
        const currentValue = parseFloat(mainDisplay.textContent);
        let result = 0;

        switch (currentOperator) {
            case '+': result = previousValue + currentValue; break;
            case '-': result = previousValue - currentValue; break;
            case '*': result = previousValue * currentValue; break;
            case '/':
                if (currentValue === 0) {
                    mainDisplay.textContent = 'Fout: Deling door 0';
                    clearAll(true);
                    return;
                }
                result = previousValue / currentValue;
                break;
        }
        
        lastResult = result; 
        
        secondaryDisplay.textContent = `${Number(previousValue.toFixed(PRECISION))} ${currentOperator} ${Number(currentValue.toFixed(PRECISION))} =`;
        mainDisplay.textContent = Number(result.toFixed(PRECISION))
        
        previousValue = result;
        currentOperator = null;
        newNumberStarted = true;
        clearStatus = 1; 
        clearButton.textContent = 'CE';
        resultReady = true; // NIEUW: Stel in dat het resultaat klaar is
    }
function invert(){
    v = parseFloat(mainDisplay.textContent);
    mainDisplay.textContent = -Number(v.toFixed(PRECISION));
}

function handleClear() {
        if (clearStatus === 1) {
            mainDisplay.textContent = '0';
            clearStatus = 0; 
            clearButton.textContent = 'C';
            newNumberStarted = true; 
        } else {
            clearAll();
        }
    }
    
function clearAll(isError = false) {
        if (!isError) {
             mainDisplay.textContent = '0';
        }
        previousValue = 0;
        currentOperator = null;
        newNumberStarted = true;
        secondaryDisplay.textContent = '';
        lastResult = 0; 
        resultReady = false; 
        
        clearStatus = 0;
        clearButton.textContent = 'C';
    }

function handleUseDro(){
    handleClear();

    switch (activeAxes){
        case 'axes0' : idToQuery = 'readOut0_Main'; break;
        case 'axes1' : idToQuery = 'readOut1_Main'; break;
        case 'axes2' : idToQuery = 'readOut2_Main'; break;
    }

    const element = document.getElementById(idToQuery)
    mainDisplay.textContent = element.textContent.trim()
  
}

//DRO logic

let activeAxes = 'axes0'
let isTrgtMode = {'axes0' : false, 'axes1':false,  'axes2': false}
let trgtValue =  {'axes0' : 0.0, 'axes1':0.0,  'axes2': 0.0}

function startLongPress(action) {
    clearTimeout(pressTimer);
    
    const element = document.querySelector(`[data-shortlong="${action}"]`); 

    pressTimer = setTimeout(function() {
        switch (action){
            case 'axes0' :
            case 'axes1' : 
            case 'axes2' : 
                activateAxes(action); break;
            case 'trgt' : setTrgt(activeAxes); break;
            case 'msmt' : setMsmt(activeAxes); break;
            }
        pressTimer = null; 
    }, LONG_PRESS_TIME);
    
    event.preventDefault(); 
    
    timePress = Date.now();
}

function clearLongPress(action){
    if (pressTimer == null)  return;
		
		clearTimeout(pressTimer);
		
		const timeSpend = Date.now() - timePress;
		
		if (timeSpend < LONG_PRESS_TIME) {
            switch (action){
				case 'trgt' : setTrgtMode(activeAxes); break;
                case 'msmt' : setMsmtMode(activeAxes); break;
				}
        }
        pressTimer = null;       
}

function activateAxes(action){
    const axes = document.querySelectorAll('.dro__disp');
    axes.forEach(ax=>{
        ax.classList.remove('is-selected')
    })

    const element = document.querySelector(`[data-shortlong="${action}"]`); 
    element.classList.add('is-selected');
    activeAxes = action;
}

function setTrgtMode(axes){

    if (isTrgtMode[axes]) return;
    isTrgtMode[axes] = true
    switch (axes){
        case 'axes0' : idToQuery = 'readOut0_Sec'; id2ToQuery = 'readOut0_Main';  break;
        case 'axes1' : idToQuery = 'readOut1_Sec'; id2ToQuery = 'readOut1_Main'; break;
        case 'axes2' : idToQuery = 'readOut2_Sec'; id2ToQuery = 'readOut2_Main'; break;
    }
    const sec = document.getElementById(idToQuery)
    const main = document.getElementById(id2ToQuery)
    
    main.textContent = (trgtValue[axes].toFixed(PRECISION) - parseFloat(main.textContent.trim())).toFixed(PRECISION)   
    sec.textContent = trgtValue[axes].toFixed(PRECISION)   
}

function setTrgt(axes){
    trgtValue[axes] = parseFloat(mainDisplay.textContent.trim())
    setTrgtMode(axes)
    handleClear()
}

function setMsmtMode(axes){
    if (!isTrgtMode[axes]) return;

    isTrgtMode[axes] = false
    switch (axes){
        case 'axes0' : idToQuery = 'readOut0_Sec'; id2ToQuery = 'readOut0_Main'; break;
        case 'axes1' : idToQuery = 'readOut1_Sec'; id2ToQuery = 'readOut1_Main'; break;
        case 'axes2' : idToQuery = 'readOut2_Sec'; id2ToQuery = 'readOut2_Main'; break;
    }
    const sec = document.getElementById(idToQuery)
    const main = document.getElementById(id2ToQuery) 

    main.textContent = (trgtValue[axes].toFixed(PRECISION)  - parseFloat(main.textContent.trim())).toFixed(PRECISION)  
    sec.textContent = "measurement" 
}

//websocket

const host = window.location.host;
protocol = 'ws:';
path = '/ws';
const wsUrl = protocol + '/' + host + path;
const socket = new WebSocket(wsUrl);

socket.onopen = function(e) {{
              console.log("[open] Verbinding met Pico W geopend.");

            }};

socket.onmessage = function(event) {{
    const eventData = JSON.parse(event.data)
    
    updates = eventData.changed_positions

    if (updates !== undefined){
        Object.keys(updates).forEach (key => {
            switch (key){
                case 'ax0' : axes = "axes0"; idToQuery = 'readOut0_Main'; divider = droDividers[0]; break;
                case 'ax1' : axes = "axes1"; idToQuery = 'readOut1_Main'; divider = droDividers[1]; break;
                case 'ax2' : axes = "axes2"; idToQuery = 'readOut2_Main'; divider = droDividers[2]; break;
                }
            
            
            int_data = parseInt(updates[key], 10)
            float_val = int_data / divider 

            if (isTrgtMode[axes]){
                float_val =  trgtValue[axes] - float_val ;
            }

            const element = document.getElementById(idToQuery);

//TODO make precison part of settings per ax
            element.textContent = float_val.toFixed(PRECISION)
        }
        )
    }
}};


function setMsmt(axes){

    setMsmtMode(axes)

    const jsonToSend = { 
        "set_axes" : axes,
        "value" : mainDisplay.textContent
    }

    const strToSend = JSON.stringify(jsonToSend )

    socket.send(strToSend)
    handleClear()
}
