// Wait for the game engine to be ready
window.addEventListener('runAfterAutoload', function() {
    
    elements.vibranium = {
        color: "#444b57",
        behavior: behaviors.WALL,
        category: "solids",
        state: "solid",
        tempHigh: 3400,
        stateHigh: "molten_vibranium"
    };

    elements.molten_vibranium = {
        color: "#c73b08",
        behavior: behaviors.MOLTEN,
        category: "states",
        state: "liquid",
        temp: 3400,
        tempHigh: 10000,
        stateHigh: "fire",
        tempLow: 3200,
        stateLow: "vibranium",
        conduct: 0.95,
        density: 4000,
        viscosity: 8000
    };

});
