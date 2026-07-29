import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, Upload, FileText, X, GraduationCap, Plus, Pencil, Trash2, Eye, Download } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Education {
  id: string;
  degree: string;
  college: string;
  field?: string;
  startYear: string;
  endYear: string;
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "+1 555-0100",
    location: user?.location ?? "San Francisco, CA",
    title: user?.title ?? "",
    about: user?.about ?? "Passionate engineer building delightful products.",
  });
  const [skills, setSkills] = useState(["React", "TypeScript", "Node.js", "MongoDB", "Tailwind CSS"]);
  const [newSkill, setNewSkill] = useState("");
  const [photo, setPhoto] = useState<string | undefined>(user?.avatar);
  const [resume, setResume] = useState<{ name: string; url: string; size: string; type: string; uploadedAt: string } | null>(null);
  const [resumeOpen, setResumeOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5MB)");
      return;
    }
    const url = URL.createObjectURL(file);
    setResume({
      name: file.name,
      url,
      size: formatSize(file.size),
      type: file.type || "application/octet-stream",
      uploadedAt: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    });
    toast.success("Resume uploaded");
    e.target.value = "";
  };

  const [educations, setEducations] = useState<Education[]>([
    { id: "e1", degree: "BS Computer Science", college: "Stanford University", field: "Computer Science", startYear: "2016", endYear: "2020" },
    { id: "e2", degree: "High School Diploma", college: "Lincoln High School", field: "Science", startYear: "2012", endYear: "2016" },
  ]);
  const [eduOpen, setEduOpen] = useState(false);
  const [editingEdu, setEditingEdu] = useState<Education | null>(null);
  const [eduForm, setEduForm] = useState<Omit<Education, "id">>({ degree: "", college: "", field: "", startYear: "", endYear: "" });

  const openAddEdu = () => {
    setEditingEdu(null);
    setEduForm({ degree: "", college: "", field: "", startYear: "", endYear: "" });
    setEduOpen(true);
  };
  const openEditEdu = (e: Education) => {
    setEditingEdu(e);
    setEduForm({ degree: e.degree, college: e.college, field: e.field, startYear: e.startYear, endYear: e.endYear });
    setEduOpen(true);
  };
  const saveEdu = () => {
    if (!eduForm.degree.trim() || !eduForm.college.trim()) {
      toast.error("Degree and college are required");
      return;
    }
    if (editingEdu) {
      setEducations(educations.map((e) => (e.id === editingEdu.id ? { ...editingEdu, ...eduForm } : e)));
      toast.success("Education updated");
    } else {
      setEducations([...educations, { id: `e${Date.now()}`, ...eduForm }]);
      toast.success("Education added");
    }
    setEduOpen(false);
  };
  const deleteEdu = (id: string) => {
    setEducations(educations.filter((e) => e.id !== id));
    toast.success("Education removed");
  };

  const completion = 75;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="My Profile" description="Keep your profile up to date to attract recruiters." />

      <Card className="shadow-soft mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Profile completion</span>
            <span className="text-sm text-primary font-semibold">{completion}%</span>
          </div>
          <Progress value={completion} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">Add a portfolio link to reach 100%</p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="shadow-soft lg:col-span-1">
          <CardContent className="p-6 text-center">
            <div className="relative inline-block">
              <Avatar className="h-28 w-28 mx-auto">
                <AvatarImage src={photo} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
                  {user?.name?.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const url = URL.createObjectURL(f);
                  setPhoto(url);
                  updateUser({ avatar: url });
                  toast.success("Photo updated");
                }
              }} />
            </div>
            <h3 className="font-semibold text-lg mt-4">{user?.name}</h3>
            <p className="text-sm text-muted-foreground">{user?.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Full name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1.5" /></div>
            </div>
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1.5" /></div>
            <div><Label>About</Label><Textarea value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} className="mt-1.5" rows={3} /></div>
            <Button onClick={() => {
              updateUser({ name: form.name, email: form.email, phone: form.phone, location: form.location, title: form.title, about: form.about });
              toast.success("Profile saved");
            }}>Save Changes</Button>
          </CardContent>
        </Card>

        <Card className="shadow-soft lg:col-span-3">
          <CardHeader><CardTitle className="text-lg">Skills</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1.5 py-1.5 px-3">
                  {s}
                  <button onClick={() => setSkills(skills.filter(k => k !== s))}><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
            <form className="flex gap-2" onSubmit={(e) => {
              e.preventDefault();
              if (newSkill.trim() && !skills.includes(newSkill)) {
                setSkills([...skills, newSkill.trim()]); setNewSkill("");
              }
            }}>
              <Input placeholder="Add a skill" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} />
              <Button type="submit">Add</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-soft lg:col-span-3">
          <CardHeader><CardTitle className="text-lg">Resume / CV</CardTitle></CardHeader>
          <CardContent>
            {resume ? (
              <div className="flex items-center gap-3 p-4 rounded-xl border">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{resume.name}</p>
                  <p className="text-xs text-muted-foreground">Uploaded {resume.uploadedAt} · {resume.size}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setResumeOpen(true)}>
                  <Eye className="h-4 w-4" /> View
                </Button>
                <Button variant="ghost" size="icon" onClick={() => resumeInputRef.current?.click()} title="Replace">
                  <Upload className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => {
                  URL.revokeObjectURL(resume.url);
                  setResume(null);
                  toast.success("Resume removed");
                }} title="Remove">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button onClick={() => resumeInputRef.current?.click()} className="w-full p-8 rounded-xl border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-colors text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="font-medium">Click to upload resume</p>
                <p className="text-xs text-muted-foreground">PDF or image (max 5MB)</p>
              </button>
            )}
            <input
              ref={resumeInputRef}
              type="file"
              accept="application/pdf,image/*"
              hidden
              onChange={handleResumeUpload}
            />
          </CardContent>
        </Card>

        <Card className="shadow-soft lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" /> Education
            </CardTitle>
            <Button size="sm" onClick={openAddEdu}>
              <Plus className="h-4 w-4" /> Add Education
            </Button>
          </CardHeader>
          <CardContent>
            {educations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No education added yet.</p>
            ) : (
              <div className="space-y-3">
                {educations.map((e) => (
                  <div key={e.id} className="flex items-start justify-between gap-3 p-4 rounded-xl border hover:bg-accent/30 transition-colors">
                    <div className="flex gap-3 flex-1">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{e.degree}</p>
                        <p className="text-sm text-muted-foreground truncate">{e.college}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {e.field && <span>{e.field} · </span>}
                          {e.startYear} – {e.endYear}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditEdu(e)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteEdu(e.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={eduOpen} onOpenChange={setEduOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEdu ? "Edit Education" : "Add Education"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Degree *</Label>
              <Input className="mt-1.5" placeholder="e.g. BS Computer Science"
                value={eduForm.degree} onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })} />
            </div>
            <div>
              <Label>College / University *</Label>
              <Input className="mt-1.5" placeholder="e.g. Stanford University"
                value={eduForm.college} onChange={(e) => setEduForm({ ...eduForm, college: e.target.value })} />
            </div>
            <div>
              <Label>Field of Study</Label>
              <Input className="mt-1.5" placeholder="e.g. Computer Science"
                value={eduForm.field} onChange={(e) => setEduForm({ ...eduForm, field: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Year</Label>
                <Input className="mt-1.5" placeholder="2020" value={eduForm.startYear}
                  onChange={(e) => setEduForm({ ...eduForm, startYear: e.target.value })} />
              </div>
              <div>
                <Label>End Year</Label>
                <Input className="mt-1.5" placeholder="2024" value={eduForm.endYear}
                  onChange={(e) => setEduForm({ ...eduForm, endYear: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEduOpen(false)}>Cancel</Button>
            <Button onClick={saveEdu}>{editingEdu ? "Save Changes" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resumeOpen} onOpenChange={setResumeOpen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <DialogTitle className="truncate text-base">{resume?.name}</DialogTitle>
                {resume && (
                  <p className="text-xs text-muted-foreground">{resume.size} · Uploaded {resume.uploadedAt}</p>
                )}
              </div>
            </div>
            {resume && (
              <a href={resume.url} download={resume.name}>
                <Button variant="outline" size="sm" type="button">
                  <Download className="h-4 w-4" /> Download
                </Button>
              </a>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-muted/30">
            {resume ? (
              resume.type.startsWith("image/") ? (
                <div className="h-full w-full overflow-auto flex items-center justify-center p-4">
                  <img src={resume.url} alt={resume.name} className="max-w-full max-h-full object-contain" />
                </div>
              ) : resume.type === "application/pdf" ? (
                <iframe src={resume.url} title={resume.name} className="w-full h-full border-0" />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <FileText className="h-16 w-16 text-muted-foreground mb-3" />
                  <p className="font-medium">Preview not available</p>
                  <p className="text-sm text-muted-foreground mb-4">This file type can't be previewed in the browser.</p>
                  <a href={resume.url} download={resume.name}>
                    <Button><Download className="h-4 w-4" /> Download to view</Button>
                  </a>
                </div>
              )
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
