// src/Viewer.js
import { useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { AmbientLight, PointLight } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import * as lil from "lil-gui";

const Viewer = () => {
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        const canvas = document.getElementById("canvas");

        // 画面幅の変更に合わせる
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener("resize", handleResize);

        // scene
        const scene = new THREE.Scene();

        const rgbeLoader = new RGBELoader();
        console.log("rgbeLoader  new!!")
        rgbeLoader.load("models/bg_sky.pic", (texture) => {
            console.log("rgbeLoader  load!!")
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.background = texture;
            scene.environment = texture;
        });

        // camera
        const camera = new THREE.PerspectiveCamera(75, windowSize.width / windowSize.height, 0.1, 1000);
        camera.position.set(0, 1, 3);

        // renderer
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: false,
            alpha: true,
        });
        renderer.setSize(windowSize.width, windowSize.height);
        renderer.setPixelRatio(window.devicePixelRatio);

        // light
        const ambientLight = new AmbientLight(0xffffff, 3);
        scene.add(ambientLight);
        const pointLight = new PointLight(0xffffff, 10, 100);
        scene.add(pointLight);

        // gltfLoader
        const gltfLoader = new GLTFLoader();

        // OrbitControls（ユーザー側のアクションを受け付ける）
        const controls = new OrbitControls(camera, renderer.domElement);

        // ファイルごとに合わせた読み込み(適切な変換を行うイメージ)
        const loadFile = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => resolve(event.target.result);
                reader.onerror = (error) => reject(error);

                if (file.name.endsWith(".gltf")) {
                    reader.readAsText(file);
                } else if (file.name.endsWith(".bin") || file.type.startsWith("image/") || file.name.endsWith(".glb")) {
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
                            const fileData = await loadFile(file);
                            gltfData = JSON.parse(fileData);
                        } else if (fileName.endsWith(".bin")) {
                            // .binファイルの読み込みとURLの生成
                            const buffer = await loadFile(file);
                            const blob = new Blob([buffer], { type: "application/octet-stream" });
                            const binDataUrl = URL.createObjectURL(blob);
                            binDataMap.set(fileName, binDataUrl);
                        } else if (file.type.startsWith("image/")) {
                            // 画像ファイルの読み込みとURLの生成
                            const buffer = await loadFile(file);
                            const blob = new Blob([buffer], { type: file.type });
                            const imageDataUrl = URL.createObjectURL(blob);
                            textureDataMap.set(fileName, imageDataUrl);
                        } else if (fileName.endsWith(".glb")) {
                            // gblファイルはjson.parseしないのでそのまま処理
                            const arrayBuffer = await loadFile(file);
                            gltfLoader.parse(arrayBuffer, "", (glb) => {
                                const loadedModel = glb.scene;

                                // アニメーションミキサーの作成
                                const mixer = new THREE.AnimationMixer(loadedModel);

                                // lilGUIのインスタンス化
                                const gui = new lil.GUI();

                                const params = {
                                    rotationSpeed: 0.005,
                                    x: 0,
                                    y: 0,
                                    z: 0,
                                };

                                gui.add(params, "rotationSpeed", 0, 0.1);
                                gui.add(params, "x", -1, 1);
                                gui.add(params, "y", -1, 1);
                                gui.add(params, "z", -1, 1);

                                // GLBに含まれるすべてのアニメーションをミキサーに追加
                                const animationFolder = gui.addFolder("Animations");
                                glb.animations.forEach((clip, index) => {
                                    const action = mixer.clipAction(clip);
                                    animationFolder.add({ [`Animation ${index}`]: false }, `Animation ${index}`).onChange((play) => {
                                        // アニメーションの再生/停止
                                        play ? action.play() : action.stop();
                                    });
                                });

                                // モデルのバウンディングボックスを計算
                                const box = new THREE.Box3().setFromObject(loadedModel);
                                const size = box.getSize(new THREE.Vector3());

                                // スケールを調整
                                const desiredHeight = 1; // 目的の高さ
                                while (size.y < 0.5) {
                                    size.y *= 10;
                                }
                                const scale = desiredHeight / size.y;
                                loadedModel.scale.set(scale, scale, scale);

                                loadedModel.position.set(params.x, params.y, params.z);

                                // Three.jsのシーンにモデルを追加
                                scene.add(loadedModel);

                                // 時間の追跡用
                                let previousTime = 0;

                                // 描画ループを更新
                                const animate = (time) => {
                                    requestAnimationFrame(animate);

                                    const deltaTime = (time - previousTime) / 1000; // 秒単位に変換
                                    mixer.update(deltaTime); // アニメーションの更新
                                    previousTime = time;

                                    if (loadedModel) {
                                        loadedModel.rotation.y += params.rotationSpeed;
                                        loadedModel.position.set(params.x, params.y, params.z);
                                    }

                                    controls.update();
                                    renderer.render(scene, camera);
                                };

                                requestAnimationFrame(animate);
                            });
                        }
                    } catch (innerError) {
                        console.error(`Error loading file ${fileName}:`, innerError);
                    }
                }

                if (gltfData) {
                    // .binファイルの参照をGLTFファイル内で更新
                    gltfData.buffers.forEach((buffer) => {
                        if (buffer.uri) {
                            const binDataUrl = binDataMap.get(buffer.uri);
                            if (binDataUrl) {
                                buffer.uri = binDataUrl;
                            }
                        }
                    });

                    // 画像ファイルの参照をGLTFファイル内で更新
                    gltfData.images.forEach((image) => {
                        if (image.uri) {
                            const textureFileName = image.uri.split("/").pop();
                            const textureDataUrl = textureDataMap.get(textureFileName);
                            if (textureDataUrl) {
                                image.uri = textureDataUrl;
                            } else {
                                console.error("Texture file not found in map:", textureFileName);
                            }
                        }
                    });

                    gltfLoader.parse(JSON.stringify(gltfData), "", (gltf) => {
                        // ロードされたGLTFモデルを取得
                        const loadedModel = gltf.scene;

                        // アニメーションミキサーの作成
                        const mixer = new THREE.AnimationMixer(loadedModel);

                        // lilGUIのインスタンス化
                        const gui = new lil.GUI();

                        const params = {
                            rotationSpeed: 0.005,
                            x: 0,
                            y:  0,
                            z: 0,
                        };

                        gui.add(params, "rotationSpeed", 0, 0.1);
                        gui.add(params, "x", -1, 1);
                        gui.add(params, "y", -1, 1);
                        gui.add(params, "z", -1, 1);

                        // GLTFに含まれるすべてのアニメーションをミキサーに追加
                        const animationFolder = gui.addFolder("Animations");
                        gltf.animations.forEach((clip, index) => {
                            const action = mixer.clipAction(clip);
                            animationFolder.add({ [`Animation ${index}`]: false }, `Animation ${index}`).onChange((play) => {
                                // アニメーションの再生/停止
                                play ? action.play() : action.stop();
                            });
                        });

                        // GLTFに含まれるすべてのアニメーションをミキサーに追加
                        gltf.animations.forEach((clip) => {
                            mixer.clipAction(clip).play();
                        });

                        // モデルのバウンディングボックスを計算
                        const box = new THREE.Box3().setFromObject(loadedModel);
                        const size = box.getSize(new THREE.Vector3());

                        // スケールを調整
                        const desiredHeight = 1.2; // 目的の高さ
                        while (size.y < 0.5) {
                            size.y *= 10;
                        }
                        const scale = desiredHeight / size.y;
                        loadedModel.scale.set(scale, scale, scale);

                        // モデルの位置を調整（原点に配置）
                        loadedModel.position.set(0, 0, 0);

                        // Three.jsのシーンにモデルを追加
                        scene.add(loadedModel);

                        // 時間の追跡用
                        let previousTime = 0;

                        // 描画ループを更新（アニメーションがある場合）
                        const animate = (time) => {
                            requestAnimationFrame(animate);

                            const deltaTime = (time - previousTime) / 1000; // 秒単位に変換
                            mixer.update(deltaTime); // アニメーションの更新
                            previousTime = time;

                            if (loadedModel) {
                                loadedModel.rotation.y += params.rotationSpeed;
                                loadedModel.position.set(params.x, params.y, params.z);
                            }

                            controls.update();
                            renderer.render(scene, camera);
                        };

                        requestAnimationFrame(animate);
                    });
                }
            } catch (error) {
                console.error("Error loading model: ", error);
            }
        };

        const onDragOver = (event) => {
            event.preventDefault();
        };

        const processEntry = async (entry, fileMap) => {
            if (entry.isFile) {
                return new Promise((resolve, reject) => {
                    entry.file((file) => {
                        fileMap.set(file.name, file);
                        resolve();
                    }, reject);
                });
            } else if (entry.isDirectory) {
                const reader = entry.createReader();
                return new Promise((resolve, reject) => {
                    const readEntries = () => {
                        reader.readEntries(async (entries) => {
                            if (entries.length) {
                                const promises = [];
                                for (const ent of entries) {
                                    promises.push(processEntry(ent, fileMap));
                                }
                                await Promise.all(promises);
                                readEntries(); // 再帰的にディレクトリの内容を読み込む
                            } else {
                                resolve(); // ディレクトリの読み込み完了
                            }
                        }, reject);
                    };
                    readEntries();
                });
            }
        };

        const onDrop = async (event) => {
            event.preventDefault();
            const fileMap = new Map();

            const items = event.dataTransfer.items;
            const promises = [];
            for (const item of items) {
                if (item.kind === "file") {
                    const entry = item.webkitGetAsEntry();
                    if (entry) {
                        promises.push(processEntry(entry, fileMap));
                    }
                }
            }

            await Promise.all(promises);
            await loadModel(fileMap);

            const inputArea = document.getElementById("input_area");
            inputArea.style.display = "none";
        };

        // イベントリスナーを追加
        const inputCanvas = document.getElementById("canvas");
        inputCanvas.addEventListener("drop", onDrop);
        inputCanvas.addEventListener("dragover", onDragOver);

        // クリーンアップ関数
        return () => {
            inputCanvas.removeEventListener("drop", onDrop);
            inputCanvas.removeEventListener("dragover", onDragOver);
        };
    }, [windowSize.height, windowSize.width]);

    return (
        <>
            <div id="input_area">このエリアにファイルまたはフォルダをドラッグ&ドロップしてください</div>
            <canvas id="canvas"></canvas>
        </>
    );
};

export default Viewer;
