import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { BookUp, CalendarClock, CalendarPlus, ClipboardCheck, Gauge, Home, Map, MapPinned, MessageCircle, Search, ShieldCheck, Upload, UserRound, Users } from "lucide-react";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import Tabs from "../components/Tabs";
import FacultyAttendanceMarker from "../components/FacultyAttendanceMarker";
import CampusMiniMap from "../components/CampusMiniMap";
import { formatCampusLocation, labelForAttendanceType, periodRangeForType, SMART_ATTENDANCE_TYPES } from "../utils/campusLocation";
import { formatExactTimestamp } from "../utils/campusMapStyles";
import CollegeMap from "./CollegeMap";
import { api, API_URL } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ChatPanel from "../components/ChatPanel";
import NotificationsPage from "../components/NotificationsPage";
import { invalidate, REFRESH_EVENT, shouldRefresh } from "../utils/refresh";
import { pathToTab } from "../utils/dashboardRoutes";

const nav = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "requests", label: "Registration Requests", icon: ClipboardCheck },
  { id: "classes", label: "Class Management", icon: Users },
  { id: "monitoring", label: "Student Monitoring", icon: MapPinned },
  { id: "attendance", label: "Attendance", icon: Gauge },
  { id: "smartAttendance", label: "Smart Attendance", icon: Gauge },
  { id: "mentorManagement", label: "Mentors", icon: UserRound },
  { id: "timetable", label: "Timetable", icon: CalendarClock },
  { id: "upload", label: "Upload Center", icon: Upload },
  { id: "events", label: "Events", icon: CalendarPlus },
  { id: "map", label: "College Map", icon: Map },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "profile", label: "Profile", icon: UserRound }
];

const hodNav = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "facultyRequests", label: "Faculty Requests", icon: ShieldCheck },
  { id: "permissionRequests", label: "Permission Requests", icon: ClipboardCheck },
  { id: "requests", label: "Student Requests", icon: ClipboardCheck },
  { id: "facultyManagement", label: "Faculty Management", icon: Users },
  { id: "monitoring", label: "Student Management", icon: MapPinned },
  { id: "classes", label: "Class Management", icon: Users },
  { id: "attendance", label: "Attendance Reports", icon: Gauge },
  { id: "mentorManagement", label: "Assign Mentors", icon: UserRound },
  { id: "timetable", label: "Timetable", icon: CalendarClock },
  { id: "upload", label: "Study Materials", icon: Upload },
  { id: "events", label: "Events", icon: CalendarPlus },
  { id: "map", label: "College Map", icon: Map },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "profile", label: "Profile", icon: UserRound }
];

const branches = ["CSE", "CS Cyber Security", "ECE", "EEE", "MECH", "CIVIL", "IT", "CHEMICAL", "AIML", "DS"];
const sections = ["A", "B", "C", "D"];
const knownSubjects = {
  "CS Cyber Security-2-A": ["Software Engineering", "Business Economics & Financial Analysis", "Discrete Mathematics", "Computer Networks", "Operating Systems", "Constitution of India", "Node JS Lab", "RTRP", "CN Lab", "OS Lab"]
};

export default function FacultyDashboard() {
  const { user } = useAuth();
  const isHod = user.role === "hod";
  const dashboardRole = isHod ? "hod" : "faculty";
  const [active, setActive] = useState(() => pathToTab(dashboardRole));
  const [monitorTab, setMonitorTab] = useState("Live Tracking");
  const [uploadTab, setUploadTab] = useState("Notes");
  const [overview, setOverview] = useState(null);
  const [live, setLive] = useState([]);
  const [filters, setFilters] = useState({ q: "", branch: user.branch, year: "", section: "", rollNumber: "" });
  const [requests, setRequests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [classes, setClasses] = useState([]);
  const [context, setContext] = useState({ branch: user.branch, year: "2", section: "A", subjectId: "" });
  const [attendanceContext, setAttendanceContext] = useState({ branch: user.branch, year: "2", section: "A", subjectId: "" });
  const [classStudents, setClassStudents] = useState([]);
  const [monitorStudents, setMonitorStudents] = useState([]);
  const [facultyRequests, setFacultyRequests] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [absenceRequests, setAbsenceRequests] = useState([]);
  const canSmartAttendance = user.role === "faculty" && user.facultyType === "incharge";

  async function refreshAll() {
    const dashboard = await api.get(isHod ? "/dashboard/hod" : "/dashboard/faculty");
    const data = dashboard.data;
      setOverview(data);
      setLive(data.liveStudents || []);
      setFacultyList(data.faculty || []);
    const [requestRes, classRes, mentorRes, absenceRes] = await Promise.all([
      api.get("/registration-requests"),
      api.get("/academic/classes"),
      api.get("/management/mentors").catch(() => ({ data: [] })),
      api.get("/management/absence-requests").catch(() => ({ data: [] }))
    ]);
    setRequests(requestRes.data || []);
    setClasses(classRes.data || []);
    setMentors(mentorRes.data || []);
    setAbsenceRequests(absenceRes.data || []);
    if (isHod) {
      const [facultyRequestRes, facultyRes] = await Promise.all([
        api.get("/registration-requests/faculty"),
        api.get("/management/faculty")
      ]);
      setFacultyRequests(facultyRequestRes.data || []);
      setFacultyList(facultyRes.data || []);
    }
  }

  useEffect(() => {
    refreshAll();
  }, [isHod]);

  useEffect(() => {
    const onPath = () => setActive(pathToTab(dashboardRole));
    window.addEventListener("popstate", onPath);
    return () => window.removeEventListener("popstate", onPath);
  }, [dashboardRole]);

  useEffect(() => {
    const onRefresh = (event) => {
      if (shouldRefresh(event, ["dashboard", "requests", "attendance", "smartAttendance", "documents", "events", "mentors", "academic"])) refreshAll();
    };
    window.addEventListener(REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(REFRESH_EVENT, onRefresh);
  }, [isHod]);

  useEffect(() => {
    const first = classes.find((item) => item.status === "active");
    if (first && !context.subjectId) {
      const initial = { branch: first.branch, year: first.year, section: first.section, subjectId: String(first.subject_id) };
      setContext(initial);
      setAttendanceContext(initial);
    }
  }, [classes]);

  useEffect(() => {
    const params = new URLSearchParams({ branch: context.branch, year: context.year, section: context.section });
    api.get(`/academic/subjects?${params}`).then(({ data }) => {
      setSubjects(data || []);
      setContext((current) => ({ ...current, subjectId: current.subjectId || data?.[0]?.id || "" }));
    });
    api.get(`/academic/timetable?${params}`).then(({ data }) => setTimetable(data || []));
    api.get(`/profile/students/search?${params}`).then(({ data }) => setClassStudents(data || []));
  }, [context.branch, context.year, context.section]);

  useEffect(() => {
    const token = localStorage.getItem("sweety_token");
    const socket = io(API_URL || window.location.origin, { auth: { token } });
    socket.on("location:update", (update) => {
      const inside = Boolean(update.insideCampus && update.campusStatus === "INSIDE");
      const entry = {
        student: update.student,
        student_id: update.student?.id,
        latitude: inside ? update.latitude : null,
        longitude: inside ? update.longitude : null,
        campus_status: update.campusStatus,
        campusStatus: update.campusStatus,
        insideCampus: inside,
        isStale: false,
        zone_name: inside ? update.nearestZone?.description || update.nearestZone?.name : null,
        last_updated: update.lastUpdated,
        lastUpdated: update.lastUpdated
      };
      setLive((items) => [entry, ...items.filter((item) => getStudentId(item) !== update.student.id)].slice(0, 50));
      setMonitorStudents((items) =>
        items.map((row) =>
          Number(row.id) === Number(update.student.id)
            ? {
                ...row,
                campus_status: update.campusStatus,
                zone_name: entry.zone_name,
                latitude: entry.latitude,
                longitude: entry.longitude,
                last_updated: update.lastUpdated
              }
            : row
        )
      );
      invalidate(["dashboard", "attendance"]);
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (active === "monitoring") {
      const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
      api.get(`/profile/students/search?${params}`).then(({ data }) => setMonitorStudents(data || []));
    }
  }, [active, filters]);

  useEffect(() => {
    if (active !== "monitoring" && active !== "overview") return undefined;
    async function pullLive() {
      const { data } = await api.get("/location/live");
      setLive(data || []);
    }
    pullLive();
    const timer = setInterval(pullLive, 20000);
    return () => clearInterval(timer);
  }, [active]);

  return (
    <Layout title={isHod ? "HOD Dashboard" : "Faculty Dashboard"} subtitle={isHod ? "Branch-wide approvals, attendance and academic management" : "Branch-scoped monitoring, attendance and uploads"} navItems={isHod ? hodNav : nav.filter((item) => item.id !== "smartAttendance" || canSmartAttendance)} active={active} setActive={setActive}>
      {active === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard title="Assigned Students" value={overview?.assignedStudents || 0} icon={Users} />
            <StatCard title="Pending Requests" value={overview?.pendingRequests || 0} icon={ClipboardCheck} />
            {isHod && <StatCard title="Faculty Requests" value={overview?.pendingFaculty || 0} icon={ShieldCheck} />}
            <StatCard title="Inside Campus" value={overview?.insideCampus || 0} icon={MapPinned} tone="green" />
            <StatCard title="Outside Campus" value={overview?.outsideCampus || 0} icon={MapPinned} />
          </div>
          <LiveGrid live={live} />
        </div>
      )}

      {active === "facultyRequests" && <FacultyRequests requests={facultyRequests} setRequests={setFacultyRequests} />}
      {active === "permissionRequests" && <PermissionRequests requests={absenceRequests} setRequests={setAbsenceRequests} />}
      {active === "facultyManagement" && <FacultyManagement faculty={facultyList} />}
      {active === "requests" && <RegistrationRequests requests={requests} setRequests={setRequests} />}
      {active === "classes" && <ClassManagement classes={classes} setClasses={setClasses} />}

      {active === "monitoring" && (
        <div className="space-y-5">
          <Tabs tabs={["Live Tracking", "Search Students", "Campus Status"]} active={monitorTab} setActive={setMonitorTab} />
          {monitorTab === "Live Tracking" && <LiveGrid live={live} />}
          {monitorTab === "Search Students" && <StudentSearch students={monitorStudents} filters={filters} setFilters={setFilters} />}
          {monitorTab === "Campus Status" && <CampusStatus live={live} />}
        </div>
      )}

      {active === "attendance" && (
        <FacultyAttendanceMarker classes={classes} context={attendanceContext} setContext={setAttendanceContext} />
      )}
      {active === "smartAttendance" && canSmartAttendance && (
        <SmartAttendance classes={classes} students={classStudents} context={context} setContext={setContext} />
      )}
      {active === "mentorManagement" && <MentorManagement faculty={facultyList} mentors={mentors} setMentors={setMentors} isHod={isHod} user={user} />}
      {active === "timetable" && <TimetableManager timetable={timetable} subjects={subjects} context={context} setContext={setContext} refresh={() => api.get(`/academic/timetable?${new URLSearchParams({ branch: context.branch, year: context.year, section: context.section })}`).then(({ data }) => setTimetable(data || []))} />}
      {active === "upload" && <UploadCenter classes={classes} uploadTab={uploadTab} setUploadTab={setUploadTab} />}
      {active === "events" && <EventCreator classes={classes} />}
      {active === "map" && <CollegeMap />}
      {active === "messages" && <ChatPanel mode={isHod ? "hod" : "faculty"} />}
      {active === "profile" && <div className="rounded-lg border border-blue-100 bg-white p-6 shadow-soft"><h3 className="text-xl font-semibold">{user.name}</h3><p className="mt-2 text-gray-500">{user.email || user.facultyId} - {user.branch}</p></div>}
      {active === "notifications" && <NotificationsPage />}
    </Layout>
  );
}

function getStudentId(item) {
  return item.student?.id || item.student_id || item.id;
}

function normalizeLive(item) {
  const fromSql = !item.student;
  const insideCampus = Boolean(item.insideCampus ?? (item.campus_status === "INSIDE" && item.campusStatus !== "OUTSIDE"));
  return {
    student: fromSql
      ? { id: item.student_id, name: item.name, rollNumber: item.roll_number, branch: item.branch, year: item.year, section: item.section }
      : item.student,
    latitude: insideCampus ? item.latitude : null,
    longitude: insideCampus ? item.longitude : null,
    insideCampus,
    isStale: Boolean(item.isStale),
    zoneName: insideCampus ? item.nearestZone?.description || item.nearestZone?.name || item.zone_name : null,
    lastUpdated: item.lastUpdated || item.last_updated,
    attendance: item.attendance_percentage
  };
}

function LiveGrid({ live = [] }) {
  const rows = live.map(normalizeLive);
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {rows.map((item, index) => (
        <div key={`${item.student?.id || index}`} className="app-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold dark:text-white">{item.student?.name || "Student"}</h3>
              <p className="text-sm text-muted">
                {item.student?.rollNumber} - {item.student?.branch} - Year {item.student?.year} - Section {item.student?.section}
              </p>
            </div>
            <StatusBadge inside={item.insideCampus} label={item.insideCampus ? "INSIDE" : "OUTSIDE"} />
          </div>
          <p className="mt-4 text-sm font-medium text-sweety-ink dark:text-slate-200">
            {item.insideCampus
              ? formatCampusLocation(item.zoneName)
              : item.isStale
                ? "No recent location update (showing as outside campus)."
                : "Student is outside campus — location hidden."}
          </p>
          <CampusMiniMap
            insideCampus={item.insideCampus}
            latitude={item.latitude}
            longitude={item.longitude}
            label={item.student?.name}
            locationLabel={item.insideCampus ? formatCampusLocation(item.zoneName) : "Outside campus"}
            lastUpdated={item.lastUpdated}
          />
        </div>
      ))}
    </div>
  );
}

function StudentSearch({ students, filters, setFilters }) {
  return <div className="space-y-4"><div className="grid gap-3 rounded-lg border border-blue-100 bg-white p-4 shadow-sm md:grid-cols-5"><label className="flex items-center gap-2 rounded-lg border border-blue-100 px-3 py-2 md:col-span-2"><Search size={16} className="text-gray-400" /><input value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Name or branch" className="w-full bg-transparent text-sm outline-none" /></label><select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-2">{branches.map((branch) => <option key={branch}>{branch}</option>)}</select><select value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-2"><option value="">Year</option>{[1,2,3,4].map((year) => <option key={year}>{year}</option>)}</select><select value={filters.section} onChange={(e) => setFilters({ ...filters, section: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-2"><option value="">Section</option>{sections.map((section) => <option key={section}>{section}</option>)}</select><input value={filters.rollNumber} onChange={(e) => setFilters({ ...filters, rollNumber: e.target.value })} placeholder="Roll number" className="rounded-lg border border-blue-100 px-3 py-2 md:col-span-2" /></div><div className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-soft"><table className="w-full text-left text-sm"><thead className="bg-sky-50 text-gray-500"><tr><th className="p-3">Name</th><th className="p-3">Roll</th><th className="p-3">Class</th><th className="p-3">Attendance</th><th className="p-3">Campus</th><th className="p-3">Nearest place</th><th className="p-3">Last update</th></tr></thead><tbody>{students.map((student) => <tr key={student.id} className="border-t border-blue-50"><td className="p-3 font-medium">{student.name}</td><td className="p-3">{student.roll_number}</td><td className="p-3">{student.branch} Y{student.year} {student.section}</td><td className="p-3">{student.attendance || student.attendance_percentage || 0}%</td><td className="p-3"><StatusBadge inside={student.campus_status === "INSIDE"} label={student.campus_status || "OUTSIDE"} /></td><td className="p-3">{student.campus_status === "INSIDE" ? formatCampusLocation(student.zone_name) : "Hidden"}</td><td className="p-3 font-medium text-sweety-ink dark:text-slate-200">{formatExactTimestamp(student.last_updated)}</td></tr>)}</tbody></table></div></div>;
}

function CampusStatus({ live }) {
  const inside = live.filter((item) => normalizeLive(item).insideCampus).length;
  return <div className="grid gap-4 md:grid-cols-2"><StatCard title="Inside Now" value={inside} icon={MapPinned} tone="green" /><StatCard title="Outside / Hidden" value={Math.max(live.length - inside, 0)} icon={MapPinned} /></div>;
}

function RegistrationRequests({ requests, setRequests }) {
  async function review(id, status) {
    await api.put(`/registration-requests/${id}/review`, { status });
    setRequests((items) => items.map((item) => item.id === id ? { ...item, status } : item));
  }
  if (!requests.length) {
    return <div className="app-card p-6 text-sm text-muted">No registration requests were there</div>;
  }
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {requests.map((request) => (
        <div key={request.id} className="rounded-lg border border-blue-100 bg-white p-5 shadow-soft dark:border-slate-700 dark:bg-slate-950">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold dark:text-white">{request.name}</h3>
              <p className="text-sm text-gray-500">{request.roll_number} - {request.email}</p>
              <p className="mt-2 text-sm text-gray-500">
                {request.branch} Year {request.year} Section {request.section} - {request.admission_type}
              </p>
              <p className="mt-1 text-sm text-gray-500">Phone: {request.phone}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${request.status === "approved" ? "bg-emerald-50 text-emerald-700" : request.status === "rejected" || request.status === "blocked" ? "bg-red-50 text-red-700" : "bg-sky-50 text-sweety-blue"}`}
            >
              {request.status}
            </span>
          </div>
          {request.status === "pending" && (
            <div className="mt-4 flex gap-3">
              <button onClick={() => review(request.id, "approved")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                Approve
              </button>
              <button onClick={() => review(request.id, "rejected")} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                Reject
              </button>
              <button onClick={() => review(request.id, "blocked")} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
                Block
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FacultyRequests({ requests, setRequests }) {
  async function review(id, status) {
    await api.put(`/registration-requests/faculty/${id}/review`, { status });
    setRequests((items) => items.map((item) => item.id === id ? { ...item, status } : item));
  }
  return <div className="grid gap-4 xl:grid-cols-2">{requests.map((request) => <div key={request.id} className="rounded-lg border border-blue-100 bg-white p-5 shadow-soft"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{request.name}</h3><p className="text-sm text-gray-500">{request.faculty_id} - {request.email}</p><p className="mt-2 text-sm text-gray-500">{request.branch} - {request.faculty_type || "normal"} faculty</p><p className="mt-1 text-sm text-gray-500">Mobile: {request.mobile || request.phone}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${request.status === "approved" ? "bg-emerald-50 text-emerald-700" : request.status === "pending" ? "bg-sky-50 text-sweety-blue" : "bg-red-50 text-red-700"}`}>{request.status}</span></div>{request.status === "pending" && <div className="mt-4 flex gap-3"><button onClick={() => review(request.id, "approved")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Approve</button><button onClick={() => review(request.id, "rejected")} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">Reject</button><button onClick={() => review(request.id, "blocked")} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white">Block</button></div>}</div>)}</div>;
}

function PermissionRequests({ requests, setRequests }) {
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  async function review(id, status) {
    const { data } = await api.put(`/management/absence-requests/${id}/review`, { status });
    setMessage(data.message || `Request ${status} successfully`);
    setRequests((items) => items.map((item) => item.id === id ? { ...item, status } : item));
  }
  const filtered = requests.filter((request) => `${request.student_name || ""} ${request.roll_number || ""} ${request.reason || ""} ${request.status || ""} ${request.event_title || ""}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-4"><label className="flex max-w-xl items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 shadow-sm"><Search size={16} className="text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student, roll, date or status" className="w-full bg-transparent text-sm outline-none" /></label>{message && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{message}</p>}{filtered.length === 0 && <div className="rounded-lg border border-blue-100 bg-white p-6 text-sm text-gray-500 shadow-soft">No Permissions</div>}<div className="grid gap-4 xl:grid-cols-2">{filtered.map((request) => { const reviewer = request.reviewed_by_role === "hod" ? "HOD" : request.reviewed_by_faculty_type === "incharge" ? "class incharge" : request.reviewed_by_name || ""; return <div key={request.id} className="rounded-lg border border-blue-100 bg-white p-5 shadow-soft"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">Permission request from {request.roll_number} & {request.student_name}</h3><p className="text-sm text-gray-500">{request.branch} Y{request.year} {request.section}</p><p className="mt-2 text-sm text-gray-500">Date: {request.date?.slice(0, 10)} {request.period_number ? `Period ${request.period_number}` : "Full day"}</p><p className="mt-1 text-sm text-gray-500">Reason: {request.reason}</p><p className="mt-1 text-sm text-gray-500">Event: {request.event_title || "No event linked"}</p>{request.status !== "pending" && reviewer && <p className="mt-2 text-sm font-semibold text-emerald-700">Request {request.status} by {reviewer}</p>}{request.proof_file && <a href={request.proof_file} target="_blank" className="mt-2 inline-block text-sm font-semibold text-sweety-blue">View proof</a>}</div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${request.status === "approved" ? "bg-emerald-50 text-emerald-700" : request.status === "pending" ? "bg-sky-50 text-sweety-blue" : "bg-red-50 text-red-700"}`}>{request.status}</span></div>{request.status === "pending" && <div className="mt-4 flex flex-wrap gap-3"><button onClick={() => review(request.id, "approved")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Approve</button><button onClick={() => review(request.id, "rejected")} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">Reject</button></div>}</div>; })}</div></div>;
}

function FacultyManagement({ faculty }) {
  return <div className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-soft"><table className="w-full text-left text-sm"><thead className="bg-sky-50 text-gray-500"><tr><th className="p-3">Name</th><th className="p-3">Faculty ID</th><th className="p-3">Type</th><th className="p-3">Status</th><th className="p-3">Contact</th></tr></thead><tbody>{faculty.map((item) => <tr key={item.id} className="border-t border-blue-50"><td className="p-3 font-medium">{item.name}</td><td className="p-3">{item.faculty_id}</td><td className="p-3">{item.faculty_type || "normal"}</td><td className="p-3">{item.approval_status}</td><td className="p-3">{item.email}<br />{item.mobile || item.phone}</td></tr>)}</tbody></table></div>;
}

function MentorManagement({ faculty, mentors, setMentors, isHod, user }) {
  const [form, setForm] = useState({ facultyId: "", branch: user.branch || "CS Cyber Security", year: user.year || "2", section: user.section || "A", startRoll: "", endRoll: "" });
  async function assign(event) {
    event.preventDefault();
    await api.post("/management/mentors", form);
    const { data } = await api.get("/management/mentors");
    setMentors(data || []);
  }
  return <div className="space-y-5">{isHod && <form onSubmit={assign} className="rounded-lg border border-blue-100 bg-white p-5 shadow-soft"><h3 className="font-semibold">Assign Mentors</h3><div className="mt-4 grid gap-3 md:grid-cols-4"><select required value={form.facultyId} onChange={(e) => setForm({ ...form, facultyId: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3"><option value="">Faculty</option>{faculty.filter((item) => item.approval_status === "approved").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3">{branches.map((branch) => <option key={branch}>{branch}</option>)}</select><select value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3">{[1,2,3,4].map((year) => <option key={year}>{year}</option>)}</select><select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3">{sections.map((section) => <option key={section}>{section}</option>)}</select><input required value={form.startRoll} onChange={(e) => setForm({ ...form, startRoll: e.target.value })} placeholder="Start roll" className="rounded-lg border border-blue-100 px-3 py-3" /><input required value={form.endRoll} onChange={(e) => setForm({ ...form, endRoll: e.target.value })} placeholder="End roll" className="rounded-lg border border-blue-100 px-3 py-3" /><button className="rounded-lg bg-sweety-blue px-4 py-3 font-semibold text-white">Assign Range</button></div></form>}<MentorCards mentors={mentors} /></div>;
}

function MentorCards({ mentors }) {
  return <div className="grid gap-3 md:grid-cols-2">{mentors.length === 0 && <div className="rounded-lg border border-blue-100 bg-white p-6 text-sm text-gray-500 shadow-soft">No Mentors</div>}{mentors.map((item) => <div key={`${item.assignment_type}-${item.id}`} className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm"><p className="font-semibold">Mentor: {item.faculty_name} ({item.faculty_id})</p><p className="text-sm text-gray-500">{item.branch} Year {item.year} Section {item.section}</p>{item.assignment_type === "range" ? <div className="mt-3 overflow-hidden rounded-lg border border-blue-50"><table className="w-full text-left text-xs"><thead className="bg-sky-50 text-gray-500"><tr><th className="p-2">Roll</th><th className="p-2">Name</th><th className="p-2">Year</th></tr></thead><tbody>{(item.students || []).map((student) => <tr key={student.id} className="border-t border-blue-50"><td className="p-2">{student.roll_number}</td><td className="p-2">{student.name}</td><td className="p-2">{student.year}</td></tr>)}</tbody></table></div> : <p className="mt-2 text-sm text-gray-600">{item.roll_number} - {item.student_name} - Year {item.year}</p>}</div>)}</div>;
}

function ClassManagement({ classes, setClasses }) {
  const [form, setForm] = useState({ branch: "CS Cyber Security", year: "2", section: "A", subject: "" });
  const [error, setError] = useState("");
  const subjectOptions = knownSubjects[`${form.branch}-${form.year}-${form.section}`] || [];
  async function refresh() {
    const { data } = await api.get("/academic/classes");
    setClasses(data || []);
  }
  async function submit(event) {
    event.preventDefault();
    try {
      setError("");
      await api.post("/academic/classes", form);
      setForm({ ...form, subject: "" });
      await refresh();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to add class");
    }
  }
  async function setStatus(id, status) {
    await api.put(`/academic/classes/${id}/status`, { status });
    await refresh();
  }
  async function remove(id) {
    await api.delete(`/academic/classes/${id}`);
    await refresh();
  }
  return <div className="space-y-5"><form onSubmit={submit} className="rounded-lg border border-blue-100 bg-white p-5 shadow-soft"><h3 className="font-semibold">Add Class</h3><div className="mt-4 grid gap-3 md:grid-cols-5"><select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value, subject: "" })} className="rounded-lg border border-blue-100 px-3 py-3">{branches.map((branch) => <option key={branch}>{branch}</option>)}</select><select value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value, subject: "" })} className="rounded-lg border border-blue-100 px-3 py-3">{[1,2,3,4].map((year) => <option key={year}>{year}</option>)}</select><select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value, subject: "" })} className="rounded-lg border border-blue-100 px-3 py-3">{sections.map((section) => <option key={section}>{section}</option>)}</select>{subjectOptions.length ? <select required value={subjectOptions.includes(form.subject) ? form.subject : form.subject ? "__custom" : ""} onChange={(e) => setForm({ ...form, subject: e.target.value === "__custom" ? "" : e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3"><option value="">Subject</option>{subjectOptions.map((subject) => <option key={subject}>{subject}</option>)}<option value="__custom">Create new subject</option></select> : <input required placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3" />}<button className="rounded-lg bg-sweety-blue px-4 py-3 font-semibold text-white">Add</button></div>{subjectOptions.length > 0 && !subjectOptions.includes(form.subject) && <input placeholder="New subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="mt-3 w-full rounded-lg border border-blue-100 px-3 py-3" />}{error && <p className="mt-3 text-sm text-red-600">{error}</p>}</form><div className="grid gap-4 md:grid-cols-2">{classes.map((item) => <div key={item.id} className="rounded-lg border border-blue-100 bg-white p-5 shadow-soft"><div className="flex items-start justify-between"><div><h3 className="font-semibold">{item.subject_name}</h3><p className="text-sm text-gray-500">{item.branch} Year {item.year} Section {item.section}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{item.status}</span></div><div className="mt-4 flex gap-2"><button onClick={() => setStatus(item.id, item.status === "active" ? "blocked" : "active")} className="rounded-lg border border-blue-100 px-3 py-2 text-sm">{item.status === "active" ? "Block" : "Unblock"}</button><button onClick={() => remove(item.id)} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white">Remove</button></div></div>)}</div></div>;
}

function ContextSelector({ context, setContext, subjects }) {
  return <div className="grid gap-3 rounded-lg border border-blue-100 bg-white p-4 shadow-sm md:grid-cols-4"><select value={context.branch} onChange={(e) => setContext({ ...context, branch: e.target.value, subjectId: "" })} className="rounded-lg border border-blue-100 px-3 py-2">{branches.map((branch) => <option key={branch}>{branch}</option>)}</select><select value={context.year} onChange={(e) => setContext({ ...context, year: e.target.value, subjectId: "" })} className="rounded-lg border border-blue-100 px-3 py-2">{[1,2,3,4].map((year) => <option key={year}>{year}</option>)}</select><select value={context.section} onChange={(e) => setContext({ ...context, section: e.target.value, subjectId: "" })} className="rounded-lg border border-blue-100 px-3 py-2">{sections.map((section) => <option key={section}>{section}</option>)}</select><select value={context.subjectId} onChange={(e) => setContext({ ...context, subjectId: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-2">{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></div>;
}

function SmartAttendance({ classes, students, context, setContext }) {
  const [tab, setTab] = useState("Create");
  const [form, setForm] = useState({
    classId: "",
    reason: "College event duty",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    attendanceType: "whole_day",
    periodStart: 1,
    remarks: ""
  });
  const [selected, setSelected] = useState([]);
  const [history, setHistory] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const activeClasses = classes.filter((item) => item.status === "active");
  const classStudents = students.filter(
    (student) =>
      student.branch === context.branch &&
      String(student.year) === String(context.year) &&
      student.section === context.section
  );
  const filteredHistory = history.filter((item) =>
    `${item.reason} ${item.start_date} ${item.end_date} ${item.section}`.toLowerCase().includes(search.toLowerCase())
  );
  const periodRange = periodRangeForType(form.attendanceType, form.periodStart);
  const showPeriodStart = form.attendanceType === "1_period" || form.attendanceType === "2_periods";

  function selectClass(classId) {
    const item = activeClasses.find((entry) => String(entry.id) === String(classId));
    setForm({ ...form, classId });
    if (item) setContext({ branch: item.branch, year: item.year, section: item.section, subjectId: String(item.subject_id) });
    setSelected([]);
  }

  function toggleStudent(id) {
    const numericId = Number(id);
    setSelected((current) =>
      current.includes(numericId) ? current.filter((item) => item !== numericId) : [...current, numericId]
    );
  }

  function selectAll() {
    setSelected(classStudents.map((student) => Number(student.id)));
  }

  function clearAll() {
    setSelected([]);
  }

  async function loadHistory() {
    const { data } = await api.get("/attendance/smart");
    setHistory(data || []);
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadForEdit(id) {
    setError("");
    try {
      const { data } = await api.get(`/attendance/smart/${id}`);
      setEditingId(id);
      setForm({
        classId: form.classId,
        reason: data.reason,
        startDate: data.start_date?.slice(0, 10),
        endDate: data.end_date?.slice(0, 10),
        attendanceType: data.attendance_type || "whole_day",
        periodStart: data.period_start || 1,
        remarks: data.remarks || ""
      });
      setSelected((data.studentIds || []).map(Number));
      setTab("Edit");
    } catch (err) {
      setError(err.response?.data?.message || "Only class incharge can edit smart attendance.");
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!selected.length) {
      setMessage("");
      setError("Select at least one student for smart attendance.");
      return;
    }
    const payload = {
      branch: context.branch,
      year: context.year,
      section: context.section,
      studentIds: selected,
      reason: form.reason,
      startDate: form.startDate,
      endDate: form.endDate,
      attendanceType: form.attendanceType,
      periodStart: form.periodStart,
      remarks: form.remarks
    };
    try {
      const { data } = editingId
        ? await api.put(`/attendance/smart/${editingId}`, payload)
        : await api.post("/attendance/smart", payload);
      setMessage(data.message || "Smart Attendance saved");
      setSelected([]);
      setEditingId(null);
      setTab("History");
      await loadHistory();
    } catch (err) {
      setMessage("");
      setError(err.response?.data?.message || "Unable to save smart attendance.");
    }
  }

  async function removeEntry(id) {
    setError("");
    if (!window.confirm("Remove this smart attendance record?")) return;
    try {
      const { data } = await api.delete(`/attendance/smart/${id}`);
      setMessage(data.message || "Smart attendance removed");
      if (editingId === id) {
        setEditingId(null);
        setTab("History");
        setSelected([]);
      }
      await loadHistory();
    } catch (err) {
      setError(err.response?.data?.message || "Only class incharge can remove smart attendance.");
    }
  }

  function studentPicker() {
    return (
      <div className="app-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold dark:text-white">Select students</h3>
            <p className="mt-1 text-sm text-muted">
              {labelForAttendanceType(form.attendanceType)} · Periods {periodRange.startPeriod}-{periodRange.endPeriod}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={selectAll} className="app-btn-secondary px-3 py-2 text-xs font-semibold">
              Select all
            </button>
            <button type="button" onClick={clearAll} className="app-btn-secondary px-3 py-2 text-xs font-semibold">
              Clear all
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm font-semibold text-sweety-blue dark:text-sky-300">
          {selected.length} of {classStudents.length} selected
        </p>
        <div className="mt-4 grid max-h-[min(420px,50vh)] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-4">
          {classStudents.map((student) => {
            const id = Number(student.id);
            const isSelected = selected.includes(id);
            return (
              <div
                key={id}
                className={`flex items-start gap-3 rounded-lg border px-3 py-3 text-sm ${
                  isSelected
                    ? "border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-700 dark:bg-orange-950/40 dark:text-orange-200"
                    : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleStudent(id)}
                  className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded"
                />
                <span>
                  <span className="block font-semibold">{student.roll_number}</span>
                  <span>{student.name}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs tabs={["Create", "Edit", "History"]} active={tab} setActive={setTab} />
      {message && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{message}</p>}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      {(tab === "Create" || tab === "Edit") && (
        <form onSubmit={submit} className="space-y-4">
          {tab === "Edit" && !editingId && (
            <div className="app-card p-5 text-sm text-muted">Select a record from History, or pick one below to edit.</div>
          )}
          <div className="app-card p-5">
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
              {tab === "Create" && (
                <select required value={form.classId} onChange={(event) => selectClass(event.target.value)} className="rounded-lg border border-blue-100 px-3 py-3 dark:border-slate-700">
                  <option value="">Select class</option>
                  {activeClasses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.branch} Y{item.year} {item.section} - {item.subject_name}
                    </option>
                  ))}
                </select>
              )}
              <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3 dark:border-slate-700">
                {["College event duty", "Sports practice", "HOD permission", "Lab work", "Seminar", "Medical permission", "Official work"].map((reason) => (
                  <option key={reason}>{reason}</option>
                ))}
              </select>
              <select value={form.attendanceType} onChange={(e) => setForm({ ...form, attendanceType: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3 dark:border-slate-700">
                {SMART_ATTENDANCE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {showPeriodStart && (
                <select value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: Number(e.target.value) })} className="rounded-lg border border-blue-100 px-3 py-3 dark:border-slate-700">
                  {[1, 2, 3, 4, 5, 6, 7].map((period) => (
                    <option key={period} value={period}>
                      Start period {period}
                    </option>
                  ))}
                </select>
              )}
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3 dark:border-slate-700" />
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3 dark:border-slate-700" />
              <input placeholder="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3 dark:border-slate-700" />
            </div>
          </div>
          {(tab === "Create" || editingId) && studentPicker()}
          {(tab === "Create" || editingId) && (
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={!classStudents.length || !selected.length}
                className="rounded-xl bg-gradient-to-r from-sweety-blue to-sweety-sky px-4 py-3 font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editingId ? "Update Smart Attendance" : "Apply Smart Attendance"} ({selected.length})
              </button>
              {editingId && (
                <button type="button" onClick={() => removeEntry(editingId)} className="rounded-xl bg-red-600 px-4 py-3 font-semibold text-white">
                  Remove
                </button>
              )}
            </div>
          )}
        </form>
      )}
      {tab === "History" && (
        <div className="space-y-4">
          <label className="app-card flex max-w-xl items-center gap-2 px-3 py-2">
            <Search size={16} className="text-gray-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reason/date" className="w-full bg-transparent text-sm outline-none" />
          </label>
          {filteredHistory.length === 0 && <div className="app-card p-6 text-sm text-muted">No smart attendance records</div>}
          <div className="grid gap-3 md:grid-cols-2">
            {filteredHistory.map((item) => (
              <div key={item.id} className="app-card p-4">
                <p className="font-semibold dark:text-white">{item.reason}</p>
                <p className="text-sm text-muted">
                  {item.branch} Y{item.year} {item.section}
                </p>
                <p className="text-sm text-muted">
                  {item.start_date?.slice(0, 10)} to {item.end_date?.slice(0, 10)} · {labelForAttendanceType(item.attendance_type)} (P{item.start_period}-{item.end_period})
                </p>
                <p className="mt-2 text-sm font-semibold text-orange-700 dark:text-orange-300">{item.student_count} students</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => loadForEdit(item.id)} className="app-btn-secondary px-3 py-2 text-xs font-semibold">
                    Edit
                  </button>
                  <button type="button" onClick={() => removeEntry(item.id)} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === "Edit" && filteredHistory.length > 0 && !editingId && (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredHistory.map((item) => (
            <button key={item.id} type="button" onClick={() => loadForEdit(item.id)} className="app-card p-4 text-left hover:ring-2 hover:ring-sweety-blue/30">
              <p className="font-semibold dark:text-white">{item.reason}</p>
              <p className="text-sm text-muted">{item.start_date?.slice(0, 10)} · {item.student_count} students</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TimetableManager({ timetable, subjects, context, setContext, refresh }) {
  const [form, setForm] = useState({ dayOfWeek: "MON", periodNumber: 1, startTime: "09:00", endTime: "10:00", room: "309" });
  async function submit(event) {
    event.preventDefault();
    await api.post("/academic/timetable", { ...context, ...form, subjectId: context.subjectId });
    await refresh();
  }
  return <div className="space-y-5"><ContextSelector context={context} setContext={setContext} subjects={subjects} /><form onSubmit={submit} className="rounded-lg border border-blue-100 bg-white p-5 shadow-soft"><div className="grid gap-3 md:grid-cols-6"><select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3">{["MON","TUE","WED","THU","FRI","SAT"].map((day) => <option key={day}>{day}</option>)}</select><select value={form.periodNumber} onChange={(e) => setForm({ ...form, periodNumber: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3">{[1,2,3,4,5,6,7].map((period) => <option key={period}>{period}</option>)}</select><input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3" /><input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3" /><input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3" /><button className="rounded-lg bg-gradient-to-r from-sweety-blue to-sweety-sky px-4 py-3 font-semibold text-white">Save</button></div></form><div className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-soft"><table className="w-full text-left text-sm"><thead className="bg-sky-50 text-gray-500"><tr><th className="p-3">Day</th><th className="p-3">Period</th><th className="p-3">Time</th><th className="p-3">Subject</th><th className="p-3">Room</th></tr></thead><tbody>{timetable.map((item) => <tr key={item.id} className="border-t border-blue-50"><td className="p-3 font-semibold">{item.day_of_week}</td><td className="p-3">{item.period_number}</td><td className="p-3">{item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}</td><td className="p-3">{item.subject_name}</td><td className="p-3">{item.room}</td></tr>)}</tbody></table></div></div>;
}

function UploadCenter({ classes, uploadTab, setUploadTab }) {
  const type = { Notes: "notes", "Important Questions": "important_questions", Notices: "notice" }[uploadTab];
  const activeClasses = classes.filter((item) => item.status === "active");
  const [form, setForm] = useState({ title: "", classId: "" });
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("Current");
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState("");
  async function refreshDocs() {
    const { data } = await api.get(`/documents?type=${type}&search=${encodeURIComponent(search)}`);
    setDocs(data || []);
  }
  useEffect(() => { refreshDocs(); }, [type, search]);
  async function submit(event) {
    event.preventDefault();
    const selected = activeClasses.find((item) => String(item.id) === String(form.classId));
    if (!selected) return;
    const data = new FormData();
    Object.entries({ title: form.title, branch: selected.branch, year: selected.year, section: selected.section, type }).forEach(([key, value]) => data.append(key, value));
    if (file) data.append("file", file);
    await api.post("/documents", data);
    setForm({ title: "", classId: form.classId });
    setFile(null);
    await refreshDocs();
  }
  return <div className="space-y-5"><Tabs tabs={["Notes", "Important Questions", "Notices"]} active={uploadTab} setActive={setUploadTab} /><Tabs tabs={["Current", "History", "Edit"]} active={mode} setActive={setMode} />{mode === "Current" && <form onSubmit={submit} className="max-w-3xl rounded-lg border border-blue-100 bg-white p-5 shadow-soft"><div className="grid gap-3 md:grid-cols-2"><select required value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3"><option value="">Select assigned class</option>{activeClasses.map((item) => <option key={item.id} value={item.id}>{item.branch} Y{item.year} {item.section} - {item.subject_name}</option>)}</select><input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3" /></div><input type="file" onChange={(e) => setFile(e.target.files?.[0])} className="mt-3 w-full rounded-lg border border-dashed border-blue-200 px-3 py-4" /><button className="mt-4 rounded-lg bg-gradient-to-r from-sweety-blue to-sweety-sky px-4 py-3 font-semibold text-white">Upload</button></form>}{mode !== "Current" && <div className="space-y-4"><label className="flex max-w-xl items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 shadow-sm"><Search size={16} className="text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search uploads" className="w-full bg-transparent text-sm outline-none" /></label>{docs.length === 0 && <div className="rounded-lg border border-blue-100 bg-white p-6 text-sm text-gray-500 shadow-soft">No Notes</div>}<div className="grid gap-3 md:grid-cols-2">{docs.map((doc) => <div key={doc.id} className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm"><p className="font-semibold">{doc.title}</p><p className="text-sm text-gray-500">{doc.type} - {doc.branch} Y{doc.year} {doc.section}</p><p className="mt-2 text-xs text-gray-400">{new Date(doc.created_at).toLocaleString()}</p></div>)}</div></div>}</div>;
}

function EventCreator({ classes }) {
  const activeClasses = classes.filter((item) => item.status === "active");
  const [form, setForm] = useState({ title: "", description: "", eventDate: "", eventTime: "", venue: "", registrationLink: "", classId: "" });
  const [mode, setMode] = useState("Upcoming");
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  async function refreshEvents() {
    const { data } = await api.get("/events");
    setEvents(data || []);
  }
  useEffect(() => { refreshEvents(); }, []);
  async function submit(event) {
    event.preventDefault();
    const selected = activeClasses.find((item) => String(item.id) === String(form.classId));
    if (!selected) return;
    await api.post("/events", { ...form, branch: selected.branch, year: selected.year, section: selected.section });
    setForm({ title: "", description: "", eventDate: "", eventTime: "", venue: "", registrationLink: "", classId: form.classId });
    await refreshEvents();
  }
  const today = new Date().toISOString().slice(0, 10);
  const visible = events.filter((event) => (mode === "Past" ? event.event_date < today : true)).filter((event) => `${event.title} ${event.event_date} ${event.venue}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-5"><Tabs tabs={["Upcoming", "Past", "Edit"]} active={mode} setActive={setMode} />{mode === "Upcoming" && <form onSubmit={submit} className="max-w-3xl rounded-lg border border-blue-100 bg-white p-5 shadow-soft"><h3 className="text-lg font-semibold">Create Event</h3><div className="mt-4 grid gap-3 md:grid-cols-2"><select required value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3 md:col-span-2"><option value="">Select assigned class</option>{activeClasses.map((item) => <option key={item.id} value={item.id}>{item.branch} Y{item.year} {item.section} - {item.subject_name}</option>)}</select><input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3" /><input type="date" required value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3" /><input type="time" value={form.eventTime} onChange={(e) => setForm({ ...form, eventTime: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3" /><input placeholder="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3" /><input placeholder="Registration link" value={form.registrationLink} onChange={(e) => setForm({ ...form, registrationLink: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3" /><input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3" /></div><button className="mt-4 rounded-lg bg-gradient-to-r from-sweety-blue to-sweety-sky px-4 py-3 font-semibold text-white">Create Event</button></form>}<label className="flex max-w-xl items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 shadow-sm"><Search size={16} className="text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title/date" className="w-full bg-transparent text-sm outline-none" /></label>{visible.length === 0 && <div className="rounded-lg border border-blue-100 bg-white p-6 text-sm text-gray-500 shadow-soft">No Events</div>}<div className="grid gap-3 md:grid-cols-2">{visible.map((event) => <div key={event.id} className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm"><p className="font-semibold">{event.title}</p><p className="text-sm text-gray-500">{event.event_date?.slice(0, 10)} {event.event_time || ""} - {event.venue}</p><p className="mt-2 text-sm text-gray-500">{event.description}</p></div>)}</div></div>;
}
