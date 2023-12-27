import React from 'react';
import { ModelProvider } from './contexts/ModelContext';
import Gui from './components/Gui';
import Viewer from './components/Viewer';
import "./App.css"

const App = () => {
    return (
        <ModelProvider>
            <div className="App">
                <Gui />
                <Viewer />
            </div>
        </ModelProvider>
    );
};

export default App;