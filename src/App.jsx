// import React, { useState } from 'react';
// import "./App.css"
// import Viewer from './Viewer';

// function App() {
//     const [modelUrl, setModelUrl] = useState(null);

//   const handleDrop = (event) => {
//     event.preventDefault();

//     // ドロップされたファイルを取得
//     const droppedFiles = event.dataTransfer.files;

//     // ファイルが存在するか確認
//     if (droppedFiles.length > 0) {
//       const file = droppedFiles[0];

//       // FileReaderを使用してファイルの内容を読み込む
//       const reader = new FileReader();

//       reader.onload = (e) => {
//         // 読み込まれたファイルの中身がe.target.resultに格納されている
//         console.log("File content:", e.target.result);

//         // ここでファイルの内容をstateに設定するなどの処理を追加
//         setModelUrl(e.target.result);
//       };

//       // ファイルの読み込みを開始
//       reader.readAsText(file);
//     }
//   };

//   const handleDragOver = (event) => {
//     event.preventDefault();
//   };

//   return (
//     <div
//       className="App"
//       onDrop={handleDrop}
//       onDragOver={handleDragOver}
//     >
//       <Viewer modelUrl={modelUrl} />
//     </div>
//   );
// };

// export default App;


// App.js
import React, { useState } from 'react';
import Viewer from './Viewer';
import "./App.css"

const App = () => {
  const [modelUrls, setModelUrls] = useState([]);

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;

    if (droppedFiles.length > 0) {
      const files = Array.from(droppedFiles);

      // FileReaderを使用して各ファイルの内容を読み込む
      Promise.all(files.map((file) => readFileAsync(file)))
        .then((contents) => {
          setModelUrls(contents);
        })
        .catch((error) => {
          console.error('ファイル読み込みエラー:', error);
        });
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const readFileAsync = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ name: file.name, content: e.target.result });
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  return (
    <div
      className="App"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Viewer modelUrls={modelUrls} />
    </div>
  );
};

export default App;


