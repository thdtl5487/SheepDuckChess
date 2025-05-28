export interface OverlayEvent {
    id: number;                        // 고유 식별자 (Date.now() 등)
    attackerImage?: string;             // 공격자 이미지 URL (없으면 undefined)
    victimImage?: string;               // 피격자 이미지 URL (없으면 undefined)
    isOpponentAttack: boolean;          // 공격 주체: true면 상대, false면 나
    playTime: number;                   // 애니메이션 재생 시간 (ms)
    hitTime: number;
}
