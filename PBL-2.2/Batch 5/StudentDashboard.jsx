import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, Gauge, Home, MapPin, MessageCircle, UserRound, Bell, Map, Search } from "lucide-react";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import Tabs from "../components/Tabs";
import DocumentList from "../components/DocumentList";
import ChatPanel from "../components/ChatPanel";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCampusLocation } from "../hooks/useCampusLocation";
import CollegeMap from "./CollegeMap";
import NotificationsPage from "../components/NotificationsPage";
import { REFRESH_EVENT, shouldRefresh } from "../utils/refresh";
import { pathToTab } from "../utils/dashboardRoutes";

const nav = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "attendance", label: "Attendance", icon: Gauge },
  { id: "timetable", label: "Timetable", icon: CalendarDays },
  { id: "materials", label: "Study Materials", icon: BookOpen },
  { id: "events", label: "Events", icon: CalendarDays },
  { id: "map", label: "College Map", icon: Map },
  { id: "contact", label: "Contact Faculty", icon: MessageCircle },
  { id: "absence", label: "Absence Request", icon: Bell },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "campus", label: "Campus Status", icon: MapPin }
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const campus = useCampusLocation(user?.approvalStatus === "approved" ? user : null);
  const [active, setActive] = useState(() => pathToTab("student"));
  const [materialTab, setMaterialTab] = useState(new URLSearchParams(window.location.search).get("tab") === "important_questions" ? "Important Questions" : new URLSearchParams(window.location.search).get("tab") === "notices" ? "Notices" : "Notes");
  const [overview, setOverview] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [approvalMessage, setApprovalMessage] = useState("");

  async function refreshDashboard() {
    const { data } = await api.get("/dashboard/student");
    setOverview(data);
  }

  useEffect(() => {
    refreshDashboard();
  }, []);

  useEffect(() => {
    const onPath = () => setActive(pathToTab("student"));
    window.addEventListener("popstate", onPath);
    return () => window.removeEventListener("popstate", onPath);
  }, []);

  useEffect(() => {
    const onRefresh = (event) => {
      if (shouldRefresh(event, ["dashboard", "attendance", "documents", "events", "permissions"])) refreshDashboard();
    };
    window.addEventListener(REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(REFRESH_EVENT, onRefresh);
  }, []);

  useEffect(() => {
    const category = { Notes: "notes", "Important Questions": "questions", Notices: "notice" }[materialTab];
    api.get(`/documents?category=${category}&search=${encodeURIComponent(search)}`).then(({ data }) => setDocuments(data));
  }, [materialTab, search]);

  const status = campus.status.lastUpdated ? campus.status : overview?.campusStatus;
  const inside = status?.insideCampus || status?.campus_status === "INSIDE" || status?.campusStatus === "INSIDE";
  const currentDocs = documents.length ? documents : overview?.recentUploads || [];

  if (user.approvalStatus !== "approved" || ["pending", "rejected", "blocked"].includes(overview?.approvalStatus)) {
    const rejected = user.approvalStatus === "rejected" || overview?.approvalStatus === "rejected";
    const blocked = user.approvalStatus === "blocked" || overview?.approvalStatus === "blocked";
    async function rerequest() {
      const { data } = await api.post("/registration-requests/re-request");
      setApprovalMessage(data.message);
    }
    return (
      <Layout title="Student Approval" subtitle="Registration status" navItems={[]} active={active} setActive={setActive}>
        <div className="mx-auto max-w-3xl rounded-lg border border-blue-100 bg-white p-6 shadow-soft">
          <p className={`text-sm font-semibold ${rejected || blocked ? "text-red-600" : "text-sweety-blue"}`}>{blocked ? "Account blocked" : rejected ? "Registration rejected" : "Waiting for class incharge approval"}</p>
          <h2 className="mt-2 text-2xl font-semibold">{blocked ? "Your account was blocked." : rejected ? "Your registration was rejected." : "Your account is waiting for class incharge approval."}</h2>
          <p className="mt-3 text-sm text-gray-500">{blocked ? "Your account is blocked. Contact faculty/admin." : rejected ? "Your request was rejected. You can submit a new request." : "You can log in, but the full dashboard unlocks only after approval."}</p>
          <div className="mt-5 grid gap-3 text-sm text-gray-600 md:grid-cols-2">
            <p>Branch: {user.branch}</p>
            <p>Year: {user.year}</p>
            <p>Section: {user.section}</p>
            <p>Roll Number: {user.rollNumber}</p>
            <p>Admission Type: {user.admissionType}</p>
            <p>Request Status: {user.approvalStatus || overview?.approvalStatus}</p>
          </div>
          {rejected && <button onClick={rerequest} className="mt-5 rounded-lg bg-sweety-blue px-4 py-3 font-semibold text-white">Re-request Approval</button>}
          {approvalMessage && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{approvalMessage}</p>}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Student Dashboard" subtitle="Attendance, materials, events and campus presence" navItems={nav} active={active} setActive={setActive}>
      {active === "overview" && (
        <div className="space-y-6">
          <div className="rounded-lg bg-gradient-to-r from-sweety-blue via-sweety-sky to-sweety-indigo p-6 text-white shadow-soft">
            <p className="text-sm opacity-80">Welcome back</p>
            <h2 className="mt-1 text-3xl font-semibold">{user.name}</h2>
            <p className="mt-3 max-w-2xl text-sm text-white/80">{campus.privacyNotice}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard title="Overall Attendance" value={`${overview?.attendance?.overall || 0}%`} icon={Gauge} />
            <StatCard title="Campus Status" value={inside ? "Inside" : "Outside"} icon={MapPin} tone={inside ? "green" : "red"} />
            <StatCard title="Upcoming Events" value={overview?.events?.length || 0} icon={CalendarDays} />
            <StatCard title="Recent Uploads" value={overview?.recentUploads?.length || 0} icon={BookOpen} />
          </div>
          {overview?.blockedClasses?.length > 0 && <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">Class blocked notice: {overview.blockedClasses.map((item) => item.subject_name).join(", ")} is currently blocked by faculty.</div>}
          <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-soft dark:border-slate-700 dark:bg-slate-950">
            <h3 className="font-semibold dark:text-white">Quick Campus Status</h3>
            <div className="mt-4"><StatusBadge inside={inside} /></div>
            <p className="mt-4 text-sm text-gray-500">{status?.nearestZone?.description || status?.zone_name || "Precise location is hidden outside campus."}</p>
          </div>
        </div>
      )}

      {active === "attendance" && <AttendanceView attendance={overview?.attendance} />}
      {active === "timetable" && <TimetableView timetable={overview?.timetable || []} />}
      {active === "materials" && (
        <div className="space-y-5">
          <Tabs tabs={["Notes", "Important Questions", "Notices"]} active={materialTab} setActive={setMaterialTab} />
          <DocumentList documents={currentDocs} search={search} setSearch={setSearch} />
        </div>
      )}
      {active === "events" && <Cards title="Events" items={overview?.events} />}
      {active === "map" && <CollegeMap campusStatus={status} />}
      {active === "contact" && <ChatPanel mode="student" />}
      {active === "absence" && <AbsenceRequest />}
      {active === "profile" && <Profile user={user} />}
      {active === "campus" && <CampusPanel campus={campus} status={status} />}
      {active === "notifications" && <NotificationsPage />}
    </Layout>
  );
}

function AbsenceRequest() {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), periodNumber: "", reason: "", eventId: "" });
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    api.get("/management/absence-requests").then(({ data }) => setItems(data || []));
    api.get("/events").then(({ data }) => setEvents(data || [])).catch(() => {});
  }, []);
  async function submit(event) {
    event.preventDefault();
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    if (file) payload.append("proof", file);
    const { data } = await api.post("/management/absence-requests", payload);
    setMessage(data.message);
    setForm({ ...form, reason: "", eventId: "" });
    setFile(null);
    const refreshed = await api.get("/management/absence-requests");
    setItems(refreshed.data || []);
  }
  const filtered = items.filter((item) => `${item.date} ${item.reason} ${item.status}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-5"><Tabs tabs={["Current", "History"]} active="Current" setActive={() => {}} /><form onSubmit={submit} className="rounded-lg border border-blue-100 bg-white p-5 shadow-soft"><h3 className="font-semibold">Permission Request</h3><div className="mt-4 grid gap-3 md:grid-cols-4"><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3" /><select value={form.periodNumber} onChange={(e) => setForm({ ...form, periodNumber: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3"><option value="">Full Day</option>{[1,2,3,4,5,6,7].map((period) => <option key={period}>{period}</option>)}</select><select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3"><option value="">Reason</option>{["Medical","Family reason","Official permission","Event participation","Sports"].map((reason) => <option key={reason}>{reason}</option>)}</select>{form.reason === "Event participation" && <select value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3"><option value="">Select Event</option>{events.map((event) => <option key={event.id} value={event.id}>{event.title} - {event.event_date?.slice(0, 10)}</option>)}</select>}<input type="file" onChange={(e) => setFile(e.target.files?.[0])} className="rounded-lg border border-dashed border-blue-200 px-3 py-3 md:col-span-2" /></div><button className="mt-4 rounded-lg bg-sweety-blue px-4 py-3 font-semibold text-white">Submit Request</button>{message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}</form><label className="flex max-w-xl items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 shadow-sm"><Search size={16} className="text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Permission History" className="w-full bg-transparent text-sm outline-none" /></label>{filtered.length === 0 && <div className="rounded-lg border border-blue-100 bg-white p-6 text-sm text-gray-500 shadow-soft">No Permissions</div>}<div className="grid gap-3 md:grid-cols-2">{filtered.map((item) => { const reviewer = item.reviewed_by_role === "hod" ? "HOD" : item.reviewed_by_faculty_type === "incharge" ? "class incharge" : item.reviewed_by_name || ""; return <div key={item.id} className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm"><p className="font-semibold">{item.date?.slice(0, 10)} {item.period_number ? `Period ${item.period_number}` : "Full Day"}</p><p className="text-sm text-gray-500">{item.reason}</p><p className="mt-2 text-sm font-semibold">{item.status}{reviewer ? ` by ${reviewer}` : ""}</p></div>; })}</div></div>;
}

function statusLabel(status) {
  if (status === "absent") return "Absent";
  if (["present", "smart_present", "present_override"].includes(status)) return "Present";
  return status;
}

function AttendanceView({ attendance }) {
  const [search, setSearch] = useState("");
  const records = (attendance?.records || []).filter((record) =>
    `${record.attendance_date} ${record.subject} ${record.topic} ${record.status}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  const totalPresent = (attendance?.records || []).filter((record) =>
    ["present", "smart_present", "present_override"].includes(record.status)
  ).length;
  const totalSessions = attendance?.records?.length || 0;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-soft dark:border-slate-700 dark:bg-slate-950">
        <h3 className="font-semibold dark:text-white">Total Attendance</h3>
        <p className="mt-2 text-3xl font-bold text-sweety-blue dark:text-sky-300">{attendance?.overall || 0}%</p>
        <p className="mt-2 text-sm text-gray-500">
          {totalPresent} present of {totalSessions} marked sessions
        </p>
      </div>
      <label className="flex max-w-xl items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-950">
        <Search size={16} className="text-gray-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search attendance date or subject"
          className="w-full bg-transparent text-sm outline-none dark:text-white"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        {attendance?.subjects?.length === 0 && (
          <div className="rounded-lg border border-blue-100 bg-white p-6 text-sm text-gray-500 shadow-soft dark:border-slate-700 dark:bg-slate-950">
            No Previous Attendance
          </div>
        )}
        {attendance?.subjects?.map((subject) => (
          <div key={subject.subject} className="rounded-lg border border-blue-100 bg-white p-5 shadow-soft dark:border-slate-700 dark:bg-slate-950">
            <div className="flex justify-between">
              <h3 className="font-semibold dark:text-white">{subject.subject}</h3>
              <span className="text-sweety-blue dark:text-sky-300">{subject.percentage}%</span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-sky-50 dark:bg-slate-800">
              <div className="h-2 rounded-full bg-sweety-blue" style={{ width: `${subject.percentage}%` }} />
            </div>
            <p className="mt-3 text-sm text-gray-500">
              {subject.present}/{subject.total} attended this semester
            </p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-blue-100 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-950">
        <table className="w-full text-left text-sm">
          <thead className="bg-sky-50 text-gray-500 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Day</th>
              <th className="p-3">Period</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Topic</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-gray-500">
                  No Previous Attendance
                </td>
              </tr>
            )}
            {records.map((record) => (
              <tr key={record.id} className="border-t border-blue-50 dark:border-slate-800">
                <td className="p-3 dark:text-slate-200">{record.attendance_date?.slice(0, 10)}</td>
                <td className="p-3 dark:text-slate-200">{record.day_name}</td>
                <td className="p-3 dark:text-slate-200">{record.period_number}</td>
                <td className="p-3 dark:text-slate-200">{record.subject}</td>
                <td className="p-3 dark:text-slate-200">{record.topic}</td>
                <td
                  className={`p-3 font-semibold ${record.status === "absent" ? "text-red-600" : "text-emerald-600 dark:text-emerald-400"}`}
                >
                  {statusLabel(record.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TimetableView({ timetable }) {
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const today = days[(new Date().getDay() + 6) % 7];
  const todayClasses = timetable.filter((item) => item.day_of_week === today);
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-soft dark:border-slate-700 dark:bg-slate-950">
        <h3 className="font-semibold dark:text-white">Today&apos;s Classes</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {todayClasses.map((item) => (
            <div key={item.id} className="rounded-lg bg-sky-50 p-3 text-sm dark:bg-slate-900">
              <p className="font-semibold dark:text-white">{item.subject_name}</p>
              <p className="text-gray-500">Period {item.period_number} - Room {item.room}</p>
              <p className="text-gray-500">
                {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-950">
        <h3 className="border-b border-blue-50 px-5 py-4 font-semibold dark:border-slate-800 dark:text-white">Time Table</h3>
        <table className="w-full text-left text-sm">
          <thead className="bg-sky-50 text-gray-500 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="p-3">Day</th>
              <th className="p-3">Period</th>
              <th className="p-3">Time</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Room</th>
            </tr>
          </thead>
          <tbody>
            {timetable.map((item) => (
              <tr key={item.id} className="border-t border-blue-50 dark:border-slate-800">
                <td className="p-3 font-semibold dark:text-slate-200">{item.day_of_week}</td>
                <td className="p-3 dark:text-slate-200">{item.period_number}</td>
                <td className="p-3 dark:text-slate-200">
                  {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                </td>
                <td className="p-3 dark:text-slate-200">{item.subject_name}</td>
                <td className="p-3 dark:text-slate-200">{item.room}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Cards({ title, items = [] }) {
  return <div className="grid gap-4 md:grid-cols-2">{items?.length === 0 && <div className="rounded-lg border border-blue-100 bg-white p-6 text-sm text-gray-500 shadow-soft">No {title}</div>}{items?.map((item) => <div key={item.id || item._id} className="rounded-lg border border-blue-100 bg-white p-5 shadow-soft"><h3 className="font-semibold">{item.title}</h3><p className="mt-2 text-sm text-gray-500">{item.description || item.body}</p><p className="mt-4 text-sm text-sweety-blue">{item.venue} {item.event_time || item.time}</p></div>)}</div>;
}

function Profile({ user }) {
  return <div className="rounded-lg border border-blue-100 bg-white p-6 shadow-soft"><h3 className="text-xl font-semibold">{user.name}</h3><div className="mt-4 grid gap-3 text-sm text-gray-600 md:grid-cols-2"><p>Email: {user.email}</p><p>Roll number: {user.rollNumber}</p><p>Branch: {user.branch}</p><p>Year: {user.year}</p><p>Section: {user.section}</p><p>Phone: {user.phone}</p></div></div>;
}

function CampusPanel({ campus, status }) {
  const inside = status?.insideCampus || status?.campus_status === "INSIDE" || status?.campusStatus === "INSIDE";
  return <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-soft"><StatusBadge inside={inside} /><p className="mt-4 text-sm text-gray-600">{campus.privacyNotice}</p><p className="mt-3 text-sm text-gray-500">{status?.nearestZone?.description || status?.zone_name || "No exact location is shared while outside campus."}</p>{campus.error && <p className="mt-3 text-sm text-red-600">{campus.error}</p>}<p className="mt-4 text-sm text-gray-500">Permission: {campus.permission}</p></div>;
}
