import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import {
  useMyCandidateProfile,
  useUpdateCandidateProfile,
  useUploadResume,
  useRemoveResume,
} from "@/api/candidate";

import { useUploadAvatar } from "@/api/auth";
import { resolveUploadUrl } from "@/lib/api";

import {
  Camera,
  Upload,
  FileText,
  X,
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Download,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/LoadingSpinner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Education } from "@/types/api";
import { VerificationSettingsCard } from "@/components/candidate/VerificationSettingsCard";

export default function Profile() {
  const { user, updateUser } = useAuth();

  // =========================
  // API / React Query
  // =========================

  const { data: profile, isLoading } = useMyCandidateProfile();

  const updateProfile = useUpdateCandidateProfile();

  const uploadResume = useUploadResume();

  const removeResume = useRemoveResume();

  const uploadAvatar = useUploadAvatar();

  // =========================
  // Personal Information
  // =========================

  const [form, setForm] = useState({
    name: user?.fullName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });

  // =========================
  // Skills
  // =========================

  const [newSkill, setNewSkill] = useState("");

  const [skills, setSkills] = useState<string[]>([]);

  // =========================
  // Education
  // =========================

  const [educations, setEducations] = useState<Education[]>([]);

  const [eduOpen, setEduOpen] = useState(false);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [eduForm, setEduForm] = useState<Education>({
    degree: "",
    institution: "",
    fieldOfStudy: "",
    startYear: undefined,
    endYear: undefined,
  });

  // =========================
  // Resume
  // =========================

  const [resumeOpen, setResumeOpen] = useState(false);

  // =========================
  // File References
  // =========================

  const fileRef = useRef<HTMLInputElement>(null);

  const resumeInputRef = useRef<HTMLInputElement>(null);

  // =========================
  // Load Profile Data
  // =========================

  useEffect(() => {
    if (!profile) return;

    setSkills(profile.skills ?? []);

    setEducations(profile.education ?? []);

    const profileUser =
      typeof profile.userId === "object"
        ? profile.userId
        : null;

    setForm({
      name:
        profileUser?.fullName ??
        user?.fullName ??
        "",

      email:
        profileUser?.email ??
        user?.email ??
        "",

      phone:
        profileUser?.phone ??
        user?.phone ??
        "",
    });
  }, [profile, user]);

  // =========================
  // Education
  // =========================

  const openAddEdu = () => {
    setEditingIndex(null);

    setEduForm({
      degree: "",
      institution: "",
      fieldOfStudy: "",
      startYear: undefined,
      endYear: undefined,
    });

    setEduOpen(true);
  };

  const openEditEdu = (index: number) => {
    setEditingIndex(index);

    setEduForm(educations[index]);

    setEduOpen(true);
  };

  const persistEducation = (next: Education[]) => {
    setEducations(next);

    updateProfile.mutate(
      {
        education: next,
      },
      {
        onError: (err) => {
          toast.error(
            err instanceof Error
              ? err.message
              : "Failed to save education"
          );
        },
      }
    );
  };

  const saveEdu = () => {
    if (
      !eduForm.degree?.trim() ||
      !eduForm.institution?.trim()
    ) {
      toast.error(
        "Degree and institution are required"
      );

      return;
    }

    if (editingIndex !== null) {
      const next = educations.map(
        (education, index) =>
          index === editingIndex
            ? eduForm
            : education
      );

      persistEducation(next);

      toast.success("Education updated");
    } else {
      persistEducation([
        ...educations,
        eduForm,
      ]);

      toast.success("Education added");
    }

    setEduOpen(false);
  };

  const deleteEdu = (index: number) => {
    const next = educations.filter(
      (_, educationIndex) =>
        educationIndex !== index
    );

    persistEducation(next);

    toast.success("Education removed");
  };

  // =========================
  // Skills
  // =========================

  const saveSkills = (next: string[]) => {
    setSkills(next);

    updateProfile.mutate(
      {
        skills: next,
      },
      {
        onError: (err) => {
          toast.error(
            err instanceof Error
              ? err.message
              : "Failed to save skills"
          );
        },
      }
    );
  };

  const handleAddSkill = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const skill = newSkill.trim();

    if (!skill) return;

    if (skills.includes(skill)) {
      toast.error("Skill already exists");

      return;
    }

    saveSkills([
      ...skills,
      skill,
    ]);

    setNewSkill("");
  };

  const handleRemoveSkill = (
    skillToRemove: string
  ) => {
    saveSkills(
      skills.filter(
        (skill) => skill !== skillToRemove
      )
    );
  };

  // =========================
  // Resume Upload
  // =========================

  const handleResumeUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Maximum 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        "File too large (max 5MB)"
      );

      e.target.value = "";

      return;
    }

    // Allowed extensions
    const fileName =
      file.name.toLowerCase();

    const isValidFile =
      fileName.endsWith(".pdf") ||
      fileName.endsWith(".doc") ||
      fileName.endsWith(".docx");

    if (!isValidFile) {
      toast.error(
        "Please upload a PDF or DOCX resume"
      );

      e.target.value = "";

      return;
    }

    uploadResume.mutate(file, {
      onSuccess: (updated) => {
        setSkills(
          updated.skills ?? []
        );

        toast.success(
          "Resume uploaded and parsed successfully"
        );
      },

      onError: (err) => {
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to upload resume"
        );
      },
    });

    e.target.value = "";
  };

  // =========================
  // Remove Resume
  // =========================

  const handleRemoveResume = () => {
    if (!profile?.resumeURL) {
      toast.error("No resume found");

      return;
    }

    removeResume.mutate(undefined, {
      onSuccess: () => {
        setResumeOpen(false);

        toast.success(
          "Resume removed successfully"
        );
      },

      onError: (err) => {
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to remove resume"
        );
      },
    });
  };

  // =========================
  // Save Basic Information
  // =========================

  const saveBasicInfo = () => {
    updateProfile.mutate(
      {
        fullName: form.name,
        phone: form.phone,
      },
      {
        onSuccess: () => {
          updateUser({
            fullName: form.name,
            phone: form.phone,
          });

          toast.success(
            "Profile saved successfully"
          );
        },

        onError: (err) => {
          toast.error(
            err instanceof Error
              ? err.message
              : "Failed to save profile"
          );
        },
      }
    );
  };

  // =========================
  // Profile Picture
  // =========================

  const handleAvatarChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Maximum 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error(
        "Image too large (max 2MB)"
      );

      e.target.value = "";

      return;
    }

    uploadAvatar.mutate(file, {
      onSuccess: (updated) => {
        updateUser({
          profileImage:
            updated.profileImage,
        });

        toast.success(
          "Profile photo updated"
        );
      },

      onError: (err) => {
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to upload photo"
        );
      },
    });

    e.target.value = "";
  };

  // =========================
  // Loading
  // =========================

  if (isLoading) {
    return (
      <LoadingSpinner
        label="Loading profile..."
      />
    );
  }

  // =========================
  // Resume Information
  // =========================

  const resumeName =
    profile?.resumeURL
      ? profile.resumeURL
          .split("/")
          .pop()
      : null;

  const resumeUrl =
    resolveUploadUrl(
      profile?.resumeURL
    );

  // =========================
  // Profile Completion
  // =========================

  const completionItems = [
    Boolean(form.name),
    Boolean(form.email),
    Boolean(form.phone),
    skills.length > 0,
    educations.length > 0,
    Boolean(profile?.resumeURL),
  ];

  const completion = Math.round(
    (completionItems.filter(Boolean)
      .length /
      completionItems.length) *
      100
  );
console.log("USER IMAGE:", user?.profileImage);

console.log(
  "PROFILE IMAGE:",
  typeof profile?.userId === "object"
    ? profile.userId.profileImage
    : "NO PROFILE USER"
);

console.log(
  "IMAGE URL:",
  typeof profile?.userId === "object"
    ? `http://localhost:5000${profile.userId.profileImage || ""}`
    : `http://localhost:5000${user?.profileImage || ""}`
);
  // =========================
  // UI
  // =========================

  return (
    <div className="max-w-4xl mx-auto">

      {/* =====================================
          PAGE HEADER
      ====================================== */}

      <PageHeader
        title="My Profile"
        description="Keep your profile up to date to attract recruiters."
      />

      {/* =====================================
          PROFILE COMPLETION
      ====================================== */}

      <Card className="shadow-soft mb-6">

        <CardContent className="p-6">

          <div className="flex items-center justify-between mb-2">

            <span className="text-sm font-medium">
              Profile completion
            </span>

            <span className="text-sm text-primary font-semibold">
              {completion}%
            </span>

          </div>

          <Progress
            value={completion}
            className="h-2"
          />

          <p className="text-xs text-muted-foreground mt-2">
            Add your resume, skills and education
            to complete your profile.
          </p>

        </CardContent>

      </Card>

      {/* =====================================
          MAIN GRID
      ====================================== */}

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ===================================
            PROFILE CARD
        ==================================== */}

        <Card className="shadow-soft lg:col-span-1">

          <CardContent className="p-6 text-center">

            <div className="relative inline-block">

              <Avatar className="h-28 w-28 mx-auto">

              <AvatarImage
              src={
                typeof profile?.userId === "object"
              ? `http://localhost:5000${profile.userId.profileImage || ""}`
              : `http://localhost:5000${user?.profileImage || ""}`
                  }
               />

              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
              {form.name
              ?.split(" ")
              .map((name) => name[0])
               .join("")
              .toUpperCase()}
               </AvatarFallback>

              </Avatar>

              {/* Camera Button */}

              <button
                type="button"
                onClick={() =>
                  fileRef.current?.click()
                }
                disabled={
                  uploadAvatar.isPending
                }
                className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 transition"
              >

                <Camera className="h-4 w-4" />

              </button>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={
                  handleAvatarChange
                }
              />

            </div>

            <h3 className="font-semibold text-lg mt-4">
              {user?.fullName}
            </h3>

            <p className="text-sm text-muted-foreground">
              Candidate
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              {user?.email}
            </p>

          </CardContent>

        </Card>

        {/* ===================================
            PERSONAL INFORMATION
        ==================================== */}

        <Card className="shadow-soft lg:col-span-2">

          <CardHeader>

            <CardTitle className="text-lg">
              Personal Information
            </CardTitle>

          </CardHeader>

          <CardContent className="space-y-4">

            <div className="grid sm:grid-cols-2 gap-4">

              {/* Full Name */}

              <div>

                <Label>
                  Full name
                </Label>

                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  className="mt-1.5"
                  placeholder="Enter your full name"
                />

              </div>

              {/* Email */}

              <div>

                <Label>
                  Email
                </Label>

                <Input
                  value={form.email}
                  disabled
                  className="mt-1.5"
                />

              </div>

              {/* Phone */}

              <div>

                <Label>
                  Phone
                </Label>

                <Input
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value,
                    })
                  }
                  className="mt-1.5"
                  placeholder="Enter your phone number"
                />

              </div>

            </div>

            <Button
              onClick={saveBasicInfo}
              disabled={
                updateProfile.isPending
              }
            >

              {updateProfile.isPending
                ? "Saving..."
                : "Save Changes"}

            </Button>

          </CardContent>

        </Card>

        {/* ===================================
            SKILLS
        ==================================== */}

        <Card className="shadow-soft lg:col-span-3">

          <CardHeader>

            <CardTitle className="text-lg">
              Skills
            </CardTitle>

          </CardHeader>

          <CardContent>

            {/* Existing Skills */}

            <div className="flex flex-wrap gap-2 mb-4">

              {skills.map((skill) => (

                <Badge
                  key={skill}
                  variant="secondary"
                  className="gap-1.5 py-1.5 px-3"
                >

                  {skill}

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveSkill(
                        skill
                      )
                    }
                    className="hover:text-destructive"
                    title="Remove skill"
                  >

                    <X className="h-3 w-3" />

                  </button>

                </Badge>

              ))}

              {skills.length === 0 && (

                <p className="text-sm text-muted-foreground">
                  No skills added yet.
                </p>

              )}

            </div>

            {/* Add Skill */}

            <form
              className="flex gap-2"
              onSubmit={
                handleAddSkill
              }
            >

              <Input
                placeholder="Add a skill"
                value={newSkill}
                onChange={(e) =>
                  setNewSkill(
                    e.target.value
                  )
                }
              />

              <Button
                type="submit"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>

            </form>

          </CardContent>

        </Card>

        {/* ===================================
            RESUME / CV
        ==================================== */}

        <Card className="shadow-soft lg:col-span-3">

          <CardHeader>

            <CardTitle className="text-lg">
              Resume / CV
            </CardTitle>

          </CardHeader>

          <CardContent>

            {resumeName ? (

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border">

                {/* Resume Icon */}

                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">

                  <FileText className="h-7 w-7 text-primary" />

                </div>

                {/* Resume Information */}

                <div className="flex-1 min-w-0">

                  <p className="font-medium text-sm truncate">
                    {resumeName}
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    Uploaded and parsed by AI
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Skills automatically merged
                  </p>

                </div>

                {/* Resume Actions */}

                <div className="flex items-center gap-2">

                  {/* VIEW */}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setResumeOpen(true)
                    }
                  >

                    <Eye className="h-4 w-4 mr-1" />

                    View

                  </Button>

                  {/* REPLACE */}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      resumeInputRef.current?.click()
                    }
                    disabled={
                      uploadResume.isPending
                    }
                  >

                    <Upload className="h-4 w-4 mr-1" />

                    Replace

                  </Button>

                  {/* REMOVE */}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={
                      handleRemoveResume
                    }
                    disabled={
                      removeResume.isPending
                    }
                    className="text-destructive hover:text-destructive"
                  >

                    <Trash2 className="h-4 w-4 mr-1" />

                    {removeResume.isPending
                      ? "Removing..."
                      : "Remove"}

                  </Button>

                </div>

              </div>

            ) : (

              /* Upload Box */

              <button
                type="button"
                onClick={() =>
                  resumeInputRef.current?.click()
                }
                disabled={
                  uploadResume.isPending
                }
                className="w-full p-8 rounded-xl border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-colors text-center"
              >

                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />

                <p className="font-medium">

                  {uploadResume.isPending
                    ? "Uploading..."
                    : "Click to upload resume"}

                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  PDF or DOCX (max 5MB)
                </p>

              </button>

            )}

            {/* Hidden Resume Input */}

            <input
              ref={resumeInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf"
              hidden
              onChange={
                handleResumeUpload
              }
            />

          </CardContent>

        </Card>

        {/* ===================================
            VERIFICATION (GitHub + Certificates)
        ==================================== */}

        {user?._id && (
          <VerificationSettingsCard candidateId={user._id} profile={profile} />
        )}

        {/* ===================================
            EDUCATION
        ==================================== */}

        <Card className="shadow-soft lg:col-span-3">

          <CardHeader className="flex-row items-center justify-between space-y-0">

            <CardTitle className="text-lg flex items-center gap-2">

              <GraduationCap className="h-5 w-5 text-primary" />

              Education

            </CardTitle>

            <Button
              size="sm"
              onClick={openAddEdu}
            >

              <Plus className="h-4 w-4 mr-1" />

              Add Education

            </Button>

          </CardHeader>

          <CardContent>

            {educations.length === 0 ? (

              <p className="text-sm text-muted-foreground text-center py-6">
                No education added yet.
              </p>

            ) : (

              <div className="space-y-3">

                {educations.map(
                  (education, index) => (

                    <div
                      key={index}
                      className="flex items-start justify-between gap-3 p-4 rounded-xl border hover:bg-accent/30 transition-colors"
                    >

                      {/* Education Info */}

                      <div className="flex gap-3 flex-1">

                        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">

                          <GraduationCap className="h-5 w-5" />

                        </div>

                        <div className="flex-1 min-w-0">

                          <p className="font-medium">
                            {education.degree}
                          </p>

                          <p className="text-sm text-muted-foreground truncate">
                            {education.institution}
                          </p>

                          <p className="text-xs text-muted-foreground mt-0.5">

                            {education.fieldOfStudy && (
                              <span>
                                {education.fieldOfStudy}
                                {" · "}
                              </span>
                            )}

                            {education.startYear ??
                              "—"}

                            {" – "}

                            {education.endYear ??
                              "—"}

                          </p>

                        </div>

                      </div>

                      {/* Education Actions */}

                      <div className="flex gap-1">

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            openEditEdu(
                              index
                            )
                          }
                          title="Edit"
                        >

                          <Pencil className="h-4 w-4" />

                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            deleteEdu(
                              index
                            )
                          }
                          title="Delete"
                        >

                          <Trash2 className="h-4 w-4 text-destructive" />

                        </Button>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </CardContent>

        </Card>

      </div>

      {/* =====================================
          EDUCATION DIALOG
      ====================================== */}

      <Dialog
        open={eduOpen}
        onOpenChange={setEduOpen}
      >

        <DialogContent>

          <DialogHeader>

            <DialogTitle>

              {editingIndex !== null
                ? "Edit Education"
                : "Add Education"}

            </DialogTitle>

          </DialogHeader>

          <div className="space-y-4 py-2">

            {/* Degree */}

            <div>

              <Label>
                Degree *
              </Label>

              <Input
                className="mt-1.5"
                placeholder="e.g. BS Computer Science"
                value={
                  eduForm.degree ?? ""
                }
                onChange={(e) =>
                  setEduForm({
                    ...eduForm,
                    degree:
                      e.target.value,
                  })
                }
              />

            </div>

            {/* Institution */}

            <div>

              <Label>
                Institution *
              </Label>

              <Input
                className="mt-1.5"
                placeholder="e.g. BZU"
                value={
                  eduForm.institution ?? ""
                }
                onChange={(e) =>
                  setEduForm({
                    ...eduForm,
                    institution:
                      e.target.value,
                  })
                }
              />

            </div>

            {/* Field */}

            <div>

              <Label>
                Field of Study
              </Label>

              <Input
                className="mt-1.5"
                placeholder="e.g. Information Technology"
                value={
                  eduForm.fieldOfStudy ??
                  ""
                }
                onChange={(e) =>
                  setEduForm({
                    ...eduForm,
                    fieldOfStudy:
                      e.target.value,
                  })
                }
              />

            </div>

            {/* Years */}

            <div className="grid grid-cols-2 gap-4">

              <div>

                <Label>
                  Start Year
                </Label>

                <Input
                  type="number"
                  className="mt-1.5"
                  placeholder="2020"
                  value={
                    eduForm.startYear ??
                    ""
                  }
                  onChange={(e) =>
                    setEduForm({
                      ...eduForm,
                      startYear:
                        e.target.value
                          ? Number(
                              e.target.value
                            )
                          : undefined,
                    })
                  }
                />

              </div>

              <div>

                <Label>
                  End Year
                </Label>

                <Input
                  type="number"
                  className="mt-1.5"
                  placeholder="2024"
                  value={
                    eduForm.endYear ??
                    ""
                  }
                  onChange={(e) =>
                    setEduForm({
                      ...eduForm,
                      endYear:
                        e.target.value
                          ? Number(
                              e.target.value
                            )
                          : undefined,
                    })
                  }
                />

              </div>

            </div>

          </div>

          <DialogFooter>

            <Button
              variant="outline"
              onClick={() =>
                setEduOpen(false)
              }
            >
              Cancel
            </Button>

            <Button
              onClick={saveEdu}
            >
              {editingIndex !== null
                ? "Save Changes"
                : "Add"}
            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

      {/* =====================================
          RESUME VIEW DIALOG
      ====================================== */}

      <Dialog
        open={resumeOpen}
        onOpenChange={setResumeOpen}
      >

        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0">

          {/* Header */}

          <DialogHeader className="p-4 border-b flex-row items-center justify-between space-y-0">

            <div className="flex items-center gap-3 min-w-0">

              <FileText className="h-5 w-5 text-primary shrink-0" />

              <div className="min-w-0">

                <DialogTitle className="truncate text-base">
                  {resumeName}
                </DialogTitle>

                <p className="text-xs text-muted-foreground mt-1">
                  Resume / CV
                </p>

              </div>

            </div>

            {/* Download */}

            {resumeUrl && (

              <a
                href={resumeUrl}
                download={
                  resumeName ??
                  "resume"
                }
                target="_blank"
                rel="noreferrer"
              >

                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                >

                  <Download className="h-4 w-4 mr-1" />

                  Download

                </Button>

              </a>

            )}

          </DialogHeader>

          {/* Resume Preview */}

          <div className="flex-1 overflow-hidden bg-muted/30">

            {resumeUrl ? (

              <iframe
                src={resumeUrl}
                title={
                  resumeName ??
                  "Resume"
                }
                className="w-full h-full border-0"
              />

            ) : (

              <div className="h-full flex items-center justify-center">

                <div className="text-center">

                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-3" />

                  <p className="font-medium">
                    Resume not available
                  </p>

                </div>

              </div>

            )}

          </div>

        </DialogContent>

      </Dialog>

    </div>
  );
}