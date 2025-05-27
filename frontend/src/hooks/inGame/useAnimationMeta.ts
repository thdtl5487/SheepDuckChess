import { useState, useEffect } from "react";

export interface AnimationMeta {
    id: number;
    playTime: number;
    hitTime: number;
}

export function useAnimationMeta() {
    const [metaMap, setMetaMap] = useState<Map<number, AnimationMeta>>(new Map());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/asset/PieceAnime/animation_meta.csv')
            .then(res => res.text())
            .then(text => {
                const lines = text.trim().split('\n');
                const [, ...rows] = lines; // 첫 줄은 헤더니까 버림
                const map = new Map<number, AnimationMeta>();
                for (const row of rows) {
                    const [id, playTime, hitTime] = row.split(',').map(s => s.trim());
                    map.set(Number(id), {
                        id: Number(id),
                        playTime: Number(playTime),
                        hitTime: Number(hitTime)
                    });
                }
                setMetaMap(map);
                setLoading(false);
            });
    }, []);

    // id로 메타 찾기 편하게 getMeta 함수 제공
    function getMeta(id: number): AnimationMeta | undefined {
        return metaMap.get(id);
    }

    return { getMeta, loading, metaMap };
}
