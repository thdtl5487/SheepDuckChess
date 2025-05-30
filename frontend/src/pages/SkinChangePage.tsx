// SkinChangePage.tsx
import React, { useState, useEffect } from 'react';
import SkinFilterButtons from "../components/SkinChangePage/btn_skinFillter";
import PieceTypeFilterButtons from "../components/SkinChangePage/btn_pieceTypeFilter";

export default function SkinChangePage() {
    const [tab, setTab] = useState<'all' | 'piece' | 'board' | 'character'>('all');
    const [pieceFilter, setPieceFilter] = useState<"all" | "pawn" | "knight" | "bishop" | "rook" | "queen" | "king">("all");
    const [mySkins, setMySkins] = useState<any[]>([]);
    const [selectedSkin, setSelectedSkin] = useState<number | null>(null);

    useEffect(() => {
        // TODO: API로 내 스킨들 가져오기
        // setMySkins(response.data);
    }, []);

    return (
        <div className="p-8 w-full flex flex-col items-center">
            <div className="flex flex-col mb-4">
                <div>
                    <SkinFilterButtons current={tab} onChange={setTab} />
                </div>
                {tab === "piece" && (
                    <div>
                        <PieceTypeFilterButtons current={pieceFilter} onChange={setPieceFilter} />
                    </div>
                )}
            </div>
            <div className="flex flex-wrap gap-4">
                {mySkins
                    .filter(skin => skin.type === tab)
                    .map(skin => (
                        <div key={skin.id}
                            className={`border p-2 rounded ${selectedSkin === skin.id ? 'border-blue-500' : ''}`}
                            onClick={() => setSelectedSkin(skin.id)}>
                            <img src={skin.thumbnailUrl} alt="skin" className="w-20 h-20" />
                        </div>
                    ))}
            </div>
            <div className="mt-8">
                {/* 미리보기 컴포넌트, 선택된 스킨을 보여줌 */}
                {selectedSkin && (
                    <img src={mySkins.find(s => s.id === selectedSkin)?.previewUrl} alt="preview" className="w-40 h-40" />
                )}
            </div>
            <button className="mt-8 px-4 py-2 bg-blue-500 text-white rounded">
                적용하기
            </button>
        </div>
    );
}
