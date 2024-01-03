import React from "react";
import Viewer from "./components/Viewer";
import "./App.css";
import Help from "./components/Help";

const App = () => {
    return (
        <div className="App">
            <Viewer />
            <Help />
        </div>
    );
};

export default App;
