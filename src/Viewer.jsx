// src/Viewer.js
import { useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { AmbientLight, PointLight } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";

const Viewer = () => {
    useEffect(() => {
        const canvas = document.getElementById("canvas");
        // let model;

        // scene
        const scene = new THREE.Scene();

        // camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 1, 4);

        // renderer
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: false,
            alpha: true,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        // light
        const ambientLight = new AmbientLight(0xffffff, 3);
        scene.add(ambientLight);
        const pointLight = new PointLight(0xffffff, 2, 100);
        scene.add(pointLight);

        // gltfLoader
        const gltfLoader = new GLTFLoader();

        // OrbitControls（ユーザー側のアクションを受け付ける）
        const controls = new OrbitControls(camera, renderer.domElement);

        // ファイルごとに合わせた読み込み
        const loadFile = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => resolve(event.target.result);
                reader.onerror = (error) => reject(error);

                if (file.name.endsWith(".gltf") || file.name.endsWith(".glb")) {
                    reader.readAsText(file);
                } else if (file.name.endsWith(".bin") || file.type.startsWith("image/")) {
                    reader.readAsArrayBuffer(file);
                }
            });
        };

        const loadModel = async (fileMap) => {
            try {
                let gltfData = null;
                const textureDataMap = new Map();
                const binDataMap = new Map();

                for (let [fileName, file] of fileMap.entries()) {
                    try {
                        if (fileName.endsWith(".gltf")) {
                            console.log("gltf");
                            const fileData = await loadFile(file);
                            gltfData = JSON.parse(fileData);
                        } else if (fileName.endsWith(".bin")) {
                            console.log("bin");
                            // .binファイルの読み込みとURLの生成
                            const buffer = await loadFile(file);
                            const blob = new Blob([buffer], { type: "application/octet-stream" });
                            const binDataUrl = URL.createObjectURL(blob);
                            binDataMap.set(fileName, binDataUrl);
                        } else if (file.type.startsWith("image/")) {
                            console.log("image");
                            // 画像ファイルの読み込みとDataURLの生成
                            const dataUrl = await loadFile(file);
                            const textureFileName = fileName.split("/").pop(); // パスからファイル名を抽出
                            textureDataMap.set(textureFileName, dataUrl); // 修正: ファイル名をキーとして使用
                        }
                    } catch (innerError) {
                        console.error(`Error loading file ${fileName}:`, innerError);
                    }
                }

                if (gltfData) {
                    // .binファイルの参照をGLTFファイル内で更新
                    gltfData.buffers.forEach((buffer) => {
                        if (buffer.uri) {
                            console.log(buffer);
                            const binDataUrl = binDataMap.get(buffer.uri);
                            if (binDataUrl) {
                                buffer.uri = binDataUrl;
                            }
                        }
                    });

                    // 画像ファイルの参照をGLTFファイル内で更新
                    gltfData.images.forEach((image) => {
                        if (image.uri) {
                            console.log(image);
                            if (image.uri) {
                                const textureFileName = image.uri.split("/").pop();
                                const textureDataUrl = textureDataMap.get(textureFileName);
                                if (textureDataUrl) {
                                    image.uri = textureDataUrl;
                                } else {
                                    console.error("Texture file not found:", textureFileName);
                                }
                            }
                        }
                    });

                    gltfLoader.parse(JSON.stringify(gltfData), "", (gltf) => {
                        // ロードされたGLTFモデルを取得
                        const loadedModel = gltf.scene;

                        // モデルの位置、スケール、回転などを調整
                        loadedModel.position.set(0, 0, 0);
                        loadedModel.scale.set(1, 1, 1);
                        loadedModel.rotation.set(0, 0, 0);

                        // Three.jsのシーンにモデルを追加
                        scene.add(loadedModel);

                        // 描画ループを更新（アニメーションがある場合）
                        const animate = () => {
                            requestAnimationFrame(animate);

                            if (loadedModel) {
                                loadedModel.rotation.y += 0.01;
                            }

                            controls.update();

                            renderer.render(scene, camera);
                        };

                        animate();
                    });
                }
            } catch (error) {
                console.error("Error loading model: ", error);
            }
        };

        const onDragOver = (event) => {
            event.preventDefault();
        };

        const onDrop = async (event) => {
            event.preventDefault();
            const fileMap = new Map();

            if (event.dataTransfer.items) {
                const files = Array.from(event.dataTransfer.items)
                    .filter((item) => item.kind === "file")
                    .map((item) => item.getAsFile());

                files.forEach((file) => fileMap.set(file.name, file));

                await loadModel(fileMap);
            }
        };

        // イベントリスナーを追加
        document.addEventListener("drop", onDrop);
        document.addEventListener("dragover", onDragOver);

        // クリーンアップ関数
        return () => {
            document.removeEventListener("drop", onDrop);
            document.removeEventListener("dragover", onDragOver);
        };
    }, []);

    return (
        <>
            <DndProvider backend={HTML5Backend}>
                <p>|* Your Drag-and-Drop Application *|</p>
                <canvas id="canvas"></canvas>
            </DndProvider>
        </>
    );
};

export default Viewer;
