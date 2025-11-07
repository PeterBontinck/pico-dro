
class DroAxis{
    /**
     * 
     * @param {string} id as used in the WS api
    * @param {HTMLElement} domContainer 
     * @param {Object} axisSettings the settings JSON 
     * @param {number} noDigits the max number of digits of the display excluding sign and decimal point.
     */
    constructor(id, domContainer, axisSettings, noDigits){
        this.domContainer = domContainer
        this.nameField =domContainer.querySelector('.js-name');
        this.mainField = domContainer.querySelector('.js-main');
        this.secField = domContainer.querySelector('.js-sec');

        this.id = id
        this.axisSettings = axisSettings

        this.value = 0.0;
        this.target = 0.0;
        this.dividerBase = this.axisSettings.divider;

        this.mmInUnit = 1;
        this.diameterFactor = 1; /*set tot 2 for diameter mode*/
        this.dividerActual = this.dividerBase;

        this.modeIsTrgt = false;

        this.precision =this.axisSettings.precisionMm;
        this.noDigits = noDigits;
        this.limitValue = (10**(noDigits - this.precision )) * this.dividerActual

        this.nameField.textContent = this.axisSettings.name
        this.post_fix = 'mm'
        this.pre_fix = ''
    }

    /**
     * 
     * @param {any} value  to check on type and absolute value
     * @returns true :  if illegal
     */
    #illegalValue(value){
        if (!(typeof value === 'number' && !Number.isNaN(value))){
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
                this.secField.textContent = this.pre_fix + this.target.toFixed(this.precision) + this.post_fix;
                break;
            case 'msmt' :
                this.modeIsTrgt = false;
                this.secField.textContent = this.pre_fix + '[' + this.post_fix + ']';
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
        if (mmInUnit > 1 ) {
            this.precision = this.axisSettings.precisionInch;
            this.post_fix = '\"';

        }
        else {
            this.precision = this.axisSettings.precisionMm;
             this.post_fix = 'mm';
        }

        this.dividerActual = this.dividerBase * this.mmInUnit /  this.diameterFactor;
        this.limitValue = (10**(this.noDigits - this.precision )) * this.dividerActual;
        this.target = 0;
        if (this.modeIsTrgt) this.setMode('trgt');
        else this.setMode('msmt');

    }

    putDiameterMode(x){
        if (x) {
            this.diameterFactor=2;
            this.pre_fix = '\u2300 '
        }
        else {
            this.diameterFactor = 1; 
            this.pre_fix = ''
        };
        this.dividerActual = this.dividerBase * this.mmInUnit /  this.diameterFactor;
        this.limitValue = (10**(this.noDigits - this.precision )) * this.dividerActual;    
        this.target = 0;
        if (this.modeIsTrgt) this.setMode('trgt');
        else this.setMode('msmt');
    }

}