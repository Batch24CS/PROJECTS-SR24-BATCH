import { query } from "../config/db.js";
import { notifyClass } from "../utils/notifications.js";
import { facultyOwnsClass } from "../utils/classPermissions.js";

export async function listEvents(req, res) {
  if (req.user.role === "student") {
    return res.json(
      await query(
        `SELECT * FROM events
         WHERE branch = :branch AND year = :year AND section = :section
         ORDER BY event_date ASC`,
        { branch: req.user.branch, year: req.user.year, section: req.user.section }
      )
    );
  }

  res.json(await query("SELECT * FROM events WHERE faculty_id = :facultyId ORDER BY event_date ASC", { facultyId: req.user.id }));
}

export async function createEvent(req, res) {
  const { title, description, date, eventDate, time, eventTime, venue, registrationLink, branch, year, section } = req.body;
  const ownClass = req.user.role === "hod" && branch === req.user.branch ? true : await facultyOwnsClass({ facultyId: req.user.id, branch, year, section });
  if (!ownClass) return res.status(403).json({ message: "You can create events only for your own active classes" });
  await query(
    `INSERT INTO events
      (faculty_id, title, description, event_date, event_time, venue, registration_link, branch, year, section)
     VALUES
      (:facultyId, :title, :description, :eventDate, :eventTime, :venue, :registrationLink, :branch, :year, :section)`,
    { facultyId: req.user.id, title, description, eventDate: eventDate || date, eventTime: eventTime || time, venue, registrationLink, branch, year: String(year), section }
  );
  await notifyClass({ req, branch, year: String(year), section, title: "New event", message: title, type: "event", linkPath: "/dashboard/events", metadata: { branch, year: String(year), section } });
  res.status(201).json({ message: "Event created" });
}

export async function updateEvent(req, res) {
  await query(
    `UPDATE events
     SET title = :title, description = :description, event_date = :eventDate, event_time = :eventTime,
         venue = :venue, registration_link = :registrationLink, branch = :branch, year = :year, section = :section
     WHERE id = :id AND faculty_id = :facultyId`,
    { ...req.body, eventDate: req.body.eventDate || req.body.date, eventTime: req.body.eventTime || req.body.time, id: req.params.id, facultyId: req.user.id }
  );
  res.json({ message: "Event updated" });
}

export async function deleteEvent(req, res) {
  await query("DELETE FROM events WHERE id = :id AND faculty_id = :facultyId", { id: req.params.id, facultyId: req.user.id });
  res.json({ message: "Event removed" });
}
