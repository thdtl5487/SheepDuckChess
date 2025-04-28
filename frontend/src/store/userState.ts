import { atom } from 'recoil';

export const userState = atom({
  key: 'userState', // 전역적으로 유니크해야 함
  default: null,    // 기본값은 null (로그인 안 된 상태)
});
