import React, { useContext, useEffect } from "react";
import * as lil from "lil-gui";
import { ModelContext } from "../contexts/ModelContext";

const Gui = () => {
    const { rotationSpeed, setRotationSpeed, position, setPosition } = useContext(ModelContext);

    useEffect(() => {
        // GUIインスタンスが既に存在しない場合のみ新しいインスタンスを作成
        if (!document.querySelector(".lil-gui")) {
            const gui = new lil.GUI();

            const params = {
                rotationSpeed: 0.005,
                x: 0,
                y: 0,
            };

            gui.add(params, "rotationSpeed", 0, 0.1).onChange((value) => {
                setRotationSpeed(value);
            });
            gui.add(params, "x", -10, 10).onChange((value) => {
                setPosition({ ...position, x: value });
            });
            gui.add(params, "y", -10, 10).onChange((value) => {
                setPosition({ ...position, y: value });
            });
        }
    }, [rotationSpeed, setRotationSpeed, position, setPosition]);

    return <div></div>;
};

export default Gui;
