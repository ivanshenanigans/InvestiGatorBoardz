import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Upload } from "lucide-react";
import {
  useListProfiles, useUpdateProfile, useListCustomBanners,
  getListProfilesQueryKey, CustomBannerRecord, ProfileRecord,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BANNER_PRESETS, getBannerCss } from "@/lib/banners";
import { getBannerPatternStyle } from "@/lib/bannerPatterns";
import { ALL_TRAITS } from "@/lib/traits";

const AGE_GROUPS = ["9 below", "9-12", "13-15", "16-17", "18-20", "21+"] as const;

function cropToSquare(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = Math.min(img.width, img.height);
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("No canvas context")); return; }
        ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 256, 256);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function EditProfile() {
  const params = useParams<{ id: string }>();
  const profileId = parseInt(params.id, 10);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profiles } = useListProfiles();
  const { data: customBanners = [] } = useListCustomBanners();
  const updateProfile = useUpdateProfile();

  const profile = profiles?.find(p => p.id === profileId);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [ageGroup, setAgeGroup] = useState<string>("13-15");
  const [favoriteColor, setFavoriteColor] = useState("#FF0000");
  const [bio, setBio] = useState("");
  const [imageData, setImageData] = useState("");
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [bannerTab, setBannerTab] = useState<"presets" | "solid" | "custom">("presets");
  const [selectedBanner, setSelectedBanner] = useState<string | null>(null);
  const [solidColor, setSolidColor] = useState("#8b0000");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setUsername(profile.username);
      setAgeGroup(profile.ageGroup || "13-15");
      setFavoriteColor(profile.favoriteColor);
      setBio(profile.bio || "");
      setImageData(profile.imageData || "");
      setSelectedTraits(profile.traits || []);
      if (profile.banner) {
        setSelectedBanner(profile.banner);
        if (profile.banner.startsWith("#")) {
          setSolidColor(profile.banner);
          setBannerTab("solid");
        } else if (profile.banner.startsWith("custom:")) {
          setBannerTab("custom");
        }
      }
    }
  }, [profile]);

  if (!user) {
    return <div className="p-8 text-center font-mono text-red-500">NOT AUTHORIZED</div>;
  }

  if (profiles && profile && profile.userId !== user.id) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center space-y-4">
        <p className="text-2xl text-red-600 font-mono">ACCESS DENIED</p>
        <p className="text-sm text-muted-foreground font-mono">You can only edit your own profiles.</p>
        <Button onClick={() => setLocation("/")} variant="ghost">← BACK</Button>
      </div>
    );
  }

  const activeBanner = bannerTab === "solid" ? solidColor : selectedBanner;
  const bannerCss = (() => {
    if (!activeBanner || activeBanner === "none") return null;
    if (activeBanner.startsWith("custom:")) {
      const id = parseInt(activeBanner.slice(7), 10);
      const cb = (customBanners as CustomBannerRecord[]).find(b => b.id === id);
      return cb ? getBannerPatternStyle(cb.patternType, cb.primaryColor, cb.secondaryColor, cb.bgColor) : null;
    }
    if (activeBanner.startsWith("#")) return { background: activeBanner, height: "60px" };
    const css = getBannerCss(activeBanner);
    return Object.keys(css).length > 0 ? css : null;
  })();

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const cropped = await cropToSquare(file);
      setImageData(cropped);
    } catch {
      toast({ title: "Image error", variant: "destructive" });
    }
  }

  function toggleTrait(trait: string) {
    setSelectedTraits(prev =>
      prev.includes(trait)
        ? prev.filter(t => t !== trait)
        : prev.length >= 10 ? prev : [...prev, trait]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const bannerValue = bannerTab === "solid" ? solidColor : selectedBanner;
    try {
      await updateProfile.mutateAsync({
        id: profileId,
        data: {
          username,
          displayName,
          favoriteColor,
          bio,
          imageData,
          ageGroup,
          traits: selectedTraits,
          banner: bannerValue ?? null,
        },
      });
      queryClient.invalidateQueries({ queryKey: getListProfilesQueryKey() });
      toast({ title: "RECORD UPDATED", description: "Your ID has been updated." });
      setLocation("/");
    } catch (err: unknown) {
      toast({ title: "UPDATE FAILED", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <Button variant="ghost" onClick={() => setLocation("/")} className="mb-8 font-mono text-muted-foreground">
        <ArrowLeft className="mr-2 w-4 h-4" /> BACK
      </Button>
      <h1 className="text-4xl font-bold text-red-700 glitch-text uppercase tracking-widest mb-8" data-text="EDIT RECORD">
        EDIT RECORD
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5 border border-primary/20 bg-card/60 p-6">
          <div
            className="w-full h-16 cursor-pointer border border-dashed border-primary/30 flex items-center justify-center relative overflow-hidden"
            onClick={() => fileInputRef.current?.click()}
          >
            {imageData ? (
              <Avatar className="w-24 h-24 rounded-none absolute -left-0">
                <AvatarImage src={imageData} className="object-cover" />
                <AvatarFallback className="rounded-none bg-muted">?</AvatarFallback>
              </Avatar>
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <Upload className="w-5 h-5" />
                <span className="text-xs font-mono">UPLOAD VISUAL</span>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

          <div className="space-y-1">
            <label className="text-xs font-mono text-primary/70 uppercase">Username</label>
            <Input value={username} onChange={e => setUsername(e.target.value)} maxLength={30} className="font-mono" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-mono text-primary/70 uppercase">Display Name</label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={30} className="font-mono" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-mono text-primary/70 uppercase">Age Group</label>
            <Select value={ageGroup} onValueChange={setAgeGroup}>
              <SelectTrigger className="font-mono"><SelectValue /></SelectTrigger>
              <SelectContent>
                {AGE_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-mono text-primary/70 uppercase">Favorite Color</label>
            <div className="flex gap-2">
              <input type="color" value={favoriteColor} onChange={e => setFavoriteColor(e.target.value)} className="w-10 h-10 border border-primary/30 bg-transparent cursor-pointer" />
              <Input value={favoriteColor} onChange={e => setFavoriteColor(e.target.value)} className="font-mono" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-mono text-primary/70 uppercase">Bio <span className="text-muted-foreground">{bio.length}/75</span></label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={75} rows={3} className="font-mono resize-none" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-primary/70 uppercase">Traits <span className="text-muted-foreground">({selectedTraits.length}/10)</span></label>
            <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto pr-1">
              {ALL_TRAITS.map(trait => (
                <button
                  key={trait}
                  type="button"
                  onClick={() => toggleTrait(trait)}
                  className={`px-2 py-0.5 text-xs font-mono border transition-colors ${
                    selectedTraits.includes(trait)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-primary/30 text-muted-foreground hover:border-primary hover:text-foreground"
                  }`}
                >
                  {trait}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-primary/70 uppercase">ID Banner</label>
            <div className="flex border border-primary/20 overflow-hidden">
              {(["presets", "solid", "custom"] as const).map(tab => (
                <button key={tab} type="button" onClick={() => setBannerTab(tab)}
                  className={`flex-1 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                    bannerTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}>
                  {tab}
                </button>
              ))}
            </div>

            {bannerTab === "presets" && (
              <div className="grid grid-cols-4 gap-1">
                <button type="button" onClick={() => setSelectedBanner("none")}
                  className={`h-8 text-xs font-mono border transition-all ${selectedBanner === "none" || !selectedBanner ? "border-white" : "border-primary/30"}`}>
                  NONE
                </button>
                {BANNER_PRESETS.map(p => {
                  const css = getBannerCss(p.id);
                  return (
                    <button key={p.id} type="button" onClick={() => setSelectedBanner(p.id)}
                      className={`h-8 border transition-all ${selectedBanner === p.id ? "border-white scale-105" : "border-primary/30"}`}
                      style={css as React.CSSProperties} title={p.label} />
                  );
                })}
              </div>
            )}

            {bannerTab === "solid" && (
              <div className="flex gap-2 items-center">
                <input type="color" value={solidColor} onChange={e => setSolidColor(e.target.value)} className="w-10 h-10 cursor-pointer border border-primary/30 bg-transparent" />
                <Input value={solidColor} onChange={e => setSolidColor(e.target.value)} className="font-mono" />
              </div>
            )}

            {bannerTab === "custom" && (
              <div className="space-y-1">
                {(customBanners as CustomBannerRecord[]).length === 0 ? (
                  <p className="text-xs text-muted-foreground font-mono">No custom banners available.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-1">
                    {(customBanners as CustomBannerRecord[]).map(cb => {
                      const css = getBannerPatternStyle(cb.patternType, cb.primaryColor, cb.secondaryColor, cb.bgColor);
                      return (
                        <button key={cb.id} type="button" onClick={() => setSelectedBanner(`custom:${cb.id}`)}
                          className={`h-8 border text-xs font-mono text-white transition-all ${selectedBanner === `custom:${cb.id}` ? "border-white scale-105" : "border-primary/30"}`}
                          style={css as React.CSSProperties}>
                          {cb.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {bannerCss && (
              <div className="h-8 w-full" style={bannerCss as React.CSSProperties} />
            )}
          </div>

          <Button type="submit" className="w-full font-mono uppercase tracking-widest" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "SAVING..." : "SAVE CHANGES"}
          </Button>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-mono text-primary/70 uppercase tracking-wider">Live Preview</p>
          <div className="border-2 border-primary/40 bg-card/80 overflow-hidden relative">
            {bannerCss ? (
              <div className="id-banner id-banner-shimmer" style={bannerCss as React.CSSProperties} />
            ) : (
              <div className="h-2 bg-primary/20" />
            )}
            <div className="p-4 space-y-2 font-mono">
              <div className="text-xl font-bold">{displayName || "UNKNOWN"}</div>
              <div className="text-sm text-muted-foreground">@{username || "unknown"}</div>
              <div className="text-xs text-muted-foreground">AGE: {ageGroup}</div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 border border-border" style={{ backgroundColor: favoriteColor }} />
                <span>{favoriteColor}</span>
              </div>
              {bio && <p className="text-sm text-foreground/80">"{bio}"</p>}
              {selectedTraits.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {selectedTraits.map(t => (
                    <span key={t} className="text-xs border border-primary/30 px-1.5 py-0.5 text-primary/70">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
