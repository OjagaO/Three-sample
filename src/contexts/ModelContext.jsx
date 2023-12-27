// src/contexts/ModelContext.js
import React, { createContext, useState } from 'react';

export const ModelContext = createContext();

export const ModelProvider = ({ children }) => {
    const [rotationSpeed, setRotationSpeed] = useState(0.005);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const contextValue = {
        rotationSpeed,
        setRotationSpeed,
        position,
        setPosition
    };

    return (
        <ModelContext.Provider value={contextValue}>
            {children}
        </ModelContext.Provider>
    );
};
