// // src/Viewer.js
// import { useEffect } from "react";
// import * as THREE from "three";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import { AmbientLight, PointLight } from "three";
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// const Viewer = () => {

//     useEffect(() => {

//         const canvas = document.getElementById("canvas");
//         let model;

//         // scene
//         const scene = new THREE.Scene();

//         // camera
//         const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
//         camera.position.set(0, 1, 4);

//         // renderer
//         const renderer = new THREE.WebGLRenderer({
//             canvas: canvas,
//             antialias: false,
//             alpha: true,
//         });
//         renderer.setSize(window.innerWidth, window.innerHeight);
//         renderer.setPixelRatio(window.devicePixelRatio);

//         // light
//         const ambientLight = new AmbientLight(0xffffff, 3);
//         scene.add(ambientLight);
//         const pointLight = new PointLight(0xffffff, 2, 100);
//         scene.add(pointLight);

//         // OrbitControls
//         const controls = new OrbitControls(camera, renderer.domElement);

//         // モデルの読み込み
//         const gltfLoader = new GLTFLoader();
//         let mixer;

//         gltfLoader.load(
//             "./models/run/scene.gltf",
//             (gltf) => {
//                 model = gltf.scene;
//                 // model.scale.set(0.005, 0.005, 0.005);
//                 model.scale.set(1, 1, 1);
//                 scene.add(model);

//                 mixer = new THREE.AnimationMixer(model);
//                 const clips = gltf.animations;
//                 clips.forEach(function (clip) {
//                     const action = mixer.clipAction(clip);
//                     action.play();
//                 });

//                 animate();
//             },
//             () => {
//                 tick();
//             }
//         );

//         const tick = () => {
//             renderer.render(scene, camera);
//             if (mixer) {
//                 mixer.update(0.01);
//             }
//             requestAnimationFrame(tick);
//         };

//         function animate() {
//             requestAnimationFrame(animate);

//             // オブジェクトの回転アニメーション
//             if (model) {
//                 model.rotation.y += 0.01;
//             }

//             // OrbitControlsの更新
//             controls.update();

//             // 描画
//             renderer.render(scene, camera);
//         }

//     }, []);

//     return <canvas id="canvas"></canvas>;
// };

// export default Viewer;


// Viewer.js
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const Viewer = ({ modelUrls }) => {
  const mount = useRef(null);

  console.log(modelUrls)

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
                    antialias: false,
                    alpha: true,
                });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.current.appendChild(renderer.domElement);

    const loader = new GLTFLoader();

    // 各GLTFモデルをロード
    modelUrls.forEach((model) => {
      loader.load(
        model.content,
        (gltf) => {
          scene.add(gltf.scene);
        },
        undefined,
        (error) => {
          console.error(`${model.name} のGLTFモデルの読み込みエラー:`, error);
        }
      );
    });

    camera.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      // 必要に応じてクリーンアップロジックを追加
    };
  }, [modelUrls]);

  return <div ref={mount} />;
};

export default Viewer;

