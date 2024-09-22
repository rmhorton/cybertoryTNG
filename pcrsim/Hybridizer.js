function Hybridizer(){

    /*

    References:
    SantaLucia 1998: https://www.pnas.org/doi/full/10.1073/pnas.95.4.1460

    */
    const R = 1.987;	// cal/K*mol
    const T0 = 273.15;	// zero Celsius in Kelvin

    const INIT_HS = { // initialization [entropy, entropy]
        'A' : [2300.0, 4.1],
        'T' : [300.0, 4.1],
        'C' : [100.0,  -2.8],
        'G' : [100.0,  -2.8]
    };

    // Nearest neighbor thermodynamic table
    const NN_HS ={ // nearest neighbor enthalpy and entropy
        "--:--": [0.0, 0.0], "--:-A": [0.0, 0.0], "--:-C": [0.0, 0.0], "--:-G": [0.0, 0.0], "--:-T": [0.0, 0.0], "--:A-": [0.0, 0.0], "--:AA": [0.0, 0.0], "--:AC": [0.0, 0.0], 
        "--:AG": [0.0, 0.0], "--:AT": [0.0, 0.0], "--:C-": [0.0, 0.0], "--:CA": [0.0, 0.0], "--:CC": [0.0, 0.0], "--:CG": [0.0, 0.0], "--:CT": [0.0, 0.0], "--:G-": [0.0, 0.0], 
        "--:GA": [0.0, 0.0], "--:GC": [0.0, 0.0], "--:GG": [0.0, 0.0], "--:GT": [0.0, 0.0], "--:T-": [0.0, 0.0], "--:TA": [0.0, 0.0], "--:TC": [0.0, 0.0], "--:TG": [0.0, 0.0], 
        "--:TT": [0.0, 0.0], "-A:--": [0.0, 0.0], "-A:-A": [0.0, 0.0], "-A:-C": [0.0, 0.0], "-A:-G": [0.0, 0.0], "-A:-T": [0.0, 0.0], "-A:A-": [0.0, 0.0], "-A:AA": [2900.0, 10.4], 
        "-A:AC": [0.0, 0.0], "-A:AG": [0.0, 0.0], "-A:AT": [0.0, 0.0], "-A:C-": [0.0, 0.0], "-A:CA": [-1600.0, -3.6], "-A:CC": [0.0, 0.0], "-A:CG": [0.0, 0.0], "-A:CT": [0.0, 0.0], 
        "-A:G-": [0.0, 0.0], "-A:GA": [4400.0, 14.9], "-A:GC": [0.0, 0.0], "-A:GG": [0.0, 0.0], "-A:GT": [0.0, 0.0], "-A:T-": [0.0, 0.0], "-A:TA": [-700.0, -0.8], "-A:TC": [0.0, 0.0], 
        "-A:TG": [0.0, 0.0], "-A:TT": [0.0, 0.0], "-C:--": [0.0, 0.0], "-C:-A": [0.0, 0.0], "-C:-C": [0.0, 0.0], "-C:-G": [0.0, 0.0], "-C:-T": [0.0, 0.0], "-C:A-": [0.0, 0.0], 
        "-C:AA": [0.0, 0.0], "-C:AC": [-4400.0, -13.1], "-C:AG": [0.0, 0.0], "-C:AT": [0.0, 0.0], "-C:C-": [0.0, 0.0], "-C:CA": [0.0, 0.0], "-C:CC": [-3900.0, -11.2], "-C:CG": [0.0, 0.0], 
        "-C:CT": [0.0, 0.0], "-C:G-": [0.0, 0.0], "-C:GA": [0.0, 0.0], "-C:GC": [-200.0, -0.1], "-C:GG": [0.0, 0.0], "-C:GT": [0.0, 0.0], "-C:T-": [0.0, 0.0], "-C:TA": [0.0, 0.0], 
        "-C:TC": [-2100.0, -3.9], "-C:TG": [0.0, 0.0], "-C:TT": [0.0, 0.0], "-G:--": [0.0, 0.0], "-G:-A": [0.0, 0.0], "-G:-C": [0.0, 0.0], "-G:-G": [0.0, 0.0], "-G:-T": [0.0, 0.0], 
        "-G:A-": [0.0, 0.0], "-G:AA": [0.0, 0.0], "-G:AC": [0.0, 0.0], "-G:AG": [-5200.0, -15.0], "-G:AT": [0.0, 0.0], "-G:C-": [0.0, 0.0], "-G:CA": [0.0, 0.0], "-G:CC": [0.0, 0.0], 
        "-G:CG": [-3200.0, -10.4], "-G:CT": [0.0, 0.0], "-G:G-": [0.0, 0.0], "-G:GA": [0.0, 0.0], "-G:GC": [0.0, 0.0], "-G:GG": [-2600.0, -7.4], "-G:GT": [0.0, 0.0], "-G:T-": [0.0, 0.0], 
        "-G:TA": [0.0, 0.0], "-G:TC": [0.0, 0.0], "-G:TG": [-5900.0, -16.5], "-G:TT": [0.0, 0.0], "-T:--": [0.0, 0.0], "-T:-A": [0.0, 0.0], "-T:-C": [0.0, 0.0], "-T:-G": [0.0, 0.0], 
        "-T:-T": [0.0, 0.0], "-T:A-": [0.0, 0.0], "-T:AA": [0.0, 0.0], "-T:AC": [0.0, 0.0], "-T:AG": [0.0, 0.0], "-T:AT": [-3800.0, -12.6], "-T:C-": [0.0, 0.0], "-T:CA": [0.0, 0.0], 
        "-T:CC": [0.0, 0.0], "-T:CG": [0.0, 0.0], "-T:CT": [-4100.0, -13.1], "-T:G-": [0.0, 0.0], "-T:GA": [0.0, 0.0], "-T:GC": [0.0, 0.0], "-T:GG": [0.0, 0.0], "-T:GT": [4700.0, 14.2], 
        "-T:T-": [0.0, 0.0], "-T:TA": [0.0, 0.0], "-T:TC": [0.0, 0.0], "-T:TG": [0.0, 0.0], "-T:TT": [-500.0, -1.1], "A-:--": [0.0, 0.0], "A-:-A": [0.0, 0.0], "A-:-C": [0.0, 0.0], 
        "A-:-G": [0.0, 0.0], "A-:-T": [0.0, 0.0], "A-:A-": [0.0, 0.0], "A-:AA": [-200.0, -0.5], "A-:AC": [-4200.0, -15.0], "A-:AG": [-4100.0, -13.0], "A-:AT": [-2900.0, -7.6], "A-:C-": [0.0, 0.0], 
        "A-:CA": [0.0, 0.0], "A-:CC": [0.0, 0.0], "A-:CG": [0.0, 0.0], "A-:CT": [0.0, 0.0], "A-:G-": [0.0, 0.0], "A-:GA": [0.0, 0.0], "A-:GC": [0.0, 0.0], "A-:GG": [0.0, 0.0], 
        "A-:GT": [0.0, 0.0], "A-:T-": [0.0, 0.0], "A-:TA": [0.0, 0.0], "A-:TC": [0.0, 0.0], "A-:TG": [0.0, 0.0], "A-:TT": [0.0, 0.0], "AA:--": [0.0, 0.0], "AA:-A": [200.0, 2.3], 
        "AA:-C": [0.0, 0.0], "AA:-G": [0.0, 0.0], "AA:-T": [0.0, 0.0], "AA:A-": [-500.0, -1.1], "AA:AA": [-7900.0, -22.2], "AA:AC": [-600.0, -2.3], "AA:AG": [2300.0, 4.6], "AA:AT": [1200.0, 1.7], 
        "AA:C-": [0.0, 0.0], "AA:CA": [3000.0, 7.4], "AA:CC": [0.0, 0.0], "AA:CG": [0.0, 0.0], "AA:CT": [0.0, 0.0], "AA:G-": [0.0, 0.0], "AA:GA": [7600.0, 20.2], "AA:GC": [0.0, 0.0], 
        "AA:GG": [0.0, 0.0], "AA:GT": [0.0, 0.0], "AA:T-": [0.0, 0.0], "AA:TA": [4700.0, 12.9], "AA:TC": [0.0, 0.0], "AA:TG": [0.0, 0.0], "AA:TT": [0.0, 0.0], "AC:--": [0.0, 0.0], 
        "AC:-A": [0.0, 0.0], "AC:-C": [-6300.0, -17.1], "AC:-G": [0.0, 0.0], "AC:-T": [0.0, 0.0], "AC:A-": [4700.0, 14.2], "AC:AA": [700.0, 0.2], "AC:AC": [-8400.0, -22.4], "AC:AG": [0.0, -4.4], 
        "AC:AT": [5300.0, 14.6], "AC:C-": [0.0, 0.0], "AC:CA": [0.0, 0.0], "AC:CC": [500.0, 3.2], "AC:CG": [0.0, 0.0], "AC:CT": [0.0, 0.0], "AC:G-": [0.0, 0.0], "AC:GA": [0.0, 0.0], 
        "AC:GC": [-700.0, -3.8], "AC:GG": [0.0, 0.0], "AC:GT": [0.0, 0.0], "AC:T-": [0.0, 0.0], "AC:TA": [0.0, 0.0], "AC:TC": [-2900.0, -9.8], "AC:TG": [0.0, 0.0], "AC:TT": [0.0, 0.0], 
        "AG:--": [0.0, 0.0], "AG:-A": [0.0, 0.0], "AG:-C": [0.0, 0.0], "AG:-G": [-3700.0, -10.0], "AG:-T": [0.0, 0.0], "AG:A-": [-4100.0, -13.1], "AG:AA": [1000.0, 0.9], "AG:AC": [-3100.0, -9.5], 
        "AG:AG": [-7800.0, -21.0], "AG:AT": [-700.0, -2.3], "AG:C-": [0.0, 0.0], "AG:CA": [0.0, 0.0], "AG:CC": [0.0, 0.0], "AG:CG": [-4000.0, -13.2], "AG:CT": [0.0, 0.0], "AG:G-": [0.0, 0.0], 
        "AG:GA": [0.0, 0.0], "AG:GC": [0.0, 0.0], "AG:GG": [600.0, -0.6], "AG:GT": [0.0, 0.0], "AG:T-": [0.0, 0.0], "AG:TA": [0.0, 0.0], "AG:TC": [0.0, 0.0], "AG:TG": [-900.0, -4.2], 
        "AG:TT": [0.0, 0.0], "AT:--": [0.0, 0.0], "AT:-A": [0.0, 0.0], "AT:-C": [0.0, 0.0], "AT:-G": [0.0, 0.0], "AT:-T": [-2900.0, -7.6], "AT:A-": [-3800.0, -12.6], "AT:AA": [-2700.0, -10.8], 
        "AT:AC": [-2500.0, -8.3], "AT:AG": [-1200.0, -6.2], "AT:AT": [-7200.0, -20.4], "AT:C-": [0.0, 0.0], "AT:CA": [0.0, 0.0], "AT:CC": [0.0, 0.0], "AT:CG": [0.0, 0.0], "AT:CT": [-700.0, -2.3], 
        "AT:G-": [0.0, 0.0], "AT:GA": [0.0, 0.0], "AT:GC": [0.0, 0.0], "AT:GG": [0.0, 0.0], "AT:GT": [5300.0, 14.6], "AT:T-": [0.0, 0.0], "AT:TA": [0.0, 0.0], "AT:TC": [0.0, 0.0], 
        "AT:TG": [0.0, 0.0], "AT:TT": [1200.0, 1.7], "C-:--": [0.0, 0.0], "C-:-A": [0.0, 0.0], "C-:-C": [0.0, 0.0], "C-:-G": [0.0, 0.0], "C-:-T": [0.0, 0.0], "C-:A-": [0.0, 0.0], 
        "C-:AA": [0.0, 0.0], "C-:AC": [0.0, 0.0], "C-:AG": [0.0, 0.0], "C-:AT": [0.0, 0.0], "C-:C-": [0.0, 0.0], "C-:CA": [-4900.0, -13.8], "C-:CC": [-3900.0, -10.9], "C-:CG": [-4000.0, -11.9], 
        "C-:CT": [-3700.0, -10.0], "C-:G-": [0.0, 0.0], "C-:GA": [0.0, 0.0], "C-:GC": [0.0, 0.0], "C-:GG": [0.0, 0.0], "C-:GT": [0.0, 0.0], "C-:T-": [0.0, 0.0], "C-:TA": [0.0, 0.0], 
        "C-:TC": [0.0, 0.0], "C-:TG": [0.0, 0.0], "C-:TT": [0.0, 0.0], "CA:--": [0.0, 0.0], "CA:-A": [600.0, 3.3], "CA:-C": [0.0, 0.0], "CA:-G": [0.0, 0.0], "CA:-T": [0.0, 0.0], 
        "CA:A-": [0.0, 0.0], "CA:AA": [1000.0, 0.7], "CA:AC": [0.0, 0.0], "CA:AG": [0.0, 0.0], "CA:AT": [0.0, 0.0], "CA:C-": [-5900.0, -16.5], "CA:CA": [-8500.0, -22.7], "CA:CC": [-700.0, -2.3], 
        "CA:CG": [1900.0, 3.7], "CA:CT": [-900.0, -4.2], "CA:G-": [0.0, 0.0], "CA:GA": [6100.0, 16.4], "CA:GC": [0.0, 0.0], "CA:GG": [0.0, 0.0], "CA:GT": [0.0, 0.0], "CA:T-": [0.0, 0.0], 
        "CA:TA": [3400.0, 8.0], "CA:TC": [0.0, 0.0], "CA:TG": [0.0, 0.0], "CA:TT": [0.0, 0.0], "CC:--": [0.0, 0.0], "CC:-A": [0.0, 0.0], "CC:-C": [-4400.0, -12.6], "CC:-G": [0.0, 0.0], 
        "CC:-T": [0.0, 0.0], "CC:A-": [0.0, 0.0], "CC:AA": [0.0, 0.0], "CC:AC": [5200.0, 13.5], "CC:AG": [0.0, 0.0], "CC:AT": [0.0, 0.0], "CC:C-": [-2600.0, -7.4], "CC:CA": [-800.0, -4.5], 
        "CC:CC": [-8000.0, -19.9], "CC:CG": [-1500.0, -7.2], "CC:CT": [600.0, -0.6], "CC:G-": [0.0, 0.0], "CC:GA": [0.0, 0.0], "CC:GC": [3600.0, 8.9], "CC:GG": [0.0, 0.0], "CC:GT": [0.0, 0.0], 
        "CC:T-": [0.0, 0.0], "CC:TA": [0.0, 0.0], "CC:TC": [5200.0, 14.2], "CC:TG": [0.0, 0.0], "CC:TT": [0.0, 0.0], "CG:--": [0.0, 0.0], "CG:-A": [0.0, 0.0], "CG:-C": [0.0, 0.0], 
        "CG:-G": [-4000.0, -11.9], "CG:-T": [0.0, 0.0], "CG:A-": [0.0, 0.0], "CG:AA": [0.0, 0.0], "CG:AC": [0.0, 0.0], "CG:AG": [-1500.0, -6.1], "CG:AT": [0.0, 0.0], "CG:C-": [-3200.0, -10.4], 
        "CG:CA": [-4100.0, -11.7], "CG:CC": [-4900.0, -15.3], "CG:CG": [-10600.0, -27.2], "CG:CT": [-4000.0, -13.2], "CG:G-": [0.0, 0.0], "CG:GA": [0.0, 0.0], "CG:GC": [0.0, 0.0], "CG:GG": [-1500.0, -7.2], 
        "CG:GT": [0.0, 0.0], "CG:T-": [0.0, 0.0], "CG:TA": [0.0, 0.0], "CG:TC": [0.0, 0.0], "CG:TG": [1900.0, 3.7], "CG:TT": [0.0, 0.0], "CT:--": [0.0, 0.0], "CT:-A": [0.0, 0.0], 
        "CT:-C": [0.0, 0.0], "CT:-G": [0.0, 0.0], "CT:-T": [-4100.0, -13.0], "CT:A-": [0.0, 0.0], "CT:AA": [0.0, 0.0], "CT:AC": [0.0, 0.0], "CT:AG": [0.0, 0.0], "CT:AT": [-1200.0, -6.2], 
        "CT:C-": [-5200.0, -15.0], "CT:CA": [-5000.0, -15.8], "CT:CC": [-2800.0, -8.0], "CT:CG": [-1500.0, -6.1], "CT:CT": [-7800.0, -21.0], "CT:G-": [0.0, 0.0], "CT:GA": [0.0, 0.0], "CT:GC": [0.0, 0.0], 
        "CT:GG": [0.0, 0.0], "CT:GT": [0.0, -4.4], "CT:T-": [0.0, 0.0], "CT:TA": [0.0, 0.0], "CT:TC": [0.0, 0.0], "CT:TG": [0.0, 0.0], "CT:TT": [0.0, 0.0], "G-:--": [0.0, 0.0], 
        "G-:-A": [0.0, 0.0], "G-:-C": [0.0, 0.0], "G-:-G": [0.0, 0.0], "G-:-T": [0.0, 0.0], "G-:A-": [0.0, 0.0], "G-:AA": [0.0, 0.0], "G-:AC": [0.0, 0.0], "G-:AG": [0.0, 0.0], 
        "G-:AT": [0.0, 0.0], "G-:C-": [0.0, 0.0], "G-:CA": [0.0, 0.0], "G-:CC": [0.0, 0.0], "G-:CG": [0.0, 0.0], "G-:CT": [0.0, 0.0], "G-:G-": [0.0, 0.0], "G-:GA": [-4000.0, -10.9], 
        "G-:GC": [-5100.0, -14.0], "G-:GG": [-4400.0, -12.6], "G-:GT": [-6300.0, -17.1], "G-:T-": [0.0, 0.0], "G-:TA": [0.0, 0.0], "G-:TC": [0.0, 0.0], "G-:TG": [0.0, 0.0], "G-:TT": [0.0, 0.0], 
        "GA:--": [0.0, 0.0], "GA:-A": [-1100.0, -1.6], "GA:-C": [0.0, 0.0], "GA:-G": [0.0, 0.0], "GA:-T": [0.0, 0.0], "GA:A-": [0.0, 0.0], "GA:AA": [-1300.0, -5.3], "GA:AC": [0.0, 0.0], 
        "GA:AG": [0.0, 0.0], "GA:AT": [0.0, 0.0], "GA:C-": [0.0, 0.0], "GA:CA": [1600.0, 3.6], "GA:CC": [0.0, 0.0], "GA:CG": [0.0, 0.0], "GA:CT": [0.0, 0.0], "GA:G-": [-2100.0, -3.9], 
        "GA:GA": [-8200.0, -22.2], "GA:GC": [-600.0, -1.0], "GA:GG": [5200.0, 14.2], "GA:GT": [-2900.0, -9.8], "GA:T-": [0.0, 0.0], "GA:TA": [700.0, 0.7], "GA:TC": [0.0, 0.0], "GA:TG": [0.0, 0.0], 
        "GA:TT": [0.0, 0.0], "GC:--": [0.0, 0.0], "GC:-A": [0.0, 0.0], "GC:-C": [-5100.0, -14.0], "GC:-G": [0.0, 0.0], "GC:-T": [0.0, 0.0], "GC:A-": [0.0, 0.0], "GC:AA": [0.0, 0.0], 
        "GC:AC": [-4400.0, -12.3], "GC:AG": [0.0, 0.0], "GC:AT": [0.0, 0.0], "GC:C-": [0.0, 0.0], "GC:CA": [0.0, 0.0], "GC:CC": [-6000.0, -15.8], "GC:CG": [0.0, 0.0], "GC:CT": [0.0, 0.0], 
        "GC:G-": [-200.0, -0.1], "GC:GA": [2300.0, 5.4], "GC:GC": [-9800.0, -24.4], "GC:GG": [3600.0, 8.9], "GC:GT": [-700.0, -3.8], "GC:T-": [0.0, 0.0], "GC:TA": [0.0, 0.0], "GC:TC": [-600.0, -1.0], 
        "GC:TG": [0.0, 0.0], "GC:TT": [0.0, 0.0], "GG:--": [0.0, 0.0], "GG:-A": [0.0, 0.0], "GG:-C": [0.0, 0.0], "GG:-G": [-3900.0, -10.9], "GG:-T": [0.0, 0.0], "GG:A-": [0.0, 0.0], 
        "GG:AA": [5800.0, 16.3], "GG:AC": [0.0, 0.0], "GG:AG": [-2800.0, -8.0], "GG:AT": [0.0, 0.0], "GG:C-": [0.0, 0.0], "GG:CA": [0.0, 0.0], "GG:CC": [0.0, 0.0], "GG:CG": [-4900.0, -15.3], 
        "GG:CT": [0.0, 0.0], "GG:G-": [-3900.0, -11.2], "GG:GA": [3300.0, 10.4], "GG:GC": [-6000.0, -15.8], "GG:GG": [-8000.0, -19.9], "GG:GT": [500.0, 3.2], "GG:T-": [0.0, 0.0], "GG:TA": [0.0, 0.0], 
        "GG:TC": [0.0, 0.0], "GG:TG": [-700.0, -2.3], "GG:TT": [0.0, 0.0], "GT:--": [0.0, 0.0], "GT:-A": [0.0, 0.0], "GT:-C": [0.0, 0.0], "GT:-G": [0.0, 0.0], "GT:-T": [-4200.0, -15.0], 
        "GT:A-": [0.0, 0.0], "GT:AA": [0.0, 0.0], "GT:AC": [4100.0, 9.5], "GT:AG": [0.0, 0.0], "GT:AT": [-2500.0, -8.3], "GT:C-": [0.0, 0.0], "GT:CA": [0.0, 0.0], "GT:CC": [0.0, 0.0], 
        "GT:CG": [0.0, 0.0], "GT:CT": [-3100.0, -9.5], "GT:G-": [-4400.0, -13.1], "GT:GA": [-2200.0, -8.4], "GT:GC": [-4400.0, -12.3], "GT:GG": [5200.0, 13.5], "GT:GT": [-8400.0, -22.4], "GT:T-": [0.0, 0.0], 
        "GT:TA": [0.0, 0.0], "GT:TC": [0.0, 0.0], "GT:TG": [0.0, 0.0], "GT:TT": [-600.0, -2.3], "T-:--": [0.0, 0.0], "T-:-A": [0.0, 0.0], "T-:-C": [0.0, 0.0], "T-:-G": [0.0, 0.0], 
        "T-:-T": [0.0, 0.0], "T-:A-": [0.0, 0.0], "T-:AA": [0.0, 0.0], "T-:AC": [0.0, 0.0], "T-:AG": [0.0, 0.0], "T-:AT": [0.0, 0.0], "T-:C-": [0.0, 0.0], "T-:CA": [0.0, 0.0], 
        "T-:CC": [0.0, 0.0], "T-:CG": [0.0, 0.0], "T-:CT": [0.0, 0.0], "T-:G-": [0.0, 0.0], "T-:GA": [0.0, 0.0], "T-:GC": [0.0, 0.0], "T-:GG": [0.0, 0.0], "T-:GT": [0.0, 0.0], 
        "T-:T-": [0.0, 0.0], "T-:TA": [-6900.0, -20.0], "T-:TC": [-1100.0, -1.6], "T-:TG": [600.0, 3.3], "T-:TT": [200.0, 2.3], "TA:--": [0.0, 0.0], "TA:-A": [-6900.0, -20.0], "TA:-C": [0.0, 0.0], 
        "TA:-G": [0.0, 0.0], "TA:-T": [0.0, 0.0], "TA:A-": [0.0, 0.0], "TA:AA": [200.0, -1.5], "TA:AC": [-100.0, -1.7], "TA:AG": [0.0, 0.0], "TA:AT": [0.0, 0.0], "TA:C-": [0.0, 0.0], 
        "TA:CA": [-100.0, -1.7], "TA:CC": [0.0, 0.0], "TA:CG": [0.0, 0.0], "TA:CT": [0.0, 0.0], "TA:G-": [0.0, 0.0], "TA:GA": [1200.0, 0.7], "TA:GC": [0.0, 0.0], "TA:GG": [0.0, 0.0], 
        "TA:GT": [0.0, 0.0], "TA:T-": [-700.0, -0.8], "TA:TA": [-7200.0, -21.3], "TA:TC": [700.0, 0.7], "TA:TG": [3400.0, 8.0], "TA:TT": [4700.0, 12.9], "TC:--": [0.0, 0.0], "TC:-A": [0.0, 0.0], 
        "TC:-C": [-4000.0, -10.9], "TC:-G": [0.0, 0.0], "TC:-T": [0.0, 0.0], "TC:A-": [0.0, 0.0], "TC:AA": [0.0, 0.0], "TC:AC": [-2200.0, -8.4], "TC:AG": [0.0, 0.0], "TC:AT": [0.0, 0.0], 
        "TC:C-": [0.0, 0.0], "TC:CA": [0.0, 0.0], "TC:CC": [3300.0, 10.4], "TC:CG": [0.0, 0.0], "TC:CT": [0.0, 0.0], "TC:G-": [0.0, 0.0], "TC:GA": [0.0, 0.0], "TC:GC": [2300.0, 5.4], 
        "TC:GG": [0.0, 0.0], "TC:GT": [0.0, 0.0], "TC:T-": [4400.0, 14.9], "TC:TA": [1200.0, 0.7], "TC:TC": [-8200.0, -22.2], "TC:TG": [6100.0, 16.4], "TC:TT": [7600.0, 20.2], "TG:--": [0.0, 0.0], 
        "TG:-A": [0.0, 0.0], "TG:-C": [0.0, 0.0], "TG:-G": [-4900.0, -13.8], "TG:-T": [0.0, 0.0], "TG:A-": [0.0, 0.0], "TG:AA": [0.0, 0.0], "TG:AC": [0.0, 0.0], "TG:AG": [-5000.0, -15.8], 
        "TG:AT": [0.0, 0.0], "TG:C-": [0.0, 0.0], "TG:CA": [-1400.0, -6.2], "TG:CC": [0.0, 0.0], "TG:CG": [-4100.0, -11.7], "TG:CT": [0.0, 0.0], "TG:G-": [0.0, 0.0], "TG:GA": [0.0, 0.0], 
        "TG:GC": [0.0, 0.0], "TG:GG": [-800.0, -4.5], "TG:GT": [0.0, 0.0], "TG:T-": [-1600.0, -3.6], "TG:TA": [-100.0, -1.7], "TG:TC": [1600.0, 3.6], "TG:TG": [-8500.0, -22.7], "TG:TT": [3000.0, 7.4], 
        "TT:--": [0.0, 0.0], "TT:-A": [0.0, 0.0], "TT:-C": [0.0, 0.0], "TT:-G": [0.0, 0.0], "TT:-T": [-200.0, -0.5], "TT:A-": [0.0, 0.0], "TT:AA": [0.0, 0.0], "TT:AC": [0.0, 0.0], 
        "TT:AG": [0.0, 0.0], "TT:AT": [-2700.0, -10.8], "TT:C-": [0.0, 0.0], "TT:CA": [0.0, 0.0], "TT:CC": [5800.0, 16.3], "TT:CG": [0.0, 0.0], "TT:CT": [1000.0, 0.9], "TT:G-": [0.0, 0.0], 
        "TT:GA": [0.0, 0.0], "TT:GC": [0.0, 0.0], "TT:GG": [0.0, 0.0], "TT:GT": [700.0, 0.2], "TT:T-": [2900.0, 10.4], "TT:TA": [200.0, -1.5], "TT:TC": [-1300.0, -5.3], "TT:TG": [1000.0, 0.7], 
        "TT:TT": [-7900.0, -22.2]
    }


    get_nn_HS = function(aa, bb){
        // aa is a dimer in the first sequence, bb is a dimer in the other sequence.
        // returns a 2-elemment array of [enthalpy, entropy] ([H,S])
        key = aa + ':' + bb
        HS = NN_HS[key]
        if (typeof HS == undefined){
            console.log(`get_nn_HS(${aa}, ${bb}) undefined!`)
            HS = [0,0]
        }
        return HS
    }

    this.calculate_aligned_sequence_HS = function(seq1, seq2){
        // HYBRIDIZER.calculate_aligned_sequence_HS('ACGTAACCGGTT', 'ACGTAACCGGTT')

        let enthalpy = 0
        let entropy = 0
        
        // initiation energies
        let firstMatch = -1
        let lastMatch = -1
        for (let i=0; i<seq1.length; i++){
            if ( seq1[i] == seq2[i] ){
                if (firstMatch == -1){
                    firstMatch = i
                }
                lastMatch = i;
            }
        }
        
        let left_HS = INIT_HS[ seq1[firstMatch] ]
        let right_HS = INIT_HS[ seq1[lastMatch] ]

        enthalpy += (left_HS[0] + right_HS[0]);
        entropy += (left_HS[1] + right_HS[1]);
        
        // add nearest neighbor energies
        for (let i=firstMatch; i < lastMatch - 1; i++){
            
            let aa = seq1.substring(i,i+2)
            let bb = seq2.substring(i,i+2)
            let HS = get_nn_HS(aa, bb);

            enthalpy += HS[0];
            entropy += HS[1];
        }
        return [enthalpy, entropy];
    }

    this.G = function(seqA, seqB, T=55){
        // compute Gibbs free energy of binding at 55C
        const T0 = 273.15
        HS = this.calculate_aligned_sequence_HS(seqA, seqB)
        return HS[0] - (T0 + T) * HS[1]
    }

    this.fraction_template_bound = function(primer_conc, H, S, T_celsius){
        // Estimates fraction of primer binding sites that are occupied
        // Assumes excess primer; thus, no competition
        // primer_conc: concetration of primer uM?
        // H: Enthalpy (total heat in the system) J/mol
        // S: Entropy (degree of disorder) J/K
        // T_celsius: temperature in Celsius
        // usage: fraction_template_bound(primer_conc=1e-6, H=-83300, S=-219.1, T_celsius=55)
        T = T_celsius + T0;
        let G = H - T * S;
        let K_eq = Math.exp((G)/(R * T));	// looks OK if you take off the negative sign from the exponent...
        let fraction_bound = (1 / ((1 / primer_conc * K_eq) + 1));
        return fraction_bound
    }

    this.adjust_S_for_salt = function(N, K_conc, Mg_conc){
        /*
            N: primer length in bp
            K_conc: monovalent cation concentration (mM)
            Mg_conc: divalent cation concentration (mM)

            usage: hyb.adjust_S_for_salt(16, 50, 1)
        */
        // To Do: this is not being used yet.
        // These equations are from https://academic.oup.com/bib/article/12/5/514/268700,
        // but this is not the original reference.
        // if (Mg_conc > 8) Mg_conc = 8
        // if (Mg_conc < 0.1) Mg_conc = 0.1
        // if (K_conc < 5) K_conc = 5
        salt_conc = K_conc * 1e-3 + 3.795 * Math.sqrt(Mg_conc * 1e-3)
        // salt_conc: equivalent monovalent salt concentration in mM
        S_salt_adjustment = 0.368 * (N - 1) * Math.log(salt_conc)
        return S_salt_adjustment
    }

    this.binding_coeff = function(seq1, seq2, primer_conc, T, K_conc, Mg_conc){
        // usage: binding_coeff('ACGTAACCGGTT', 'ACGTAACCGGTT', 1e-6, 55, 50, 1)
        // salt concentration ???
        // assert length($seq1) == length($seq2)
        // assert length($seq1) > 3;
        HS = this.calculate_aligned_sequence_HS( seq1, seq2 )
        dH = HS[0]
        dS = HS[1] + adjust_S_for_salt(seq1.length, K_conc, Mg_conc)
        return this.fraction_template_bound(primer_conc, dH, dS, T)
    }

    this.priming_coeff = function(seq1, seq2, primer_conc, T, K_conc, Mg_conc){
        // usage: hyb.priming_coeff('ACGTAACCGGTT', 'ACGTAACCGGTT', 1e-6, 55, 50, 1)
        let primingCoeff = binding_coeff(seq1, seq2, primer_conc, T, K_conc, Mg_conc)
        let end = seq1.length - 1
        if ( seq1[end] != seq2[end] ) primingCoeff *= 0.1
        if ( seq1[end - 1] != seq2[end - 1] ) primingCoeff *= 0.2 
        if ( seq1[end - 2] != seq2[end - 2] ) primingCoeff *= 0.5 
        return primingCoeff;
    }

    this.hybridize = function(concA, concB, dH, dS, T_celsius){
		// Does NOT assume either is limiting - uses quadratic equation
		// Calculate the concentration of hybrid molecules between strand A and strand B.
		// Note that the result is between 0 and the lesser of the two concentrations
        // usage: hyb.hybridize(concA=1e-6, concB=1e-9, dH=-83300, dS=-219.1, T_celsius=55)

        const MAX_EXPONENT = 75;

        // Forcing nonnegative concentrations is a kludge.
		if (concA < 0) concA = 0;
		if (concB < 0) concB = 0;

		
		T = T_celsius + T0;
		power = (dH / (R * T)) - (dS / R);
		if (power > MAX_EXPONENT) power = MAX_EXPONENT;
		let k_eq = Math.exp( power );
		let a = 1;
		let b = -(concA + concB + k_eq);
		let c = concA * concB;
		let radical = Math.sqrt(b * b - 4 * a * c);
		let root1 = (-1 * b + radical)/(2 * a);	// is this ever used?
		let root2 = (-1 * b - radical)/(2 * a);
		let result = (root2 >= 0) ? root2 : (root1 >= 0) ? root1 : 0; // kludge to avoid negative concentrations XXX
        return result
	}

    this.add_aa_list_thermodynamics = function(aa_list){
        let G_min = 0
        let G_min_index = -1
        const T0 = 273.15
        let T = 55
        for (let aa of aa_list){
            for (let alignment of aa.alignments){
                let template_HS = this.calculate_aligned_sequence_HS(alignment.A, alignment.B)
                let primer_HS = this.calculate_aligned_sequence_HS(alignment.B, alignment.B)
                alignment.template_dH = template_HS[0]
                alignment.template_dS = template_HS[1]
                alignment.primer_dH = primer_HS[0]
                alignment.primer_dS = primer_HS[1]
                alignment.template_dG55 = alignment.template_dH - (T0 + T) * alignment.template_dS
            }
        }

    }

    this.get_best_alignment = function(aa, T=55){
        // aa: an AlternativeAlignments object
        // T: temperature in Celsius to compute G
        // note: this method modifies the alignments to add thermodynamic information !!!
        const T0 = 273.15

        let G_min = 0
        let G_min_index = -1
        for (let a_i=0; a_i < aa.alignments.length; a_i++){
            let alignment = aa.alignments[a_i]

            if (alignment.template_G55 < G_min){
                G_min = G
                G_min_index = a_i
            }
        }
        return this.alignments[G_min_index]
    }
}