import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { api } from "../services/api";
import Tabs from "./Tabs";

function FacultyAttendanceMarker({ classes, context, setContext }) {
  const [tab, setTab] = useState("Mark Attendance");
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ attendanceDate: new Date().toISOString().slice(0, 10), periodNumber: 1, topic: "" });
  const [checked, setChecked] = useState([]);
  const [marks, setMarks] = useState({});
  const [roster, setRoster] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const rosterRequestRef = useRef(0);
  const activeClasses = classes.filter((item) => item.status === "active");
  const selectedSubject = subjects.find((subject) => String(subject.id) === String(context.subjectId));
  const rosterList = roster;

  function selectClass(classId) {
    const item = activeClasses.find((entry) => String(entry.id) === String(classId));
    if (!item) return;
    setContext({ branch: item.branch, year: item.year, section: item.section, subjectId: String(item.subject_id) });
    setChecked([]);
    setMarks({});
  }

  function toggleCheck(id) {
    setChecked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function selectAll() {
    const ids = rosterList.filter((s) => !s.smart_attendance_active).map((s) => s.id);
    setChecked(ids);
  }

  function clearChecks() {
    setChecked([]);
  }

  function markSelected(status) {
    if (!checked.length) {
      setMessage("Select at least one student first.");
      return;
    }
    setMarks((current) => {
      const next = { ...current };
      checked.forEach((id) => {
        const student = rosterList.find((item) => item.id === id);
        if (student?.smart_attendance_active) return;
        next[id] = status;
      });
      return next;
    });
    setMessage("");
  }

  function cardStyle(student) {
    if (student.smart_attendance_active || student.default_status === "smart_present") {
      return "border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-700 dark:bg-orange-950/40 dark:text-orange-200";
    }
    const mark = marks[student.id];
    if (mark === "present") {
      return "border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200";
    }
    if (mark === "absent") {
      return "border-red-400 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200";
    }
    return "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200";
  }

  useEffect(() => {
    const params = new URLSearchParams({ branch: context.branch, year: context.year, section: context.section });
    api.get(`/academic/subjects?${params}`).then(({ data }) => setSubjects(data || []));
  }, [context.branch, context.year, context.section]);

  useEffect(() => {
    if (!context.subjectId) {
      setRoster([]);
      return;
    }
    const requestId = ++rosterRequestRef.current;
    const params = new URLSearchParams({
      subjectId: context.subjectId,
      attendanceDate: form.attendanceDate,
      periodNumber: form.periodNumber
    });
    api
      .get(`/attendance/roster?${params}`)
      .then(({ data }) => {
        if (requestId !== rosterRequestRef.current) return;
        setRoster(data || []);
      })
      .catch(() => {
        if (requestId !== rosterRequestRef.current) return;
        setRoster([]);
      });
  }, [context.subjectId, context.branch, context.year, context.section, form.attendanceDate, form.periodNumber]);

  async function loadSessions() {
    const { data } = await api.get("/attendance");
    setSessions(data || []);
  }

  useEffect(() => {
    loadSessions();
  }, []);

  async function submit(event) {
    event.preventDefault();
    const presentStudentIds = [];
    const absentStudentIds = [];
    rosterList.forEach((student) => {
      if (student.smart_attendance_active) return;
      const mark = marks[student.id];
      if (mark === "present") presentStudentIds.push(student.id);
      if (mark === "absent") absentStudentIds.push(student.id);
    });
    if (!presentStudentIds.length && !absentStudentIds.length) {
      setMessage("Mark at least one student as present or absent before submitting.");
      return;
    }
    const { data } = await api.post("/attendance", {
      ...form,
      subjectId: context.subjectId,
      presentStudentIds,
      absentStudentIds
    });
    setMessage(data.message || "Attendance submitted successfully");
    setChecked([]);
    setMarks({});
    setForm({ ...form, topic: "" });
    await loadSessions();
  }

  async function openSession(id) {
    const { data } = await api.get(`/attendance/sessions/${id}`);
    setSelectedSession(data);
    setTab("Edit Attendance");
  }

  async function editRecord(record, status) {
    const { data } = await api.put(`/attendance/records/${record.id}`, {
      status,
      reason: status === "present_override" ? "Faculty present override" : "Faculty correction"
    });
    setMessage(data.message || "Attendance updated");
    await openSession(selectedSession.session.id);
    await loadSessions();
  }

  const filteredSessions = sessions.filter((session) =>
    `${session.attendance_date || ""} ${session.subject || ""} ${session.period_number || ""} ${session.topic || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const markedPresent = Object.values(marks).filter((value) => value === "present").length;
  const markedAbsent = Object.values(marks).filter((value) => value === "absent").length;

  if (!activeClasses.length) {
    return <div className="app-card p-5 text-sm text-muted">Add an active class before marking attendance.</div>;
  }

  return (
    <div className="space-y-4">
      <Tabs tabs={["Mark Attendance", "Edit Attendance", "Previous Attendance"]} active={tab} setActive={setTab} />
      {message && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{message}</p>}

      {tab === "Mark Attendance" && (
        <form onSubmit={submit} className="space-y-4">
          <div className="app-card p-5">
            <label className="block text-sm font-medium text-muted">
              Select Class
              <select
                value={
                  activeClasses.find(
                    (item) =>
                      String(item.subject_id) === String(context.subjectId) &&
                      item.branch === context.branch &&
                      item.year === context.year &&
                      item.section === context.section
                  )?.id || ""
                }
                onChange={(event) => selectClass(event.target.value)}
                className="mt-2 w-full rounded-lg border border-blue-100 px-3 py-3 dark:border-slate-700"
              >
                <option value="">Select class</option>
                {activeClasses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.branch} Y{item.year} {item.section} - {item.subject_name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="app-card p-5">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-lg bg-sky-50 px-3 py-3 text-sm dark:bg-blue-950/30">
                <p className="text-muted">Subject</p>
                <p className="font-semibold dark:text-white">
                  {selectedSubject?.name ||
                    activeClasses.find((item) => String(item.subject_id) === String(context.subjectId))?.subject_name ||
                    "Select subject"}
                </p>
              </div>
              <input
                type="date"
                value={form.attendanceDate}
                onChange={(e) => setForm({ ...form, attendanceDate: e.target.value })}
                className="rounded-lg border border-blue-100 px-3 py-3 dark:border-slate-700"
              />
              <select
                value={form.periodNumber}
                onChange={(e) => setForm({ ...form, periodNumber: e.target.value })}
                className="rounded-lg border border-blue-100 px-3 py-3 dark:border-slate-700"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
              <input
                required
                placeholder="Topic taught"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="rounded-lg border border-blue-100 px-3 py-3 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="app-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold dark:text-white">Mark attendance</h3>
                <p className="mt-1 text-sm text-muted">Select students, then tap Present (green) or Absent (red).</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={selectAll} className="app-btn-secondary px-3 py-2 text-xs font-semibold">
                  Select all
                </button>
                <button type="button" onClick={clearChecks} className="app-btn-secondary px-3 py-2 text-xs font-semibold">
                  Clear
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => markSelected("present")}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700"
              >
                Mark Present ({checked.length})
              </button>
              <button
                type="button"
                onClick={() => markSelected("absent")}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-red-700"
              >
                Mark Absent ({checked.length})
              </button>
            </div>

            <p className="mt-3 text-sm font-semibold text-sweety-blue dark:text-sky-300">
              Green: {markedPresent} · Red: {markedAbsent} · Smart attendance students stay orange
            </p>

            <div className="mt-4 grid max-h-[min(520px,60vh)] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-4">
              {rosterList.map((student) => {
                const isSmart = student.smart_attendance_active || student.default_status === "smart_present";
                const isChecked = checked.includes(student.id);
                return (
                  <label
                    key={student.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-left text-sm transition ${cardStyle(student)} ${!isSmart && isChecked ? "ring-2 ring-sweety-blue/40" : ""}`}
                  >
                    {!isSmart && (
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCheck(student.id)}
                        className="mt-1 h-4 w-4 rounded"
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{student.roll_number}</span>
                      <span>{student.name}</span>
                      <span className="mt-1 block text-xs opacity-80">
                        {student.place || student.zone_name || "Location not available"}
                      </span>
                      <span className="mt-1 block text-xs font-semibold">
                        {isSmart
                          ? "Smart present"
                          : marks[student.id] === "present"
                            ? "Present"
                            : marks[student.id] === "absent"
                              ? "Absent"
                              : "Not marked"}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            <button
              type="submit"
              className="mt-5 rounded-xl bg-gradient-to-r from-sweety-blue to-sweety-sky px-4 py-3 font-semibold text-white shadow-md"
            >
              Submit Attendance
            </button>
          </div>
        </form>
      )}

      {tab !== "Mark Attendance" && (
        <div className="space-y-4">
          <label className="app-card flex max-w-xl items-center gap-2 px-3 py-2">
            <Search size={16} className="text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search date, subject, period, topic"
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
          {filteredSessions.length === 0 && <div className="app-card p-6 text-sm text-muted">No Previous Attendance</div>}
          <div className="app-card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-sky-50 text-gray-500 dark:bg-slate-800">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Period</th>
                  <th className="p-3">Topic</th>
                  <th className="p-3">Students</th>
                  <th className="p-3">Absent</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((session) => (
                  <tr
                    key={session.id}
                    onClick={() => openSession(session.id)}
                    className="cursor-pointer border-t border-blue-50 hover:bg-sky-50 dark:border-slate-800 dark:hover:bg-slate-800"
                  >
                    <td className="p-3">{session.attendance_date?.slice(0, 10)}</td>
                    <td className="p-3">{session.subject}</td>
                    <td className="p-3">{session.period_number}</td>
                    <td className="p-3">{session.topic}</td>
                    <td className="p-3">{session.total_students || 0}</td>
                    <td className="p-3">{session.absent_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {tab === "Edit Attendance" && selectedSession && (
            <div className="app-card p-5">
              <h3 className="font-semibold dark:text-white">
                {selectedSession.session.subject} - Period {selectedSession.session.period_number}
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {selectedSession.records.map((record) => (
                  <div key={record.id} className="rounded-lg border border-blue-100 p-3 text-sm dark:border-slate-700">
                    <p className="font-semibold">{record.roll_number}</p>
                    <p>{record.name}</p>
                    <select
                      value={record.status}
                      onChange={(event) => editRecord(record, event.target.value)}
                      className="mt-3 w-full rounded-lg border border-blue-100 px-2 py-2 dark:border-slate-700"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="smart_present">Smart Present</option>
                      <option value="present_override">Present Override</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FacultyAttendanceMarker;
