import React from "react";
import "../Dragover.css"

const Dragover = () => {
    return <div id="drag_modal">
        <div className="file">📁</div>
        <p>ファイルをドロップしてください</p>
        <p>対応している形式はglTFとglbファイルとなっています。</p>
    </div>
};

export default Dragover;
