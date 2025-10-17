const express = require("express");
const router = express.Router();
const { notifications } = require("../data/mockData");

// helpers
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

// GET /notifications/:userId  (optionally ?onlyUnread=true)
router.get("/:userId", (req, res) => {
  const { userId } = req.params;
  const onlyUnread = String(req.query.onlyUnread || "false").toLowerCase() === "true";

  let list = notifications.filter(n => n.userId === userId);
  if (onlyUnread) list = list.filter(n => !n.read);

  // sort newest first
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.status(200).json({ notifications: list });
});

// POST /notifications  (create a new notification) — used by other modules
router.post("/", (req, res) => {
  const { userId, type, title, message, meta } = req.body || {};
  const errors = [];

  if (!isNonEmptyString(userId)) errors.push("userId is required");
  if (!isNonEmptyString(type)) errors.push("type is required");
  if (!isNonEmptyString(title)) errors.push("title is required");
  if (!isNonEmptyString(message)) errors.push("message is required");

  // For "assignment" notifications, require meta.eventId so we can dedupe.
  if (type === "assignment") {
    if (!meta || !isNonEmptyString(meta.eventId)) {
      errors.push("meta.eventId is required for assignment notifications");
    }
  }

  if (errors.length) return res.status(400).json({ errors });

  // 🔒 Duplicate guard: prevent multiple "assignment" notifs for same (userId, eventId)
  if (type === "assignment" && meta?.eventId) {
    const existing = notifications.find(
      (n) =>
        n.userId === userId &&
        n.type === "assignment" &&
        n.meta &&
        n.meta.eventId === meta.eventId
    );

    if (existing) {
      // Already requested/joined this event
      return res
        .status(409) // Conflict
        .json({
          message: "You have already requested to join this event.",
          notification: existing,
        });
    }
  }

  const id = "n" + Math.random().toString(36).slice(2, 8);
  const createdAt = new Date().toISOString();

  const notif = {
    id,
    userId,
    type,
    title,
    message,
    createdAt,
    read: false,
    meta: meta || {},
  };
  notifications.push(notif);

  return res.status(201).json({ notification: notif });
});

// PATCH /notifications/:id/read   (mark single notification as read)
router.patch("/:id/read", (req, res) => {
  const { id } = req.params;
  const idx = notifications.findIndex(n => n.id === id);
  if (idx === -1) return res.status(404).json({ message: "Notification not found" });

  notifications[idx].read = true;
  return res.status(200).json({ notification: notifications[idx] });
});

// PATCH /notifications/:userId/read-all   (mark all user notifications as read)
router.patch("/:userId/read-all", (req, res) => {
  const { userId } = req.params;
  let count = 0;
  notifications.forEach(n => {
    if (n.userId === userId && !n.read) {
      n.read = true;
      count++;
    }
  });
  return res.status(200).json({ message: `Marked ${count} as read` });
});

// DELETE /notifications/:id  (optional: allow deleting)
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const idx = notifications.findIndex(n => n.id === id);
  if (idx === -1) return res.status(404).json({ message: "Notification not found" });
  const removed = notifications.splice(idx, 1)[0];
  return res.status(200).json({ notification: removed });
});

module.exports = router;
