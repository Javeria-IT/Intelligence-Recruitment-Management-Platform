import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Camera, Mic, MicOff, VideoOff, Video } from "lucide-react";
import { toast } from "sonner";

interface Props {
  size?: "sm" | "default";
  variant?: "outline" | "default" | "ghost";
  label?: string;
}

export function CameraTestButton({ size = "sm", variant = "outline", label = "Test Camera" }: Props) {
  const [open, setOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setError(null);
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((s) => {
        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch((err) => {
        setError(err?.message || "Unable to access camera/microphone");
        toast.error("Camera access denied");
      });
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open && stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [open, stream]);

  const toggleCam = () => {
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => (t.enabled = !camOn));
    setCamOn(!camOn);
  };
  const toggleMic = () => {
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = !micOn));
    setMicOn(!micOn);
  };

  return (
    <>
      <Button size={size} variant={variant} onClick={() => setOpen(true)}>
        <Camera className="h-4 w-4" /> {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Camera & Microphone Test</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
            {error ? (
              <div className="flex h-full items-center justify-center p-6 text-center text-sm text-destructive-foreground bg-destructive/80">
                {error}. Please grant permission in your browser settings.
              </div>
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            )}
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button variant={camOn ? "outline" : "destructive"} size="icon" onClick={toggleCam} disabled={!stream}>
              {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            <Button variant={micOn ? "outline" : "destructive"} size="icon" onClick={toggleMic} disabled={!stream}>
              {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}