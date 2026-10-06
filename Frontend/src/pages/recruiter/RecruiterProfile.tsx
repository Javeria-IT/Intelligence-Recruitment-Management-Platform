import { useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile, useUploadAvatar } from "@/api/auth";
import { resolveUploadUrl } from "@/lib/api";
import { Camera } from "lucide-react";
import { toast } from "sonner";

export default function RecruiterProfile() {
  const { user, updateUser } = useAuth();

  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    // Personal Information
    fullName: user?.fullName ?? "",
    phone: user?.phone ?? "",

    // Company Information
    companyName: user?.companyName ?? "",
    companyWebsite: user?.companyWebsite ?? "",
    industry: user?.industry ?? "",
    companyLocation: user?.companyLocation ?? "",
    companyDescription: user?.companyDescription ?? "",

    // Recruiter Information
    jobTitle: user?.jobTitle ?? "",
    department: user?.department ?? "",
    yearsOfExperience: user?.yearsOfExperience ?? "",
    linkedinProfile: user?.linkedinProfile ?? "",
  });

  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
) => {
  const { name, value } = e.target;

  setForm((prev) => ({
    ...prev,
    [name]:
      name === "yearsOfExperience"
        ? value === ""
          ? ""
          : Number(value)
        : value,
  }));
};
  const handleAvatarChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large (max 2MB)");
      return;
    }

    uploadAvatar.mutate(file, {
      onSuccess: (updated) => {
        updateUser({
          profileImage: updated.profileImage,
        });

        toast.success("Profile photo updated");
      },

      onError: (err) =>
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to upload photo"
        ),
    });

    e.target.value = "";
  };

  const saveBasicInfo = () => {
    updateProfile.mutate(form, {
      onSuccess: (updated) => {
        updateUser({
          fullName: updated.fullName,
          phone: updated.phone,

          companyName: updated.companyName,
          companyWebsite: updated.companyWebsite,
          industry: updated.industry,
          companyLocation: updated.companyLocation,
          companyDescription: updated.companyDescription,

          jobTitle: updated.jobTitle,
          department: updated.department,
          yearsOfExperience: updated.yearsOfExperience,
          linkedinProfile: updated.linkedinProfile,
        });

        toast.success("Profile saved successfully");
      },

      onError: (err) =>
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to save profile"
        ),
    });
  };

  const initials =
    user?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2) || "R";

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <PageHeader
        title="Recruiter Profile"
        description="Manage your personal, company and recruiter information"
      />

      <Card className="shadow-soft">
        {/* ================= PROFILE IMAGE ================= */}
        <CardContent className="p-6 text-center border-b">
          <div className="relative inline-block">
            <Avatar className="h-24 w-24 mx-auto">
              <AvatarImage
                src={resolveUploadUrl(user?.profileImage)}
              />

              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadAvatar.isPending}
              className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90"
            >
              <Camera className="h-4 w-4" />
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarChange}
            />
          </div>

          <h3 className="font-semibold text-lg mt-4">
            {user?.fullName || "Recruiter"}
          </h3>

          <p className="text-xs text-muted-foreground">
            Recruiter
          </p>
        </CardContent>

        {/* ================= PERSONAL INFORMATION ================= */}
        <CardHeader>
          <CardTitle className="text-lg">
            Personal Information
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Full Name */}
          <div>
            <Label>
              Full Name <span className="text-red-500"></span>
            </Label>

            <Input
              name="fullName"
              className="mt-1.5"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
            />
          </div>

          {/* Email */}
          <div>
            <Label>
              Email <span className="text-red-500"></span>
            </Label>

            <Input
              value={user?.email ?? ""}
              disabled
              className="mt-1.5"
            />
          </div>

          {/* Phone */}
          <div>
            <Label>
              Phone Number <span className="text-red-500"></span>
            </Label>

            <Input
              name="phone"
              className="mt-1.5"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
          </div>
        </CardContent>

        {/* ================= COMPANY INFORMATION ================= */}
        <CardHeader className="border-t">
          <CardTitle className="text-lg">
            Company Information
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Company Name */}
          <div>
            <Label>
              Company Name <span className="text-red-500"></span>
            </Label>

            <Input
              name="companyName"
              className="mt-1.5"
              value={form.companyName}
              onChange={handleChange}
              placeholder="Enter company name"
            />
          </div>

          {/* Company Website */}
          <div>
            <Label>
              Company Website <span className="text-red-500"></span>
            </Label>

            <Input
              name="companyWebsite"
              type="url"
              className="mt-1.5"
              value={form.companyWebsite}
              onChange={handleChange}
              placeholder="https://example.com"
            />
          </div>

          {/* Industry */}
          <div>
            <Label>
              Industry <span className="text-red-500"></span>
            </Label>

            <Input
              name="industry"
              className="mt-1.5"
              value={form.industry}
              onChange={handleChange}
              placeholder="e.g. Software, IT, Finance"
            />
          </div>

          {/* Company Location */}
          <div>
            <Label>
              Company Location <span className="text-red-500"></span>
            </Label>

            <Input
              name="companyLocation"
              className="mt-1.5"
              value={form.companyLocation}
              onChange={handleChange}
              placeholder="e.g. Multan, Pakistan"
            />
          </div>

          {/* Company Description */}
          <div>
            <Label>
              Company Description <span className="text-red-500"></span>
            </Label>

            <Textarea
              name="companyDescription"
              className="mt-1.5 min-h-[120px]"
              value={form.companyDescription}
              onChange={handleChange}
              placeholder="Tell us about your company..."
            />
          </div>
        </CardContent>

        {/* ================= RECRUITER INFORMATION ================= */}
        <CardHeader className="border-t">
          <CardTitle className="text-lg">
            Recruiter Information
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Job Title */}
          <div>
            <Label>
              Job Title / Designation{" "}
              <span className="text-red-500"></span>
            </Label>

            <Input
              name="jobTitle"
              className="mt-1.5"
              value={form.jobTitle}
              onChange={handleChange}
              placeholder="e.g. HR Manager"
            />
          </div>

          {/* Department */}
          <div>
            <Label>
              Department <span className="text-red-500"></span>
            </Label>

            <Input
              name="department"
              className="mt-1.5"
              value={form.department}
              onChange={handleChange}
              placeholder="e.g. Human Resources"
            />
          </div>

          {/* Years of Experience */}
          <div>
            <Label>
              Years of Experience{" "}
              <span className="text-red-500"></span>
            </Label>

            <Input
              name="yearsOfExperience"
              type="number"
              min="0"
              className="mt-1.5"
              value={form.yearsOfExperience}
              onChange={handleChange}
              placeholder="e.g. 5"
            />
          </div>

          {/* LinkedIn */}
          <div>
            <Label>
              LinkedIn Profile{" "}
              <span className="text-red-500"></span>
            </Label>

            <Input
              name="linkedinProfile"
              type="url"
              className="mt-1.5"
              value={form.linkedinProfile}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/your-profile"
            />
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <Button
              onClick={saveBasicInfo}
              disabled={updateProfile.isPending}
              className="w-full sm:w-auto"
            >
              {updateProfile.isPending
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}