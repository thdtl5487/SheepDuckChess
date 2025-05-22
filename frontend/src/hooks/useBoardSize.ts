import { useLayoutEffect, useState, RefObject } from "react";

export function useBoardSize(ref: RefObject<HTMLElement | null>) {
    const [squareSize, setSquareSize] = useState(60);

    useLayoutEffect(() => {
        function updateSize() {
            if (ref.current) {
                const w = ref.current.clientWidth;
                setSquareSize(w / 8);
            }
        }
        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, [ref]);

    return squareSize;
}
