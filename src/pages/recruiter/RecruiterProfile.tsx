import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, Building2, Mail, Phone, MapPin, Briefcase, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function RecruiterProfile() {
  const { user, updateUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "+1 555-0199",
    location: user?.location ?? "New York, NY",
    title: user?.title ?? "Senior Recruiter",
    company: (user as any)?.company ?? "Acme Inc.",
    about: user?.about ?? "Hiring world-class engineers for fast-growing teams.",
  });

  // Real-time: push every change immediately to AuthContext (sidebar/topbar update instantly)
  useEffect(() => {
    updateUser({
      name: form.name,
      email: form.email,
      phone: form.phone,
      location: form.location,
      title: form.title,
      about: form.about,
    });
  }, [form]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    updateUser({ avatar: url });
    toast.success("Photo updated");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="My Profile" description="Changes save automatically as you type." />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="shadow-soft lg:col-span-1">
          <CardContent className="p-6 text-center">
            <div className="relative inline-block">
              <Avatar className="h-28 w-28 ">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
                  {form.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
            </div>
            <h3 className="font-semibold text-lg mt-4">{form.name || "Your name"}</h3>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-1">
              <Briefcase className="h-3.5 w-3.5" /> {form.title}
            </p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 mt-1">
              <Building2 className="h-3.5 w-3.5" /> {form.company}
            </p>
            <div className="mt-4 space-y-2 text-left text-sm">
              <p className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {form.email}</p>
              <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {form.phone}</p>
              <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {form.location}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Personal Information
              <span className="text-xs font-normal text-success flex items-center gap-1"><Save className="h-3 w-3" /> Auto-saved</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Full name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Company</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="mt-1.5" /></div>
            </div>
            <div><Label>About</Label><Textarea value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} className="mt-1.5" rows={4} /></div>
            <Button onClick={() => toast.success("Profile saved")}>
              <Save className="h-4 w-4" /> Save manually
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}