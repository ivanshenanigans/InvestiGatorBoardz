import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Skull, Trash2, Plus, X } from "lucide-react";
import {
  useListProfiles, useDeleteProfile, useUpdateProfile,
  useListEvents, useCreateEvent, useDeleteEvent, useUpdateEvent,
  useListBulletin, useCreateBulletinItem, useDeleteBulletinItem, useUpdateBulletinItem,
  useListCustomSkins, useCreateCustomSkin, useDeleteCustomSkin,
  useListCustomBadges, useCreateCustomBadge, useDeleteCustomBadge,
  useListCustomBanners, useCreateCustomBanner, useDeleteCustomBanner,
  getListProfilesQueryKey, getListEventsQueryKey, getListBulletinQueryKey,
  getListCustomSkinsQueryKey, getListCustomBadgesQueryKey, getListCustomBannersQueryKey,
  ProfileRecord, EventRecord, BulletinRecord, CustomSkinRecord, CustomBadgeRecord, CustomBannerRecord,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ALL_SKINS } from "@/lib/skins";
import { ALL_BADGES } from "@/lib/badges";
import { BANNER_PRESETS } from "@/lib/banners";
import { getBannerPatternStyle, BANNER_PATTERN_TYPES } from "@/lib/bannerPatterns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectGroup, SelectItem,
  SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const ACCESS_CODE = "No_Jayii0607";

const ACCESSORIES = [
  "Top Hat", "Mini Top Hat", "Devil Horns", "Demon Wings", "Angel Wings", "Seraph Wings",
  "Katana", "Dual Katanas", "Meteor Trail", "Sparkles", "Stars", "Magic Circle",
  "Pentacle", "Runes", "Chains", "Halo", "Broken Halo", "Dark Crown", "Skull Crown",
  "Rose Crown", "Bat Wings", "Butterfly Wings", "Dragon Wings", "Flame Wings",
  "Ice Wings", "Shadow Wings", "Void Wings", "Feathers", "Moon Crescent",
  "Sun Rays", "Thunder Bolts", "Poison Cloud", "Smoke Ring", "Blood Drops",
  "Tears", "Eye of Providence", "Third Eye", "Dark Aura", "Light Aura",
  "Demonic Aura", "Angelic Aura", "Ghost Trail", "Meteor Shower", "Falling Leaves",
  "Snowflakes", "Rain Drops", "Fire Ring", "Ice Ring", "Thunder Ring",
  "Poison Ring", "Shadow Ring", "Void Rift", "Portal", "Mirror Shards",
  "Clock Parts", "Gears", "Crystals", "Dark Crystals", "Light Crystals",
  "Void Crystals", "Blood Crystals", "Rune Stones", "Ancient Tablets", "Scrolls",
  "Spell Books", "Potion Bottles", "Test Tubes", "Syringes", "Scalpels",
  "Bandages", "Stitches", "Eye Patch", "Monocle", "Goggles",
  "Gas Mask", "Iron Mask", "Plague Doctor Mask", "Fox Mask", "Crow Mask",
  "Oni Mask", "Noh Mask", "Jester Hat", "Witch Hat", "Wizard Hat",
  "Baphomet Horns", "Ram Horns", "Bull Horns", "Elf Ears", "Demon Ears",
  "Cat Ears", "Fox Ears", "Wolf Ears", "Rabbit Ears", "Spider Legs",
  "Tentacles", "Mechanical Arms", "Bone Wings", "Wither Wings", "Nether Wings",
  "Aquatic Fins", "Mermaid Tail", "Serpent Tail", "Dragon Tail", "Comet",
  "Satellite", "Space Debris", "Galaxy Swirl", "Nebula Cloud", "Black Hole",
  "Lava Drips", "Ash Cloud", "Toxic Bubbles", "Radioactive Glow", "Circuit Board",
  "Data Stream", "Hologram", "Glitch Effect", "Static Noise", "VHS Tape",
];

const BULLETIN_CATEGORIES = [
  { value: "upcoming_event", label: "Upcoming Event" },
  { value: "monthly_quest", label: "Monthly Quest" },
  { value: "rules", label: "Rules" },
  { value: "link", label: "Link" },
];

function cropToSquare(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = Math.min(img.width, img.height);
        canvas.width = 512; canvas.height = 512;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("no ctx")); return; }
        ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 512, 512);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-serif text-primary tracking-wider uppercase border-b border-border/50 pb-2 flex items-center gap-2">
      {children}
    </h2>
  );
}

function DeleteRow({ profile, onDeleted }: { profile: ProfileRecord; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const del = useDeleteProfile();
  return (
    <div className="flex items-center justify-between p-4 bg-card/50 border border-border">
      <div className="flex items-center gap-4">
        <Avatar className="w-12 h-12 rounded-none border border-primary/30">
          <AvatarImage src={profile.imageData} className="object-cover" />
          <AvatarFallback className="rounded-none bg-muted text-xs">?</AvatarFallback>
        </Avatar>
        <div className="font-mono">
          <div className="font-bold">{profile.displayName}</div>
          <div className="text-sm text-muted-foreground">@{profile.username}</div>
        </div>
      </div>
      <Button variant="destructive" disabled={del.isPending}
        onClick={() => { if (!confirming) { setConfirming(true); return; } del.mutate({ id: profile.id }, { onSuccess: onDeleted }); }}
        className="font-mono" data-testid={`button-delete-profile-${profile.id}`}
      >
        <Trash2 className="w-4 h-4 mr-2" />
        {confirming ? "CONFIRM?" : "TERMINATE FILE"}
      </Button>
    </div>
  );
}

function SkinRow({ profile, onUpdated, customSkins }: { profile: ProfileRecord; onUpdated: () => void; customSkins: CustomSkinRecord[] }) {
  const [selected, setSelected] = useState(profile.skin || "Red");
  const update = useUpdateProfile();
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-card/50 border border-border gap-4">
      <div className="font-mono w-48 truncate">
        <div className="font-bold">{profile.displayName}</div>
        <div className="text-xs text-muted-foreground">Current: {profile.skin || "Red"}</div>
      </div>
      <div className="flex-1 flex gap-4 items-center">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="font-mono bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="font-mono bg-card">
            <SelectGroup>
              <SelectLabel className="text-primary border-b border-border">NOT-SO-DETAILED</SelectLabel>
              {ALL_SKINS.notSoDetailed.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectGroup>
            <SelectGroup className="mt-2">
              <SelectLabel className="text-primary border-b border-border">DETAILED</SelectLabel>
              {ALL_SKINS.detailed.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectGroup>
            {customSkins.length > 0 && (
              <SelectGroup className="mt-2">
                <SelectLabel className="text-primary border-b border-border">CUSTOM</SelectLabel>
                {customSkins.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
        <Button onClick={() => update.mutate({ id: profile.id, data: { skin: selected } }, { onSuccess: onUpdated })}
          disabled={update.isPending} className="font-mono bg-primary hover:bg-primary/80 text-primary-foreground whitespace-nowrap">
          {update.isPending ? "..." : "APPLY"}
        </Button>
      </div>
    </div>
  );
}

function BannerRow({ profile, onUpdated, customBanners }: { profile: ProfileRecord; onUpdated: () => void; customBanners: CustomBannerRecord[] }) {
  const [selected, setSelected] = useState(profile.banner || "none");
  const update = useUpdateProfile();
  const currentCss: React.CSSProperties = (() => {
    if (!selected || selected === "none") return {};
    if (selected.startsWith("custom:")) {
      const id = parseInt(selected.slice(7), 10);
      const cb = customBanners.find(b => b.id === id);
      return cb ? getBannerPatternStyle(cb.patternType, cb.primaryColor, cb.secondaryColor, cb.bgColor) as React.CSSProperties : {};
    }
    const preset = BANNER_PRESETS.find(p => p.id === selected);
    if (preset?.gradient) return { background: preset.gradient };
    if (selected.startsWith("#")) return { background: selected };
    return {};
  })();
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-card/50 border border-border gap-4">
      <div className="font-mono w-48 flex-shrink-0 truncate">
        <div className="font-bold">{profile.displayName}</div>
        <div className="text-xs text-muted-foreground">@{profile.username}</div>
      </div>
      <div className="flex-1 flex gap-3 items-center">
        <div className="w-20 h-8 border border-border/50 flex-shrink-0 overflow-hidden" style={currentCss} />
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="font-mono bg-background flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="font-mono bg-card">
            <SelectGroup>
              <SelectLabel className="text-muted-foreground text-[10px]">NONE</SelectLabel>
              <SelectItem value="none">No Banner</SelectItem>
            </SelectGroup>
            <SelectGroup className="mt-1">
              <SelectLabel className="text-primary border-b border-border text-[10px]">PRESETS</SelectLabel>
              {BANNER_PRESETS.filter(p => p.id !== "none").map(p => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectGroup>
            {customBanners.length > 0 && (
              <SelectGroup className="mt-1">
                <SelectLabel className="text-primary border-b border-border text-[10px]">CUSTOM PATTERNS</SelectLabel>
                {customBanners.map(b => (
                  <SelectItem key={b.id} value={`custom:${b.id}`}>{b.name}</SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
        <Button
          onClick={() => update.mutate(
            { id: profile.id, data: { banner: selected === "none" ? undefined : selected } },
            { onSuccess: onUpdated }
          )}
          disabled={update.isPending}
          className="font-mono bg-primary hover:bg-primary/80 text-primary-foreground whitespace-nowrap flex-shrink-0"
        >
          {update.isPending ? "..." : "APPLY"}
        </Button>
      </div>
    </div>
  );
}

function BadgeRow({ profile, onUpdated, customBadgesList }: { profile: ProfileRecord; onUpdated: () => void; customBadgesList: CustomBadgeRecord[] }) {
  const [badges, setBadges] = useState<string[]>(profile.badges || []);
  const update = useUpdateProfile();
  const handleToggle = (name: string, checked: boolean) => {
    const next = checked ? [...badges, name] : badges.filter(b => b !== name);
    setBadges(next);
    update.mutate({ id: profile.id, data: { badges: next } }, { onSuccess: onUpdated });
  };
  return (
    <div className="p-4 bg-card/50 border border-border space-y-4">
      <div className="font-mono border-b border-border/50 pb-2">
        <span className="font-bold">{profile.displayName}</span>
        <span className="text-muted-foreground ml-2">(@{profile.username})</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2">
        {ALL_BADGES.map(badge => (
          <div key={badge.name} className="flex items-center space-x-2 p-2 hover:bg-background/50">
            <Checkbox id={`${profile.id}-${badge.name}`} checked={badges.includes(badge.name)}
              onCheckedChange={(c) => handleToggle(badge.name, c as boolean)} />
            <label htmlFor={`${profile.id}-${badge.name}`} className="text-sm font-mono cursor-pointer">
              <span className={`badge-${badge.rarity} ml-2 text-[10px] px-1 py-0`}>{badge.name}</span>
            </label>
          </div>
        ))}
        {customBadgesList.length > 0 && (
          <>
            <div className="col-span-full font-mono text-xs text-primary/60 uppercase tracking-wider pt-2 border-t border-border/30 mt-1">
              Custom Badges
            </div>
            {customBadgesList.map(badge => {
              const accClass = badge.accessory !== "none" ? `badge-accessory-${badge.accessory.replace(/_/g, "-")}` : "";
              return (
                <div key={badge.name} className="flex items-center space-x-2 p-2 hover:bg-background/50">
                  <Checkbox id={`${profile.id}-custom-${badge.name}`} checked={badges.includes(badge.name)}
                    onCheckedChange={(c) => handleToggle(badge.name, c as boolean)} />
                  <label htmlFor={`${profile.id}-custom-${badge.name}`} className="text-sm font-mono cursor-pointer">
                    <span className={`badge-custom ${accClass} ml-2 text-[10px] px-1 py-0`}
                      style={{ color: badge.color, borderColor: badge.color }}>
                      {badge.name}
                    </span>
                  </label>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

function EventsSection({ refresh }: { refresh: () => void }) {
  const { data: events, isLoading } = useListEvents();
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const updateEvent = useUpdateEvent();
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const resetForm = () => { setTitle(""); setDescription(""); setImagePreview(""); setAdding(false); setEditId(null); };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try { setImagePreview(await cropToSquare(file)); }
      catch { const r = new FileReader(); r.onloadend = () => setImagePreview(r.result as string); r.readAsDataURL(file); }
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    if (editId !== null) {
      updateEvent.mutate({ id: editId, data: { title, description, imageData: imagePreview } }, { onSuccess: () => { resetForm(); refresh(); } });
    } else {
      createEvent.mutate({ data: { title, description, imageData: imagePreview } }, { onSuccess: () => { resetForm(); refresh(); } });
    }
  };

  const startEdit = (ev: EventRecord) => {
    setEditId(ev.id); setTitle(ev.title); setDescription(ev.description); setImagePreview(ev.imageData); setAdding(true);
  };

  return (
    <section className="space-y-6">
      <SectionHeader>SECTION 4: EVENT BOARD</SectionHeader>
      {isLoading ? <p className="font-mono text-muted-foreground text-sm animate-pulse">LOADING...</p> : null}
      <div className="grid gap-4">
        {(events ?? []).map(ev => (
          <div key={ev.id} className="flex items-center justify-between p-4 bg-card/50 border border-border gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {ev.imageData && <img src={ev.imageData} className="w-16 h-16 object-cover border border-primary/30 flex-shrink-0" />}
              <div className="font-mono min-w-0">
                <div className="font-bold truncate">{ev.title}</div>
                <div className="text-xs text-muted-foreground truncate">{ev.description}</div>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" className="font-mono text-xs" onClick={() => startEdit(ev)}>EDIT</Button>
              <Button variant="destructive" size="sm" className="font-mono text-xs"
                onClick={() => deleteEvent.mutate({ id: ev.id }, { onSuccess: refresh })}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="p-6 border border-primary/30 bg-card/50 space-y-4">
          <h3 className="font-mono text-sm text-primary uppercase">{editId ? "EDIT EVENT" : "NEW EVENT"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="w-full aspect-square border-2 border-dashed border-primary/40 flex items-center justify-center cursor-pointer overflow-hidden relative"
                onClick={() => fileRef.current?.click()}>
                {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> :
                  <span className="font-mono text-xs text-muted-foreground">CLICK TO UPLOAD IMAGE</span>}
                <input type="file" accept="image/*" className="hidden" ref={fileRef} onChange={handleImage} />
              </div>
              {imagePreview && <button className="text-xs font-mono text-muted-foreground hover:text-primary" onClick={() => setImagePreview("")}>CLEAR IMAGE</button>}
            </div>
            <div className="space-y-4">
              <div>
                <label className="font-mono text-xs uppercase text-primary block mb-1">Event Title</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="EVENT NAME" className="font-mono bg-background border-border" />
              </div>
              <div>
                <label className="font-mono text-xs uppercase text-primary block mb-1">Event Description</label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the event..." className="font-mono bg-background border-border resize-none" rows={5} />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSubmit} disabled={createEvent.isPending || updateEvent.isPending} className="font-mono bg-primary hover:bg-primary/80">
              {editId ? "SAVE CHANGES" : "CREATE EVENT"}
            </Button>
            <Button variant="outline" onClick={resetForm} className="font-mono">CANCEL</Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setAdding(true)} className="font-mono bg-card border border-primary/40 text-primary hover:bg-primary/10">
          <Plus className="w-4 h-4 mr-2" /> ADD EVENT
        </Button>
      )}
    </section>
  );
}

function BulletinSection({ refresh }: { refresh: () => void }) {
  const { data: items, isLoading } = useListBulletin();
  const create = useCreateBulletinItem();
  const del = useDeleteBulletinItem();
  const update = useUpdateBulletinItem();
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [category, setCategory] = useState("upcoming_event");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");

  const resetForm = () => { setTitle(""); setContent(""); setUrl(""); setCategory("upcoming_event"); setAdding(false); setEditId(null); };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const data = { category, title, content, url };
    if (editId !== null) {
      update.mutate({ id: editId, data }, { onSuccess: () => { resetForm(); refresh(); } });
    } else {
      create.mutate({ data }, { onSuccess: () => { resetForm(); refresh(); } });
    }
  };

  const startEdit = (item: BulletinRecord) => {
    setEditId(item.id); setCategory(item.category); setTitle(item.title); setContent(item.content); setUrl(item.url); setAdding(true);
  };

  const LABEL: Record<string, string> = { upcoming_event: "EVENT", monthly_quest: "QUEST", rules: "RULES", link: "LINK" };

  return (
    <section className="space-y-6">
      <SectionHeader>SECTION 5: BULLETIN BOARD</SectionHeader>
      {isLoading ? <p className="font-mono text-muted-foreground text-sm animate-pulse">LOADING...</p> : null}
      <div className="grid gap-3">
        {(items ?? []).map(item => (
          <div key={item.id} className="flex items-center justify-between p-4 bg-card/50 border border-border gap-4">
            <div className="font-mono flex-1 min-w-0">
              <span className="text-xs text-primary/70 border border-primary/30 px-1 mr-2">{LABEL[item.category] ?? item.category}</span>
              <span className="font-bold">{item.title}</span>
              {item.content && <div className="text-xs text-muted-foreground mt-1 truncate">{item.content}</div>}
              {item.url && <div className="text-xs text-blue-400 mt-0.5 truncate">{item.url}</div>}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" className="font-mono text-xs" onClick={() => startEdit(item)}>EDIT</Button>
              <Button variant="destructive" size="sm" className="font-mono text-xs"
                onClick={() => del.mutate({ id: item.id }, { onSuccess: refresh })}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="p-6 border border-primary/30 bg-card/50 space-y-4">
          <h3 className="font-mono text-sm text-primary uppercase">{editId ? "EDIT ITEM" : "NEW BULLETIN ITEM"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-xs uppercase text-primary block mb-1">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="font-mono bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="font-mono bg-card">
                  {BULLETIN_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-mono text-xs uppercase text-primary block mb-1">Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="font-mono bg-background border-border" />
            </div>
            <div className="md:col-span-2">
              <label className="font-mono text-xs uppercase text-primary block mb-1">Content</label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Description or body text..." className="font-mono bg-background border-border resize-none" rows={3} />
            </div>
            {category === "link" && (
              <div className="md:col-span-2">
                <label className="font-mono text-xs uppercase text-primary block mb-1">URL</label>
                <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="font-mono bg-background border-border" />
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSubmit} disabled={create.isPending || update.isPending} className="font-mono bg-primary hover:bg-primary/80">
              {editId ? "SAVE CHANGES" : "POST ITEM"}
            </Button>
            <Button variant="outline" onClick={resetForm} className="font-mono">CANCEL</Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setAdding(true)} className="font-mono bg-card border border-primary/40 text-primary hover:bg-primary/10">
          <Plus className="w-4 h-4 mr-2" /> ADD ITEM
        </Button>
      )}
    </section>
  );
}

function SkinPreview({ glowColor, glowEnabled, borderColor, bgGradientFrom, bgGradientTo, accessories, name }: {
  glowColor: string; glowEnabled: boolean; borderColor: string;
  bgGradientFrom: string; bgGradientTo: string; accessories: string[]; name: string;
}) {
  const style: React.CSSProperties = {
    border: `2px solid ${borderColor}`,
    background: `linear-gradient(135deg, ${bgGradientFrom}, ${bgGradientTo})`,
    boxShadow: glowEnabled ? `0 0 20px ${glowColor}80, 0 0 40px ${glowColor}40` : "none",
  };
  return (
    <div className="p-4 font-mono text-xs space-y-2" style={style}>
      <div className="text-foreground font-bold uppercase truncate">{name || "PREVIEW"}</div>
      {accessories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {accessories.slice(0, 4).map(a => (
            <span key={a} className="text-[10px] px-1 border border-white/20 text-white/60">{a}</span>
          ))}
          {accessories.length > 4 && <span className="text-[10px] text-white/40">+{accessories.length - 4} more</span>}
        </div>
      )}
    </div>
  );
}

function SkinMakerSection({ refresh }: { refresh: () => void }) {
  const { data: customSkins, isLoading } = useListCustomSkins();
  const create = useCreateCustomSkin();
  const del = useDeleteCustomSkin();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [glowColor, setGlowColor] = useState("#ff0000");
  const [glowEnabled, setGlowEnabled] = useState(true);
  const [borderColor, setBorderColor] = useState("#ff0000");
  const [bgFrom, setBgFrom] = useState("#0a0a0a");
  const [bgTo, setBgTo] = useState("#1a0000");
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [accSearch, setAccSearch] = useState("");

  const resetForm = () => {
    setName(""); setGlowColor("#ff0000"); setGlowEnabled(true); setBorderColor("#ff0000");
    setBgFrom("#0a0a0a"); setBgTo("#1a0000"); setSelectedAccessories([]); setAccSearch(""); setAdding(false);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    create.mutate({
      data: { name, glowColor, glowEnabled, borderColor, bgGradientFrom: bgFrom, bgGradientTo: bgTo, accessories: selectedAccessories }
    }, { onSuccess: () => { resetForm(); refresh(); } });
  };

  const toggleAcc = (acc: string) => {
    setSelectedAccessories(prev => prev.includes(acc) ? prev.filter(a => a !== acc) : [...prev, acc]);
  };

  const filteredAcc = ACCESSORIES.filter(a => a.toLowerCase().includes(accSearch.toLowerCase()));

  return (
    <section className="space-y-6">
      <SectionHeader>SECTION 6: CUSTOM SKIN MAKER</SectionHeader>
      {isLoading ? <p className="font-mono text-muted-foreground text-sm animate-pulse">LOADING...</p> : null}
      <div className="grid gap-4">
        {(customSkins ?? []).map((skin: CustomSkinRecord) => (
          <div key={skin.id} className="flex items-center justify-between p-4 bg-card/50 border border-border gap-4">
            <SkinPreview
              name={skin.name} glowColor={skin.glowColor} glowEnabled={skin.glowEnabled}
              borderColor={skin.borderColor} bgGradientFrom={skin.bgGradientFrom}
              bgGradientTo={skin.bgGradientTo} accessories={skin.accessories}
            />
            <div className="font-mono flex-1 min-w-0 px-4">
              <div className="font-bold truncate">{skin.name}</div>
              <div className="text-xs text-muted-foreground">{skin.accessories.length} accessories · {skin.glowEnabled ? "Glow ON" : "No glow"}</div>
            </div>
            <Button variant="destructive" size="sm" className="font-mono text-xs flex-shrink-0"
              onClick={() => del.mutate({ id: skin.id }, { onSuccess: refresh })}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="p-6 border border-primary/30 bg-card/50 space-y-6">
          <h3 className="font-mono text-sm text-primary uppercase">DESIGN NEW SKIN</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="font-mono text-xs uppercase text-primary block mb-1">Skin Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="My Custom Skin" className="font-mono bg-background border-border" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-xs uppercase text-primary block mb-1">Border Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)} className="w-10 h-10 p-1 bg-background border border-border cursor-pointer" />
                    <span className="font-mono text-xs text-muted-foreground">{borderColor}</span>
                  </div>
                </div>
                <div>
                  <label className="font-mono text-xs uppercase text-primary block mb-1">Glow Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={glowColor} onChange={e => setGlowColor(e.target.value)} className="w-10 h-10 p-1 bg-background border border-border cursor-pointer" />
                    <span className="font-mono text-xs text-muted-foreground">{glowColor}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="glow-enabled" checked={glowEnabled} onCheckedChange={c => setGlowEnabled(c as boolean)} />
                <label htmlFor="glow-enabled" className="font-mono text-sm cursor-pointer">Enable Glow Effect</label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-xs uppercase text-primary block mb-1">BG Gradient Start</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={bgFrom} onChange={e => setBgFrom(e.target.value)} className="w-10 h-10 p-1 bg-background border border-border cursor-pointer" />
                    <span className="font-mono text-xs text-muted-foreground">{bgFrom}</span>
                  </div>
                </div>
                <div>
                  <label className="font-mono text-xs uppercase text-primary block mb-1">BG Gradient End</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={bgTo} onChange={e => setBgTo(e.target.value)} className="w-10 h-10 p-1 bg-background border border-border cursor-pointer" />
                    <span className="font-mono text-xs text-muted-foreground">{bgTo}</span>
                  </div>
                </div>
              </div>
              <div className="p-3 border border-border/50">
                <div className="font-mono text-xs text-primary uppercase mb-2">Live Preview</div>
                <SkinPreview name={name} glowColor={glowColor} glowEnabled={glowEnabled}
                  borderColor={borderColor} bgGradientFrom={bgFrom} bgGradientTo={bgTo} accessories={selectedAccessories} />
              </div>
            </div>
            <div className="space-y-3">
              <label className="font-mono text-xs uppercase text-primary block">
                Accessories ({selectedAccessories.length} selected)
              </label>
              {selectedAccessories.length > 0 && (
                <div className="flex flex-wrap gap-1 p-2 border border-primary/20 bg-background/50 max-h-24 overflow-y-auto">
                  {selectedAccessories.map(a => (
                    <button key={a} onClick={() => toggleAcc(a)}
                      className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 border border-primary/50 text-primary hover:border-destructive hover:text-destructive transition-colors">
                      {a} <X className="w-2.5 h-2.5" />
                    </button>
                  ))}
                </div>
              )}
              <Input value={accSearch} onChange={e => setAccSearch(e.target.value)} placeholder="SEARCH ACCESSORIES..." className="font-mono bg-background border-border text-xs" />
              <div className="grid grid-cols-2 gap-1 max-h-80 overflow-y-auto p-1 border border-border/30">
                {filteredAcc.map(acc => (
                  <button key={acc} onClick={() => toggleAcc(acc)}
                    className={`text-left text-[10px] font-mono px-2 py-1.5 border transition-colors ${selectedAccessories.includes(acc) ? "border-primary text-primary bg-primary/10" : "border-border/30 text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
                    {acc}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSubmit} disabled={create.isPending} className="font-mono bg-primary hover:bg-primary/80">
              {create.isPending ? "CREATING..." : "CREATE SKIN"}
            </Button>
            <Button variant="outline" onClick={resetForm} className="font-mono">CANCEL</Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setAdding(true)} className="font-mono bg-card border border-primary/40 text-primary hover:bg-primary/10">
          <Plus className="w-4 h-4 mr-2" /> DESIGN NEW SKIN
        </Button>
      )}
    </section>
  );
}

const ACCESSORY_OPTIONS = [
  { value: "none", label: "No Accessory" },
  { value: "spinning_star", label: "Epic Badge Accessory — The Spinning Star (★)" },
  { value: "shining_star", label: "Seraph Accessory — The Shining Star (✦)" },
  { value: "angel_wings", label: "Winged Angel Accessory — Angel Wings (» «)" },
];

function BadgePreview({ name, color, accessory }: { name: string; color: string; accessory: string }) {
  const accClass = accessory !== "none" ? `badge-accessory-${accessory.replace(/_/g, "-")}` : "";
  return (
    <span
      className={`badge-custom ${accClass}`}
      style={{ color, borderColor: color }}
    >
      {name || "BADGE NAME"}
    </span>
  );
}

function BadgeMakerSection({ refresh }: { refresh: () => void }) {
  const { data: customBadges, isLoading } = useListCustomBadges();
  const create = useCreateCustomBadge();
  const del = useDeleteCustomBadge();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#ffd700");
  const [accessory, setAccessory] = useState("none");

  const resetForm = () => { setName(""); setColor("#ffd700"); setAccessory("none"); setAdding(false); };

  const handleSubmit = () => {
    if (!name.trim()) return;
    create.mutate({ data: { name, color, accessory } }, { onSuccess: () => { resetForm(); refresh(); } });
  };

  return (
    <section className="space-y-6">
      <SectionHeader>SECTION 7: BADGE MAKER</SectionHeader>
      <p className="font-mono text-xs text-muted-foreground/70 uppercase tracking-wider">
        Create custom badges with unique colors and animated accessories. Assign them to subjects via Section 3.
      </p>
      {isLoading ? <p className="font-mono text-muted-foreground text-sm animate-pulse">LOADING...</p> : null}
      <div className="grid gap-4">
        {(customBadges ?? []).map((badge: CustomBadgeRecord) => (
          <div key={badge.id} className="flex items-center justify-between p-4 bg-card/50 border border-border gap-6">
            <div className="flex items-center gap-6 flex-1 min-w-0">
              <BadgePreview name={badge.name} color={badge.color} accessory={badge.accessory} />
              <div className="font-mono text-xs text-muted-foreground min-w-0">
                <div>{ACCESSORY_OPTIONS.find(a => a.value === badge.accessory)?.label ?? badge.accessory}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-3 h-3 border border-border/50 flex-shrink-0" style={{ backgroundColor: badge.color }} />
                  <span>{badge.color}</span>
                </div>
              </div>
            </div>
            <Button variant="destructive" size="sm" className="font-mono text-xs flex-shrink-0"
              onClick={() => del.mutate({ id: badge.id }, { onSuccess: refresh })}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
        {(customBadges ?? []).length === 0 && !isLoading && (
          <p className="font-mono text-muted-foreground text-sm">NO CUSTOM BADGES CREATED YET.</p>
        )}
      </div>
      {adding ? (
        <div className="p-6 border border-primary/30 bg-card/50 space-y-6">
          <h3 className="font-mono text-sm text-primary uppercase">DESIGN NEW BADGE</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <label className="font-mono text-xs uppercase text-primary block mb-1">Badge Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="MY CUSTOM BADGE"
                  className="font-mono bg-background border-border" />
              </div>
              <div>
                <label className="font-mono text-xs uppercase text-primary block mb-2">Badge Color</label>
                <div className="flex items-center gap-4">
                  <input type="color" value={color} onChange={e => setColor(e.target.value)}
                    className="w-14 h-14 p-1 bg-background border border-border cursor-pointer" />
                  <div className="font-mono text-sm">
                    <div className="text-muted-foreground text-xs mb-1">HEX CODE</div>
                    <div>{color}</div>
                    <div className="text-xs text-muted-foreground mt-1">Controls text color, border, and glow</div>
                  </div>
                </div>
              </div>
              <div>
                <label className="font-mono text-xs uppercase text-primary block mb-2">Accessory</label>
                <div className="grid gap-2">
                  {ACCESSORY_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setAccessory(opt.value)}
                      className={`text-left px-4 py-3 border font-mono text-xs transition-all ${accessory === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/40 text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="font-mono text-xs uppercase text-primary">Live Preview</div>
              <div className="p-8 border border-border/30 bg-background/50 flex items-center justify-center min-h-32">
                <BadgePreview name={name} color={color} accessory={accessory} />
              </div>
              <div className="p-4 border border-border/20 bg-card/30 space-y-2 font-mono text-xs text-muted-foreground">
                <div className="text-primary/70 uppercase mb-2">Accessory Guide</div>
                <div><span className="text-foreground">★ Spinning Star</span> — A rotating star icon; ideal for Epic-tier badges</div>
                <div><span className="text-foreground">✦ Shining Star</span> — A pulsing bright star; best for Seraph-tier badges</div>
                <div><span className="text-foreground">» Angel Wings «</span> — Flanking wing glyphs that gently flap on each side of the text</div>
                <div><span className="text-foreground">No Accessory</span> — Clean badge with glow only</div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSubmit} disabled={create.isPending || !name.trim()} className="font-mono bg-primary hover:bg-primary/80">
              {create.isPending ? "CREATING..." : "CREATE BADGE"}
            </Button>
            <Button variant="outline" onClick={resetForm} className="font-mono">CANCEL</Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setAdding(true)} className="font-mono bg-card border border-primary/40 text-primary hover:bg-primary/10">
          <Plus className="w-4 h-4 mr-2" /> DESIGN NEW BADGE
        </Button>
      )}
    </section>
  );
}

function BannerPreviewStrip({ patternType, primaryColor, secondaryColor, bgColor }: {
  patternType: string; primaryColor: string; secondaryColor: string; bgColor: string;
}) {
  const css = getBannerPatternStyle(patternType, primaryColor, secondaryColor, bgColor);
  return <div className="w-full h-16 border border-border/50" style={css as React.CSSProperties} />;
}

function CustomBannerMakerSection({ refresh }: { refresh: () => void }) {
  const { data: customBanners, isLoading } = useListCustomBanners();
  const create = useCreateCustomBanner();
  const del = useDeleteCustomBanner();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [patternType, setPatternType] = useState("skulls");
  const [primaryColor, setPrimaryColor] = useState("#ff0000");
  const [secondaryColor, setSecondaryColor] = useState("#8b0000");
  const [bgColor, setBgColor] = useState("#0a0000");

  const resetForm = () => {
    setName(""); setPatternType("skulls"); setPrimaryColor("#ff0000"); setSecondaryColor("#8b0000"); setBgColor("#0a0000"); setAdding(false);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    create.mutate(
      { data: { name, patternType, primaryColor, secondaryColor, bgColor } },
      { onSuccess: () => { resetForm(); refresh(); } }
    );
  };

  return (
    <section className="space-y-6">
      <SectionHeader>SECTION 8: CUSTOM BANNER MAKER</SectionHeader>
      <p className="font-mono text-xs text-muted-foreground/70 uppercase tracking-wider">
        Design wallpaper-style banner patterns. Assign them to subjects via the Banner section.
      </p>
      {isLoading ? <p className="font-mono text-muted-foreground text-sm animate-pulse">LOADING...</p> : null}
      <div className="grid gap-4">
        {(customBanners ?? []).map((banner: CustomBannerRecord) => {
          const css = getBannerPatternStyle(banner.patternType, banner.primaryColor, banner.secondaryColor, banner.bgColor);
          return (
            <div key={banner.id} className="flex items-center justify-between p-4 bg-card/50 border border-border gap-4">
              <div className="w-32 h-10 flex-shrink-0 border border-border/50 overflow-hidden" style={css as React.CSSProperties} />
              <div className="font-mono flex-1 min-w-0 px-2">
                <div className="font-bold truncate">{banner.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{banner.patternType} · {banner.primaryColor}</div>
              </div>
              <Button variant="destructive" size="sm" className="font-mono text-xs flex-shrink-0"
                onClick={() => del.mutate({ id: banner.id }, { onSuccess: refresh })}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          );
        })}
        {(customBanners ?? []).length === 0 && !isLoading && (
          <p className="font-mono text-muted-foreground text-sm">NO CUSTOM BANNERS CREATED YET.</p>
        )}
      </div>
      {adding ? (
        <div className="p-6 border border-primary/30 bg-card/50 space-y-6">
          <h3 className="font-mono text-sm text-primary uppercase">DESIGN NEW BANNER</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="font-mono text-xs uppercase text-primary block mb-1">Banner Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="BLOOD SKULLS"
                  className="font-mono bg-background border-border" />
              </div>
              <div>
                <label className="font-mono text-xs uppercase text-primary block mb-2">
                  Pattern Type
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto">
                  {BANNER_PATTERN_TYPES.map(pt => (
                    <button key={pt.id} type="button" onClick={() => setPatternType(pt.id)}
                      className={`text-left text-[11px] font-mono px-3 py-2 border transition-colors ${
                        patternType === pt.id
                          ? "border-primary text-primary bg-primary/10"
                          : "border-border/40 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}>
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase text-primary block mb-1">Primary</label>
                  <div className="flex gap-1.5 items-center">
                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                      className="w-8 h-8 p-0.5 bg-background border border-border cursor-pointer" />
                    <span className="font-mono text-[10px] text-muted-foreground">{primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-primary block mb-1">Secondary</label>
                  <div className="flex gap-1.5 items-center">
                    <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                      className="w-8 h-8 p-0.5 bg-background border border-border cursor-pointer" />
                    <span className="font-mono text-[10px] text-muted-foreground">{secondaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-primary block mb-1">Background</label>
                  <div className="flex gap-1.5 items-center">
                    <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                      className="w-8 h-8 p-0.5 bg-background border border-border cursor-pointer" />
                    <span className="font-mono text-[10px] text-muted-foreground">{bgColor}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="font-mono text-xs uppercase text-primary">Live Preview</div>
              <div className="border border-border/30 bg-background/50 overflow-hidden">
                <BannerPreviewStrip patternType={patternType} primaryColor={primaryColor}
                  secondaryColor={secondaryColor} bgColor={bgColor} />
              </div>
              <div className="p-4 border border-border/20 bg-card/30 font-mono text-xs text-muted-foreground space-y-1">
                <div className="text-primary/70 uppercase mb-2">Color Guide</div>
                <div><span className="text-foreground">Primary</span> — Main pattern / icon color</div>
                <div><span className="text-foreground">Secondary</span> — Accent glyph color</div>
                <div><span className="text-foreground">Background</span> — Banner background fill</div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSubmit} disabled={create.isPending || !name.trim()}
              className="font-mono bg-primary hover:bg-primary/80">
              {create.isPending ? "CREATING..." : "CREATE BANNER"}
            </Button>
            <Button variant="outline" onClick={resetForm} className="font-mono">CANCEL</Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setAdding(true)} className="font-mono bg-card border border-primary/40 text-primary hover:bg-primary/10">
          <Plus className="w-4 h-4 mr-2" /> DESIGN NEW BANNER
        </Button>
      )}
    </section>
  );
}

export default function Moderator() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState(false);
  const queryClient = useQueryClient();

  const { data: profiles, isLoading: profilesLoading } = useListProfiles({
    query: { enabled: isAuthenticated, queryKey: getListProfilesQueryKey() },
  });
  const { data: customSkins } = useListCustomSkins({
    query: { enabled: isAuthenticated, queryKey: getListCustomSkinsQueryKey() },
  });
  const { data: customBadgesList } = useListCustomBadges({
    query: { enabled: isAuthenticated, queryKey: getListCustomBadgesQueryKey() },
  });
  const { data: customBanners } = useListCustomBanners({
    query: { enabled: isAuthenticated, queryKey: getListCustomBannersQueryKey() },
  });

  const refreshProfiles = () => queryClient.invalidateQueries({ queryKey: getListProfilesQueryKey() });
  const refreshEvents = () => queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
  const refreshBulletin = () => queryClient.invalidateQueries({ queryKey: getListBulletinQueryKey() });
  const refreshSkins = () => queryClient.invalidateQueries({ queryKey: getListCustomSkinsQueryKey() });
  const refreshBadges = () => queryClient.invalidateQueries({ queryKey: getListCustomBadgesQueryKey() });
  const refreshBanners = () => queryClient.invalidateQueries({ queryKey: getListCustomBannersQueryKey() });

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ACCESS_CODE) { setIsAuthenticated(true); setError(false); }
    else { setError(true); setTimeout(() => setError(false), 600); }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-32 max-w-md">
        <Button variant="ghost" onClick={() => setLocation("/")} className="mb-8 font-mono text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 w-4 h-4" /> RETURN
        </Button>
        <div className="text-center space-y-8 bg-card/80 p-8 border border-primary/20 backdrop-blur">
          <Skull className="w-16 h-16 mx-auto text-primary animate-pulse" />
          <h1 className="text-2xl font-serif text-primary tracking-widest uppercase">AUTHORIZATION REQUIRED</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <Input type="password" placeholder="ACCESS CODE" value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              className={`font-mono text-center bg-background border-border ${error ? "border-destructive" : ""}`}
              data-testid="input-access-code" />
            {error && <p className="text-destructive font-mono text-sm uppercase">ACCESS DENIED. CREDENTIALS INVALID.</p>}
            <Button type="submit" className="w-full font-mono bg-primary hover:bg-primary/80 text-primary-foreground" data-testid="button-authenticate">
              AUTHENTICATE
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Button variant="ghost" onClick={() => setLocation("/")} className="mb-8 font-mono text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 w-4 h-4" /> BACK TO ARCHIVE
      </Button>
      <header className="mb-12 border-b border-border pb-6">
        <h1 className="text-3xl font-serif text-primary tracking-widest uppercase flex items-center gap-4">
          <Skull className="w-8 h-8" /> MODERATOR CONTROL PANEL
        </h1>
        <p className="text-muted-foreground font-mono text-sm mt-2">SYSTEM OVERRIDE ENGAGED. PROCEED WITH CAUTION.</p>
      </header>

      {profilesLoading ? (
        <div className="text-center py-12"><p className="font-mono text-muted-foreground animate-pulse">LOADING DATABASE...</p></div>
      ) : (
        <div className="space-y-20">
          <section className="space-y-6">
            <SectionHeader>SECTION 1: SUBJECT MANAGEMENT</SectionHeader>
            {!profiles || profiles.length === 0
              ? <p className="font-mono text-muted-foreground text-sm">NO SUBJECTS ON FILE.</p>
              : <div className="grid gap-4">{profiles.map(p => <DeleteRow key={p.id} profile={p} onDeleted={refreshProfiles} />)}</div>}
          </section>

          <section className="space-y-6">
            <SectionHeader>SECTION 2: ASSIGN CASE (SKINS)</SectionHeader>
            {!profiles || profiles.length === 0
              ? <p className="font-mono text-muted-foreground text-sm">NO SUBJECTS ON FILE.</p>
              : <div className="grid gap-4">{profiles.map(p => <SkinRow key={p.id} profile={p} onUpdated={refreshProfiles} customSkins={customSkins ?? []} />)}</div>}
          </section>

          <section className="space-y-6">
            <SectionHeader>SECTION 3: ASSIGN BADGES</SectionHeader>
            {!profiles || profiles.length === 0
              ? <p className="font-mono text-muted-foreground text-sm">NO SUBJECTS ON FILE.</p>
              : <div className="grid gap-6">{profiles.map(p => <BadgeRow key={p.id} profile={p} onUpdated={refreshProfiles} customBadgesList={customBadgesList ?? []} />)}</div>}
          </section>

          <section className="space-y-6">
            <SectionHeader>SECTION 4: ASSIGN BANNER</SectionHeader>
            <p className="font-mono text-xs text-muted-foreground/70 uppercase tracking-wider">
              Set the banner displayed at the top of each subject&apos;s ID card.
            </p>
            {!profiles || profiles.length === 0
              ? <p className="font-mono text-muted-foreground text-sm">NO SUBJECTS ON FILE.</p>
              : <div className="grid gap-4">{profiles.map(p => <BannerRow key={p.id} profile={p} onUpdated={refreshProfiles} customBanners={customBanners ?? []} />)}</div>}
          </section>

          <EventsSection refresh={refreshEvents} />
          <BulletinSection refresh={refreshBulletin} />
          <SkinMakerSection refresh={refreshSkins} />
          <BadgeMakerSection refresh={refreshBadges} />
          <CustomBannerMakerSection refresh={refreshBanners} />
        </div>
      )}
    </div>
  );
}
