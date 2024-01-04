import React, { useState, useEffect } from 'react';
import '../Help.css';

const Help = () => {
    const [isModalOpen, setModalOpen] = useState(false);

    const toggleModal = (event) => {
        event.stopPropagation();
        setModalOpen(!isModalOpen);
    };

    useEffect(() => {
        const handleClickOutside = () => {
            if (isModalOpen) {
                setModalOpen(false);
            }
        };

        window.addEventListener('click', handleClickOutside);

        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    }, [isModalOpen]);

    return (
        <>
            <button className='help_box' onClick={toggleModal}>
                ？
            </button>
            {isModalOpen && (
                <div className='modal' onClick={(e) => e.stopPropagation()}>
                    <div className="modal_content">
                        <h3>３Dモデルビュアーの使い方</h3>
                        <div className='subtitle'>
                            <p>・マウス操作</p>
                        </div>
                        <ul>
                            <li>右クリック：並行移動</li>
                            <li>左クリック：モデルの回転</li>
                            <li>ホイール　：拡大縮小</li>
                        </ul>
                        <div className='subtitle'>
                            <p>・ファイル形式、フォルダ構成</p>
                        </div>
                        <ul>
                            <li>読み込むフォルダや複数選択のファイルの中に必要なファイルが全て存在していれば、フォルダ構成等は問いません。</li>
                        </ul>
                        <div className='subtitle'>
                            <p>・読み込み方</p>
                        </div>
                        <ul>
                            <li>ドラッグ＆ドロップでのみ対応しています。</li>
                            <li>別のモデルを読み込む場合には一度リロードをしてください。</li>
                        </ul>
                    </div>
                </div>
            )}
        </>
    );
};

export default Help;
