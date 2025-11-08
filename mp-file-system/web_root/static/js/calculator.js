/* Copyright (c) 2025 Peter Bontinck
 * SPDX-License-Identifier: MIT
 * See LICENSE
 */


//TODO add shift function sqrt, power2, sin, cos, tan, aint, acos atan 


class Calculator {
    constructor(precision = 4){
        this.PRECISION_CALC = precision;

        // state
        this.previousValue = 0;
        this.currentOperator = null;
        this.newNumberStarted = true;
        this.clearStatus = 0;
        this.lastResult = 0;
        this.resultReady = false;
        this.memoryValues= [0,0]; //M1, M2

        // DOM refs
        this.mainDisplay = null;
        this.secondaryDisplay = null;
        this.clearButton = null;
        this.memoryButtons = [];

        // initialize when DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._initDom());
        } else {
            this._initDom();
        }
    }

    _initDom(){
        this.mainDisplay = document.getElementById('mainDisplay');
        this.secondaryDisplay = document.getElementById('secondaryDisplay');
        this.clearButton = document.getElementById('clearButton');
        this.memoryButtons = document.querySelectorAll('[data-m]');
    }

    _fmt(v){
        return Number(v.toFixed(this.PRECISION_CALC));
    }

    updateSecondaryDisplay(){
        if (!this.secondaryDisplay) return;
        if (this.currentOperator === null) {
            this.secondaryDisplay.textContent = '';
        } else {
            this.secondaryDisplay.textContent = `${this._fmt(this.previousValue)} ${this.currentOperator}`;
        }
    }

    // Accept either an event (from an event listener) or a literal digit string
    handleDigit(input){
        const digit = (typeof input === 'string') ? input : (input?.target?.getAttribute('data-digit') || input?.target?.textContent || '');

        if (!this.mainDisplay) this._initDom();

        if (this.resultReady) {
            this.mainDisplay.textContent = '0';
            this.resultReady = false;
            this.newNumberStarted = true;
        }

        if (this.newNumberStarted) {
            if (digit === '.') {
                this.mainDisplay.textContent = '0.';
            } else {
                this.mainDisplay.textContent = digit;
            }
            this.newNumberStarted = false;
        } else {
            if (digit === '.' && this.mainDisplay.textContent.includes('.')) {
                return;
            }
            this.mainDisplay.textContent += digit;
        }

        this.clearStatus = 1;
        if (this.clearButton) this.clearButton.textContent = 'CE';
    }

    handleOperator(nextOperator){
        if (!this.mainDisplay) this._initDom();

        if (this.currentOperator !== null && !this.newNumberStarted) {
            this.calculate();
        }

        this.previousValue = parseFloat(this.mainDisplay.textContent);
        this.currentOperator = nextOperator;

        this.updateSecondaryDisplay();
        this.newNumberStarted = true;
        this.mainDisplay.textContent = '0';
        this.resultReady = false;

        this.clearStatus = 1;
        if (this.clearButton) this.clearButton.textContent = 'CE';
    }

    calculate(){
        if (!this.mainDisplay) this._initDom();

        if (this.currentOperator === null) {
            const v = parseFloat(this.mainDisplay.textContent);
            if (this.secondaryDisplay) this.secondaryDisplay.textContent = `${this._fmt(v)} =`;
            this.lastResult = parseFloat(this.mainDisplay.textContent);
            this.resultReady = true;
            return;
        }

        const currentValue = parseFloat(this.mainDisplay.textContent);
        let result = 0;

        switch (this.currentOperator) {
            case '+': result = this.previousValue + currentValue; break;
            case '-': result = this.previousValue - currentValue; break;
            case '*': result = this.previousValue * currentValue; break;
            case '/':
                if (currentValue === 0) {
                    this.mainDisplay.textContent = 'Fout: Deling door 0';
                    this.clearAll(true);
                    return;
                }
                result = this.previousValue / currentValue;
                break;
        }

        this.lastResult = result;

        if (this.secondaryDisplay) this.secondaryDisplay.textContent = `${this._fmt(this.previousValue)} ${this.currentOperator} ${this._fmt(currentValue)} =`;
        this.mainDisplay.textContent = this._fmt(result);

        this.previousValue = result;
        this.currentOperator = null;
        this.newNumberStarted = true;
        this.clearStatus = 1;
        if (this.clearButton) this.clearButton.textContent = 'CE';
        this.resultReady = true;
    }

    invert(){
        if (!this.mainDisplay) this._initDom();
        const v = parseFloat(this.mainDisplay.textContent);
        this.mainDisplay.textContent = -this._fmt(v);
    }

    handleClear(){
        if (!this.mainDisplay) this._initDom();
        if (this.clearStatus === 1) {
            this.mainDisplay.textContent = '0';
            this.clearStatus = 0;
            if (this.clearButton) this.clearButton.textContent = 'C';
            this.newNumberStarted = true;
        } else {
            this.clearAll();
        }
    }

    clearAll(isError = false){
        if (!this.mainDisplay) this._initDom();
        if (!isError) {
            this.mainDisplay.textContent = '0';
        }
        this.previousValue = 0;
        this.currentOperator = null;
        this.newNumberStarted = true;
        if (this.secondaryDisplay) this.secondaryDisplay.textContent = '';
        this.lastResult = 0;
        this.resultReady = false;

        this.clearStatus = 0;
        if (this.clearButton) this.clearButton.textContent = 'C';
    }

    // Set the main display from external value
    setValue(value){
        if (!this.mainDisplay) this._initDom();
        try{
            if (typeof value === 'number') this.mainDisplay.textContent = value;
            else throw new Error('Invalid value type');
        } catch(e){
            console.warn('handleUseDro failed', e);
        }
    }

    handleMemory(m){
        if (!this.mainDisplay) this._initDom();
        let currentValue = parseFloat(this.mainDisplay.textContent);
       
        try{ 
            if (isNaN(currentValue)) throw new Error('Invalid number in main display');
            if (m < 0 || m >= this.memoryValues.length) throw new Error('Invalid memory slot');
            if (currentValue !== 0) {
                this.memoryValues[m] = currentValue;
                this.memoryButtons[m].innerHTML = `M${m+1} <br> ${this._fmt(this.memoryValues[m])}`;
                this.memoryButtons[m].classList.add('memory-has-value');
                this.clearAll();
            }
            else this.mainDisplay.textContent = this.memoryValues[m];
        } catch(e){
            console.warn('handleMemory failed', e);
        }
    }
}