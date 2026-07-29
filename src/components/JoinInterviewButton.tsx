import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Camera, Mic, MicOff, VideoOff, Video, ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface Props {
  meetingLink: string;
  platform?: string;
  label?: string;
  size?: "sm" | "default";
  variant?: "default" | "outline";
}

/**
 * Two-step Join flow:
 *  1) Request camera + microphone permission and show a live preview.
 *  2) Only after permission is granted does the user get a "Join Meeting" CTA
 *     that opens the actual Google Meet / Zoom link.
 */
export function JoinInterviewButton({
  meetingLink,
  platform = "Meeting",
  label = "Join",
  size = "sm",
  variant = "default",
}: Props) {
  const [open, setOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [status, setStatus] = useState<"prompt" | "granted" | "denied">("prompt");
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setStatus("prompt");
    setError(null);
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((s) => {
        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
        setStatus("granted");
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch((err) => {
        setStatus("denied");
        setError(err?.message || "Permission denied");
        toast.error("Camera & microphone access is required to join");
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

  const joinNow = () => {
    window.open(meetingLink, "_blank", "noopener,noreferrer");
    setOpen(false);
    toast.success(`Opening ${platform}…`);
  };

  const retry = () => {
    setOpen(false);
    setTimeout(() => setOpen(true), 50);
  };

  return (
    <>
      <Button size={size} variant={variant} onClick={() => setOpen(true)}>
        {label} <ExternalLink className="h-3.5 w-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Permission check
            </DialogTitle>
            <DialogDescription>
              We need access to your camera and microphone before joining the {platform} call.
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
            {status === "denied" ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm">
                <VideoOff className="h-8 w-8 text-destructive" />
                <p className="text-destructive font-medium">Access blocked</p>
                <p className="text-muted-foreground">
                  {error}. Allow camera & mic in your browser site settings, then try again.
                </p>
              </div>
            ) : status === "prompt" ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-white/80 text-sm">
                <Camera className="h-8 w-8 animate-pulse" />
                Waiting for permission…
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant={camOn ? "outline" : "destructive"}
              size="icon"
              onClick={toggleCam}
              disabled={status !== "granted"}
            >
              {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            <Button
              variant={micOn ? "outline" : "destructive"}
              size="icon"
              onClick={toggleMic}
              disabled={status !== "granted"}
            >
              {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            {status === "denied" ? (
              <Button onClick={retry}>Retry permission</Button>
            ) : (
              <Button
                onClick={joinNow}
                disabled={status !== "granted"}
                className="bg-gradient-primary hover:opacity-90"
              >
                Join Meeting <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}