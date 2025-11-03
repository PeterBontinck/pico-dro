//TODO total rewrite of this spaghetti


let pressTimer = null;
const LONG_PRESS_TIME = 600; 
let timePress = 0;

let droDividers = [1,1,1];
let PRECISION = 3;

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
    
    const readOuts = document.querySelectorAll('.js-dro-axis');
    readOuts.forEach(readOut =>{
        const axis_id = readOut.dataset.id
        const axisIndex = parseInt(axis_id.slice(-1),10);
        if (axisIndex < droSettings.noAxes){
            const label = droSettings.axesSettings[axisIndex].name;
            const precision = parseInt(droSettings.axesSettings[axisIndex].displayPrecision, 10);
            const noDigits = parseInt(droSettings.noDisplayDigits, 10);
            const divider = parseInt(droSettings.axesSettings[axisIndex].divider, 10);
            axesList[axisIndex] = new DroAxis(axis_id, label, readOut, divider, precision,noDigits);
        }
        else readOut.classList.add('is-disabled')
    })

    
    activateAxis(0);

});


//calculator logic

const mainDisplay = document.getElementById('mainDisplay');
const secondaryDisplay = document.getElementById('secondaryDisplay');
const clearButton = document.getElementById('clearButton');

let previousValue = 0;
let currentOperator = null;
let newNumberStarted = true;
let clearStatus = 0; 
let lastResult = 0; 
let resultReady = false; 


function updateSecondaryDisplay() {
        if (currentOperator === null) {
            secondaryDisplay.textContent = '';
        } else {
            secondaryDisplay.textContent = `${Number(previousValue.toFixed(PRECISION))} ${currentOperator}`;
        }
    }

function handleDigit(digit) {
        
      
        if (resultReady) {
            mainDisplay.textContent = '0'; 
            resultReady = false;
            newNumberStarted = true; 
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
        resultReady = true; 
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
    mainDisplay.textContent = activeAxis.getValue();
  
}

//DRO logic

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
    handleClear()
}

function activeAxis_setMsmt(){
    const value = parseFloat(mainDisplay.textContent.trim())
    activeAxis.setMsmt(value , socket) 
    handleClear()
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
                case 'ax0' : axisIndex = 0 ;  break;
                case 'ax1' : axisIndex = 1 ; break;
                case 'ax2' : axisIndex = 2 ; break;
                }

            int_data = parseInt(updates[key], 10);

            axesList[axisIndex].setValue(int_data);
        }) 
    }
}};

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
        axesList.forEach(axis=>{if (axis instanceof DroAxis) axis.putUnit(25.4);});
    }


    else{
        elementMm.classList.add('option-is-selected');
        elementInch.classList.remove('option-is-selected');
        axesList.forEach(axis=>{if (axis instanceof DroAxis) axis.putUnit(1);});
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

function isNotRealNumber(value){
    return !(typeof value === 'number' && !Number.isNaN(value));
}

class DroAxis{
    /**
     * 
     * @param {string} id as used in the WS api
     * @param {string} label for the axis (one Letter)
     * @param {HTMLElement} domContainer 
     * @param {number} divider the counts per mm of the encoder
     * @param {number} precision the number of digits after the decimal
     * @param {number} noDigits the max number of digits of the display excluding sign and decimal point.
     */
    constructor(id, label, domContainer, divider, precision, noDigits){
        this.domContainer = domContainer
        this.nameField =domContainer.querySelector('.js-name');
        this.mainField = domContainer.querySelector('.js-main');
        this.secField = domContainer.querySelector('.js-sec');

        this.id = id

        this.value = 0.0;
        this.target = 0.0;
        this.dividerBase = divider;

        this.mmInUnit = 1;
        this.diameterFactor = 1; /*set tot 2 for diameter mode*/
        this.dividerActual = divider;

        this.modeIsTrgt = false;

        this.precision = precision;
        this.noDigits = noDigits;
        this.limitValue = (10**(noDigits - precision )) * divider

        this.nameField.textContent = label
    }

    /**
     * 
     * @param {any} value  to check on type and absolute value
     * @returns true :  if illegal
     */
    #illegalValue(value){
        if (isNotRealNumber(value)){
            console.error("DRO value is not a number : ${value}");
            return true;
        }
        if (Math.abs(value) >= this.limitValue){
            console.error("DRO absolute value is to big : ${value}");
            return true;
        } 
        
        return false;
    }

    setValue(value){
        if (this.#illegalValue(value)) return;

        this.value = value;

        let float_val = this.value / this.dividerActual;
        if (this.modeIsTrgt){
            float_val = this.target - float_val;
        }

        this.mainField.textContent=  float_val.toFixed(this.precision);
    }


    setMode(mode){/* 'trgt' or 'msmt'*/
        switch (mode){
            case 'trgt' :
                this.modeIsTrgt = true;
                this.secField.textContent = this.target.toFixed(this.precision);
                break;
            case 'msmt' :
                this.modeIsTrgt = false;
                this.secField.textContent = 'measurement';
                break;
            default     :
                console.error('DRO illegal mode: ${mode}');
        }
        this.setValue(this.value);
    }

    setMsmt(value, socket){
        if (this.#illegalValue(value)) return;

        this.setMode('msmt');

        const jsonToSend = { 
            "set_axis" : this.id,
            "value" : value * this.dividerActual
        }
        const strToSend = JSON.stringify(jsonToSend )
        socket.send(strToSend)
    }

    setTrgt(value){
        if (this.#illegalValue(value)) return;
        
        this.target = value;
        this.setMode('trgt');
    }

    activate(){
        this.domContainer.classList.add('is-selected')
    }

    deactivate(){
        this.domContainer.classList.remove('is-selected')
    }

    getValue(){
        return Number(this.mainField.textContent.trim()) ;
    }

    putUnit(mmInUnit){
         if (!(typeof mmInUnit === 'number' && !Number.isNaN(mmInUnit)))
            console.error('mmInUnit illegal value : ${mmInUnit}');
        
        this.mmInUnit = mmInUnit;

        this.dividerActual = this.dividerBase * this.mmInUnit /  this.diameterFactor;
        this.limitValue = (10**(this.noDigits - this.precision )) * this.dividerActual

    }

    putDiameterMode(x){
        if (x) this.diameterFactor=2;
        else this.diameterFactor = 1;
        this.dividerActual = this.dividerBase * this.mmInUnit /  this.diameterFactor;
        this.limitValue = (10**(this.noDigits - this.precision )) * this.dividerActual    
    }

}