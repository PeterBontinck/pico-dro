//const
const LONG_PRESS_TIME = 600; 

//state
window.calc = new Calculator();

let pressTimer = null;
let timePress = 0;

let droSettings = null;

/** @type {DroAxis[]} */
let axesList =[null, null, null];

/** @type {DroAxis} */
let activeAxis = axesList[0];

let isFullscreen = false;

let imperial = false;
let diameterMode = false;

//onload 
async function fetchSettings(){
    const url = '/api/settings';
 
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) return data;
    else return none;
}

document.addEventListener('DOMContentLoaded', async (event) => {
    
    droSettings = await fetchSettings();

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
    
    const readOuts = document.querySelectorAll('.js-dro-axis');
    readOuts.forEach(readOut =>{
        const axis_id = readOut.dataset.id
        const axisIndex = parseInt(axis_id.slice(-1),10);
        if (axisIndex < droSettings.noAxes){
            const noDigits = parseInt(droSettings.noDisplayDigits, 10);
            let axisSettings ={};
                
            axisSettings.name = droSettings.axesSettings[axisIndex].name;
            axisSettings.divider = parseInt(droSettings.axesSettings[axisIndex].divider, 10);
            axisSettings.precisionMm = parseInt(droSettings.axesSettings[axisIndex].displayPrecisionMm, 10)
            axisSettings.precisionInch =parseInt(droSettings.axesSettings[axisIndex].displayPrecisionInch, 10)

            axesList[axisIndex] = new DroAxis(axis_id, readOut, axisSettings,noDigits);
        }
        else readOut.classList.add('is-disabled');

    if (!droSettings.isLathe){
        const modeMenu = document.querySelector('[data-action="mode"]');
        modeMenu.classList.add('is-disabled');    
    }


        useBananas(false); /*by default use mm*/
        useDiameter(false);

    /*TODO set default options from settings?*/
    })
    
    activateAxis(0);
});



//long and short press handling of [data-shortlong] buttons

function startLongPress(action) {
    clearTimeout(pressTimer);
    
    const element = document.querySelector(`[data-shortlong="${action}"]`); 

    pressTimer = setTimeout(function() {
        switch (action){
            case 'axis0' : activateAxis(0); break;
            case 'axis1' : activateAxis(1); break;
            case 'axis2' : activateAxis(2); break; 
            case 'trgt' : activeAxis_setTrgt(); break;
            case 'msmt' : activeAxis_setMsmt(); break;
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
				case 'trgt' : activeAxis.setMode('trgt'); break;
                case 'msmt' : activeAxis.setMode('msmt'); break;
				}
        }
        pressTimer = null;       
}


//menu and settings handling
document.querySelector('.js-menu').addEventListener('click', function(event) {
    const clickedElement = event.target;
    const action = clickedElement.getAttribute('data-action');

    if (action) {
        document.getElementById('menu-toggle').checked = false;
        switch(action){
            case 'fullscreen' : toggleFullscreen(); break;
            case 'mm' : useBananas(false); break;
            case 'inch' : useBananas(true); break;
            case 'diam' : useDiameter(true); break;
            case 'radius' : useDiameter(false); break;
           }

    }
});

function toggleFullscreen(){
    isFullscreen = !isFullscreen;
    const element = document.getElementById("option-fullscreen");
    if (isFullscreen) {
        document.documentElement.requestFullscreen()
            .then(()=>{
                element.classList.add('option-is-selected');
            })
    }

    else {
        document.exitFullscreen()
            .then(()=>{
                    element.classList.remove('option-is-selected');
                })
    }
}

function useBananas(x){
    const elementMm = document.getElementById("option-mm");
    const elementInch = document.getElementById("option-inch");

 

    if (x){
        elementInch.classList.add('option-is-selected');
        elementMm.classList.remove('option-is-selected');
        axesList.forEach(axis=>{
           if (axis instanceof DroAxis) axis.putUnit(25.4 );});
    }


    else{
        elementMm.classList.add('option-is-selected');
        elementInch.classList.remove('option-is-selected');
        axesList.forEach(axis=>{
            if (axis instanceof DroAxis) axis.putUnit(1);});
    }
}


function useDiameter(x){
    const elementD = document.getElementById("option-diam");
    const elementR = document.getElementById("option-radius");

    if (x){
        elementD.classList.add('option-is-selected');
        elementR.classList.remove('option-is-selected');
        axesList[0].putDiameterMode(true)
    }

    else{
        elementR.classList.add('option-is-selected');
        elementD.classList.remove('option-is-selected');
        axesList[0].putDiameterMode(false)
    }
}



//update and set functions for active axis

function activateAxis(axisIndex){

    axesList.forEach(axis=>{
        if (axis instanceof DroAxis)axis.deactivate();
    })

    axesList[axisIndex].activate();
    activeAxis = axesList[axisIndex]
}

function activeAxis_setTrgt(){
    const value = parseFloat(mainDisplay.textContent.trim())
    activeAxis.setTrgt(value) 
    window.calc.handleClear()
}

function activeAxis_setMsmt(){
    const value = parseFloat(mainDisplay.textContent.trim())
    activeAxis.setMsmt(value , socket) 
     window.calc.handleClear()
}

function handleUseDro(){
    window.calc.setValue(activeAxis.getValue());
}


//websocket handling

const host = window.location.host;
let protocol = 'ws:';
let path = '/ws';
const wsUrl = protocol + '/' + host + path;
const socket = new WebSocket(wsUrl);

socket.onopen = function(e) {{
              console.log("[open] connection to Pico W opened.");

            }};

socket.onmessage = function(event) {{
    const eventData = JSON.parse(event.data)
    
    updates = eventData.changed_positions

    if (updates !== undefined){
        Object.keys(updates).forEach (key => {
            switch (key){
                case 'ax0' : axisIndex = 0 ;  break;
                case 'ax1' : axisIndex = 1 ; break;
                case 'ax2' : axisIndex = 2 ; break;
                }

            int_data = parseInt(updates[key], 10);

            axesList[axisIndex].setValue(int_data);
        }) 
    }
}};

