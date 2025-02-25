"use client";

import { useEffect, useRef } from "react";
import { SkinViewer, IdleAnimation } from "skinview3d";

interface SkinViewerProps {
    skinUrl: string;
    capeUrl?: string; 
    width?: number;
    height?: number;
}

const SkinViewerComponent: React.FC<SkinViewerProps> = ({ skinUrl, capeUrl, width = 300, height = 400 }) => {
    const viewerRefDiv = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<SkinViewer | null>(null);

    useEffect(() => {
        if (!viewerRef.current && viewerRefDiv.current) {
            viewerRefDiv.current.innerHTML = ""; 

            const viewer = new SkinViewer({
                canvas: document.createElement("canvas"),
                skin: skinUrl,
                width: width,
                height: height,
            });

            viewerRefDiv.current.appendChild(viewer.canvas);
            viewer.controls.enableZoom = false;
            viewer.camera.position.set(-30, 9, 50);

            if (capeUrl) {
                viewer.loadCape(capeUrl);
            }

            viewer.animation = new IdleAnimation();

            viewerRef.current = viewer; 
        }

        return () => {
            viewerRef.current?.dispose();
            viewerRef.current = null;
        };
    }, [skinUrl, capeUrl, width, height]);

    return <div ref={viewerRefDiv} className="rounded-lg cursor-grab" />;
};

export default SkinViewerComponent;
