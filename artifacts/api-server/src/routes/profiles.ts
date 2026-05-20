import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, profilesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/profiles", async (req, res) => {
  try {
    const profiles = await db
      .select()
      .from(profilesTable)
      .orderBy(profilesTable.createdAt);
    res.json(profiles);
  } catch (e) {
    req.log.error(e, "Failed to list profiles");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/profiles", async (req, res) => {
  try {
    const { username, displayName, favoriteColor, bio, imageData, ageGroup, banner } = req.body;

    if (!username || !displayName || !favoriteColor || !ageGroup) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const [created] = await db
      .insert(profilesTable)
      .values({
        username: String(username).slice(0, 30),
        displayName: String(displayName).slice(0, 30),
        favoriteColor: String(favoriteColor),
        bio: String(bio || "").slice(0, 75),
        imageData: String(imageData || ""),
        ageGroup: String(ageGroup),
        badges: [],
        skin: "Red",
        banner: banner ? String(banner) : null,
      })
      .returning();

    res.status(201).json(created);
  } catch (e) {
    req.log.error(e, "Failed to create profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/profiles/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const deleted = await db
      .delete(profilesTable)
      .where(eq(profilesTable.id, id))
      .returning();

    if (deleted.length === 0) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    res.status(204).send();
  } catch (e) {
    req.log.error(e, "Failed to delete profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/profiles/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const { skin, badges, banner } = req.body;
    const updates: Record<string, unknown> = {};

    if (skin !== undefined) updates.skin = String(skin);
    if (badges !== undefined && Array.isArray(badges)) updates.badges = badges;
    if (banner !== undefined) updates.banner = banner === null ? null : String(banner);

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }

    const [updated] = await db
      .update(profilesTable)
      .set(updates)
      .where(eq(profilesTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    res.json(updated);
  } catch (e) {
    req.log.error(e, "Failed to update profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
