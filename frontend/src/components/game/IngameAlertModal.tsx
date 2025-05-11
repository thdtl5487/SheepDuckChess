import React from 'react';
import { useNavigate } from 'react-router-dom';

type IngameAlertModalProps = {
    /** 모달 표시 여부 */
    isOpen: boolean;
    /** 모달 제목 */
    title: string;
    /** 모달에 표시할 추가 메시지 */
    message: string;
    /** 확인 버튼 텍스트 */
    confirmText?: string;
    /** 확인 버튼 클릭 시 실행할 콜백 */
    onConfirm: () => void;
};

const IngameAlertModal: React.FC<IngameAlertModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = '확인',
    onConfirm,
}) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
                <h2 className="text-2xl font-bold mb-4 text-black">{title}</h2>
                <p className="text-black mb-6">{message}</p>
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={onConfirm}
                >
                    {confirmText}
                </button>
            </div>
        </div>
    );
};

export default IngameAlertModal;
