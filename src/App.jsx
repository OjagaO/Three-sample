import React from "react";
import Viewer from "./components/Viewer";
import "./App.css";
import Help from "./components/Help";
import Dragover from "./components/Dragover";

const App = () => {
    return (
        <div className="App">
            <Viewer />
            <Help />
            <Dragover />
        </div>
    );
};

export default App;
