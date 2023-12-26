import React, { useEffect } from "react";
import * as lil from "lil-gui";

const Gui = () => {
    useEffect(() => {
        // GUIインスタンスが既に存在しない場合のみ新しいインスタンスを作成
        if (!document.querySelector(".lil-gui")) {
            const gui = new lil.GUI();

            const params = {
                rotationSpeed: 0.005,
            };

            gui.add(params, "rotationSpeed", 0, 0.1);
        }

        // コンポーネントがアンマウントされる時にGUIを破棄
        return () => {
            const existingGui = document.querySelector(".lil-gui");
            if (existingGui) {
                existingGui.remove();
            }
        };
    }, []);

    return <div></div>;
};

export default Gui;
