import { useEffect, useMemo, useState } from "react";
import { Bell, ClipboardCheck, Home, Map, UserRound, Users, X } from "lucide-react";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import NotificationsPage from "../components/NotificationsPage";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { REFRESH_EVENT, shouldRefresh } from "../utils/refresh";
import { pathToTab } from "../utils/dashboardRoutes";

const nav = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "hodRequests", label: "HOD Requests", icon: ClipboardCheck },
  { id: "hods", label: "HOD Management", icon: Users },
  { id: "faculty", label: "Faculty Management", icon: Users },
  { id: "students", label: "Student Management", icon: Users },
  { id: "mentors", label: "Assign Mentors", icon: UserRound },
  { id: "branches", label: "Branches", icon: Map },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "profile", label: "Profile", icon: UserRound }
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [active, setActive] = useState(() => pathToTab("admin"));
  const [overview, setOverview] = useState(null);
  const [hodRequests, setHodRequests] = useState([]);
  const [hods, setHods] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [toast, setToast] = useState("");

  async function refreshAll() {
    const [overviewRes, requestRes, hodRes, facultyRes, studentRes, mentorRes] = await Promise.all([
      api.get("/dashboard/admin"),
      api.get("/management/hod-requests"),
      api.get("/management/users/hod"),
      api.get("/management/users/faculty"),
      api.get("/management/users/student"),
      api.get("/management/mentors").catch(() => ({ data: [] }))
    ]);
    setOverview(overviewRes.data);
    setHodRequests(requestRes.data || []);
    setHods(hodRes.data || []);
    setFaculty(facultyRes.data || []);
    setStudents(studentRes.data || []);
    setMentors(mentorRes.data || []);
  }

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    const onPath = () => setActive(pathToTab("admin"));
    window.addEventListener("popstate", onPath);
    return () => window.removeEventListener("popstate", onPath);
  }, []);

  useEffect(() => {
    const onRefresh = (event) => {
      if (shouldRefresh(event, ["dashboard", "requests", "notifications", "auth"])) refreshAll();
    };
    window.addEventListener(REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(REFRESH_EVENT, onRefresh);
  }, []);

  async function reviewHod(id, status) {
    const { data } = await api.put(`/management/hod-requests/${id}/review`, { status });
    setToast(data.message);
    await refreshAll();
  }

  async function reviewUser(id, status) {
    const { data } = await api.put(`/management/users/${id}/review`, { status });
    setToast(data.message);
    await refreshAll();
  }

  return (
    <Layout title="Admin Dashboard" subtitle="System-wide approvals, users and management" navItems={nav} active={active} setActive={setActive}>
      {toast && <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{toast}</div>}
      {active === "overview" && (
        <Overview
          overview={overview}
          hodRequests={hodRequests}
          faculty={faculty}
          students={students}
          reviewHod={reviewHod}
          reviewUser={reviewUser}
        />
      )}
      {active === "hodRequests" && <HodRequests requests={hodRequests} review={reviewHod} />}
      {active === "hods" && <UsersTable title="HODs" rows={hods} />}
      {active === "faculty" && <UsersTable title="Faculty" rows={faculty} />}
      {active === "students" && <UsersTable title="Students" rows={students} />}
      {active === "mentors" && <AdminMentors faculty={faculty} students={students} mentors={mentors} refresh={refreshAll} />}
      {active === "branches" && <Branches rows={[...hods, ...faculty, ...students]} />}
      {active === "notifications" && <NotificationsPage />}
      {active === "profile" && (
        <div className="app-card p-6">
          <h3 className="text-xl font-semibold dark:text-white">{user.name}</h3>
          <p className="mt-2 text-muted">{user.email} - Admin</p>
        </div>
      )}
    </Layout>
  );
}

function Overview({ overview, hodRequests, faculty, students, reviewHod, reviewUser }) {
  const [panel, setPanel] = useState(null);

  const pendingHods = useMemo(() => hodRequests.filter((item) => item.status === "pending"), [hodRequests]);
  const pendingFaculty = useMemo(() => faculty.filter((item) => item.approval_status === "pending"), [faculty]);
  const pendingStudents = useMemo(() => students.filter((item) => item.approval_status === "pending"), [students]);

  const panelConfig = {
    pendingHods: { title: "Pending HOD Requests", items: pendingHods, kind: "hod" },
    pendingFaculty: { title: "Pending Faculty Approvals", items: pendingFaculty, kind: "user" },
    pendingStudents: { title: "Pending Student Approvals", items: pendingStudents, kind: "user" }
  };

  const activePanel = panel ? panelConfig[panel] : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total HODs" value={overview?.totalHods || 0} icon={Users} />
        <StatCard
          title="Pending HODs"
          value={overview?.pendingHods || 0}
          icon={ClipboardCheck}
          onClick={() => setPanel(panel === "pendingHods" ? null : "pendingHods")}
          active={panel === "pendingHods"}
        />
        <StatCard title="Total Faculty" value={overview?.totalFaculty || 0} icon={Users} />
        <StatCard
          title="Pending Faculty"
          value={overview?.pendingFaculty || 0}
          icon={ClipboardCheck}
          onClick={() => setPanel(panel === "pendingFaculty" ? null : "pendingFaculty")}
          active={panel === "pendingFaculty"}
        />
        <StatCard title="Total Students" value={overview?.totalStudents || 0} icon={Users} />
        <StatCard
          title="Pending Students"
          value={overview?.pendingStudents || 0}
          icon={ClipboardCheck}
          onClick={() => setPanel(panel === "pendingStudents" ? null : "pendingStudents")}
          active={panel === "pendingStudents"}
        />
        <StatCard title="Total Branches" value={overview?.totalBranches || 0} icon={Map} />
      </div>

      {activePanel && (
        <PendingPanel
          title={activePanel.title}
          items={activePanel.items}
          kind={activePanel.kind}
          onClose={() => setPanel(null)}
          reviewHod={reviewHod}
          reviewUser={reviewUser}
        />
      )}
    </div>
  );
}

function PendingPanel({ title, items, kind, onClose, reviewHod, reviewUser }) {
  return (
    <div className="app-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold dark:text-white">
          {title} ({items.length})
        </h3>
        <button type="button" onClick={onClose} className="app-btn-secondary inline-flex items-center gap-1 px-3 py-2 text-sm">
          <X size={16} />
          Close
        </button>
      </div>
      {items.length === 0 && <p className="text-sm text-muted">No pending items.</p>}
      <div className="grid gap-4 xl:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-semibold dark:text-white">{item.name}</h4>
                <p className="text-sm text-muted">{item.email}</p>
                {item.roll_number && <p className="text-sm text-muted">Roll: {item.roll_number}</p>}
                {item.faculty_id && <p className="text-sm text-muted">Faculty ID: {item.faculty_id}</p>}
                <p className="mt-2 text-sm text-muted">
                  {item.branch}
                  {item.year ? ` · Year ${item.year}` : ""}
                  {item.section ? ` · Section ${item.section}` : ""}
                </p>
                {(item.mobile || item.phone) && <p className="text-sm text-muted">{item.mobile || item.phone}</p>}
              </div>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sweety-blue dark:bg-blue-950/50 dark:text-sky-200">
                pending
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => (kind === "hod" ? reviewHod(item.id, "approved") : reviewUser(item.id, "approved"))}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => (kind === "hod" ? reviewHod(item.id, "rejected") : reviewUser(item.id, "rejected"))}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => (kind === "hod" ? reviewHod(item.id, "blocked") : reviewUser(item.id, "blocked"))}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
              >
                Block
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HodRequests({ requests, review }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {requests.map((request) => (
        <div key={request.id} className="app-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold dark:text-white">{request.name}</h3>
              <p className="text-sm text-muted">
                {request.email} - {request.mobile || request.phone}
              </p>
              <p className="mt-2 text-sm text-muted">{request.branch}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                request.status === "approved"
                  ? "bg-emerald-50 text-emerald-700"
                  : request.status === "pending"
                    ? "bg-sky-50 text-sweety-blue"
                    : "bg-red-50 text-red-700"
              }`}
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

function UsersTable({ title, rows }) {
  return (
    <div className="app-card overflow-hidden">
      <div className="border-b border-blue-50 p-4 font-semibold dark:border-slate-800 dark:text-white">{title}</div>
      <table className="w-full text-left text-sm">
        <thead className="bg-sky-50 text-gray-500 dark:bg-slate-800 dark:text-slate-300">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">ID</th>
            <th className="p-3">Branch</th>
            <th className="p-3">Status</th>
            <th className="p-3">Contact</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id} className="border-t border-blue-50 dark:border-slate-800">
              <td className="p-3 font-medium dark:text-white">{item.name}</td>
              <td className="p-3 text-muted">{item.roll_number || item.faculty_id || item.id}</td>
              <td className="p-3 text-muted">{item.branch || "-"}</td>
              <td className="p-3 text-muted">{item.approval_status}</td>
              <td className="p-3 text-muted">
                {item.email}
                <br />
                {item.mobile || item.phone}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminMentors({ faculty, students, mentors, refresh }) {
  const branchOptions = [...new Set([...faculty, ...students].map((item) => item.branch).filter(Boolean))];
  const [form, setForm] = useState({ facultyId: "", branch: branchOptions[0] || "", year: "2", section: "A", startRoll: "", endRoll: "" });
  const branchFaculty = faculty.filter((item) => item.branch === form.branch && item.approval_status === "approved");
  useEffect(() => {
    if (!form.branch && branchOptions[0]) setForm((current) => ({ ...current, branch: branchOptions[0] }));
  }, [branchOptions.join("|")]);
  async function submit(event) {
    event.preventDefault();
    await api.post("/management/mentors", form);
    await refresh();
  }
  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="app-card p-5">
        <h3 className="font-semibold dark:text-white">Assign Mentors</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <select required value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value, facultyId: "" })} className="rounded-lg border border-blue-100 px-3 py-3 dark:border-slate-700">
            <option value="">Branch</option>
            {branchOptions.map((branch) => (
              <option key={branch}>{branch}</option>
            ))}
          </select>
          <select required value={form.facultyId} onChange={(e) => setForm({ ...form, facultyId: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3 dark:border-slate-700">
            <option value="">Faculty</option>
            {branchFaculty.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3 dark:border-slate-700">
            {[1, 2, 3, 4].map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>
          <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="rounded-lg border border-blue-100 px-3 py-3 dark:border-slate-700">
            {["A", "B", "C", "D"].map((section) => (
              <option key={section}>{section}</option>
            ))}
          </select>
          <input required value={form.startRoll} onChange={(e) => setForm({ ...form, startRoll: e.target.value })} placeholder="Start roll" className="rounded-lg border border-blue-100 px-3 py-3 dark:border-slate-700" />
          <input required value={form.endRoll} onChange={(e) => setForm({ ...form, endRoll: e.target.value })} placeholder="End roll" className="rounded-lg border border-blue-100 px-3 py-3 dark:border-slate-700" />
          <button className="rounded-lg bg-sweety-blue px-4 py-3 font-semibold text-white">Assign Range</button>
        </div>
      </form>
      <MentorCards mentors={mentors} />
    </div>
  );
}

function MentorCards({ mentors }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {mentors.length === 0 && <div className="app-card p-6 text-sm text-muted">No Mentors</div>}
      {mentors.map((item) => (
        <div key={`${item.assignment_type}-${item.id}`} className="app-card p-4">
          <p className="font-semibold dark:text-white">
            {item.faculty_name} ({item.faculty_id})
          </p>
          <p className="text-sm text-muted">
            {item.branch} Year {item.year} Section {item.section}
          </p>
          {item.assignment_type === "range" ? (
            <div className="mt-3 overflow-hidden rounded-lg border border-blue-50 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-sky-50 text-gray-500 dark:bg-slate-800">
                  <tr>
                    <th className="p-2">Roll</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {(item.students || []).map((student) => (
                    <tr key={student.id} className="border-t border-blue-50 dark:border-slate-800">
                      <td className="p-2">{student.roll_number}</td>
                      <td className="p-2">{student.name}</td>
                      <td className="p-2">{student.year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">
              {item.roll_number} - {item.student_name} - Year {item.year}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function Branches({ rows }) {
  const branches = [...new Set(rows.map((item) => item.branch).filter(Boolean))];
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {branches.map((branch) => (
        <div key={branch} className="app-card p-4">
          <p className="font-semibold dark:text-white">{branch}</p>
          <p className="text-sm text-muted">{rows.filter((item) => item.branch === branch).length} users</p>
        </div>
      ))}
    </div>
  );
}
