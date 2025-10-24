from rp2 import PIO, StateMachine, asm_pio
import array
import machine

DEBUG_MODE = False

#the RP2040 & RP2350 SMx_INSTR addresses for  fast sm.exec() 
#see datasheet rp2040 rp2350 >PIO>List of registers & ...>System bus>AHB registers
_INSTR = [
    0x502000d8, #SM_ID = 0,  PIO/SM = 0/0
    0x502000f0, #SM_ID = 1,  PIO/SM = 0/1 
    0x50200108, #SM_ID = 2,  PIO/SM = 0/2 
    0x50200120, #SM_ID = 3,  PIO/SM = 0/3 
    0x503000d8, #SM_ID = 4,  PIO/SM = 1/0 
    0x503000f0, #SM_ID = 5,  PIO/SM = 1/1 
    0x50300108, #SM_ID = 6,  PIO/SM = 1/2 
    0x50300120, #SM_ID = 7,  PIO/SM = 1/3 
    0x504000d8, #SM_ID = 8,  PIO/SM = 2/0  RP2350 only
    0x504000f0, #SM_ID = 9,  PIO/SM = 2/1  RP2350 only
    0x50400108, #SM_ID = 10, PIO/SM = 2/2  RP2350 only
    0x50400120, #SM_ID = 11, PIO/SM = 2/3  RP2350 only
]

class PioHalfEncoderCounter:
    
    @asm_pio(in_shiftdir=PIO.SHIFT_LEFT, push_thresh=32, out_shiftdir=PIO.SHIFT_RIGHT)
    def _encoder_counter():
        
        """
            0°    180°   0°  
        A   _/¨¨¨¨¨\_____/¨¨  ---> in_pin[0]
        B   ____/¨¨¨¨¨\_____  ---> jmp_pin
               90°   270°  
        CCW <--        -->CW
        
        We count on 0° and 180°,
        CW -> Yreg is decremented and CCW -> Xreg is decremented
        the Y- and X-reg Underflow and Wrap-around to 0xFFFFFFFF, when 0 is decremented
            
        you can also use this code to count on 90° and 270°,
        by switching A -> jmp_pin and B -> in_pin[0]
        and switching  the registers, so Y_reg counts on CW  and X_Reg count on CCW
        
        """

        wrap_target()    
        
        label("next_pulse")
        wait(1, pin, 0) #1 wait for A to raise @ 0° if CW or 180° if CCW
        jmp(pin, "ccw_pulse_A") #2 if B high after raise A -> ccw
        
        # === CW PULSE (Decrement Y, with Underflow Wrap-around) ===
        jmp(y_dec, "wait_fall") #3
        jmp("wait_fall") #4

        # === CW PULSE (Decrement Y, with Underflow Wrap-around) ===
        label("ccw_pulse_A") 
        jmp(x_dec, "wait_fall") #5

        
        label("wait_fall") 
        wait(0, pin, 0) #6 wait for A to fall @ 180° if CW or 0° if CCW
        jmp(pin, "cw_pulse_!A") #7     if B high after fall A-> cw
        
        # === CCW PULSE (Decrement X, with Underflow Wrap-around) ===
        jmp(x_dec, "next_pulse") #8
        jmp("next_pulse") #9
        
        # === CW PULSE (Decrement Y, with Underflow Wrap-around) ===
        label("cw_pulse_!A") 
        jmp(y_dec, "next_pulse") #10
      
        wrap()
    
    def __init__(self, signal_A, signal_B, sm_id, is_B_phase = False, debug_id = None): 
       
        self.sm = StateMachine(sm_id, self._encoder_counter, in_base=signal_A, jmp_pin=signal_B)
        
        self.sm_id = sm_id
        self.is_B_phase = is_B_phase
        if debug_id:
            self.debug_id = (debug_id + "_B") if self.is_B_phase else (debug_id + "_A")
        else: self.debug_id = ''
        # Init X & Y to (0xFFFFFFFF)
        #self.sm.exec("mov(x, invert(null))")
        #self.sm.exec("mov(y, invert(null))")
        self.sm.active(1)
        
        self.last_count_cw= None  # Gebruik None om de eerste run te detecteren
        self.last_count_ccw = None
        
        self.uint32_buffer = array.array('I', [0,0])
        
        if DEBUG_MODE:
            print(f" Pio HalfEncoder counter {self.debug_id} is running in SM_id : {sm_id}")
            
    def _fast_exec_push(self):
        global _INSTR 
        #see datasheet rp204 rp2350 >PIO>Instruction Set>PUSH                            
        machine.mem32[_INSTR[self.sm_id]] = 0b100_00000_0_0_1_00000 # push (iffull==0) block

    def _fast_exec_mov_isr_x(self):
        global _INSTR
        #see datasheet rp204 rp2350 >PIO>Instruction Set>MOV                            
        machine.mem32[_INSTR[self.sm_id]] = 0b101_00000_110_00_001 # mov isr x

    def _fast_exec_mov_isr_y(self):
        #see datasheet rp204 rp2350 >PIO>Instruction Set>MOV
        global _INSTR                             
        machine.mem32[_INSTR[self.sm_id]] = 0b101_00000_110_00_010 # mov isr y
        
    def poll_half_encoder(self ):
        """ querys the x and y registers from the PIO statemachine
        detects underflows and calulates the net difference in since the last poll
        CW > 0 , CCW < 0
        """
      
        self._fast_exec_mov_isr_x()
        self._fast_exec_push()     #push X on the FIFO
        
        self._fast_exec_mov_isr_y()
        self._fast_exec_push()      #Push Y on the FIFO
                
        self.sm.get(self.uint32_buffer)
           
        if not self.is_B_phase : #-> A-phase       
            current_ccw = self.uint32_buffer[0]    #pop X from the FIFO
            current_cw = self.uint32_buffer[1]     #pop Y from the FIFO         
        else : #B-phase
        #the signals are inversed compared to the A phase, so Y reg = CW , X reg = CCW
            current_cw = self.uint32_buffer[0]    #pop X from the FIFO
            current_ccw = self.uint32_buffer[1]     #pop Y from the FIFO         
        
        if self.last_count_cw is None:
            self.last_count_cw = current_cw
            self.last_count_ccw = current_ccw
              
        pulses_cw = self._countToPulses(self.last_count_cw, current_cw)
        pulses_ccw = self._countToPulses(self.last_count_ccw, current_ccw)
        
        net_difference = pulses_cw - pulses_ccw
        
        self.last_count_cw = current_cw
        self.last_count_ccw = current_ccw
        
        if DEBUG_MODE:
            print(f"encoderID={self.debug_id} | current_cw ={current_cw :<10} | current_ccw ={current_ccw :<10} | cw={pulses_cw :<10} | cww={pulses_ccw :<10} | Δ={net_difference:<3}")
        
        return net_difference 
                
    def _countToPulses(self, last, current):
        if  current > last: #detect underflow
            return last + (0xFFFFFFFF - current)
        else:
            return  last - current

class QuadratureEncoder:
              
    def __init__(self, pin_A, pin_B, mutable_free_sm_id, full_precision = True, debug_id = None):
        
        self.full_precision = full_precision
        self.debug_id = debug_id
                
        # 2. State Machine Setup
        #Setup A_phase counter count on 0° and 180°
        
        self.sm_counter_A = PioHalfEncoderCounter(
            signal_A=pin_A,
            signal_B=pin_B,
            sm_id = mutable_free_sm_id[0],
            debug_id = self.debug_id)
        
        mutable_free_sm_id[0]+=1
        
        
        if full_precision:
            ##Setup B_phase counter (count on 90° & 270°)
            ## we can re-use the same code if we invert some things  (A_signal -> B_pin, B_signal -> A_pin and  CW->CCW ,  CCW->CW) 
            self.sm_counter_B = PioHalfEncoderCounter(
                signal_A=pin_B,
                signal_B=pin_A,
                sm_id = mutable_free_sm_id[0],
                is_B_phase = True,
                debug_id = self.debug_id)
            
            mutable_free_sm_id[0]+=1       
        else:
            self.sm_Encoder_B = None     

    def poll_encoder(self):     
        net_difference = self.sm_counter_A.poll_half_encoder()
        if self.full_precision:
            net_difference += self.sm_counter_B.poll_half_encoder() 
        return net_difference
