/* 
    earth sizes are taken from AS3000 Table 5.1
    Given the phase conductor as the key the array contains 2 values.
    The first value is the earth size when used with copper active conductors and 
    the second is the earth size when used with aluminimum active conductors.
*/
var earthSizes = {
    1:      [1,'-'],
    1.5:    [1.5,'-'],
    2.5:    [2.5,'-'],
    4:      [2.5,'-'],
    6:      [2.5,'-'],
    10:     [4,'-'],
    16:     [6,4],
    25:     [6,6],
    35:     [10,6],
    50:     [16,10],
    70:     [25,10],
    95:     [25,16],
    120:    [35,25],
    150:    [50,25],
    185:    [70,35],
    240:    [95,50],
    300:    [120,70],
    400:    ['≥120†','>95†'],
    500:    ['≥120†','>95†'],
    630:    ['≥120†','>120†'],
    '>630': ['≥25% of active size†', '≥25% of active size†']
};

/*
    The cable data was taken from Prysmian Construction booklet for
    Single Double Insulated cables
    The Key is the conductor size and the Array's first value is the
    Insulation + sheath size and the second is the K constant.
*/
var cableDate = {
    1:   [1.4,0.05  ],
    1.5: [1.4,0.0642],
    2.5: [1.5,0.0642],
    4:   [1.7,0.0642],
    6:   [1.7,0.0642],
    10:  [1.9,0.0642],
    16:  [2.2,0.0642],
    25:  [2.3,0.0554],
    35:  [2.3,0.0554],
    50:  [2.4,0.0554],
    70:  [2.5,0.0554],
    95:  [2.6,0.0554],
    120: [2.7,0.0528],
    150: [3,0.0528  ],
    185: [3.2,0.0528],
    240: [3.4,0.0514],
    300: [3.6,0.0514],
    400: [3.9,0.0514],
    500: [4.2,0.0514],
    630: [4.6,0.0514]
};
