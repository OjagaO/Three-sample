// src/Viewer.js
import { useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { AmbientLight, PointLight } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const Viewer = () => {
    useEffect(() => {
        const canvas = document.getElementById("canvas");
        // let model;

        // scene
        const scene = new THREE.Scene();

        // camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 1, 3);

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

        let mixer;

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

        const tick = () => {
            renderer.render(scene, camera);
            if (mixer) {
                mixer.update(0.01);
            }
            requestAnimationFrame(tick);
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
                            gltfLoader.parse(
                                arrayBuffer,
                                "",
                                (glb) => {
                                    const loadedModel = glb.scene;

                                    // モデルのバウンディングボックスを計算
                                    const box = new THREE.Box3().setFromObject(loadedModel);
                                    const size = box.getSize(new THREE.Vector3());

                                    // スケールを調整
                                    const desiredHeight = 1; // 目的の高さ
                                    const scale = desiredHeight / size.y;
                                    loadedModel.scale.set(scale, scale, scale);

                                    // モデルの位置を調整（例：原点に配置）
                                    loadedModel.position.set(0, 0, 0);

                                    // Three.jsのシーンにモデルを追加
                                    scene.add(loadedModel);

                                    // 描画ループを更新（アニメーションがある場合）
                                    const animate = () => {
                                        // モデルのアニメーションや操作
                                        if (loadedModel) {
                                            loadedModel.rotation.y += 0.005;
                                        }

                                        controls.update();
                                        renderer.render(scene, camera);

                                        requestAnimationFrame(animate);
                                    };

                                    animate();
                                },
                                () => {
                                    tick();
                                }
                            );
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

                    gltfLoader.parse(
                        JSON.stringify(gltfData),
                        "",
                        (gltf) => {
                            // ロードされたGLTFモデルを取得
                            const loadedModel = gltf.scene;

                            // モデルのバウンディングボックスを計算
                            const box = new THREE.Box3().setFromObject(loadedModel);
                            const size = box.getSize(new THREE.Vector3());

                            // スケールを調整
                            const desiredHeight = 1; // 目的の高さ
                            console.log(size);
                            while (size.y < 1) {
                                size.y *= 10;
                            }
                            console.log(size.y);
                            const scale = desiredHeight / size.y;
                            loadedModel.scale.set(scale, scale, scale);

                            // モデルの位置を調整（原点に配置）
                            loadedModel.position.set(0, 0, 0);

                            // Three.jsのシーンにモデルを追加
                            scene.add(loadedModel);

                            // 描画ループを更新（アニメーションがある場合）
                            const animate = () => {
                                requestAnimationFrame(animate);

                                if (loadedModel) {
                                    loadedModel.rotation.y += 0.005;
                                }

                                controls.update();
                                renderer.render(scene, camera);
                            };

                            animate();
                        },
                        () => {
                            tick();
                        }
                    );
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
    }, []);

    return (
        <>
            <div id="input_area">このエリアにファイルまたはフォルダをドラッグ&ドロップしてください</div>
            <canvas id="canvas"></canvas>
        </>
    );
};

export default Viewer;
