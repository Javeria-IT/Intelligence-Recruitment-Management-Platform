import { useState } from "react";
import { savedJobs as initialSaved } from "@/data/applications";
import { jobs } from "@/data/jobs";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { Bookmark, MapPin, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function SavedJobs() {
  const [saved, setSaved] = useState(initialSaved);
  const list = jobs.filter((j) => saved.includes(j.id));

  const remove = (id: string) => {
    setSaved(saved.filter(s => s !== id));
    toast.success("Removed from saved");
  };

  return (
    <div>
      <PageHeader title="Saved Jobs" description={`${list.length} jobs saved for later`} />
      {list.length === 0 ? (
        <EmptyState icon={Bookmark} title="No saved jobs" description="Save jobs you're interested in to find them here later." />
      ) : (
        <div className="grid gap-4">
          {list.map((j) => (
            <Card key={j.id} className="shadow-soft">
              <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-start">
                <img src={j.companyLogo} alt={j.company} className="h-12 w-12 rounded-lg bg-muted object-contain p-1.5" />
                <div className="flex-1">
                  <Link to={`/candidate/jobs/${j.id}`} className="font-semibold hover:text-primary">{j.title}</Link>
                  <p className="text-sm text-muted-foreground">{j.company}</p>
                  <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {j.location}</span>
                    <span>{j.salary}</span>
                    <Badge variant="outline" className="text-[10px]">{j.type}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild><Link to={`/candidate/jobs/${j.id}`}><ExternalLink className="h-3 w-3 mr-1" /> View</Link></Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(j.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
