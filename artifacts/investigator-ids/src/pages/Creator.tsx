import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Upload, AlertTriangle } from "lucide-react";
import { useCreateProfile, useListProfiles, getListProfilesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BANNER_PRESETS, getBannerStyle } from "@/lib/banners";

const AGE_GROUPS = ["9 below", "9-12", "13-15", "16-17", "18-20", "21+"] as const;

const formSchema = z.object({
  username: z.string().min(1, "Required").max(30),
  displayName: z.string().min(1, "Required").max(30),
  ageGroup: z.enum(AGE_GROUPS),
  favoriteColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color"),
  bio: z.string().max(75, "Max 75 characters"),
});

type FormValues = z.infer<typeof formSchema>;

function cropToSquare(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("No canvas context")); return; }
        ctx.drawImage(img, startX, startY, size, size, 0, 0, 256, 256);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Creator() {
  const [, setLocation] = useLocation();
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedBanner, setSelectedBanner] = useState<string>("none");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: existingProfiles } = useListProfiles();
  const isFull = (existingProfiles?.length ?? 0) >= 2;

  const createProfile = useCreateProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      displayName: "",
      ageGroup: "13-15",
      favoriteColor: "#ff0000",
      bio: "",
    },
  });

  const bioValue = form.watch("bio");
  const formValues = form.watch();

  useEffect(() => {
    if (isFull) return;
  }, [isFull]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const cropped = await cropToSquare(file);
        setImagePreview(cropped);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const onSubmit = (data: FormValues) => {
    if (isFull) return;

    createProfile.mutate(
      {
        data: {
          username: data.username,
          displayName: data.displayName,
          favoriteColor: data.favoriteColor,
          bio: data.bio,
          imageData: imagePreview,
          ageGroup: data.ageGroup,
          banner: selectedBanner === "none" ? undefined : selectedBanner,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProfilesQueryKey() });
          setLocation("/");
        },
      }
    );
  };

  if (isFull) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-2xl text-center space-y-8">
        <AlertTriangle className="w-24 h-24 text-destructive mx-auto animate-pulse" />
        <h1 className="text-4xl font-serif text-destructive tracking-widest uppercase">
          Maximum Subjects Reached
        </h1>
        <p className="text-xl font-mono text-muted-foreground border-y border-border py-4">
          DATABASE FULL. NO FURTHER ENTRIES PERMITTED.
        </p>
        <Button
          variant="outline"
          onClick={() => setLocation("/")}
          className="font-mono mt-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          RETURN TO ARCHIVE
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Button
        variant="ghost"
        onClick={() => setLocation("/")}
        className="mb-8 font-mono border-border text-muted-foreground hover:text-foreground hover:border-primary"
      >
        <ArrowLeft className="mr-2 w-4 h-4" />
        BACK
      </Button>

      <header className="mb-12 border-b border-border pb-6">
        <h1 className="text-3xl font-serif text-primary tracking-widest uppercase">
          New Subject Entry
        </h1>
        <p className="text-muted-foreground font-mono text-sm mt-2">
          AUTHORIZATION REQUIRED. ALL FIELDS MONITORED.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card/50 p-6 border border-border backdrop-blur">
              <div className="flex flex-col items-center gap-3 mb-4">
                <div
                  className="w-48 h-48 border-2 border-dashed border-primary/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-background/50 relative overflow-hidden group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
                      <span className="text-xs font-mono text-muted-foreground group-hover:text-primary transition-colors text-center px-2">
                        UPLOAD VISUAL<br />(auto-cropped 1:1)
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    data-testid="input-image-upload"
                  />
                </div>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => { setImagePreview(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
                  >
                    CHANGE IMAGE
                  </button>
                )}
              </div>

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase text-primary">Username</FormLabel>
                    <FormControl>
                      <Input placeholder="subject_001" className="font-mono bg-background border-border focus-visible:ring-primary" data-testid="input-username" {...field} />
                    </FormControl>
                    <FormMessage className="font-mono text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase text-primary">Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="UNKNOWN" className="font-mono bg-background border-border focus-visible:ring-primary" data-testid="input-display-name" {...field} />
                    </FormControl>
                    <FormMessage className="font-mono text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ageGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase text-primary">Age Group</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="font-mono bg-background border-border focus:ring-primary" data-testid="select-age-group">
                          <SelectValue placeholder="SELECT AGE GROUP" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-border font-mono">
                        {AGE_GROUPS.map(ag => (
                          <SelectItem key={ag} value={ag} className="font-mono">{ag}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="font-mono text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="favoriteColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase text-primary">Favorite Color</FormLabel>
                    <FormControl>
                      <div className="flex gap-4 items-center">
                        <Input
                          type="color"
                          className="w-16 h-10 p-1 bg-background border-border cursor-pointer"
                          data-testid="input-color-picker"
                          {...field}
                        />
                        <Input
                          type="text"
                          className="font-mono bg-background border-border focus-visible:ring-primary uppercase"
                          data-testid="input-color-hex"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="font-mono text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-end">
                      <FormLabel className="font-mono text-xs uppercase text-primary">Bio</FormLabel>
                      <span className={`text-xs font-mono ${bioValue.length >= 70 ? "text-destructive" : "text-muted-foreground"}`}>
                        {bioValue.length}/75 CHARACTERS
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Subject exhibits strange behavior..."
                        className="font-mono bg-background border-border focus-visible:ring-primary resize-none"
                        maxLength={75}
                        rows={3}
                        data-testid="input-bio"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="font-mono text-xs" />
                  </FormItem>
                )}
              />

              {/* Banner Picker */}
              <div className="space-y-3">
                <div className="font-mono text-xs uppercase text-primary">ID Banner</div>
                <p className="text-xs font-mono text-muted-foreground">Select a banner displayed at the top of your profile ID.</p>
                <div className="grid grid-cols-4 gap-2">
                  {BANNER_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedBanner(preset.id)}
                      className={`relative h-10 border-2 transition-all overflow-hidden ${
                        selectedBanner === preset.id
                          ? "border-primary shadow-[0_0_10px_rgba(139,0,0,0.6)]"
                          : "border-border/50 hover:border-primary/60"
                      }`}
                      style={
                        preset.id !== "none"
                          ? { background: preset.gradient }
                          : { background: "repeating-linear-gradient(45deg, #111 0px, #111 4px, #0a0a0a 4px, #0a0a0a 8px)" }
                      }
                      title={preset.label}
                    >
                      {selectedBanner === preset.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <span className="text-primary font-mono text-sm font-bold">✓</span>
                        </div>
                      )}
                      {preset.id === "none" && selectedBanner !== "none" && (
                        <span className="text-muted-foreground text-xs font-mono">NONE</span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wider">
                  SELECTED: {BANNER_PRESETS.find(p => p.id === selectedBanner)?.label ?? "None"}
                </div>
              </div>

              {createProfile.isError && (
                <p className="text-destructive font-mono text-xs uppercase">
                  ERROR: FAILED TO FILE SUBJECT. TRY AGAIN.
                </p>
              )}

              <Button
                type="submit"
                disabled={createProfile.isPending}
                className="w-full font-mono text-lg tracking-widest bg-primary hover:bg-primary/80 text-primary-foreground border-2 border-transparent hover:border-border transition-all"
                data-testid="button-submit-profile"
              >
                {createProfile.isPending ? "FILING..." : "FILE SUBJECT"}
              </Button>
            </form>
          </Form>
        </div>

        <div className="lg:sticky lg:top-8 h-fit space-y-4">
          <div className="text-xs font-mono text-muted-foreground uppercase border-b border-border pb-2 mb-4">
            Live Preview
          </div>
          <Card className="id-card overflow-hidden border-2 border-primary/40 bg-card/80 backdrop-blur relative">
            <div className="absolute top-0 right-0 p-2 text-xs font-mono text-muted-foreground border-b border-l border-primary/20 bg-background/50 z-10">
              ID: PENDING...
            </div>

            {/* Banner preview */}
            {getBannerStyle(selectedBanner) ? (
              <div
                className="id-banner id-banner-shimmer"
                style={{ background: getBannerStyle(selectedBanner) }}
              />
            ) : (
              <div className="h-2 bg-primary/20" />
            )}

            <CardContent className="p-6 pt-4">
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className={getBannerStyle(selectedBanner) ? "-mt-10 z-10 relative flex-shrink-0" : "flex-shrink-0"}>
                  <Avatar className="w-32 h-32 rounded-none border-2 border-primary/50 shadow-[0_0_15px_rgba(139,0,0,0.3)]">
                    <AvatarImage src={imagePreview} className="object-cover" />
                    <AvatarFallback className="rounded-none bg-muted text-4xl text-muted-foreground font-serif">?</AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 space-y-3 font-mono w-full">
                  <div>
                    <div className="text-xs text-primary/70 uppercase tracking-wider mb-1">Subject Alias</div>
                    <div className="text-2xl font-bold text-foreground truncate">{formValues.displayName || "UNKNOWN"}</div>
                    <div className="text-sm text-muted-foreground truncate">@{formValues.username || "unknown"}</div>
                    <div className="text-xs text-muted-foreground/70 mt-0.5">AGE: {formValues.ageGroup}</div>
                  </div>

                  <div className="flex items-center gap-3 py-2 border-y border-border/50">
                    <div className="text-xs text-primary/70 uppercase tracking-wider">Color Ref:</div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border border-border" style={{ backgroundColor: formValues.favoriteColor }} />
                      <span className="text-sm">{formValues.favoriteColor}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-primary/70 uppercase tracking-wider mb-1">Subject Notes</div>
                    <p className="text-sm text-foreground/80 leading-relaxed break-words min-h-[40px]">
                      {formValues.bio ? `"${formValues.bio}"` : "NO DATA"}
                    </p>
                  </div>

                  <div>
                    <div className="text-xs text-primary/70 uppercase tracking-wider mb-1">Badges</div>
                    <p className="text-xs font-mono text-muted-foreground">[NO BADGES ASSIGNED]</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
