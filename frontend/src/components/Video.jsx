import { useRef } from "react";

export default function VideoPlayer() {
    const videoRef = useRef(null);

    const playVideo = () => {
        videoRef.current?.play();
    };

    return (
        <div>
            <button onClick={playVideo}>Play Video</button>

            <video
                ref={videoRef}
                width="320"
                height="180"
                controls
            >
                <source src="/video.mp4" type="video/mp4" />
            </video>
        </div>
    );
}
